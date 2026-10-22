import { describe, expect, it } from "vitest";

import { assinarSessao, lerSessaoAssinada } from "@/lib/servidor/cookie-assinado";

const SEGREDO = "segredo-de-teste";
const ANA = "98ff6434-655e-486f-b255-1bd89542ea7f";
const BRUNO = "d11143d4-e6d6-435b-9807-4ecd182e905f";

describe("cookie de sessão assinado", () => {
  it("devolve o usuário quando o cookie é legítimo", () => {
    expect(lerSessaoAssinada(assinarSessao(ANA, SEGREDO), SEGREDO)).toBe(ANA);
  });

  it("recusa o UUID puro (o formato antigo, que permitia se passar por outro usuário)", () => {
    expect(lerSessaoAssinada(BRUNO, SEGREDO)).toBe("");
  });

  it("recusa trocar o UUID mantendo a assinatura de outra pessoa", () => {
    const daAna = assinarSessao(ANA, SEGREDO);
    const forjado = `${BRUNO}.${daAna.split(".").pop()}`;
    expect(lerSessaoAssinada(forjado, SEGREDO)).toBe("");
  });

  it("recusa cookie assinado com outro segredo", () => {
    expect(lerSessaoAssinada(assinarSessao(BRUNO, "segredo-do-atacante"), SEGREDO)).toBe("");
  });

  it("recusa assinatura alterada, vazia ou cookie ausente", () => {
    const legitimo = assinarSessao(ANA, SEGREDO);
    expect(lerSessaoAssinada(`${legitimo}x`, SEGREDO)).toBe("");
    expect(lerSessaoAssinada(`${ANA}.`, SEGREDO)).toBe("");
    expect(lerSessaoAssinada(undefined, SEGREDO)).toBe("");
    expect(lerSessaoAssinada("", SEGREDO)).toBe("");
  });
});
