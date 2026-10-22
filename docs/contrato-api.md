# Contrato de API do Sophia

Referência compartilhada entre o front e a equipe de backend. O front implementa um
adapter (`src/lib/api`) sobre a interface `SophiaApi`; hoje existe apenas o adapter
mockado, e trocar para HTTP não exige mudança nos componentes.

## Implementado no front

A API simulada cobre casos, análise preliminar, mensagens do chat e conteúdo do
repositório. Os tipos atuais estão em `src/lib/api/types.ts` e
`src/lib/api/analise.ts`. Cadastro e pagamento reproduzem o fluxo do protótipo;
não há autenticação externa nem cobrança, e senhas e dados de cartão não são
persistidos.

O adapter mantém os dados em memória até recarregar a página. O caso
`rescisao-silva` contém os textos de demonstração do Figma; outros casos começam
com seus próprios estados vazios. As referências do protótipo não são fontes
jurídicas verificadas. Os detalhes de cada insight deixam essa condição explícita;
análises reais sem URL verificável também exibem `nao verificado` no cartão.

```ts
type StatusCaso = "gravacao_pendente" | "em_analise" | "concluido";

interface Caso {
  id: string;
  titulo: string;      // "Rescisão contratual — Silva"
  cliente: string;     // exibido como "Cliente: …"
  status: StatusCaso;
  atualizadoEm: string; // ISO 8601
}

interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
}
```

## Modelos da análise

Este trecho foi derivado do documento de contexto do produto e orienta a
integração da tela de análise (frame "06 - Análise IA" do protótipo).

### Rastreabilidade das fontes

Requisito não negociável: nenhuma tese, tema ou jurisprudência pode aparecer sem
origem verificável. Quando a IA não consegue citar fonte, o item deve chegar com
`fontes` vazio, e a interface o sinaliza como não verificado — nunca esconde o
item nem inventa a referência.

```ts
interface Fonte {
  origem: string;         // tribunal ("STF", "STJ", "TJRS") ou lei ("Código Civil")
  identificador: string;  // "Tema 975", "REsp 1.234.567/SP"
  data: string;           // ISO 8601
  url?: string;
}
```

Categorias que exigem fonte: `tema_superior`, `tese`, `jurisprudencia`. Perguntas,
necessidades adicionais e possibilidade de acordo são leituras do próprio caso, não
afirmações sobre o direito, e por isso não exigem citação.

### Análise preliminar

```ts
type CategoriaInsight =
  | "tema_superior" | "tese" | "jurisprudencia"
  | "pergunta" | "necessidade" | "acordo";

type NivelRelevancia = "alta" | "media" | "baixa";
type PosicaoJurisprudencial = "majoritaria" | "minoritaria" | "em_analise";

interface Insight {
  id: string;
  categoria: CategoriaInsight;
  titulo: string;
  detalhe?: string;
  relevancia: NivelRelevancia;
  posicaoJurisprudencial?: PosicaoJurisprudencial;
  fontes: Fonte[];
  perguntasSugeridas?: string[];
  relacionadoA?: string;
}

interface AnalisePreliminar {
  id: string;
  casoId: string;
  versao: number;   // reanálises são incrementais, cada rodada gera uma versão
  geradaEm: string;
  insights: Insight[];
  avisos: AvisoAnalise[];
}
```

Decisões tomadas:

- **Relevância é sempre qualitativa.** Nenhum percentual de probabilidade de êxito é
  exposto ao usuário, para não criar falsa sensação de certeza jurídica num público
  que não tem repertório para conferir.
- **Reanálises são incrementais e versionadas**, não substituem a análise anterior.
- `solicitarAnalise(casoId, instrucao?)` recebe a instrução como opcional de
  propósito: o usuário-alvo não deve precisar escrever nada para obter o resultado.

### Documentos anexados

Documentos vêm de sistemas processuais e são tratados como conteúdo não confiável.
A sanitização contra instruções ocultas (prompt injection) acontece antes de o
documento entrar no contexto enviado à IA, e o resultado é visível na interface.

```ts
type ResultadoSanitizacao =
  | { status: "pendente" }
  | { status: "limpo" }
  | { status: "suspeito"; trechosRemovidos: number; descricao: string };
```

### Operações do fluxo

```ts
obterCaso(casoId): Promise<ConteudoCaso>;              // transcrição, documentos, análise e histórico
finalizarSessao(casoId, transcricao): Promise<Caso>;   // salva a transcrição, solicita análise e atualiza o status
solicitarAnalise(casoId, instrucao?): Promise<AnalisePreliminar>;
listarMensagens(casoId): Promise<MensagemChat[]>;
enviarMensagem(casoId, conteudo): Promise<MensagemChat[]>; // [mensagem do advogado, resposta]
```

Essas operações estão implementadas em `src/lib/api/mock/fluxo.ts` e são expostas
pelo mesmo objeto `api` das telas existentes. A reanálise incrementa a versão e
acrescenta um evento ao histórico; conversas são isoladas por `casoId`. Respostas
novas identificam o modo de demonstração, sem simular uma consulta jurídica real.

Ao confirmar o fim da gravação, a sessão aguarda `finalizarSessao`, atualiza a
lista e substitui a rota da sessão pela análise. Falhas mantêm a transcrição na
tela e permitem tentar novamente. O mock recebe as falas demonstrativas exibidas
na sessão (incluindo anotações com `papel: "nota"`); não captura áudio, não faz
transcrição real e não consulta o STF. Casos novos não recebem jurisprudência
fictícia: a análise informa que a integração está pendente. Os dados continuam em
memória e são perdidos ao recarregar a página.

A lista e a barra lateral abrem a gravação para casos `gravacao_pendente` e a
análise para os demais. Os botões de voltar usam a navegação interna da aba ou
uma rota de retorno quando a tela foi aberta diretamente por URL.

## Análise preliminar, chat e peças (backend real)

Ligados com `NEXT_PUBLIC_ANALISE_REAL=true`. Sem a variável, tudo segue em demonstração (mock).
Código: `backend/analise/` (FastAPI) e `src/lib/api/analise-real.ts` (adapter).

| Next (cookie → `user_id`) | Backend (porta 8000) | Resposta |
|---|---|---|
| `POST /api/analise` `{ casoId, instrucao? }` | `POST /analise/{caso_id}` `{ user_id, instrucao? }` | `{ analise: AnalisePreliminar }` · `404` sem transcrição/caso alheio · `502` IA |
| `GET /api/analise?casoId=` | `GET /analise/{caso_id}?user_id=` | `{ analise \| null, versoes[] }` |
| `GET /api/chat?casoId=` | `GET /chat/{caso_id}?user_id=` | `{ mensagens: MensagemChat[] }` |
| `POST /api/chat` `{ casoId, mensagem }` | `POST /chat/{caso_id}` `{ user_id, mensagem }` | `{ mensagens }` (pergunta + resposta) · `404` sem análise |
| — (sem tela ainda) | `POST /gerar-peca/{caso_id}` `{ user_id, tipo_peca, instrucoes_extra? }` | `{ rascunho, arquivo, aviso }`; `.docx` em `GET /gerar-peca/download/{arquivo}` |

Como funciona:

- **Fonte da transcrição:** o backend lê `transcript.text` da collection `case` (por `user_id` + `caso_id`);
  a transcrição não é copiada. Sem MongoDB configurado só o modo de desenvolvimento aceita `transcricao_texto`.
- **Banco das análises (provisório):** SQLite local (`backend/sophia_analises.db`), tabelas `analises`
  (uma linha por versão) e `mensagens`, sempre filtradas por `(user_id, caso_id)`. Trocar por um banco
  estruturado exige mexer só em `backend/analise/storage.py`.
- **Chave da IA no servidor:** `SOPHIA_LLM_PROVIDER` (padrão `groq`) + `<PROVEDOR>_API_KEY` em
  `backend/.env`. O navegador nunca vê nem envia chave (os planos vendem créditos de IA, não BYOK).
- **Mapeamento:** `backend/analise/mapeador.py` traduz o JSON da IA para `AnalisePreliminar`. Item cuja
  fonte é "não verificado" chega com `fontes: []`; `probabilidade` vira `relevancia` qualitativa.
- **Anti-alucinação (Seção 7 do documento de contexto):** o backend rejeita e refaz uma vez a resposta que
  traga "fonte não verificado" junto de número de processo/súmula/tema; depois disso devolve `502`.
- **Reanálise:** cada `POST /analise` cria uma nova versão e envia a anterior à IA como contexto.
- **Falha na análise ao finalizar a sessão:** o status do caso avança e a tela de análise oferece
  "Configurar IA" para tentar de novo.

## Conta, sessão e assinatura

Cadastro, login e assinatura passam por rotas do próprio Next (`src/app/api`), que
falam com o backend Python (`backend/main.py`, porta 8000) e cuidam do cookie de
sessão. O navegador nunca fala direto com o backend nem envia `user_id`.

### Fluxo

1. `/criar-conta` → `POST /api/auth/criar-conta` → backend `POST /cadastro`. O usuário
   nasce sem `account_status` (= pagamento pendente) e a sessão já é aberta.
2. `/assinatura` (plataforma R$ 150 + plano Básico/Intermediário/Pro) →
   `/assinatura/pagamento`: o cartão é tokenizado **no navegador** pelo gateway
   (`src/lib/pagamento`, hoje mockado) e o front manda só o token.
3. `POST /api/assinatura` lê o dono do cookie e chama o backend `POST /assinatura`,
   que recalcula o preço pelo `plan_id`, grava em `assinaturas` e passa o usuário
   para `account_status: "ativa"`.
4. No login (`POST /api/auth/entrar`), quem ainda não pagou vai para `/assinatura`;
   quem pagou vai para `/casos` (`rotaInicial` em `src/lib/conta.ts`).
5. `/casos` só abre com sessão e conta ativa (`GET /api/auth/eu` →
   backend `GET /usuario/{id}`); sem sessão vai para `/login`.

### Rotas do Next

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/criar-conta` | `{ nome, email, senha }` | `{ usuario }` + cookie · `400` dados/e-mail em uso |
| POST | `/api/auth/entrar` | `{ email, senha }` | `{ usuario }` (com `account_status`) + cookie · `401` |
| POST | `/api/auth/sair` | — | `{ ok: true }`, apaga o cookie |
| GET | `/api/auth/eu` | — | `{ usuario }` · `401` sem sessão ou cookie adulterado |
| POST | `/api/assinatura` | `{ plan_id, card_token, holder }` | `{ assinatura }` · `402` recusado · `401` |

Erros vêm como `{ "erro": "texto para o usuário" }`, no padrão do backend. Os
formatos (`UsuarioApi`, `AssinaturaApi`…) estão em `src/lib/api/http/mapeadores.ts`.

### Cookie de sessão assinado

O cookie `sophia_user_id` guarda `<userId>.<HMAC-SHA256>` (`src/lib/servidor/cookie-assinado.ts`),
não mais o UUID puro. Antes, bastava editar o cookie com o UUID de outra pessoa para
entrar na conta dela; agora qualquer alteração invalida a sessão. O segredo vem de
`SESSION_SECRET` (obrigatória em produção, ver `.env.example`). Cookies antigos, sem
assinatura, deixam de valer: quem estava logado precisa entrar de novo.

### Coleção `assinaturas` (MongoDB)

```js
{
  _id: "uuid",
  user_id: "uuid do users",          // vínculo assinatura ↔ usuário
  plan_id: "intermediario",
  status: "ativa",
  platform_amount: 15000,             // centavos, calculados no backend
  plan_amount: 25000,
  monthly_amount: 40000,
  card: { brand: "visa", last4: "4242" },  // só exibição; número e CVV nunca chegam aqui
  created_at: "2026-10-20T17:25:00"
}
```

Quando o gateway real entrar: guardar o id do cliente/método de pagamento do
gateway, nunca o token de uso único, e atualizar o status mensal por webhook.

## Isolamento por usuário (obrigatório no backend)

Cada usuário só pode ver e alterar os próprios casos. O front já se comporta
assim — nunca envia `user_id`, só mostra o que a API devolve e trata caso alheio
como inexistente —, mas **a garantia de verdade é do backend**.

Regras:

1. **O `user_id` sai sempre da sessão.** Nas rotas do Next ele vem do cookie
   assinado (`idDoUsuarioNaSessao`); nunca da URL, do corpo ou de query string.
2. **Toda consulta a `case` filtra pelo dono** — o backend já faz
   `find_one({ "user_id": ..., "caso_id": ... })` em `/caso` e `/salvar-transcricao`.
3. **Caso de outro usuário responde `404`, igual a caso inexistente**, para não
   revelar que aquele id existe.
4. **`transcript` herda o dono do caso.** Os documentos antigos dessa coleção não
   têm `case_id` nem `user_id`; transcrições novas ficam dentro de `case`, que tem dono.

**Atenção — o backend confia no `user_id` que recebe.** As rotas `/caso`,
`/salvar-transcricao`, `/usuario/{id}` e `/assinatura` aceitam o `user_id` como
parâmetro, e o CORS está liberado para qualquer origem. Isso só é seguro enquanto
a porta 8000 **não** estiver exposta à internet e apenas o servidor Next a chamar.
Em produção: deixar o backend em rede interna ou exigir um token compartilhado
entre Next e backend (ex.: header `X-Sophia-Interno`).

### Ajustes pendentes no banco atual

| Coleção | Ajuste |
|---|---|
| `users` | `account_status` passa a ser gravado pela assinatura; contas antigas sem o campo são tratadas como pagamento pendente. Um documento (`testefront@teste.com`) está sem `name`. |
| `case` | Faltam os campos de listagem (`title`, `client_name`, `status`, `folder`) para a lista de casos sair do mock. O `user_id` do caso de teste (`a3f1c2e4-…-000000000001`) não existe em `users`. |
| `transcript` | Documentos sem dono e com nomes de campo misturados (`texto`/`criado_em` × `text`/`created_at`). |

### Testes

`npm test` roda os testes do front (Vitest): isolamento de casos entre dois
usuários, cookie forjado/adulterado e as rotas de conta. A API real deve cobrir os
mesmos cenários com dois usuários A e B: B não lista, não abre, não altera e não
exclui caso de A (`404`), e nada funciona sem sessão (`401`).
