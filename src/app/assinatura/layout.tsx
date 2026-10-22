import type { ReactNode } from "react";

import { EtapasAssinatura } from "@/components/assinatura/etapas-assinatura";
import { GuardaAssinatura } from "@/components/assinatura/guarda-assinatura";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { LinkTermos } from "@/components/login/link-termos";
import { BotaoTema } from "@/components/tema/botao-tema";

/** Fluxo pós-cadastro (plano → pagamento), no mesmo visual das telas de acesso. */
export default function LayoutAssinatura({ children }: { children: ReactNode }) {
  return (
    <div className="tela-login flex min-h-dvh flex-col px-4 py-5 sm:px-8">
      <header className="flex h-6 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino="/criar-conta" />
          <span className="text-[13px] font-semibold">SOPHIA</span>
        </div>
        <div className="flex items-center gap-2">
          <BotaoTema />
          <LinkTermos />
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center gap-8 py-8">
        <EtapasAssinatura />
        <GuardaAssinatura>{children}</GuardaAssinatura>
      </main>
    </div>
  );
}
