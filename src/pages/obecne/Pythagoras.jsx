import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { formatNum, rad2deg, deg2rad } from '../../utils/calculations'

export default function Pythagoras() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)

  const res = useMemo(() => {
    const av = parseFloat(a), bv = parseFloat(b)
    const c = Math.sqrt(av ** 2 + bv ** 2)
    const alfa = rad2deg(Math.atan(bv / av))
    const beta = 90 - alfa
    return {
      c: formatNum(c),
      alfa: formatNum(alfa, 1),
      beta: formatNum(beta, 1),
    }
  }, [a, b])

  return (
    <div>
      <PageHeader title="Pythagorova věta" description="Výpočet přepony a úhlů pravoúhlého trojúhelníku" icon={Calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Odvěsny" description="c² = a² + b²">
          <div className="flex flex-col gap-4">
            <InputField label="Odvěsna a (vodorovná)" value={a} onChange={setA} unit="m" />
            <InputField label="Odvěsna b (svislá)" value={b} onChange={setB} unit="m" />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Přepona c" value={res.c} unit="m" highlight />
            <ResultCard label="Úhel α (u odvěsny a)" value={res.alfa} unit="°" />
            <ResultCard label="Úhel β (u odvěsny b)" value={res.beta} unit="°" />
            <ResultCard label="Pravý úhel" value="90" unit="°" />
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono">
            c = √(a² + b²) = √({a}² + {b}²) = {res.c} m
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
