import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Centimo", template: "%s · Centimo" },
  description: "Controla tus gastos con precisión de trader.",
  applicationName: "Centimo",
  appleWebApp: { capable: true, title: "Centimo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090c0b" },
    { media: "(prefers-color-scheme: light)", color: "#eef2f1" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="top-center" theme="system" toastOptions={{ className: "!rounded-xl" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
