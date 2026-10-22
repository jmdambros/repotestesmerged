"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@base-ui/react/tabs";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type {
  ConteudoCaso as DadosCaso,
  DocumentoCaso,
} from "@/lib/api/analise";
import { cn } from "@/lib/utils";

const ABAS = [
  { id: "transcricao", titulo: "Transcrição" },
  { id: "documentos", titulo: "Documentos" },
  { id: "analise", titulo: "Análise" },
  { id: "historico", titulo: "Histórico" },
];

export default function PaginaRepositorio() {
  return (
    <ConteudoCaso>{(dados) => <Repositorio dados={dados} />}</ConteudoCaso>
  );
}

function Repositorio({ dados }: { dados: DadosCaso }) {
  const [documento, setDocumento] = useState<DocumentoCaso | null>(null);
  return (
    <>
      <header className="flex w-full shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[22px] leading-none font-bold">
            Repositório do caso
          </h1>
          <p className="text-[13px]">{dados.titulo}</p>
        </div>
        <Link
          href={`/casos/${dados.casoId}/repositorio/analise`}
          className="pressionavel bg-campo border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium"
        >
          Abrir análise do caso
        </Link>
      </header>
      <Tabs.Root
        defaultValue="transcricao"
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List
          aria-label="Conteúdo do repositório"
          className="flex min-h-11 shrink-0 flex-wrap items-start gap-2 px-7"
        >
          {ABAS.map((aba) => (
            <Tabs.Tab
              key={aba.id}
              value={aba.id}
              className={cn(
                "bg-campo border-borda data-active:border-destaque data-active:bg-destaque-suave flex h-8 items-center rounded-[8px] border px-3 text-[12px] data-active:font-semibold",
                aba.id === "analise" && "text-tinta-suave",
              )}
            >
              {aba.titulo}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel
          value="transcricao"
          className="flex flex-col gap-[10px] px-7 pt-4 pb-6"
        >
          {dados.transcricao.length ? (
            dados.transcricao.map((fala) => (
              <p
                key={fala.id}
                className={cn(
                  "bg-campo border-borda flex min-h-12 items-center rounded-[10px] border px-4 py-3 text-[13px] leading-4",
                  fala.papel === "cliente" && "text-tinta-suave",
                )}
              >
                [{fala.tempo}] {fala.texto}
              </p>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma transcrição neste caso.
            </p>
          )}
        </Tabs.Panel>
        <Tabs.Panel
          value="documentos"
          className="flex flex-col gap-[10px] px-7 pt-4 pb-6"
        >
          {dados.documentos.length ? (
            dados.documentos.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setDocumento(item)}
                className="border-borda bg-campo flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-left text-[13px]"
              >
                <span>{item.nome}</span>
                <span className="text-tinta-suave text-[11px]">
                  {item.tipo} ·{" "}
                  {item.sanitizacao.status === "pendente"
                    ? "Verificação pendente"
                    : item.sanitizacao.status === "limpo"
                      ? "Verificado"
                      : "Conteudo suspeito"}
                </span>
              </button>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhum documento neste caso.
            </p>
          )}
        </Tabs.Panel>
        <Tabs.Panel
          value="analise"
          className="flex flex-col gap-4 px-7 pt-4 pb-6"
        >
          {dados.analise ? (
            <ColunasAnalise analise={dados.analise} />
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma análise neste caso.
            </p>
          )}
        </Tabs.Panel>
        <Tabs.Panel
          value="historico"
          className="flex flex-col gap-[10px] px-7 pt-4 pb-6"
        >
          {dados.historico.length ? (
            dados.historico.map((evento) => (
              <div
                key={evento.id}
                className="border-borda bg-campo flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-[13px]"
              >
                <p>{evento.descricao}</p>
                <time
                  dateTime={evento.data}
                  className="text-tinta-suave text-[11px]"
                >
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(evento.data))}
                </time>
              </div>
            ))
          ) : (
            <p className="text-tinta-suave text-[13px]">
              Nenhum evento neste caso.
            </p>
          )}
        </Tabs.Panel>
      </Tabs.Root>
      <ModalFluxo
        aberto={!!documento}
        aoFechar={() => setDocumento(null)}
        titulo={documento?.nome ?? "Documento"}
        descricao="Documento de demonstração do caso. O arquivo original estará disponível após a integração do repositório."
      />
    </>
  );
}
