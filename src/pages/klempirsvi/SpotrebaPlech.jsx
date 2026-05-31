import { useState, useMemo } from 'react'
import { Wrench } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { formatNum } from '../../utils/calculations'

const polotovary = {
  '1000x2000': { label: 'Tabule 1000×2000 mm', plocha: 2.0 },
  '1000x3000': { label: 'Tabule 1000×3000 mm', plocha: 3.0 },
  '1500x3000': { label: 'Tabule 1500×3000 mm', plocha: 4.5 },
  'role_500': { label: 'Role 500 mm × 25 m', plocha: 12.5 },
  'role_670': { label: 'Role 670 mm × 25 m', plocha: 16.75 },
  'role_1000': { label: 'Role 1000 mm × 25 m', plocha: 25.0 },
}

const hustoty = { tizink: 7200, med: 8900, hlinik: 2700, ocel: 7850 }

export default function SpotrebaPlech() {
  const [potrebnaP, setPotrebnaP] = useState(20)
  const [presah, setPresah] = useState(10)
  const [polotovar, setPolotovar] = useState('1000x2000')
  const [mat, setMat] = useState('tizink')
  const [tloustka, setTloustka] = useState(0.7)

  const res = useMemo(() => {
    const p = parseFloat(potrebnaP) * (1 + parseFloat(presah) / 100)
    const pf = polotovary[polotovar].plocha
    const pocet = Math.ceil(p / pf)
    const celkem = pocet * pf
    const odpad = celkem - p
    const hustota = hustoty[mat]
    const hmotnost = celkem * (parseFloat(tloustka) / 1000) * hustota

    return {
      potrebnaS: formatNum(p),
      pocet,
      celkem: formatNum(celkem),
      odpad: formatNum(odpad),
      hmotnost: formatNum(hmotnost, 1),
    }
  }, [potrebnaP, presah, polotovar, mat, tloustka])

  return (
    <div>
      <PageHeader title="Spotřeba plechu" description="Výpočet počtu tabulí nebo rolí a hmotnosti materiálu" icon={Wrench} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Potřebná plocha plechu" value={potrebnaP} onChange={setPotrebnaP} unit="m²" />
            <InputField label="Přirážka na odpad a řezy" value={presah} onChange={setPresah} unit="%" />
            <SelectField label="Polotovar" value={polotovar} onChange={setPolotovar} options={
              Object.entries(polotovary).map(([v, d]) => ({ value: v, label: d.label }))
            } />
            <SelectField label="Materiál" value={mat} onChange={setMat} options={[
              { value: 'tizink', label: 'Titan-zinek' },
              { value: 'med', label: 'Měď' },
              { value: 'hlinik', label: 'Hliník' },
              { value: 'ocel', label: 'Ocel pozinkovaná' },
            ]} />
            <InputField label="Tloušťka plechu" value={tloustka} onChange={setTloustka} unit="mm" min={0.4} max={2} step={0.1} />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Potřebná plocha (s odpadem)" value={res.potrebnaS} unit="m²" />
            <ResultCard label="Počet kusů / rolí" value={res.pocet} unit="ks" highlight />
            <ResultCard label="Celkem zakoupeno" value={res.celkem} unit="m²" />
            <ResultCard label="Odpad" value={res.odpad} unit="m²" />
            <ResultCard label="Celková hmotnost" value={res.hmotnost} unit="kg" highlight />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
