import type { Usuario } from "@/lib/api/types";

/** Para onde o usuário vai depois de entrar ou criar a conta. */
export function rotaInicial(usuario: Usuario) {
  return usuario.statusConta === "ativa" ? "/casos" : "/assinatura";
}

/**
 * Quem pode ver `/casos`: só conta com sessão e assinatura paga. Devolve a rota
 * para onde mandar o usuário, ou `null` quando o acesso é liberado.
 */
export function redirecionamentoDosCasos(usuario: Usuario | null) {
  if (!usuario) return "/login";
  if (usuario.statusConta !== "ativa") return "/assinatura";
  return null;
}
