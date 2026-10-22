/**
 * Modelo de domínio consumido pelo front.
 *
 * O backend está sendo construído em paralelo. Este arquivo cobre apenas o que as
 * telas já implementadas usam; os modelos de análise, repositório e chat estão
 * em `./analise.ts`. O contrato compartilhado está em `docs/contrato-api.md`.
 */

import type { AnalisePreliminar, ConteudoCaso, MensagemChat } from "./analise";

/** Estados exibidos na lista de casos do protótipo. */
export type StatusCaso = "gravacao_pendente" | "em_analise" | "concluido";

export type PastaCaso = "ativo" | "arquivo";

export interface Caso {
  id: string;
  /** "Rescisão contratual — Silva" */
  titulo: string;
  /** Nome do cliente atendido, exibido como "Cliente: …". */
  cliente: string;
  /** Id de uma área do catálogo em `areas-juridicas`. */
  area?: string;
  status: StatusCaso;
  pasta: PastaCaso;
  /** ISO 8601. */
  atualizadoEm: string;
}

export interface DadosNovoCaso {
  titulo: string;
  cliente: string;
  area?: string;
}

/*
 * Conta do advogado. Cadastro e login passam pelas rotas `/api/auth/*` do Next,
 * que falam com o backend (MongoDB) e gravam a sessão num cookie httpOnly assinado.
 * O front nunca guarda token nem envia o id do usuário: o servidor descobre quem
 * é pelo cookie.
 */

/** A conta só libera os casos depois que a assinatura é paga. */
export type StatusConta = "pagamento_pendente" | "ativa";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  statusConta: StatusConta;
  /** ISO 8601. */
  criadoEm?: string;
  /** Plano e cartão da assinatura ativa, para exibir na conta (sem valores). */
  assinatura?: ResumoAssinatura;
}

export interface ResumoAssinatura {
  planoId: IdPlano;
  nomePlano: string;
  cartao: CartaoSalvo;
}

/*
 * Assinatura: mensalidade fixa da plataforma + um plano de créditos de IA.
 * Valores monetários sempre em centavos, para não ter erro de ponto flutuante.
 */

export type IdPlano = "basico" | "intermediario" | "pro";

export interface Plano {
  id: IdPlano;
  nome: string;
  /** Centavos. */
  precoMensal: number;
  descricao: string;
  beneficios: string[];
  recomendado?: boolean;
}

export interface OfertaAssinatura {
  plataforma: {
    nome: string;
    /** Centavos. */
    precoMensal: number;
    inclui: string[];
  };
  planos: Plano[];
}

export type BandeiraCartao = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "desconhecida";

/** Só o que é seguro guardar e exibir; número completo e CVV nunca saem do gateway. */
export interface CartaoSalvo {
  bandeira: BandeiraCartao;
  /** Últimos 4 dígitos. */
  final: string;
  /** "MM/AA". */
  validade: string;
}

export interface DadosAssinatura {
  planoId: IdPlano;
  /**
   * Token devolvido pelo gateway de pagamento (`src/lib/pagamento`). Os dados do
   * cartão vão direto do navegador para o gateway e nunca passam pela API da Sophia.
   */
  tokenCartao: string;
  /** "MM/AA", vinda do gateway junto com o token. */
  validadeCartao?: string;
  titular: {
    nome: string;
    /** Só dígitos. */
    cpf: string;
  };
}

export type StatusAssinatura = "ativa" | "pendente" | "recusada";

export interface Assinatura {
  id: string;
  /** Dono da assinatura; definido pelo backend a partir da sessão. */
  usuarioId: string;
  planoId: IdPlano;
  status: StatusAssinatura;
  /** Plataforma + plano, em centavos. */
  valorMensal: number;
  cartao: CartaoSalvo;
  /** ISO 8601. */
  criadaEm: string;
}

export interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
  criarCaso(dados: DadosNovoCaso): Promise<Caso>;
  moverCaso(id: string, pasta: PastaCaso): Promise<Caso>;
  excluirCaso(id: string): Promise<void>;
  obterCaso(casoId: string): Promise<ConteudoCaso>;
  finalizarSessao(casoId: string, transcricao: ConteudoCaso["transcricao"]): Promise<Caso>;
  solicitarAnalise(casoId: string, instrucao?: string): Promise<AnalisePreliminar>;
  listarMensagens(casoId: string): Promise<MensagemChat[]>;
  enviarMensagem(casoId: string, conteudo: string): Promise<MensagemChat[]>;

  /** `null` quando não há sessão. */
  obterUsuarioAtual(): Promise<Usuario | null>;

  obterOfertaAssinatura(): Promise<OfertaAssinatura>;
  /**
   * Assina para o usuário da sessão e passa a conta para `ativa`.
   * Rejeita com `Error` de mensagem amigável quando o pagamento é recusado.
   */
  assinar(dados: DadosAssinatura): Promise<Assinatura>;
  /**
   * Troca o plano da assinatura ativa do usuário da sessão, mantendo o cartão.
   * Devolve o usuário já com o plano novo.
   */
  trocarPlano(planoId: IdPlano): Promise<Usuario>;
}
