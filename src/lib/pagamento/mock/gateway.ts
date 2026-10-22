/**
 * Gateway mockado, usado enquanto o provedor de pagamento não é escolhido.
 *
 * Cartões de teste: qualquer número que passe no Luhn é aceito, como
 * 4111 1111 1111 1111. O número 4000 0000 0000 0002 é tokenizado, mas a
 * cobrança é recusada no `api.assinar` mockado, para testar a tela de erro.
 */

import { detectarBandeira, numeroCartaoValido } from "@/lib/pagamento/cartao";
import type { GatewayPagamento } from "@/lib/pagamento/types";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const gatewayMock: GatewayPagamento = {
  async tokenizarCartao(dados) {
    await esperar(600);
    if (!numeroCartaoValido(dados.numero)) {
      throw new Error("Número de cartão inválido.");
    }
    const bandeira = detectarBandeira(dados.numero);
    const final = dados.numero.slice(-4);
    return {
      token: `tok_mock_${bandeira}_${final}_${Date.now()}`,
      bandeira,
      final,
      validade: `${String(dados.mesValidade).padStart(2, "0")}/${String(dados.anoValidade).slice(-2)}`,
    };
  },
};
