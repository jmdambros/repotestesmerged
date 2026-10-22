"use client";

import { Modal } from "@/components/ui/modal";

interface ModalConfirmarProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  confirmar: string;
  aoFechar: () => void;
  aoConfirmar: () => void;
  processando?: boolean;
  erro?: string;
}

export function ModalConfirmar({
  aberto,
  titulo,
  descricao,
  confirmar,
  aoFechar,
  aoConfirmar,
  processando = false,
  erro,
}: ModalConfirmarProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      descricao={descricao}
      bloqueado={processando}
      className="max-w-[320px]"
    >
      {erro ? <p role="alert" className="mt-2 text-[12px] text-red-600 dark:text-red-400">{erro}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={processando}
          onClick={aoFechar}
          className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={processando}
          onClick={aoConfirmar}
          className="pressionavel bg-acao text-acao-tinta flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold"
        >
          {confirmar}
        </button>
      </div>
    </Modal>
  );
}
