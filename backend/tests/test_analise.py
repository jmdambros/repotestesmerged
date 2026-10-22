"""Testes do módulo `analise` que não dependem de rede nem de FastAPI.
Rodar em backend/:  python -m unittest discover -s tests -v
"""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["SOPHIA_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["SOPHIA_OUTPUT_DIR"] = tempfile.mkdtemp()

from analise import analysis, docx_builder, mapeador, storage  # noqa: E402
from analise.llm_providers import BaseLLMProvider, LLMError, provider_do_servidor  # noqa: E402


class Falso(BaseLLMProvider):
    name, env_var, fallback_model = "falso", "X", "m"

    def __init__(self, saidas):
        super().__init__("k")
        self.saidas, self.chamadas, self.prompts = list(saidas), [], []

    def generate(self, system_prompt, user_prompt, use_web_search=True, json_mode=False):
        self.chamadas.append(json_mode)
        self.prompts.append(user_prompt)
        return self.saidas.pop(0)


BASE = {"resumo_caso": "Resumo.", "teses": [], "temas_stf_stj": [], "jurisprudencia": [],
        "perguntas_sugeridas": [], "necessidades_adicionais": []}


class Validacao(unittest.TestCase):
    def test_fonte_nao_verificada_com_numero_e_rejeitada_e_refeita(self):
        ruim = dict(BASE, jurisprudencia=[{"titulo": "t", "tribunal": "STJ", "processo": "REsp 1.234.567",
                                           "data": None, "resumo": "r", "status": "majoritaria",
                                           "fonte": "não verificado"}])
        bom = dict(BASE, jurisprudencia=[dict(ruim["jurisprudencia"][0], processo=None)])
        p = Falso([json.dumps(ruim), json.dumps(bom)])
        out = analysis.run_case_analysis(p, "relato", "")
        self.assertIsNone(out["jurisprudencia"][0]["processo"])
        self.assertIn("REJEITADA", p.prompts[1])
        self.assertEqual(p.chamadas, [True, True])

    def test_duas_rejeicoes_levantam_erro(self):
        ruim = dict(BASE, temas_stf_stj=[{"titulo": "Tema 1234 do STF", "descricao": "d",
                                          "relevancia": "alta", "fonte": "Não Verificado"}])
        with self.assertRaises(LLMError):
            analysis.run_case_analysis(Falso([json.dumps(ruim)] * 2), "relato", "")

    def test_chat_e_peca_nao_usam_json_mode(self):
        p = Falso(["ok", "ok"])
        analysis.run_chat_turn(p, BASE, [], "oi")
        analysis.run_document_draft(p, BASE, "petição inicial")
        self.assertEqual(p.chamadas, [False, False])

    def test_reanalise_inclui_anterior_e_instrucao(self):
        p = Falso([json.dumps(BASE)])
        analysis.run_case_analysis(p, "relato", "", instrucao="foque em dano moral", analise_anterior=BASE)
        self.assertIn("ANÁLISE ANTERIOR", p.prompts[0])
        self.assertIn("foque em dano moral", p.prompts[0])


class Mapeador(unittest.TestCase):
    def test_modelo_do_front(self):
        dados = dict(
            BASE,
            teses=[{"titulo": "Cláusula penal", "descricao": "d", "relevancia": "alta", "fonte": "não verificado"}],
            temas_stf_stj=[{"titulo": "Tema 975 do STJ", "descricao": "d", "relevancia": "media",
                            "fonte": "STJ, Tema 975, https://stj.jus.br/x."}],
            jurisprudencia=[{"titulo": "j", "tribunal": "TJRS", "processo": None, "data": "12/03/2021",
                             "resumo": "r", "status": "minoritaria_em_analise", "fonte": "TJRS, Ap. cível"}],
            perguntas_sugeridas=[{"pergunta": "Há laudo?", "objetivo": "provar o vício"}],
            necessidades_adicionais=[{"tipo": "possibilidade_de_acordo", "descricao": "d", "probabilidade": "alta"},
                                     {"tipo": "pericia", "descricao": "d", "probabilidade": None}])
        a = mapeador.para_analise_front({"versao": 2, "gerada_em": "2026-10-21T10:00:00",
                                         "instrucao": "x", "analise": dados}, "caso1")
        cats = [i["categoria"] for i in a["insights"]]
        self.assertEqual(cats, ["tese", "tema_superior", "jurisprudencia", "pergunta", "acordo", "necessidade"])
        self.assertEqual(a["insights"][0]["fontes"], [])  # sem fonte verificável -> vazio, nunca inventado
        self.assertEqual(a["insights"][1]["fontes"][0]["url"], "https://stj.jus.br/x")
        self.assertEqual(a["insights"][2]["fontes"][0]["data"], "2021-03-12")
        self.assertEqual(a["insights"][2]["posicaoJurisprudencial"], "em_analise")
        self.assertEqual(a["insights"][5]["relevancia"], "media")
        self.assertEqual((a["versao"], a["id"], a["demonstracao"], a["instrucao"]), (2, "caso1-analise-2", False, "x"))
        self.assertEqual(len({i["id"] for i in a["insights"]}), len(a["insights"]))


class Armazenamento(unittest.TestCase):
    def setUp(self):
        storage.init_db()

    def test_versoes_e_isolamento_por_usuario(self):
        v1 = storage.salvar_analise("A", "c1", BASE, None, [])
        v2 = storage.salvar_analise("A", "c1", BASE, "mais", [])
        self.assertEqual((v1["versao"], v2["versao"]), (1, 2))
        self.assertEqual(storage.ultima_analise("A", "c1")["versao"], 2)
        self.assertIsNone(storage.ultima_analise("B", "c1"))  # outro usuário não enxerga
        storage.adicionar_mensagens("A", "c1", [("user", "oi"), ("assistant", "olá")])
        self.assertEqual(storage.listar_mensagens("B", "c1"), [])
        self.assertEqual([m["papel"] for m in storage.listar_mensagens("A", "c1")], ["user", "assistant"])
        m = mapeador.mensagem_front(storage.listar_mensagens("A", "c1")[0])
        self.assertEqual(m["papel"], "advogado")


class Servidor(unittest.TestCase):
    def test_chave_so_no_servidor(self):
        for k in ("GROQ_API_KEY", "SOPHIA_LLM_PROVIDER"):
            os.environ.pop(k, None)
        with self.assertRaises(LLMError):
            provider_do_servidor()
        os.environ["GROQ_API_KEY"] = "gsk_x"
        self.assertEqual(provider_do_servidor().name, "groq")
        os.environ["SOPHIA_LLM_PROVIDER"] = "nada"
        with self.assertRaises(LLMError):
            provider_do_servidor()
        os.environ.pop("SOPHIA_LLM_PROVIDER")

    def test_download_sem_path_traversal(self):
        nome = docx_builder.build_docx("# DOS FATOS\ntexto", "inicial")
        self.assertIsNotNone(docx_builder.resolve_download(nome))
        self.assertIsNone(docx_builder.resolve_download("../../etc/passwd"))


if __name__ == "__main__":
    unittest.main()
