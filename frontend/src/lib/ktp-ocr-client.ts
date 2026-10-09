/**
 * Client-side KTP OCR helper for SI-KPSPAMS Desa Kuajang
 * Runs directly in the browser using Web Workers (Tesseract.js) and optional Google Gemini Vision.
 * Enables 100% static export deployment on Cloudflare Pages without server-side Node.js dependencies.
 */

import { parseKtpRawText, ParsedKtpData } from "./ktp-parser";

export interface OcrResult {
  success: boolean;
  engine?: string;
  executionTimeMs?: number;
  data?: ParsedKtpData;
  message?: string;
  rawText?: string;
}

// Ekstraksi Vision Multimodal via Google Gemini jika API key tersedia di client
async function extractWithGemini(
  base64Data: string,
  apiKey: string
): Promise<ParsedKtpData> {
  const prompt = `Anda adalah AI Vision khusus membaca identitas e-KTP Indonesia untuk Sistem Informasi SI-KPSPAMS Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar, Sulawesi Barat.
Tugas Anda: Baca foto KTP ini dan kembalikan HANYA dokumen JSON murni (tanpa tanda kutip markdown, tanpa backtick, tanpa kata pembuka) dengan format tepat berikut:
{
  "nik": "16 digit angka NIK tanpa spasi",
  "name": "NAMA LENGKAP huruf kapital sesuai KTP",
  "birthPlaceDate": "TEMPAT, DD-MM-YYYY (contoh: KANANG, 21-11-1995)",
  "gender": "LAKI-LAKI atau PEREMPUAN",
  "address": "ALAMAT KTP (contoh: LEMO BARU)",
  "rtRw": "contoh 000/000",
  "dusun": "Lemo Baru atau Lemo Tua atau Sarampu 1 atau Pakkandoang",
  "village": "KUAJANG",
  "district": "BINUANG",
  "religion": "ISLAM atau lainnya",
  "maritalStatus": "KAWIN atau BELUM KAWIN atau CERAI HIDUP atau CERAI MATI",
  "occupation": "PEKERJAAN SESUAI KTP"
}`;

  const candidateModels = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
  let responseJson: any = null;
  let lastErrorMsg = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (res.ok) {
        responseJson = await res.json();
        break;
      } else {
        const errorJson = await res.json().catch(() => ({}));
        lastErrorMsg = errorJson?.error?.message || `Status ${res.status}`;
      }
    } catch (e: any) {
      lastErrorMsg = e.message;
    }
  }

  if (!responseJson) {
    throw new Error(lastErrorMsg || "Gagal memanggil model Google Gemini.");
  }

  const rawContent =
    responseJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(rawContent.trim());

  let dusunResult = (parsed.dusun || "").trim();
  const fullAddressText = `${dusunResult} ${parsed.address || ""}`.toUpperCase();

  if (!dusunResult || dusunResult === "null") {
    if (fullAddressText.includes("LEMO TUA")) {
      dusunResult = "Lemo Tua";
    } else if (fullAddressText.includes("SARAMPU")) {
      dusunResult = "Sarampu 1";
    } else if (fullAddressText.includes("PAKKANDOANG")) {
      dusunResult = "Pakkandoang";
    } else {
      dusunResult = "Lemo Baru";
    }
  }

  let suggestedLat = -3.4349;
  let suggestedLng = 119.3768;
  if (/LEMO\s*TUA/i.test(dusunResult)) {
    suggestedLat = -3.4285;
    suggestedLng = 119.3725;
  } else if (/SARAMPU/i.test(dusunResult)) {
    suggestedLat = -3.4385;
    suggestedLng = 119.3850;
  } else if (/PAKKANDOANG/i.test(dusunResult)) {
    suggestedLat = -3.4410;
    suggestedLng = 119.3890;
  }

  return {
    nik: parsed.nik || "",
    name: parsed.name || "",
    birthPlaceDate: parsed.birthPlaceDate || "",
    gender: parsed.gender || "LAKI-LAKI",
    address: parsed.address || "",
    rtRw: parsed.rtRw || "000/000",
    dusun: dusunResult,
    village: parsed.village || "KUAJANG",
    district: parsed.district || "BINUANG",
    religion: parsed.religion || "ISLAM",
    maritalStatus: parsed.maritalStatus || "",
    occupation: parsed.occupation || "",
    suggestedLat,
    suggestedLng,
  };
}

/**
 * Scan KTP image data URL and extract Indonesian ID Card fields
 */
export async function scanKtpImage(
  dataUrl: string,
  onProgress?: (text: string) => void
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Strategi 1: Google Gemini jika API key dikonfigurasi
    if (apiKey && apiKey.trim() !== "") {
      onProgress?.("Menghubungi Google Gemini Vision AI...");
      try {
        const geminiData = await extractWithGemini(base64Data, apiKey.trim());
        const executionTimeMs = Date.now() - startTime;
        return {
          success: true,
          engine: "Google Gemini AI Vision",
          executionTimeMs,
          data: geminiData,
        };
      } catch (geminiError: any) {
        console.warn(
          "Gemini API terkendala, beralih ke Tesseract Web Worker:",
          geminiError
        );
      }
    }

    // Strategi 2: Tesseract OCR di Browser Client via Web Worker
    onProgress?.("Memuat mesin OCR Tesseract di peramban...");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker(["ind", "eng"]);

    onProgress?.("Menganalisis pola teks KTP...");
    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    const rawText = ret.data.text;
    const parsedData = parseKtpRawText(rawText);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      engine: "Tesseract OCR (Browser Client)",
      executionTimeMs,
      rawText,
      data: parsedData,
    };
  } catch (err: any) {
    console.error("Client KTP OCR Error:", err);
    return {
      success: false,
      message:
        err.message ||
        "Gagal memproses OCR KTP. Pastikan foto KTP cukup jelas dan terbaca.",
      executionTimeMs: Date.now() - startTime,
    };
  }
}
