"""
Sophia — API (cadastro, transcrição, análise preliminar e chat).
O modelo Whisper só é carregado na primeira transcrição, para o cadastro
funcionar sem esperar o download/carga do modelo.
"""

import asyncio
import io
import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import httpx
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from analise.router import criar_router as criar_router_analise

PASTA_BACK = Path(__file__).resolve().parent
# override: o .env do backend vale mesmo se a variável já chegou vazia no processo.
load_dotenv(PASTA_BACK / ".env", override=True)
load_dotenv(PASTA_BACK.parent / ".env.local")
load_dotenv(PASTA_BACK.parent / ".env")

app = FastAPI(title="Sophia — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URI = os.getenv("MONGODB_URI")
mongo_client = AsyncIOMotorClient(MONGODB_URI) if MONGODB_URI else None
mongo_db = mongo_client["sophia-data"] if mongo_client else None
users_collection = mongo_db["users"] if mongo_db is not None else None
case_collection = mongo_db["case"] if mongo_db is not None else None
assinaturas_collection = mongo_db["assinaturas"] if mongo_db is not None else None
USERS_FILE = PASTA_BACK / "data" / "users.json"
ASSINATURAS_FILE = PASTA_BACK / "data" / "assinaturas.json"
FUSO = timezone(timedelta(hours=-3))


def agora_iso() -> str:
    # Horário de Brasília em formato limpo (ex.: 2026-10-20T17:25:00).
    return datetime.now(FUSO).strftime("%Y-%m-%dT%H:%M:%S")

MODEL_SIZE = "small"
_whisper = None
OVERLAP_SECONDS = 1.0
SALVAR_AUDIO_DEBUG = False
PASTA_DEBUG = str(PASTA_BACK / "debug_audio")


def _garantir_compat_av() -> None:
    """Versões novas do PyAV (av>=16) removeram o argumento ``metadata_errors``
    de ``av.open``, mas o faster-whisper ainda o envia ao decodificar o áudio.
    Envolvemos ``av.open`` para descartar esse argumento quando ele não existir,
    evitando o erro 500 na transcrição."""
    import av

    if getattr(av.open, "_sophia_compat", False):
        return

    _open_original = av.open

    def open_compat(*args, **kwargs):
        try:
            return _open_original(*args, **kwargs)
        except TypeError:
            kwargs.pop("metadata_errors", None)
            return _open_original(*args, **kwargs)

    open_compat._sophia_compat = True
    av.open = open_compat


def obter_whisper():
    """Carrega o modelo só quando alguém transcreve — o cadastro não depende disso."""
    global _whisper
    if _whisper is None:
        _garantir_compat_av()
        from faster_whisper import WhisperModel

        _whisper = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _whisper


def transcrever_bloco(audio_bytes: bytes) -> str:
    if SALVAR_AUDIO_DEBUG:
        os.makedirs(PASTA_DEBUG, exist_ok=True)
        nome_arquivo = os.path.join(PASTA_DEBUG, f"bloco_{time.time():.0f}.wav")
        with open(nome_arquivo, "wb") as f:
            f.write(audio_bytes)
        print(f"[debug] áudio salvo em: {nome_arquivo}")

    audio_buffer = io.BytesIO(audio_bytes)
    segments, info = obter_whisper().transcribe(
        audio_buffer,
        language="pt",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        word_timestamps=True,
    )
    segments = list(segments)

    palavras = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            if w.start >= OVERLAP_SECONDS - 0.05:
                palavras.append(w.word)

    texto = "".join(palavras).strip()
    print(
        f"[debug] bytes_recebidos={len(audio_bytes)} "
        f"duracao_audio={info.duration:.2f}s "
        f"idioma_detectado={info.language} "
        f"confianca_idioma={info.language_probability:.2f} "
        f"n_segmentos={len(segments)} "
        f"texto={texto!r}"
    )
    return texto


def transcrever_audio_completo_sync(audio_bytes: bytes) -> str:
    if SALVAR_AUDIO_DEBUG:
        os.makedirs(PASTA_DEBUG, exist_ok=True)
        nome_arquivo = os.path.join(PASTA_DEBUG, f"completo_{time.time():.0f}.webm")
        with open(nome_arquivo, "wb") as f:
            f.write(audio_bytes)
        print(f"[debug] áudio completo salvo em: {nome_arquivo}")

    audio_buffer = io.BytesIO(audio_bytes)
    segments, info = obter_whisper().transcribe(
        audio_buffer,
        language="pt",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )
    segments = list(segments)
    texto = " ".join(seg.text.strip() for seg in segments).strip()
    print(
        f"[debug] TRANSCRIÇÃO COMPLETA: "
        f"duracao_audio={info.duration:.2f}s "
        f"idioma_detectado={info.language} "
        f"n_segmentos={len(segments)} "
        f"tamanho_texto={len(texto)} caracteres"
    )
    return texto


@app.get("/")
async def raiz():
    return {"servico": "Sophia API", "health": "/health", "docs": "/docs"}


@app.get("/health")
async def health():
    mongo_status = "arquivo local (cole a MONGODB_URI do Atlas em backend/.env)"
    if mongo_client is not None:
        try:
            await mongo_client.admin.command("ping")
            mongo_status = "conectado"
        except Exception as exc:  # noqa: BLE001
            mongo_status = f"erro: {exc}"

    return {
        "status": "ok",
        "mongodb": mongo_status,
        "whisper": "pronto" if _whisper is not None else "ainda não carregado",
        "groq": "configurada" if os.getenv("GROQ_API_KEY", "").strip() else "ausente",
    }


@app.post("/transcribe")
async def transcrever_audio_completo(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    texto = await asyncio.to_thread(transcrever_audio_completo_sync, audio_bytes)
    return {"text": texto}


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"

PROMPT_REVISAO = """Você está revisando a transcrição de uma entrevista jurídica \
entre um advogado e seu cliente, gerada por um sistema de reconhecimento de voz.

Sua única tarefa é corrigir erros PROVÁVEIS DE TRANSCRIÇÃO — palavras que soam \
parecido foneticamente com o que provavelmente foi dito, mas que não fazem \
sentido no contexto (ex: "tese de dano moral" transcrito errado como "tese \
de dano mural").

Regras estritas:
- NÃO resuma, NÃO reescreva o estilo, NÃO corrija gramática coloquial normal \
de fala.
- NÃO adicione informação nenhuma que não esteja no texto original.
- NÃO remova nada, mesmo que pareça irrelevante.
- Se não tiver certeza se algo é erro de transcrição, MANTENHA como está \
(prefira não mexer a inventar uma correção errada).
- Responda APENAS com o texto corrigido, sem comentários, sem explicações, \
sem aspas ao redor.

Texto a revisar:
"""


class RevisarTextoRequest(BaseModel):
    texto: str
    groq_api_key: str = ""


class CadastroRequest(BaseModel):
    nome: str
    email: str
    senha: str


class EntrarRequest(BaseModel):
    email: str
    senha: str


class CartaoAssinatura(BaseModel):
    brand: str = ""
    last4: str = ""
    expiry: str = ""
    holder_name: str = ""


class TrocaPlanoRequest(BaseModel):
    # user_id vem do cookie assinado, lido pela rota /api/assinatura/plano do Next.
    user_id: str
    plan_id: str


class AssinaturaRequest(BaseModel):
    # user_id vem do cookie assinado, lido pela rota /api/assinatura do Next.
    user_id: str
    plan_id: str
    card: CartaoAssinatura


# Valores em centavos. O preço é sempre calculado aqui, nunca aceito do front.
PRECO_PLATAFORMA = 15000
PRECO_PLANOS = {"basico": 10000, "intermediario": 25000, "pro": 60000}
NOME_PLANOS = {"basico": "Básico", "intermediario": "Intermediário", "pro": "Pro"}


@app.post("/revisar-transcricao")
async def revisar_transcricao(payload: RevisarTextoRequest):
    if not payload.texto.strip():
        return {"texto_revisado": payload.texto}

    chave = payload.groq_api_key.strip() or os.getenv("GROQ_API_KEY", "")
    if not chave:
        return {
            "erro": (
                "Nenhuma chave da Groq informada (nem no pedido, "
                "nem em GROQ_API_KEY no .env do backend)."
            )
        }

    headers = {
        "Authorization": f"Bearer {chave}",
        "Content-Type": "application/json",
    }
    body = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": PROMPT_REVISAO},
            {"role": "user", "content": payload.texto},
        ],
        "temperature": 0.0,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resposta = await client.post(GROQ_API_URL, headers=headers, json=body)

    if resposta.status_code != 200:
        return {
            "erro": f"Groq retornou status {resposta.status_code}: {resposta.text}"
        }

    dados = resposta.json()
    texto_revisado = dados["choices"][0]["message"]["content"].strip()
    return {"texto_revisado": texto_revisado}


def usuario_publico(documento: dict) -> dict:
    return {
        "_id": documento["_id"],
        "name": documento.get("name") or "",
        "email": documento.get("email") or "",
        # Contas sem o campo ainda não pagaram a assinatura.
        "account_status": documento.get("account_status") or "pagamento_pendente",
        "created_at": documento.get("created_at") or "",
        "subscription": _resumo_assinatura_publico(documento.get("subscription")),
    }


def _resumo_assinatura_publico(resumo: dict | None) -> dict | None:
    """Plano e cartão para exibir na conta; o valor fica de fora de propósito."""
    if not resumo:
        return None
    return {
        "plan_id": resumo.get("plan_id") or "",
        "plan_name": resumo.get("plan_name") or "",
        "card": resumo.get("card") or {},
    }


def _ler_users_arquivo() -> list[dict]:
    if not USERS_FILE.exists():
        return []
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))


def _gravar_users_arquivo(lista: list[dict]) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(lista, indent=2, ensure_ascii=False), encoding="utf-8")


@app.post("/cadastro")
async def cadastro(payload: CadastroRequest):
    """Cria um documento na collection users (UUID, email, bcrypt, created_at)."""
    nome = payload.nome.strip()
    email = payload.email.strip().lower()
    senha = payload.senha
    if not nome:
        return JSONResponse({"erro": "Informe o nome completo."}, status_code=400)
    if not email or "@" not in email:
        return JSONResponse({"erro": "Informe um email válido."}, status_code=400)
    if len(senha) < 8:
        return JSONResponse(
            {"erro": "A senha deve ter pelo menos 8 caracteres."},
            status_code=400,
        )

    if users_collection is not None:
        existente = await users_collection.find_one({"email": email})
    else:
        existente = next((u for u in _ler_users_arquivo() if u.get("email") == email), None)
    if existente:
        return JSONResponse({"erro": "Já existe uma conta com este email."}, status_code=400)

    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    documento = {
        "_id": user_id,
        "name": nome,
        "email": email,
        "password_hash": password_hash,
        "created_at": agora_iso(),
    }
    try:
        if users_collection is not None:
            await users_collection.create_index("email", unique=True)
            await users_collection.insert_one(documento)
        else:
            lista = _ler_users_arquivo()
            lista.append(documento)
            _gravar_users_arquivo(lista)
    except Exception as exc:  # noqa: BLE001
        if "duplicate" in str(exc).lower():
            return JSONResponse({"erro": "Já existe uma conta com este email."}, status_code=400)
        return JSONResponse({"erro": str(exc)}, status_code=500)

    return {"usuario": {"_id": user_id, "name": nome, "email": email}}


@app.post("/entrar")
async def entrar(payload: EntrarRequest):
    email = payload.email.strip().lower()
    senha = payload.senha
    if not email or not senha:
        return JSONResponse({"erro": "Informe email e senha."}, status_code=400)

    if users_collection is not None:
        documento = await users_collection.find_one({"email": email})
    else:
        documento = next((u for u in _ler_users_arquivo() if u.get("email") == email), None)

    if not documento:
        return JSONResponse({"erro": "Email ou senha inválidos."}, status_code=401)

    hash_salvo = (documento.get("password_hash") or "").encode("utf-8")
    if not hash_salvo or not bcrypt.checkpw(senha.encode("utf-8"), hash_salvo):
        return JSONResponse({"erro": "Email ou senha inválidos."}, status_code=401)

    return {"usuario": usuario_publico(documento)}


async def _buscar_usuario(user_id: str) -> dict | None:
    if users_collection is not None:
        return await users_collection.find_one({"_id": user_id})
    return next((u for u in _ler_users_arquivo() if u.get("_id") == user_id), None)


@app.get("/usuario/{user_id}")
async def obter_usuario(user_id: str):
    """Dados públicos do usuário da sessão (o Next só chama com o id do cookie assinado)."""
    documento = await _buscar_usuario(user_id.strip())
    if not documento:
        return JSONResponse({"erro": "Usuário não encontrado."}, status_code=404)
    return {"usuario": usuario_publico(documento)}


@app.post("/assinatura")
async def assinar(payload: AssinaturaRequest):
    """Registra a assinatura do usuário e libera a conta (account_status = ativa)."""
    user_id = payload.user_id.strip()
    plano = payload.plan_id.strip()
    if plano not in PRECO_PLANOS:
        return JSONResponse({"erro": "Plano inválido."}, status_code=400)
    if not await _buscar_usuario(user_id):
        return JSONResponse({"erro": "Usuário não encontrado."}, status_code=404)

    agora = agora_iso()
    assinatura_id = str(uuid.uuid4())
    # Só o que pode aparecer no Mongo: bandeira, final, validade e nome.
    # Número completo, CVV e CPF não entram no documento.
    cartao = {
        "brand": payload.card.brand.strip() or "desconhecida",
        "last4": payload.card.last4[-4:],
        "expiry": payload.card.expiry.strip(),
        "holder_name": payload.card.holder_name.strip(),
    }
    documento = {
        "_id": assinatura_id,
        "user_id": user_id,
        "plan_id": plano,
        "plan_name": NOME_PLANOS[plano],
        "status": "ativa",
        "platform_amount": PRECO_PLATAFORMA,
        "plan_amount": PRECO_PLANOS[plano],
        "monthly_amount": PRECO_PLATAFORMA + PRECO_PLANOS[plano],
        "card": cartao,
        "created_at": agora,
    }
    assinatura_do_usuario = {
        "id": assinatura_id,
        "plan_id": plano,
        "plan_name": NOME_PLANOS[plano],
        "monthly_amount": documento["monthly_amount"],
        "card": {
            "brand": cartao["brand"],
            "last4": cartao["last4"],
            "expiry": cartao["expiry"],
        },
        "since": agora,
    }
    try:
        if users_collection is not None and assinaturas_collection is not None:
            await assinaturas_collection.create_index("user_id")
            await assinaturas_collection.insert_one(documento)
            await users_collection.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "account_status": "ativa",
                        "subscription": assinatura_do_usuario,
                        "updated_at": agora,
                    }
                },
            )
        else:
            lista = (
                json.loads(ASSINATURAS_FILE.read_text(encoding="utf-8"))
                if ASSINATURAS_FILE.exists()
                else []
            )
            lista.append(documento)
            ASSINATURAS_FILE.parent.mkdir(parents=True, exist_ok=True)
            ASSINATURAS_FILE.write_text(
                json.dumps(lista, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            usuarios = _ler_users_arquivo()
            for usuario in usuarios:
                if usuario.get("_id") == user_id:
                    usuario["account_status"] = "ativa"
                    usuario["subscription"] = assinatura_do_usuario
                    usuario["updated_at"] = agora
            _gravar_users_arquivo(usuarios)
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"erro": str(exc)}, status_code=500)

    return {"assinatura": documento}


@app.post("/assinatura/plano")
async def trocar_plano(payload: TrocaPlanoRequest):
    """Troca o plano da assinatura ativa do usuário, mantendo o cartão vinculado."""
    user_id = payload.user_id.strip()
    plano = payload.plan_id.strip()
    if plano not in PRECO_PLANOS:
        return JSONResponse({"erro": "Plano inválido."}, status_code=400)

    usuario = await _buscar_usuario(user_id)
    resumo = (usuario or {}).get("subscription")
    if not usuario or usuario.get("account_status") != "ativa" or not resumo:
        return JSONResponse({"erro": "Nenhuma assinatura ativa para alterar."}, status_code=409)
    if resumo.get("plan_id") == plano:
        return JSONResponse({"erro": "Esse já é o seu plano atual."}, status_code=400)

    agora = agora_iso()
    mudancas = {
        "plan_id": plano,
        "plan_name": NOME_PLANOS[plano],
        "plan_amount": PRECO_PLANOS[plano],
        "monthly_amount": PRECO_PLATAFORMA + PRECO_PLANOS[plano],
        "updated_at": agora,
    }
    novo_resumo = {
        **resumo,
        "plan_id": plano,
        "plan_name": NOME_PLANOS[plano],
        "monthly_amount": mudancas["monthly_amount"],
    }
    try:
        if users_collection is not None and assinaturas_collection is not None:
            # O filtro por user_id garante que só a assinatura do próprio usuário muda.
            await assinaturas_collection.update_one(
                {"_id": resumo["id"], "user_id": user_id}, {"$set": mudancas}
            )
            await users_collection.update_one(
                {"_id": user_id}, {"$set": {"subscription": novo_resumo, "updated_at": agora}}
            )
        else:
            lista = (
                json.loads(ASSINATURAS_FILE.read_text(encoding="utf-8"))
                if ASSINATURAS_FILE.exists()
                else []
            )
            for assinatura in lista:
                if assinatura.get("_id") == resumo["id"] and assinatura.get("user_id") == user_id:
                    assinatura.update(mudancas)
            ASSINATURAS_FILE.write_text(
                json.dumps(lista, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            usuarios = _ler_users_arquivo()
            for item in usuarios:
                if item.get("_id") == user_id:
                    item["subscription"] = novo_resumo
                    item["updated_at"] = agora
            _gravar_users_arquivo(usuarios)
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"erro": str(exc)}, status_code=500)

    return {"usuario": usuario_publico({**usuario, "subscription": novo_resumo})}


@app.get("/caso")
async def obter_caso(user_id: str = "", caso_id: str = ""):
    user_id = user_id.strip()
    caso_id = caso_id.strip()
    if not user_id or not caso_id:
        return JSONResponse({"erro": "Informe user_id e caso_id."}, status_code=400)
    if case_collection is None:
        return JSONResponse({"erro": "MongoDB não configurado."}, status_code=503)

    consulta_id = ObjectId(caso_id) if ObjectId.is_valid(caso_id) else caso_id
    # Aceita o _id do Mongo ou o caso_id da aplicação.
    documento = await case_collection.find_one(
        {"user_id": user_id, "$or": [{"_id": consulta_id}, {"caso_id": caso_id}]}
    )
    if not documento:
        return JSONResponse({"erro": "Caso não encontrado."}, status_code=404)

    documento["_id"] = str(documento["_id"])
    return documento


def _duracao_audio(valor) -> int | None:
    """Segundos do áudio enviado ou gravado. Ausente ou inválido não impede o salvamento."""
    if valor is None or isinstance(valor, bool):
        return None
    try:
        segundos = int(round(float(valor)))
    except (TypeError, ValueError):
        return None
    if segundos <= 0 or segundos > 360_000:
        return None
    return segundos


def _transcript(texto: str, momento: str, duracao_segundos: int | None) -> dict:
    transcricao = {"text": texto, "created_at": momento}
    if duracao_segundos is not None:
        transcricao["duration_seconds"] = duracao_segundos
    return transcricao


@app.post("/salvar-transcricao")
async def salvar_transcricao(payload: dict):
    """Cria um caso na collection case, com a transcrição embutida.

    O ``_id`` é o ObjectId gerado pelo Mongo. O documento fica com user_id,
    transcript, documents, created_at e updated_at.
    """
    texto = (payload.get("texto") or "").strip()
    user_id = (payload.get("user_id") or "").strip()
    caso_id = (payload.get("caso_id") or "").strip()
    duracao_segundos = _duracao_audio(payload.get("duracao_segundos"))
    if not texto:
        return {"erro": "Texto vazio, nada para salvar."}
    if not user_id:
        return JSONResponse(
            {"erro": "Informe o usuário para vincular a transcrição."},
            status_code=400,
        )

    agora = time.strftime("%Y-%m-%d_%H-%M-%S")
    momento = agora_iso()
    pasta_txt = PASTA_BACK / "transcricoes"
    os.makedirs(pasta_txt, exist_ok=True)
    nome_arquivo_txt = str(pasta_txt / f"transcricao_{agora}.txt")
    with open(nome_arquivo_txt, "w", encoding="utf-8") as f:
        f.write(texto)

    resultado = {"arquivo_txt": nome_arquivo_txt}

    if case_collection is not None:
        try:
            if caso_id:
                # Caso criado pela aplicação: o relato fica no próprio documento do caso.
                # Único por (usuário, caso) só onde há caso_id: documentos antigos da
                # coleção não têm o campo e, como duplicados de caso_id nulo, faziam a
                # criação do índice — e com ela todo salvamento — falhar.
                await case_collection.create_index(
                    [("user_id", 1), ("caso_id", 1)],
                    unique=True,
                    partialFilterExpression={"caso_id": {"$type": "string"}},
                )
                await case_collection.update_one(
                    {"user_id": user_id, "caso_id": caso_id},
                    {
                        "$set": {
                            "user_id": user_id,
                            "caso_id": caso_id,
                            "transcript": _transcript(texto, momento, duracao_segundos),
                            "updated_at": momento,
                        },
                        "$setOnInsert": {"created_at": momento, "documents": []},
                    },
                    upsert=True,
                )
                salvo = await case_collection.find_one({"user_id": user_id, "caso_id": caso_id})
                resultado["case_id"] = str(salvo["_id"]) if salvo else caso_id
            else:
                caso = {
                    "user_id": user_id,
                    "transcript": _transcript(texto, momento, duracao_segundos),
                    "documents": [],
                    "created_at": momento,
                    "updated_at": momento,
                }
                insercao = await case_collection.insert_one(caso)
                resultado["case_id"] = str(insercao.inserted_id)
        except Exception as exc:  # noqa: BLE001
            resultado["erro_mongo"] = str(exc)
    else:
        resultado["aviso"] = "MONGODB_URI não configurada — salvo só localmente em .txt."

    return resultado


async def transcricao_do_caso(user_id: str, caso_id: str) -> str | None:
    """Transcrição do caso do usuário (collection `case`). None = caso inexistente ou de outro dono."""
    if case_collection is None:
        return None
    consulta_id = ObjectId(caso_id) if ObjectId.is_valid(caso_id) else caso_id
    documento = await case_collection.find_one(
        {"user_id": user_id, "$or": [{"_id": consulta_id}, {"caso_id": caso_id}]}
    )
    if not documento:
        return None
    return ((documento.get("transcript") or {}).get("text") or "").strip()


# Análise preliminar, chat e peças (módulo `analise`). Banco de análises: SQLite local.
app.include_router(criar_router_analise(transcricao_do_caso, lambda: case_collection is not None))


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            if not audio_bytes:
                continue
            try:
                texto = await asyncio.to_thread(transcrever_bloco, audio_bytes)
            except Exception as exc:  # noqa: BLE001
                await websocket.send_json(
                    {"type": "error", "message": f"Falha ao transcrever: {exc}"}
                )
                continue
            if texto:
                await websocket.send_json(
                    {"type": "transcript", "text": texto, "is_final": True}
                )
    except WebSocketDisconnect:
        pass
