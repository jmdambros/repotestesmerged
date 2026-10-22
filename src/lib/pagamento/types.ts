/**
 * Contrato com o gateway de pagamento (Stripe, Pagar.me, Mercado Pago…).
 *
 * O cartão é tokenizado direto no navegador pelo SDK do gateway: número e CVV
 * nunca chegam à API da Sophia, o que mantém o backend fora do escopo do PCI DSS.
 * A API recebe só o token, em `api.assinar`.
 */

import type { CartaoSalvo } from "@/lib/api/types";

export interface DadosCartao {
  /** Só dígitos. */
  numero: string;
  nomeTitular: string;
  mesValidade: number;
  /** Quatro dígitos. */
  anoValidade: number;
  cvv: string;
}

export interface CartaoTokenizado extends CartaoSalvo {
  token: string;
}

export interface GatewayPagamento {
  /** Rejeita com `Error` de mensagem amigável quando o gateway recusa os dados. */
  tokenizarCartao(dados: DadosCartao): Promise<CartaoTokenizado>;
}
