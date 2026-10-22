"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hamburguer,
  IconeCasos,
  IconeConfiguracoes,
  IconeNovoCaso,
  IconeRepositorio,
  IconeSair,
} from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { ModalConfiguracoes } from "@/components/casos/modal-configuracoes";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Caso } from "@/lib/api/types";
import { destinoDoCaso } from "@/lib/casos/destino";
import { pastaDoCaso, rotuloCaso } from "@/lib/casos/rotulo";
import { normalizar } from "@/lib/texto";
import { cn } from "@/lib/utils";

interface BarraLateralCasosProps {
  casos: Caso[];
  carregando?: boolean;
}

function classeTrilha(ativo: boolean) {
  return cn(
    "pressionavel flex h-8 items-center justify-center rounded-[8px] px-1",
    ativo && "bg-destaque-suave border-destaque border-[1.5px]",
  );
}

export function BarraLateralCasos({ casos, carregando = false }: BarraLateralCasosProps) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");
  const [expandida, setExpandida] = useState(true);
  const segmento = pathname.match(/^\/casos\/([^/]+)/)?.[1] ?? null;
  const rotaDePainel = segmento === "novo" || segmento === "arquivo";
  const idDaRota = segmento && !rotaDePainel ? segmento : null;

  const casosAtivos = useMemo(
    () => casos.filter((caso) => pastaDoCaso(caso) === "ativo"),
    [casos],
  );

  const casosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return casosAtivos;
    return casosAtivos.filter((caso) => normalizar(`${caso.titulo} ${caso.cliente}`).includes(termo));
  }, [busca, casosAtivos]);

  const idEmDestaque = idDaRota;

  return (
    <aside
      className={cn(
        "bg-barra flex shrink-0 items-start overflow-hidden px-2 py-2.5 transition-[width] duration-200 ease-out",
        expandida ? "w-[248px]" : "w-[56px]",
      )}
    >
      <TrilhaIcones
        expandida={expandida}
        aoAlternar={() => setExpandida((atual) => !atual)}
        casoId={idDaRota ?? casosAtivos[0]?.id}
      />

      {expandida ? (
        <div
          id="painel-lista-casos"
          className="bg-painel flex h-full min-w-px flex-1 flex-col gap-2 rounded-[8px] px-2.5 py-3"
        >
          <p className="text-[13px] font-bold">SOPHIA</p>
          <h2 className="text-[11px] font-semibold">Casos em análise</h2>

          <div className="border-borda focus-within:border-destaque bg-campo flex h-7 w-full items-center gap-1.5 rounded-[7px] border px-2">
            <span aria-hidden className="text-tinta-suave text-[11px]">
              ⌕
            </span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar"
              aria-label="Buscar caso ou cliente"
              className="text-tinta-suave placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {carregando ? (
              <ListaEsqueleto />
            ) : casosFiltrados.length === 0 ? (
              <p className="text-tinta-suave py-4 text-[11px]">Nenhum caso encontrado.</p>
            ) : (
              <ul className="flex w-full flex-col gap-[6px]">
                {casosFiltrados.map((caso) => (
                  <li key={caso.id}>
                    <Link
                      href={destinoDoCaso(caso, pathname)}
                      aria-current={caso.id === idEmDestaque ? "page" : undefined}
                      className={cn(
                        "pressionavel flex min-h-8 w-full items-center rounded-[7px] px-2 py-1.5 text-left text-[10px] leading-tight font-medium",
                        caso.id === idEmDestaque
                          ? "border-destaque bg-ativo text-ativo-tinta border-[1.5px]"
                          : "bg-chip text-meta border-borda hover:border-destaque/60 border",
                      )}
                    >
                      <span className="line-clamp-2">{rotuloCaso(caso)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function TrilhaIcones({
  expandida,
  aoAlternar,
  casoId,
}: {
  expandida: boolean;
  aoAlternar: () => void;
  casoId?: string;
}) {
  const pathname = usePathname();
  const [configuracoesAberta, setConfiguracoesAberta] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  function pedirSaida() {
    setConfiguracoesAberta(false);
    setConfirmarSaida(true);
  }
  const emRepositorio = pathname.includes("/repositorio");
  const emCasos =
    !emRepositorio &&
    (pathname === "/casos" ||
      pathname.includes("/gravacao") ||
      pathname.includes("/sessao") ||
      pathname.includes("/analise"));

  return (
    <nav className="bg-trilha flex h-full w-10 flex-col items-center gap-1.5 rounded-[8px] px-1 pt-1 pb-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-expanded={expandida}
              aria-controls="painel-lista-casos"
              onClick={aoAlternar}
              className="hover:bg-tinta/5 flex h-6 w-full items-center justify-center rounded-[6px]"
            >
              <Hamburguer />
              <span className="sr-only">
                {expandida ? "Recolher lista de casos" : "Expandir lista de casos"}
              </span>
            </button>
          }
        />
        <TooltipContent side="right">
          {expandida ? "Recolher lista" : "Expandir lista"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/casos/novo"
              aria-current={pathname === "/casos/novo" ? "page" : undefined}
              className={classeTrilha(pathname === "/casos/novo")}
            >
              <IconeNovoCaso />
              <span className="sr-only">Novo caso</span>
            </Link>
          }
        />
        <TooltipContent side="right">Novo caso</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link href="/casos" aria-current={emCasos ? "page" : undefined} className={classeTrilha(emCasos)}>
              <IconeCasos />
              <span className="sr-only">Casos em análise</span>
            </Link>
          }
        />
        <TooltipContent side="right">Casos em análise</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={casoId ? `/casos/${casoId}/repositorio` : "/casos"}
              aria-current={emRepositorio ? "page" : undefined}
              className={classeTrilha(emRepositorio)}
            >
              <IconeRepositorio />
              <span className="sr-only">Repositório</span>
            </Link>
          }
        />
        <TooltipContent side="right">Repositório</TooltipContent>
      </Tooltip>

      <span className="flex-1" />

      <Tooltip>
        <TooltipTrigger
          render={
            <span className="flex justify-center">
              <BotaoTema />
            </span>
          }
        />
        <TooltipContent side="right">
          <span className="dark:hidden">Modo escuro</span>
          <span className="hidden dark:inline">Modo claro</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={configuracoesAberta}
              onClick={() => setConfiguracoesAberta(true)}
              className={classeTrilha(configuracoesAberta)}
            >
              <IconeConfiguracoes />
              <span className="sr-only">Configurações</span>
            </button>
          }
        />
        <TooltipContent side="right">Configurações</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => setConfirmarSaida(true)}
              className="pressionavel flex h-8 items-center justify-center rounded-[8px] px-1"
            >
              <IconeSair />
              <span className="sr-only">Sair</span>
            </button>
          }
        />
        <TooltipContent side="right">Sair</TooltipContent>
      </Tooltip>

      <ModalConfiguracoes
        aberto={configuracoesAberta}
        aoFechar={() => setConfiguracoesAberta(false)}
        aoPedirSaida={pedirSaida}
      />
      <ModalConfirmar
        aberto={confirmarSaida}
        titulo="Sair da conta"
        descricao="Deseja mesmo sair? Você voltará para a tela de login."
        confirmar="Sair"
        aoFechar={() => setConfirmarSaida(false)}
        aoConfirmar={() => {
          window.location.assign("/sair");
        }}
      />
    </nav>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-[6px]" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li key={indice} className="bg-superficie h-8 animate-pulse rounded-[7px]" />
      ))}
    </ul>
  );
}
