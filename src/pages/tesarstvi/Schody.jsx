import { useState, useMemo } from 'react'
import { Hammer } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { rad2deg, formatNum } from '../../utils/calculations'

export default function Schody() {
  const [vyskaPodlazi, setVyskaPodlazi] = useState(2800)
  const [hloubkaSchodiste, setHloubkaSchodiste] = useState(3500)

  const res = useMemo(() => {
    const H = parseFloat(vyskaPodlazi)
    const L = parseFloat(hloubkaSchodiste)
    if (!H || !L) return null

    // Blondel: 2h + b = 630 mm
    const pocetStupu = Math.round(H / 175)
    const h = H / pocetStupu
    const b = 630 - 2 * h
    const sklon_deg = rad2deg(Math.atan(h / b))
    const delkaRamene = Math.sqrt(L * L + H * H)
    const vyhovi = h >= 150 && h <= 200 && b >= 220 && b <= 320

    return {
      pocetStupu,
      h: formatNum(h, 1),
      b: formatNum(b, 1),
      sklon_deg: formatNum(sklon_deg, 1),
      delkaRamene: formatNum(delkaRamene / 1000, 2),
      vyhovi,
      blondel: formatNum(2 * h + b, 1),
    }
  }, [vyskaPodlazi, hloubkaSchodiste])

  return (
    <div>
      <PageHeader title="Dřevěná schodiště" description="Výpočet výšky a šířky stupňů dle Blondelovy podmínky" icon={Hammer} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry schodiště" description="Blondelova podmínka: 2h + b = 630 mm">
          <div className="flex flex-col gap-4">
            <InputField label="Výška podlaží" value={vyskaPodlazi} onChange={setVyskaPodlazi} unit="mm" hint="Hotová podlaha → hotová podlaha" />
            <InputField label="Délka schodiště (půdorys)" value={hloubkaSchodiste} onChange={setHloubkaSchodiste} unit="mm" />
          </div>
        </CalcCard>

        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledky">
            {res ? (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Počet stupňů" value={res.pocetStupu} unit="ks" highlight />
                <ResultCard label="Výška stupně h" value={res.h} unit="mm" />
                <ResultCard label="Šířka stupně b" value={res.b} unit="mm" />
                <ResultCard label="Sklon schodiště" value={res.sklon_deg} unit="°" />
                <ResultCard label="Délka ramene" value={res.delkaRamene} unit="m" />
                <ResultCard label="Blondel 2h+b" value={res.blondel} unit="mm" />
              </div>
            ) : <p className="text-slate-400 text-sm">Vyplňte parametry.</p>}
          </CalcCard>
          {res && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${res.vyhovi ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
              {res.vyhovi
                ? '✓ Rozměry splňují normové požadavky (ČSN 73 4130)'
                : '⚠ Rozměry jsou mimo normový rozsah — upravte výšku podlaží nebo počet stupňů'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
