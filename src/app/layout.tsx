import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Parisienne } from "next/font/google";
import { EsferaPublica } from "@/components/layout/esfera-publica";
import "@/styles/globals.css";

/**
 * Tipografia da marca, servida pelo próprio Next — evita requisição ao
 * Google Fonts em tempo de execução e elimina o salto de layout (CLS).
 * São exatamente as três famílias do site: Fraunces, Instrument Sans
 * e Parisienne.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-display",
  axes: ["SOFT", "WONK", "opsz"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-texto",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--fonte-assina",
});

export const metadata: Metadata = {
  title: {
    default: "Érika Bruna — Gestão de Consultoria",
    template: "%s · Érika Bruna",
  },
  description: "Sistema de gestão da consultoria gastronômica de Érika Bruna.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b2a1c",
  width: "device-width",
  initialScale: 1,
  // Sem `maximumScale`: bloquear o zoom prejudica acessibilidade.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${instrumentSans.variable} ${parisienne.variable}`}
    >
      <body>
        {/* A moldura pública é decidida na rota, não no segmento — o
            diagnóstico em /diagnostico não pode aparecer dentro da barra
            lateral do sistema. Ver src/lib/esfera.ts. */}
        <EsferaPublica>{children}</EsferaPublica>
      </body>
    </html>
  );
}
