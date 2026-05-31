import { useState, useMemo } from 'react'
import { Hammer } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { prurezovyModul, maxPruhyb, formatNum } from '../../utils/calculations'

const fmd = { C16: 16, C18: 18, C24: 24, C30: 30 }

export default function Stropy() {
  const [rozpeti, setRozpeti] = useState(4.5)
  const [rozteč, setRozteč] = useState(625)
  const [zatizeni, setZatizeni] = useState(3.5)
  const [trida, setTrida] = useState('C24')

  const res = useMemo(() => {
    const l = parseFloat(rozpeti)
    const r = parseFloat(rozteč) / 1000
    const q = parseFloat(zatizeni) * r
    const f = fmd[trida]

    const M_kNm = (q * l * l) / 8
    const W_min_mm3 = (M_kNm * 1e6) / f
    const b = 60
    const h = Math.ceil(Math.sqrt((6 * W_min_mm3) / b) / 10) * 10
    const h_zaokr = Math.max(160, h)

    const pruhyb_max = maxPruhyb(l)
    const E = 11000
    const I = (b * Math.pow(h_zaokr, 3)) / 12
    const pruhyb = (5 * (q / 1000) * Math.pow(l * 1000, 4)) / (384 * E * I)

    return {
      q: formatNum(q),
      M: formatNum(M_kNm),
      W: formatNum(W_min_mm3 / 1000),
      h_zaokr,
      pruhyb_max: formatNum(pruhyb_max),
      pruhyb: formatNum(pruhyb),
      vyhovi: pruhyb <= pruhyb_max,
    }
  }, [rozpeti, rozteč, zatizeni, trida])

  return (
    <div>
      <PageHeader title="Dřevěné stropy a podlahy" description="Dimenzování stropních trámů" icon={Hammer} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Rozpětí stropu" value={rozpeti} onChange={setRozpeti} unit="m" />
            <InputField label="Rozteč trámů" value={rozteč} onChange={setRozteč} unit="mm" />
            <InputField label="Celkové zatížení" value={zatizeni} onChange={setZatizeni} unit="kN/m²" hint="Vlastní tíha + podlaha + nábytek" />
            <SelectField label="Třída dřeva" value={trida} onChange={setTrida} options={[
              { value: 'C16', label: 'C16' }, { value: 'C18', label: 'C18' },
              { value: 'C24', label: 'C24' }, { value: 'C30', label: 'C30' },
            ]} />
          </div>
        </CalcCard>
        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledky">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Zatížení na trám" value={res.q} unit="kN/m" />
              <ResultCard label="Moment" value={res.M} unit="kNm" />
              <ResultCard label="Min. W" value={res.W} unit="cm³" />
              <ResultCard label="Výška trámu" value={`60×${res.h_zaokr}`} unit="mm" highlight />
              <ResultCard label="Max. průhyb" value={res.pruhyb_max} unit="mm" />
              <ResultCard label="Skutečný průhyb" value={res.pruhyb} unit="mm" note={res.vyhovi ? '✓ OK' : '✗ Nevyhovuje'} />
            </div>
          </CalcCard>
        </div>
      </div>
    </div>
  )
}
