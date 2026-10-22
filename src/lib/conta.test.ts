import { describe, expect, it } from "vitest";

import type { Usuario } from "@/lib/api/types";
import { redirecionamentoDosCasos, rotaInicial } from "@/lib/conta";

const usuario = (statusConta: Usuario["statusConta"]): Usuario => ({
  id: "u1",
  nome: "Ana",
  email: "ana@teste.com",
  statusConta,
  criadoEm: "2026-10-01T00:00:00.000Z",
});

describe("acesso a /casos", () => {
  it("manda para o login quem não tem sessão", () => {
    expect(redirecionamentoDosCasos(null)).toBe("/login");
  });

  it("manda para a assinatura quem ainda não pagou", () => {
    expect(redirecionamentoDosCasos(usuario("pagamento_pendente"))).toBe("/assinatura");
  });

  it("libera quem tem assinatura ativa", () => {
    expect(redirecionamentoDosCasos(usuario("ativa"))).toBeNull();
  });
});

describe("rota depois de entrar ou criar conta", () => {
  it("segue o status da conta", () => {
    expect(rotaInicial(usuario("pagamento_pendente"))).toBe("/assinatura");
    expect(rotaInicial(usuario("ativa"))).toBe("/casos");
  });
});
