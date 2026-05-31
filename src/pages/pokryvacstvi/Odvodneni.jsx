import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { pruTokDeste, formatNum } from '../../utils/calculations'

export default function Odvodneni() {
  const [plocha, setPlocha] = useState(80)
  const [intenzita, setIntenzita] = useState(0.033)
  const [delkaZlabu, setDelkaZlabu] = useState(10)

  const res = useMemo(() => {
    const Q = pruTokDeste({ plocha_m2: parseFloat(plocha), intenzita_lsm2: parseFloat(intenzita) })
    const prumer = 87 + Math.ceil(Math.sqrt(Q * 1000 / (Math.PI * 2.5)) * 10)
    const pocetSvodu = Math.ceil(parseFloat(delkaZlabu) / 10)

    return {
      Q: formatNum(Q, 3),
      prumer: prumer,
      pocetSvodu,
      minSvod: Q / pocetSvodu > 1 ? '⚠ Zvažte více svodů' : '✓ OK'
    }
  }, [plocha, intenzita, delkaZlabu])

  return (
    <div>
      <PageHeader title="Odvodnění střechy" description="Výpočet průtoku dešťové vody, žlabů a svodů" icon={Layers} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry" description="ČSN EN 12056-3">
          <div className="flex flex-col gap-4">
            <InputField label="Odvodňovaná plocha" value={plocha} onChange={setPlocha} unit="m²" />
            <InputField label="Intenzita deště" value={intenzita} onChange={setIntenzita} unit="l/s·m²" hint="Výpočtová: 0.033 l/s·m² (ČR průměr)" step="0.001" />
            <InputField label="Délka žlabu" value={delkaZlabu} onChange={setDelkaZlabu} unit="m" />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Výpočtový průtok Q" value={res.Q} unit="l/s" highlight />
            <ResultCard label="Min. průměr svodu" value={res.prumer} unit="mm" />
            <ResultCard label="Doporučený počet svodů" value={res.pocetSvodu} unit="ks" />
            <ResultCard label="Posouzení" value={res.minSvod} />
          </div>
          <p className="text-xs text-slate-400 mt-4">Pro přesné hydraulické posouzení použijte ČSN EN 12056-3.</p>
        </CalcCard>
      </div>
    </div>
  )
}
