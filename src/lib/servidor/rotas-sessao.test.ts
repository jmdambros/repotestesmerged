/**
 * Rotas do Next que dependem da sessão, com `next/headers` e o backend simulados:
 * cookie forjado não chega ao backend, e o `user_id` enviado ao backend é sempre o
 * do cookie — nunca um que venha no corpo da requisição.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assinarSessao } from "@/lib/servidor/cookie-assinado";

const ANA = "98ff6434-655e-486f-b255-1bd89542ea7f";
const BRUNO = "d11143d4-e6d6-435b-9807-4ecd182e905f";

const cookieAtual = vi.hoisted(() => ({ valor: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieAtual.valor === undefined ? undefined : { value: cookieAtual.valor }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

const { GET: obterEu } = await import("@/app/api/auth/eu/route");
const { POST: assinar } = await import("@/app/api/assinatura/route");
const { GET: obterCaso } = await import("@/app/api/transcricao/caso/route");
const { POST: trocarPlano } = await import("@/app/api/assinatura/plano/route");
const { POST: transcrever } = await import("@/app/api/transcricao/transcrever/route");
const { POST: revisar } = await import("@/app/api/transcricao/revisar/route");

let backend: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  backend = vi.fn<typeof fetch>(async () => Response.json({ usuario: { _id: ANA }, assinatura: {} }));
  vi.stubGlobal("fetch", backend);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cookieAtual.valor = undefined;
});

const urlChamada = () => String(backend.mock.calls[0][0]);
const corpoChamado = () => JSON.parse(String(backend.mock.calls[0][1]?.body));

describe("cookie forjado não acessa a conta de ninguém", () => {
  it("UUID puro de outro usuário no cookie → 401, sem chamar o backend", async () => {
    cookieAtual.valor = BRUNO;

    expect((await obterEu()).status).toBe(401);
    expect((await obterCaso(new Request("http://x/api/transcricao/caso?casoId=rescisao-silva"))).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cookie com assinatura adulterada → 401", async () => {
    cookieAtual.valor = `${BRUNO}.${assinarSessao(ANA).split(".").pop()}`;
    expect((await obterEu()).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cookie legítimo consulta o backend com o id do próprio usuário", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    expect((await obterEu()).status).toBe(200);
    expect(urlChamada()).toMatch(new RegExp(`/usuario/${ANA}$`));
  });
});

describe("transcrição só para quem está logado", () => {
  it("sem sessão, transcrever e revisar → 401 sem chamar o backend", async () => {
    const form = new FormData();
    form.append("audio", new Blob(["x"]), "a.mp3");
    expect((await transcrever(new Request("http://x", { method: "POST", body: form }))).status).toBe(401);
    expect(
      (await revisar(new Request("http://x", { method: "POST", body: JSON.stringify({ texto: "oi" }) }))).status,
    ).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("com sessão, o áudio segue para o backend", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const form = new FormData();
    form.append("audio", new Blob(["x"]), "a.mp3");
    await transcrever(new Request("http://x", { method: "POST", body: form }));
    expect(urlChamada()).toMatch(/\/transcribe$/);
  });
});

describe("troca de plano", () => {
  it("troca o plano do usuário da sessão, ignorando user_id no corpo", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura/plano", {
      method: "POST",
      body: JSON.stringify({ user_id: BRUNO, plan_id: "basico" }),
    });

    expect((await trocarPlano(pedido)).status).toBe(200);
    expect(urlChamada()).toMatch(/\/assinatura\/plano$/);
    expect(corpoChamado()).toEqual({ user_id: ANA, plan_id: "basico" });
  });

  it("sem sessão (ou com cookie forjado) → 401, sem chamar o backend", async () => {
    const pedido = () =>
      new Request("http://x/api/assinatura/plano", { method: "POST", body: JSON.stringify({ plan_id: "pro" }) });

    expect((await trocarPlano(pedido())).status).toBe(401);
    cookieAtual.valor = ANA;
    expect((await trocarPlano(pedido())).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
});

describe("dono vem sempre do cookie", () => {
  it("a transcrição do caso é buscada com o user_id da sessão", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    await obterCaso(new Request(`http://x/api/transcricao/caso?casoId=rescisao-silva&user_id=${BRUNO}`));

    const url = new URL(urlChamada());
    expect(url.searchParams.get("user_id")).toBe(ANA);
  });

  it("assinatura ignora user_id no corpo e usa o da sessão", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({
        user_id: BRUNO,
        plan_id: "pro",
        card_token: "tok_mock_visa_4242_1",
        card_expiry: "08/31",
        holder: { name: "Ana Silva", cpf: "52998224725" },
      }),
    });

    expect((await assinar(pedido)).status).toBe(200);
    expect(corpoChamado()).toEqual({
      user_id: ANA,
      plan_id: "pro",
      card: { brand: "visa", last4: "4242", expiry: "08/31", holder_name: "Ana Silva" },
    });
  });

  it("assinatura sem sessão → 401", async () => {
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({ plan_id: "pro", card_token: "tok_mock_visa_4242_1" }),
    });
    expect((await assinar(pedido)).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });

  it("cartão de teste 0002 é recusado (402) sem registrar assinatura", async () => {
    cookieAtual.valor = assinarSessao(ANA);
    const pedido = new Request("http://x/api/assinatura", {
      method: "POST",
      body: JSON.stringify({ plan_id: "pro", card_token: "tok_mock_visa_0002_1" }),
    });
    expect((await assinar(pedido)).status).toBe(402);
    expect(backend).not.toHaveBeenCalled();
  });
});
