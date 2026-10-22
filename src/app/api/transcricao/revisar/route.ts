import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 120;

export async function POST(pedido: Request) {
  if (!(await idDoUsuarioNaSessao())) {
    return Response.json({ erro: "Entre na sua conta para revisar o texto." }, { status: 401 });
  }
  const corpo = (await pedido.json()) as { texto?: string };
  try {
    const res = await fetch(urlDoBack("/revisar-transcricao"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: corpo.texto ?? "" }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível revisar o texto." }, { status: 503 });
  }
}
