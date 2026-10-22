import type { OfertaAssinatura } from "@/lib/api/types";

/**
 * Oferta da tela de assinatura. Preços definidos pelo negócio; os textos dos
 * planos são provisórios até a equipe fechar quantos créditos cada um inclui.
 */
export const OFERTA_ASSINATURA: OfertaAssinatura = {
  plataforma: {
    nome: "Plataforma Sophia",
    precoMensal: 15_000,
    inclui: [
      "Gravação e transcrição das entrevistas com clientes",
      "Análise preliminar do caso com fontes citadas",
      "Conversa com a IA para aprofundar cada caso",
      "Rascunhos de peças processuais a partir do caso",
      "Repositório com tudo do caso em um só lugar",
    ],
  },
  planos: [
    {
      id: "basico",
      nome: "Básico",
      precoMensal: 10_000,
      descricao: "Para quem está começando a usar IA nos atendimentos.",
      beneficios: ["Créditos de IA para uso leve", "Ideal para poucos casos por mês"],
    },
    {
      id: "intermediario",
      nome: "Intermediário",
      precoMensal: 25_000,
      descricao: "Para quem atende clientes toda semana.",
      beneficios: ["Créditos de IA para uso frequente", "Ideal para uma rotina de casos constante"],
      recomendado: true,
    },
    {
      id: "pro",
      nome: "Pro",
      precoMensal: 60_000,
      descricao: "Para escritórios com volume alto de casos.",
      beneficios: ["Créditos de IA para uso intenso", "Ideal para equipes com vários advogados"],
    },
  ],
};
