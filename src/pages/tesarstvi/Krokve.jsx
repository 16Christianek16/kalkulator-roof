import { useState, useMemo } from 'react'
import { Hammer } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { delkaKrokve, formatNum } from '../../utils/calculations'

export default function Krokve() {
  const { sirka, setSirka, sklon, setSklon, presahOkap, setPresahOkap, roztecKrokvi, setRoztecKrokvi } = useRoofStore()
  const [zatizeni, setZatizeni] = useState(1.5)
  const [trida, setTrida] = useState('C24')

  const fmd = { C16: 16, C18: 18, C24: 24, C30: 30 }

  const res = useMemo(() => {
    const l_krokve = delkaKrokve(parseFloat(sirka), parseFloat(sklon)) + parseFloat(presahOkap)
    const q = parseFloat(zatizeni) * (parseFloat(roztecKrokvi) / 1000)
    const M_kNm = (q * l_krokve * l_krokve) / 8
    const M_Nm  = M_kNm * 1000
    const f = fmd[trida]
    const W_min_mm3 = (M_Nm * 1000) / f
    const W_min_cm3 = W_min_mm3 / 1000
    const b = 60
    const h = Math.ceil(Math.sqrt((6 * W_min_mm3) / b) / 10) * 10
    const h_zaokr = Math.max(120, h)
    return {
      l_krokve: formatNum(l_krokve),
      q: formatNum(q),
      M_kNm: formatNum(M_kNm),
      W_min: formatNum(W_min_cm3),
      prurez: `60 × ${h_zaokr} mm`,
      h_zaokr,
    }
  }, [sirka, sklon, presahOkap, roztecKrokvi, zatizeni, trida])

  return (
    <div>
      <PageHeader title="Dimenzování krokví" description="Návrh průřezu krokví sedlové střechy dle ČSN EN 1995-1-1" icon={Hammer} />
      <SyncBanner />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Vstupní parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Šířka domu (půdorys)" value={sirka} onChange={setSirka} unit="m" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={10} max={70} />
            <InputField label="Přesah střechy" value={presahOkap} onChange={setPresahOkap} unit="m" min={0} max={2} />
            <InputField label="Rozteč krokví" value={roztecKrokvi} onChange={setRoztecKrokvi} unit="mm" min={400} max={1200} step={50} hint="Synchronizováno s půdorysem" />
            <InputField label="Zatížení na m² střechy" value={zatizeni} onChange={setZatizeni} unit="kN/m²" hint="Krytina + sníh + vítr" />
            <SelectField label="Pevnostní třída" value={trida} onChange={setTrida} options={[
              { value: 'C16', label: 'C16' }, { value: 'C18', label: 'C18' },
              { value: 'C24', label: 'C24 (doporučená)' }, { value: 'C30', label: 'C30' }
            ]} />
          </div>
        </CalcCard>
        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledky">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Délka krokve" value={res.l_krokve} unit="m" />
              <ResultCard label="Zatížení na krokev" value={res.q} unit="kN/m" />
              <ResultCard label="Ohybový moment" value={res.M_kNm} unit="kNm" />
              <ResultCard label="Min. průřezový modul" value={res.W_min} unit="cm³" />
            </div>
          </CalcCard>
          <CalcCard title="Navržený průřez krokve">
            <p className="text-2xl font-bold" style={{ color: 'var(--wood-dark)' }}>{res.prurez}</p>
            <p className="text-xs mt-2" style={{ color: '#64748b' }}>Orientační výpočet — nosné konstrukce ověřte se statikem.</p>
          </CalcCard>
        </div>
      </div>
    </div>
  )
}
