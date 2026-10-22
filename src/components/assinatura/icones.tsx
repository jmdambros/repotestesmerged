import type { BandeiraCartao } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function IconeCheck({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("size-4", className)}>
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeCadeado({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("size-4", className)}>
      <rect x="4" y="9" width="12" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.8 9V6.6a3.2 3.2 0 0 1 6.4 0V9" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ChipCartao() {
  return (
    <svg aria-hidden viewBox="0 0 40 30" className="h-7 w-9">
      <rect x="0.5" y="0.5" width="39" height="29" rx="5" fill="#e8c873" stroke="#c9a54a" />
      <path d="M0 10h13M0 20h13M27 10h13M27 20h13M13 0v30M27 0v30M13 15h14" stroke="#b8933a" strokeWidth="1" fill="none" />
    </svg>
  );
}

/** Marcas das bandeiras desenhadas em SVG/texto, sem depender de imagens externas. */
export function MarcaBandeira({ bandeira, className }: { bandeira: BandeiraCartao; className?: string }) {
  if (bandeira === "mastercard") {
    return (
      <svg aria-label="Mastercard" role="img" viewBox="0 0 38 24" className={cn("h-7 w-11", className)}>
        <circle cx="14" cy="12" r="9" fill="#eb001b" />
        <circle cx="24" cy="12" r="9" fill="#f79e1b" />
        <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8Z" fill="#ff5f00" />
      </svg>
    );
  }

  const textos: Partial<Record<BandeiraCartao, { rotulo: string; classe: string }>> = {
    visa: { rotulo: "VISA", classe: "text-[20px] font-black italic tracking-tight" },
    amex: { rotulo: "AMEX", classe: "rounded-[4px] border border-current px-1.5 text-[12px] font-bold tracking-widest" },
    elo: { rotulo: "elo", classe: "text-[22px] font-black lowercase tracking-tight" },
    hipercard: { rotulo: "Hipercard", classe: "text-[14px] font-bold italic" },
  };
  const texto = textos[bandeira];
  if (!texto) return null;

  return <span className={cn("leading-none text-white", texto.classe, className)}>{texto.rotulo}</span>;
}
