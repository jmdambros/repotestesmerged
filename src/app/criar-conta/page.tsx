"use client";

import { FormularioCriarConta } from "@/components/conta/formulario-criar-conta";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { LinkTermos } from "@/components/login/link-termos";
import { BotaoTema } from "@/components/tema/botao-tema";

export default function PaginaCriarConta() {
  return (
    <div className="tela-login flex min-h-dvh flex-col px-8 py-5">
      <header className="flex h-6 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino="/login" />
          <span className="text-[13px] font-semibold">SOPHIA</span>
        </div>
        <div className="flex items-center gap-2">
          <BotaoTema />
          <LinkTermos />
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-6">
        <FormularioCriarConta />
      </main>
    </div>
  );
}
