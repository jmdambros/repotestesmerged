const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

/** Datas da lista de casos, como no protótipo: "Hoje", "Ontem" ou a data cheia. */
export function formatarDataCurta(iso: string, agora = new Date()) {
  const data = new Date(iso);
  const meiaNoiteDe = (valor: Date) =>
    new Date(valor.getFullYear(), valor.getMonth(), valor.getDate()).getTime();
  const diferencaEmDias = Math.round((meiaNoiteDe(agora) - meiaNoiteDe(data)) / 86_400_000);

  if (diferencaEmDias === 0) return "Hoje";
  if (diferencaEmDias === 1) return "Ontem";
  return dataCurta.format(data);
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Duração de áudio no mesmo formato do cronômetro da gravação: 95 → "01:35". */
export function formatarDuracao(totalSegundos: number) {
  const total = Math.max(0, Math.round(totalSegundos));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

/** Valores da API chegam em centavos: 15000 → "R$ 150,00". */
export function formatarMoeda(centavos: number) {
  return moeda.format(centavos / 100);
}
