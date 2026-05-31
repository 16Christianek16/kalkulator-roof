import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import { slopeDegToPercent, slopeDegToRatio, slopePercentToDeg, formatNum } from '../../utils/calculations'

export default function Sklon() {
  const [deg, setDeg] = useState(35)
  const [pct, setPct] = useState(70)

  const fromDeg = useMemo(() => {
    const d = parseFloat(deg)
    return { pct: formatNum(slopeDegToPercent(d), 1), ratio: formatNum(slopeDegToRatio(d), 2) }
  }, [deg])

  const fromPct = useMemo(() => {
    const p = parseFloat(pct)
    return { deg: formatNum(slopePercentToDeg(p), 2) }
  }, [pct])

  return (
    <div>
      <PageHeader title="Sklon střechy" description="Převod mezi stupni, procenty a poměrem" icon={Calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Ze stupňů (°) na % a poměr">
          <div className="flex flex-col gap-4">
            <InputField label="Sklon ve stupních" value={deg} onChange={setDeg} unit="°" min={1} max={89} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <ResultCard label="Sklon v %" value={fromDeg.pct} unit="%" highlight />
              <ResultCard label="Poměr 1 : X" value={`1 : ${fromDeg.ratio}`} />
            </div>
          </div>
        </CalcCard>
        <CalcCard title="Z procent (%) na stupně">
          <div className="flex flex-col gap-4">
            <InputField label="Sklon v procentech" value={pct} onChange={setPct} unit="%" min={1} max={1000} />
            <div className="grid grid-cols-1 gap-3 mt-2">
              <ResultCard label="Sklon ve stupních" value={fromPct.deg} unit="°" highlight />
            </div>
          </div>
        </CalcCard>

        <CalcCard title="Orientační tabulka sklonů">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-600 font-medium">Stupně (°)</th>
                  <th className="text-left py-2 text-slate-600 font-medium">Procenta (%)</th>
                  <th className="text-left py-2 text-slate-600 font-medium">Typ střechy</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [5, 'Plochá střecha'],
                  [10, 'Mírný sklon'],
                  [20, 'Standardní'],
                  [25, 'Standardní'],
                  [30, 'Strmá'],
                  [35, 'Strmá'],
                  [45, 'Velmi strmá'],
                  [60, 'Mansardová'],
                ].map(([d, label]) => (
                  <tr key={d} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 font-mono">{d}°</td>
                    <td className="py-2 font-mono">{formatNum(slopeDegToPercent(d), 1)} %</td>
                    <td className="py-2 text-slate-500">{label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CalcCard>
      </div>
    </div>
  )
}
