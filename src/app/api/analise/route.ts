import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/**
 * Análise preliminar do caso. O `user_id` sai só do cookie assinado, nunca do corpo ou da URL;
 * o backend responde 404 para caso inexistente ou de outro usuário.
 */

export async function GET(pedido: Request) {
  const casoId = new URL(pedido.url).searchParams.get("casoId")?.trim() ?? "";
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "não autenticado" }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });

  try {
    const res = await fetch(
      `${urlDoBack(`/analise/${encodeURIComponent(casoId)}`)}?user_id=${encodeURIComponent(userId)}`,
    );
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível ler a análise." }, { status: 503 });
  }
}

export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { casoId?: string; instrucao?: string };
  const casoId = (corpo.casoId ?? "").trim();
  const instrucao = (corpo.instrucao ?? "").trim().slice(0, 4000);
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para analisar o caso." }, { status: 401 });
  if (!casoId) return Response.json({ erro: "Informe o caso." }, { status: 400 });

  try {
    const res = await fetch(urlDoBack(`/analise/${encodeURIComponent(casoId)}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...(instrucao ? { instrucao } : {}) }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível gerar a análise." }, { status: 503 });
  }
}
