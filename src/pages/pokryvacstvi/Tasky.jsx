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

export default function Tasky() {
  const { getPlocha, sklon } = useRoofStore()
  const [krytina, setKrytina] = useState('bobrovka')
  const [presah,  setPresah]  = useState(5)

  const plochaSt = getPlocha()
  const k = getKrytina(krytina)
  const sklarovani = k && sklon < k.minSklon

  const res = useMemo(() => {
    const p   = plochaSt
    const pct = 1 + parseFloat(presah) / 100

    if (!k) return null

    if (k.ks_m2 === null) {
      const celkem = p * pct
      return {
        isPloche: true,
        celkemM2: formatNum(celkem),
        plocha: formatNum(p),
        vaha: formatNum(celkem * k.vaha),
        poznamka: k.poznamka ?? '',
      }
    }

    const pocet  = Math.ceil(p * k.ks_m2 * pct)
    const palety = Math.ceil(pocet / 200)
    return {
      isPloche: false,
      pocet,
      palety,
      ks_m2: k.ks_m2,
      rozted: k.rozted ? k.rozted.min + '–' + k.rozted.max : '—',
      plocha: formatNum(p),
      vaha: formatNum(pocet * (k.vaha / k.ks_m2)),
    }
  }, [plochaSt, krytina, presah, k])

  return (
    <div>
      <PageHeader title="Spotřeba krytiny" description="Výpočet počtu tašek nebo plochy střešní krytiny" icon={Layers} />
      <SyncBanner label="Plocha střechy počítána z půdorysu střechy" />
      {sklarovani && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
          Upozornění: Sklon střechy ({sklon}°) je pod minimálním doporučeným sklonem pro tuto krytinu ({k.minSklon}°).
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Rozvinutá plocha střechy" value={res?.plocha ?? '—'} onChange={() => {}} unit="m²" hint="Počítáno z půdorysu — upravte tam" />
            <SelectField label="Typ krytiny" value={krytina} onChange={setKrytina} options={krytinyOptions()} grouped />
            <InputField label="Přirážka na odpad a řezy" value={presah} onChange={setPresah} unit="%" min={3} max={20} />
          </div>
        </CalcCard>
        <CalcCard title="Výsledky">
          {res?.isPloche ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Celkem plocha" value={res.celkemM2} unit="m²" highlight />
                <ResultCard label="Orientační hmotnost" value={res.vaha} unit="kg" />
              </div>
              {res.poznamka && (
                <p className="text-xs mt-1" style={{ color: '#a07850' }}>{res.poznamka}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Tašky na 1 m²" value={res?.ks_m2} unit="ks/m²" />
              <ResultCard label="Rozteč latí" value={res?.rozted} unit="mm" />
              <ResultCard label="Celkový počet tašek" value={res?.pocet?.toLocaleString('cs-CZ')} unit="ks" highlight />
              <ResultCard label="Palety (200 ks/paleta)" value={res?.palety} unit="pal" />
              <ResultCard label="Orientační hmotnost" value={res?.vaha} unit="kg" />
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
