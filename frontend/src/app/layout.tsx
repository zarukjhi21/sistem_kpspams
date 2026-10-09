import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7f1d1d",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sikpspams-kuajang.pages.dev"),
  title: "SI-KPSPAMS KUAJANG | Sistem Informasi Pengelolaan Air Perdesaan",
  description: "Sistem Informasi Terpadu Pengelolaan KPSPAMS Desa Kuajang: Cek tagihan mandiri warga, transparansi kas operasional riil, dan peta geospasial jaringan air bersih.",
  applicationName: "SI-KPSPAMS Kuajang",
  authors: [{ name: "Pemerintah Desa Kuajang" }, { name: "Pua Kaso" }],
  creator: "Pua Kaso",
  keywords: [
    "KPSPAMS",
    "Desa Kuajang",
    "Air Bersih",
    "Lemo Baru",
    "Wai Kaili",
    "Polewali Mandar",
    "Transparansi Kas",
    "Cek Tagihan Air",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://sikpspams-kuajang.pages.dev",
    siteName: "SI-KPSPAMS Desa Kuajang",
    title: "SI-KPSPAMS KUAJANG • Transparansi & Layanan Air Bersih",
    description: "Layanan air bersih mandiri Desa Kuajang. Cek tagihan warga secara online, pantau kas operasional riil Rp 30.1 Juta, dan lihat peta pipa air Dusun Lemo Baru.",
    images: [
      {
        url: "/logo.jpg",
        width: 600,
        height: 600,
        alt: "Logo Resmi SI-KPSPAMS Desa Kuajang",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SI-KPSPAMS KUAJANG • Layanan Air Bersih Desa Kuajang",
    description: "Cek tagihan warga mandiri, pantau transparansi kas riil, dan debit air pegunungan Wai Kaili Desa Kuajang.",
    images: ["/logo.jpg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SI-KPSPAMS",
  },
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

