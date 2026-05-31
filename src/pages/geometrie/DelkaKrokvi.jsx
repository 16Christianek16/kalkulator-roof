import { useMemo } from 'react'
import { Triangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { delkaKrokve, vyskaHrebene, slopeDegToPercent, slopeDegToRatio, formatNum } from '../../utils/calculations'

export default function DelkaKrokvi() {
  const { sirka, setSirka, sklon, setSklon, presahOkap, setPresahOkap } = useRoofStore()

  const res = useMemo(() => {
    const s  = parseFloat(sirka)
    const sk = parseFloat(sklon)
    const p  = parseFloat(presahOkap)
    const krokev = delkaKrokve(s, sk)
    return {
      krokev:          formatNum(krokev),
      krokevSPresahem: formatNum(krokev + p),
      hreb:            formatNum(vyskaHrebene(s, sk)),
      slopenPct:       formatNum(slopeDegToPercent(sk), 1),
      slopeRatio:      formatNum(slopeDegToRatio(sk), 2),
    }
  }, [sirka, sklon, presahOkap])

  return (
    <div>
      <PageHeader title="Délka krokví" description="Výpočet délky krokví sedlové střechy a výšky hřebene" icon={Triangle} />
      <SyncBanner />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Vstupní parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Šířka domu (vnější rozměr)" value={sirka} onChange={setSirka} unit="m" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={5} max={75} />
            <InputField label="Přesah střechy" value={presahOkap} onChange={setPresahOkap} unit="m" />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Délka krokve (bez přesahu)" value={res.krokev} unit="m" />
            <ResultCard label="Délka krokve (s přesahem)" value={res.krokevSPresahem} unit="m" highlight />
            <ResultCard label="Výška hřebene" value={res.hreb} unit="m" highlight />
            <ResultCard label="Sklon v %" value={res.slopenPct} unit="%" />
            <ResultCard label="Sklon — poměr 1:X" value={`1 : ${res.slopeRatio}`} />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
