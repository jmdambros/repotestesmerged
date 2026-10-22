import { urlDoBack } from "@/lib/servidor/back";
import { apagarSessaoUsuario, idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Usuário da sessão, com `account_status` para o front decidir entre assinatura e casos. */
export async function GET() {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "não autenticado" }, { status: 401 });
  }

  try {
    const res = await fetch(urlDoBack(`/usuario/${encodeURIComponent(userId)}`));
    if (res.status === 404) {
      // Conta apagada no banco: a sessão deixa de valer.
      await apagarSessaoUsuario();
      return Response.json({ erro: "não autenticado" }, { status: 401 });
    }
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível falar com a API. Confira se ela está na porta 8000." },
      { status: 503 },
    );
  }
}
