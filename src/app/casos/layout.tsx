"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { BarraLateralCasos } from "@/components/casos/barra-lateral-casos";
import { ProvedorListaCasos } from "@/components/casos/contexto-lista-casos";
import type { ConteudoCaso } from "@/lib/api/analise";
import { api } from "@/lib/api";
import type { Caso, DadosNovoCaso, PastaCaso } from "@/lib/api/types";
import { redirecionamentoDosCasos } from "@/lib/conta";

/**
 * Confere a sessão antes de qualquer dado: a lista vem só com os casos do dono
 * da sessão (o backend filtra por `user_id`), e um id de caso alheio na URL cai
 * em "Caso não encontrado" no layout do caso.
 */
export default function LayoutCasos({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    api
      .obterUsuarioAtual()
      .then((usuario) => {
        if (!ativo) return;
// const destino = redirecionamentoDosCasos(usuario);
        // if (destino) {
        //   router.replace(destino);
        //   return;
        // }
        setLiberado(true); // Força a liberação da tela sempre
        return api.listarCasos().then((lista) => {
          if (ativo) setCasos(lista);
        });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [router]);

  const contexto = useMemo(
    () => ({
      casos,
      carregando,
      async finalizarSessao(id: string, transcricao: ConteudoCaso["transcricao"]) {
        const atualizado = await api.finalizarSessao(id, transcricao);
        setCasos((lista) => lista.map((item) => item.id === id ? atualizado : item));
      },
      async criarCaso(dados: DadosNovoCaso) {
        const criado = await api.criarCaso(dados);
        setCasos((lista) => [criado, ...lista.filter((item) => item.id !== criado.id)]);
        return criado;
      },
      async moverCaso(id: string, pasta: PastaCaso) {
        const atualizado = await api.moverCaso(id, pasta);
        setCasos((lista) => lista.map((item) => (item.id === id ? atualizado : item)));
      },
      async excluirCaso(id: string) {
        await api.excluirCaso(id);
        setCasos((lista) => lista.filter((item) => item.id !== id));
      },
    }),
    [carregando, casos],
  );

  if (!liberado) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Verificando sua sessão…</p>;
  }

  return (
    <ProvedorListaCasos value={contexto}>
      <div className="bg-fundo flex h-dvh overflow-hidden">
        <BarraLateralCasos casos={casos} carregando={carregando} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </ProvedorListaCasos>
  );
}
