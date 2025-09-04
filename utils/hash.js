import { createHash } from "crypto";

export function getHash(input) {
  const hash = createHash("sha256").update(input).digest("hex");
  // Ambil 4 digit angka
  const num = parseInt(hash.slice(0, 6), 16) % 10000;
  return num.toString().padStart(4, "0");
}
