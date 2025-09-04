import crypto from 'crypto';

export function sha256Int64(str) {
  const hash = crypto.createHash('sha256').update(str).digest();
  // take first 8 bytes as unsigned big-endian integer (fit into JS Number safe range approx)
  let n = 0n;
  for (let i = 0; i < 8; i++) {
    n = (n << 8n) + BigInt(hash[i]);
  }
  // reduce to a JS number mod 2^32 for PRNG seed
  const mod = Number(n % 4294967296n);
  return mod >>> 0;
}

function prngFromSeed(seed) {
  // mulberry32
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDigitWeighted(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((a, [,w]) => a + w, 0);
  let r = rng() * total;
  for (const [d, w] of entries) {
    if (r < w) return d;
    r -= w;
  }
  return entries[entries.length - 1][0];
}

export function digitalRoot(strOrNum) {
  let s = String(strOrNum).replace(/\D/g, '');
  let sum = 0;
  for (const ch of s) sum += ch.charCodeAt(0) - 48;
  while (sum > 9) {
    const t = String(sum);
    sum = 0;
    for (const ch of t) sum += ch.charCodeAt(0) - 48;
  }
  return sum;
}

export function mysticalHourWeight(hhmm) {
  const h = Number(hhmm.split(':')[0]);
  if (h >= 22 || h === 0) return 1.5;
  if (h >= 19) return 1.25;
  if (h >= 16) return 1.0;
  if (h >= 13) return 0.95;
  return 1.0;
}

export function generate4Digits(interpretation, weighted = true) {
  const salt = process.env.MYSTIC_SALT ?? '';
  const baseStr = JSON.stringify(interpretation) + '|' + salt;
  const baseInt = sha256Int64(baseStr);
  const rng = prngFromSeed(baseInt);

  if (!weighted) {
    return String(baseInt % 10000).padStart(4, '0');
  }

  const BASE_WEIGHTS = {
    '0': 0.9, '1': 1.0, '2': 0.95, '3': 1.0, '4': 1.0,
    '5': 1.0, '6': 1.25, '7': 1.1, '8': 1.35, '9': 1.3
  };

  const ZODIAC_WEIGHTS = {
    'Leo':   { '1': 1.2, '9': 1.15, '8': 1.1 },
    'Virgo': { '5': 1.15, '7': 1.15, '6': 1.05 },
    'Libra': { '6': 1.1,  '2': 1.05, '8': 1.1 },
    'Scorpio': {'9': 1.12, '7': 1.1, '0': 1.02 },
    'Sagittarius': {'3':1.12,'9':1.08,'1':1.05},
    'Capricorn': {'8':1.12,'4':1.06,'6':1.04},
    'Aquarius': {'7':1.12,'2':1.06,'5':1.04},
    'Pisces': {'7':1.1,'2':1.05,'9':1.05},
    'Aries': {'1':1.12,'9':1.08,'5':1.04},
    'Taurus': {'6':1.1,'8':1.06,'4':1.04},
    'Gemini': {'3':1.12,'5':1.06,'2':1.04},
    'Cancer': {'2':1.08,'6':1.06,'9':1.02}
  };

  const SHIO_WEIGHTS = {
    'Ular': { '6':1.2, '8':1.2, '9':1.15 },
    'Naga': { '8':1.15,'9':1.1,'3':1.05 },
    'Ayam': { '4':1.1,'7':1.1,'6':1.05 },
    'Macan': { '1':1.08,'3':1.06,'9':1.04 },
    'Kelinci': { '2':1.08,'6':1.06,'8':1.02 }
  };

  const weights = { ...BASE_WEIGHTS };
  const hourFactor = interpretation.hourWeight ?? 1.0;
  for (const d in weights) weights[d] *= hourFactor;

  if (interpretation.zodiac && ZODIAC_WEIGHTS[interpretation.zodiac]) {
    for (const d in ZODIAC_WEIGHTS[interpretation.zodiac]) {
      weights[d] *= ZODIAC_WEIGHTS[interpretation.zodiac][d];
    }
  }
  if (interpretation.shio && SHIO_WEIGHTS[interpretation.shio]) {
    for (const d in SHIO_WEIGHTS[interpretation.shio]) {
      weights[d] *= SHIO_WEIGHTS[interpretation.shio][d];
    }
  }
  // Tahun 2025 → angka 9 sedikit didorong
  weights['9'] *= 1.1;

  const d1 = pickDigitWeighted(rng, weights);
  const d2 = pickDigitWeighted(rng, weights);
  const d3 = pickDigitWeighted(rng, weights);
  const d4 = pickDigitWeighted(rng, weights);
  return `${d1}${d2}${d3}${d4}`;
}
