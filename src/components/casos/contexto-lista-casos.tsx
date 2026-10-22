"use client";

import { createContext, useContext } from "react";

import type { Caso, DadosNovoCaso, PastaCaso } from "@/lib/api/types";
import type { ConteudoCaso } from "@/lib/api/analise";

interface ValorListaCasos {
  casos: Caso[];
  carregando: boolean;
  finalizarSessao: (id: string, transcricao: ConteudoCaso["transcricao"]) => Promise<void>;
  criarCaso: (dados: DadosNovoCaso) => Promise<Caso>;
  moverCaso: (id: string, pasta: PastaCaso) => Promise<void>;
  excluirCaso: (id: string) => Promise<void>;
}

const ContextoListaCasos = createContext<ValorListaCasos>({
  casos: [],
  carregando: true,
  finalizarSessao: async () => {
    throw new Error("ProvedorListaCasos ausente");
  },
  criarCaso: async () => {
    throw new Error("ProvedorListaCasos ausente");
  },
  moverCaso: async () => {
    throw new Error("ProvedorListaCasos ausente");
  },
  excluirCaso: async () => {
    throw new Error("ProvedorListaCasos ausente");
  },
});

export const ProvedorListaCasos = ContextoListaCasos.Provider;

export function useListaCasos() {
  return useContext(ContextoListaCasos);
}
