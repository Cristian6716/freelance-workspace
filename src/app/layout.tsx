import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "[NOME_APP] — Workspace condiviso per freelance italiani",
    template: "%s · [NOME_APP]",
  },
  description:
    "Sostituisci WhatsApp, Drive, Excel e gestionali separati con un unico spazio di lavoro per te e i tuoi clienti.",
  applicationName: "[NOME_APP]",
  authors: [{ name: "Cristian Costache" }],
  keywords: [
    "freelance",
    "workspace cliente",
    "fatturazione elettronica",
    "SDI",
    "client portal",
    "gestionale freelance",
  ],
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf8fd" },
    { media: "(prefers-color-scheme: dark)", color: "#141218" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${newsreader.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
