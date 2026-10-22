import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ScriptTema } from "@/components/tema/script-tema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProvedorNavegacao } from "@/components/fluxo/botao-voltar";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sophia — IA que apoia advogados em reuniões com clientes",
  description:
    "Plataforma web para advogados e escritórios jurídicos: transforma a entrevista com o cliente em uma análise preliminar do caso.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-destaque="verde"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <ScriptTema />
      </head>
      <body className="bg-fundo text-tinta flex min-h-full flex-col">
        <TooltipProvider delay={200}>
          <ProvedorNavegacao>{children}</ProvedorNavegacao>
        </TooltipProvider>
      </body>
    </html>
  );
}
