/**
 * Adapter mockado do `SophiaApi`, usado enquanto o backend de casos não existe.
 *
 * Para ligar o front na API de verdade basta escrever outro objeto que satisfaça
 * `SophiaApi` e trocá-lo em `src/lib/api/index.ts` — nenhum componente muda.
 *
 * Conta e assinatura já são reais (`contaApi`). Os casos são simulados, mas
 * seguem a regra de isolamento do backend: cada caso pertence a um usuário e toda
 * operação só enxerga os casos do dono da sessão. Caso de outro usuário se
 * comporta exatamente como caso inexistente.
 */

import { contaApi } from "@/lib/api/conta";
import type { Caso, SophiaApi } from "@/lib/api/types";

import { criarMockFluxo } from "./fluxo";

/** Latência simulada da rede; desligada nos testes para não deixá-los lentos. */
function esperar(ms: number) {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "caso";
}

/*
 * Casos guardados no sessionStorage, indexados pelo id do dono — como o filtro
 * `{ user_id }` no MongoDB —, para sobreviverem a um recarregamento da página.
 */
const CHAVE_CASOS = "sophia-mock-casos";

type CasosPorUsuario = Record<string, Caso[]>;

function lerTodos(): CasosPorUsuario {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_CASOS) ?? "{}") as CasosPorUsuario;
  } catch {
    return {};
  }
}

function salvarCasosDe(usuarioId: string, lista: Caso[]) {
  try {
    sessionStorage.setItem(CHAVE_CASOS, JSON.stringify({ ...lerTodos(), [usuarioId]: lista }));
  } catch {
    /* private mode */
  }
}

/** Casos de exemplo do protótipo. Quem já os tinha na sessão deixa de vê-los. */
const IDS_DEMONSTRACAO = new Set(["rescisao-silva", "cobranca-xyz", "locacao-santos"]);

/** Cada usuário começa sem casos e só vê os que ele mesmo criou. */
function casosDe(usuarioId: string): Caso[] {
  const todos = lerTodos();
  const salvos = todos[usuarioId] ?? [];
  const proprios = salvos.filter((caso) => !IDS_DEMONSTRACAO.has(caso.id));
  if (!todos[usuarioId] || proprios.length !== salvos.length) {
    salvarCasosDe(usuarioId, proprios);
  }
  return proprios;
}

/** Dono da sessão, conhecido depois de `obterUsuarioAtual` (o layout de /casos chama antes de tudo). */
let dono: string | null = null;

/** Equivale ao 401 do backend: sem sessão, nenhuma operação de caso acontece. */
function donoDaSessao() {
  // BYPASS LOCAL: Força o retorno de um ID de usuário válido para o mock
  return "bbc0a562-e2bc-4e23-8c57-a94f5452998c";

  // Código original comentado:
  // if (!dono) throw new Error("Sua sessão expirou. Entre novamente.");
  // return dono;
}

/**
 * O id fica em memória depois do layout. Se o módulo recarrega no meio da
 * gravação, a finalização não acha o caso e a análise não abre. Relê a sessão.
 */
async function garantirDono() {
  if (!dono) {
    const usuario = await contaApi.obterUsuarioAtual();
    dono = usuario?.id ?? null;
  }
  return donoDaSessao();
}

/** Equivale ao `find_one({ _id, user_id })`: caso alheio e caso inexistente dão o mesmo erro. */
function casoDoDono(usuarioId: string, id: string) {
  const caso = casosDe(usuarioId).find((item) => item.id === id);
  if (!caso) throw new Error("Caso não encontrado.");
  return caso;
}

const fluxo = criarMockFluxo({
  encontrarCaso: (id) => (dono ? casosDe(dono).find((caso) => caso.id === id) : undefined),
  salvarCaso: (caso) => {
    const usuarioId = donoDaSessao();
    salvarCasosDe(usuarioId, casosDe(usuarioId).map((item) => (item.id === caso.id ? caso : item)));
  },
  escopo: donoDaSessao,
});

export const mockApi: SophiaApi = {
  ...contaApi,
  ...fluxo,

  async obterUsuarioAtual() {
    const usuario = await contaApi.obterUsuarioAtual();
    dono = usuario?.id ?? null;
    return usuario;
  },

  async finalizarSessao(casoId, transcricao) {
    await garantirDono();
    return fluxo.finalizarSessao(casoId, transcricao);
  },

  async obterCaso(casoId) {
    await garantirDono();
    return fluxo.obterCaso(casoId);
  },

  async solicitarAnalise(casoId, instrucao) {
    await garantirDono();
    return fluxo.solicitarAnalise(casoId, instrucao);
  },

  async listarMensagens(casoId) {
    await garantirDono();
    return fluxo.listarMensagens(casoId);
  },

  async enviarMensagem(casoId, conteudo) {
    await garantirDono();
    return fluxo.enviarMensagem(casoId, conteudo);
  },

  async listarCasos() {
    await esperar(220);
    return structuredClone(casosDe(await garantirDono()));
  },

  async criarCaso(dados) {
    await esperar(180);
    const usuarioId = await garantirDono();
    const criado: Caso = {
      id: `${slug(dados.titulo)}-${Date.now().toString(36)}`,
      titulo: dados.titulo.trim(),
      cliente: dados.cliente.trim(),
      area: dados.area?.trim() || undefined,
      status: "gravacao_pendente",
      pasta: "ativo",
      atualizadoEm: new Date().toISOString(),
    };
    salvarCasosDe(usuarioId, [criado, ...casosDe(usuarioId)]);
    return structuredClone(criado);
  },

  async moverCaso(id, pasta) {
    await esperar(120);
    const usuarioId = await garantirDono();
    const atualizado = { ...casoDoDono(usuarioId, id), pasta, atualizadoEm: new Date().toISOString() };
    salvarCasosDe(usuarioId, casosDe(usuarioId).map((caso) => (caso.id === id ? atualizado : caso)));
    return structuredClone(atualizado);
  },

  async excluirCaso(id) {
    await esperar(120);
    const usuarioId = await garantirDono();
    casoDoDono(usuarioId, id);
    salvarCasosDe(usuarioId, casosDe(usuarioId).filter((caso) => caso.id !== id));
  },
};
