import { useMemo, useEffect, useRef, useState } from 'react'
import { LayoutDashboard, FileDown, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import ZakazkaModal from '../../components/ui/ZakazkaModal'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'
import { exportRoofPdf } from '../../utils/pdfExport'
import { parseRoofCsv } from '../../utils/csvImport'

const TYPY = [
  { id: 'sedlova',     skupinaCs: 'Základní', skupinaEn: 'Basic' },
  { id: 'valbova',     skupinaCs: 'Základní', skupinaEn: 'Basic' },
  { id: 'pultova',     skupinaCs: 'Základní', skupinaEn: 'Basic' },
  { id: 'stanova',     skupinaCs: 'Základní', skupinaEn: 'Basic' },
  { id: 'mansardova',  skupinaCs: 'Složené',  skupinaEn: 'Compound' },
  { id: 'pulvalbova',  skupinaCs: 'Složené',  skupinaEn: 'Compound' },
  { id: 'asymetricka', skupinaCs: 'Složené',  skupinaEn: 'Compound' },
  { id: 'pilova',      skupinaCs: 'Složené',  skupinaEn: 'Compound' },
]

const SVG_W = 560
const SVG_H = 340
const ML = 90, MT = 40, MR = 40, MB = 65

function PudorysSVG({ typ, sirka, delka, presahOkap, presahStit, roztecKrokvi }) {
  const s   = parseFloat(sirka)      || 8
  const d   = parseFloat(delka)      || 12
  const po  = parseFloat(presahOkap) || 0
  const ps  = parseFloat(presahStit) || 0
  const roz = parseFloat(roztecKrokvi) / 1000 || 0.9

  const totalW = s + 2 * po
  const totalL = d + 2 * ps

  const availW = SVG_W - ML - MR
  const availH = SVG_H - MT - MB
  const scale  = Math.min(availW / totalL, availH / totalW)

  const drawL = totalL * scale
  const drawW = totalW * scale
  const ox = ML + (availW - drawL) / 2
  const oy = MT + (availH - drawW) / 2

  const bx  = ox + ps * scale
  const by  = oy + po * scale
  const bx2 = bx + d * scale
  const by2 = by + s * scale
  const ry  = oy + (totalW / 2) * scale
  const cx  = ox + drawL / 2

  const nMezery = Math.max(1, Math.round(d / roz))
  const nKrokvi = nMezery + 1
  const skutRoz = d / nMezery
  const showAll = nKrokvi <= 60
  const krokveX = Array.from({ length: nKrokvi }, (_, i) => bx + i * skutRoz * scale)

  const dimColor = '#7a5030'
  const AS = 6
  const arw = (x, y, dir) => {
    if (dir === 'l') return `M${x},${y} l${AS},${-AS/2} l0,${AS}Z`
    if (dir === 'r') return `M${x},${y} l${-AS},${-AS/2} l0,${AS}Z`
    if (dir === 'u') return `M${x},${y} l${-AS/2},${AS} l${AS},0Z`
    if (dir === 'd') return `M${x},${y} l${-AS/2},${-AS} l${AS},0Z`
  }

  // Hřeben pozice dle typu
  let rx1, rx2
  switch (typ) {
    case 'sedlova':     rx1 = bx;  rx2 = bx2; break
    case 'asymetricka': rx1 = bx;  rx2 = bx2; break
    case 'valbova':     rx1 = bx + (s / 2) * scale; rx2 = bx2 - (s / 2) * scale; break
    case 'pulvalbova':  rx1 = bx + (s / 4) * scale; rx2 = bx2 - (s / 4) * scale; break
    case 'stanova':     rx1 = cx; rx2 = cx; break
    case 'mansardova':  rx1 = bx; rx2 = bx2; break
    case 'pultova':     rx1 = null; rx2 = null; break
    case 'pilova':      rx1 = null; rx2 = null; break
    default:            rx1 = bx;  rx2 = bx2
  }

  // Nárožní linie
  const hasNarozi = ['valbova', 'stanova', 'pulvalbova'].includes(typ)
  const hasDiag   = ['sedlova', 'asymetricka', 'mansardova'].includes(typ)

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
      <rect x={ox} y={oy} width={drawL} height={drawW}
        fill="#f5e0b0" stroke="#92400e" strokeWidth={2} rx={1} />

      {(po > 0 || ps > 0) && (
        <rect x={bx} y={by} width={d * scale} height={s * scale}
          fill="none" stroke="#92400e" strokeWidth={1.2} strokeDasharray="6 3" />
      )}

      {/* Pilová střecha — zuby */}
      {typ === 'pilova' && Array.from({ length: Math.max(2, Math.round(d / (s / 2))) }, (_, i) => {
        const segW = (d / Math.max(2, Math.round(d / (s / 2)))) * scale
        const x1 = bx + i * segW
        const x2 = x1 + segW
        return (
          <g key={i}>
            <line x1={x2} y1={by} x2={x1} y2={by2} stroke="#7c2d12" strokeWidth={1.5} />
            <line x1={x2} y1={by2} x2={x2} y2={by} stroke="#92400e" strokeWidth={1} strokeOpacity={0.5} />
          </g>
        )
      })}

      {/* Mansardová — vnitřní linie */}
      {typ === 'mansardova' && (
        <>
          <rect x={bx + (s * 0.3) * scale} y={by + (s * 0.3) * scale}
            width={(d - s * 0.6) * scale} height={(s * 0.4) * scale}
            fill="#f0c880" stroke="#7c2d12" strokeWidth={1.5} />
        </>
      )}

      {/* Krokve */}
      {showAll ? krokveX.map((x, i) => (
        <line key={i} x1={x} y1={oy} x2={x} y2={oy + drawW}
          stroke={i === 0 || i === nKrokvi - 1 ? '#7c2d12' : '#b45309'}
          strokeWidth={i === 0 || i === nKrokvi - 1 ? 1.8 : 1}
          strokeOpacity={0.8} />
      )) : (
        <>
          {[0, 1, 2, Math.floor(nKrokvi/2)-1, Math.floor(nKrokvi/2), Math.floor(nKrokvi/2)+1, nKrokvi-3, nKrokvi-2, nKrokvi-1]
            .filter((v, i, a) => v >= 0 && v < nKrokvi && a.indexOf(v) === i)
            .map(i => (
              <line key={i} x1={bx + i * skutRoz * scale} y1={oy}
                x2={bx + i * skutRoz * scale} y2={oy + drawW}
                stroke="#b45309" strokeWidth={1} strokeOpacity={0.6} />
            ))}
          <text x={cx} y={ry - 8} textAnchor="middle" fontSize={9} fill="#b45309" fillOpacity={0.8}>
            ... ({nKrokvi} krokví) ...
          </text>
        </>
      )}

      {/* Hřeben */}
      {rx1 !== null && rx2 !== null && rx1 < rx2 && (
        <line x1={rx1} y1={ry} x2={rx2} y2={ry}
          stroke="#7c2d12" strokeWidth={3} strokeLinecap="round" />
      )}
      {typ === 'stanova' && (
        <circle cx={cx} cy={ry} r={4} fill="#7c2d12" />
      )}

      {/* Nárožní linie */}
      {hasNarozi && (
        <>
          <line x1={ox}       y1={oy}       x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox}       y1={oy+drawW} x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox+drawL} y1={oy}       x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1.5} />
        </>
      )}

      {hasDiag && (
        <>
          <line x1={ox} y1={oy}       x2={rx1 ?? cx} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox} y1={oy+drawW} x2={rx1 ?? cx} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox+drawL} y1={oy}       x2={rx2 ?? cx} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2 ?? cx} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
        </>
      )}

      {/* Asymetrická — jiný sklon */}
      {typ === 'asymetricka' && (
        <line x1={rx1} y1={ry} x2={rx2} y2={ry + drawW * 0.15}
          stroke="#7c2d12" strokeWidth={2} strokeDasharray="6 3" />
      )}

      {/* Kóty — délka dole */}
      {(() => {
        const y = oy + drawW + 28
        return <g>
          <line x1={ox} y1={oy+drawW+6} x2={ox} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox+drawL} y1={oy+drawW+6} x2={ox+drawL} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox} y1={y} x2={ox+drawL} y2={y} stroke={dimColor} strokeWidth={1} />
          <path d={arw(ox, y, 'r')} fill={dimColor} />
          <path d={arw(ox+drawL, y, 'l')} fill={dimColor} />
          <text x={cx} y={y+14} textAnchor="middle" fontSize={11} fill={dimColor} fontWeight="600">
            délka {(d+2*ps).toFixed(2)} m{ps>0?` (bud. ${d} m)`:''}
          </text>
        </g>
      })()}

      {/* Kóty — šířka vlevo */}
      {(() => {
        const x = ox - 28
        return <g>
          <line x1={ox-6} y1={oy} x2={x+4} y2={oy} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox-6} y1={oy+drawW} x2={x+4} y2={oy+drawW} stroke={dimColor} strokeWidth={0.8} />
          <line x1={x} y1={oy} x2={x} y2={oy+drawW} stroke={dimColor} strokeWidth={1} />
          <path d={arw(x, oy, 'd')} fill={dimColor} />
          <path d={arw(x, oy+drawW, 'u')} fill={dimColor} />
          <text x={x-6} y={oy+drawW/2} textAnchor="middle" fontSize={11} fill={dimColor} fontWeight="600"
            transform={`rotate(-90,${x-6},${oy+drawW/2})`}>
            šířka {(s+2*po).toFixed(2)} m{po>0?` (bud. ${s} m)`:''}
          </text>
        </g>
      })()}

      {showAll && nKrokvi >= 2 && (() => {
        const x1 = bx
        const x2 = bx + skutRoz * scale
        const y  = oy - 12
        return <g>
          <line x1={x1} y1={y} x2={x2} y2={y} stroke="#b45309" strokeWidth={1} />
          <path d={arw(x1, y, 'r')} fill="#b45309" />
          <path d={arw(x2, y, 'l')} fill="#b45309" />
          <text x={(x1+x2)/2} y={y-4} textAnchor="middle" fontSize={9} fill="#b45309">
            {Math.round(skutRoz*1000)} mm
          </text>
        </g>
      })()}
    </svg>
  )
}

export default function Pudorys() {
  const { t } = useTranslation()
  const {
    typ, setTyp, sirka, setSirka, delka, setDelka,
    presahOkap, setPresahOkap, presahStit, setPresahStit,
    sklon, setSklon, vyskaZdi,
    roztecKrokvi, setRoztecKrokvi,
    getPlocha, getPocetKrokvi, getSkutecnaRozted,
  } = useRoofStore()

  const [showModal, setShowModal] = useState(false)
  const [csvError, setCsvError] = useState('')
  const isMounted = useRef(false)
  const lastShown = useRef(null)
  const csvRef = useRef()

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    const key = JSON.stringify({ sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi })
    if (key === lastShown.current) return
    const t2 = setTimeout(() => { lastShown.current = key; setShowModal(true) }, 1500)
    return () => clearTimeout(t2)
  }, [sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi])

  const res = useMemo(() => {
    const s  = parseFloat(sirka)      || 0
    const d  = parseFloat(delka)      || 0
    const po = parseFloat(presahOkap) || 0
    const ps = parseFloat(presahStit) || 0
    const plocha  = getPlocha()
    const n       = getPocetKrokvi()
    const skutRoz = getSkutecnaRozted()
    const plocha2D = (s + 2*po) * (d + 2*ps)
    const obvod    = 2 * ((s + 2*po) + (d + 2*ps))
    const varovani = roztecKrokvi < 600 || roztecKrokvi > 1200
    return { plocha: formatNum(plocha), plocha2D: formatNum(plocha2D), obvod: formatNum(obvod), n, skutRoz: Math.round(skutRoz), varovani }
  }, [sirka, delka, presahOkap, presahStit, roztecKrokvi])

  const handleCsvImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = parseRoofCsv(ev.target.result)
        if (data.sirka)      setSirka(data.sirka)
        if (data.delka)      setDelka(data.delka)
        if (data.sklon)      setSklon(data.sklon)
        if (data.presahOkap) setPresahOkap(data.presahOkap)
        if (data.presahStit) setPresahStit(data.presahStit)
        if (data.roztecKrokvi) setRoztecKrokvi(data.roztecKrokvi)
        setCsvError('')
      } catch (err) {
        setCsvError('Chyba v CSV souboru: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportPdf = () => {
    exportRoofPdf({ typ, sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi, res })
  }

  // Skupiny typů střech
  const skupiny = [...new Set(TYPY.map(t => t.skupinaCs))]

  return (
    <div>
      <PageHeader
        title={t('nav.pudorys')}
        description="Pohled na střechu shora — tvar, rozměry, přesahy a rozmístění krokví"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CalcCard title={t('roof.typLabel')}>
          <div className="flex flex-col gap-4">

            {/* Typ střechy — skupiny */}
            {skupiny.map(sk => (
              <div key={sk}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>{sk}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TYPY.filter(t => t.skupinaCs === sk).map(rt => (
                    <button key={rt.id} onClick={() => setTyp(rt.id)}
                      className="py-2 px-2 rounded-lg text-xs font-medium transition-colors border text-left"
                      style={typ === rt.id
                        ? { background: '#3b2008', color: '#fff', borderColor: '#3b2008' }
                        : { background: '#fffaf4', color: '#7a5030', borderColor: '#d4b896' }}>
                      {t(`roof.${rt.id}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <InputField label={t('roof.sirka')} value={sirka} onChange={setSirka} unit="m" min={2} step={0.5} hint="Kratší rozměr" />
            <InputField label={t('roof.delka')} value={delka} onChange={setDelka} unit="m" min={2} step={0.5} hint="Delší rozměr" />
            <InputField label={t('roof.presahOkap')} value={presahOkap} onChange={setPresahOkap} unit="m" min={0} step={0.1} />
            <InputField label={t('roof.presahStit')} value={presahStit} onChange={setPresahStit} unit="m" min={0} step={0.1} />
            <div>
              <InputField label={t('roof.roztecKrokvi')} value={roztecKrokvi} onChange={setRoztecKrokvi} unit="mm" min={400} max={1500} step={50}
                hint="Doporučeno 700–1000 mm (ČSN 73 1702)" />
              {res.varovani && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#c05020' }}>
                  ⚠ Rozteč mimo doporučený rozsah 600–1200 mm
                </p>
              )}
            </div>

            {/* CSV Import / PDF Export */}
            <div className="flex gap-2 pt-1">
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              <button onClick={() => csvRef.current.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1"
                style={{ borderColor: '#d4b896', color: '#7a5030', background: '#fffaf4' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5e0b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fffaf4'}>
                <Upload size={13} />
                {t('common.importCsv')}
              </button>
              <button onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1"
                style={{ borderColor: '#d4b896', color: '#7a5030', background: '#fffaf4' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5e0b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fffaf4'}>
                <FileDown size={13} />
                {t('common.exportPdf')}
              </button>
            </div>
            {csvError && <p className="text-xs" style={{ color: '#dc2626' }}>{csvError}</p>}
          </div>
        </CalcCard>

        <div className="lg:col-span-2">
          <CalcCard title="Půdorys střechy">
            <div className="overflow-x-auto">
              <PudorysSVG typ={typ} sirka={sirka} delka={delka}
                presahOkap={presahOkap} presahStit={presahStit}
                roztecKrokvi={roztecKrokvi} />
            </div>
          </CalcCard>
        </div>
      </div>

      <div className="mt-5">
        <CalcCard title="Výsledky a přehled krokví">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <ResultCard label={t('roof.plocha')} value={res.plocha} unit="m²" highlight />
            <ResultCard label={t('roof.plocha2D')} value={res.plocha2D} unit="m²" />
            <ResultCard label={t('roof.obvod')} value={res.obvod} unit="m" />
            <ResultCard label={t('roof.pocetKrokvi')} value={res.n} unit="ks" highlight />
            <ResultCard label={t('roof.skutecnaRozted')} value={res.skutRoz} unit="mm" />
          </div>
          <p className="mt-3 text-xs" style={{ color: '#a07850' }}>
            Parametry jsou sdíleny se všemi výpočetními sekcemi. Změna zde se projeví v{' '}
            <Link to="/strechy/pohled" className="underline">pohledu střechy</Link>,{' '}
            <Link to="/tesarstvi/krokve" className="underline">dimenzování krokví</Link>,{' '}
            <Link to="/geometrie/plocha" className="underline">ploše střechy</Link> a dalších.
          </p>
        </CalcCard>
      </div>

      {showModal && (
        <ZakazkaModal
          params={{ typ, sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi, vyskaZdi }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
