import { useState, useMemo } from 'react'
import { Hammer } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { prurezovyModul, maxPruhyb, formatNum, round } from '../../utils/calculations'

const pevnostniTridy = [
  { value: 'C16', label: 'C16 — fmd = 16 MPa' },
  { value: 'C18', label: 'C18 — fmd = 18 MPa' },
  { value: 'C24', label: 'C24 — fmd = 24 MPa (nejčastější)' },
  { value: 'C30', label: 'C30 — fmd = 30 MPa' },
]

const fmd = { C16: 16, C18: 18, C24: 24, C30: 30 }

export default function PrurezTramu() {
  const [rozpeti, setRozpeti] = useState(4)
  const [zatizeni, setZatizeni] = useState(3)
  const [trida, setTrida] = useState('C24')
  const [sirka, setSirka] = useState(100)

  const res = useMemo(() => {
    const l = parseFloat(rozpeti)
    const q = parseFloat(zatizeni)
    const b = parseFloat(sirka)
    if (!l || !q || !b) return null

    const M_kNm = (q * l * l) / 8
    const M_Nm = M_kNm * 1000
    const f = fmd[trida]
    const W_min_mm3 = (M_Nm * 1000) / f
    const W_min_cm3 = W_min_mm3 / 1000

    // Výška pro danou šířku b
    const h_mm = Math.ceil(Math.sqrt((6 * W_min_mm3) / b))
    const h_zaokr = Math.ceil(h_mm / 20) * 20

    const W_sku = prurezovyModul(b, h_zaokr)
    const pruhyb_max = maxPruhyb(l)

    const E = 11000 // MPa C24
    const I = (b * Math.pow(h_zaokr, 3)) / 12
    const pruhyb_sku = (5 * (q / 1000) * Math.pow(l * 1000, 4)) / (384 * E * I)

    return { M_kNm, W_min_cm3, h_mm, h_zaokr, W_sku: W_sku / 1000, pruhyb_max, pruhyb_sku, vyhovi: pruhyb_sku <= pruhyb_max }
  }, [rozpeti, zatizeni, trida, sirka])

  return (
    <div>
      <PageHeader
        title="Průřez trámů"
        description="Orientační návrh průřezu dřevěných trámů na ohyb (prosté uložení)"
        icon={Hammer}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Vstupní parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Rozpětí trámu" value={rozpeti} onChange={setRozpeti} unit="m" min={0.5} max={12} />
            <InputField label="Celkové návrhové zatížení q" value={zatizeni} onChange={setZatizeni} unit="kN/m" min={0.1} hint="Vlastní tíha + užitné zatížení" />
            <SelectField label="Pevnostní třída dřeva" value={trida} onChange={setTrida} options={pevnostniTridy} />
            <InputField label="Šířka průřezu b" value={sirka} onChange={setSirka} unit="mm" min={40} max={500} step={10} />
          </div>
        </CalcCard>

        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledky">
            {res ? (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Ohybový moment" value={formatNum(res.M_kNm)} unit="kNm" />
                <ResultCard label="Minimální W" value={formatNum(res.W_min_cm3)} unit="cm³" />
                <ResultCard label="Potřebná výška h" value={res.h_mm} unit="mm" />
                <ResultCard label="Doporučená výška" value={res.h_zaokr} unit="mm" highlight />
                <ResultCard label="Max. průhyb L/300" value={formatNum(res.pruhyb_max)} unit="mm" />
                <ResultCard
                  label="Skutečný průhyb"
                  value={formatNum(res.pruhyb_sku)}
                  unit="mm"
                  note={res.vyhovi ? '✓ Vyhovuje' : '✗ Nevyhovuje!'}
                />
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Vyplňte vstupní parametry.</p>
            )}
          </CalcCard>

          {res && (
            <CalcCard title="Navržený průřez">
              <p className="text-2xl font-bold font-condensed" style={{ color: 'var(--amber)' }}>
                {sirka} × {res.h_zaokr} mm
              </p>
              <p className="text-sm text-slate-500 mt-1">
                W = {formatNum(res.W_sku)} cm³ &nbsp;·&nbsp; Třída {trida}
              </p>
              <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${res.vyhovi ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {res.vyhovi ? '✓ Průhyb vyhovuje (L/300)' : '✗ Průhyb nevyhovuje — zvětšete průřez!'}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Výpočet je orientační. Pro statický návrh nosných konstrukcí použijte statika.
              </p>
            </CalcCard>
          )}
        </div>
      </div>
    </div>
  )
}
