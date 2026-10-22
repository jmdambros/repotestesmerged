/**
 * Conta e assinatura pelas rotas do próprio Next (`src/app/api`), que falam com o
 * backend Python e cuidam do cookie de sessão assinado. Vale para o mock e para o
 * adapter HTTP: o login já é real, só os casos ainda são simulados.
 *
 * Nenhuma chamada envia id de usuário; a rota descobre quem é pelo cookie.
 */

import type { SophiaApi } from "@/lib/api/types";
import { OFERTA_ASSINATURA } from "@/lib/api/mock/dados";

import { assinaturaDaApi, assinaturaParaApi, usuarioDaApi, type AssinaturaApi, type UsuarioApi } from "./http/mapeadores";

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

/** Mensagens para quando a rota não manda `{ erro }` no corpo. */
const MENSAGEM_POR_STATUS: Record<number, string> = {
  401: "Sua sessão expirou. Entre novamente.",
  402: "Pagamento recusado pelo emissor do cartão. Tente outro cartão.",
  404: "Caso não encontrado.",
  409: "Já existe uma conta com este e-mail.",
};

/** `fetch` com cookie de sessão e erros no formato `{ erro }` usado pelas rotas e pelo backend. */
export async function requisitarJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ErroApi("Não foi possível conectar ao servidor. Verifique sua internet.", 0);
  }

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string; mensagem?: string } | null;
    throw new ErroApi(
      corpo?.erro ?? corpo?.mensagem ?? MENSAGEM_POR_STATUS[resposta.status] ?? "Algo deu errado. Tente novamente.",
      resposta.status,
    );
  }

  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

type ApiConta = Pick<SophiaApi, "obterUsuarioAtual" | "obterOfertaAssinatura" | "assinar" | "trocarPlano">;

export const contaApi: ApiConta = {
  async obterUsuarioAtual() {
    try {
      const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/auth/eu");
      return usuarioDaApi(usuario);
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 401) return null;
      throw erro;
    }
  },

  async obterOfertaAssinatura() {
    // Preço e textos ficam no front até o backend expor uma rota de oferta.
    return structuredClone(OFERTA_ASSINATURA);
  },

  async assinar(dados) {
    const { assinatura } = await requisitarJson<{ assinatura: AssinaturaApi }>("/api/assinatura", {
      method: "POST",
      body: JSON.stringify(assinaturaParaApi(dados)),
    });
    return assinaturaDaApi(assinatura);
  },

  async trocarPlano(planoId) {
    const { usuario } = await requisitarJson<{ usuario: UsuarioApi }>("/api/assinatura/plano", {
      method: "POST",
      body: JSON.stringify({ plan_id: planoId }),
    });
    return usuarioDaApi(usuario);
  },
};
