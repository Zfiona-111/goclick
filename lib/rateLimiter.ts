interface Counter {
  count: number
  resetAt: number
}

interface PhoneRecord {
  perMinute: Counter
  perDay: Counter
}

const phoneMap = new Map<string, PhoneRecord>()
const ipMap = new Map<string, Counter>()

function now() {
  return Date.now()
}

export function checkPhoneRateLimit(phone: string): boolean {
  const n = now()
  const rec = phoneMap.get(phone) ?? {
    perMinute: { count: 0, resetAt: n + 60_000 },
    perDay: { count: 0, resetAt: n + 86_400_000 },
  }
  if (n > rec.perMinute.resetAt) rec.perMinute = { count: 0, resetAt: n + 60_000 }
  if (n > rec.perDay.resetAt) rec.perDay = { count: 0, resetAt: n + 86_400_000 }

  if (rec.perMinute.count >= 1 || rec.perDay.count >= 5) {
    phoneMap.set(phone, rec)
    return false
  }
  rec.perMinute.count++
  rec.perDay.count++
  phoneMap.set(phone, rec)
  return true
}

export function checkIpRateLimit(ip: string): boolean {
  const n = now()
  const rec = ipMap.get(ip) ?? { count: 0, resetAt: n + 60_000 }
  if (n > rec.resetAt) rec.count = 0, rec.resetAt = n + 60_000
  if (rec.count >= 3) { ipMap.set(ip, rec); return false }
  rec.count++
  ipMap.set(ip, rec)
  return true
}
