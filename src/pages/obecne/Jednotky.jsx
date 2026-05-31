import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import { formatNum } from '../../utils/calculations'

const delkaKonverze = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, ft: 0.3048,
}
const delkaLabels = { mm: 'mm', cm: 'cm', m: 'm', km: 'km', inch: 'palec (in)', ft: 'stopa (ft)' }

export default function Jednotky() {
  const [delka, setDelka] = useState(1)
  const [z, setZ] = useState('m')

  const konverze = useMemo(() => {
    const v = parseFloat(delka) * delkaKonverze[z]
    return Object.entries(delkaKonverze).map(([k, f]) => ({
      jednotka: k,
      hodnota: formatNum(v / f, k === 'mm' || k === 'cm' ? 1 : 4),
    }))
  }, [delka, z])

  return (
    <div>
      <PageHeader title="Převodník jednotek" description="Délky, plochy a úhly" icon={Calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Délkové jednotky">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <InputField label="Hodnota" value={delka} onChange={setDelka} />
              </div>
              <div className="flex-1">
                <SelectField label="Jednotka" value={z} onChange={setZ} options={
                  Object.entries(delkaLabels).map(([v, l]) => ({ value: v, label: l }))
                } />
              </div>
            </div>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {konverze.map(k => (
              <div key={k.jednotka} className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-600 font-medium">{delkaLabels[k.jednotka]}</span>
                <span className="font-mono text-slate-900">{k.hodnota}</span>
              </div>
            ))}
          </div>
        </CalcCard>

        <CalcCard title="Rychlý přehled">
          <div className="text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 mb-2">Délky</p>
            <p>1 palec (in) = 25.4 mm</p>
            <p>1 stopa (ft) = 304.8 mm = 12 palců</p>
            <p>1 yard = 914.4 mm = 3 stopy</p>
            <p className="font-semibold text-slate-800 mt-4 mb-2">Plochy</p>
            <p>1 m² = 10 000 cm²</p>
            <p>1 ha = 10 000 m²</p>
            <p>1 ar = 100 m²</p>
            <p className="font-semibold text-slate-800 mt-4 mb-2">Tlak / zatížení</p>
            <p>1 kN/m² = 100 kg/m²</p>
            <p>1 MPa = 1 N/mm² = 1 000 kN/m²</p>
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
