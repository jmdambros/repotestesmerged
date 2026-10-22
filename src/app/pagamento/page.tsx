import { redirect } from "next/navigation";

/** Rota antiga do pagamento; a assinatura (plano + cartão) agora fica em /assinatura. */
export default function PaginaPagamento() {
  redirect("/assinatura");
}
