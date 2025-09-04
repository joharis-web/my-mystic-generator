import { generate4Digits, digitalRoot, mysticalHourWeight } from '../../../utils/hash';

export default async function handler(req, res) {
  // Force GET only; page will call it without user input
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Current time in Asia/Jakarta (UTC+7). We'll compute using Date and offset.
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jakarta = new Date(utcMs + 7 * 3600 * 1000);

    const dateISO = jakarta.toISOString().slice(0,10);
    const timeHHmm = jakarta.toTimeString().slice(0,5);

    // Determine western zodiac from date (approx by month-day)
    function zodiacFromDate(d) {
      const [y,m,dd] = d.split('-').map(Number);
      const md = Number(String(m).padStart(2,'0') + String(dd).padStart(2,'0'));
      if (md >= 321 && md <= 419) return 'Aries';
      if (md >= 420 && md <= 520) return 'Taurus';
      if (md >= 521 && md <= 620) return 'Gemini';
      if (md >= 621 && md <= 722) return 'Cancer';
      if (md >= 723 && md <= 822) return 'Leo';
      if (md >= 823 && md <= 922) return 'Virgo';
      if (md >= 923 && md <= 1022) return 'Libra';
      if (md >= 1023 && md <= 1121) return 'Scorpio';
      if (md >= 1122 && md <= 1221) return 'Sagittarius';
      if (md >= 1222 || md <= 119) return 'Capricorn';
      if (md >= 120 && md <= 218) return 'Aquarius';
      return 'Pisces';
    }

    // Shio: untuk 2025 tetap 'Ular'. (Simplifikasi)
    const shio = 'Ular';
    const zodiac = zodiacFromDate(dateISO);

    const year = 2025;
    const yearRoot = digitalRoot(String(year));
    const dateRoot = digitalRoot(dateISO);
    const timeRoot = digitalRoot(timeHHmm);
    const hourWeight = mysticalHourWeight(timeHHmm);

    // External signals (optional based on envs). Safe fetch wrappers
    async function safeJSONFetch(url, init, label) {
      try {
        const r = await fetch(url, init);
        if (!r.ok) throw new Error(label + ' HTTP ' + r.status);
        return { ok: true, data: await r.json() };
      } catch (e) {
        return { ok: false, error: (e && e.message) || 'unknown error' };
      }
    }

    const tasks = [];
    const sources = {};

    if (process.env.HOROSCOPE_API_URL) {
      tasks.push((async () => {
        sources.horoscope = await safeJSONFetch(
          process.env.HOROSCOPE_API_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.HOROSCOPE_API_KEY ? { 'Authorization': `Bearer ${process.env.HOROSCOPE_API_KEY}` } : {})
            },
            body: JSON.stringify({ date: dateISO, zodiac })
          },
          'horoscope'
        );
      })());
    }

    if (process.env.DREAM_API_URL) {
      tasks.push((async () => {
        sources.dream = await safeJSONFetch(
          process.env.DREAM_API_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.DREAM_API_KEY ? { 'Authorization': `Bearer ${process.env.DREAM_API_KEY}` } : {})
            },
            body: JSON.stringify({ q: 'simbol malam, angka berulang, intuisi' })
          },
          'dream'
        );
      })());
    }

    if (process.env.GOOGLE_SEARCH_API_URL) {
      tasks.push((async () => {
        const q = encodeURIComponent([dateISO, zodiac, shio, 'energi angka malam'].join(' '));
        sources.google = await safeJSONFetch(
          `${process.env.GOOGLE_SEARCH_API_URL}?q=${q}&limit=5`,
          {
            headers: {
              ...(process.env.GOOGLE_SEARCH_API_KEY ? { 'Authorization': `Bearer ${process.env.GOOGLE_SEARCH_API_KEY}` } : {})
            }
          },
          'google'
        );
      })());
    }

    if (process.env.TIKTOK_API_URL) {
      tasks.push((async () => {
        const q = encodeURIComponent([zodiac, shio, 'angka hoki'].join(' '));
        sources.tiktok = await safeJSONFetch(
          `${process.env.TIKTOK_API_URL}?q=${q}&limit=5`,
          {
            headers: {
              ...(process.env.TIKTOK_API_KEY ? { 'Authorization': `Bearer ${process.env.TIKTOK_API_KEY}` } : {})
            }
          },
          'tiktok'
        );
      })());
    }

    if (tasks.length) await Promise.all(tasks);

    const signals = [];
    if (sources.horoscope?.ok) signals.push(JSON.stringify({ horoscope: sources.horoscope.data?.summary ?? sources.horoscope.data }));
    if (sources.dream?.ok) signals.push(JSON.stringify({ dream: sources.dream.data?.keyMeanings ?? sources.dream.data }));
    if (sources.google?.ok) signals.push(JSON.stringify({ googleTitles: (sources.google.data?.items ?? sources.google.data?.results ?? []).slice(0,5).map(x => x.title ?? x) }));
    if (sources.tiktok?.ok) signals.push(JSON.stringify({ tiktokCaptions: (sources.tiktok.data?.items ?? sources.tiktok.data?.results ?? []).slice(0,5).map(x => x.caption ?? x.title ?? x) }));

    const interpretation = {
      dateISO, timeHHmm,
      year, yearRoot, dateRoot, timeRoot,
      zodiac, shio, hourWeight,
      externalSignals: signals.join('|') || null
    };

    const number = generate4Digits(interpretation, true);

    const audit = {
      interpretation,
      sourceHealth: {
        horoscope: !!sources.horoscope?.ok,
        dream: !!sources.dream?.ok,
        google: !!sources.google?.ok,
        tiktok: !!sources.tiktok?.ok
      }
    };

    res.status(200).json({ number, audit, at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: (e && e.message) || 'unexpected error' });
  }
}
