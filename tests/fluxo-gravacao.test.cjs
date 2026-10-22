/* eslint-disable @typescript-eslint/no-require-imports -- O loader de TypeScript destes testes usa CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};

const { criarMockFluxo } = require("../src/lib/api/mock/fluxo.ts");
const { destinoDoCaso } = require("../src/lib/casos/destino.ts");

function preparar(id = "novo-caso") {
  const caso = { id, titulo: "Caso de teste", cliente: "Teste", status: "gravacao_pendente", pasta: "ativo", atualizadoEm: "2026-01-01" };
  const api = criarMockFluxo({
    encontrarCaso: (atual) => atual === id ? caso : undefined,
    salvarCaso: (novo) => Object.assign(caso, novo),
    escopo: () => "usuario-teste",
  });
  return { caso, api };
}
const transcricao = [
  { id: "fala-1", tempo: "00:12", papel: "cliente", texto: "Relato da entrevista" },
  { id: "nota-1", tempo: "00:15", papel: "nota", texto: "Conferir documentos" },
];

test("finalizar salva as falas, gera analise e permite reabrir pela lista", async () => {
  const { caso, api } = preparar();
  assert.equal(destinoDoCaso(caso), "/casos/novo-caso/gravacao");
  assert.equal(
    destinoDoCaso(caso, "/casos/outro/repositorio"),
    "/casos/novo-caso/repositorio",
  );
  assert.equal(
    destinoDoCaso(caso, "/casos/outro/repositorio/analise"),
    "/casos/novo-caso/repositorio/analise",
  );
  assert.equal(
    destinoDoCaso(caso, "/casos/outro/repositorio/chat"),
    "/casos/novo-caso/repositorio/chat",
  );
  const atualizado = await api.finalizarSessao(caso.id, transcricao);
  const dados = await api.obterCaso(caso.id);
  assert.deepEqual(dados.transcricao, transcricao);
  assert.equal(atualizado.status, "em_analise");
  assert.equal(destinoDoCaso(caso), "/casos/novo-caso/gravacao");
  assert.equal(dados.analise.versao, 1);
  assert.equal(dados.versoesAnalise.length, 1);
  assert.equal(dados.analise.demonstracao, true);
  assert.deepEqual(dados.analise.insights, []);
  assert.match(dados.analise.resumo, /integracao/);
  dados.transcricao[0].texto = "alterado";
  atualizado.status = "concluido";
  assert.deepEqual((await api.obterCaso(caso.id)).transcricao, transcricao);
  assert.equal(caso.status, "em_analise");
});

test("caso demonstrativo preserva sugestoes e versoes anteriores", async () => {
  const { caso, api } = preparar("rescisao-silva");
  await api.finalizarSessao(caso.id, transcricao);
  const dados = await api.obterCaso(caso.id);
  assert.equal(dados.analise.insights.length, 17);
  assert.equal(dados.analise.versao, 2);
  assert.equal(dados.versoesAnalise[1].versao, 1);
});

test("rejeita caso inexistente e transcricao vazia sem mudar status", async () => {
  const { caso, api } = preparar();
  await assert.rejects(api.finalizarSessao("inexistente", transcricao), /nao encontrado/);
  await assert.rejects(api.finalizarSessao(caso.id, []), /vazia/);
  await assert.rejects(api.finalizarSessao(caso.id, [transcricao[1]]), /vazia/);
  assert.equal(caso.status, "gravacao_pendente");
  assert.equal((await api.obterCaso(caso.id)).analise, null);
});

test("falha da analise permite repetir sem perder a transcricao", async () => {
  const { caso, api } = preparar();
  const solicitar = api.solicitarAnalise;
  api.solicitarAnalise = async () => { throw new Error("Falha temporaria"); };
  await assert.rejects(api.finalizarSessao(caso.id, transcricao), /Falha temporaria/);
  assert.equal(caso.status, "gravacao_pendente");
  assert.deepEqual((await api.obterCaso(caso.id)).transcricao, transcricao);
  api.solicitarAnalise = solicitar;
  await api.finalizarSessao(caso.id, transcricao);
  assert.equal(caso.status, "em_analise");
  assert.equal((await api.obterCaso(caso.id)).analise.versao, 1);
});
