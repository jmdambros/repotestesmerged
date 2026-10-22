"use client";

import { TelaAnalise } from "@/components/analise/tela-analise";
import { ConteudoCaso } from "@/components/fluxo/conteudo-caso";

export default function PaginaAnalise() {
  return (
    <ConteudoCaso>
      {(dados) => (
        <TelaAnalise
          dados={dados}
          destinoVoltar={`/casos/${dados.casoId}/gravacao`}
          destinoChat={`/casos/${dados.casoId}/repositorio/chat`}
        />
      )}
    </ConteudoCaso>
  );
}
