import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "não autenticado" }, { status: 401 });
  }
  if (!casoId) {
    return Response.json({ erro: "Informe o caso." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${urlDoBack("/caso")}?user_id=${encodeURIComponent(userId)}&caso_id=${encodeURIComponent(casoId)}`,
    );
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível ler o caso." }, { status: 503 });
  }
}
