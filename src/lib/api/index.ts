import type { SophiaApi } from "./types";

import { criarAnaliseApi } from "./analise-real";
import { criarHttpApi } from "./http/adapter";
import { mockApi } from "./mock/adapter";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ANALISE_REAL = process.env.NEXT_PUBLIC_ANALISE_REAL === "true";

const base: SophiaApi = API_URL ? criarHttpApi(API_URL) : mockApi;

/**
 * Único ponto de acesso a dados do front.
 *
 * Sem `NEXT_PUBLIC_API_URL` os casos rodam no mock. Com `NEXT_PUBLIC_ANALISE_REAL=true`,
 * análise preliminar e chat passam a usar o backend (IA de verdade), independentemente de
 * os casos estarem no mock ou na API — nenhum componente muda.
 */
export const api: SophiaApi = ANALISE_REAL ? { ...base, ...criarAnaliseApi(base) } : base;

export type * from "./types";
