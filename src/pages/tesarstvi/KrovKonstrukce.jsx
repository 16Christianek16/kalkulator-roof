import { useState, useMemo, lazy, Suspense } from 'react'
import { Hammer, FileDown, PlusCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import Preview3DErrorBoundary from '../../components/ui/Preview3DErrorBoundary'
import { useRoofStore } from '../../store/roofStore'
import { deg2rad, vyskaHrebene, delkaKrokve, formatNum } from '../../utils/calculations'
import { exportKrovPdf } from '../../utils/pdfExport'

const RoofPreview3D = lazy(() => import('../../components/ui/RoofPreview3D'))

// ─── Konstanty ───────────────────────────────────────────────────────────────
const TYPY_KROVU = [
  { value: 'krokevni',        label: 'Prostý krov (krokevní)' },
  { value: 'vaznicova-stoj',  label: 'Vaznicový krov — stojatá stolice' },
  { value: 'vaznicova-lez',   label: 'Vaznicový krov — ležatá stolice' },
  { value: 'hambalkovy',      label: 'Hambalkový krov' },
  { value: 'valbovy',         label: 'Valbová střecha' },
]

const DREVINY = [
  { value: 'smrk', label: 'Smrk (nejběžnější)' },
  { value: 'jedle', label: 'Jedle' },
  { value: 'dub',  label: 'Dub (odolnější)' },
]

const TRIDY = [
  { value: 'C16', label: 'C16' },
  { value: 'C24', label: 'C24 (doporučená)' },
]

// Průřez krokve dle délky
function prurezKrokve(delka_m) {
  if (delka_m <= 3.0)  return { b: 80,  h: 160, label: '80 × 160 mm' }
  if (delka_m <= 4.0)  return { b: 100, h: 180, label: '100 × 180 mm' }
  return                        { b: 120, h: 200, label: '120 × 200 mm' }
}

// Formát Kč
const fmtKc = (val) => Math.round(val).toLocaleString('cs-CZ') + ' Kč'
const fmtM3 = (val) => formatNum(val, 3) + ' m³'

// ─── Výpočty ─────────────────────────────────────────────────────────────────
function pocitej({ sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu, cenaReziva }) {
  const s   = Math.max(parseFloat(sirka) || 8, 2)
  const d   = Math.max(parseFloat(delka) || 12, 2)
  const sl  = Math.max(5, Math.min(parseFloat(sklon) || 35, 75))
  const po  = Math.max(parseFloat(presahOkap) || 0.5, 0)
  const roz = Math.max(0.4, (parseFloat(roztecKrokvi) || 900) / 1000)
  const cena = parseFloat(cenaReziva) || 7500

  const slRad = deg2rad(sl)
  const h = (s / 2) * Math.tan(slRad)

  // Krokve
  const lKrokve = (s / 2) / Math.cos(slRad) + po
  const pr      = prurezKrokve(lKrokve)
  const nKrokvi = Math.ceil(d / roz) * 2
  const volKrok = nKrokvi * lKrokve * (pr.b / 1000) * (pr.h / 1000)

  const hasVaznice  = typKrovu === 'vaznicova-stoj' || typKrovu === 'vaznicova-lez'
  const hasHambalek = typKrovu === 'hambalkovy'

  // Vaznice
  let volHreben = 0, volStredova = 0, volPozednice = 0
  let nHreben = 0, nStredova = 0, nPozednice = 0
  if (hasVaznice) {
    nHreben    = 1;  volHreben    = 1 * d * 0.140 * 0.200
    nStredova  = 2;  volStredova  = 2 * d * 0.120 * 0.180
    nPozednice = 2;  volPozednice = 2 * d * 0.120 * 0.120
  } else {
    // Pozednice vždy pro ostatní typy
    nPozednice = 2;  volPozednice = 2 * d * 0.120 * 0.120
  }

  // Kleštiny
  let nKlest = 0, lKlest = 0, volKlest = 0
  if (hasHambalek) {
    lKlest  = s * 0.6
    nKlest  = Math.ceil(nKrokvi / 2)
    volKlest = nKlest * lKlest * 0.060 * 0.160
  }

  // Celkový objem + odpad 12 %
  const volRaw   = volKrok + volHreben + volStredova + volPozednice + volKlest
  const volTotal = volRaw * 1.12
  const cenaRez  = volTotal * cena
  const cenaSpoj = cenaRez * 0.08
  const bezDPH   = cenaRez + cenaSpoj
  const sDPH     = bezDPH * 1.21

  // Tabulka prvků
  const prvky = [
    { prvek: 'Krokve',     prurez: pr.label,       delka: lKrokve, pocet: nKrokvi,   m3: volKrok,     kc: volKrok * cena },
  ]
  if (nPozednice > 0)
    prvky.push({ prvek: 'Pozednice', prurez: '120 × 120 mm', delka: d, pocet: nPozednice, m3: volPozednice, kc: volPozednice * cena })
  if (hasVaznice) {
    prvky.push({ prvek: 'Hřebenová vaznice', prurez: '140 × 200 mm', delka: d, pocet: nHreben, m3: volHreben, kc: volHreben * cena })
    prvky.push({ prvek: 'Středová vaznice',  prurez: '120 × 180 mm', delka: d, pocet: nStredova, m3: volStredova, kc: volStredova * cena })
  }
  if (hasHambalek)
    prvky.push({ prvek: 'Kleštiny', prurez: '60 × 160 mm', delka: lKlest, pocet: nKlest, m3: volKlest, kc: volKlest * cena })

  // Spojovací materiál (orientační kusovník)
  const spojmat = [
    { name: 'Hřebíky 200 mm',  pocet: nKrokvi * 4,     unit: 'ks' },
    { name: 'Tesařské úhelníky', pocet: nKrokvi * 2,   unit: 'ks' },
    { name: 'Šrouby M12',       pocet: (nHreben + nStredova + nPozednice) * 4, unit: 'ks' },
  ]

  return {
    s, d, sl, h,
    lKrokve: formatNum(lKrokve),
    prurez: pr.label,
    nKrokvi,
    volTotal: fmtM3(volTotal),
    cenaRez:  fmtKc(cenaRez),
    cenaSpoj: fmtKc(cenaSpoj),
    bezDPH:   fmtKc(bezDPH),
    sDPH:     fmtKc(sDPH),
    prvky,
    spojmat,
    // Pro PDF
    _volTotal: volTotal,
    _cenaRez:  cenaRez,
    _cenaSpoj: cenaSpoj,
    _bezDPH:   bezDPH,
    _sDPH:     sDPH,
  }
}

// ─── Legenda barev krovu ──────────────────────────────────────────────────────
const LEGENDA = [
  { color: '#2e1005', label: 'Hřebenová vaznice' },
  { color: '#4a2008', label: 'Pozednice' },
  { color: '#6b3010', label: 'Středová vaznice' },
  { color: '#a05020', label: 'Krokve' },
  { color: '#d08840', label: 'Kleštiny' },
]

// ─── Hlavní komponenta ────────────────────────────────────────────────────────
export default function KrovKonstrukce() {
  const { sirka, setSirka, delka, setDelka, sklon, setSklon,
          presahOkap, setPresahOkap, roztecKrokvi, setRoztecKrokvi,
          vyskaZdi, typ } = useRoofStore()

  const [typKrovu,   setTypKrovu]   = useState('krokevni')
  const [drevina,    setDrevina]    = useState('smrk')
  const [trida,      setTrida]      = useState('C24')
  const [cenaReziva, setCenaReziva] = useState(7500)
  const [show3d,     setShow3d]     = useState(false)
  const [addedMsg,   setAddedMsg]   = useState(false)

  const res = useMemo(() => pocitej({
    sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu, cenaReziva,
  }), [sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu, cenaReziva])

  const handlePdf = () => {
    exportKrovPdf({
      sirka, delka, sklon, presahOkap, roztecKrokvi,
      typKrovu: TYPY_KROVU.find(t => t.value === typKrovu)?.label || typKrovu,
      drevina:  DREVINY.find(d => d.value === drevina)?.label || drevina,
      trida,
      cenaReziva,
      res,
    })
  }

  const handleAddToOffer = () => {
    setAddedMsg(true)
    setTimeout(() => setAddedMsg(false), 3000)
    // TODO: integrate with zakázky store when ready
  }

  return (
    <div>
      <PageHeader
        title="Krov & konstrukce střechy"
        description="Výkaz výměr, dimenzování prvků a cenová kalkulace krovu dle ČSN 73 1702"
        icon={Hammer}
      />
      <SyncBanner />

      {/* ── Vstupy + výsledky ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Vstupní parametry */}
        <CalcCard title="Vstupní parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Šířka domu (půdorys)" value={sirka} onChange={setSirka} unit="m" min={2} max={30} step={0.5} hint="Synchronizováno s půdorysem" />
            <InputField label="Délka domu (půdorys)" value={delka} onChange={setDelka} unit="m" min={2} max={60} step={0.5} hint="Synchronizováno s půdorysem" />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={10} max={70} step={1} />
            <InputField label="Přesah okapnice" value={presahOkap} onChange={setPresahOkap} unit="m" min={0} max={1.5} step={0.05} />
            <InputField label="Rozteč krokví" value={roztecKrokvi} onChange={setRoztecKrokvi} unit="mm" min={400} max={1200} step={50} hint="Doporučeno 700–1 000 mm" />

            <div className="border-t pt-4" style={{ borderColor: '#e2e8f0' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>Krov & materiál</p>
              <div className="flex flex-col gap-4">
                <SelectField label="Typ krovu" value={typKrovu} onChange={setTypKrovu} options={TYPY_KROVU} />
                <SelectField label="Dřevina" value={drevina} onChange={setDrevina} options={DREVINY} />
                <SelectField label="Pevnostní třída" value={trida} onChange={setTrida} options={TRIDY} />
                <InputField label="Cena řeziva" value={cenaReziva} onChange={setCenaReziva} unit="Kč/m³" min={4000} max={20000} step={500} hint="Orientační tržní cena včetně dopravy" />
              </div>
            </div>

            {/* Info o výšce hřebene */}
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: '#fff7ed', color: '#92400e' }}>
              <span>Výška hřebene:</span>
              <strong>{formatNum(vyskaHrebene(parseFloat(sirka) || 8, parseFloat(sklon) || 35))} m</strong>
            </div>
          </div>
        </CalcCard>

        {/* Výsledky */}
        <div className="flex flex-col gap-4">
          {/* Hlavní karta */}
          <CalcCard title="Navržený průřez krokve">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl font-bold" style={{ color: '#3b2008' }}>{res.prurez}</span>
              <span className="text-sm" style={{ color: '#a07850' }}>délka krokve: {res.lKrokve} m</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#a07850' }}>
              Počet krokví: <strong>{res.nKrokvi} ks</strong> · Typ: {TYPY_KROVU.find(t => t.value === typKrovu)?.label}
            </p>
          </CalcCard>

          {/* Cenové souhrny */}
          <CalcCard title="Cenový souhrn">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Celkem řezivo" value={res.volTotal} highlight />
              <ResultCard label="Cena řeziva" value={res.cenaRez} highlight />
              <ResultCard label="Spoj. materiál (~8 %)" value={res.cenaSpoj} />
              <ResultCard label="CELKEM bez DPH" value={res.bezDPH} />
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>CELKEM s DPH 21 %</p>
              <p className="text-2xl font-bold text-white">{res.sDPH}</p>
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              Ceny jsou orientační včetně 12% odpadu. Nezahrnují montáž ani jeřáb.
            </p>
          </CalcCard>

          {/* Akce */}
          <div className="flex gap-2">
            <button onClick={handlePdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-colors"
              style={{ background: '#0f172a', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
              <FileDown size={15} /> Stáhnout PDF
            </button>
            <button onClick={handleAddToOffer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-colors"
              style={{ background: addedMsg ? '#15803d' : '#f97316', color: '#fff' }}>
              <PlusCircle size={15} /> {addedMsg ? '✓ Přidáno!' : 'Přidat do nabídky'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabulka prvků ── */}
      <div className="mt-5">
        <CalcCard title="Výkaz výměr — přehled prvků">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Prvek', 'Průřez', 'Délka (m)', 'Počet (ks)', 'Objem (m³)', 'Cena (Kč)'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.8)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.prvky.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: '#0f172a' }}>{p.prvek}</td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#475569' }}>{p.prurez}</td>
                    <td className="px-3 py-2.5" style={{ color: '#475569' }}>{formatNum(p.delka)}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#0f172a' }}>{p.pocet}</td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#475569' }}>{formatNum(p.m3, 3)}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#f97316' }}>
                      {Math.round(p.kc).toLocaleString('cs-CZ')}
                    </td>
                  </tr>
                ))}
                {/* Odpad řádek */}
                <tr style={{ background: '#fff7ed', borderBottom: '1px solid #e2e8f0' }}>
                  <td className="px-3 py-2 text-xs italic" style={{ color: '#a07850' }} colSpan={4}>+ 12 % přídavek na odpad a řezy</td>
                  <td className="px-3 py-2 text-xs font-medium" style={{ color: '#a07850' }}>{res.volTotal}</td>
                  <td className="px-3 py-2 text-xs font-medium" style={{ color: '#a07850' }}>{res.cenaRez}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Spojovací materiál */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>
              Orientační kusovník — spojovací materiál
            </p>
            <div className="flex flex-wrap gap-3">
              {res.spojmat.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: '#f1f5f9', color: '#334155' }}>
                  <span>{s.name}:</span>
                  <strong>{s.pocet} {s.unit}</strong>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: '#fff7ed', color: '#92400e' }}>
                <span>Orientační cena:</span>
                <strong>{res.cenaSpoj}</strong>
              </div>
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
            Výpočet je orientační dle ČSN 73 1702. Nosné konstrukce vždy ověřte se statikem.
            Spotřeba dřeva zahrnuje odpad 12 %. Ceny bez DPH.
          </p>
        </CalcCard>
      </div>

      {/* ── 3D vizualizace krovu ── */}
      <div className="mt-5">
        <CalcCard title={
          <div className="flex items-center justify-between w-full">
            <span>3D Vizualizace krovu</span>
            <button onClick={() => setShow3d(v => !v)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={show3d
                ? { background: '#f97316', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
              {show3d ? '▲ Skrýt' : '▼ Zobrazit 3D'}
            </button>
          </div>
        }>
          {!show3d && (
            <div className="flex items-center justify-center rounded-xl py-10" style={{ background: '#f8fafc', color: '#94a3b8' }}>
              <div className="text-center">
                <div className="text-3xl mb-2">🏗</div>
                <p className="text-sm font-medium">Klikněte na "Zobrazit 3D" pro interaktivní náhled krovu</p>
                <p className="text-xs mt-1">Klikni · táhni · kolečko myši pro zoom</p>
              </div>
            </div>
          )}
          {show3d && (
            <div>
              <Preview3DErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center rounded-xl" style={{ height: 420, background: '#f1f5f9' }}>
                    <div className="text-sm" style={{ color: '#94a3b8' }}>Načítám 3D náhled…</div>
                  </div>
                }>
                  <RoofPreview3D
                    typ={typ} sirka={sirka} delka={delka} sklon={sklon}
                    presahOkap={presahOkap} presahStit={0.4} vyskaZdi={vyskaZdi}
                    krytina="bobrovka" roztecKrokvi={roztecKrokvi}
                    defaultView="krov"
                  />
                </Suspense>
              </Preview3DErrorBoundary>

              {/* Legenda */}
              <div className="mt-3 flex flex-wrap gap-3">
                {LEGENDA.map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: '#475569' }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#94a3b8' }}>
                Typ krovu ve 3D: sedlová — pro ostatní typy klikněte na 🪵 Krov v 3D náhledu střechy.
              </p>
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
