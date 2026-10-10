/**
 * Generator Struk Digital KPSPAMS Kuajang (Canvas to Image PNG)
 * 100% lightweight, tanpa library pihak ketiga, kompatibel browser mobile HP & desktop.
 */

export interface ReceiptData {
  isPaid: boolean;
  kpspamsName: string;
  receiptNumber?: string;
  invoiceNumber: string;
  connectionNo: string;
  customerName: string;
  dusun: string;
  periodName: string;
  meterBrand?: string;
  meterSerial?: string;
  usageM3: number;
  waterAmount: number;
  adminFee: number;
  totalAmount: number;
  paidAt?: string | null;
  paymentMethod?: string;
  dueDate?: string;
}

export function downloadReceiptAsImage(options: ReceiptData) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set resolusi tinggi retina (800 x 1150)
  canvas.width = 800;
  canvas.height = 1150;

  // Background luar
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, 800, 1150);

  // Background kartu struk
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 40, 720, 1070, 24);
  ctx.fill();
  ctx.stroke();

  // Strip warna penanda status di bagian atas kartu
  ctx.fillStyle = options.isPaid ? "#059669" : "#D97706";
  ctx.beginPath();
  ctx.roundRect(40, 40, 720, 14, [24, 24, 0, 0]);
  ctx.fill();

  // Kop Surat Struk
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PEMERINTAH DESA KUAJANG • KEC. BINUANG", 400, 95);

  ctx.fillStyle = "#0F172A";
  ctx.font = "900 26px sans-serif";
  ctx.fillText(options.kpspamsName.toUpperCase(), 400, 132);

  ctx.fillStyle = "#64748B";
  ctx.font = "15px sans-serif";
  ctx.fillText("Sistem Informasi Pengelolaan Air Bersih & Sanitasi (SI-KPSPAMS)", 400, 162);

  // Badge Status Transaksi
  const badgeY = 195;
  ctx.fillStyle = options.isPaid ? "#DCFCE7" : "#FEF3C7";
  ctx.strokeStyle = options.isPaid ? "#16A34A" : "#D97706";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(190, badgeY, 420, 46, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = options.isPaid ? "#166534" : "#92400E";
  ctx.font = "900 19px sans-serif";
  ctx.fillText(
    options.isPaid ? "✓ BUKTI PEMBAYARAN IURAN RESMI (LUNAS)" : "● LEMBAR TAGIHAN IURAN AIR (BELUM LUNAS)",
    400,
    badgeY + 30
  );

  // Garis putus-putus
  const drawDashedLine = (y: number) => {
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(730, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDashedLine(270);

  // Baris Teks Rincian
  const drawRow = (label: string, value: string, y: number, isBoldValue = false, valueColor = "#0F172A") => {
    ctx.fillStyle = "#64748B";
    ctx.font = "17px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, 70, y);

    ctx.fillStyle = valueColor;
    ctx.font = isBoldValue ? "bold 17px monospace" : "17px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(value, 730, y);
  };

  // Informasi Pelanggan & Tagihan
  let currY = 310;
  if (options.isPaid) {
    drawRow("Nomor Kwitansi:", options.receiptNumber || "KW/202610/KP01/LUNAS", currY, true, "#047857");
    currY += 38;
  }
  drawRow("Nomor Tagihan (Invoice):", options.invoiceNumber, currY, true);
  currY += 38;
  drawRow("No. Sambungan Rumah (SR):", options.connectionNo, currY, true, "#7F1D1D");
  currY += 38;
  drawRow("Nama Pelanggan:", options.customerName.toUpperCase(), currY, true);
  currY += 38;
  drawRow("Wilayah / Dusun:", "Dusun " + options.dusun, currY);
  currY += 38;
  drawRow("Periode Tagihan:", options.periodName, currY, true);
  currY += 42;

  drawDashedLine(currY);
  currY += 42;

  // Rincian Meteran
  drawRow("Seri Meter Air:", `${options.meterBrand || "SNI"} (${options.meterSerial || "MTR-1001"})`, currY);
  currY += 38;
  drawRow("Volume Pemakaian:", `${options.usageM3} m³`, currY, true);
  currY += 38;
  drawRow("Biaya Pemakaian Air:", `Rp ${options.waterAmount.toLocaleString("id-ID")}`, currY);
  currY += 38;
  drawRow("Beban Dasar & Administrasi:", `Rp ${options.adminFee.toLocaleString("id-ID")}`, currY);
  currY += 42;

  drawDashedLine(currY);
  currY += 38;

  // Kotak Total Nominal
  ctx.fillStyle = options.isPaid ? "#F0FDF4" : "#FFFBEB";
  ctx.strokeStyle = options.isPaid ? "#86EFAC" : "#FDE68A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(70, currY, 660, 78, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(options.isPaid ? "TOTAL PEMBAYARAN:" : "TOTAL TAGIHAN:", 95, currY + 47);

  ctx.fillStyle = options.isPaid ? "#15803D" : "#B45309";
  ctx.font = "900 28px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Rp ${options.totalAmount.toLocaleString("id-ID")},-`, 705, currY + 50);

  currY += 115;

  // Status Tambahan
  if (options.isPaid) {
    drawRow("Status Pelunasan:", "✓ LUNAS (SELESAI)", currY, true, "#15803D");
    currY += 35;
    drawRow("Metode Pembayaran:", options.paymentMethod || "Kasir Lapangan (Tunai)", currY);
    currY += 35;
    const paidDate = options.paidAt
      ? new Date(options.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "Oktober 2026";
    drawRow("Waktu Pembayaran:", paidDate, currY);
  } else {
    drawRow("Status Pembayaran:", "● MENUNGGU PEMBAYARAN", currY, true, "#B45309");
    currY += 35;
    drawRow("Batas Jatuh Tempo:", options.dueDate || "20 Oktober 2026", currY, true, "#DC2626");
    currY += 35;
    drawRow("Rekening BRI KPSPAMS:", "0214-01-002345-53-1", currY, true);
  }

  // Footer Stempel Keabsahan Digital
  currY = 1045;
  drawDashedLine(currY);
  currY += 32;

  ctx.fillStyle = "#64748B";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Dokumen Sah Digital SI-KPSPAMS Desa Kuajang", 70, currY);

  ctx.textAlign = "right";
  const nowStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  ctx.fillText(`Diunduh: ${nowStr}`, 730, currY);

  // Trigger unduh file otomatis ke HP / PC
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  const cleanCode = options.connectionNo.replace(/[^A-Za-z0-9]/g, "_");
  const prefix = options.isPaid ? "Kwitansi_Lunas" : "Struk_Tagihan";
  a.download = `${prefix}_${cleanCode}.png`;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
