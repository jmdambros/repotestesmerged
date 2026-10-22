"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { ColunasAnalise } from "@/components/analise/colunas-analise";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";

export function TelaAnalise({
  dados,
  destinoVoltar,
  destinoChat,
}: {
  dados: DadosCaso;
  destinoVoltar: string;
  destinoChat: string;
}) {
  const [analise, setAnalise] = useState(dados.analise);
  const [configurando, setConfigurando] = useState(false);
  const [instrucao, setInstrucao] = useState(analise?.instrucao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function configurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro("");
    try {
      setAnalise(
        await api.solicitarAnalise(dados.casoId, instrucao.trim() || undefined),
      );
      setConfigurando(false);
    } catch {
      setErro("Não foi possível salvar a configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 px-8 pt-5 pb-3 min-[1050px]:h-[72px] min-[1050px]:flex-nowrap min-[1050px]:pt-[17px] min-[1050px]:pb-[9px] max-[700px]:px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <BotaoVoltar destino={destinoVoltar} />
            <h1 className="text-[22px] leading-[27px] font-bold">
              Análise preliminar de caso
            </h1>
          </div>
          <p className="text-tinta-suave text-[12px] leading-[15px]">
            Insights gerados a partir da transcrição e documentos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfigurando(true)}
            className="pressionavel bg-campo border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium"
          >
            Configurar IA
          </button>
          <Link
            href={destinoChat}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
          >
            Gerar peça processual
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-[14px] px-8 pt-1 pb-5 max-[700px]:px-4">
        <section className="border-borda bg-campo flex min-h-[88px] flex-col gap-2 rounded-[10px] border px-[14px] py-3">
          <h2 className="text-[13px] leading-4 font-semibold">
            Transcrição do áudio do cliente e documentos juntados
          </h2>
          <p className="text-tinta-suave text-[11px] leading-[13px]">
            {analise?.resumo ?? "Nenhuma análise disponível para este caso."}
          </p>
        </section>
        {analise ? (
          <ColunasAnalise analise={analise} />
        ) : (
          <Link
            href={`/casos/${dados.casoId}/gravacao`}
            className="text-destaque self-start text-[13px] underline"
          >
            Ir para a gravação
          </Link>
        )}
      </div>
      <ModalFluxo
        aberto={configurando}
        aoFechar={() => {
          if (!salvando) setConfigurando(false);
        }}
        titulo="Configurar IA"
        descricao="Orientações para a análise deste caso."
      >
        <form onSubmit={configurar} className="mt-4 flex flex-col gap-3">
          <label htmlFor="instrucao-ia" className="text-[13px] font-medium">
            Instruções adicionais
          </label>
          <textarea
            id="instrucao-ia"
            value={instrucao}
            onChange={(evento) => setInstrucao(evento.target.value)}
            maxLength={4000}
            rows={5}
            className="bg-campo border-borda focus:border-destaque w-full resize-y rounded-[8px] border p-3 text-[13px] outline-none"
          />
          {erro ? (
            <p role="alert" className="text-[12px]">
              {erro}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={salvando}
            className="pressionavel bg-acao text-acao-tinta flex h-8 items-center justify-center rounded-[8px] px-3 text-[12px] font-semibold disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar configuração"}
          </button>
        </form>
      </ModalFluxo>
    </>
  );
}
