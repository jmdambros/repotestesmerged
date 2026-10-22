/** Normaliza para busca: sem acento, sem caixa, sem espaço nas pontas. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
