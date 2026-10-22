"use client";

import { aplicarTema } from "@/lib/tema";
import { cn } from "@/lib/utils";

/**
 * Alterna o tema. O ícone muda só por CSS (`.dark`) para não atrasar o primeiro
 * paint nem divergir na hidratação.
 */
export function BotaoTema({ className }: { className?: string }) {
  function alternar() {
    const escuro = !document.documentElement.classList.contains("dark");
    aplicarTema(escuro ? "escuro" : "claro");
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className={cn(
        "hover:bg-tinta/5 flex size-8 items-center justify-center rounded-[8px]",
        className,
      )}
    >
      <span className="dark:hidden">
        <IconeLua />
        <span className="sr-only">Ativar modo escuro</span>
      </span>
      <span className="hidden dark:inline">
        <IconeSol />
        <span className="sr-only">Ativar modo claro</span>
      </span>
    </button>
  );
}

function IconeLua() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-4">
      <path
        d="M11.2 3.4a6.6 6.6 0 1 0 5.4 5.4A5.1 5.1 0 0 1 11.2 3.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSol() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-4">
      <circle cx="10" cy="10" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v1.6M10 15.9v1.6M2.5 10h1.6M15.9 10h1.6M4.7 4.7l1.1 1.1M14.2 14.2l1.1 1.1M4.7 15.3l1.1-1.1M14.2 5.8l1.1-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
