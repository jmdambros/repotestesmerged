import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export async function POST(pedido: Request) {
  const corpo = (await pedido.json()) as { casoId?: string; texto?: string; duracaoSegundos?: number };
  const casoId = (corpo.casoId ?? "").trim();
  const texto = (corpo.texto ?? "").trim();
  const duracao = Number(corpo.duracaoSegundos);
  const duracaoSegundos =
    Number.isFinite(duracao) && duracao > 0 ? Math.min(Math.round(duracao), 360_000) : undefined;
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para salvar a transcrição." }, { status: 401 });
  }
  if (!casoId || !texto) {
    return Response.json({ erro: "Informe o caso e o texto da transcrição." }, { status: 400 });
  }

  try {
    const res = await fetch(urlDoBack("/salvar-transcricao"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto,
        user_id: userId,
        caso_id: casoId,
        ...(duracaoSegundos === undefined ? {} : { duracao_segundos: duracaoSegundos }),
      }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível salvar no banco." }, { status: 503 });
  }
}
