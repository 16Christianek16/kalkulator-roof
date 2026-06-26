import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import SyncBanner from '../../components/ui/SyncBanner'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'

const SVG_W = 560
const SVG_H = 340

function PohledSVG({ typ, sirka, sklon, presahOkap, vyskaZdi }) {
  const s   = parseFloat(sirka)     || 8
  const α   = parseFloat(sklon)     || 35
  const po  = parseFloat(presahOkap) || 0.6
  const hz  = parseFloat(vyskaZdi)  || 3
  const rad = α * Math.PI / 180
  const hh  = (s / 2) * Math.tan(rad)
  const isPult = typ === 'pultova'

  const totalW = s + 2 * po
  const totalH = hz + hh + po * Math.tan(rad) + 0.3
  const ML = 75, MR = 30, MT = 30, MB = 55
  const availW = SVG_W - ML - MR
  const availH = SVG_H - MT - MB
  const scale  = Math.min(availW / totalW, availH / totalH)
  const groundY = MT + totalH * scale

  const sc = (rx, ry) => [ML + rx * scale, groundY - ry * scale]

  const wallLx = po
  const wallRx = po + s
  const eDrop  = po * Math.tan(rad)

  const [eLx, eLy] = sc(0,            hz - eDrop)
  const [wLx, wLy] = sc(wallLx,       hz)
  const [wRx, wRy] = sc(wallRx,       hz)
  const [eRx, eRy] = sc(po + s + po,  hz - eDrop)

  const ridgeX = ML + (po + s / 2) * scale
  const ridgeY = isPult
    ? groundY - (hz + s * Math.tan(rad)) * scale
    : groundY - (hz + hh) * scale

  const roofPts = isPult
    ? `${eLx},${eLy} ${wLx},${wLy} ${ridgeX},${ridgeY} ${eRx},${eRy}`
    : `${eLx},${eLy} ${ridgeX},${ridgeY} ${eRx},${eRy}`

  const [gLx, gLy] = sc(wallLx, 0)
  const [gRx, gRy] = sc(wallRx, 0)

  const dimColor = 'var(--text2)'
  const AS = 6
  const arw = (x, y, dir) => {
    if (dir === 'l') return `M${x},${y} l${AS},${-AS/2} l0,${AS}Z`
    if (dir === 'r') return `M${x},${y} l${-AS},${-AS/2} l0,${AS}Z`
    if (dir === 'u') return `M${x},${y} l${-AS/2},${AS} l${AS},0Z`
    if (dir === 'd') return `M${x},${y} l${-AS/2},${-AS} l${AS},0Z`
  }

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
      <rect x={ML} y={MT} width={SVG_W-ML-MR} height={groundY-MT} fill="#fdf6e3" />

      {/* Stěny */}
      <rect x={wLx-4} y={wLy} width={8} height={gLy-wLy} fill="#c4a07a" stroke="#1e40af" strokeWidth={1} />
      <rect x={wRx-4} y={wRy} width={8} height={gRy-wRy} fill="#c4a07a" stroke="#1e40af" strokeWidth={1} />

      {/* Zem */}
      <rect x={ML-20} y={groundY} width={SVG_W-ML-MR+40} height={SVG_H-groundY} fill="#b8966a" opacity={0.6} />
      <line x1={ML-20} y1={groundY} x2={SVG_W-MR+20} y2={groundY} stroke="#7c4a1a" strokeWidth={2} />

      {/* Střecha */}
      <polygon points={roofPts} fill="#e8b866" stroke="none" />
      <polyline points={isPult
          ? `${eLx},${eLy} ${wLx},${wLy} ${ridgeX},${ridgeY} ${eRx},${eRy}`
          : `${eLx},${eLy} ${ridgeX},${ridgeY} ${eRx},${eRy}`}
        fill="none" stroke="#7c2d12" strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={ridgeX} cy={ridgeY} r={3} fill="#7c2d12" />

      {/* Přesahy — čárkovaně */}
      {po > 0 && <>
        <line x1={wLx} y1={wLy} x2={eLx} y2={eLy} stroke="#1e40af" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />
        <line x1={wRx} y1={wRy} x2={eRx} y2={eRy} stroke="#1e40af" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />
      </>}

      {/* Kóta: výška zdiva */}
      {(() => {
        const x = ML - 28
        return <g>
          <line x1={wLx-5} y1={groundY} x2={x+4} y2={groundY} stroke={dimColor} strokeWidth={0.8} />
          <line x1={wLx-5} y1={wLy}     x2={x+4} y2={wLy}     stroke={dimColor} strokeWidth={0.8} />
          <line x1={x} y1={groundY} x2={x} y2={wLy} stroke={dimColor} strokeWidth={1} />
          <path d={arw(x, groundY, 'd')} fill={dimColor} />
          <path d={arw(x, wLy, 'u')} fill={dimColor} />
          <text x={x-6} y={(groundY+wLy)/2} textAnchor="middle" fontSize={10} fill={dimColor} fontWeight="600"
            transform={`rotate(-90,${x-6},${(groundY+wLy)/2})`}>zdivo {hz.toFixed(1)} m</text>
        </g>
      })()}

      {/* Kóta: výška hřebene */}
      {!isPult && (() => {
        const x = ML - 56
        return <g>
          <line x1={wLx-5} y1={wLy}    x2={x+4} y2={wLy}    stroke={dimColor} strokeWidth={0.8} />
          <line x1={ridgeX-5} y1={ridgeY} x2={x+4} y2={ridgeY} stroke={dimColor} strokeWidth={0.8} />
          <line x1={x} y1={wLy} x2={x} y2={ridgeY} stroke={dimColor} strokeWidth={1} />
          <path d={arw(x, wLy, 'd')} fill={dimColor} />
          <path d={arw(x, ridgeY, 'u')} fill={dimColor} />
          <text x={x-6} y={(wLy+ridgeY)/2} textAnchor="middle" fontSize={10} fill={dimColor} fontWeight="600"
            transform={`rotate(-90,${x-6},${(wLy+ridgeY)/2})`}>hřeben {hh.toFixed(2)} m</text>
        </g>
      })()}

      {/* Kóta: šířka budovy */}
      {(() => {
        const y = groundY + 28
        return <g>
          <line x1={wLx} y1={groundY+6} x2={wLx} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={wRx} y1={groundY+6} x2={wRx} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={wLx} y1={y} x2={wRx} y2={y} stroke={dimColor} strokeWidth={1} />
          <path d={arw(wLx, y, 'r')} fill={dimColor} />
          <path d={arw(wRx, y, 'l')} fill={dimColor} />
          <text x={(wLx+wRx)/2} y={y+14} textAnchor="middle" fontSize={10} fill={dimColor} fontWeight="600">
            {s.toFixed(1)} m
          </text>
        </g>
      })()}

      {/* Kóta: přesah */}
      {po > 0 && (() => {
        const y = groundY + 28
        return <g>
          <line x1={eLx} y1={groundY+6} x2={eLx} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={wLx} y1={y} x2={eLx} y2={y} stroke={dimColor} strokeWidth={1} strokeDasharray="3 2" />
          <text x={(eLx+wLx)/2} y={y+14} textAnchor="middle" fontSize={9} fill={dimColor} fillOpacity={0.7}>
            ±{po.toFixed(1)} m
          </text>
        </g>
      })()}

      {/* Úhel sklonu */}
      {(() => {
        const r = Math.min(45, (wRx-wLx)/4)
        const ex = ridgeX - r * Math.cos(rad)
        const ey = wRy  - r * Math.sin(rad)
        return <g>
          <path d={`M${ridgeX},${wRy} A${r},${r} 0 0 1 ${ex},${ey}`}
            fill="none" stroke="#4a7c59" strokeWidth={1.5} />
          <text x={ridgeX - r - 22} y={wRy - r/2 - 2} fontSize={11} fill="#4a7c59" fontWeight="bold" textAnchor="middle">
            {α}°
          </text>
        </g>
      })()}

      <text x={SVG_W/2} y={SVG_H-8} textAnchor="middle" fontSize={10} fill={dimColor} fillOpacity={0.5}>
        {isPult ? 'Pultová' : 'Sedlová'} střecha — boční pohled (řez)
      </text>
    </svg>
  )
}

export default function Pohled() {
  const {
    typ, setTyp, sirka, sklon, setSklon,
    presahOkap, setPresahOkap, presahStit, setPresahStit,
    vyskaZdi, setVyskaZdi,
    getDelkaKrokve, getVyskaHrebene,
  } = useRoofStore()

  const res = useMemo(() => {
    const rad     = parseFloat(sklon) * Math.PI / 180
    const lk      = getDelkaKrokve()
    const hh      = getVyskaHrebene()
    const hCelk   = parseFloat(vyskaZdi) + hh
    const pct     = Math.tan(rad) * 100
    return {
      hh:     formatNum(hh),
      lk:     formatNum(lk - parseFloat(presahOkap)),
      lkPres: formatNum(lk),
      hCelk:  formatNum(hCelk),
      pct:    formatNum(pct, 1),
    }
  }, [sirka, sklon, presahOkap, vyskaZdi])

  return (
    <div>
      <PageHeader
        title="Pohled střechy"
        description="Boční řez střechou — sklon, přesahy a výšky"
        icon={Eye}
      />
      <SyncBanner to="/strechy/pudorys" label="Šířka a přesahy sdíleny s půdorysem střechy" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CalcCard title="Parametry střechy">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: 'var(--text2)' }}>Typ</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'sedlova', label: 'Sedlová' }, { id: 'pultova', label: 'Pultová' }].map(t => (
                  <button key={t.id} onClick={() => setTyp(t.id)}
                    className="py-2 px-3 rounded-lg text-sm font-medium transition-colors border"
                    style={typ === t.id
                      ? { background: 'var(--wood-dark)', color: '#fff', borderColor: 'var(--wood-dark)' }
                      : { background: '#fff', color: 'var(--text2)', borderColor: 'var(--cream3)' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <InputField label="Šířka budovy" value={sirka} onChange={() => {}} unit="m" hint="Nastavte v půdorysu ↑" />
            <InputField label="Výška zdiva" value={vyskaZdi} onChange={setVyskaZdi} unit="m" min={0} step={0.1} />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={5} max={75} step={1} />
            <InputField label="Přesah okapní" value={presahOkap} onChange={setPresahOkap} unit="m" min={0} step={0.1} />
            <InputField label="Přesah štítový" value={presahStit} onChange={setPresahStit} unit="m" min={0} step={0.1} />
          </div>
        </CalcCard>

        <div className="lg:col-span-2">
          <CalcCard title="Boční pohled (řez)">
            <div className="overflow-x-auto">
              <PohledSVG typ={typ} sirka={sirka} sklon={sklon}
                presahOkap={presahOkap} vyskaZdi={vyskaZdi} />
            </div>
          </CalcCard>
        </div>
      </div>

      <div className="mt-5">
        <CalcCard title="Vypočítané hodnoty">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <ResultCard label="Výška hřebene nad zdivem" value={res.hh} unit="m" highlight />
            <ResultCard label="Celková výška střechy" value={res.hCelk} unit="m" highlight />
            <ResultCard label="Délka krokve bez přesahu" value={res.lk} unit="m" />
            <ResultCard label="Délka krokve s přesahem" value={res.lkPres} unit="m" />
            <ResultCard label="Sklon v %" value={res.pct} unit="%" />
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
