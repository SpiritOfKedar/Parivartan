import type { Metadata } from "next";
import {
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
  Syne,
} from "next/font/google";
import { SiteBackdrop } from "../components/site-backdrop";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { getDictionary } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n/request-locale";
import { LocaleProvider } from "../lib/i18n/locale-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  return {
    title: {
      default: messages.meta.title,
      template: `%s · ${messages.meta.title}`,
    },
    description: messages.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`h-full dark ${jakarta.variable} ${syne.variable} ${notoDevanagari.variable}`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider initialLocale={locale}>
          <SiteBackdrop />
          <SiteHeader />
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
