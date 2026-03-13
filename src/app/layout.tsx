import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Interspeak – AI Voice Interview Coach",
  description: "Allenati per i colloqui di lavoro con un AI voice coach. Feedback in tempo reale, tutte le tipologie di interview.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="overflow-x-hidden">
        <body className={`${plusJakartaSans.className} ${syne.variable} antialiased bg-[#07070a] min-h-screen overflow-x-hidden`}>
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
