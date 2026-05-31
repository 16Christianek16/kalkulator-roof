import { useState, useMemo } from 'react'
import { Wrench } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { dilatacePlechu, formatNum } from '../../utils/calculations'

const materialy = {
  'tizink': { label: 'Titan-zinek', hustota: 7200, koef: 0.022 },
  'med': { label: 'Měď', hustota: 8900, koef: 0.017 },
  'hlinik': { label: 'Hliník', hustota: 2700, koef: 0.023 },
  'ocel': { label: 'Ocel pozinkovaná', hustota: 7850, koef: 0.012 },
}

export default function Oplechovani() {
  const [delka, setDelka] = useState(6)
  const [sirka, setSirka] = useState(0.5)
  const [material, setMaterial] = useState('tizink')
  const [tloustka, setTloustka] = useState(0.7)

  const res = useMemo(() => {
    const l = parseFloat(delka)
    const s = parseFloat(sirka)
    const t = parseFloat(tloustka)
    const mat = materialy[material]

    const plocha = l * s
    const hmotnost = plocha * t / 1000 * mat.hustota
    const dilatace = dilatacePlechu({ delka_m: l, koefTiZink: mat.koef })
    const dilSpoj = Math.ceil(l / 2) // dilatační spoje každé 2m
    const preklyt = dilSpoj * 0.03

    return {
      plocha: formatNum(plocha),
      hmotnost: formatNum(hmotnost, 1),
      dilatace: formatNum(dilatace, 1),
      dilSpoj,
      preklyt: formatNum(preklyt, 2),
    }
  }, [delka, sirka, material, tloustka])

  return (
    <div>
      <PageHeader title="Oplechování ploch" description="Výpočet plechu, hmotnosti a dilatace" icon={Wrench} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Délka oplechování" value={delka} onChange={setDelka} unit="m" />
            <InputField label="Šířka rozvinutého plechu" value={sirka} onChange={setSirka} unit="m" />
            <SelectField label="Materiál" value={material} onChange={setMaterial} options={
              Object.entries(materialy).map(([v, d]) => ({ value: v, label: d.label }))
            } />
            <InputField label="Tloušťka plechu" value={tloustka} onChange={setTloustka} unit="mm" min={0.4} max={2} step={0.1} />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Plocha plechu" value={res.plocha} unit="m²" highlight />
            <ResultCard label="Hmotnost" value={res.hmotnost} unit="kg" />
            <ResultCard label="Dilatace (ΔT 80°C)" value={res.dilatace} unit="mm" />
            <ResultCard label="Dilatační spoje" value={res.dilSpoj} unit="ks" />
            <ResultCard label="Překrytí spojů" value={res.preklyt} unit="m" />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
