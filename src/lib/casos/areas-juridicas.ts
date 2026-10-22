/** Áreas que o advogado escolhe ao criar o caso. O id é o vínculo estável para o roteiro futuro. */
export const AREAS_JURIDICAS = [
  { id: "civil", nome: "Civil" },
  { id: "familia-sucessoes", nome: "Família e Sucessões" },
  { id: "trabalhista", nome: "Trabalhista" },
  { id: "previdenciario", nome: "Previdenciário" },
  { id: "consumidor", nome: "Consumidor" },
  { id: "empresarial", nome: "Empresarial" },
  { id: "tributario", nome: "Tributário" },
  { id: "penal", nome: "Penal" },
  { id: "administrativo", nome: "Administrativo" },
  { id: "imobiliario", nome: "Imobiliário" },
  { id: "ambiental", nome: "Ambiental" },
  { id: "digital", nome: "Digital e Proteção de Dados" },
] as const;

export type IdAreaJuridica = (typeof AREAS_JURIDICAS)[number]["id"];

export function areaPorId(id: string | undefined) {
  return AREAS_JURIDICAS.find((area) => area.id === id);
}
