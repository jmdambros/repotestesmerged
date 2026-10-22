import { urlDoBack } from "@/lib/servidor/back";
import { gravarUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export async function POST(pedido: Request) {
  const corpo = (await pedido.json()) as { email?: string; senha?: string };
  const email = (corpo.email ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";
  if (!email || !senha) {
    return Response.json({ erro: "Informe email e senha." }, { status: 400 });
  }

  try {
    const res = await fetch(urlDoBack("/entrar"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const dados = (await res.json().catch(() => ({}))) as {
      erro?: string;
      usuario?: { _id?: string };
    };
    if (res.ok && dados.usuario?._id) {
      await gravarUsuarioNaSessao(dados.usuario._id);
    }
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível falar com a API. Confira se ela está na porta 8000." },
      { status: 503 },
    );
  }
}
