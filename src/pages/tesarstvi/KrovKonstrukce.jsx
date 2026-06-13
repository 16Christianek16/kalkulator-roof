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
import { deg2rad, vyskaHrebene, formatNum } from '../../utils/calculations'
import { exportKrovPdf } from '../../utils/pdfExport'

const RoofPreview3D = lazy(() => import('../../components/ui/RoofPreview3D'))

// ─── Konstanty ───────────────────────────────────────────────────────────────
const TYPY_KROVU = [
  { value: 'krokevni',       label: 'Prostý krov (krokevní)' },
  { value: 'vaznicova-stoj', label: 'Vaznicový krov — stojatá stolice' },
  { value: 'vaznicova-lez',  label: 'Vaznicový krov — ležatá stolice' },
  { value: 'hambalkovy',     label: 'Hambalkový krov' },
  { value: 'valbovy',        label: 'Valbová střecha' },
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

const LEGENDA = [
  { color: '#2e1005', label: 'Vrcholová vaznice' },
  { color: '#4a2008', label: 'Pozednice' },
  { color: '#6b3010', label: 'Středová vaznice' },
  { color: '#a05020', label: 'Krokve' },
  { color: '#d08840', label: 'Kleštiny' },
]

// Výchozí průřez krokve dle délky
function defaultPrurezKrokve(delka_m) {
  if (delka_m <= 3.0) return { b: 80,  h: 160 }
  if (delka_m <= 4.0) return { b: 100, h: 180 }
  return                      { b: 120, h: 200 }
}

// Formáty
const fmtKc = (v) => Math.round(v).toLocaleString('cs-CZ') + ' Kč'
const fmtM3 = (v) => formatNum(v, 3) + ' m³'

// ─── Výpočty základních parametrů (bez m³ — ty se počítají z průřezu) ────────
function pocitej({ sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu }) {
  const s   = Math.max(parseFloat(sirka) || 8, 2)
  const d   = Math.max(parseFloat(delka) || 12, 2)
  const sl  = Math.max(5, Math.min(parseFloat(sklon) || 35, 75))
  const po  = Math.max(parseFloat(presahOkap) || 0.5, 0)
  const roz = Math.max(0.4, (parseFloat(roztecKrokvi) || 900) / 1000)

  const slRad  = deg2rad(sl)
  const lKrokve = (s / 2) / Math.cos(slRad) + po
  const pr      = defaultPrurezKrokve(lKrokve)
  const nKrokvi = Math.ceil(d / roz) * 2

  const hasVaznice  = typKrovu === 'vaznicova-stoj' || typKrovu === 'vaznicova-lez'
  const hasHambalek = typKrovu === 'hambalkovy'

  const lKlest  = s * 0.6
  const nKlest  = hasHambalek ? Math.ceil(nKrokvi / 2) : 0
  const nHreben = hasVaznice ? 1 : 0
  const nStred  = hasVaznice ? 2 : 0

  // Vždy všech 5 prvků — pocet=0 pokud nejsou v tomto typu krovu
  const prvky = [
    { prvek: 'Krokve',             b: pr.b, h: pr.h, delka: lKrokve, pocet: nKrokvi },
    { prvek: 'Pozednice',          b: 120,  h: 120,  delka: d,       pocet: 2 },
    { prvek: 'Vrcholová vaznice',  b: 140,  h: 200,  delka: d,       pocet: nHreben },
    { prvek: 'Středová vaznice',   b: 120,  h: 180,  delka: d,       pocet: nStred },
    { prvek: 'Kleštiny',           b: 60,   h: 160,  delka: lKlest,  pocet: nKlest },
  ]

  const spojmat = [
    { name: 'Hřebíky 200 mm',    pocet: nKrokvi * 4 },
    { name: 'Tesařské úhelníky', pocet: nKrokvi * 2 },
    { name: 'Šrouby M12',        pocet: (nHreben + nStred + 2) * 4 },
  ]

  return { s, d, sl, lKrokve: formatNum(lKrokve), nKrokvi, prvky, spojmat }
}

// ─── Input pro průřez (b × h) ─────────────────────────────────────────────────
function PrurezInput({ b, h, onChange }) {
  const style = {
    width: 52, padding: '2px 4px', fontSize: 12, fontFamily: 'monospace',
    border: '1px solid #d1d5db', borderRadius: 4, textAlign: 'center',
    background: '#f8fafc', color: '#0f172a',
  }
  return (
    <div className="flex items-center gap-1">
      <input type="number" value={b} min={30} max={300} step={10} style={style}
        onChange={e => onChange(parseInt(e.target.value) || b, h)} />
      <span style={{ fontSize: 11, color: '#94a3b8' }}>×</span>
      <input type="number" value={h} min={60} max={400} step={10} style={style}
        onChange={e => onChange(b, parseInt(e.target.value) || h)} />
      <span style={{ fontSize: 11, color: '#64748b' }}>mm</span>
    </div>
  )
}

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

  // Přepsání průřezů uživatelem: { 'Krokve': { b: 100, h: 180 }, ... }
  const [prurezMap, setPrurezMap] = useState({})

  const base = useMemo(() =>
    pocitej({ sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu }),
    [sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu]
  )

  // Řádky tabulky s aplikovanými přepsanými průřezy
  const tableRows = useMemo(() => {
    const cena = parseFloat(cenaReziva) || 7500
    return base.prvky.map(p => {
      const ov = prurezMap[p.prvek]
      const b  = ov?.b ?? p.b
      const h  = ov?.h ?? p.h
      const m3 = p.pocet * p.delka * (b / 1000) * (h / 1000)
      return { ...p, b, h, m3, kc: m3 * cena }
    })
  }, [base.prvky, prurezMap, cenaReziva])

  // Součty (živé — reagují na změny průřezu)
  const totals = useMemo(() => {
    const cena    = parseFloat(cenaReziva) || 7500
    const rawM3   = tableRows.reduce((s, r) => s + r.m3, 0)
    const volTotal = rawM3 * 1.12
    const cenaRez  = volTotal * cena
    const cenaSpoj = cenaRez * 0.08
    const bezDPH   = cenaRez + cenaSpoj
    const sDPH     = bezDPH * 1.21
    return {
      volTotal: fmtM3(volTotal),
      cenaRez:  fmtKc(cenaRez),
      cenaSpoj: fmtKc(cenaSpoj),
      bezDPH:   fmtKc(bezDPH),
      sDPH:     fmtKc(sDPH),
      // pro PDF
      _volTotal: volTotal, _cenaRez: cenaRez, _cenaSpoj: cenaSpoj,
      _bezDPH: bezDPH, _sDPH: sDPH,
    }
  }, [tableRows, cenaReziva])

  const updatePrurez = (prvek, b, h) => {
    setPrurezMap(prev => ({ ...prev, [prvek]: { b, h } }))
  }

  const handlePdf = () => {
    exportKrovPdf({
      sirka, delka, sklon, presahOkap, roztecKrokvi,
      typKrovu: TYPY_KROVU.find(t => t.value === typKrovu)?.label || typKrovu,
      drevina:  DREVINY.find(d => d.value === drevina)?.label || drevina,
      trida, cenaReziva,
      res: {
        prvky: tableRows,
        volTotal: totals.volTotal, cenaRez: totals.cenaRez,
        cenaSpoj: totals.cenaSpoj, bezDPH: totals.bezDPH, sDPH: totals.sDPH,
      },
    })
  }

  const handleAddToOffer = () => {
    setAddedMsg(true)
    setTimeout(() => setAddedMsg(false), 3000)
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

            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: '#fff7ed', color: '#92400e' }}>
              <span>Výška hřebene:</span>
              <strong>{formatNum(vyskaHrebene(parseFloat(sirka) || 8, parseFloat(sklon) || 35))} m</strong>
            </div>
          </div>
        </CalcCard>

        {/* Výsledky */}
        <div className="flex flex-col gap-4">
          <CalcCard title="Navržený průřez krokve">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl font-bold" style={{ color: '#3b2008' }}>
                {(() => { const r = tableRows[0]; return `${r.b} × ${r.h} mm` })()}
              </span>
              <span className="text-sm" style={{ color: '#a07850' }}>délka krokve: {base.lKrokve} m</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#a07850' }}>
              Počet krokví: <strong>{base.nKrokvi} ks</strong> · {TYPY_KROVU.find(t => t.value === typKrovu)?.label}
            </p>
          </CalcCard>

          <CalcCard title="Cenový souhrn">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Celkem řezivo" value={totals.volTotal} highlight />
              <ResultCard label="Cena řeziva" value={totals.cenaRez} highlight />
              <ResultCard label="Spoj. materiál (~8 %)" value={totals.cenaSpoj} />
              <ResultCard label="CELKEM bez DPH" value={totals.bezDPH} />
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>CELKEM s DPH 21 %</p>
              <p className="text-2xl font-bold text-white">{totals.sDPH}</p>
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              Ceny jsou orientační včetně 12 % odpadu. Nezahrnují montáž ani jeřáb.
            </p>
          </CalcCard>

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

      {/* ── Výkaz výměr ── */}
      <div className="mt-5">
        <CalcCard title="Výkaz výměr — přehled prvků">
          <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
            Průřez (šířka × výška) lze přepsat ručně — objem a cena se přepočítají automaticky.
            Prvky s počtem 0 nejsou v aktuálním typu krovu použity.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Prvek', 'Průřez (mm)', 'Délka (m)', 'Počet (ks)', 'Objem (m³)', 'Cena (Kč)'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.8)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => {
                  const inactive = row.pocet === 0
                  const rowBg = inactive ? '#f8fafc' : (i % 2 === 0 ? '#fff' : '#f8fafc')
                  return (
                    <tr key={row.prvek} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', opacity: inactive ? 0.45 : 1 }}>
                      <td className="px-3 py-2.5 font-medium" style={{ color: '#0f172a' }}>
                        {row.prvek}
                        {inactive && <span className="ml-1.5 text-xs font-normal" style={{ color: '#94a3b8' }}>(není v tomto typu)</span>}
                      </td>
                      <td className="px-3 py-2">
                        <PrurezInput
                          b={row.b} h={row.h}
                          onChange={(b, h) => updatePrurez(row.prvek, b, h)}
                        />
                      </td>
                      <td className="px-3 py-2.5" style={{ color: '#475569' }}>{formatNum(row.delka)}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: '#0f172a' }}>{row.pocet}</td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#475569' }}>
                        {formatNum(row.m3, 3)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: inactive ? '#94a3b8' : '#f97316' }}>
                        {Math.round(row.kc).toLocaleString('cs-CZ')}
                      </td>
                    </tr>
                  )
                })}
                {/* Součtový řádek */}
                <tr style={{ background: '#fff7ed', borderTop: '2px solid #fed7aa' }}>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: '#92400e' }} colSpan={3}>
                    Celkem + 12 % přídavek na odpad a řezy
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: '#92400e' }}>
                    {tableRows.reduce((s, r) => s + r.pocet, 0)} ks
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: '#92400e' }}>
                    {totals.volTotal}
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold" style={{ color: '#f97316' }}>
                    {totals.cenaRez}
                  </td>
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
              {base.spojmat.map((polozka, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: '#f1f5f9', color: '#334155' }}>
                  <span>{polozka.name}:</span>
                  <strong>{polozka.pocet} ks</strong>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: '#fff7ed', color: '#92400e' }}>
                <span>Orientační cena:</span>
                <strong>{totals.cenaSpoj}</strong>
              </div>
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
            Výpočet je orientační dle ČSN 73 1702. Nosné konstrukce vždy ověřte se statikem.
          </p>
        </CalcCard>
      </div>

      {/* ── 3D vizualizace ── */}
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
          {!show3d ? (
            <div className="flex items-center justify-center rounded-xl py-10" style={{ background: '#f8fafc', color: '#94a3b8' }}>
              <div className="text-center">
                <div className="text-3xl mb-2">🏗</div>
                <p className="text-sm font-medium">Klikněte na "Zobrazit 3D" pro interaktivní náhled krovu</p>
                <p className="text-xs mt-1">Táhni · kolečko myši pro zoom</p>
              </div>
            </div>
          ) : (
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
              <div className="mt-3 flex flex-wrap gap-3">
                {LEGENDA.map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: '#475569' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
