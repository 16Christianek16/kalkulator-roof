import { useState, useMemo } from 'react'
import { Hammer } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { formatNum } from '../../utils/calculations'

export default function Late() {
  const [delkaKrokve, setDelkaKrokve] = useState(5)
  const [rozteč, setRozteč] = useState(330)
  const [delkaStrechy, setDelkaStrechy] = useState(10)
  const [roztecKrokvi, setRoztecKrokvi] = useState(900)

  const res = useMemo(() => {
    const l = parseFloat(delkaKrokve)
    const r = parseFloat(rozteč) / 1000
    const ls = parseFloat(delkaStrechy)
    const rk = parseFloat(roztecKrokvi) / 1000

    const pocetLati = Math.ceil(l / r) + 1
    const celkemLati = pocetLati * 2
    const pocetKrokvi = Math.ceil(ls / rk) + 1

    const celkemBm = pocetLati * 2 * ls
    const celkemKs = celkemLati * pocetKrokvi

    return { pocetLati, celkemLati, pocetKrokvi, celkemBm: formatNum(celkemBm), rozteč: formatNum(r * 1000), celkemKs }
  }, [delkaKrokve, rozteč, delkaStrechy, roztecKrokvi])

  return (
    <div>
      <PageHeader title="Střešní latě" description="Výpočet počtu a spotřeby střešních latí" icon={Hammer} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry střechy">
          <div className="flex flex-col gap-4">
            <InputField label="Délka krokve (šikmá)" value={delkaKrokve} onChange={setDelkaKrokve} unit="m" />
            <InputField label="Rozteč latí" value={rozteč} onChange={setRozteč} unit="mm" hint="Dle typu krytiny (např. 330 mm bobrovka)" />
            <InputField label="Délka střechy (hřeben)" value={delkaStrechy} onChange={setDelkaStrechy} unit="m" />
            <InputField label="Rozteč krokví" value={roztecKrokvi} onChange={setRoztecKrokvi} unit="mm" />
          </div>
        </CalcCard>

        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Počet latí na krokev" value={res.pocetLati} unit="ks" />
            <ResultCard label="Počet krokví" value={res.pocetKrokvi} unit="ks" />
            <ResultCard label="Celkem latí (2 strany)" value={res.celkemLati} unit="ks" highlight />
            <ResultCard label="Celkem bm latí" value={res.celkemBm} unit="bm" highlight />
          </div>
          <p className="text-xs text-slate-400 mt-4">Přidejte 5–10 % na odpad a řezy.</p>
        </CalcCard>
      </div>
    </div>
  )
}
