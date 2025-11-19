import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import 'leaflet/dist/leaflet.css';

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "PropertyHub - Каталог недвижимости",
  description: "Современная платформа для поиска и инвестирования в недвижимость. Жилые и нежилые помещения, машино-места, гараж-боксы.",
  keywords: "недвижимость, инвестиции, продажа, аренда, жилые помещения, нежилые помещения, машино-места, гараж-боксы",
  authors: [{ name: "PropertyHub" }],
  robots: "index, follow",
  openGraph: {
    title: "PropertyHub - Каталог недвижимости",
    description: "Современная платформа для поиска и инвестирования в недвижимость",
    type: "website",
    locale: "ru_RU",
  }
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PropertyHub" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
