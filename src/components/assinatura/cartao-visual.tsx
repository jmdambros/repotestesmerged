import type { ReactNode } from "react";

import { ChipCartao, MarcaBandeira } from "@/components/assinatura/icones";
import type { BandeiraCartao } from "@/lib/api/types";
import { tamanhoCvv } from "@/lib/pagamento/cartao";
import { cn } from "@/lib/utils";

interface CartaoVisualProps {
  /** Só dígitos. */
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  bandeira: BandeiraCartao;
  /** Mostra o verso enquanto o usuário digita o CVV. */
  virado: boolean;
}

/** Prévia do cartão que acompanha a digitação. Puramente decorativa para leitores de tela. */
export function CartaoVisual({ numero, nome, validade, cvv, bandeira, virado }: CartaoVisualProps) {
  const numeroExibido = numeroComPlaceholder(numero, bandeira);

  return (
    <div aria-hidden className="mx-auto aspect-[1.586] w-full max-w-[340px] perspective-distant">
      <div
        className={cn(
          "relative size-full transition-transform duration-500 ease-out transform-3d motion-reduce:transition-none",
          virado && "rotate-y-180",
        )}
      >
        <Face>
          <div className="flex items-start justify-between">
            <ChipCartao />
            <MarcaBandeira bandeira={bandeira} />
          </div>
          <p className="text-[clamp(16px,4.8vw,21px)] font-medium tracking-[0.14em] tabular-nums whitespace-nowrap">
            {numeroExibido}
          </p>
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[9px] tracking-widest text-white/60 uppercase">Titular</span>
              <span className="truncate text-[13px] font-medium tracking-wide uppercase">
                {nome.trim() || "Nome do titular"}
              </span>
            </div>
            <div className="flex shrink-0 flex-col gap-0.5 text-right">
              <span className="text-[9px] tracking-widest text-white/60 uppercase">Validade</span>
              <span className="text-[13px] font-medium tabular-nums">{validade || "MM/AA"}</span>
            </div>
          </div>
        </Face>

        <Face verso>
          <span className="-mx-5 mt-1 h-10 bg-black/70" />
          <div className="flex items-center gap-2">
            <span className="h-8 flex-1 rounded-[4px] bg-[repeating-linear-gradient(-45deg,#ffffffe6_0_6px,#ffffffb3_6px_12px)]" />
            <span className="flex h-8 w-14 items-center justify-center rounded-[4px] bg-white text-[14px] font-semibold tracking-widest tabular-nums text-[#1c1b1a] italic">
              {cvv.padEnd(tamanhoCvv(bandeira), "•")}
            </span>
          </div>
          <div className="flex justify-end">
            <MarcaBandeira bandeira={bandeira} className="opacity-80" />
          </div>
        </Face>
      </div>
    </div>
  );
}

/** Completa com "•" o que ainda não foi digitado, nos grupos da bandeira (Amex 4-6-5). */
function numeroComPlaceholder(numero: string, bandeira: BandeiraCartao) {
  const grupos = bandeira === "amex" ? [4, 6, 5] : numero.length > 16 ? [4, 4, 4, 4, 3] : [4, 4, 4, 4];
  const completo = numero.padEnd(grupos.reduce((soma, grupo) => soma + grupo, 0), "•");
  let inicio = 0;
  return grupos
    .map((grupo) => {
      const trecho = completo.slice(inicio, inicio + grupo);
      inicio += grupo;
      return trecho;
    })
    .join(" ");
}

function Face({ verso = false, children }: { verso?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[16px] px-5 py-4 text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] backface-hidden",
        "bg-[radial-gradient(circle_at_85%_-10%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_0%_110%,rgba(255,255,255,0.12),transparent_40%),linear-gradient(135deg,var(--color-destaque),color-mix(in_oklab,var(--color-destaque),black_60%))]",
        verso && "rotate-y-180",
      )}
    >
      {children}
    </div>
  );
}
