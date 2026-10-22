"use client";

import { useState } from "react";
import Link from "next/link";

import { ModalFluxo } from "@/components/fluxo/modal-fluxo";
import type {
  AnalisePreliminar,
  CategoriaInsight,
  Insight,
} from "@/lib/api/analise";
import styles from "@/components/fluxo/telas.module.css";

const COLUNAS: { titulo: string; categorias: CategoriaInsight[] }[] = [
  { titulo: "Teses jurídicas aplicáveis", categorias: ["tese"] },
  { titulo: "Temas do STF/STJ", categorias: ["tema_superior"] },
  { titulo: "Jurisprudência", categorias: ["jurisprudencia"] },
  { titulo: "Perguntas sugeridas", categorias: ["pergunta"] },
  { titulo: "Necessidades adicionais", categorias: ["necessidade", "acordo"] },
];

export function ColunasAnalise({ analise }: { analise: AnalisePreliminar }) {
  const [selecionado, setSelecionado] = useState<Insight | null>(null);
  return (
    <>
      <div className={styles.colunas}>
        {COLUNAS.map((coluna) => {
          const itens = analise.insights.filter((item) =>
            coluna.categorias.includes(item.categoria),
          );
          return (
            <section
              key={coluna.titulo}
              className="flex min-w-0 flex-col gap-[10px]"
            >
              <h2 className="text-[12px] leading-[15px] font-semibold">
                {coluna.titulo} ({itens.length})
              </h2>
              {itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelecionado(item)}
                  className="border-borda bg-campo flex w-full flex-col gap-[6px] rounded-[8px] border p-[10px] text-left"
                  aria-label={item.titulo}
                >
                  <span className="flex w-full items-center gap-[6px]">
                    <span
                      className="text-tinta-suave min-w-0 flex-1 text-[11px] leading-[13px] font-semibold [overflow-wrap:anywhere]"
                    >
                      {item.titulo}
                    </span>
                    {item.posicaoJurisprudencial ? (
                      <span className="bg-destaque-suave border-destaque text-meta shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[9px] leading-[11px] font-medium">
                        {item.posicaoJurisprudencial === "majoritaria"
                          ? "Majoritária"
                          : item.posicaoJurisprudencial === "minoritaria"
                            ? "Minoritária"
                            : "Em análise"}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-tinta-suave text-[10px] leading-3">
                    {item.detalhe}
                  </span>
                  {item.meta ? (
                    <span className="text-tinta-suave flex w-full flex-wrap justify-between gap-1 text-[9px] leading-[11px]">
                      <span>{item.meta[0]}</span>
                      <span>{item.meta[1]}</span>
                    </span>
                  ) : null}
                  {!analise.demonstracao &&
                  ["tese", "tema_superior", "jurisprudencia"].includes(
                    item.categoria,
                  ) &&
                  !item.fontes.some((fonte) => fonte.url) ? (
                    <span className="text-tinta-suave text-[9px]">
                      não verificado
                    </span>
                  ) : null}
                </button>
              ))}
            </section>
          );
        })}
      </div>
      <ModalFluxo
        aberto={!!selecionado}
        aoFechar={() => setSelecionado(null)}
        titulo={selecionado?.titulo ?? "Detalhes"}
        descricao={selecionado?.detalhe}
      >
        {selecionado ? (
          <>
            {selecionado.fontes.length ? (
              selecionado.fontes.map((fonte) => (
                <p key={fonte.identificador} className="mt-3 text-[12px]">
                  {fonte.url && /^https?:\/\//.test(fonte.url) ? (
                    <a
                      className="text-destaque underline"
                      href={fonte.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {fonte.tribunal} {fonte.identificador}
                    </a>
                  ) : (
                    `${fonte.tribunal} ${fonte.identificador} — não verificado`
                  )}
                </p>
              ))
            ) : (
              <p className="text-tinta-suave mt-3 text-[12px]">
                {analise.demonstracao
                  ? "Conteúdo demonstrativo do protótipo. Referências não verificadas."
                  : "Fonte não verificada."}
              </p>
            )}
            <Link
              href={`/casos/${analise.casoId}/repositorio/chat?pergunta=${encodeURIComponent(selecionado.titulo)}`}
              className="text-destaque mt-4 inline-block text-[13px] underline"
            >
              Continuar no chat
            </Link>
          </>
        ) : null}
      </ModalFluxo>
    </>
  );
}
