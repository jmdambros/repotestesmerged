import type { PastaCaso } from "@/lib/api/types";
import { normalizar } from "@/lib/texto";

export function pastaDoCaso(caso: { pasta?: PastaCaso | string | null }): PastaCaso {
  return caso.pasta === "arquivo" ? "arquivo" : "ativo";
}

export function rotuloCaso(caso: { titulo: string; cliente: string }) {
  const titulo = caso.titulo.trim();
  const cliente = caso.cliente.trim();
  if (!cliente) return titulo;
  if (normalizar(titulo).includes(normalizar(cliente))) return titulo;
  return `${titulo} — ${cliente}`;
}
