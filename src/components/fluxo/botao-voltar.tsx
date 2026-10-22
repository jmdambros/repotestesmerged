"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const ContextoVoltar = createContext<((destino: string) => void) | null>(null);

/** Lista, um caso ou o fluxo de conta — a seta não atravessa esses contextos. */
function moduloDoCaminho(caminho: string) {
  if (
    caminho === "/login" ||
    caminho.startsWith("/criar-conta") ||
    caminho.startsWith("/pagamento") ||
    caminho.startsWith("/assinatura")
  ) {
    return "conta";
  }
  const id = caminho.match(/^\/casos\/([^/]+)/)?.[1];
  if (id && id !== "novo" && id !== "arquivo") {
    return caminho.includes("/repositorio") ? `repositorio:${id}` : `caso:${id}`;
  }
  return "casos";
}

export function ProvedorNavegacao({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const caminhos = useRef<string[]>([]);

  useEffect(() => {
    const historico = caminhos.current;
    if (historico.at(-1) === pathname) return;
    // Encerrar a sessão não deve ficar no meio do voltar.
    if (historico.at(-1)?.endsWith("/sessao") && /\/(analise|gravacao)$/.test(pathname)) {
      historico.pop();
    }
    const moduloAtual = moduloDoCaminho(pathname);
    const moduloAnterior = historico.at(-1) ? moduloDoCaminho(historico.at(-1)!) : null;
    if (moduloAnterior && moduloAnterior !== moduloAtual) {
      caminhos.current = [pathname];
      return;
    }
    if (historico.at(-1) !== pathname) historico.push(pathname);
  }, [pathname]);

  function voltar(destino: string) {
    const historico = caminhos.current;
    const moduloAtual = moduloDoCaminho(pathname);
    if (historico.at(-1) === pathname) historico.pop();
    while (historico.length && moduloDoCaminho(historico.at(-1)!) !== moduloAtual) {
      historico.pop();
    }
    const anterior = historico.at(-1);
    router.replace(anterior ?? destino);
  }

  return <ContextoVoltar value={voltar}>{children}</ContextoVoltar>;
}

export function BotaoVoltar({ destino, aoVoltar, desabilitado = false }: {
  destino: string;
  aoVoltar?: () => void;
  desabilitado?: boolean;
}) {
  const voltar = useContext(ContextoVoltar);
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Voltar"
      title="Voltar"
      disabled={desabilitado}
      onClick={aoVoltar ?? (() => voltar ? voltar(destino) : router.replace(destino))}
      className="pressionavel text-tinta-suave hover:bg-tinta/5 flex size-6 shrink-0 items-center justify-center rounded-[6px] disabled:opacity-50"
    >
      <ArrowLeft size={14} aria-hidden="true" />
    </button>
  );
}
