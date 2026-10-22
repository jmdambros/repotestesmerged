"use client";

import { useState } from "react";

import {
  aplicarDestaque,
  CORES_DESTAQUE,
  lerDestaqueSalvo,
  ROTULO_DESTAQUE,
  type CorDestaque,
} from "@/lib/destaque";
import { cn } from "@/lib/utils";

const AMOSTRA: Record<CorDestaque, string> = {
  verde: "bg-[#356660]",
  branco: "bg-white border-borda",
  azul: "bg-[#2f5a8c]",
  laranja: "bg-[#b05620]",
  roxo: "bg-[#5a3d82]",
};

/** Só é renderizado dentro do modal de configurações, que nunca passa pelo servidor. */
export function SeletorDestaque() {
  const [cor, setCor] = useState<CorDestaque>(lerDestaqueSalvo);

  function escolher(proxima: CorDestaque) {
    setCor(proxima);
    aplicarDestaque(proxima);
  }

  return (
    <div className="border-borda flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[13px] font-semibold">Cor de destaque</p>
        <p className="text-tinta-suave text-[12px]">{ROTULO_DESTAQUE[cor]} nos botões</p>
      </div>
      <div className="flex shrink-0 gap-1.5" role="radiogroup" aria-label="Cor de destaque">
        {CORES_DESTAQUE.map((opcao) => (
          <button
            key={opcao}
            type="button"
            role="radio"
            aria-checked={cor === opcao}
            aria-label={ROTULO_DESTAQUE[opcao]}
            title={ROTULO_DESTAQUE[opcao]}
            onClick={() => escolher(opcao)}
            className={cn(
              "size-5 rounded-full border",
              AMOSTRA[opcao],
              cor === opcao ? "ring-tinta ring-2 ring-offset-1 ring-offset-[var(--color-campo)]" : "border-borda",
            )}
          />
        ))}
      </div>
    </div>
  );
}
