export const CHAVE_DESTAQUE = "sophia-destaque";

export const CORES_DESTAQUE = ["verde", "branco", "azul", "laranja", "roxo"] as const;

export type CorDestaque = (typeof CORES_DESTAQUE)[number];

export const ROTULO_DESTAQUE: Record<CorDestaque, string> = {
  verde: "Verde",
  branco: "Branco",
  azul: "Azul",
  laranja: "Laranja",
  roxo: "Roxo",
};

export function ehCorDestaque(valor: string | null): valor is CorDestaque {
  return CORES_DESTAQUE.some((cor) => cor === valor);
}

export function aplicarDestaque(cor: CorDestaque) {
  document.documentElement.setAttribute("data-destaque", cor);
  try {
    localStorage.setItem(CHAVE_DESTAQUE, cor);
  } catch {
    /* private mode */
  }
}

export function lerDestaqueSalvo(): CorDestaque {
  try {
    const salvo = localStorage.getItem(CHAVE_DESTAQUE);
    return ehCorDestaque(salvo) ? salvo : "verde";
  } catch {
    return "verde";
  }
}
