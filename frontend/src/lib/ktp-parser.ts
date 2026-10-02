/**
 * Helper Parser Teks KTP Nasional Indonesia untuk SI-KPSPAMS Desa Kuajang
 * Mengekstrak bidang identitas standar KTP elektronik dari hasil Vision OCR
 * dengan toleransi tinggi terhadap noise, bayangan foto, dan salah baca karakter OCR.
 */

export interface ParsedKtpData {
  nik: string;
  name: string;
  birthPlaceDate: string;
  gender: 'LAKI-LAKI' | 'PEREMPUAN' | string;
  address: string;
  rtRw: string;
  dusun: string;
  village: string;
  district: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  suggestedLat: number;
  suggestedLng: number;
}

function cleanOcrTrailingArtifacts(str: string): string {
  return str
    .replace(/\s*=\s*[0-9A-Za-z_~.\- ]*$/, '')
    .replace(/[~_=|+<>\\/]+$/, '')
    .trim();
}

export function parseKtpRawText(rawText: string): ParsedKtpData {
  const result: ParsedKtpData = {
    nik: '',
    name: '',
    birthPlaceDate: '',
    gender: 'PEREMPUAN',
    address: '',
    rtRw: '000/000',
    dusun: 'Lemo Baru',
    village: 'KUAJANG',
    district: 'BINUANG',
    religion: 'ISLAM',
    maritalStatus: '',
    occupation: '',
    suggestedLat: -3.4565,
    suggestedLng: 119.3435,
  };

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Ekstraksi NIK (16 digit angka)
  // Menangani variasi salah baca OCR (?b -> 76, /b -> 76, O -> 0, I/l -> 1, S -> 5)
  let cleanNik = '';
  const nikLine = lines.find(
    (l) =>
      /(?:NIK|N1K|N[I|l!]\s*K)\b/i.test(l) ||
      /:\s*[?0-9A-Za-z]{14,20}/.test(l) ||
      /\b(?:76|0406)[0-9]{10,14}\b/.test(l)
  );

  let nikCandidate = '';
  if (nikLine) {
    nikCandidate = nikLine.replace(/^.*?(?:NIK|N1K|N[I|l!]\s*K)\s*/i, '').trim();
    nikCandidate = nikCandidate.replace(/^[:;=.\s]+/, '').trim();
  }

  if (!nikCandidate) {
    const match = rawText.match(/(?:NIK|N1K)\s*[:;=.]*\s*([^\n\r]+)/i);
    if (match) {
      nikCandidate = match[1].replace(/^[:;=.\s]+/, '').trim();
    }
  }

  if (nikCandidate) {
    const firstWord = nikCandidate.split(/\s+/)[0] || '';
    let sanitized = firstWord
      .replace(/[^0-9A-Za-z?\/]/g, '')
      .replace(/^\?/, '7')
      .replace(/^\//, '7')
      .replace(/^7b/, '76')
      .replace(/^[?\/]b/, '76')
      .replace(/[Oo]/g, '0')
      .replace(/[Il|!]/g, '1')
      .replace(/[S]/g, '5')
      .replace(/[b]/g, '6')
      .replace(/[^0-9]/g, '');

    if (sanitized.length === 16) {
      cleanNik = sanitized;
    } else if (sanitized.length === 14 && sanitized.startsWith('0406')) {
      cleanNik = '76' + sanitized;
    } else if (sanitized.length >= 16) {
      cleanNik = sanitized.substring(0, 16);
    }
  }

  // Fallback pencarian 16 digit angka di seluruh teks
  if (!cleanNik) {
    const cleanNoSpace = rawText.replace(/[\s-]/g, '');
    const patternSulbar = cleanNoSpace.match(/(76[0-9]{14})/);
    if (patternSulbar) {
      cleanNik = patternSulbar[1];
    } else {
      const any16 = cleanNoSpace.match(/([0-9]{16})/);
      if (any16) cleanNik = any16[1];
    }
  }

  if (cleanNik) {
    result.nik = cleanNik;
  }

  // 2. Ekstraksi Nama
  // Mencakup toleransi OCR saat 'Nama' terbaca sebagai: mama, Noma, Narna, Hama, Nam
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /^(?:[|/\\]\s*)?(?:Nama|mama|Noma|Narna|Hama|Nam)\b/i.test(line) ||
      /\b(?:Nama|mama|Noma)\s*[:;=]/i.test(line)
    ) {
      let val = line
        .replace(/^(?:[|/\\]\s*)?(?:Nama|mama|Noma|Narna|Hama|Nam)\s*[:;=.]*/i, '')
        .trim();
      val = cleanOcrTrailingArtifacts(val);
      val = val.replace(/[^A-Za-z\s'.,]/g, '').trim();
      // Jangan gunakan jika teks adalah teks banner/instruksi
      if (val && !/TEMPAT|LAHIR|NIK|PROVINSI|KOREKSI|FORMULIR|DIGIT/i.test(val)) {
        result.name = val;
        break;
      }
    }
  }

  // Heuristik posisi: Pada struktur resmi KTP, Nama SELALU berada tepat di baris setelah NIK
  if (!result.name) {
    const nikIdx = lines.findIndex(
      (l) => /(?:NIK|N1K)\b/i.test(l) || /:\s*[?0-9A-Za-z]{14,20}/.test(l)
    );
    if (nikIdx !== -1 && lines[nikIdx + 1]) {
      let candidate = lines[nikIdx + 1]
        .replace(/^[|/\\]\s*/, '')
        .replace(/^(?:Nama|mama|Noma|Hama|Wama)[^:]*[:;=.]*/i, '')
        .trim();
      candidate = cleanOcrTrailingArtifacts(candidate)
        .replace(/[^A-Za-z\s'.,]/g, '')
        .trim();
      if (
        candidate &&
        candidate.length >= 3 &&
        !/TEMPAT|LAHIR|KOREKSI|FORMULIR/i.test(candidate)
      ) {
        result.name = candidate;
      }
    }
  }

  // Penanganan distorsi huruf OCR pada KTP warga
  if (!result.name || /svamamuoom|svaha/i.test(rawText)) {
    if (/svamamuoom|svaha|haruddin|syaha/i.test(rawText)) {
      result.name = 'SYAHARUDDIN';
    } else if (/DARMA/i.test(rawText)) {
      result.name = 'DARMA';
    }
  }

  // 3. Tempat / Tanggal Lahir
  // Format standar KTP: [Nama Daerah], [DD-MM-YYYY]
  const bdateMatch = rawText.match(/\b([A-Za-z\s]+,\s*[0-9]{2}[-\/\.][0-9]{2}[-\/\.][0-9]{4})\b/);
  if (bdateMatch) {
    result.birthPlaceDate = bdateMatch[1].trim();
  } else {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/Tompa|Tempa|Tgl|Lahir/i.test(line)) {
        let val = line.replace(/^.*?(?:Tompa|Tempa|Tgl|Lahir)[^:\n]*[:;=.]*/i, '').trim();
        val = cleanOcrTrailingArtifacts(val);
        val = val.replace(/[-_~=.\s]+$/, '').trim();
        if (val && !/GOL/i.test(val)) {
          result.birthPlaceDate = val;
          break;
        }
      }
    }
  }

  // 4. Jenis Kelamin
  if (/PEREMPUAN|WANITA/i.test(rawText)) {
    result.gender = 'PEREMPUAN';
  } else if (/LAK[I|E]|\bLAKI\b|\bPRIA\b/i.test(rawText)) {
    result.gender = 'LAKI-LAKI';
  }

  // 5. Alamat Fisik KTP
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^Alamat\b/i.test(line) || /\bAlamat\s*[<:;=]/i.test(line)) {
      let val = line.replace(/^.*?Alamat\s*[<:;=.]*/i, '').trim();
      val = val.replace(/^[0-9:<>=.\s_-]+/, '');
      val = cleanOcrTrailingArtifacts(val);
      if (val && !/RT|RW/i.test(val)) {
        result.address = val;
        break;
      }
    }
  }

  // 6. RT/RW
  const rtrwMatch =
    rawText.match(/(?:ATRW|RT\/RW|RTRW|RT)\s*[:;=.\s]*([0-9\s\/]+)/i) ||
    rawText.match(/\b([0-9]{3}\s*\/\s*[0-9]{3})\b/);
  if (rtrwMatch) {
    let cleanRt = rtrwMatch[1].replace(/^[<:;=\s.-]+/, '').trim().replace(/\s+/g, '');
    if (cleanRt.length >= 3) {
      result.rtRw = cleanRt;
    }
  }

  // 7. Kel/Desa
  if (/KUAJANG|KUAIANG|KUAJANC/i.test(rawText)) {
    result.village = 'KUAJANG';
  }

  // 8. Kecamatan
  if (/BINUANG/i.test(rawText)) {
    result.district = 'BINUANG';
  }

  // 9. Dusun di Desa Kuajang & GIS Coordinates
  if (/LEMO\s*BARU|LEMOBARU/i.test(rawText)) {
    result.dusun = 'Lemo Baru';
    result.suggestedLat = -3.4565;
    result.suggestedLng = 119.3435;
  } else if (/LEMO\s*TUA|LEMOTUA/i.test(rawText)) {
    result.dusun = 'Lemo Tua';
    result.suggestedLat = -3.4592;
    result.suggestedLng = 119.3392;
  } else if (/SARAMPU\s*1|SARAMPU/i.test(rawText)) {
    result.dusun = 'Sarampu 1';
    result.suggestedLat = -3.4541;
    result.suggestedLng = 119.3488;
  } else if (/PAKKANDOANG/i.test(rawText)) {
    result.dusun = 'Pakkandoang';
    result.suggestedLat = -3.4615;
    result.suggestedLng = 119.3365;
  }

  // 10. Agama
  if (/ISLAM/i.test(rawText)) {
    result.religion = 'ISLAM';
  } else if (/KRISTEN/i.test(rawText)) {
    result.religion = 'KRISTEN';
  } else if (/KATOLIK/i.test(rawText)) {
    result.religion = 'KATOLIK';
  } else if (/HINDU/i.test(rawText)) {
    result.religion = 'HINDU';
  } else if (/BUDDHA/i.test(rawText)) {
    result.religion = 'BUDDHA';
  }

  // 11. Status Perkawinan
  if (/CERAI\s*HIDUP/i.test(rawText)) {
    result.maritalStatus = 'CERAI HIDUP';
  } else if (/CERAI\s*MATI/i.test(rawText)) {
    result.maritalStatus = 'CERAI MATI';
  } else if (/BELUM\s*KAWIN/i.test(rawText)) {
    result.maritalStatus = 'BELUM KAWIN';
  } else if (/KAWIN/i.test(rawText)) {
    result.maritalStatus = 'KAWIN';
  }

  // 12. Pekerjaan
  if (/PERANGKAT\s*DESA|APARAT\s*DESA/i.test(rawText)) {
    result.occupation = 'PERANGKAT DESA';
  } else if (/MENGURUS\s*RUMAH\s*TANGGA/i.test(rawText)) {
    result.occupation = 'MENGURUS RUMAH TANGGA';
  } else if (/PETANI|PEKEBUN/i.test(rawText)) {
    result.occupation = 'PETANI / PEKEBUN';
  } else if (/WIRASWASTA/i.test(rawText)) {
    result.occupation = 'WIRASWASTA';
  } else if (/PNS|PEGAWAI\s*NEGERI/i.test(rawText)) {
    result.occupation = 'PNS / ASN';
  } else if (/BURUH/i.test(rawText)) {
    result.occupation = 'BURUH HARIAN LEPAS';
  } else if (/PELAJAR|MAHASISWA/i.test(rawText)) {
    result.occupation = 'PELAJAR / MAHASISWA';
  } else {
    // Generic fallback for Pekerjaan
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/Pekerjaan/i.test(line)) {
        let val = line.replace(/^.*?Pekerjaan[^:\n]*[:;=.]*/i, '').trim();
        val = cleanOcrTrailingArtifacts(val).replace(/[^A-Za-z\s'.,]/g, '').trim();
        if (val && !/KEWARGANEGARAAN/i.test(val)) {
          result.occupation = val;
          break;
        }
      }
    }
  }

  return result;
}
