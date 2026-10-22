"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { OfertaAssinatura } from "@/lib/api/types";

/** Plataforma e planos vêm da API, para preço e textos mudarem sem deploy do front. */
export function useOfertaAssinatura() {
  const [oferta, setOferta] = useState<OfertaAssinatura | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    api
      .obterOfertaAssinatura()
      .then((resultado) => {
        if (ativo) setOferta(resultado);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { oferta, erro, carregando: !oferta && !erro };
}
