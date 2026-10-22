import type { StatusCaso } from "@/lib/api/types";

export const STATUS_CASO: Record<StatusCaso, string> = {
  gravacao_pendente: "Gravação pendente",
  em_analise: "Em análise",
  concluido: "Concluído",
};
