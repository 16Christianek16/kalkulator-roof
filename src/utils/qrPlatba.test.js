import { describe, it, expect } from 'vitest'
import { ucetNaIBAN, vytvorSPAYD, vsZCislaFaktury } from './qrPlatba'

describe('ucetNaIBAN', () => {
  it('převede formát číslo/kód na IBAN (bez předčíslí)', () => {
    // Číslo účtu 19-2000145399/0800 (Česká spořitelna testovací)
    const iban = ucetNaIBAN('2000145399/0800')
    expect(iban).toMatch(/^CZ\d{2}/)
    expect(iban).toHaveLength(24)
  })

  it('převede formát s předčíslím (19-xxxxxx/0800)', () => {
    const iban = ucetNaIBAN('19-2000145399/0800')
    expect(iban).toMatch(/^CZ\d{2}/)
    expect(iban).toHaveLength(24)
  })

  it('vrátí IBAN přímo, pokud vstup je IBAN', () => {
    const vstup = 'CZ6508000000192000145399'
    expect(ucetNaIBAN(vstup)).toBe(vstup)
  })

  it('vrátí null pro neplatný formát', () => {
    expect(ucetNaIBAN('neplatny-ucet')).toBeNull()
    expect(ucetNaIBAN('')).toBeNull()
  })

  it('IBAN začíná CZ a má 24 znaků', () => {
    const iban = ucetNaIBAN('123456789/0100')
    if (iban) {
      expect(iban).toMatch(/^CZ\d{22}$/)
    }
  })
})

describe('vytvorSPAYD', () => {
  const iban = 'CZ6508000000192000145399'

  it('vytvoří validní SPAYD řetězec', () => {
    const spayd = vytvorSPAYD({ iban, castka: 12500.50, vs: '20250001' })
    expect(spayd).toContain('SPD*1.0')
    expect(spayd).toContain(`ACC:${iban}`)
    expect(spayd).toContain('AM:12500.50')
    expect(spayd).toContain('CC:CZK')
    expect(spayd).toContain('X-VS:20250001')
  })

  it('formátuje částku na 2 desetinná místa', () => {
    const spayd = vytvorSPAYD({ iban, castka: 1000, vs: '001' })
    expect(spayd).toContain('AM:1000.00')
  })

  it('vrátí null pokud chybí IBAN', () => {
    expect(vytvorSPAYD({ iban: null, castka: 1000, vs: '001' })).toBeNull()
    expect(vytvorSPAYD({ iban: '',   castka: 1000, vs: '001' })).toBeNull()
  })

  it('vrátí null pro nulovou nebo zápornou částku', () => {
    expect(vytvorSPAYD({ iban, castka: 0,   vs: '001' })).toBeNull()
    expect(vytvorSPAYD({ iban, castka: -100, vs: '001' })).toBeNull()
  })

  it('zkrátí VS na max 10 číslic', () => {
    const spayd = vytvorSPAYD({ iban, castka: 100, vs: '12345678901234' })
    const match = spayd.match(/X-VS:(\d+)/)
    expect(match?.[1]).toHaveLength(10)
  })

  it('zkrátí MSG na max 60 znaků', () => {
    const longMsg = 'A'.repeat(100)
    const spayd = vytvorSPAYD({ iban, castka: 100, vs: '001', msg: longMsg })
    const match = spayd.match(/MSG:([^*]+)/)
    expect(match?.[1].length).toBeLessThanOrEqual(60)
  })

  it('SPAYD odděluje položky hvězdičkou', () => {
    const spayd = vytvorSPAYD({ iban, castka: 100, vs: '001' })
    expect(spayd.split('*').length).toBeGreaterThanOrEqual(5)
  })
})

describe('vsZCislaFaktury', () => {
  it('FA-2025-001 → 2025001 (jen číslice)', () => {
    expect(vsZCislaFaktury('FA-2025-001')).toBe('2025001')
  })
  it('NB-2025-042 → 2025042', () => {
    expect(vsZCislaFaktury('NB-2025-042')).toBe('2025042')
  })
  it('prázdný vstup → prázdný string', () => {
    expect(vsZCislaFaktury('')).toBe('')
    expect(vsZCislaFaktury(null)).toBe('')
  })
  it('maximálně 8 číslic', () => {
    expect(vsZCislaFaktury('FA-20251234567').length).toBeLessThanOrEqual(8)
  })
})
