/**
 * Tradução entre o formato da API (snake_case em inglês, igual às coleções
 * `users`, `case` e `transcript` do MongoDB) e o modelo de domínio do front.
 *
 * Nenhum tipo de entrada tem `user_id`: o dono de um caso ou assinatura vem
 * sempre da sessão no backend, nunca do front.
 */

import type {
  Assinatura,
  BandeiraCartao,
  Caso,
  DadosAssinatura,
  DadosNovoCaso,
  IdPlano,
  OfertaAssinatura,
  PastaCaso,
  StatusAssinatura,
  StatusCaso,
  StatusConta,
  Usuario,
} from "@/lib/api/types";

/** `_id` chega como string (UUID em `users`) ou ObjectId serializado (`case`). */
export type IdMongo = string | { $oid: string };

export function lerId(dto: { _id?: IdMongo; id?: IdMongo }): string {
  const bruto = dto.id ?? dto._id;
  if (!bruto) throw new Error("Resposta da API sem id.");
  return typeof bruto === "string" ? bruto : bruto.$oid;
}

export interface UsuarioApi {
  _id?: IdMongo;
  id?: IdMongo;
  name: string;
  email: string;
  /** Ausente em contas antigas: tratado como pagamento pendente. */
  account_status?: StatusConta;
  created_at?: string;
  subscription?: {
    plan_id: IdPlano;
    plan_name: string;
    card: { brand?: BandeiraCartao; last4?: string; expiry?: string };
  } | null;
}

export function usuarioDaApi(dto: UsuarioApi): Usuario {
  return {
    id: lerId(dto),
    nome: dto.name,
    email: dto.email,
    statusConta: dto.account_status ?? "pagamento_pendente",
    criadoEm: dto.created_at,
    assinatura: dto.subscription
      ? {
          planoId: dto.subscription.plan_id,
          nomePlano: dto.subscription.plan_name,
          cartao: {
            bandeira: dto.subscription.card.brand ?? "desconhecida",
            final: dto.subscription.card.last4 ?? "",
            validade: dto.subscription.card.expiry ?? "",
          },
        }
      : undefined,
  };
}

export interface CasoApi {
  _id?: IdMongo;
  id?: IdMongo;
  title: string;
  client_name: string;
  legal_area?: string | null;
  status: StatusCaso;
  folder?: PastaCaso;
  updated_at: string;
}

export function casoDaApi(dto: CasoApi): Caso {
  return {
    id: lerId(dto),
    titulo: dto.title,
    cliente: dto.client_name,
    area: dto.legal_area ?? undefined,
    status: dto.status,
    pasta: dto.folder === "arquivo" ? "arquivo" : "ativo",
    atualizadoEm: dto.updated_at,
  };
}

export function novoCasoParaApi(dados: DadosNovoCaso) {
  return { title: dados.titulo, client_name: dados.cliente, legal_area: dados.area ?? null };
}

export interface OfertaApi {
  platform: { name: string; monthly_price: number; includes: string[] };
  plans: {
    id: IdPlano;
    name: string;
    monthly_price: number;
    description: string;
    benefits: string[];
    recommended?: boolean;
  }[];
}

export function ofertaDaApi(dto: OfertaApi): OfertaAssinatura {
  return {
    plataforma: {
      nome: dto.platform.name,
      precoMensal: dto.platform.monthly_price,
      inclui: dto.platform.includes,
    },
    planos: dto.plans.map((plano) => ({
      id: plano.id,
      nome: plano.name,
      precoMensal: plano.monthly_price,
      descricao: plano.description,
      beneficios: plano.benefits,
      recomendado: plano.recommended,
    })),
  };
}

export function assinaturaParaApi(dados: DadosAssinatura) {
  return {
    plan_id: dados.planoId,
    card_token: dados.tokenCartao,
    card_expiry: dados.validadeCartao ?? "",
    holder: { name: dados.titular.nome, cpf: dados.titular.cpf },
  };
}

export interface AssinaturaApi {
  _id?: IdMongo;
  id?: IdMongo;
  user_id: string;
  plan_id: IdPlano;
  status: StatusAssinatura;
  monthly_amount: number;
  card: { brand: BandeiraCartao; last4: string; expiry: string };
  created_at: string;
}

export function assinaturaDaApi(dto: AssinaturaApi): Assinatura {
  return {
    id: lerId(dto),
    usuarioId: dto.user_id,
    planoId: dto.plan_id,
    status: dto.status,
    valorMensal: dto.monthly_amount,
    cartao: { bandeira: dto.card.brand, final: dto.card.last4, validade: dto.card.expiry },
    criadaEm: dto.created_at,
  };
}
