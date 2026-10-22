/**
 * Ícones da trilha lateral, nas medidas do Figma (caixa 20×20).
 */

export function IconeNovoCaso() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[3px] left-[3px] size-[14px] rounded-[3px] border-[1.5px]" />
      <span className="bg-tinta-suave absolute top-[9.25px] left-[6px] h-[1.5px] w-[8px]" />
      <span className="bg-tinta-suave absolute top-[6px] left-[9.25px] h-[8px] w-[1.5px]" />
    </span>
  );
}

export function IconeCasos() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[2px] left-[4px] h-[15px] w-[12px] rounded-[2px] border-[1.5px]" />
      <span className="bg-tinta-suave absolute top-[7px] left-[7px] h-[1.2px] w-[6px]" />
      <span className="bg-tinta-suave absolute top-[10px] left-[7px] h-[1.2px] w-[6px]" />
    </span>
  );
}

export function IconeRepositorio() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[5px] left-[3px] h-[2.5px] w-[7px] rounded-[1px] border-[1.5px]" />
      <span className="border-tinta-suave absolute top-[7px] left-[3px] h-[10px] w-[14px] rounded-[2px] border-[1.5px]" />
    </span>
  );
}

export function IconeConfiguracoes() {
  return (
    <span className="flex size-5 items-center justify-center">
      <svg aria-hidden viewBox="0 0 24 24" className="text-tinta-suave size-[14px]">
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function IconeRestaurar() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M5 8.5A5 5 0 1 1 6.2 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 4.5v4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeLixeira() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M5 6.5h10M8 6.5V5.2A1.2 1.2 0 0 1 9.2 4h1.6A1.2 1.2 0 0 1 12 5.2V6.5M7 6.5v8.2A1.3 1.3 0 0 0 8.3 16h3.4a1.3 1.3 0 0 0 1.3-1.3V6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeTelefone() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M6.2 3.8c.4-.4 1-.5 1.5-.2l1.6.8c.4.2.7.7.6 1.2l-.3 1.6c0 .3.1.6.3.8l1.7 1.7c.2.2.5.3.8.3l1.6-.3c.5-.1 1 .2 1.2.6l.8 1.6c.3.5.2 1.1-.2 1.5l-.9.9c-.8.8-2 .9-3.4.4-2.1-.8-3.9-2.3-5.2-4.3C5.2 8.4 4.5 6.3 4.8 4.9c.2-1 .8-1.6 1.4-2.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeSair() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M8 4.5H5.5A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 10H16M13.5 7.5 16 10l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hamburguer() {
  return (
    <span aria-hidden className="flex h-[12px] w-[18px] flex-col gap-[4px]">
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
    </span>
  );
}
