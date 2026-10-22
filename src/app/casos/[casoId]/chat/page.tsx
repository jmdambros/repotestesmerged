import { redirect } from "next/navigation";

export default async function PaginaChatAntiga({
  params,
  searchParams,
}: {
  params: Promise<{ casoId: string }>;
  searchParams: Promise<{ pergunta?: string }>;
}) {
  const { casoId } = await params;
  const { pergunta } = await searchParams;
  const sufixo = pergunta ? `?pergunta=${encodeURIComponent(pergunta)}` : "";
  redirect(`/casos/${casoId}/repositorio/chat${sufixo}`);
}
