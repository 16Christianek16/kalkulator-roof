// --- GEOMETRIE ---
export const deg2rad = (deg) => (deg * Math.PI) / 180
export const rad2deg = (rad) => (rad * 180) / Math.PI

export const slopePercentToDeg = (pct) => rad2deg(Math.atan(pct / 100))
export const slopeDegToPercent = (deg) => Math.tan(deg2rad(deg)) * 100
export const slopeDegToRatio = (deg) => 1 / Math.tan(deg2rad(deg))

// Délka krokve pro sedlovou střechu
export const delkaKrokve = (sirkaDomu, sklon_deg) => {
  const pulSirky = sirkaDomu / 2
  return pulSirky / Math.cos(deg2rad(sklon_deg))
}

// Výška hřebene
export const vyskaHrebene = (sirkaDomu, sklon_deg) => {
  const pulSirky = sirkaDomu / 2
  return pulSirky * Math.tan(deg2rad(sklon_deg))
}

// Plocha sedlové střechy (bez přesahů)
export const plochaSedlovaStecha = (sirka, delka, sklon_deg) => {
  const krokev = delkaKrokve(sirka, sklon_deg)
  return 2 * krokev * delka
}

// Nárožní krokev (valba)
export const delkaNarozniKrokve = (pulSirky, vyskaHrebene) => {
  return Math.sqrt(pulSirky * pulSirky + pulSirky * pulSirky + vyskaHrebene * vyskaHrebene)
}

// --- TESAŘSTVÍ ---
// Průřez trámu — orientační výpočet (jednoduché prosté uložení)
// W = M / (fmd) kde M = q*l²/8
export const prurezTramu = ({ rozpeti_m, zatizeni_kNm, pevnostTrida }) => {
  const fmd = pevnostTrida === 'C24' ? 24 : pevnostTrida === 'C16' ? 16 : 18 // MPa
  const M = (zatizeni_kNm * rozpeti_m * rozpeti_m) / 8 // kNm
  const W_cm3 = (M * 1e6) / (fmd * 1000) // mm³ → cm³
  return W_cm3
}

// Průhyb L/300
export const maxPruhyb = (rozpeti_m) => (rozpeti_m * 1000) / 300 // mm

// Průřezový modul obdélníkového průřezu
export const prurezovyModul = (b_mm, h_mm) => (b_mm * h_mm * h_mm) / 6 // mm³

// --- POKRÝVAČSTVÍ ---
// Spotřeba tašek
export const spotrebaTasek = ({ plocha_m2, krytiBobrovka_m2, presah = 1.05 }) => {
  return Math.ceil((plocha_m2 / krytiBobrovka_m2) * presah)
}

// Rozteč latí
export const rozted = ({ delkaKrokve_m, pocetLati }) => {
  return (delkaKrokve_m * 1000) / (pocetLati - 1) // mm
}

// --- KLEMPÍŘSTVÍ ---
// Průtok dešťové vody l/s
export const pruTokDeste = ({ plocha_m2, intenzita_lsm2 = 0.033 }) => {
  return plocha_m2 * intenzita_lsm2
}

// Průměr svodu (mm) — orientační
export const prumerSvodu = (prutoklS) => {
  return Math.ceil(Math.sqrt((4 * prutoklS * 1000) / (Math.PI * 2.5)) * 10)
}

// Dilatace plechu (mm)
export const dilatacePlechu = ({ delka_m, teplotniRozsah = 80, koefTiZink = 0.022 }) => {
  return delka_m * teplotniRozsah * koefTiZink
}

// --- ZATÍŽENÍ ---
// Zatížení sněhem dle ČSN EN 1991-1-3 (orientační)
const snehovePasy = {
  'I': 0.7,
  'II': 1.0,
  'III': 1.5,
  'IV': 2.0,
  'V': 2.5,
  'VI': 3.0,
  'VII': 4.0,
  'VIII': 5.0,
}

export const zatizeniSnehem = ({ snehovaPas, sklon_deg, nadmorskaNadmorska = 400 }) => {
  const sk = snehovePasy[snehovaPas] ?? 1.0
  const nadmorskySouc = nadmorskaNadmorska > 400 ? 1 + ((nadmorskaNadmorska - 400) / 400) * 0.5 : 1
  const tvarSouc = sklon_deg <= 30 ? 0.8 : sklon_deg <= 60 ? 0.8 * (60 - sklon_deg) / 30 : 0
  return sk * tvarSouc * nadmorskySouc
}

// --- POMOCNÉ ---
export const round = (val, decimals = 2) => {
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

export const formatNum = (val, decimals = 2) => {
  if (isNaN(val) || !isFinite(val)) return '—'
  return round(val, decimals).toLocaleString('cs-CZ')
}
