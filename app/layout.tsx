import type { Metadata, Viewport } from "next";
import { getRequestLocale } from "./request-locale";
import { LocaleProvider } from "../src/shared/i18n/locale-provider";
import Providers from "./providers";
import { AppShell } from "./_shell/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <head>
        <link
          rel="preload"
          href="/fonts/harmonyos-sans/HarmonyOS_Sans_SC.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LocaleProvider locale={locale}>
          <Providers>
            <AppShell locale={locale}>{children}</AppShell>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
