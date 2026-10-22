import { Check } from "lucide-react";

import type { EtapaProcessamento } from "@/lib/transcricao/fluxo";
import { cn } from "@/lib/utils";

const ROTULO_ETAPA: Record<EtapaProcessamento, string> = {
  transcrevendo: "Transcrevendo o áudio",
  revisando: "Revisando o texto",
  salvando: "Salvando no caso",
  analisando: "Gerando a análise preliminar",
};

/** Lista de etapas com a atual em andamento; as anteriores aparecem concluídas. */
export function ProgressoProcessamento({
  etapas,
  atual,
  aviso,
}: {
  etapas: EtapaProcessamento[];
  atual: EtapaProcessamento;
  aviso?: string;
}) {
  const indiceAtual = etapas.indexOf(atual);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2.5">
        {etapas.map((etapa, indice) => {
          const concluida = indice < indiceAtual;
          const emAndamento = indice === indiceAtual;
          return (
            <li key={etapa} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  concluida && "bg-destaque border-destaque text-white",
                  emAndamento && "border-destaque",
                  !concluida && !emAndamento && "border-borda",
                )}
              >
                {concluida ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
                {emAndamento ? (
                  <span
                    aria-hidden
                    className="border-destaque size-3 animate-spin rounded-full border-2 border-r-transparent"
                  />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[13px]",
                  emAndamento ? "font-semibold" : concluida ? "text-tinta" : "text-tinta-suave",
                )}
              >
                {ROTULO_ETAPA[etapa]}
                {emAndamento ? "…" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {aviso ? <p className="text-tinta-suave text-[12px]">{aviso}</p> : null}
    </div>
  );
}
