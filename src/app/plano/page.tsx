"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { IconeCheck } from "@/components/assinatura/icones";
import { BarraResumo, SeletorPlanos } from "@/components/assinatura/seletor-planos";
import { useOfertaAssinatura } from "@/components/assinatura/use-oferta-assinatura";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { api } from "@/lib/api";
import type { IdPlano, Usuario } from "@/lib/api/types";
import { redirecionamentoDosCasos } from "@/lib/conta";
import { descreverCartao } from "@/lib/pagamento/cartao";

export default function PaginaTrocarPlano() {
  const router = useRouter();
  const { oferta, erro: erroOferta } = useOfertaAssinatura();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [escolhido, setEscolhido] = useState<IdPlano | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [trocadoPara, setTrocadoPara] = useState<string | null>(null);

  // Só quem tem assinatura ativa troca de plano; os demais seguem a mesma regra de /casos.
  useEffect(() => {
    let ativo = true;
    api.obterUsuarioAtual().then((atual) => {
      if (!ativo) return;
      const destino = redirecionamentoDosCasos(atual);
      if (destino) router.replace(destino);
      else setUsuario(atual);
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  if (erroOferta) {
    return <p className="text-destructive text-[13px]">Não foi possível carregar os planos. Recarregue a página.</p>;
  }

  if (!usuario || !oferta) {
    return <p className="text-tinta-suave text-[13px]">Carregando seu plano…</p>;
  }

  const assinatura = usuario.assinatura;
  if (!assinatura) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[13px]">Não encontramos uma assinatura ativa nesta conta.</p>
        <Link href="/casos" className="text-destaque text-[13px] font-semibold">
          Voltar aos casos
        </Link>
      </div>
    );
  }

  if (trocadoPara) {
    return (
      <div className="bg-campo border-borda flex w-full max-w-[420px] flex-col items-center gap-3 rounded-[12px] border p-6 text-center">
        <span className="bg-destaque flex size-10 items-center justify-center rounded-full text-white">
          <IconeCheck className="size-5" />
        </span>
        <h1 className="text-[18px] font-bold">Plano alterado</h1>
        <p className="text-tinta-suave text-[13px]">
          Seu plano agora é o <strong className="text-tinta">{trocadoPara}</strong>. A mensalidade continua no
          cartão {descreverCartao(assinatura.cartao)}.
        </p>
        <Link
          href="/casos"
          className="pressionavel bg-acao text-acao-tinta mt-2 flex h-10 items-center rounded-[8px] px-5 text-[13px] font-semibold"
        >
          Voltar aos casos
        </Link>
      </div>
    );
  }

  const plano = oferta.planos.find((item) => item.id === escolhido);
  const planoAtual = oferta.planos.find((item) => item.id === assinatura.planoId);
  const total = oferta.plataforma.precoMensal + (plano ?? planoAtual)!.precoMensal;

  async function confirmarTroca() {
    if (!plano) return;
    setProcessando(true);
    setErro(undefined);
    try {
      await api.trocarPlano(plano.id);
      setConfirmando(false);
      setTrocadoPara(plano.nome);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível alterar o plano.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-6 pb-24">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Alterar plano</h1>
        <p className="text-tinta-suave text-sm">
          Seu plano atual é o <strong className="text-tinta">{assinatura.nomePlano}</strong>. Escolha um novo volume de
          créditos; o cartão {descreverCartao(assinatura.cartao)} continua vinculado.
        </p>
      </div>

      <SeletorPlanos
        oferta={oferta}
        escolhido={escolhido}
        aoEscolher={setEscolhido}
        planoAtual={assinatura.planoId}
      />

      <BarraResumo
        legenda={plano ? `${assinatura.nomePlano} → ${plano.nome}` : "Selecione o novo plano"}
        total={total}
      >
        <button
          type="button"
          disabled={!plano}
          onClick={() => {
            setErro(undefined);
            setConfirmando(true);
          }}
          className="bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-5 text-[13px] font-semibold disabled:opacity-40"
        >
          Trocar plano
        </button>
      </BarraResumo>

      <ModalConfirmar
        aberto={confirmando}
        titulo={`Trocar para o plano ${plano?.nome ?? ""}?`}
        descricao={`Seu plano passa de ${assinatura.nomePlano} para ${plano?.nome ?? ""}. A mensalidade continua no cartão ${descreverCartao(assinatura.cartao)}.`}
        confirmar={processando ? "Alterando…" : "Confirmar troca"}
        processando={processando}
        erro={erro}
        aoFechar={() => setConfirmando(false)}
        aoConfirmar={confirmarTroca}
      />
    </div>
  );
}
