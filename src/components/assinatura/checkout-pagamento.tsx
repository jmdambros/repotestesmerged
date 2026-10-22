"use client";

import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CartaoVisual } from "@/components/assinatura/cartao-visual";
import { IconeCadeado, IconeCheck } from "@/components/assinatura/icones";
import { useOfertaAssinatura } from "@/components/assinatura/use-oferta-assinatura";
import { api } from "@/lib/api";
import type { OfertaAssinatura, Plano } from "@/lib/api/types";
import { formatarMoeda } from "@/lib/formato";
import { gateway } from "@/lib/pagamento";
import {
  cpfValido,
  detectarBandeira,
  formatarCpf,
  formatarNumeroCartao,
  formatarValidade,
  lerValidade,
  numeroCartaoValido,
  ROTULO_BANDEIRA,
  soDigitos,
  tamanhoCvv,
  tamanhoNumero,
  validadeValida,
} from "@/lib/pagamento/cartao";
import { cn } from "@/lib/utils";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-11 w-full rounded-[8px] border px-3 text-[14px] outline-none focus:ring-2 aria-invalid:border-destructive aria-invalid:focus:ring-destructive/20";

type CampoCartao = "numero" | "nome" | "validade" | "cvv" | "cpf";

interface ValoresCartao {
  /** Só dígitos. */
  numero: string;
  nome: string;
  /** "MM/AA". */
  validade: string;
  cvv: string;
  /** "000.000.000-00". */
  cpf: string;
}

function validar(valores: ValoresCartao): Partial<Record<CampoCartao, string>> {
  const bandeira = detectarBandeira(valores.numero);
  const erros: Partial<Record<CampoCartao, string>> = {};
  if (!valores.numero) erros.numero = "Informe o número do cartão.";
  else if (!numeroCartaoValido(valores.numero)) erros.numero = "Número de cartão inválido.";
  if (valores.nome.trim().length < 3) erros.nome = "Informe o nome como está no cartão.";
  if (!validadeValida(valores.validade)) erros.validade = "Validade inválida ou vencida.";
  if (valores.cvv.length !== tamanhoCvv(bandeira)) {
    erros.cvv = `O código tem ${tamanhoCvv(bandeira)} dígitos.`;
  }
  if (!cpfValido(valores.cpf)) erros.cpf = "CPF inválido.";
  return erros;
}

export function CheckoutPagamento({ planoId }: { planoId: string }) {
  const { oferta, erro, carregando } = useOfertaAssinatura();

  if (carregando) {
    return <p className="text-tinta-suave text-[13px]">Carregando…</p>;
  }

  if (erro || !oferta) {
    return <p className="text-destructive text-[13px]">Não foi possível carregar a assinatura. Recarregue a página.</p>;
  }

  const plano = oferta.planos.find((item) => item.id === planoId);
  if (!plano) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[13px]">Plano não encontrado.</p>
        <Link href="/assinatura" className="text-destaque text-[13px] font-semibold">
          Escolher um plano
        </Link>
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-[880px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <ResumoPedido oferta={oferta} plano={plano} className="lg:sticky lg:top-6 lg:order-2" />
      <FormularioCartao plano={plano} total={oferta.plataforma.precoMensal + plano.precoMensal} />
    </div>
  );
}

function FormularioCartao({ plano, total }: { plano: Plano; total: number }) {
  const router = useRouter();
  const [valores, setValores] = useState<ValoresCartao>({ numero: "", nome: "", validade: "", cvv: "", cpf: "" });
  const [tocados, setTocados] = useState<Partial<Record<CampoCartao, boolean>>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [focoCvv, setFocoCvv] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const bandeira = detectarBandeira(valores.numero);
  const erros = validar(valores);
  const erroVisivel = (campo: CampoCartao) => (tocados[campo] || tentouEnviar ? erros[campo] : undefined);

  function atualizar(campo: CampoCartao, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
    setErroEnvio(null);
  }

  function tocar(campo: CampoCartao) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentouEnviar(true);
    if (Object.keys(erros).length > 0 || enviando) return;

    setEnviando(true);
    setErroEnvio(null);
    try {
      const { mes, ano } = lerValidade(valores.validade);
      const cartao = await gateway.tokenizarCartao({
        numero: valores.numero,
        nomeTitular: valores.nome.trim(),
        mesValidade: mes,
        anoValidade: ano,
        cvv: valores.cvv,
      });
      await api.assinar({
        planoId: plano.id,
        tokenCartao: cartao.token,
        validadeCartao: cartao.validade,
        titular: { nome: valores.nome.trim(), cpf: soDigitos(valores.cpf) },
      });
      setConfirmado(true);
      router.push("/casos");
    } catch (falha) {
      setErroEnvio(falha instanceof Error ? falha.message : "Não foi possível concluir o pagamento.");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="bg-campo border-borda flex flex-col gap-5 rounded-[12px] border p-5 lg:order-1"
    >
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[20px] font-bold">Pagamento</h1>
        <p className="text-tinta-suave text-[12px]">Cartão de crédito · cobrança mensal recorrente</p>
      </div>

      <CartaoVisual
        numero={valores.numero}
        nome={valores.nome}
        validade={valores.validade}
        cvv={valores.cvv}
        bandeira={bandeira}
        virado={focoCvv}
      />

      <fieldset disabled={enviando} className="flex flex-col gap-4">
        <legend className="sr-only">Dados do cartão</legend>

        <CampoFormulario
          rotulo="Número do cartão"
          erro={erroVisivel("numero")}
          adorno={
            bandeira !== "desconhecida" ? (
              <span className="bg-destaque-suave text-destaque rounded-full px-2 py-0.5 text-[10px] font-semibold">
                {ROTULO_BANDEIRA[bandeira]}
              </span>
            ) : null
          }
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={formatarNumeroCartao(valores.numero)}
          onChange={(evento) =>
            atualizar("numero", soDigitos(evento.target.value).slice(0, tamanhoNumero(detectarBandeira(evento.target.value))))
          }
          onBlur={() => tocar("numero")}
        />

        <CampoFormulario
          rotulo="Nome impresso no cartão"
          erro={erroVisivel("nome")}
          autoComplete="cc-name"
          placeholder="Como aparece no cartão"
          value={valores.nome}
          onChange={(evento) => atualizar("nome", evento.target.value.toUpperCase())}
          onBlur={() => tocar("nome")}
          className="uppercase placeholder:normal-case"
        />

        <div className="grid grid-cols-2 gap-3">
          <CampoFormulario
            rotulo="Validade"
            erro={erroVisivel("validade")}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={valores.validade}
            onChange={(evento) => atualizar("validade", formatarValidade(evento.target.value))}
            onBlur={() => tocar("validade")}
          />
          <CampoFormulario
            rotulo="Código de segurança"
            erro={erroVisivel("cvv")}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={bandeira === "amex" ? "4 dígitos" : "3 dígitos"}
            value={valores.cvv}
            onChange={(evento) => atualizar("cvv", soDigitos(evento.target.value).slice(0, tamanhoCvv(bandeira)))}
            onFocus={() => setFocoCvv(true)}
            onBlur={() => {
              setFocoCvv(false);
              tocar("cvv");
            }}
          />
        </div>

        <CampoFormulario
          rotulo="CPF do titular"
          erro={erroVisivel("cpf")}
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={valores.cpf}
          onChange={(evento) => atualizar("cpf", formatarCpf(evento.target.value))}
          onBlur={() => tocar("cpf")}
        />
      </fieldset>

      {erroEnvio ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
          {erroEnvio}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="bg-acao text-acao-tinta flex h-11 w-full items-center justify-center gap-2 rounded-[8px] text-[13px] font-semibold disabled:opacity-70"
        >
          {confirmado ? (
            <>
              <IconeCheck /> Pagamento confirmado
            </>
          ) : enviando ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
              Processando pagamento…
            </>
          ) : (
            `Assinar e pagar ${formatarMoeda(total)}/mês`
          )}
        </button>

        <p className="text-tinta-suave flex items-start gap-2 text-[11px] leading-snug">
          <IconeCadeado className="mt-px size-3.5 shrink-0" />
          Pagamento processado com segurança. Os dados do cartão vão direto para o processador de pagamento e
          não ficam armazenados na Sophia.
        </p>

        <Link href="/assinatura" className="text-tinta-suave w-fit text-[12px] font-medium">
          ← Voltar para os planos
        </Link>
      </div>
    </form>
  );
}

function CampoFormulario({
  rotulo,
  erro,
  adorno,
  className,
  ...entrada
}: {
  rotulo: string;
  erro?: string;
  adorno?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-medium">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className={cn(CLASSE_CAMPO, adorno ? "pr-28" : null, className)}
          {...entrada}
        />
        {adorno ? <span className="absolute top-1/2 right-3 -translate-y-1/2">{adorno}</span> : null}
      </div>
      {erro ? (
        <p id={idErro} className="text-destructive text-[11px]">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function ResumoPedido({ oferta, plano, className }: { oferta: OfertaAssinatura; plano: Plano; className?: string }) {
  const total = oferta.plataforma.precoMensal + plano.precoMensal;

  return (
    <aside className={cn("bg-superficie border-borda flex flex-col gap-4 rounded-[12px] border p-5", className)}>
      <h2 className="text-[14px] font-semibold">Resumo da assinatura</h2>

      <dl className="flex flex-col gap-3 text-[12px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="flex flex-col">
            <span className="font-medium">{oferta.plataforma.nome}</span>
            <span className="text-tinta-suave text-[11px]">Uso da plataforma</span>
          </dt>
          <dd className="font-medium whitespace-nowrap">{formatarMoeda(oferta.plataforma.precoMensal)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex flex-col">
            <span className="font-medium">Plano {plano.nome}</span>
            <span className="text-tinta-suave text-[11px]">Créditos de IA</span>
          </dt>
          <dd className="font-medium whitespace-nowrap">{formatarMoeda(plano.precoMensal)}</dd>
        </div>
        <div className="border-borda flex items-baseline justify-between gap-3 border-t pt-3">
          <dt className="text-[13px] font-semibold">Total mensal</dt>
          <dd className="text-[18px] font-bold whitespace-nowrap">{formatarMoeda(total)}</dd>
        </div>
      </dl>

      <Link href="/assinatura" className="text-destaque w-fit text-[12px] font-semibold">
        Trocar plano
      </Link>
    </aside>
  );
}
