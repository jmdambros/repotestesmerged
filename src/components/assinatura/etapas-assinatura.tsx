"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import { IconeCheck } from "@/components/assinatura/icones";
import { cn } from "@/lib/utils";

const ETAPAS = ["Conta", "Plano", "Pagamento"];

/** A conta já foi criada quando o usuário chega aqui, então a etapa 1 sempre aparece concluída. */
export function EtapasAssinatura() {
  const pathname = usePathname();
  const atual = pathname.startsWith("/assinatura/pagamento") ? 2 : 1;

  return (
    <ol className="flex w-full max-w-[420px] items-center" aria-label="Etapas da assinatura">
      {ETAPAS.map((rotulo, indice) => {
        const concluida = indice < atual;
        const ativa = indice === atual;
        return (
          <Fragment key={rotulo}>
            {indice > 0 ? (
              <li
                aria-hidden
                className={cn(
                  "mx-2 h-px flex-1 transition-colors",
                  indice <= atual ? "bg-destaque" : "bg-borda",
                )}
              />
            ) : null}
            <li
              aria-current={ativa ? "step" : undefined}
              className="flex shrink-0 items-center gap-2"
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  concluida && "bg-destaque border-destaque text-white",
                  ativa && "border-destaque text-destaque border-[1.5px]",
                  !concluida && !ativa && "border-borda text-tinta-suave",
                )}
              >
                {concluida ? <IconeCheck className="size-3.5" /> : indice + 1}
              </span>
              <span
                className={cn(
                  "text-[12px] font-medium",
                  ativa ? "text-tinta" : "text-tinta-suave",
                )}
              >
                {rotulo}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
