/**
 * Isolamento de casos entre usuários no mock. São as mesmas regras que o backend
 * precisa cumprir (ver "Isolamento por usuário" em docs/contrato-api.md).
 *
 * A sessão é real (`GET /api/auth/eu`); aqui o `fetch` é simulado para alternar
 * entre a Ana e o Bruno.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { mockApi as api } from "@/lib/api/mock/adapter";

const ANA = "98ff6434-655e-486f-b255-1bd89542ea7f";
const BRUNO = "d11143d4-e6d6-435b-9807-4ecd182e905f";

/** Abre a sessão como o usuário dado (ou nenhum), como o layout de /casos faz. */
async function logarComo(userId: string | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      userId
        ? Response.json({ usuario: { _id: userId, name: "Teste", email: "t@t.com", account_status: "ativa" } })
        : Response.json({ erro: "não autenticado" }, { status: 401 }),
    ),
  );
  return api.obterUsuarioAtual();
}

async function cenarioComDoisUsuarios() {
  await logarComo(ANA);
  const casoDaAna = await api.criarCaso({ titulo: "Divórcio consensual", cliente: "Paula Souza" });
  await logarComo(BRUNO);
  const casoDoBruno = await api.criarCaso({ titulo: "Ação trabalhista", cliente: "Carlos Lima" });
  return { casoDaAna, casoDoBruno };
}

const ids = async () => (await api.listarCasos()).map((caso) => caso.id);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isolamento de casos por usuário", () => {
  it("cada usuário lista só os próprios casos", async () => {
    const { casoDaAna, casoDoBruno } = await cenarioComDoisUsuarios();

    expect(await ids()).toContain(casoDoBruno.id);
    expect(await ids()).not.toContain(casoDaAna.id);

    await logarComo(ANA);
    expect(await ids()).toContain(casoDaAna.id);
    expect(await ids()).not.toContain(casoDoBruno.id);
  });

  it("não deixa arquivar nem excluir o caso de outro usuário", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    await expect(api.moverCaso(casoDaAna.id, "arquivo")).rejects.toThrow("Caso não encontrado.");
    await expect(api.excluirCaso(casoDaAna.id)).rejects.toThrow("Caso não encontrado.");

    await logarComo(ANA);
    const intacto = (await api.listarCasos()).find((caso) => caso.id === casoDaAna.id);
    expect(intacto?.pasta).toBe("ativo");
  });

  it("caso alheio e caso inexistente dão o mesmo erro, sem revelar que o caso existe", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    const alheio = await api.moverCaso(casoDaAna.id, "arquivo").catch((erro: Error) => erro.message);
    const inexistente = await api.moverCaso("nao-existe", "arquivo").catch((erro: Error) => erro.message);
    expect(alheio).toBe(inexistente);
  });

  it("não deixa abrir, analisar ou conversar sobre o caso de outro usuário", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();

    await expect(api.obterCaso(casoDaAna.id)).rejects.toThrow(/nao encontrado/i);
    await expect(api.solicitarAnalise(casoDaAna.id)).rejects.toThrow(/nao encontrado/i);
    await expect(api.listarMensagens(casoDaAna.id)).rejects.toThrow(/nao encontrado/i);
    await expect(api.enviarMensagem(casoDaAna.id, "oi")).rejects.toThrow(/nao encontrado/i);
  });

  it("usuário novo começa sem os casos de demonstração", async () => {
    await logarComo("usuario-sem-casos");
    expect(await ids()).toEqual([]);
  });

  it("casos de demonstração já gravados na sessão somem da lista", async () => {
    sessionStorage.setItem(
      "sophia-mock-casos",
      JSON.stringify({
        "usuario-com-exemplo": [
          {
            id: "rescisao-silva",
            titulo: "Rescisão contratual",
            cliente: "João Silva",
            status: "em_analise",
            pasta: "ativo",
            atualizadoEm: "2026-09-21T14:32:00.000Z",
          },
          {
            id: "cobranca-xyz",
            titulo: "Ação de cobrança",
            cliente: "Empresa XYZ Ltda",
            status: "gravacao_pendente",
            pasta: "ativo",
            atualizadoEm: "2026-09-20T18:05:00.000Z",
          },
        ],
      }),
    );

    await logarComo("usuario-com-exemplo");
    expect(await ids()).toEqual([]);
  });

  it("o dono continua com acesso total ao próprio caso", async () => {
    const { casoDaAna } = await cenarioComDoisUsuarios();
    await logarComo(ANA);

    expect((await api.moverCaso(casoDaAna.id, "arquivo")).pasta).toBe("arquivo");
    await api.excluirCaso(casoDaAna.id);
    expect(await ids()).not.toContain(casoDaAna.id);
  });

  it("sem sessão nenhuma operação de caso funciona", async () => {
    const { casoDoBruno } = await cenarioComDoisUsuarios();
    expect(await logarComo(null)).toBeNull();

    await expect(api.listarCasos()).rejects.toThrow("Sua sessão expirou");
    await expect(api.criarCaso({ titulo: "X", cliente: "Y" })).rejects.toThrow("Sua sessão expirou");
    await expect(api.moverCaso(casoDoBruno.id, "arquivo")).rejects.toThrow("Sua sessão expirou");
    await expect(api.excluirCaso(casoDoBruno.id)).rejects.toThrow("Sua sessão expirou");
  });
});
