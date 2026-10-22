"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";
import { api } from "@/lib/api";
import type { MensagemChat } from "@/lib/api/analise";
import { cn } from "@/lib/utils";

const ASSUNTOS = ["Tema 975 STF", "Dano moral", "Perícia técnica"];

export default function PaginaChatRepositorio() {
  return (
    <Suspense
      fallback={
        <p className="text-tinta-suave p-8 text-[13px]">Carregando chat…</p>
      }
    >
      <ConteudoCaso>{(dados) => <Chat casoId={dados.casoId} />}</ConteudoCaso>
    </Suspense>
  );
}

function Chat({ casoId }: { casoId: string }) {
  const parametros = useSearchParams();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [pergunta, setPergunta] = useState(parametros.get("pergunta") ?? "");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    let ativo = true;
    api
      .listarMensagens(casoId)
      .then((lista) => {
        if (ativo) setMensagens(lista);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar as mensagens.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [casoId, tentativa]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pergunta.trim() || envioEmCurso.current || carregando) return;
    envioEmCurso.current = true;
    setEnviando(true);
    setErro("");
    try {
      const novas = await api.enviarMensagem(casoId, pergunta);
      setMensagens((atuais) => [...atuais, ...novas]);
      setPergunta("");
      campo.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      campo.current?.focus();
    } catch {
      setErro("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      setEnviando(false);
      envioEmCurso.current = false;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <BotaoVoltar destino={`/casos/${casoId}/repositorio/analise`} />
          <h1 className="text-[22px] leading-none font-bold">
            Interação com a IA jurídica
          </h1>
        </div>
        <p className="text-tinta-suave text-[13px]">
          Continue o fluxo de análise com perguntas e novos caminhos
        </p>
      </header>
      <div
        className="flex shrink-0 flex-wrap items-start gap-2 px-7 pt-2 pb-2"
        aria-label="Assuntos sugeridos"
      >
        {ASSUNTOS.map((assunto) => (
          <button
            type="button"
            key={assunto}
            onClick={() => {
              setPergunta(assunto);
              campo.current?.focus();
            }}
            className={cn(
              "bg-campo flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium",
              pergunta === assunto
                ? "border-destaque text-destaque"
                : "border-borda",
            )}
          >
            {assunto}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-7 pt-2 pb-6">
        <div
          role="log"
          aria-label="Conversa com a IA"
          aria-live="polite"
          aria-busy={carregando || enviando}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
        >
          {carregando ? (
            <p role="status" className="text-tinta-suave text-[13px]">
              Carregando mensagens...
            </p>
          ) : mensagens.length === 0 && !erro ? (
            <p className="text-tinta-suave text-[13px]">
              Nenhuma mensagem neste caso.
            </p>
          ) : null}
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={cn(
                "bg-campo flex min-h-12 w-full items-center rounded-[10px] px-4 py-3 text-[13px] leading-4 [overflow-wrap:anywhere]",
                mensagem.papel === "assistente" && "border-borda border",
              )}
            >
              <span className="sr-only">
                {mensagem.papel === "assistente" ? "Sophia: " : "Você: "}
              </span>
              <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
            </div>
          ))}
        </div>
        <form
          onSubmit={enviar}
          className="flex w-full shrink-0 items-center gap-2 max-[450px]:flex-wrap"
        >
          <label htmlFor="pergunta-chat" className="sr-only">
            Pergunte algo sobre o caso
          </label>
          <input
            ref={campo}
            id="pergunta-chat"
            value={pergunta}
            onChange={(evento) => setPergunta(evento.target.value)}
            maxLength={4000}
            readOnly={enviando}
            placeholder="Pergunte algo sobre o caso..."
            autoComplete="off"
            className="bg-campo border-borda placeholder:text-tinta-suave focus:border-destaque h-8 min-w-0 flex-1 rounded-[8px] border px-3 text-[12px] outline-none max-[450px]:basis-full"
          />
          <button
            type="submit"
            disabled={carregando || enviando}
            className="pressionavel bg-acao text-acao-tinta flex h-8 w-[74px] shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold disabled:opacity-60"
          >
            {enviando ? "Enviando" : "Enviar"}
          </button>
        </form>
        {erro ? (
          <div role="alert" className="text-tinta-suave shrink-0 text-[13px]">
            <p>{erro}</p>
            {mensagens.length === 0 ? (
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => {
                  setErro("");
                  setCarregando(true);
                  setTentativa((valor) => valor + 1);
                }}
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
