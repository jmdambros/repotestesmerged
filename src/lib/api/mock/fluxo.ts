import type { Caso } from "../types";
import type { AnalisePreliminar, ConteudoCaso, MensagemChat } from "../analise";

interface DependenciasFluxo {
  /** Só devolve casos do dono da sessão. */
  encontrarCaso: (id: string) => Caso | undefined;
  /** Persiste o caso alterado (status, data) na lista do dono. */
  salvarCaso: (caso: Caso) => void;
  /** Id do dono da sessão: análise e chat ficam separados por usuário mesmo quando os ids de caso coincidem. */
  escopo: () => string;
}

export function criarMockFluxo({ encontrarCaso, salvarCaso, escopo }: DependenciasFluxo) {
  const conteudos = new Map<string, ConteudoCaso>();
  const conversas = new Map<string, MensagemChat[]>();
  const chave = (casoId: string) => `${escopo()}:${casoId}`;

  function obterConteudo(casoId: string) {
    const caso = encontrarCaso(casoId);
    if (!caso) throw new Error("Caso nao encontrado.");
    const existente = conteudos.get(chave(casoId));
    if (existente) return existente;
    const conteudo: ConteudoCaso = {
      casoId,
      titulo: caso.titulo,
      analise: null,
      versoesAnalise: [],
      transcricao: [],
      documentos: [],
      historico: [],
    };
    conteudos.set(chave(casoId), conteudo);
    return conteudo;
  }

  function obterMensagens(casoId: string) {
    obterConteudo(casoId);
    if (!conversas.has(chave(casoId))) conversas.set(chave(casoId), []);
    return conversas.get(chave(casoId))!;
  }

  return {
    async finalizarSessao(casoId: string, transcricao: ConteudoCaso["transcricao"]): Promise<Caso> {
      if (!transcricao.some((fala) => fala.papel !== "nota" && fala.texto.trim())) {
        throw new Error("A transcricao esta vazia.");
      }
      const conteudo = obterConteudo(casoId);
      conteudo.transcricao = structuredClone(transcricao);
      await this.solicitarAnalise(casoId);
      const caso: Caso = {
        ...encontrarCaso(casoId)!,
        status: "em_analise",
        atualizadoEm: new Date().toISOString(),
      };
      salvarCaso(caso);
      return structuredClone(caso);
    },
    async obterCaso(casoId: string): Promise<ConteudoCaso> {
      return structuredClone(obterConteudo(casoId));
    },
    async solicitarAnalise(
      casoId: string,
      instrucao?: string,
    ): Promise<AnalisePreliminar> {
      const conteudo = obterConteudo(casoId);
      const versao = (conteudo.analise?.versao ?? 0) + 1;
      const analise: AnalisePreliminar = {
        id: `${casoId}-analise-${versao}`,
        casoId,
        versao,
        geradaEm: new Date().toISOString(),
        resumo:
          conteudo.analise?.resumo ??
          (conteudo.transcricao.length
            ? "Transcricao recebida. A analise juridica e a consulta aos tribunais dependem da integracao com a IA."
            : "A analise deste caso estara disponivel apos o processamento da transcricao e dos documentos."),
        insights: structuredClone(conteudo.analise?.insights ?? []),
        demonstracao: true,
        instrucao,
      };
      conteudo.analise = analise;
      conteudo.versoesAnalise.unshift(structuredClone(analise));
      conteudo.historico.unshift({
        id: analise.id,
        descricao: `Analise preliminar - versao ${versao}`,
        data: analise.geradaEm,
      });
      return structuredClone(analise);
    },
    async listarMensagens(casoId: string): Promise<MensagemChat[]> {
      return structuredClone(obterMensagens(casoId));
    },
    async enviarMensagem(
      casoId: string,
      conteudo: string,
    ): Promise<MensagemChat[]> {
      if (!conteudo.trim()) throw new Error("Digite uma mensagem.");
      const mensagens = obterMensagens(casoId);
      const criadaEm = new Date().toISOString();
      const novas: MensagemChat[] = [
        {
          id: crypto.randomUUID(),
          papel: "advogado",
          conteudo: conteudo.trim(),
          criadaEm,
        },
        {
          id: crypto.randomUUID(),
          papel: "assistente",
          conteudo:
            "Mensagem recebida. Este chat esta em demonstracao; a resposta juridica e a geracao da peca estarao disponiveis com a integracao da IA.",
          criadaEm,
        },
      ];
      mensagens.push(...novas);
      obterConteudo(casoId).historico.unshift({
        id: novas[0].id,
        descricao: "Nova pergunta no chat",
        data: criadaEm,
      });
      return structuredClone(novas);
    },
  };
}
