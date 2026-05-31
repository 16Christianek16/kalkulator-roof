import { useMemo, useEffect, useRef, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import ZakazkaModal from '../../components/ui/ZakazkaModal'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'

const TYPY = [
  { id: 'sedlova', label: 'Sedlová' },
  { id: 'valbova', label: 'Valbová' },
  { id: 'pultova', label: 'Pultová' },
  { id: 'stanova', label: 'Stanová' },
]

const SVG_W = 560
const SVG_H = 340
const ML = 90, MT = 40, MR = 40, MB = 65

function PudorysSVG({ typ, sirka, delka, presahOkap, presahStit, roztecKrokvi }) {
  const s   = parseFloat(sirka)     || 8
  const d   = parseFloat(delka)     || 12
  const po  = parseFloat(presahOkap) || 0
  const ps  = parseFloat(presahStit) || 0
  const roz = parseFloat(roztecKrokvi) / 1000 || 0.9  // m

  const totalW = s + 2 * po   // y osa
  const totalL = d + 2 * ps   // x osa

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

  const rx1 = typ === 'sedlova' ? bx  : typ === 'valbova' ? bx + (s / 2) * scale : cx
  const rx2 = typ === 'sedlova' ? bx2 : typ === 'valbova' ? bx2 - (s / 2) * scale : cx

  // Krokve — pozice podél délky
  const nMezery  = Math.max(1, Math.round(d / roz))
  const nKrokvi  = nMezery + 1
  const skutRoz  = d / nMezery  // m
  const showAll  = nKrokvi <= 60

  const krokveX = Array.from({ length: nKrokvi }, (_, i) => bx + (i * skutRoz) * scale)

  const dimColor = '#7a5030'
  const AS = 6
  const arw = (x, y, dir) => {
    if (dir === 'l') return `M${x},${y} l${AS},${-AS/2} l0,${AS}Z`
    if (dir === 'r') return `M${x},${y} l${-AS},${-AS/2} l0,${AS}Z`
    if (dir === 'u') return `M${x},${y} l${-AS/2},${AS} l${AS},0Z`
    if (dir === 'd') return `M${x},${y} l${-AS/2},${-AS} l${AS},0Z`
  }

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
      {/* Plocha střechy */}
      <rect x={ox} y={oy} width={drawL} height={drawW}
        fill="#f5e0b0" stroke="#92400e" strokeWidth={2} rx={1} />

      {/* Obrys budovy */}
      {(po > 0 || ps > 0) && (
        <rect x={bx} y={by} width={d * scale} height={s * scale}
          fill="none" stroke="#92400e" strokeWidth={1.2} strokeDasharray="6 3" />
      )}

      {/* Krokve */}
      {showAll ? krokveX.map((x, i) => (
        <line key={i} x1={x} y1={oy} x2={x} y2={oy + drawW}
          stroke={i === 0 || i === nKrokvi - 1 ? '#7c2d12' : '#b45309'}
          strokeWidth={i === 0 || i === nKrokvi - 1 ? 1.8 : 1}
          strokeOpacity={0.8} />
      )) : (
        // Příliš mnoho krokví — zobraz jen první, poslední a několik prostředních
        <>
          {[0, 1, 2, Math.floor(nKrokvi/2)-1, Math.floor(nKrokvi/2), Math.floor(nKrokvi/2)+1, nKrokvi-3, nKrokvi-2, nKrokvi-1]
            .filter((v, i, a) => v >= 0 && v < nKrokvi && a.indexOf(v) === i)
            .map(i => (
              <line key={i} x1={bx + (i * skutRoz) * scale} y1={oy}
                x2={bx + (i * skutRoz) * scale} y2={oy + drawW}
                stroke="#b45309" strokeWidth={1} strokeOpacity={0.6} />
            ))}
          <text x={cx} y={ry - 8} textAnchor="middle" fontSize={9} fill="#b45309" fillOpacity={0.8}>
            ... ({nKrokvi} krokví) ...
          </text>
        </>
      )}

      {/* Hřeben */}
      {(typ === 'sedlova' || typ === 'valbova') && rx1 < rx2 && (
        <line x1={rx1} y1={ry} x2={rx2} y2={ry}
          stroke="#7c2d12" strokeWidth={3} strokeLinecap="round" />
      )}

      {/* Nárožní linie */}
      {(typ === 'valbova' || typ === 'stanova') && (
        <>
          <line x1={ox}       y1={oy}       x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox}       y1={oy+drawW} x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox+drawL} y1={oy}       x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1.5} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1.5} />
        </>
      )}

      {/* Sedlová — diagonální linie */}
      {typ === 'sedlova' && (
        <>
          <line x1={ox} y1={oy}       x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox} y1={oy+drawW} x2={rx1} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox+drawL} y1={oy}       x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2} y2={ry} stroke="#92400e" strokeWidth={1} strokeOpacity={0.4} />
        </>
      )}

      {/* KÓTY */}
      {/* Délka — dole */}
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

      {/* Šířka — vlevo */}
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

      {/* Rozteč krokví — popis */}
      {showAll && nKrokvi >= 2 && (() => {
        const i = 0
        const x1 = bx + i * skutRoz * scale
        const x2 = bx + (i+1) * skutRoz * scale
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

      <text x={SVG_W/2} y={SVG_H-6} textAnchor="middle" fontSize={10} fill={dimColor} fillOpacity={0.5}>
        {TYPY.find(t=>t.id===typ)?.label} střecha — půdorys
      </text>
    </svg>
  )
}

export default function Pudorys() {
  const {
    typ, setTyp, sirka, setSirka, delka, setDelka,
    presahOkap, setPresahOkap, presahStit, setPresahStit,
    sklon, setSklon, vyskaZdi,
    roztecKrokvi, setRoztecKrokvi,
    getPlocha, getPocetKrokvi, getSkutecnaRozted,
  } = useRoofStore()

  const [showModal, setShowModal] = useState(false)
  const isMounted = useRef(false)
  const lastShown = useRef(null)

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    const key = JSON.stringify({ sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi })
    if (key === lastShown.current) return
    const t = setTimeout(() => { lastShown.current = key; setShowModal(true) }, 1500)
    return () => clearTimeout(t)
  }, [sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi])

  const res = useMemo(() => {
    const s  = parseFloat(sirka)      || 0
    const d  = parseFloat(delka)      || 0
    const po = parseFloat(presahOkap) || 0
    const ps = parseFloat(presahStit) || 0
    const roz = parseFloat(roztecKrokvi) / 1000 || 0.9
    const plocha = getPlocha()
    const n = getPocetKrokvi()
    const skutRoz = getSkutecnaRozted()
    const plocha2D = (s + 2*po) * (d + 2*ps)
    const obvod = 2 * ((s + 2*po) + (d + 2*ps))
    const varovani = roztecKrokvi < 600 || roztecKrokvi > 1200
    return {
      plocha: formatNum(plocha),
      plocha2D: formatNum(plocha2D),
      obvod: formatNum(obvod),
      n,
      skutRoz: Math.round(skutRoz),
      varovani,
    }
  }, [sirka, delka, presahOkap, presahStit, roztecKrokvi])

  return (
    <div>
      <PageHeader
        title="Půdorys střechy"
        description="Pohled na střechu shora — tvar, rozměry, přesahy a rozmístění krokví"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CalcCard title="Parametry střechy">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: '#7a5030' }}>
                Typ střechy
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TYPY.map(t => (
                  <button key={t.id} onClick={() => setTyp(t.id)}
                    className="py-2 px-3 rounded-lg text-sm font-medium transition-colors border"
                    style={typ === t.id
                      ? { background: '#3b2008', color: '#fff', borderColor: '#3b2008' }
                      : { background: '#fffaf4', color: '#7a5030', borderColor: '#d4b896' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <InputField label="Šířka budovy" value={sirka} onChange={setSirka} unit="m" min={2} step={0.5} hint="Kratší rozměr" />
            <InputField label="Délka budovy" value={delka} onChange={setDelka} unit="m" min={2} step={0.5} hint="Delší rozměr" />
            <InputField label="Přesah okapní" value={presahOkap} onChange={setPresahOkap} unit="m" min={0} step={0.1} hint="Přesah ve směru šířky" />
            <InputField label="Přesah štítový" value={presahStit} onChange={setPresahStit} unit="m" min={0} step={0.1} hint="Přesah ve směru délky" />

            <div>
              <InputField label="Rozteč krokví" value={roztecKrokvi} onChange={setRoztecKrokvi} unit="mm" min={400} max={1500} step={50}
                hint="Doporučeno 700–1000 mm (ČSN 73 1702)" />
              {res.varovani && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#c05020' }}>
                  ⚠ Rozteč mimo doporučený rozsah 600–1200 mm
                </p>
              )}
            </div>
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
            <ResultCard label="Rozvinutá plocha střechy" value={res.plocha} unit="m²" highlight />
            <ResultCard label="Půdorysná plocha střechy" value={res.plocha2D} unit="m²" />
            <ResultCard label="Obvod střechy" value={res.obvod} unit="m" />
            <ResultCard label="Počet krokví" value={res.n} unit="ks" highlight />
            <ResultCard label="Skutečná rozteč" value={res.skutRoz} unit="mm" />
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
