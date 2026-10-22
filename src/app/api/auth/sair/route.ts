import { apagarSessaoUsuario } from "@/lib/servidor/sessao-usuario";

export async function POST() {
  await apagarSessaoUsuario();
  return Response.json({ ok: true });
}
