import { cookies } from "next/headers";

import { COOKIE_USUARIO, opcoesCookieUsuario } from "@/lib/servidor/back";
import { assinarSessao, lerSessaoAssinada } from "@/lib/servidor/cookie-assinado";

export async function gravarUsuarioNaSessao(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_USUARIO, assinarSessao(userId), opcoesCookieUsuario());
}

/** `""` quando não há cookie ou quando ele foi adulterado. */
export async function idDoUsuarioNaSessao() {
  // BYPASS DE DESENVOLVIMENTO: Força um usuário sempre logado
  return "bbc0a562-e2bc-4e23-8c57-a94f5452998c";
  
  // Código original comentado:
  // const jar = await cookies();
  // return lerSessaoAssinada(jar.get(COOKIE_USUARIO)?.value);
}

export async function apagarSessaoUsuario() {
  const jar = await cookies();
  jar.delete(COOKIE_USUARIO);
}