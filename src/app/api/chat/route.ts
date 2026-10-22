import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Chat de refinamento do caso. O dono vem do cookie assinado; caso alheio responde 404. */

export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });

  try {
    const res = await fetch(
      `${urlDoBack(`/chat/${encodeURIComponent(casoId)}`)}?user_id=${encodeURIComponent(userId)}`,
    );
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível carregar as mensagens." }, { status: 503 });
  }
}

export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string; mensagem?: string };
  const casoId = (corpo.casoId ?? "").trim();
  const mensagem = (corpo.mensagem ?? "").trim();
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para conversar." }, { status: 401 });
  if (!casoId || !mensagem) return Response.json({ erro: "Informe o caso e a mensagem." }, { status: 400 });

  try {
    const res = await fetch(urlDoBack(`/chat/${encodeURIComponent(casoId)}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, mensagem }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível enviar a mensagem." }, { status: 503 });
  }
}
