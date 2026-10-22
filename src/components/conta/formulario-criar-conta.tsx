"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampoConta } from "./campo-conta";

export function FormularioCriarConta() {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function validarSenhas() {
    const campos = formulario.current?.elements;
    const senha = campos?.namedItem("senha") as HTMLInputElement | null;
    const confirmar = campos?.namedItem(
      "confirmarSenha",
    ) as HTMLInputElement | null;
    confirmar?.setCustomValidity(
      senha?.value === confirmar.value ? "" : "As senhas devem ser iguais.",
    );
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    validarSenhas();
    if (!evento.currentTarget.reportValidity() || enviando) return;
    const campos = evento.currentTarget.elements;
    const nome = (campos.namedItem("nome") as HTMLInputElement).value;
    const email = (campos.namedItem("email") as HTMLInputElement).value;
    const senha = (campos.namedItem("senha") as HTMLInputElement).value;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/auth/criar-conta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const dados = (await res.json().catch(() => ({}))) as { erro?: string };
      if (!res.ok) {
        throw new Error(dados.erro ?? "Não foi possível criar a conta.");
      }
      router.push("/assinatura");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      ref={formulario}
      onSubmit={aoEnviar}
      className="flex w-full max-w-[440px] flex-col gap-[10px]"
    >
      <h1 className="text-[24px] leading-[29px] font-bold">Criar conta</h1>
      <p className="text-tinta-suave text-[14px] leading-[17px]">
        Comece a usar a Sophia no seu escritório
      </p>
      <CampoConta
        rotulo="Nome completo"
        name="nome"
        autoComplete="name"
        required
        maxLength={150}
      />
      <CampoConta
        rotulo="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <CampoConta
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        onChange={validarSenhas}
      />
      <CampoConta
        rotulo="Confirmar senha"
        name="confirmarSenha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        onChange={validarSenhas}
      />
      {erro ? (
        <p role="alert" className="text-[12px]">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="pressionavel bg-acao text-acao-tinta flex h-10 items-center justify-center rounded-[8px] text-[13px] font-semibold disabled:opacity-60"
      >
        {enviando ? "Criando…" : "Criar conta"}
      </button>
      <p className="flex min-h-[100px] flex-wrap items-start gap-1 text-[13px] leading-4">
        <span className="text-tinta-suave">Já tem uma conta?</span>
        <Link href="/login" className="pressionavel font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}
