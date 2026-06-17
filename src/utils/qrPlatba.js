/**
 * Utility funkce pro QR Platbu — SPAYD formát (standard ČBA).
 * QR kód samotný generuje react-qr-code přímo v JSX.
 * https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 */

// Převod českého čísla účtu na IBAN (ISO 7064 MOD97-10)
export function ucetNaIBAN(ucet) {
  if (!ucet) return null
  const trimmed = ucet.trim()
  if (/^[A-Z]{2}\d{2}/.test(trimmed)) return trimmed.replace(/\s/g, '')

  const match = trimmed.match(/^(?:(\d+)-)?(\d+)\/(\d{4})$/)
  if (!match) return null

  const predcisli = (match[1] || '0').padStart(6, '0')
  const cislo     = match[2].padStart(10, '0')
  const banka     = match[3]
  const cisloUctu = predcisli + cislo

  const raw   = banka + cisloUctu + '1235' + '00'
  const mod97 = BigInt(raw) % 97n
  const check = String(98n - mod97).padStart(2, '0')

  return `CZ${check}${banka}${cisloUctu}`
}

// Sestaví SPAYD řetězec pro QR kód
export function vytvorSPAYD({ iban, castka, vs, msg = 'Platba faktury' }) {
  if (!iban) return null
  const amt = parseFloat(castka)
  if (!isFinite(amt) || amt <= 0) return null

  const parts = ['SPD*1.0', `ACC:${iban}`, `AM:${amt.toFixed(2)}`, 'CC:CZK']
  if (vs)  parts.push(`X-VS:${String(vs).replace(/\D/g, '').slice(0, 10)}`)
  if (msg) parts.push(`MSG:${msg.slice(0, 60)}`)
  return parts.join('*')
}

// VS z čísla faktury: FA-2025-001 → '2025001'
export function vsZCislaFaktury(cislo) {
  if (!cislo) return ''
  return cislo.replace(/\D/g, '').slice(-8)
}
