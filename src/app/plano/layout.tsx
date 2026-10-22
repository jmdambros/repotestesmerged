import type { ReactNode } from "react";

import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { BotaoTema } from "@/components/tema/botao-tema";

/** Troca de plano de quem já assina; mesmo visual da escolha de plano. */
export default function LayoutPlano({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-5 sm:px-8">
      <header className="flex h-6 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino="/casos" />
          <span className="text-[13px] font-semibold">SOPHIA</span>
        </div>
        <BotaoTema />
      </header>

      <main className="flex w-full flex-1 flex-col items-center gap-8 py-8">{children}</main>
    </div>
  );
}
