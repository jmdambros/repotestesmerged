"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { IconeLixeira, IconeRepositorio, IconeRestaurar } from "@/components/casos/icones-trilha";
import type { Caso, PastaCaso } from "@/lib/api/types";
import { pastaDoCaso, rotuloCaso } from "@/lib/casos/rotulo";
import { STATUS_CASO } from "@/lib/casos/status";
import { destinoDoCaso } from "@/lib/casos/destino";
import { formatarDataCurta } from "@/lib/formato";

const TEXTOS: Record<PastaCaso, { titulo: string; subtitulo: string; vazio: string }> = {
  ativo: {
    titulo: "Casos em análise",
    subtitulo: "Gerencie seus casos e acompanhe o progresso",
    vazio: "Nenhum caso cadastrado ainda.",
  },
  arquivo: {
    titulo: "Arquivo",
    subtitulo: "Casos arquivados para consulta posterior",
    vazio: "Nenhum caso arquivado.",
  },
};

export function ListaPastaCasos({ pasta }: { pasta: PastaCaso }) {
  const { casos, carregando, moverCaso, excluirCaso } = useListaCasos();
  const visiveis = casos.filter((caso) => pastaDoCaso(caso) === pasta);
  const textos = TEXTOS[pasta];
  const [pendente, setPendente] = useState<Caso | null>(null);

  return (
    <>
      <header className="flex h-16 w-full shrink-0 items-center justify-between px-7 pt-5 pb-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-[22px] leading-none font-bold">{textos.titulo}</h1>
          <p className="text-[13px]">{textos.subtitulo}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {pasta === "ativo" ? (
            <>
              <Link
                href="/casos/arquivo"
                className="pressionavel text-tinta-suave hover:text-tinta flex h-8 items-center rounded-[8px] px-2 text-[12px] font-semibold"
              >
                Arquivados
              </Link>
              <Link
                href="/casos/novo"
                className="pressionavel bg-acao text-acao-tinta flex h-8 w-[112px] items-center justify-center rounded-[8px] text-[12px] font-semibold"
              >
                Novo caso
              </Link>
            </>
          ) : (
            <Link
              href="/casos"
              className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
            >
              Voltar aos casos
            </Link>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-2 pb-7">
        {carregando ? (
          <ListaEsqueleto />
        ) : visiveis.length === 0 ? (
          <p className="text-tinta-suave text-[13px]">{textos.vazio}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visiveis.map((caso) => (
              <li key={caso.id}>
                <CartaoCaso
                  caso={caso}
                  aoArquivar={() => moverCaso(caso.id, "arquivo")}
                  aoRestaurar={() => moverCaso(caso.id, "ativo")}
                  aoExcluir={() => setPendente(caso)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModalConfirmar
        aberto={pendente !== null}
        titulo="Excluir caso"
        descricao={
          pendente
            ? `Apagar “${rotuloCaso(pendente)}”? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmar="Excluir"
        aoFechar={() => setPendente(null)}
        aoConfirmar={() => {
          if (!pendente) return;
          void excluirCaso(pendente.id);
          setPendente(null);
        }}
      />
    </>
  );
}

function CartaoCaso({
  caso,
  aoArquivar,
  aoRestaurar,
  aoExcluir,
}: {
  caso: Caso;
  aoArquivar: () => void;
  aoRestaurar: () => void;
  aoExcluir: () => void;
}) {
  return (
    <div className="bg-superficie border-borda flex h-[64px] w-full items-center gap-2 rounded-[10px] border px-4 py-3">
      <Link href={destinoDoCaso(caso)} className="pressionavel flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="truncate text-[13px] font-semibold">{caso.titulo}</h2>
        <p className="text-tinta-suave truncate text-[12px]">Cliente: {caso.cliente}</p>
      </Link>
      <div className="text-meta flex shrink-0 flex-col items-end gap-1 text-[11px]">
        <p className="font-medium">{STATUS_CASO[caso.status]}</p>
        <p>{formatarDataCurta(caso.atualizadoEm)}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        {pastaDoCaso(caso) === "ativo" ? (
          <BotaoAcao rotulo="Arquivar" aoClicar={aoArquivar}>
            <IconeRepositorio />
          </BotaoAcao>
        ) : (
          <BotaoAcao rotulo="Restaurar" aoClicar={aoRestaurar}>
            <IconeRestaurar />
          </BotaoAcao>
        )}
        <BotaoAcao rotulo="Excluir" aoClicar={aoExcluir}>
          <IconeLixeira />
        </BotaoAcao>
      </div>
    </div>
  );
}

function BotaoAcao({
  rotulo,
  aoClicar,
  children,
}: {
  rotulo: string;
  aoClicar: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={aoClicar}
      className="pressionavel text-tinta-suave hover:bg-tinta/5 flex size-7 items-center justify-center rounded-[6px] [&_span]:scale-90 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li
          key={indice}
          className="bg-superficie border-borda h-[64px] animate-pulse rounded-[10px] border"
        />
      ))}
    </ul>
  );
}
