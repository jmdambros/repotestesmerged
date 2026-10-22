"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { SeletorAreaJuridica } from "@/components/casos/seletor-area-juridica";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo placeholder:text-destaque placeholder:text-[11px] h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

export default function PaginaNovoCaso() {
  const router = useRouter();
  const { criarCaso } = useListaCasos();
  const idTitulo = useId();
  const idCliente = useId();
  const idArea = useId();
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [area, setArea] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!titulo.trim() || !cliente.trim() || enviando) return;
    setEnviando(true);
    try {
      const caso = await criarCaso({
        titulo: titulo.trim(),
        cliente: cliente.trim(),
        area: area || undefined,
      });
      router.push(`/casos/${caso.id}/gravacao`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-1 px-7 pt-5 pb-2">
        <h1 className="text-[22px] leading-none font-bold">Criar novo caso</h1>
        <p className="text-tinta-suave text-[13px]">Vincule um cliente e inicie a análise</p>
      </header>

      <form
        onSubmit={aoEnviar}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pt-5 pb-7"
      >
        <div className="flex w-full max-w-[420px] flex-col gap-1.5">
          <label htmlFor={idTitulo} className="text-[12px] font-medium">
            Nome do caso
          </label>
          <input
            id={idTitulo}
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ex: Rescisão contratual"
            required
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex w-full max-w-[420px] flex-col gap-1.5">
          <label htmlFor={idCliente} className="text-[12px] font-medium">
            Cliente
          </label>
          <input
            id={idCliente}
            value={cliente}
            onChange={(evento) => setCliente(evento.target.value)}
            placeholder="Nome do cliente"
            required
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex w-full max-w-[420px] flex-col gap-1.5">
          <label htmlFor={idArea} className="text-[12px] font-medium">
            Área jurídica
          </label>
          <SeletorAreaJuridica id={idArea} valor={area} aoMudar={setArea} />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/casos")}
            className="border-borda bg-campo flex h-8 w-[100px] items-center justify-center rounded-[8px] border text-[12px] font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="bg-acao text-acao-tinta flex h-8 w-[112px] items-center justify-center rounded-[8px] text-[12px] font-semibold disabled:opacity-50"
          >
            Criar caso
          </button>
        </div>
      </form>
    </>
  );
}
