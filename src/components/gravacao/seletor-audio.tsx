"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { FileAudio, FileText, X } from "lucide-react";

import { EXTENSOES_AUDIO, EXTENSOES_DOCUMENTO, ehAudio } from "@/lib/arquivos/ler-documento";
import { cn } from "@/lib/utils";

const EXTENSOES = [...EXTENSOES_AUDIO, ...EXTENSOES_DOCUMENTO];
const ACEITOS = [
  "audio/*",
  "video/mp4",
  "video/webm",
  "video/3gpp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  ...EXTENSOES,
].join(",");

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Área de arrastar/escolher o áudio da entrevista, com o arquivo escolhido em destaque. */
export function SeletorAudio({
  arquivo,
  aoEscolher,
  desabilitado = false,
}: {
  arquivo: File | null;
  aoEscolher: (arquivo: File | null) => void;
  desabilitado?: boolean;
}) {
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState("");

  function aceitar(lista: FileList | null) {
    const escolhido = lista?.[0];
    if (!escolhido) return;
    const nome = escolhido.name.toLowerCase();
    if (!EXTENSOES.some((extensao) => nome.endsWith(extensao))) {
      setErro("Formato não suportado. Envie um áudio, PDF, Word, DOC ou TXT.");
      return;
    }
    setErro("");
    aoEscolher(escolhido);
  }

  if (arquivo) {
    return (
      <div className="border-borda bg-superficie flex items-center gap-3 rounded-[10px] border px-4 py-3">
        <span className="bg-destaque-suave text-destaque flex size-9 shrink-0 items-center justify-center rounded-[8px]">
          {ehAudio(arquivo) ? (
            <FileAudio className="size-4" aria-hidden />
          ) : (
            <FileText className="size-4" aria-hidden />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[13px] font-semibold">{arquivo.name}</p>
          <p className="text-tinta-suave text-[11px]">{formatarTamanho(arquivo.size)}</p>
        </div>
        <button
          type="button"
          disabled={desabilitado}
          onClick={() => aoEscolher(null)}
          aria-label="Remover arquivo"
          className="hover:bg-tinta/5 flex size-8 items-center justify-center rounded-[8px] disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        onDragOver={(evento: DragEvent<HTMLLabelElement>) => {
          evento.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(evento: DragEvent<HTMLLabelElement>) => {
          evento.preventDefault();
          setArrastando(false);
          aceitar(evento.dataTransfer.files);
        }}
        className={cn(
          "border-borda flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors",
          arrastando ? "border-destaque bg-destaque-suave" : "hover:border-destaque/60",
        )}
      >
        <input
          type="file"
          accept={ACEITOS}
          onChange={(evento: ChangeEvent<HTMLInputElement>) => aceitar(evento.target.files)}
          className="sr-only"
        />
        <span className="bg-destaque-suave text-destaque flex size-10 items-center justify-center rounded-full">
          <FileText className="size-5" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold">Arraste o arquivo aqui ou clique para escolher</p>
        <p className="text-tinta-suave text-[11px]">Áudio, PDF, Word, DOC ou TXT</p>
      </label>
      {erro ? (
        <p role="alert" className="text-destructive text-[12px]">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
