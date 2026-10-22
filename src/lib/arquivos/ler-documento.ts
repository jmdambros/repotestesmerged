/** Lê o texto de um PDF, Word, DOC ou TXT enviado na tela de relato. */

function lerU16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function lerU32(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

async function inflar(dados: Uint8Array) {
  const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/** Abre o XML do documento dentro do DOCX (arquivo zip). */
async function xmlDoDocx(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let cursor = 0;
  while (cursor + 30 < bytes.length && lerU32(bytes, cursor) === 0x04034b50) {
    const metodo = lerU16(bytes, cursor + 8);
    const tamanho = lerU32(bytes, cursor + 18);
    const nomeLen = lerU16(bytes, cursor + 26);
    const extraLen = lerU16(bytes, cursor + 28);
    const inicioNome = cursor + 30;
    const nome = new TextDecoder().decode(bytes.subarray(inicioNome, inicioNome + nomeLen));
    const inicio = inicioNome + nomeLen + extraLen;
    if (tamanho === 0) break;
    const comprimido = bytes.subarray(inicio, inicio + tamanho);
    if (nome === "word/document.xml") {
      const xml = metodo === 0 ? comprimido : metodo === 8 ? await inflar(comprimido) : null;
      if (!xml) return "";
      return new TextDecoder().decode(xml);
    }
    cursor = inicio + tamanho;
  }
  return "";
}

function textoDoXmlWord(xml: string) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, codigo: string) => String.fromCharCode(Number(codigo)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textoLegivel(bruto: string) {
  const trechos = bruto.match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .,;:'"()%\-/]{15,}/g) ?? [];
  return trechos.join("\n").replace(/[ \t]{2,}/g, " ").trim();
}

function textoDoPdf(buffer: ArrayBuffer) {
  const bruto = new TextDecoder("latin1").decode(buffer);
  const partes: string[] = [];
  const literais = bruto.matchAll(/\((?:\\\)|\\.|(?!\))[^\\])*\)\s*Tj/g);
  for (const encontrado of literais) {
    const miolo = encontrado[0].slice(1, encontrado[0].lastIndexOf(")"));
    partes.push(miolo.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")"));
  }
  return textoLegivel(partes.join("\n"));
}

function textoDoDoc(buffer: ArrayBuffer) {
  return textoLegivel(new TextDecoder("utf-16le").decode(buffer));
}

/** Áudios que o Whisper desta instalação consegue abrir. */
export const EXTENSOES_AUDIO = [
  ".mp3",
  ".wav",
  ".m4a",
  ".m4b",
  ".aac",
  ".mp4",
  ".ogg",
  ".opus",
  ".flac",
  ".webm",
  ".wma",
  ".aiff",
  ".aif",
  ".mp2",
  ".amr",
  ".3gp",
];

export const EXTENSOES_DOCUMENTO = [".pdf", ".doc", ".docx", ".txt"];

export function ehAudio(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  return EXTENSOES_AUDIO.some((extensao) => nome.endsWith(extensao));
}

export async function lerTextoDeArquivo(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  let texto = "";
  if (nome.endsWith(".txt")) texto = await arquivo.text();
  else if (nome.endsWith(".docx")) texto = textoDoXmlWord(await xmlDoDocx(await arquivo.arrayBuffer()));
  else if (nome.endsWith(".pdf")) texto = textoDoPdf(await arquivo.arrayBuffer());
  else if (nome.endsWith(".doc")) texto = textoDoDoc(await arquivo.arrayBuffer());
  else throw new Error("Formato não suportado. Envie um áudio, PDF, Word, DOC ou TXT.");

  texto = texto.replace(/\u0000/g, "").trim();
  if (texto.length < 20) {
    throw new Error("Não foi possível ler texto suficiente neste arquivo. Use um TXT ou DOCX com o relato.");
  }
  return texto;
}
