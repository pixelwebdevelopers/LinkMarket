import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import NextTopLoader from "nextjs-toploader";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rankistic – The #1 Link Building Marketplace",
  description:
    "Buy and sell high-quality backlinks. Guest posts and niche edits from curated sites.",
};

// Default theme: light. Remove any dark theme preferences to stick to white theme only.
const noFlashScript = `
(function(){try{localStorage.removeItem('theme');document.documentElement.classList.remove('dark');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${inter.className} bg-white text-zinc-900 antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <NextTopLoader color="#4f46e5" showSpinner={false} height={3.5} />
            <AppLayout>{children}</AppLayout>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
