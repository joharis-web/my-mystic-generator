# Mystic 4-Digit (Otomatis)

- Tanpa input: halaman otomatis memanggil `/api/generate` saat dibuka.
- Menggabungkan sinyal dari API (opsional via ENV):
  - `HOROSCOPE_API_URL` (+ `HOROSCOPE_API_KEY`)
  - `DREAM_API_URL` (+ `DREAM_API_KEY`)
  - `GOOGLE_SEARCH_API_URL` (+ `GOOGLE_SEARCH_API_KEY`)
  - `TIKTOK_API_URL` (+ `TIKTOK_API_KEY`)
- Di-hash menjadi 4 digit angka (weighted sesuai jam malam, zodiak, shio).

## Env Variables (Vercel Project Settings → Environment Variables)
```
MYSTIC_SALT=your_salt
HOROSCOPE_API_URL=...
HOROSCOPE_API_KEY=...
DREAM_API_URL=...
DREAM_API_KEY=...
GOOGLE_SEARCH_API_URL=...
GOOGLE_SEARCH_API_KEY=...
TIKTOK_API_URL=...
TIKTOK_API_KEY=...
```

## Deploy
1. Upload ZIP ini ke Vercel (import project).
2. Set Environment Variables di Vercel, lalu redeploy.

