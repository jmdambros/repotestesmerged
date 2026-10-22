"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { IconeTelefone } from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { SeletorDestaque } from "@/components/tema/seletor-destaque";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { ResumoAssinatura } from "@/lib/api/types";
import { descreverCartao } from "@/lib/pagamento/cartao";

interface ModalConfiguracoesProps {
  aberto: boolean;
  aoFechar: () => void;
  aoPedirSaida: () => void;
}

export function ModalConfiguracoes({
  aberto,
  aoFechar,
  aoPedirSaida,
}: ModalConfiguracoesProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Configurações"
      descricao="Tema, cor, pagamento e sessão"
      className="max-w-[340px]"
    >
      <div className="mt-4 flex flex-col gap-3">
        <div className="border-borda flex items-center justify-between rounded-[10px] border px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold">Aparência</p>
            <p className="text-tinta-suave text-[12px]">
              <span className="dark:hidden">Tema claro</span>
              <span className="hidden dark:inline">Tema escuro</span>
            </p>
          </div>
          <BotaoTema className="size-8" />
        </div>

        <SeletorDestaque />

        <CartaoPagamento />

        <div className="border-borda flex items-center justify-between rounded-[10px] border px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold">Sessão</p>
            <p className="text-tinta-suave text-[12px]">Voltar para a tela de login</p>
          </div>
          <button
            type="button"
            onClick={aoPedirSaida}
            className="pressionavel border-borda bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          title="Entre em contato o suporte"
          aria-label="Entre em contato o suporte"
          className="text-tinta-suave flex size-8 items-center justify-center rounded-[8px]"
        >
          <IconeTelefone />
        </span>
        <button
          type="button"
          onClick={aoFechar}
          className="border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}

/** Montado só com o modal aberto, então sempre mostra o plano atual depois de uma troca. */
function CartaoPagamento() {
  const [assinatura, setAssinatura] = useState<ResumoAssinatura | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    api
      .obterUsuarioAtual()
      .then((usuario) => {
        if (ativo) setAssinatura(usuario?.assinatura ?? null);
      })
      .catch(() => {
        if (ativo) setAssinatura(null);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="border-borda flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[13px] font-semibold">Pagamento</p>
        {assinatura === undefined ? (
          <p className="text-tinta-suave text-[12px]">Carregando…</p>
        ) : assinatura ? (
          <>
            <p className="text-[12px]">Plano {assinatura.nomePlano}</p>
            <p className="text-tinta-suave text-[12px]">Cartão {descreverCartao(assinatura.cartao)}</p>
          </>
        ) : (
          <p className="text-tinta-suave text-[12px]">Nenhuma assinatura encontrada</p>
        )}
      </div>
      {assinatura ? (
        <Link
          href="/plano"
          className="pressionavel border-borda bg-campo flex h-8 shrink-0 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Alterar
        </Link>
      ) : null}
    </div>
  );
}
