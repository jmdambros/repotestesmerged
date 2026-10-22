/**
 * Máscaras e validações do formulário de cartão. Rodam só no navegador, para
 * dar retorno imediato; a validação definitiva é sempre do gateway.
 */

import type { BandeiraCartao } from "@/lib/api/types";

export const ROTULO_BANDEIRA: Record<BandeiraCartao, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  elo: "Elo",
  hipercard: "Hipercard",
  desconhecida: "Cartão",
};

export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Elo e Hipercard vêm antes porque parte das faixas deles começa com 4 ou 5. */
const FAIXAS: [BandeiraCartao, RegExp][] = [
  ["elo", /^(4011(78|79)|43(1274|8935)|45(1416|7393|763[12])|50(4175|6699|67[0-7]\d|9000)|627780|63(6297|6368)|650(0[3-5]|4[0-9]|5[0-3]|9[2-7])|65165[2-9]|6550[0-2])/],
  ["hipercard", /^(606282|3841)/],
  ["amex", /^3[47]/],
  ["visa", /^4/],
  ["mastercard", /^(5[1-5]|2[2-7])/],
];

export function detectarBandeira(numero: string): BandeiraCartao {
  const digitos = soDigitos(numero);
  return FAIXAS.find(([, faixa]) => faixa.test(digitos))?.[0] ?? "desconhecida";
}

export function tamanhoNumero(bandeira: BandeiraCartao) {
  if (bandeira === "amex") return 15;
  if (bandeira === "hipercard") return 19;
  return 16;
}

export function tamanhoCvv(bandeira: BandeiraCartao) {
  return bandeira === "amex" ? 4 : 3;
}

/** "4111111111111111" → "4111 1111 1111 1111"; Amex no padrão 4-6-5. */
export function formatarNumeroCartao(valor: string) {
  const bandeira = detectarBandeira(valor);
  const digitos = soDigitos(valor).slice(0, tamanhoNumero(bandeira));
  if (bandeira === "amex") {
    return [digitos.slice(0, 4), digitos.slice(4, 10), digitos.slice(10)].filter(Boolean).join(" ");
  }
  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Algoritmo de Luhn, o dígito verificador de todo número de cartão. */
export function numeroCartaoValido(valor: string) {
  const digitos = soDigitos(valor);
  if (digitos.length < 13 || digitos.length > 19) return false;
  let soma = 0;
  for (let indice = 0; indice < digitos.length; indice++) {
    let digito = Number(digitos[digitos.length - 1 - indice]);
    if (indice % 2 === 1) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    soma += digito;
  }
  return soma % 10 === 0;
}

/** "1228" → "12/28". */
export function formatarValidade(valor: string) {
  const digitos = soDigitos(valor).slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

export function lerValidade(valor: string) {
  const digitos = soDigitos(valor);
  return { mes: Number(digitos.slice(0, 2)), ano: 2000 + Number(digitos.slice(2, 4)) };
}

export function validadeValida(valor: string, agora = new Date()) {
  if (soDigitos(valor).length !== 4) return false;
  const { mes, ano } = lerValidade(valor);
  if (mes < 1 || mes > 12) return false;
  const atual = agora.getFullYear() * 12 + agora.getMonth() + 1;
  return ano * 12 + mes >= atual;
}

/** "12345678901" → "123.456.789-01". */
export function formatarCpf(valor: string) {
  const digitos = soDigitos(valor).slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function cpfValido(valor: string) {
  const digitos = soDigitos(valor);
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;
  const verificador = (tamanho: number) => {
    let soma = 0;
    for (let indice = 0; indice < tamanho; indice++) {
      soma += Number(digitos[indice]) * (tamanho + 1 - indice);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return verificador(9) === Number(digitos[9]) && verificador(10) === Number(digitos[10]);
}

/** "Mastercard •••• 4444", para exibir o cartão vinculado à conta. */
export function descreverCartao(cartao: { bandeira: BandeiraCartao; final: string }) {
  return `${ROTULO_BANDEIRA[cartao.bandeira]} •••• ${cartao.final}`;
}
