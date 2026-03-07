import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import Script from "next/script";
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
  title: "Intervoice – AI Voice Interview Coach",
  description: "Allenati per i colloqui di lavoro con un AI voice coach. Feedback in tempo reale, tutte le tipologie di interview.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] min-h-screen`}
        >
          <Navbar />
          {children}
          <Toaster />
          <Script
            src="https://embeds.iubenda.com/widgets/9081dd11-cd1e-4cdc-86cb-0a3479d67b2a.js"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
