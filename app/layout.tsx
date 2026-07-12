import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif for headlines — sans stays for chrome (nav, buttons, meta).
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Ghana Newspapers — Breaking News, World, Politics, Business",
    template: "%s | Ghana Newspapers",
  },
  description:
    "Ghana Newspapers — breaking news and in-depth coverage of world affairs, politics, business, technology, sports, health and entertainment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased bg-background`}
    >
      <body className="min-h-full flex flex-col bg-background">{children}</body>
    </html>
  );
}
