"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

interface ModalFluxoProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  children?: ReactNode;
}

export function ModalFluxo({
  aberto,
  titulo,
  descricao,
  aoFechar,
  children,
}: ModalFluxoProps) {
  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(aberto) => {
        if (!aberto) aoFechar();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup
          className="bg-campo border-borda fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[10px] border p-5 shadow-lg"
        >
          <Dialog.Title className="text-[15px] font-semibold">
            {titulo}
          </Dialog.Title>
          {descricao ? (
            <Dialog.Description className="text-tinta-suave mt-2 text-[13px] leading-relaxed">
              {descricao}
            </Dialog.Description>
          ) : null}
          {children}
          <div className="mt-4 flex justify-end">
            <Dialog.Close className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold">
              Fechar
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
