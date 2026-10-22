"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ModalClausulas } from "@/components/casos/modal-clausulas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usuarioDaApi, type UsuarioApi } from "@/lib/api/http/mapeadores";
import { gravarAceiteClausulas, leuAceiteClausulas } from "@/lib/clausulas";
import { rotaInicial } from "@/lib/conta";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

export function FormularioLogin() {
  const router = useRouter();
  const idEmail = useId();
  const idSenha = useId();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [clausulasAbertas, setClausulasAbertas] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  /** Quem ainda não pagou a assinatura vai para ela em vez dos casos. */
  const [destino, setDestino] = useState("/casos");

  async function entrar() {
    const res = await fetch("/api/auth/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const dados = (await res.json().catch(() => ({}))) as { erro?: string; usuario?: UsuarioApi };
    if (!res.ok || !dados.usuario) {
      throw new Error(dados.erro ?? "Não foi possível entrar.");
    }
    return rotaInicial(usuarioDaApi(dados.usuario));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const proxima = await entrar();
      if (leuAceiteClausulas()) {
        router.push(proxima);
        return;
      }
      setDestino(proxima);
      setClausulasAbertas(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={idEmail} className="text-[12px] font-medium">
          Email
        </label>
        <input
          id={idEmail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idSenha} className="text-[12px] font-medium">
          Senha
        </label>
        <input
          id={idSenha}
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className={CLASSE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <AcaoFutura rotulo="Recuperação de senha">Esqueci minha senha</AcaoFutura>
        </div>
        {erro ? (
          <p role="alert" className="text-[12px]">
            {erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando}
          className="bg-acao text-acao-tinta hover:bg-acao/90 flex h-10 w-full items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </div>

      <p className="flex justify-center gap-1 text-[12px]">
        <span className="text-tinta-suave">Não tem conta?</span>
        <Link href="/criar-conta" className="text-[12px] font-semibold">
          Criar conta
        </Link>
      </p>

      <ModalClausulas
        aberto={clausulasAbertas}
        modo="aceite"
        aoFechar={() => setClausulasAbertas(false)}
        aoConfirmar={() => {
          gravarAceiteClausulas();
          setClausulasAbertas(false);
          router.push(destino);
        }}
      />
    </form>
  );
}

/** Telas que existem no protótipo mas ainda não foram implementadas. */
function AcaoFutura({
  rotulo,
  className,
  children,
}: {
  rotulo: string;
  className?: string;
  children: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            disabled
            className={`text-[12px] font-medium disabled:pointer-events-auto ${className ?? ""}`}
          >
            {children}
          </button>
        }
      />
      <TooltipContent side="bottom">{rotulo} · em breve</TooltipContent>
    </Tooltip>
  );
}
