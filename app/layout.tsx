import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { AppLayout } from "@/components/AppLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liar's Bar",
  description: "A game of deception and strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WalletProvider>
          <AppLayout>{children}</AppLayout>
        </WalletProvider>
      </body>
    </html>
  );
}
