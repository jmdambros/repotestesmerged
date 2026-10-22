import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Cookie de sessão no formato `<userId>.<assinatura>`, com HMAC-SHA256.
 *
 * Sem a assinatura, bastaria trocar o valor do cookie pelo UUID de outra pessoa
 * para entrar na conta e nos casos dela. Com ela, qualquer alteração invalida o
 * cookie e a rota trata como "sem sessão".
 */

const segredoDeDesenvolvimento = randomBytes(32).toString("hex");

/**
 * `SESSION_SECRET` é obrigatória em produção. Em desenvolvimento, sem ela, usa um
 * segredo aleatório por processo: funciona, mas todos saem da conta ao reiniciar
 * o `next dev`.
 */
export function segredoDaSessao() {
  const segredo = process.env.SESSION_SECRET;
  if (segredo) return segredo;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Defina SESSION_SECRET no ambiente para assinar o cookie de sessão.");
  }
  return segredoDeDesenvolvimento;
}

function assinatura(userId: string, segredo: string) {
  return createHmac("sha256", segredo).update(userId).digest("base64url");
}

export function assinarSessao(userId: string, segredo = segredoDaSessao()) {
  return `${userId}.${assinatura(userId, segredo)}`;
}

/** Devolve o `userId` só se a assinatura conferir; qualquer adulteração dá `""`. */
export function lerSessaoAssinada(valor: string | undefined, segredo = segredoDaSessao()) {
  if (!valor) return "";
  const ponto = valor.lastIndexOf(".");
  if (ponto <= 0) return "";

  const userId = valor.slice(0, ponto);
  const recebida = Buffer.from(valor.slice(ponto + 1));
  const esperada = Buffer.from(assinatura(userId, segredo));
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return "";
  return userId;
}
