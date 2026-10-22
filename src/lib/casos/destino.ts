import type { Caso } from "@/lib/api/types";

export function destinoDoCaso(caso: Caso, origem = "") {
  if (origem.includes("/repositorio/chat")) {
    return `/casos/${caso.id}/repositorio/chat`;
  }
  if (origem.includes("/repositorio/analise")) {
    return `/casos/${caso.id}/repositorio/analise`;
  }
  if (origem.includes("/repositorio")) {
    return `/casos/${caso.id}/repositorio`;
  }
  return `/casos/${caso.id}/gravacao`;
}
