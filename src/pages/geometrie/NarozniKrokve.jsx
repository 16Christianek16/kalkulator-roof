import { useState, useMemo } from 'react'
import { Triangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { deg2rad, rad2deg, vyskaHrebene, formatNum } from '../../utils/calculations'

export default function NarozniKrokve() {
  const [sirka, setSirka] = useState(8)
  const [delka, setDelka] = useState(12)
  const [sklon, setSklon] = useState(35)

  const res = useMemo(() => {
    const s = parseFloat(sirka)
    const l = parseFloat(delka)
    const sk = parseFloat(sklon)
    const h = vyskaHrebene(s, sk)

    const pulS = s / 2
    const pulL = l / 2

    const narozniValbova = Math.sqrt(pulS ** 2 + pulS ** 2 + h ** 2)
    const uzlabi = Math.sqrt(pulS ** 2 + pulS ** 2 + h ** 2)
    const sklonNarozni = rad2deg(Math.atan(h / Math.sqrt(pulS ** 2 + pulS ** 2)))

    return {
      h: formatNum(h),
      narozni: formatNum(narozniValbova),
      uzlabi: formatNum(uzlabi),
      sklonNarozni: formatNum(sklonNarozni, 1),
    }
  }, [sirka, delka, sklon])

  return (
    <div>
      <PageHeader title="Nárožní a úžlabní krokve" description="Výpočet délek nárožních a úžlabních krokví valbové střechy" icon={Triangle} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Šířka domu" value={sirka} onChange={setSirka} unit="m" />
            <InputField label="Délka domu" value={delka} onChange={setDelka} unit="m" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={10} max={60} />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Výška hřebene" value={res.h} unit="m" />
            <ResultCard label="Délka nárožní krokve" value={res.narozni} unit="m" highlight />
            <ResultCard label="Délka úžlabní krokve" value={res.uzlabi} unit="m" highlight />
            <ResultCard label="Sklon nárožní krokve" value={res.sklonNarozni} unit="°" />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
