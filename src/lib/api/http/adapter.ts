/**
 * Adapter HTTP do `SophiaApi`, ativado quando `NEXT_PUBLIC_API_URL` está definida
 * (ver `src/lib/api/index.ts`). Rotas e formatos estão em `docs/contrato-api.md`.
 *
 * Cobre os casos por REST. A sessão viaja no cookie httpOnly, então nenhuma
 * requisição envia o id do usuário: é o backend que restringe cada consulta aos
 * casos do dono da sessão. Conta e assinatura usam as rotas do Next (`contaApi`).
 */

import { contaApi, requisitarJson } from "@/lib/api/conta";
import { mockApi } from "@/lib/api/mock/adapter";
import type { SophiaApi } from "@/lib/api/types";

import { casoDaApi, novoCasoParaApi, type CasoApi } from "./mapeadores";

export { ErroApi } from "@/lib/api/conta";

export function criarHttpApi(baseUrl: string): SophiaApi {
  const base = baseUrl.replace(/\/$/, "");
  const url = (caminho: string) => `${base}${caminho}`;
  const caminhoCaso = (id: string) => `/casos/${encodeURIComponent(id)}`;
  const comCorpo = (method: string, corpo: unknown): RequestInit => ({ method, body: JSON.stringify(corpo) });

  return {
    ...contaApi,

    // Transcrição, análise e chat ainda não têm rota REST; seguem no mock até lá.
    obterCaso: mockApi.obterCaso,
    finalizarSessao: mockApi.finalizarSessao,
    solicitarAnalise: mockApi.solicitarAnalise,
    listarMensagens: mockApi.listarMensagens,
    enviarMensagem: mockApi.enviarMensagem,

    async listarCasos() {
      const lista = await requisitarJson<CasoApi[]>(url("/casos"));
      return lista.map(casoDaApi);
    },
    async criarCaso(dados) {
      return casoDaApi(await requisitarJson<CasoApi>(url("/casos"), comCorpo("POST", novoCasoParaApi(dados))));
    },
    async moverCaso(id, pasta) {
      return casoDaApi(await requisitarJson<CasoApi>(url(caminhoCaso(id)), comCorpo("PATCH", { folder: pasta })));
    },
    async excluirCaso(id) {
      await requisitarJson<void>(url(caminhoCaso(id)), { method: "DELETE" });
    },
  };
}
