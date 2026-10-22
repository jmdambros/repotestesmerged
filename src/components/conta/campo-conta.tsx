import { useId, type InputHTMLAttributes } from "react";

interface CampoContaProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  compacto?: boolean;
}

export function CampoConta({
  rotulo,
  compacto = false,
  ...props
}: CampoContaProps) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-[6px]">
      <label
        htmlFor={id}
        className={`text-tinta-suave font-medium ${compacto ? "text-[12px] leading-[15px]" : "text-[13px] leading-4"}`}
      >
        {rotulo}
      </label>
      <input
        {...props}
        id={id}
        className="bg-campo border-borda focus:border-destaque focus:ring-destaque/20 h-10 w-full min-w-0 rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2"
      />
    </div>
  );
}
