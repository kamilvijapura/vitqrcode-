import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders, themeInitScript } from "@/lib/providers";
import { ToastProvider } from "@/components/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChromaShield Rewards — QR Loyalty Platform",
  description:
    "Enterprise QR Rewards & Loyalty platform for manufacturers. Authenticate products, reward customers, prevent counterfeits.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppProviders>
          <ToastProvider>{children}</ToastProvider>
        </AppProviders>
      </body>
    </html>
  );
}
