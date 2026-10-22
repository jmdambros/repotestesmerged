export const CHAVE_CLAUSULAS = "sophia-clausulas";

export interface Clausula {
  titulo: string;
  texto: string;
}

export function leuAceiteClausulas(): boolean {
  try {
    return localStorage.getItem(CHAVE_CLAUSULAS) === "aceito";
  } catch {
    return false;
  }
}

export function gravarAceiteClausulas() {
  try {
    localStorage.setItem(CHAVE_CLAUSULAS, "aceito");
  } catch {
    /* private mode */
  }
}

export const CLAUSULAS: Clausula[] = [
  {
    titulo: "Cláusula 1 — Natureza do Serviço e Dever Obrigatório de Revisão Humana",
    texto:
      "O Sophia é uma plataforma tecnológica de suporte à produtividade e auxílio na organização de informações de atendimento. O Usuário reconhece e concorda que o Software NÃO presta consultoria jurídica nem substitui a análise técnica e o julgamento profissional do advogado. É de responsabilidade única, exclusiva e indelegável do Usuário conferir, validar e revisar integralmente a exatidão, a atualidade e a autenticidade de todas as teses, ementas, jurisprudências e leis sugeridas pela inteligência artificial antes de qualquer utilização formal ou protocolização judicial.",
  },
  {
    titulo: "Cláusula 2 — Isenção de Responsabilidade por Saídas Probabilísticas (Alucinações)",
    texto:
      "O Usuário declara ciência de que a tecnologia de inteligência artificial fornecida opera por meio de modelos estatísticos e probabilísticos, estando sujeita a imprecisões, omissões ou gerações incorretas (“alucinações”). A Licenciante não garante a infalibilidade das análises e exime-se expressamente de qualquer responsabilidade por eventuais prejuízos processuais, perda de prazos, indeferimento de pedidos ou desfechos desfavoráveis decorrentes da utilização das sugestões geradas pela plataforma.",
  },
  {
    titulo: "Cláusula 3 — Teto de Limitação de Responsabilidade Financeira",
    texto:
      "Em nenhuma hipótese a responsabilidade civil total e cumulativa da Licenciante por eventuais danos diretos decorrentes do uso da plataforma ou de falhas de infraestrutura excederá o valor total efetivamente pago pelo Usuário à Licenciante a título de mensalidade nos últimos 6 (seis) meses anteriores ao evento gerador da demanda.",
  },
  {
    titulo: "Cláusula 4 — Subprocessamento de Dados e Privacidade (Zero Retention)",
    texto:
      "Para a execução dos serviços, a Licenciante utiliza provedores de infraestrutura de nuvem e de modelos de linguagem certificados que atendem aos padrões internacionais de segurança (ex.: criptografia e certificação SOC2/ISO27001). A Licenciante compromete-se a manter acordos comerciais com referidos provedores que impeçam a utilização dos dados enviados pelo Usuário para o treinamento de modelos públicos de inteligência artificial.",
  },
];
