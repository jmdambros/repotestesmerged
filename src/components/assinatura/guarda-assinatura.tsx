"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { Usuario } from "@/lib/api/types";
import { rotaInicial } from "@/lib/conta";

/**
 * A assinatura é sempre de um usuário: sem sessão volta para o login, e quem
 * já pagou não tem o que fazer aqui. Mostra a conta para o usuário confirmar
 * em nome de quem está assinando.
 */
export function GuardaAssinatura({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let ativo = true;
    api.obterUsuarioAtual().then((atual) => {
      if (!ativo) return;
      if (!atual) router.replace("/login");
      else if (atual.statusConta === "ativa") router.replace(rotaInicial(atual));
      else setUsuario(atual);
    });

    return () => {
      ativo = false;
    };
  }, [router]);

  if (!usuario) {
    return <p className="text-tinta-suave text-[13px]">Carregando sua conta…</p>;
  }

  return (
    <>
      <p className="bg-campo border-borda -mt-3 flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[12px]">
        <span className="bg-destaque-suave text-destaque flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
          {usuario.nome.trim().charAt(0).toUpperCase()}
        </span>
        <span className="truncate">
          <span className="font-semibold">{usuario.nome}</span>
          <span className="text-tinta-suave"> · {usuario.email}</span>
        </span>
      </p>
      {children}
    </>
  );
}
