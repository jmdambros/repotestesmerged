import type { GatewayPagamento } from "./types";

import { gatewayMock } from "./mock/gateway";

/**
 * Único ponto de acesso ao gateway de pagamento, no mesmo padrão de `src/lib/api`.
 *
 * Quando o provedor for escolhido, crie `./<provedor>/gateway.ts` implementando
 * `GatewayPagamento` com o SDK dele e troque a atribuição abaixo.
 */
export const gateway: GatewayPagamento = gatewayMock;

export type * from "./types";
