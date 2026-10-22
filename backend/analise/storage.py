"""
Persistência LOCAL (SQLite) das análises e do chat — provisória, até o banco de análises
ser estruturado. Toda leitura/escrita exige (user_id, caso_id): o isolamento por usuário
do contrato de API vale aqui também. A transcrição NÃO é copiada: a fonte de verdade é a
collection `case` do MongoDB (campo transcript.text).
"""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

DB_PATH = os.environ.get("SOPHIA_DB_PATH", "sophia_analises.db")
_FUSO = timezone(timedelta(hours=-3))


def _now() -> str:
    return datetime.now(_FUSO).strftime("%Y-%m-%dT%H:%M:%S")


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analises (
                user_id TEXT NOT NULL, caso_id TEXT NOT NULL, versao INTEGER NOT NULL,
                instrucao TEXT, analise_json TEXT NOT NULL, documentos_meta TEXT,
                gerada_em TEXT NOT NULL,
                PRIMARY KEY (user_id, caso_id, versao))""")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS mensagens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL, caso_id TEXT NOT NULL,
                papel TEXT NOT NULL, conteudo TEXT NOT NULL, criada_em TEXT NOT NULL)""")
        conn.execute("CREATE INDEX IF NOT EXISTS ix_msg ON mensagens (user_id, caso_id, id)")


def salvar_analise(user_id: str, caso_id: str, analise: Dict[str, Any],
                   instrucao: Optional[str], documentos_meta: List[Dict[str, Any]]) -> Dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT MAX(versao) AS v FROM analises WHERE user_id=? AND caso_id=?",
                           (user_id, caso_id)).fetchone()
        versao = (row["v"] or 0) + 1
        gerada_em = _now()
        conn.execute(
            "INSERT INTO analises VALUES (?,?,?,?,?,?,?)",
            (user_id, caso_id, versao, instrucao, json.dumps(analise, ensure_ascii=False),
             json.dumps(documentos_meta, ensure_ascii=False), gerada_em))
    return {"versao": versao, "gerada_em": gerada_em, "instrucao": instrucao,
            "analise": analise, "documentos_meta": documentos_meta}


def _linha(r: sqlite3.Row) -> Dict[str, Any]:
    return {"versao": r["versao"], "gerada_em": r["gerada_em"], "instrucao": r["instrucao"],
            "analise": json.loads(r["analise_json"]),
            "documentos_meta": json.loads(r["documentos_meta"] or "[]")}


def listar_analises(user_id: str, caso_id: str) -> List[Dict[str, Any]]:
    """Mais recente primeiro."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM analises WHERE user_id=? AND caso_id=? ORDER BY versao DESC",
            (user_id, caso_id)).fetchall()
    return [_linha(r) for r in rows]


def ultima_analise(user_id: str, caso_id: str) -> Optional[Dict[str, Any]]:
    versoes = listar_analises(user_id, caso_id)
    return versoes[0] if versoes else None


def listar_mensagens(user_id: str, caso_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM mensagens WHERE user_id=? AND caso_id=? ORDER BY id",
            (user_id, caso_id)).fetchall()
    return [{"id": f"m{r['id']}", "papel": r["papel"], "conteudo": r["conteudo"],
             "criada_em": r["criada_em"]} for r in rows]


def adicionar_mensagens(user_id: str, caso_id: str, itens: List[tuple]) -> List[Dict[str, Any]]:
    """itens: [(papel, conteudo)] gravados juntos; devolve só as novas."""
    ids = []
    with get_conn() as conn:
        agora = _now()
        for papel, conteudo in itens:
            cur = conn.execute(
                "INSERT INTO mensagens (user_id, caso_id, papel, conteudo, criada_em) VALUES (?,?,?,?,?)",
                (user_id, caso_id, papel, conteudo, agora))
            ids.append(cur.lastrowid)
    return [{"id": f"m{i}", "papel": p, "conteudo": c, "criada_em": agora}
            for i, (p, c) in zip(ids, itens)]


def apagar_caso(user_id: str, caso_id: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM analises WHERE user_id=? AND caso_id=?", (user_id, caso_id))
        conn.execute("DELETE FROM mensagens WHERE user_id=? AND caso_id=?", (user_id, caso_id))
