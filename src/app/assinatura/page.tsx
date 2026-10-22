"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BarraResumo, SeletorPlanos } from "@/components/assinatura/seletor-planos";
import { useOfertaAssinatura } from "@/components/assinatura/use-oferta-assinatura";
import type { IdPlano } from "@/lib/api/types";

export default function PaginaPlanos() {
  const router = useRouter();
  const { oferta, erro, carregando } = useOfertaAssinatura();
  const [escolhido, setEscolhido] = useState<IdPlano | null>(null);

  if (carregando) {
    return <p className="text-tinta-suave text-[13px]">Carregando planos…</p>;
  }

  if (erro || !oferta) {
    return <p className="text-destructive text-[13px]">Não foi possível carregar os planos. Recarregue a página.</p>;
  }

  const plano = oferta.planos.find((item) => item.id === escolhido);
  const total = oferta.plataforma.precoMensal + (plano?.precoMensal ?? 0);

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-6 pb-24">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Escolha seu plano</h1>
        <p className="text-tinta-suave text-sm">
          Assinatura mensal da plataforma + créditos de IA para usar nos seus casos.
        </p>
      </div>

      <SeletorPlanos oferta={oferta} escolhido={escolhido} aoEscolher={setEscolhido} />

      <BarraResumo
        legenda={
          plano ? `${oferta.plataforma.nome} + plano ${plano.nome}` : "Selecione um plano de créditos para continuar"
        }
        total={total}
      >
        <button
          type="button"
          disabled={!plano}
          onClick={() => plano && router.push(`/assinatura/pagamento?plano=${plano.id}`)}
          className="bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-5 text-[13px] font-semibold disabled:opacity-40"
        >
          Continuar para pagamento
        </button>
      </BarraResumo>
    </div>
  );
}
