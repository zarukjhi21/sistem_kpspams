import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0284c7",
};

export const metadata: Metadata = {
  title: "SI-KPSPAMS KUAJANG | Sistem Informasi Pengelolaan Air Perdesaan",
  description: "Sistem Informasi Terpadu Pengelolaan KPSPAMS Lemo Baru, Lemo Tua, dan Sarampu 1 Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-surface-bg text-slate-900 flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

