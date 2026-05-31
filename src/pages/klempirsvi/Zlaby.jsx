import { useState, useMemo } from 'react'
import { Wrench } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import SelectField from '../../components/ui/SelectField'
import ResultCard from '../../components/ui/ResultCard'
import { pruTokDeste, formatNum } from '../../utils/calculations'

export default function Zlaby() {
  const [plocha, setPlocha] = useState(80)
  const [delkaZlabu, setDelkaZlabu] = useState(10)
  const [typZlabu, setTypZlabu] = useState('125')
  const [sklon, setSklon] = useState(3)

  const zlabyDB = {
    '100': { prumer: 100, kapacita: 0.8 },
    '125': { prumer: 125, kapacita: 1.3 },
    '150': { prumer: 150, kapacita: 2.0 },
    '200': { prumer: 200, kapacita: 3.5 },
  }

  const res = useMemo(() => {
    const Q = pruTokDeste({ plocha_m2: parseFloat(plocha) })
    const zlab = zlabyDB[typZlabu]
    const pocetSvodu = Math.ceil(Q / zlab.kapacita)
    const roztesSvodu = parseFloat(delkaZlabu) / pocetSvodu
    const haki = Math.ceil(parseFloat(delkaZlabu) / 0.6)
    const poklesSklonMm = (parseFloat(delkaZlabu) * parseFloat(sklon)) / 1000

    return {
      Q: formatNum(Q, 3),
      pocetSvodu,
      roztesSvodu: formatNum(roztesSvodu, 1),
      haki,
      pokles: formatNum(poklesSklonMm, 0),
      kapacita: zlab.kapacita,
      vyhovi: Q <= zlab.kapacita * pocetSvodu,
    }
  }, [plocha, delkaZlabu, typZlabu, sklon])

  return (
    <div>
      <PageHeader title="Žlaby a svody" description="Dimenzování okapových žlabů a svodů" icon={Wrench} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalcCard title="Parametry">
          <div className="flex flex-col gap-4">
            <InputField label="Odvodňovaná plocha střechy" value={plocha} onChange={setPlocha} unit="m²" />
            <InputField label="Délka žlabu" value={delkaZlabu} onChange={setDelkaZlabu} unit="m" />
            <SelectField label="Průměr žlabu" value={typZlabu} onChange={setTypZlabu} options={[
              { value: '100', label: 'Ø 100 mm — kap. 0.8 l/s' },
              { value: '125', label: 'Ø 125 mm — kap. 1.3 l/s (nejčastější)' },
              { value: '150', label: 'Ø 150 mm — kap. 2.0 l/s' },
              { value: '200', label: 'Ø 200 mm — kap. 3.5 l/s' },
            ]} />
            <InputField label="Spád žlabu" value={sklon} onChange={setSklon} unit="mm/m" hint="Doporučeno 3–5 mm/m" />
          </div>
        </CalcCard>
        <div className="flex flex-col gap-4">
          <CalcCard title="Výsledky">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Výpočtový průtok Q" value={res.Q} unit="l/s" />
              <ResultCard label="Počet svodů" value={res.pocetSvodu} unit="ks" highlight />
              <ResultCard label="Rozteč svodů" value={res.roztesSvodu} unit="m" />
              <ResultCard label="Háky žlabu" value={res.haki} unit="ks" />
              <ResultCard label="Pokles žlabu" value={res.pokles} unit="mm" />
            </div>
          </CalcCard>
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${res.vyhovi ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {res.vyhovi ? '✓ Dimenzování vyhovuje' : '✗ Žlab nevyhovuje — zvětšete průměr nebo přidejte svody'}
          </div>
        </div>
      </div>
    </div>
  )
}
