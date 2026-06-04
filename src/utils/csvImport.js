// Parsuje CSV soubor s parametry střechy
// Podporované formáty:
//   sirka,delka,sklon,presahOkap,presahStit,roztecKrokvi
//   8,12,35,0.5,0.3,900
// nebo klíč=hodnota na každém řádku:
//   sirka=8
//   delka=12

export function parseRoofCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  const result = {}

  // Formát klíč=hodnota
  if (lines.some(l => l.includes('='))) {
    for (const line of lines) {
      const [key, val] = line.split('=').map(s => s.trim())
      if (key && val) result[key] = val
    }
    return result
  }

  // Formát CSV (první řádek = hlavička, druhý = hodnoty)
  const KNOWN_HEADERS = ['sirka', 'delka', 'sklon', 'presahOkap', 'presahoKap',
    'presahStit', 'presahstit', 'roztecKrokvi', 'rotezkrokvi', 'typ']

  if (lines.length >= 2) {
    const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase())
    const values  = lines[1].split(/[,;]/).map(v => v.trim())
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i]
      const v = values[i]
      if (!v) continue
      // Normalizuj název klíče
      if (h === 'sirka' || h === 'width' || h === 'breite')       result.sirka = v
      else if (h === 'delka' || h === 'length' || h === 'laenge') result.delka = v
      else if (h === 'sklon' || h === 'slope' || h === 'neigung') result.sklon = v
      else if (h.includes('okap') || h.includes('eave'))          result.presahOkap = v
      else if (h.includes('stit') || h.includes('gable'))         result.presahStit = v
      else if (h.includes('krokv') || h.includes('rafter'))       result.roztecKrokvi = v
      else if (h === 'typ' || h === 'type')                        result.typ = v
    }
    return result
  }

  // Jediný řádek — pokus o číselné hodnoty v pořadí
  if (lines.length === 1) {
    const vals = lines[0].split(/[,;]/).map(v => v.trim())
    const keys = ['sirka', 'delka', 'sklon', 'presahOkap', 'presahStit', 'roztecKrokvi']
    vals.forEach((v, i) => { if (keys[i]) result[keys[i]] = v })
    return result
  }

  throw new Error('Nepodporovaný formát CSV')
}

export function generateRoofCsvTemplate() {
  return 'sirka,delka,sklon,presahOkap,presahStit,roztecKrokvi\n8,12,35,0.5,0.3,900\n'
}
