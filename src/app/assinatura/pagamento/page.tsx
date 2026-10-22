import { CheckoutPagamento } from "@/components/assinatura/checkout-pagamento";

export default async function PaginaPagamento({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { plano } = await searchParams;
  return <CheckoutPagamento planoId={typeof plano === "string" ? plano : ""} />;
}
