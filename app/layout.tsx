import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rankistic – The #1 Link Building Marketplace",
  description:
    "Buy and sell high-quality backlinks. Guest posts and niche edits from curated sites.",
};

// Default theme: light. Only apply the `dark` class if the user has explicitly
// chosen dark in localStorage. Run before paint to avoid flash.
const noFlashScript = `
(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();
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
      <body className={`${inter.className} bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased transition-colors duration-200`}>
        <ThemeProvider>
          <SessionProvider>
            <Navbar />
            <main>{children}</main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
