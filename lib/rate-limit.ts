const windowMs = 60 * 60 * 1000;
const maxRequests = 3;
const bucket = new Map<string, number[]>();

export function checkRateLimit(ip: string) {
  const now = Date.now();
  const hits = bucket.get(ip) ?? [];
  const valid = hits.filter((t) => now - t < windowMs);
  if (valid.length >= maxRequests) return false;
  valid.push(now);
  bucket.set(ip, valid);
  return true;
}
