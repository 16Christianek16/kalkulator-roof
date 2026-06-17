import { useState, useMemo } from 'react'
import { Triangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { deg2rad, delkaKrokve, vyskaHrebene, plochaValbova, delkaNarozniValbova, plochaStanova, delkaNarozniStanova, plochaPultova, formatNum } from '../../utils/calculations'

export default function SlozitoStrechy() {
  const [typ, setTyp] = useState('sedlova')
  const [sirka, setSirka] = useState(8)
  const [delka, setDelka] = useState(12)
  const [sklon, setSklon] = useState(35)
  const [presah, setPresah] = useState(0.5)

  const res = useMemo(() => {
    const s = parseFloat(sirka)
    const l = parseFloat(delka)
    const sk = parseFloat(sklon)
    const krokev = delkaKrokve(s, sk)
    const hreb = vyskaHrebene(s, sk)

    if (typ === 'sedlova') {
      return {
        plocha: formatNum(2 * krokev * l),
        krokev: formatNum(krokev),
        hreb: formatNum(hreb),
        hrebenDel: formatNum(l),
        typ: 'Sedlová',
      }
    }

    if (typ === 'valbova') {
      // Valbová = sedlová (matematická identita): 2×krokev×delka
      // Důkaz: hlavní plochy + valby = 2k(l−s/2) + 2×0.5×s×k = 2kl
      const plocha = plochaValbova(s, l, sk)
      const narozni = delkaNarozniValbova(s, sk)
      return {
        plocha: formatNum(plocha),
        krokev: formatNum(krokev),
        hreb: formatNum(hreb),
        hrebenDel: formatNum(Math.max(0, l - s)),
        narozni: formatNum(narozni),
        typ: 'Valbová',
      }
    }

    if (typ === 'pultova') {
      const krokev_pult = s / Math.cos(deg2rad(sk))
      return {
        plocha: formatNum(plochaPultova(s, l, sk)),
        krokev: formatNum(krokev_pult),
        hreb: formatNum(s * Math.tan(deg2rad(sk))),
        hrebenDel: formatNum(l),
        typ: 'Pultová',
      }
    }

    if (typ === 'stanova') {
      // Stanová: každý pár protilehlých stěn má jinou délku krokve (pro l ≠ s)
      // Boční strana (base=l): krokev_bok = sqrt((s/2)²+h²)
      // Štítová strana (base=s): krokev_sit = sqrt((l/2)²+h²)
      const plocha = plochaStanova(s, l, sk)
      const narozni = delkaNarozniStanova(s, l, sk)
      const krokev_bok = Math.sqrt((s / 2) ** 2 + hreb ** 2)
      return {
        plocha: formatNum(plocha),
        krokev: formatNum(krokev_bok),
        hreb: formatNum(hreb),
        narozni: formatNum(narozni),
        hrebenDel: '0 (stan)',
        typ: 'Stanová',
      }
    }
    return null
  }, [typ, sirka, delka, sklon])

  return (
    <div>
      <PageHeader title="Složité střechy" description="Výpočet ploch a délek pro různé typy střech" icon={Triangle} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <SelectField label="Typ střechy" value={typ} onChange={setTyp} options={[
              { value: 'sedlova', label: 'Sedlová střecha' },
              { value: 'valbova', label: 'Valbová střecha' },
              { value: 'pultova', label: 'Pultová střecha' },
              { value: 'stanova', label: 'Stanová střecha' },
            ]} />
            <InputField label="Šířka domu" value={sirka} onChange={setSirka} unit="m" />
            <InputField label="Délka domu" value={delka} onChange={setDelka} unit="m" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={5} max={75} />
          </div>
        </CalcCard>
        <CalcCard title={`Výsledky — ${res?.typ}`}>
          {res && (
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Plocha střechy" value={res.plocha} unit="m²" highlight />
              <ResultCard label="Délka krokve" value={res.krokev} unit="m" />
              <ResultCard label="Výška hřebene" value={res.hreb} unit="m" />
              <ResultCard label="Délka hřebene" value={res.hrebenDel} unit="m" />
              {res.narozni && <ResultCard label="Nárožní krokev" value={res.narozni} unit="m" highlight />}
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
