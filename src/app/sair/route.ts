import { NextResponse } from "next/server";

import { apagarSessaoUsuario } from "@/lib/servidor/sessao-usuario";

export async function GET(pedido: Request) {
  await apagarSessaoUsuario();
  return NextResponse.redirect(new URL("/login", pedido.url));
}
