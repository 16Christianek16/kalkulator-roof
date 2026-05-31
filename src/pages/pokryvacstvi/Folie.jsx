import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'

export default function Folie() {
  const { getPlocha } = useRoofStore()
  const [presah,    setPresah]    = useState(150)
  const [sirkaRole, setSirkaRole] = useState(1500)
  const [delkaRole, setDelkaRole] = useState(50)

  const plochaSt = getPlocha()

  const res = useMemo(() => {
    const p   = plochaSt
    const pres = parseFloat(presah) / 1000
    const sr   = parseFloat(sirkaRole) / 1000
    const dr   = parseFloat(delkaRole)
    const efektivniSirka = sr - pres
    const pocetPasu = Math.ceil(p / (efektivniSirka * dr))
    const celkemM2  = pocetPasu * sr * dr
    const odpad     = celkemM2 - p
    return {
      efektivniSirka: formatNum(efektivniSirka * 100, 0),
      pocetPasu,
      celkemM2: formatNum(celkemM2),
      odpad:    formatNum(odpad),
      plocha:   formatNum(p),
    }
  }, [plochaSt, presah, sirkaRole, delkaRole])

  return (
    <div>
      <PageHeader title="Střešní fólie a parozábrana" description="Výpočet spotřeby střešní fólie / parozábrany" icon={Layers} />
      <SyncBanner label="Plocha střechy počítána z půdorysu střechy" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Plocha střechy" value={res.plocha} onChange={() => {}} unit="m²" hint="Počítáno z půdorysu — upravte tam" />
            <InputField label="Přesah (překrytí pásu)" value={presah} onChange={setPresah} unit="mm" hint="Obvykle 100–200 mm" />
            <InputField label="Šířka role" value={sirkaRole} onChange={setSirkaRole} unit="mm" />
            <InputField label="Délka role" value={delkaRole} onChange={setDelkaRole} unit="m" />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Efektivní šířka pásu" value={res.efektivniSirka} unit="cm" />
            <ResultCard label="Počet rolí" value={res.pocetPasu} unit="ks" highlight />
            <ResultCard label="Celkem m²" value={res.celkemM2} unit="m²" />
            <ResultCard label="Odpad" value={res.odpad} unit="m²" />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
