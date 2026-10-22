/** Lê a duração de um arquivo de áudio no navegador, em segundos. */
export function duracaoDoAudio(arquivo: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const audio = document.createElement("audio");
    let encerrado = false;
    const limite = window.setTimeout(falhar, 4000);

    function concluir(segundos: number) {
      if (encerrado) return;
      encerrado = true;
      window.clearTimeout(limite);
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
      if (!Number.isFinite(segundos) || segundos <= 0) {
        reject(new Error("Não foi possível ler a duração do áudio."));
        return;
      }
      resolve(segundos);
    }

    function falhar() {
      if (encerrado) return;
      encerrado = true;
      window.clearTimeout(limite);
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a duração do áudio."));
    }

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        concluir(audio.duration);
        return;
      }
      // Alguns contêineres, como WebM, só informam a duração depois de um seek.
      const aoAvancar = () => {
        audio.removeEventListener("timeupdate", aoAvancar);
        concluir(audio.duration);
      };
      audio.addEventListener("timeupdate", aoAvancar);
      try {
        audio.currentTime = 1e101;
      } catch {
        falhar();
      }
    };
    audio.onerror = falhar;
    audio.src = url;
  });
}
