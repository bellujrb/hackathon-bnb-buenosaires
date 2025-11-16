import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/ui/mini-navbar";
import { Providers } from "./providers";
import { ArtifactProvider } from "@/contexts/artifact-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dropit AI",
  description: "AI‑powered KYW and Airdrops for BNB Chain",
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
      >
        <Navbar />
        <Providers>
          <ArtifactProvider>
            <ToastProvider>{children}</ToastProvider>
          </ArtifactProvider>
        </Providers>
      </body>
    </html>
  );
}
