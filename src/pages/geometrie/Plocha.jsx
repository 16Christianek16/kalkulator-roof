import { useMemo } from 'react'
import { Triangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { plochaSedlovaStecha, formatNum } from '../../utils/calculations'

export default function Plocha() {
  const { sirka, setSirka, delka, setDelka, sklon, setSklon, presahOkap, setPresahOkap, presahStit, setPresahStit } = useRoofStore()

  const res = useMemo(() => {
    const s  = parseFloat(sirka)      + 2 * parseFloat(presahOkap)
    const l  = parseFloat(delka)      + 2 * parseFloat(presahStit)
    const sk = parseFloat(sklon)
    const plocha  = plochaSedlovaStecha(s, l, sk)
    const pudorys = parseFloat(sirka) * parseFloat(delka)
    return {
      plocha:  formatNum(plocha),
      pudorys: formatNum(pudorys),
      narust:  formatNum((plocha / pudorys - 1) * 100, 1),
    }
  }, [sirka, delka, sklon, presahOkap, presahStit])

  return (
    <div>
      <PageHeader title="Plocha střechy" description="Rozvinutá plocha sedlové střechy včetně přesahů" icon={Triangle} />
      <SyncBanner />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Šířka domu" value={sirka} onChange={setSirka} unit="m" />
            <InputField label="Délka domu" value={delka} onChange={setDelka} unit="m" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" />
            <InputField label="Přesah okapní (každá strana)" value={presahOkap} onChange={setPresahOkap} unit="m" />
            <InputField label="Přesah štítový (každá strana)" value={presahStit} onChange={setPresahStit} unit="m" />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Půdorysná plocha budovy" value={res.pudorys} unit="m²" />
            <ResultCard label="Rozvinutá plocha střechy" value={res.plocha} unit="m²" highlight />
            <ResultCard label="Nárůst vlivem sklonu" value={res.narust} unit="%" />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
