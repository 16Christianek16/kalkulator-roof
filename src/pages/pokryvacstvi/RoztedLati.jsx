import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'
import { krytinyOptions, getKrytina } from '../../data/krytiny'

const krytinyProRozted = () => {
  return krytinyOptions().map(group => ({
    ...group,
    items: group.items.filter(k => k.rozted !== null),
  })).filter(group => group.items.length > 0)
}

export default function RoztedLati() {
  const { sklon, setSklon, getDelkaKrokve } = useRoofStore()
  const [typ, setTyp] = useState('palena_drsnata')

  const delkaKrokve = getDelkaKrokve()
  const k = getKrytina(typ)
  const sklarovani = k && sklon < k.minSklon

  const res = useMemo(() => {
    const l  = delkaKrokve * 1000
    if (!k || !k.rozted) return {
      rozted: '—', pocetLati: '—', delkaKrokve: formatNum(delkaKrokve), rozted_sku: '—',
    }
    const sk = parseFloat(sklon)
    const slonovyKoef = sk < 22 ? 0.9 : sk > 45 ? 1.05 : 1.0
    const rozted = Math.round(Math.min(k.rozted.max, Math.max(k.rozted.min, k.rozted.min * slonovyKoef)))
    const pocetLati = Math.ceil(l / rozted) + 1
    const rozted_sku = l / (pocetLati - 1)
    return {
      rozted,
      pocetLati,
      delkaKrokve: formatNum(delkaKrokve),
      rozted_sku: formatNum(rozted_sku, 1),
    }
  }, [delkaKrokve, typ, sklon, k])

  return (
    <div>
      <PageHeader title="Rozteč latí" description="Výpočet rozteče střešních latí podle typu krytiny a sklonu" icon={Layers} />
      <SyncBanner label="Délka krokve a sklon sdíleny s půdorysem střechy" />
      {sklarovani && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #f59e0b' }}>
          Upozornění: Sklon střechy ({sklon}°) je pod minimálním doporučeným sklonem pro tuto krytinu ({k.minSklon}°).
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Délka krokve s přesahem" value={res.delkaKrokve} onChange={() => {}} unit="m" hint="Počítáno z půdorysu — upravte tam" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" />
            <SelectField label="Typ krytiny" value={typ} onChange={setTyp} options={krytinyProRozted()} grouped />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Doporučená rozteč" value={res.rozted} unit="mm" highlight />
            <ResultCard label="Skutečná rozteč" value={res.rozted_sku} unit="mm" />
            <ResultCard label="Počet latí na krokev" value={res.pocetLati} unit="ks" highlight />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
