/**
 * Generator Ekspor Laporan Pertanggungjawaban (LPJ) Resmi KPSPAMS Desa Kuajang
 * 1-Klik Unduh Excel (.xls) dan CSV (.csv) untuk Kepala Desa dan BPD.
 */

export interface LpjCustomerItem {
  id: number;
  connectionNo: string;
  name: string;
  dusun: string;
  lastReading: number;
  status: "PAID" | "UNPAID" | string;
  totalAmount: number;
  paidAt?: string | null;
}

export interface LpjTransactionItem {
  id: number;
  txNumber: string;
  date: string;
  category: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
}

export interface LpjExportData {
  periodName: string;
  kpspamsName: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  totalConnections: number;
  paidConnections: number;
  unpaidConnections: number;
  collectionRate: number;
  transactions: LpjTransactionItem[];
  customers: LpjCustomerItem[];
}

export function exportLpjToExcel(data: LpjExportData) {
  if (typeof window === "undefined") return;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>LPJ ${data.periodName}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        .kop-header { text-align: center; font-weight: bold; font-size: 13pt; }
        .kop-sub { text-align: center; font-size: 10pt; color: #475569; }
        .title { text-align: center; font-weight: bold; font-size: 14pt; text-decoration: underline; padding: 10px 0; }
        .section-header { font-weight: bold; font-size: 11pt; background-color: #1e293b; color: #ffffff; padding: 6px; }
        .th-main { background-color: #f1f5f9; font-weight: bold; border: 1px solid #94a3b8; text-align: center; padding: 6px; }
        .td-data { border: 1px solid #cbd5e1; padding: 5px; }
        .td-num { border: 1px solid #cbd5e1; padding: 5px; text-align: right; }
        .td-center { border: 1px solid #cbd5e1; padding: 5px; text-align: center; }
        .sum-box { background-color: #f8fafc; font-weight: bold; border: 1px solid #64748b; }
        .lunas { color: #166534; font-weight: bold; }
        .belum { color: #991b1b; font-weight: bold; }
        .ttd-box { text-align: center; font-size: 10pt; padding-top: 30px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="7" class="kop-header">PEMERINTAH KABUPATEN POLEWALI MANDAR • KECAMATAN BINUANG</td>
        </tr>
        <tr>
          <td colspan="7" class="kop-header">PEMERINTAH DESA KUAJANG</td>
        </tr>
        <tr>
          <td colspan="7" class="kop-header">PENGURUS ${data.kpspamsName.toUpperCase()}</td>
        </tr>
        <tr>
          <td colspan="7" class="kop-sub">SK Kepala Desa Kuajang Nomor 19 Tahun 2026 Tanggal 30 Juni 2026 (Masa Bakti 2026–2029)</td>
        </tr>
        <tr>
          <td colspan="7" class="kop-sub">Sekretariat: Kantor Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar, Sulawesi Barat 91353</td>
        </tr>
        <tr><td colspan="7"></td></tr>
        <tr>
          <td colspan="7" class="title">LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN & REALISASI IURAN AIR BERSIH</td>
        </tr>
        <tr>
          <td colspan="7" style="text-align: center; font-weight: bold;">Periode: ${data.periodName} • Unit: ${data.kpspamsName}</td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- I. RINGKASAN EKSEKUTIF -->
        <tr>
          <td colspan="7" class="section-header">I. RINGKASAN EKSEKUTIF REALISASI IURAN & KAS OPERASIONAL</td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Total Sambungan Rumah (SR) Terdaftar:</td>
          <td colspan="4" class="td-num"><b>${data.totalConnections} SR</b></td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Sambungan Terbayar Lunas:</td>
          <td colspan="4" class="td-num" style="color: #166534;"><b>${data.paidConnections} SR (${data.collectionRate}% Efisiensi) - Rp ${(data.paidConnections * 10000).toLocaleString("id-ID")}</b></td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Sambungan Belum Lunas (Tertunggak):</td>
          <td colspan="4" class="td-num" style="color: #991b1b;"><b>${data.unpaidConnections} SR - Rp ${(data.unpaidConnections * 10000).toLocaleString("id-ID")}</b></td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Saldo Kas Awal Periode:</td>
          <td colspan="4" class="td-num">Rp ${data.openingBalance.toLocaleString("id-ID")}</td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Total Penerimaan Kas (Iuran & Pemasukan Lain):</td>
          <td colspan="4" class="td-num" style="color: #166534;">+ Rp ${data.totalIncome.toLocaleString("id-ID")}</td>
        </tr>
        <tr>
          <td colspan="3" class="td-data">Total Pengeluaran Kas (Biaya Operasional):</td>
          <td colspan="4" class="td-num" style="color: #991b1b;">- Rp ${data.totalExpense.toLocaleString("id-ID")}</td>
        </tr>
        <tr class="sum-box">
          <td colspan="3" class="td-data"><b>SALDO AKHIR BUKU KAS OPERASIONAL:</b></td>
          <td colspan="4" class="td-num" style="font-size: 12pt;"><b>Rp ${data.finalBalance.toLocaleString("id-ID")}</b></td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- II. BUKU KAS OPERASIONAL -->
        <tr>
          <td colspan="7" class="section-header">II. BUKU KAS ARUS KAS & TRANSAKSI OPERASIONAL</td>
        </tr>
        <tr>
          <th class="th-main">No</th>
          <th class="th-main">No. Bukti Transaksi</th>
          <th class="th-main">Tanggal</th>
          <th class="th-main">Kategori</th>
          <th class="th-main">Uraian / Keterangan</th>
          <th class="th-main">Penerimaan (Rp)</th>
          <th class="th-main">Pengeluaran (Rp)</th>
        </tr>
        ${data.transactions.length === 0 ? `
          <tr><td colspan="7" class="td-center">Belum ada mutasi tercatat untuk periode ini.</td></tr>
        ` : data.transactions.map((tx, idx) => `
          <tr>
            <td class="td-center">${idx + 1}</td>
            <td class="td-center" style="font-family: monospace;">${tx.txNumber}</td>
            <td class="td-center">${tx.date}</td>
            <td class="td-data">${tx.category}</td>
            <td class="td-data">${tx.description}</td>
            <td class="td-num" style="color: #166534;">${tx.type === "INCOME" ? `Rp ${tx.amount.toLocaleString("id-ID")}` : "-"}</td>
            <td class="td-num" style="color: #991b1b;">${tx.type === "EXPENSE" ? `Rp ${tx.amount.toLocaleString("id-ID")}` : "-"}</td>
          </tr>
        `).join("")}
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="5" class="td-num"><b>Total Akumulasi:</b></td>
          <td class="td-num" style="color: #166534;">Rp ${data.totalIncome.toLocaleString("id-ID")}</td>
          <td class="td-num" style="color: #991b1b;">Rp ${data.totalExpense.toLocaleString("id-ID")}</td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- III. REKAPITULASI PELANGGAN -->
        <tr>
          <td colspan="7" class="section-header">III. REKAPITULASI REALISASI IURAN AIR 83 SAMBUNGAN RUMAH (SR)</td>
        </tr>
        <tr>
          <th class="th-main">No</th>
          <th class="th-main">No. Sambungan (SR)</th>
          <th class="th-main">Nama Pelanggan</th>
          <th class="th-main">Wilayah / Dusun</th>
          <th class="th-main">Stand Meter (m³)</th>
          <th class="th-main">Status Iuran</th>
          <th class="th-main">Nominal (Rp)</th>
        </tr>
        ${data.customers.map((c, idx) => `
          <tr>
            <td class="td-center">${idx + 1}</td>
            <td class="td-center" style="font-family: monospace; font-weight: bold;">${c.connectionNo}</td>
            <td class="td-data">${c.name.toUpperCase()}</td>
            <td class="td-center">${c.dusun}</td>
            <td class="td-num">${c.lastReading} m³</td>
            <td class="td-center ${c.status === "PAID" ? "lunas" : "belum"}">${c.status === "PAID" ? "LUNAS" : "BELUM LUNAS"}</td>
            <td class="td-num">Rp ${c.totalAmount.toLocaleString("id-ID")}</td>
          </tr>
        `).join("")}
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="6" class="td-num"><b>Total Realisasi Tertagih:</b></td>
          <td class="td-num"><b>Rp ${(data.paidConnections * 10000).toLocaleString("id-ID")}</b></td>
        </tr>
        <tr><td colspan="7"></td></tr>

        <!-- IV. PENGESAHAN LAPORAN -->
        <tr>
          <td colspan="7" class="section-header">IV. LEMBAR PENGESAHAN LAPORAN PERTANGGUNGJAWABAN RESMI</td>
        </tr>
        <tr><td colspan="7"></td></tr>
        <tr>
          <td colspan="2" class="ttd-box">
            Mengetahui,<br/>
            <b>Kepala Desa Kuajang</b><br/><br/><br/><br/>
            <u><b>H. MUHAMMAD S.</b></u><br/>
            Kepala Desa
          </td>
          <td colspan="2" class="ttd-box">
            Menyetujui,<br/>
            <b>Ketua BPD Desa Kuajang</b><br/><br/><br/><br/>
            <u><b>Ketua BPD</b></u><br/>
            Badan Permusyawaratan Desa
          </td>
          <td colspan="2" class="ttd-box">
            Pengelola Kegiatan,<br/>
            <b>Ketua KPSPAMS Lemo Baru</b><br/><br/><br/><br/>
            <u><b>FADLI</b></u><br/>
            Ketua Pengurus
          </td>
          <td class="ttd-box">
            Kuajang, 31 Oktober 2026<br/>
            <b>Bendahara KPSPAMS</b><br/><br/><br/><br/>
            <u><b>M. DARMAWAN</b></u><br/>
            Pemegang Kas Resmi
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = `LPJ_Resmi_KPSPAMS_Kuajang_${data.periodName.replace(/\s+/g, "_")}.xls`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportLpjToCsv(data: LpjExportData) {
  if (typeof window === "undefined") return;

  let csv = "\uFEFF"; // UTF-8 BOM
  csv += `LAPORAN PERTANGGUNGJAWABAN (LPJ) KPSPAMS DESA KUAJANG\n`;
  csv += `Periode: ${data.periodName};Unit: ${data.kpspamsName}\n`;
  csv += `Pemerintah Desa Kuajang;Kecamatan Binuang;Kabupaten Polewali Mandar\n\n`;

  csv += `=== I. RINGKASAN EKSEKUTIF REALISASI IURAN & KAS ===\n`;
  csv += `Total Sambungan Rumah (SR);${data.totalConnections} SR\n`;
  csv += `Sambungan Lunas;${data.paidConnections} SR (${data.collectionRate}% Efisiensi) - Rp ${(data.paidConnections * 10000).toLocaleString("id-ID")}\n`;
  csv += `Sambungan Belum Lunas;${data.unpaidConnections} SR - Rp ${(data.unpaidConnections * 10000).toLocaleString("id-ID")}\n`;
  csv += `Saldo Kas Awal;Rp ${data.openingBalance.toLocaleString("id-ID")}\n`;
  csv += `Total Penerimaan;Rp ${data.totalIncome.toLocaleString("id-ID")}\n`;
  csv += `Total Pengeluaran;Rp ${data.totalExpense.toLocaleString("id-ID")}\n`;
  csv += `Saldo Kas Akhir;Rp ${data.finalBalance.toLocaleString("id-ID")}\n\n`;

  csv += `=== II. BUKU KAS OPERASIONAL ===\n`;
  csv += `No;No. Bukti;Tanggal;Kategori;Uraian / Keterangan;Penerimaan (Rp);Pengeluaran (Rp)\n`;
  data.transactions.forEach((tx, idx) => {
    const inc = tx.type === "INCOME" ? tx.amount : 0;
    const exp = tx.type === "EXPENSE" ? tx.amount : 0;
    csv += `${idx + 1};"${tx.txNumber}";"${tx.date}";"${tx.category}";"${tx.description.replace(/"/g, '""')}";${inc};${exp}\n`;
  });
  csv += `;;;Total Akumulasi;;${data.totalIncome};${data.totalExpense}\n\n`;

  csv += `=== III. REKAPITULASI REALISASI IURAN AIR 83 SAMBUNGAN RUMAH (SR) ===\n`;
  csv += `No;No. Sambungan (SR);Nama Pelanggan;Wilayah / Dusun;Stand Meter (m3);Status Iuran;Nominal (Rp)\n`;
  data.customers.forEach((c, idx) => {
    csv += `${idx + 1};"${c.connectionNo}";"${c.name}";"${c.dusun}";${c.lastReading};"${c.status === "PAID" ? "LUNAS" : "BELUM LUNAS"}";${c.totalAmount}\n`;
  });
  csv += `;;;;;Total Tertagih;${data.paidConnections * 10000}\n\n`;

  csv += `=== LEMBAR PENGESAHAN RESMI ===\n`;
  csv += `Mengetahui;Kepala Desa Kuajang;H. MUHAMMAD S.\n`;
  csv += `Menyetujui;Ketua BPD Desa Kuajang;\n`;
  csv += `Pengelola;Ketua KPSPAMS;FADLI\n`;
  csv += `Bendahara;Pemegang Kas Resmi;M. DARMAWAN\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = `LPJ_Resmi_KPSPAMS_Kuajang_${data.periodName.replace(/\s+/g, "_")}.csv`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
