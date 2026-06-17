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
  const [krytina,  setKrytina]  = useState('bobrovka')
  const [pokládka, setPokládka] = useState(null)   // null = první možnost z pokládky[]
  const [presah,   setPresah]   = useState(5)

  const plochaSt = getPlocha()
  const k = getKrytina(krytina)
  const sklarovani = k && sklon < k.minSklon

  // Aktivní konfigurace pokládky (buď vybraná, nebo výchozí z krytiny)
  const aktivniPokládka = k?.pokládky
    ? k.pokládky.find(p => p.value === pokládka) ?? k.pokládky[0]
    : null
  const ks_m2_aktivni = aktivniPokládka?.ks_m2 ?? k?.ks_m2
  const rozted_aktivni = aktivniPokládka?.rozted ?? k?.rozted

  const handleKrytinaChange = (val) => {
    setKrytina(val)
    setPokládka(null)  // reset pokládky při změně krytiny
  }

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

    const ks = ks_m2_aktivni
    const pocet  = Math.ceil(p * ks * pct)
    const palety = Math.ceil(pocet / 200)
    const roztedStr = rozted_aktivni ? rozted_aktivni.min + '–' + rozted_aktivni.max : '—'
    return {
      isPloche: false,
      pocet,
      palety,
      ks_m2: ks,
      rozted: roztedStr,
      plocha: formatNum(p),
      vaha: formatNum(pocet * (k.vaha / k.ks_m2)),
    }
  }, [plochaSt, krytina, pokládka, presah, k, ks_m2_aktivni, rozted_aktivni])

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
            <SelectField label="Typ krytiny" value={krytina} onChange={handleKrytinaChange} options={krytinyOptions()} grouped />
            {k?.pokládky && (
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Typ pokládky</p>
                <div className="flex gap-2 flex-wrap">
                  {k.pokládky.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPokládka(p.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
                      style={
                        (pokládka === p.value || (!pokládka && k.pokládky[0].value === p.value))
                          ? { background: '#0f172a', color: '#fff', borderColor: '#0f172a' }
                          : { background: '#fff', color: '#475569', borderColor: '#e2e8f0' }
                      }
                    >
                      {p.label}
                      <span className="ml-1 opacity-70">· {p.ks_m2} ks/m²</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: '#94a3b8' }}>
                  Korunové = dvě vrstvy (lepší těsnost, více materiálu). Jednoduché = jedna vrstva.
                </p>
              </div>
            )}
            {k?.image && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <img
                  src={k.image}
                  alt={k.label}
                  style={{ width: 88, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>{k.label}</span>
                  <span className="text-xs" style={{ color: '#64748b' }}>Min. sklon: {k.minSklon}° · Hmotnost: {k.vaha} kg/m²</span>
                  {k.poznamka && <span className="text-xs" style={{ color: '#94a3b8' }}>{k.poznamka}</span>}
                  {k.url && (
                    <a href={k.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: '#f97316' }}>
                      Detail na satjam.cz →
                    </a>
                  )}
                </div>
              </div>
            )}
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
