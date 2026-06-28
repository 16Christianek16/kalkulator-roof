import { useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import {
  delkaKrokve, pocetTasekKrytiny, pocetHrebenacu, pocetKrajovychTasek, pocetVetracichTasek,
  delkaSnehovychZabran, delkaOkapu, delkaSvodu, pocetKolenSvodu, pocetKotliku,
  delkaOkapnice, delkaUzlabi, delkaHrebenovehoPlechu, delkaOplechovani, formatNum,
} from '../../utils/calculations'
import { getKrytina, krytinyOptions } from '../../data/krytiny'

function StatRow({ dot, label, value, unit }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 rounded-full" style={{ width: 7, height: 7, background: dot }} />
        <span className="text-xs truncate" style={{ color: 'var(--text2)' }}>{label}</span>
      </div>
      <span className="text-xs font-bold shrink-0 font-mono" style={{ color: 'var(--text)' }}>
        {value}{unit ? <span className="font-normal" style={{ color: 'var(--text3)' }}> {unit}</span> : null}
      </span>
    </div>
  )
}

function Section({ title, bg, fg, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--cream3)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 font-condensed font-bold uppercase transition-colors"
        style={{ fontSize: 10.5, letterSpacing: '0.08em', background: bg, color: fg }}>
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div className="px-2.5 py-1.5 bg-white">{children}</div>}
    </div>
  )
}

export default function RightPanelVypocty({
  plocha, delka, sirka, sklon, presahStit, vyskaZdi, krytina, rezerva = 10,
  pocetUzlabi = 0, onSetKrytina,
}) {
  const [search, setSearch] = useState('')
  const d  = parseFloat(delka) || 12
  const s  = parseFloat(sirka) || 8
  const ps = parseFloat(presahStit) || 0
  const wH = parseFloat(vyskaZdi) || 2.8
  const p  = parseFloat(plocha) || 0

  const krokevM = delkaKrokve(s, sklon)
  const info = getKrytina(krytina)
  const ksM2 = info?.ks_m2 ?? null

  const pocetTasek   = ksM2 ? pocetTasekKrytiny(p, ksM2, rezerva) : null
  const hrebenace    = pocetHrebenacu(d)
  const krajove      = pocetKrajovychTasek(krokevM)
  const vetrane      = pocetVetracichTasek(p)
  const snehZabrany  = delkaSnehovychZabran(d, ps)
  const okapy        = delkaOkapu(d, ps)
  const svody        = delkaSvodu(wH)
  const kolena       = pocetKolenSvodu()
  const kotliky       = pocetKotliku()
  const okapnice     = delkaOkapnice(d, ps)
  const uzlabi       = delkaUzlabi(krokevM, pocetUzlabi)
  const hreben       = delkaHrebenovehoPlechu(d)
  const oplechovani  = delkaOplechovani(krokevM)

  const knihovnaItems = krytinyOptions()
    .flatMap(g => g.items)
    .filter(k => !search || k.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-3" style={{ background: 'var(--cream)' }}>
      <Section title="Výpočty" bg="var(--cream2)" fg="var(--text2)">
        <StatRow dot="var(--amber)" label="Celková plocha" value={formatNum(p)} unit="m²" />
        <StatRow dot="var(--amber)" label="Počet tašek" value={pocetTasek != null ? pocetTasek : '—'} unit={pocetTasek != null ? 'ks' : ''} />
        <StatRow dot="var(--amber)" label="Hřebenáče" value={hrebenace} unit="ks" />
        <StatRow dot="var(--amber)" label="Krajové tašky" value={krajove} unit="ks" />
        <StatRow dot="var(--amber)" label="Větrací tašky" value={vetrane} unit="ks" />
        <StatRow dot="var(--text3)" label="Sněhové zábrany" value={formatNum(snehZabrany, 1)} unit="m" />
      </Section>

      <Section title="Okapy & svody" bg="rgba(212,137,26,0.14)" fg="var(--text2)">
        <StatRow dot="var(--amber)" label="Okapy" value={formatNum(okapy, 1)} unit="m" />
        <StatRow dot="var(--amber)" label="Svody" value={formatNum(svody, 1)} unit="m" />
        <StatRow dot="var(--amber)" label="Kolena" value={kolena} unit="ks" />
        <StatRow dot="var(--amber)" label="Kotlíky" value={kotliky} unit="ks" />
      </Section>

      <Section title="Klempířské prvky" bg="rgba(160,57,43,0.12)" fg="var(--red-tile)">
        <StatRow dot="var(--red-tile)" label="Okapnice" value={formatNum(okapnice, 1)} unit="m" />
        <StatRow dot="var(--red-tile)" label="Úžlabí" value={formatNum(uzlabi, 1)} unit="m" />
        <StatRow dot="var(--red-tile)" label="Hřeben" value={formatNum(hreben, 1)} unit="m" />
        <StatRow dot="var(--red-tile)" label="Oplechování" value={formatNum(oplechovani, 1)} unit="m" />
      </Section>

      <Section title="Knihovna" bg="var(--cream2)" fg="var(--text2)" defaultOpen={false}>
        <div className="input-wrap mb-2">
          <Search size={13} className="ml-2" style={{ color: 'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat krytinu…"
            className="flex-1 px-2 py-1.5 text-xs bg-transparent focus:outline-none" style={{ color: 'var(--text)' }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {knihovnaItems.map(k => (
            <button key={k.value} onClick={() => onSetKrytina?.(k.value)}
              className="rounded-lg border p-2 text-left transition-colors"
              style={{
                borderColor: krytina === k.value ? 'var(--amber)' : 'var(--cream3)',
                background: krytina === k.value ? 'rgba(212,137,26,0.08)' : '#fff',
              }}>
              <span className="block text-[10.5px] font-medium leading-tight" style={{ color: 'var(--text2)' }}>{k.label}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}
