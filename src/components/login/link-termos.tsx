"use client";

import { useState } from "react";

import { ModalClausulas } from "@/components/casos/modal-clausulas";

export function LinkTermos() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="pressionavel text-destaque dark:text-tinta text-right text-[11px]"
      >
        Termos de uso e Política de privacidade
      </button>
      <ModalClausulas aberto={aberto} modo="consulta" aoFechar={() => setAberto(false)} />
    </>
  );
}
