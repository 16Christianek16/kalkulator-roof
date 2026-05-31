import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { formatNum, deg2rad } from '../../utils/calculations'

export default function Plochy() {
  const [tvar, setTvar] = useState('obdelnik')
  const [a, setA] = useState(5)
  const [b, setB] = useState(3)
  const [c, setC] = useState(4)

  const res = useMemo(() => {
    const av = parseFloat(a), bv = parseFloat(b), cv = parseFloat(c)
    if (tvar === 'obdelnik') {
      return { plocha: av * bv, obvod: 2 * (av + bv), label: 'Obdélník' }
    }
    if (tvar === 'trojuhelnik') {
      const s = (av + bv + cv) / 2
      const plocha = Math.sqrt(s * (s - av) * (s - bv) * (s - cv))
      return { plocha, obvod: av + bv + cv, label: 'Trojúhelník (Heronův vzorec)' }
    }
    if (tvar === 'kruh') {
      return { plocha: Math.PI * av * av, obvod: 2 * Math.PI * av, label: `Kruh r = ${av} m` }
    }
    if (tvar === 'lichobeznk') {
      return { plocha: ((av + bv) / 2) * cv, obvod: av + bv + 2 * cv, label: 'Lichoběžník' }
    }
    return null
  }, [tvar, a, b, c])

  return (
    <div>
      <PageHeader title="Plochy a objemy" description="Výpočet ploch základních geometrických tvarů" icon={Calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <SelectField label="Tvar" value={tvar} onChange={setTvar} options={[
              { value: 'obdelnik', label: 'Obdélník / čtverec' },
              { value: 'trojuhelnik', label: 'Trojúhelník (3 strany)' },
              { value: 'kruh', label: 'Kruh (poloměr)' },
              { value: 'lichobeznk', label: 'Lichoběžník' },
            ]} />
            <InputField label={tvar === 'kruh' ? 'Poloměr r' : 'Strana a'} value={a} onChange={setA} unit="m" />
            {tvar !== 'kruh' && <InputField label={tvar === 'lichobeznk' ? 'Strana b (rovnoběžná)' : 'Strana b'} value={b} onChange={setB} unit="m" />}
            {(tvar === 'trojuhelnik' || tvar === 'lichobeznk') && (
              <InputField label={tvar === 'lichobeznk' ? 'Výška h' : 'Strana c'} value={c} onChange={setC} unit="m" />
            )}
          </div>
        </CalcCard>
        <CalcCard title={res?.label}>
          {res && (
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Plocha" value={formatNum(res.plocha)} unit="m²" highlight />
              <ResultCard label="Obvod" value={formatNum(res.obvod)} unit="m" />
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
