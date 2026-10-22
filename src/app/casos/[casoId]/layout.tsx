"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";

/**
 * Barreira única para tudo em `/casos/[casoId]/*`: a lista só tem casos do dono da
 * sessão, então um id de outro usuário na URL nunca chega a renderizar a página.
 */
export default function LayoutCaso({ children }: { children: ReactNode }) {
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando } = useListaCasos();

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!casos.some((item) => item.id === casoId)) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Caso não encontrado.</p>;
  }

  return children;
}
