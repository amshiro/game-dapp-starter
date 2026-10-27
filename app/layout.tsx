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
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
