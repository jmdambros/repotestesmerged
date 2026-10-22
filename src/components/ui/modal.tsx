"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";

interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Largura máxima e espaçamentos extras do cartão. */
  className?: string;
  /** Impede fechar (Escape, clique fora) enquanto uma ação está em andamento. */
  bloqueado?: boolean;
  children: ReactNode;
}

/**
 * Modal base do projeto, sobre o Dialog do base-ui: portal, Escape, clique fora,
 * trava de rolagem e foco ficam por conta dele.
 *
 * O conteúdo só é montado enquanto o modal está aberto, então estado local nos
 * filhos recomeça do zero a cada abertura — sem precisar de efeito para resetar.
 */
export function Modal({ aberto, aoFechar, titulo, descricao, className, bloqueado = false, children }: ModalProps) {
  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(proximo) => {
        if (!proximo && !bloqueado) aoFechar();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            className={cn(
              "bg-campo border-borda w-full max-w-[360px] rounded-[10px] border p-4 shadow-lg outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
              className,
            )}
          >
            <Dialog.Title className="text-[15px] font-semibold">{titulo}</Dialog.Title>
            {descricao ? (
              <Dialog.Description className="text-tinta-suave mt-1 text-[12px]">
                {descricao}
              </Dialog.Description>
            ) : null}
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
