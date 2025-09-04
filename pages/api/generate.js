import { createHash } from "crypto";
import { getHash } from "../../utils/hash";

export default async function handler(req, res) {
  try {
    // Ambil ENV
    const horoscopeApi = process.env.HOROSCOPE_API_URL || "";
    const dreamApi = process.env.DREAM_API_URL || "";
    const googleApi = process.env.GOOGLE_SEARCH_API_URL || "";
    const tiktokApi = process.env.TIKTOK_API_URL || "";

    // Kalau belum ada API, pakai dummy data biar gak error
    const horoscope = horoscopeApi ? await fetch(horoscopeApi).then(r => r.text()) : "horoscope";
    const dream = dreamApi ? await fetch(dreamApi).then(r => r.text()) : "dream";
    const google = googleApi ? await fetch(googleApi).then(r => r.text()) : "google";
    const tiktok = tiktokApi ? await fetch(tiktokApi).then(r => r.text()) : "tiktok";

    // Gabung semua data
    const combined = `${horoscope}-${dream}-${google}-${tiktok}`;

    // Hash → 4 digit angka
    const number = getHash(combined);

    res.status(200).json({ success: true, number });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
