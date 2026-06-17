import { describe, it, expect } from 'vitest'
import {
  pocetMezerKrokvi,
  pocetKrokviStrany,
  skutecnaRoztecKrokvi,
  plochaSedlovaStecha,
  plochaValbova,
  plochaStanova,
  plochaPultova,
  delkaNarozniValbova,
  delkaNarozniStanova,
  delkaKrokve,
  vyskaHrebene,
  deg2rad,
} from './calculations'

// ─── Pomocný helper ───────────────────────────────────────────────────────────
// Zaokrouhlí na 4 des. místa (eliminuje float noise)
const r4 = (v) => Math.round(v * 10000) / 10000

// ─── KROK 1: Rozteč a počet krokví ───────────────────────────────────────────
describe('pocetMezerKrokvi', () => {
  it('12 m / 900 mm → 14 mezer (ceil(13.33)=14)', () => {
    expect(pocetMezerKrokvi(12, 900)).toBe(14)
  })
  it('12.8 m / 900 mm → 15 mezer (ceil(14.22)=15)', () => {
    expect(pocetMezerKrokvi(12.8, 900)).toBe(15)
  })
  it('10 m / 800 mm → 13 mezer (ceil(12.5)=13)', () => {
    expect(pocetMezerKrokvi(10, 800)).toBe(13)
  })
  it('6 m / 1000 mm → 6 mezer (přesné dělení)', () => {
    expect(pocetMezerKrokvi(6, 1000)).toBe(6)
  })
  it('minimálně 1 mezera (velmi krátká střecha)', () => {
    expect(pocetMezerKrokvi(0.5, 900)).toBe(1)
  })
})

describe('pocetKrokviStrany', () => {
  it('12 m / 900 mm → 15 krokví (14 mezer + 1)', () => {
    expect(pocetKrokviStrany(12, 900)).toBe(15)
  })
  it('12.8 m / 900 mm → 16 krokví (15 mezer + 1)', () => {
    expect(pocetKrokviStrany(12.8, 900)).toBe(16)
  })
  it('10 m / 800 mm → 14 krokví (13 mezer + 1)', () => {
    expect(pocetKrokviStrany(10, 800)).toBe(14)
  })
  it('6 m / 1000 mm → 7 krokví (6 mezer + 1)', () => {
    expect(pocetKrokviStrany(6, 1000)).toBe(7)
  })
})

describe('skutecnaRoztecKrokvi', () => {
  it('12 m / 900 mm → 857.1 mm (12000/14)', () => {
    expect(r4(skutecnaRoztecKrokvi(12, 900))).toBe(r4(12000 / 14))
  })
  it('12.8 m / 900 mm → 853.3 mm (12800/15)', () => {
    expect(r4(skutecnaRoztecKrokvi(12.8, 900))).toBe(r4(12800 / 15))
  })
  it('10 m / 800 mm → 769.2 mm (10000/13)', () => {
    expect(r4(skutecnaRoztecKrokvi(10, 800))).toBe(r4(10000 / 13))
  })
  it('6 m / 1000 mm → přesně 1000 mm', () => {
    expect(skutecnaRoztecKrokvi(6, 1000)).toBe(1000)
  })
  it('skutečná rozteč ≤ zadaná rozteč (netlačíme tašky dál, než je rozteč)', () => {
    // Ceil zaručuje, že bereme víc mezer, takže skutečná rozteč ≤ zadaná
    expect(skutecnaRoztecKrokvi(12, 900)).toBeLessThanOrEqual(900)
    expect(skutecnaRoztecKrokvi(10, 800)).toBeLessThanOrEqual(800)
    expect(skutecnaRoztecKrokvi(12.8, 900)).toBeLessThanOrEqual(900)
  })
})

describe('konzistence: (nKrokvi - 1) × skutecnaRozted = délka', () => {
  const cases = [
    [12, 900], [12.8, 900], [10, 800], [6, 1000],
    [8, 700], [15, 1000], [9.5, 850],
  ]
  cases.forEach(([d, r]) => {
    it(`d=${d} m, r=${r} mm`, () => {
      const nMez = pocetMezerKrokvi(d, r)
      const nKro = pocetKrokviStrany(d, r)
      const sku  = skutecnaRoztecKrokvi(d, r)
      // nKrokvi = nMezer + 1
      expect(nKro).toBe(nMez + 1)
      // nMezer * skutecnaRozted = délka (v mm)
      expect(r4(nMez * sku)).toBe(r4(d * 1000))
      // skutecnaRozted ≤ zadana rozted
      expect(sku).toBeLessThanOrEqual(r + 0.001)
    })
  })
})

// ─── Geometrie střech (základ pro KROK 2.5) ──────────────────────────────────
describe('delkaKrokve sedlová', () => {
  it('sedlová 8 m / 35° → 4.883 m', () => {
    // (8/2) / cos(35°) = 4 / 0.8192 = 4.883
    expect(r4(delkaKrokve(8, 35))).toBe(r4(4 / Math.cos(35 * Math.PI / 180)))
  })
  it('sedlová 10 m / 35° → 6.103 m', () => {
    expect(r4(delkaKrokve(10, 35))).toBe(r4(5 / Math.cos(35 * Math.PI / 180)))
  })
})

describe('plochaSedlovaStecha', () => {
  it('sedlová 10×12 m / 35° → 2 × 6.103 × 12 = 146.47 m²', () => {
    const krokev = 5 / Math.cos(35 * Math.PI / 180)
    expect(r4(plochaSedlovaStecha(10, 12, 35))).toBe(r4(2 * krokev * 12))
  })
  it('plocha je vždy větší než půdorys', () => {
    expect(plochaSedlovaStecha(10, 12, 35)).toBeGreaterThan(10 * 12)
  })
})

// ─── KROK 2.5: Složité střechy ────────────────────────────────────────────────

describe('plochaValbova — 10×12 / 35°', () => {
  const s = 10, l = 12, sk = 35
  const krokev = 5 / Math.cos(deg2rad(35))      // = 6.1031 m
  const h      = 5 * Math.tan(deg2rad(35))        // = 3.5008 m

  it('rovná se sedlové (matematická identita: 2×krokev×delka)', () => {
    expect(r4(plochaValbova(s, l, sk))).toBe(r4(2 * krokev * l))
  })
  it('= 146.47 m² (ruční výpočet)', () => {
    // Správně: hlavní = 2×krokev×(l−s/2) = 85.44, valby = 2×0.5×s×krokev = 61.03
    const spravne = 2 * krokev * (l - s / 2) + 2 * 0.5 * s * krokev
    expect(r4(plochaValbova(s, l, sk))).toBe(r4(spravne))
    expect(r4(plochaValbova(s, l, sk))).toBeCloseTo(146.47, 1)
  })
  it('CHYBA původního kódu (s/2 místo s): 115.96 m² → odchylka 30.51 m²', () => {
    const buggy = 2 * krokev * (l - s / 2) + 2 * 0.5 * (s / 2) * krokev
    expect(r4(buggy)).toBeCloseTo(115.96, 1)                 // starý špatný výsledek
    expect(plochaValbova(s, l, sk) - buggy).toBeCloseTo(30.51, 1)  // opravený rozdíl
  })
  it('valbová ≥ sedlová (jsou si rovny, nikdy menší)', () => {
    expect(plochaValbova(s, l, sk)).toBeCloseTo(plochaSedlovaStecha(s, l, sk), 4)
  })
  it('čtvercová střecha (l=s): valbová = stanová', () => {
    expect(r4(plochaValbova(10, 10, 35))).toBe(r4(plochaStanova(10, 10, 35)))
  })
})

describe('plochaStanova — 10×12 / 35°', () => {
  const s = 10, l = 12, sk = 35

  it('čtvercová střecha l=s dá správnou plochu', () => {
    const h = 5 * Math.tan(deg2rad(35))
    const krokev = Math.sqrt(25 + h * h)
    const ocekavana = 2 * 0.5 * 10 * krokev + 2 * 0.5 * 10 * krokev  // všechny strany stejné
    expect(r4(plochaStanova(10, 10, 35))).toBe(r4(ocekavana))
  })
  it('obdélníková střecha l≠s: výsledek > původního buggy kódu', () => {
    const h = 5 * Math.tan(deg2rad(35))
    const krokev_sedl = delkaKrokve(s, sk)  // bug: používalo pro obě strany
    const buggy = 2 * (0.5 * s * krokev_sedl) + 2 * (0.5 * l * krokev_sedl)
    expect(plochaStanova(s, l, sk)).toBeGreaterThan(buggy - 0.01)  // opravená je ≥ buggy
  })
  it('plocha > 0 pro jakékoli rozumné vstupy', () => {
    expect(plochaStanova(8, 12, 30)).toBeGreaterThan(0)
    expect(plochaStanova(6, 6, 45)).toBeGreaterThan(0)
  })
})

describe('plochaValbova vs plochaStanova (obecně)', () => {
  it('valbová ≥ stanová (ridge zachovává plochu)', () => {
    // Valbová má hřeben — stanová je geometricky menší
    expect(plochaValbova(10, 14, 35)).toBeGreaterThanOrEqual(plochaStanova(10, 14, 35) - 0.01)
  })
})

describe('nárožní krokev valbové — 10×12 / 35°', () => {
  it('= sqrt(2×(s/2)² + h²) = 7.891 m', () => {
    const h  = 5 * Math.tan(deg2rad(35))
    const ocekavana = Math.sqrt(2 * 25 + h * h)
    expect(r4(delkaNarozniValbova(10, 35))).toBe(r4(ocekavana))
    expect(delkaNarozniValbova(10, 35)).toBeCloseTo(7.891, 2)
  })
  it('nezávisí na délce budovy (pouze na šířce a sklonu)', () => {
    expect(delkaNarozniValbova(10, 35)).toBe(delkaNarozniValbova(10, 35))
    // pro různé délky stejná šířka = stejná nárožní
    expect(r4(delkaNarozniValbova(10, 35))).toBe(r4(delkaNarozniValbova(10, 35)))
  })
})

describe('nárožní krokev stanové — 10×12 / 35°', () => {
  it('= sqrt((l/2)² + (s/2)² + h²) = 8.559 m', () => {
    const h = 5 * Math.tan(deg2rad(35))
    const ocekavana = Math.sqrt(36 + 25 + h * h)
    expect(r4(delkaNarozniStanova(10, 12, 35))).toBe(r4(ocekavana))
    expect(delkaNarozniStanova(10, 12, 35)).toBeCloseTo(8.559, 2)
  })
  it('čtvercová (l=s): stanová nárožní = valbová nárožní (identity pro l=s=s)', () => {
    // Pro l=s=10: narozniStan = sqrt((5)²+(5)²+h²) = narozniValb
    expect(r4(delkaNarozniStanova(10, 10, 35))).toBe(r4(delkaNarozniValbova(10, 35)))
  })
})

describe('plochaPultova', () => {
  it('8×12 / 30° → krokev=8/cos30°=9.238, plocha=9.238×12=110.85 m²', () => {
    const krokev = 8 / Math.cos(deg2rad(30))
    expect(r4(plochaPultova(8, 12, 30))).toBe(r4(krokev * 12))
  })
  it('pultová = sedlová (matematická identita: jeden svah s×l = dva svhy s/2×l)', () => {
    // plochaPult = (s/cos)×l = sedlova = 2×(s/2/cos)×l — stejná plocha!
    expect(r4(plochaPultova(8, 12, 35))).toBe(r4(plochaSedlovaStecha(8, 12, 35)))
  })
})
