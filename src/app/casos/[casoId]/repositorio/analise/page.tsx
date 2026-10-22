"use client";

import { TelaAnalise } from "@/components/analise/tela-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";

export default function PaginaAnaliseRepositorio() {
  return (
    <ConteudoCaso>
      {(dados) => (
        <TelaAnalise
          dados={dados}
          destinoVoltar={`/casos/${dados.casoId}/repositorio`}
          destinoChat={`/casos/${dados.casoId}/repositorio/chat`}
        />
      )}
    </ConteudoCaso>
  );
}
