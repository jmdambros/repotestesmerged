import { beforeEach } from "vitest";

/** `sessionStorage` em memória: o mock da API guarda contas, sessão e casos nele. */
class ArmazenamentoEmMemoria implements Storage {
  private dados = new Map<string, string>();

  get length() {
    return this.dados.size;
  }
  clear() {
    this.dados.clear();
  }
  getItem(chave: string) {
    return this.dados.get(chave) ?? null;
  }
  key(indice: number) {
    return [...this.dados.keys()][indice] ?? null;
  }
  removeItem(chave: string) {
    this.dados.delete(chave);
  }
  setItem(chave: string, valor: string) {
    this.dados.set(chave, String(valor));
  }
}

globalThis.sessionStorage = new ArmazenamentoEmMemoria();

beforeEach(() => {
  sessionStorage.clear();
});
