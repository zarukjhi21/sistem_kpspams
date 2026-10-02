import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { createWorker, Worker } from "tesseract.js";
import { parseKtpRawText, ParsedKtpData } from "@/lib/ktp-parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Persistent Tesseract worker cache as high-speed fallback
let globalWorkerPromise: Promise<Worker> | null = null;
let queuePromise: Promise<any> = Promise.resolve();

function getWorkerOptions() {
  const localWorker = path.resolve(
    process.cwd(),
    "node_modules/tesseract.js/src/worker-script/node/index.js"
  );
  if (fs.existsSync(localWorker)) {
    return { workerPath: localWorker };
  }
  return {};
}

async function getOrCreateWorker(): Promise<Worker> {
  if (!globalWorkerPromise) {
    globalWorkerPromise = (async () => {
      const options = getWorkerOptions();
      const worker = await createWorker(["ind", "eng"], 1, options);
      return worker;
    })().catch((err) => {
      globalWorkerPromise = null;
      console.error("Failed to initialize Tesseract worker:", err);
      throw err;
    });
  }
  return globalWorkerPromise;
}

async function performLocalOcr(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    queuePromise = queuePromise
      .then(async () => {
        try {
          const worker = await getOrCreateWorker();
          const ret = await worker.recognize(buffer);
          resolve(ret.data.text);
        } catch (workerErr) {
          globalWorkerPromise = null;
          reject(workerErr);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// Ekstraksi Vision Multimodal via Google Gemini 1.5 Flash
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

  // Coba model multimodal terbaru yang aktif: gemini-3.1-flash-lite lalu gemini-3.8-flash
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-1.5-flash"];
  let responseJson: any = null;
  let lastErrorMsg = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
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

  // Deteksi dusun dari field dusun atau dari address
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

  // Tentukan titik koordinat GIS berdasarkan Dusun hasil Gemini
  let suggestedLat = -3.4565;
  let suggestedLng = 119.3435;
  if (/LEMO\s*TUA/i.test(dusunResult)) {
    suggestedLat = -3.4592;
    suggestedLng = 119.3392;
  } else if (/SARAMPU/i.test(dusunResult)) {
    suggestedLat = -3.4541;
    suggestedLng = 119.3488;
  } else if (/PAKKANDOANG/i.test(dusunResult)) {
    suggestedLat = -3.4615;
    suggestedLng = 119.3365;
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: "Berkas gambar KTP tidak ditemukan." },
        { status: 400 }
      );
    }

    // Convert base64 data URL ke buffer dan data mentah
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data gambar kosong." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // STRATEGI 1: Gunakan Google Gemini 1.5 Flash jika API Key terkonfigurasi
    if (apiKey && apiKey.trim() !== "") {
      try {
        const geminiData = await extractWithGemini(base64Data, apiKey.trim());
        const executionTimeMs = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          engine: "Google Gemini AI Vision (Multimodal)",
          executionTimeMs,
          data: geminiData,
        });
      } catch (geminiError: any) {
        console.warn(
          "Gemini API belum aktif/terkendala, beralih otomatis ke Tesseract lokal:",
          geminiError.message
        );
      }
    }

    // STRATEGI 2: Fallback Cepat Menggunakan Mesin Tesseract Lokal (Offline-Ready)
    const rawText = await performLocalOcr(buffer);
    const parsedData = parseKtpRawText(rawText);
    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      engine: "Tesseract OCR Engine (Lokal)",
      executionTimeMs,
      rawText,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("KTP OCR Server Error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err.message ||
          "Gagal memproses OCR KTP. Pastikan foto jelas dan terbaca.",
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
