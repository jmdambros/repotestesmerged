"""
Rotas FastAPI da análise preliminar, chat e peças. Montadas por `criar_router(...)` no
backend/main.py. Segue as regras do contrato de API:

- o `user_id` vem do corpo/query SOMENTE porque quem chama é o servidor Next, que o lê do
  cookie assinado (mesma confiança das rotas /caso e /salvar-transcricao);
- caso de outro usuário ou sem transcrição responde 404, igual a caso inexistente;
- a chave da IA fica no servidor (env), nunca no navegador.

Os SDKs/HTTP de IA são bloqueantes: rodam em thread pool (run_in_threadpool).
"""
from __future__ import annotations

from typing import Awaitable, Callable, Optional

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from . import storage
from .analysis import run_case_analysis, run_chat_turn, run_document_draft
from .docx_builder import build_docx, resolve_download
from .llm_providers import LLMError, provider_do_servidor
from .mapeador import mensagem_front, para_analise_front

# (user_id, caso_id) -> texto da transcrição, ou None se o caso não existe para esse usuário.
BuscarTranscricao = Callable[[str, str], Awaitable[Optional[str]]]


class AnaliseIn(BaseModel):
    user_id: str
    instrucao: Optional[str] = None
    # Só usado quando o MongoDB não está configurado (modo arquivo local de desenvolvimento).
    transcricao_texto: Optional[str] = None
    usar_busca_web: bool = True


class ChatIn(BaseModel):
    user_id: str
    mensagem: str
    usar_busca_web: bool = True


class PecaIn(BaseModel):
    user_id: str
    tipo_peca: str
    instrucoes_extra: Optional[str] = None


def _erro(msg: str, status: int) -> JSONResponse:
    return JSONResponse({"erro": msg}, status_code=status)


def criar_router(buscar_transcricao: BuscarTranscricao, mongo_ativo: Callable[[], bool]) -> APIRouter:
    router = APIRouter(tags=["analise"])
    storage.init_db()

    async def _transcricao(user_id: str, caso_id: str, fallback: Optional[str] = None) -> Optional[str]:
        texto = await buscar_transcricao(user_id.strip(), caso_id.strip())
        if texto is None and not mongo_ativo() and fallback:
            texto = fallback
        return (texto or "").strip() or None

    @router.post("/analise/{caso_id}")
    async def solicitar_analise(caso_id: str, body: AnaliseIn):
        user_id = body.user_id.strip()
        if not user_id:
            return _erro("Informe o usuário.", 400)
        transcricao = await _transcricao(user_id, caso_id, body.transcricao_texto)
        if not transcricao:
            return _erro("Caso não encontrado ou sem transcrição.", 404)
        anterior = storage.ultima_analise(user_id, caso_id)
        try:
            provider = provider_do_servidor()
            analise = await run_in_threadpool(
                run_case_analysis, provider, transcricao, "", body.usar_busca_web,
                body.instrucao, anterior["analise"] if anterior else None)
        except LLMError as e:
            return _erro(str(e), 502)
        registro = storage.salvar_analise(user_id, caso_id, analise, body.instrucao, [])
        return {"analise": para_analise_front(registro, caso_id)}

    @router.get("/analise/{caso_id}")
    async def obter_analises(caso_id: str, user_id: str = ""):
        user_id = user_id.strip()
        if not user_id:
            return _erro("Informe o usuário.", 400)
        versoes = storage.listar_analises(user_id, caso_id)
        mapeadas = [para_analise_front(v, caso_id) for v in versoes]
        return {"analise": mapeadas[0] if mapeadas else None, "versoes": mapeadas}

    @router.get("/chat/{caso_id}")
    async def listar_mensagens(caso_id: str, user_id: str = ""):
        user_id = user_id.strip()
        if not user_id:
            return _erro("Informe o usuário.", 400)
        return {"mensagens": [mensagem_front(m) for m in storage.listar_mensagens(user_id, caso_id)]}

    @router.post("/chat/{caso_id}")
    async def enviar_mensagem(caso_id: str, body: ChatIn):
        user_id, mensagem = body.user_id.strip(), body.mensagem.strip()
        if not user_id:
            return _erro("Informe o usuário.", 400)
        if not mensagem:
            return _erro("Digite uma mensagem.", 400)
        ultima = storage.ultima_analise(user_id, caso_id)
        if not ultima:
            return _erro("Caso não encontrado ou ainda sem análise.", 404)
        historico = storage.listar_mensagens(user_id, caso_id)
        try:
            provider = provider_do_servidor()
            resposta = await run_in_threadpool(
                run_chat_turn, provider, ultima["analise"],
                [{"role": m["papel"], "content": m["conteudo"]} for m in historico],
                mensagem, "", body.usar_busca_web)
        except LLMError as e:
            return _erro(str(e), 502)
        novas = storage.adicionar_mensagens(user_id, caso_id, [("user", mensagem), ("assistant", resposta)])
        return {"mensagens": [mensagem_front(m) for m in novas]}

    @router.post("/gerar-peca/{caso_id}")
    async def gerar_peca(caso_id: str, body: PecaIn):
        user_id, tipo = body.user_id.strip(), body.tipo_peca.strip()
        if not user_id:
            return _erro("Informe o usuário.", 400)
        if not tipo:
            return _erro("Informe o tipo de peça (ex.: 'petição inicial').", 400)
        ultima = storage.ultima_analise(user_id, caso_id)
        if not ultima:
            return _erro("Caso não encontrado ou ainda sem análise.", 404)
        try:
            provider = provider_do_servidor()
            rascunho = await run_in_threadpool(
                run_document_draft, provider, ultima["analise"], tipo, body.instrucoes_extra)
        except LLMError as e:
            return _erro(str(e), 502)
        arquivo = build_docx(rascunho, tipo)
        return {"rascunho": rascunho, "arquivo": arquivo,
                "aviso": "Minuta gerada por IA — revise antes de protocolar."}

    @router.get("/gerar-peca/download/{filename}")
    async def baixar_peca(filename: str):
        caminho = resolve_download(filename)
        if caminho is None:
            return _erro("Arquivo não encontrado.", 404)
        return FileResponse(
            caminho, filename="minuta_sophia.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    return router
