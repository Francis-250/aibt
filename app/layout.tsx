import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/hooks/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "TyphoidWatch Rwanda", template: "%s | TyphoidWatch" },
  description:
    "AI-assisted typhoid fever surveillance, outbreak prediction, and response coordination.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
