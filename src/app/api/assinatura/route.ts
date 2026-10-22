import { urlDoBack } from "@/lib/servidor/back";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/**
 * Assina para o usuário da sessão. O corpo nunca traz `user_id`: o dono vem do
 * cookie assinado. O preço é recalculado no backend a partir do `plan_id`.
 */
export async function POST(pedido: Request) {
  const userId = await idDoUsuarioNaSessao();
  if (!userId) {
    return Response.json({ erro: "Entre na sua conta para assinar." }, { status: 401 });
  }

  const corpo = (await pedido.json().catch(() => ({}))) as {
    plan_id?: string;
    card_token?: string;
    card_expiry?: string;
    holder?: { name?: string; cpf?: string };
  };
  const planId = (corpo.plan_id ?? "").trim();
  const cardToken = (corpo.card_token ?? "").trim();
  const expiry = (corpo.card_expiry ?? "").trim();
  const holderName = (corpo.holder?.name ?? "").trim();
  if (!planId || !cardToken) {
    return Response.json({ erro: "Informe o plano e o cartão." }, { status: 400 });
  }

  // Cobrança simulada até o gateway ser integrado: o token do gateway mockado
  // (src/lib/pagamento) carrega bandeira e final; o final 0002 simula recusa.
  const [, , brand = "desconhecida", last4 = ""] = cardToken.split("_");
  if (last4 === "0002") {
    return Response.json(
      { erro: "Pagamento recusado pelo emissor do cartão. Tente outro cartão." },
      { status: 402 },
    );
  }

  try {
    const res = await fetch(urlDoBack("/assinatura"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        plan_id: planId,
        card: { brand, last4, expiry, holder_name: holderName },
      }),
    });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: "Não foi possível registrar a assinatura." }, { status: 503 });
  }
}
