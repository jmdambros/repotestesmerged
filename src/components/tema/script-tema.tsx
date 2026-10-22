/**
 * Roda antes da hidratação para o primeiro paint já sair no tema e na cor gravados.
 * next/script com beforeInteractive não bloqueia o paint o suficiente.
 */
export function ScriptTema() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var d=document.documentElement;if(localStorage.getItem('sophia-tema')==='escuro')d.classList.add('dark');var c=localStorage.getItem('sophia-destaque');d.setAttribute('data-destaque',c==='branco'||c==='azul'||c==='laranja'||c==='roxo'||c==='verde'?c:'verde')}catch(e){document.documentElement.setAttribute('data-destaque','verde')}})()`,
      }}
    />
  );
}
