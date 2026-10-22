"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { api } from "@/lib/api";
import type { ConteudoCaso as DadosCaso } from "@/lib/api/analise";
import { formatarDuracao } from "@/lib/formato";
import { obterTranscricaoDoCaso } from "@/lib/transcricao/fluxo";

export function ConteudoCaso({
  children,
}: {
  children: (dados: DadosCaso) => ReactNode;
}) {
  const { casoId } = useParams<{ casoId: string }>();
  return (
    <CarregarConteudo key={casoId} casoId={casoId}>
      {children}
    </CarregarConteudo>
  );
}

function CarregarConteudo({
  casoId,
  children,
}: {
  casoId: string;
  children: (dados: DadosCaso) => ReactNode;
}) {
  const { casos, carregando } = useListaCasos();
  const existe = casos.some((caso) => caso.id === casoId);
  const [dados, setDados] = useState<DadosCaso | null>(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (carregando || !existe) return;
    let ativo = true;
    api
      .obterCaso(casoId)
      .then(async (carregado) => {
        const salva = await obterTranscricaoDoCaso(casoId);
        if (salva.texto) {
          const tempoLocal = carregado.transcricao.find((fala) => fala.tempo && fala.tempo !== "00:00")?.tempo;
          carregado.transcricao = [
            {
              id: `${casoId}-transcricao`,
              tempo:
                salva.duracaoSegundos != null ? formatarDuracao(salva.duracaoSegundos) : (tempoLocal ?? "00:00"),
              texto: salva.texto,
              papel: "cliente",
            },
          ];
        }
        if (ativo) setDados(carregado);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o caso.");
      });
    return () => {
      ativo = false;
    };
  }, [carregando, existe, casoId, tentativa]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {!carregando && !existe ? (
        <div className="p-8 text-[13px]">
          <p>Caso não encontrado.</p>
          <Link
            className="text-destaque mt-3 inline-block underline"
            href="/casos"
          >
            Voltar para os casos
          </Link>
        </div>
      ) : erro ? (
        <div className="p-8 text-[13px]" role="alert">
          <p>{erro}</p>
          <button
            type="button"
            className="text-destaque mt-3 underline"
            onClick={() => {
              setErro("");
              setTentativa((valor) => valor + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : dados ? (
        children(dados)
      ) : (
        <p role="status" className="text-tinta-suave p-8 text-[13px]">
          Carregando caso…
        </p>
      )}
    </div>
  );
}
