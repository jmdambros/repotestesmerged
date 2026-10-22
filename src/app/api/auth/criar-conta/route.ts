import { urlDoBack } from "@/lib/servidor/back";
import { gravarUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export async function POST(pedido: Request) {
  const corpo = (await pedido.json()) as {
    nome?: string;
    email?: string;
    senha?: string;
  };
  const nome = (corpo.nome ?? "").trim();
  const email = (corpo.email ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";
  if (!nome) {
    return Response.json({ erro: "Informe o nome completo." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return Response.json({ erro: "Informe um email válido." }, { status: 400 });
  }
  if (senha.length < 8) {
    return Response.json({ erro: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  try {
    const res = await fetch(urlDoBack("/cadastro"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
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
      {
        erro:
          "Não foi possível falar com a API. Rode o backend desta pasta (porta 8000) e confira MONGODB_URI no backend/.env.",
      },
      { status: 503 },
    );
  }
}
