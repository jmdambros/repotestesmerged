import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/** Troca o plano da assinatura do usuário da sessão; o cartão vinculado continua o mesmo. */
export async function POST(pedido: Request) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para alterar o plano." }, { status: 401 });
  }

  const corpo = (await pedido.json().catch(() => ({}))) as { plan_id?: string };
  const planId = (corpo.plan_id ?? "").trim();
  if (!planId) {
    return Response.json({ erro: "Escolha um plano." }, { status: 400 });
  }

  try {
    const res = await fetch(urlDoBack("/assinatura/plano"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, plan_id: planId }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível alterar o plano." }, { status: 503 });
  }
}
