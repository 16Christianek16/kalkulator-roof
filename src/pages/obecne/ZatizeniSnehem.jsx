import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { zatizeniSnehem, formatNum } from '../../utils/calculations'

export default function ZatizeniSnehem() {
  const [snehovaPas, setSnehovaPas] = useState('II')
  const [sklon, setSklon] = useState(35)
  const [nadmorska, setNadmorska] = useState(300)

  const res = useMemo(() => {
    const s = zatizeniSnehem({ snehovaPas, sklon_deg: parseFloat(sklon), nadmorskaNadmorska: parseFloat(nadmorska) })
    const celkem = s * 1.5
    return {
      s: formatNum(s, 2),
      celkem: formatNum(celkem, 2),
    }
  }, [snehovaPas, sklon, nadmorska])

  const snehovePasy = [
    { value: 'I', label: 'I — nížiny ČR (sk = 0.7 kN/m²)' },
    { value: 'II', label: 'II — pahorkatiny (sk = 1.0 kN/m²)' },
    { value: 'III', label: 'III — vrchoviny (sk = 1.5 kN/m²)' },
    { value: 'IV', label: 'IV — podhorské oblasti (sk = 2.0 kN/m²)' },
    { value: 'V', label: 'V — horské oblasti (sk = 2.5 kN/m²)' },
    { value: 'VI', label: 'VI — Šumava, Krkonoše (sk = 3.0 kN/m²)' },
    { value: 'VII', label: 'VII — Vysočina (sk = 4.0 kN/m²)' },
    { value: 'VIII', label: 'VIII — nejvyšší polohy (sk = 5.0 kN/m²)' },
  ]

  return (
    <div>
      <PageHeader title="Zatížení sněhem" description="Orientační výpočet dle ČSN EN 1991-1-3" icon={Calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry lokality a střechy">
          <div className="flex flex-col gap-4">
            <SelectField label="Sněhová oblast" value={snehovaPas} onChange={setSnehovaPas} options={snehovePasy} />
            <InputField label="Sklon střechy" value={sklon} onChange={setSklon} unit="°" min={0} max={90} />
            <InputField label="Nadmořská výška" value={nadmorska} onChange={setNadmorska} unit="m n.m." hint="Korekce pro výšky > 400 m n.m." />
          </div>
        </CalcCard>
        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledné zatížení">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Charakteristické zatížení sněhem" value={res.s} unit="kN/m²" highlight />
              <ResultCard label="Návrhové zatížení (γ=1.5)" value={res.celkem} unit="kN/m²" />
            </div>
            <p className="text-xs text-slate-400 mt-4">Výpočet je orientační. Pro statický návrh použijte aktuální mapu sněhových oblastí dle ČSN EN 1991-1-3 a konzultujte statika.</p>
          </CalcCard>

          <CalcCard title="Přibližná mapa sněhových oblastí ČR">
            <div className="text-sm text-slate-600 space-y-1.5">
              <p><strong>Oblast I:</strong> Nížiny (Praha, Brno, Olomouc)</p>
              <p><strong>Oblast II:</strong> Pahorkatiny (Plzeň, Hradec Králové)</p>
              <p><strong>Oblast III:</strong> Vrchoviny (Jihlava, Zlín)</p>
              <p><strong>Oblast IV–V:</strong> Podhorské a horské oblasti</p>
              <p><strong>Oblast VI–VIII:</strong> Šumava, Krkonoše, Jeseníky</p>
            </div>
          </CalcCard>
        </div>
      </div>
    </div>
  )
}
