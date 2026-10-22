"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { AREAS_JURIDICAS, areaPorId } from "@/lib/casos/areas-juridicas";
import { cn } from "@/lib/utils";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

interface SeletorAreaJuridicaProps {
  id: string;
  valor: string;
  aoMudar: (id: string) => void;
}

export function SeletorAreaJuridica({ id, valor, aoMudar }: SeletorAreaJuridicaProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const nome = areaPorId(valor)?.nome;

  useEffect(() => {
    if (!aberto) return;

    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    function cliqueFora(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    }

    document.addEventListener("keydown", tecla);
    document.addEventListener("mousedown", cliqueFora);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("mousedown", cliqueFora);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className={cn(CLASSE_CAMPO, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={nome ? undefined : "text-destaque text-[11px]"}>
          {nome ?? "Selecione a área jurídica"}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("text-tinta-suave size-4 shrink-0 transition-transform", aberto && "rotate-180")}
        />
      </button>
      {aberto ? (
        <div
          role="listbox"
          aria-labelledby={id}
          className="border-borda bg-campo absolute top-full z-20 mt-1 flex max-h-56 w-full flex-col overflow-y-auto rounded-[8px] border py-1 shadow-lg"
        >
          {AREAS_JURIDICAS.map((area) => {
            const ativa = area.id === valor;
            return (
              <button
                key={area.id}
                type="button"
                role="option"
                aria-selected={ativa}
                onClick={() => {
                  aoMudar(area.id);
                  setAberto(false);
                }}
                className={cn(
                  "hover:bg-destaque-suave flex h-9 shrink-0 items-center px-3 text-left text-[13px]",
                  ativa && "bg-destaque-suave font-semibold",
                )}
              >
                {area.nome}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
