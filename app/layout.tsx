import type { Metadata, Viewport } from "next";
import { resolveLocale } from "@/src/shared/i18n/locale";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={resolveLocale()}>
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
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
