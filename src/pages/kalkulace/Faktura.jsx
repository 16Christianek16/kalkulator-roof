import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, Plus, Trash2, Printer, Save, ArrowLeft, X } from 'lucide-react'
import QRCodeSVG from 'react-qr-code'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import { useAppStore } from '../../store/appStore'
import { formatNum } from '../../utils/calculations'
import { ucetNaIBAN, vytvorSPAYD, vsZCislaFaktury } from '../../utils/qrPlatba'

// --- helpers ---

const TODAY = () => new Date().toLocaleDateString('cs-CZ')
const DUE_DATE = () => {
  const d = new Date(); d.setDate(d.getDate() + 14)
  return d.toLocaleDateString('cs-CZ')
}

function nextCislo(typ, doklady) {
  const year = new Date().getFullYear()
  const prefix = typ === 'nabidka' ? 'NB' : 'FA'
  const n = doklady.filter(d => d.typ === typ).length + 1
  return `${prefix}-${year}-${String(n).padStart(3, '0')}`
}

function itemsFromZakazka(zakazka) {
  const c = zakazka.computed
  let id = 1
  const r = (popis, mnozstvi, jednotka) => ({ id: id++, popis, mnozstvi, jednotka, cena: 0 })
  const rows = []
  rows.push(r(`Tesářské práce — krokevní soustava (${c.prurezKrokve})`, c.pocetKrokvi, 'ks'))
  if (c.pocetLatiCelkem) rows.push(r(`Střešní latě (rozteč ${c.roztedLati} mm)`, c.pocetLatiCelkem, 'ks'))
  if (c.typKrytiny === 'tasky')
    rows.push(r(`Střešní krytina — ${zakazka.krytinaLabel}`, c.pocetTasek, 'ks'))
  else if (c.plochaMaterial)
    rows.push(r(`Střešní krytina — ${zakazka.krytinaLabel}`, Math.ceil(c.plochaMaterial), 'm²'))
  rows.push(r(`Fólie / parozábrana (role 1 500 × 50 m)`, c.foliePocetPasu, 'ks'))
  rows.push(r(`Pokrývačské práce — montáž krytiny`, parseFloat(formatNum(c.plocha).replace(',', '.')), 'm²'))
  rows.push(r(`Tesářské práce — osazení krokevní soustavy`, parseFloat(formatNum(c.plocha).replace(',', '.')), 'm²'))
  return rows
}

function newDoklad(typ, zakazka, dodavatel, doklady) {
  return {
    id: null,
    typ,
    cislo: nextCislo(typ, doklady),
    datum: TODAY(),
    datumSplatnosti: DUE_DATE(),
    zakazkaId: zakazka?.id ?? null,
    zakazka: zakazka ? { nazev: zakazka.nazev, zakaznik: zakazka.zakaznik } : null,
    dodavatel: { ...dodavatel },
    odberatel: { nazev: zakazka?.zakaznik ?? '', adresa: '', ico: '' },
    radky: zakazka ? itemsFromZakazka(zakazka) : [{ id: 1, popis: '', mnozstvi: 1, jednotka: 'm²', cena: 0 }],
    sazbaDP: 21,
    platceDph: true,
    poznamka: typ === 'nabidka' ? 'Platnost nabídky: 30 dní.' : '',
  }
}

// --- small UI ---

function InlineInput({ value, onChange, className = '', type = 'text', placeholder = '', right = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`print:hidden bg-transparent border-b focus:outline-none focus:border-amber-600 text-sm ${right ? 'text-right' : ''} ${className}`}
      style={{ borderColor: 'var(--cream3)', color: 'var(--wood-dark)', minWidth: 40 }}
    />
  )
}

function PrintVal({ children, className = '' }) {
  return <span className={`hidden print:inline ${className}`}>{children}</span>
}

const JEDNOTKY = ['ks', 'm²', 'bm', 'hod', 'kg', 'paušál']

// --- List view ---

function DokladRow({ d, onOpen, onDelete }) {
  const bezDph = d.radky.reduce((s, r) => s + parseFloat(r.mnozstvi || 0) * parseFloat(r.cena || 0), 0)
  const celkem = (d.platceDph ?? true) ? bezDph * (1 + d.sazbaDP / 100) : bezDph
  const isPending = bezDph === 0

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: '#e0e7ff' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.typ === 'nabidka' ? 'text-green-700' : 'bg-green-100 text-green-700'}`} style={d.typ === 'nabidka' ? { background: 'var(--cream2)', color: 'var(--text2)' } : undefined}>
            {d.typ === 'nabidka' ? 'Nabídka' : 'Faktura'}
          </span>
          <span className="font-semibold text-sm" style={{ color: 'var(--wood-dark)' }}>{d.cislo}</span>
          <span className="text-xs" style={{ color: '#64748b' }}>{d.datum}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
          {d.zakazka?.nazev && <span>{d.zakazka.nazev}</span>}
          {d.odberatel?.nazev && <span className="ml-2">· {d.odberatel.nazev}</span>}
          {!isPending && <span className="ml-2 font-semibold" style={{ color: 'var(--wood-dark)' }}>· {formatNum(celkem, 0)} Kč</span>}
          {isPending && <span className="ml-2 italic" style={{ color: '#3b82f6' }}>· ceny nevyplněny</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onOpen(d)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--wood-dark)', color: '#fff' }}>
          Otevřít
        </button>
        <button onClick={() => onDelete(d.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#3b82f6' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// --- Main component ---

export default function Faktura() {
  const location = useLocation()
  const navigate = useNavigate()
  const { zakazky, doklady, dodavatel: storedDodavatel, addDoklad, updateDoklad, deleteDoklad, saveDodavatel } = useAppStore()

  const [doc, setDoc] = useState(null)

  useEffect(() => {
    const state = location.state
    if (state?.zakazkaId) {
      const zakazka = zakazky.find(z => z.id === state.zakazkaId)
      if (zakazka) {
        setDoc(newDoklad(state.typ ?? 'nabidka', zakazka, storedDodavatel, doklady))
      }
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [])

  // ── Výpočty (bezpečné pro doc === null) ─────────────────────────────────────
  const platceDph  = doc?.platceDph ?? true
  const bezDph     = doc?.radky?.reduce((s, r) => s + parseFloat(r.mnozstvi || 0) * parseFloat(r.cena || 0), 0) ?? 0
  const dphCast    = platceDph ? bezDph * (doc?.sazbaDP ?? 0) / 100 : 0
  const celkemSDph = bezDph + dphCast

  // ── SPAYD pro QR — computed synchronně, žádný async state ──────────────────
  const spaydStr = useMemo(() => {
    if (!doc || doc.typ !== 'faktura' || celkemSDph <= 0) return null
    const iban = ucetNaIBAN(doc.dodavatel?.ucet || '')
    if (!iban) return null
    return vytvorSPAYD({
      iban,
      castka: celkemSDph,
      vs: vsZCislaFaktury(doc.cislo),
      msg: `Faktura ${doc.cislo}`,
    })
  }, [celkemSDph, doc?.dodavatel?.ucet, doc?.cislo, doc?.typ, doc])

  const setField = (path, value) => {
    setDoc(d => {
      const parts = path.split('.')
      if (parts.length === 1) return { ...d, [path]: value }
      return { ...d, [parts[0]]: { ...d[parts[0]], [parts[1]]: value } }
    })
  }

  const updateRadek = (id, field, value) =>
    setDoc(d => ({ ...d, radky: d.radky.map(r => r.id === id ? { ...r, [field]: value } : r) }))

  const addRadek = () =>
    setDoc(d => ({ ...d, radky: [...d.radky, { id: Date.now(), popis: '', mnozstvi: 1, jednotka: 'm²', cena: 0 }] }))

  const removeRadek = (id) =>
    setDoc(d => ({ ...d, radky: d.radky.filter(r => r.id !== id) }))

  const handleSave = () => {
    if (!doc) return
    if (doc.id) { updateDoklad(doc.id, doc) }
    else { const id = Date.now(); addDoklad({ ...doc, id }); setDoc(d => ({ ...d, id })) }
  }

  const handlePrint = () => { handleSave(); setTimeout(() => window.print(), 100) }

  const handleSaveDodavatel = () => { if (doc) saveDodavatel(doc.dodavatel) }

  if (!doc) {
    // LIST VIEW
    return (
      <div>
        <PageHeader title="Doklady" description="Cenové nabídky a faktury vytvořené ze zakázek" icon={FileText} />
        <div className="flex gap-3 mb-5">
          <button onClick={() => setDoc(newDoklad('nabidka', null, storedDodavatel, doklady))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: '#fff', color: 'var(--wood-dark)', border: '1px solid var(--cream3)' }}>
            <Plus size={15} /> Nová nabídka
          </button>
          <button onClick={() => setDoc(newDoklad('faktura', null, storedDodavatel, doklady))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--wood-dark)', color: '#fff' }}>
            <Plus size={15} /> Nová faktura
          </button>
        </div>

        {doklady.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid var(--cream3)' }}>
            <FileText size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text2)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--wood-dark)' }}>Žádné doklady</p>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Vytvořte doklad z existující zakázky nebo použijte tlačítka výše.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-2" style={{ background: '#fff', border: '1px solid var(--cream3)' }}>
            {doklady.map(d => (
              <DokladRow key={d.id} d={d} onOpen={setDoc} onDelete={deleteDoklad} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // EDIT / PRINT VIEW — bezDph/platceDph/celkemSDph jsou již vypočítány výše
  const typLabel = doc.typ === 'nabidka' ? 'CENOVÁ NABÍDKA' : 'FAKTURA — DAŇOVÝ DOKLAD'

  return (
    <div>
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center gap-3 mb-5 print:hidden">
        <button onClick={() => setDoc(null)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: '#eff6ff', color: 'var(--text2)', border: '1px solid var(--cream3)' }}>
          <ArrowLeft size={15} /> Zpět na seznam
        </button>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--cream3)' }}>
          {['nabidka', 'faktura'].map(t => (
            <button key={t} onClick={() => setField('typ', t)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={doc.typ === t
                ? { background: 'var(--wood-dark)', color: '#fff' }
                : { background: '#fff', color: 'var(--text2)' }}>
              {t === 'nabidka' ? 'Nabídka' : 'Faktura'}
            </button>
          ))}
        </div>
        {/* Přepínač plátce/neplátce DPH */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--cream3)' }}>
          {[true, false].map(p => (
            <button key={String(p)} onClick={() => setField('platceDph', p)}
              className="px-3 py-2 text-xs font-medium transition-colors"
              style={platceDph === p
                ? { background: 'var(--wood-dark)', color: '#fff' }
                : { background: '#fff', color: 'var(--text2)' }}>
              {p ? 'Plátce DPH' : 'Neplátce DPH'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: '#fff', color: 'var(--wood-dark)', border: '1px solid var(--cream3)' }}>
          <Save size={15} /> Uložit
        </button>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: 'var(--wood-dark)', color: '#fff' }}>
          <Printer size={15} /> Tisknout / PDF
        </button>
      </div>

      {/* DOCUMENT */}
      <div className="bg-white rounded-2xl p-8 shadow-sm print:shadow-none print:rounded-none print:p-8"
        style={{ border: '1px solid #e0d0c0' }}>

        {/* Document header */}
        <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: '2px solid var(--wood-dark)' }}>
          <div>
            <h2 className="text-2xl font-black tracking-wide" style={{ color: 'var(--wood-dark)' }}>{typLabel}</h2>
            <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--text2)' }}>
              <span>
                č.{' '}
                <InlineInput value={doc.cislo} onChange={v => setField('cislo', v)} className="font-bold w-36" />
                <PrintVal className="font-bold">{doc.cislo}</PrintVal>
              </span>
              <span>
                Datum:{' '}
                <InlineInput value={doc.datum} onChange={v => setField('datum', v)} className="w-28" />
                <PrintVal>{doc.datum}</PrintVal>
              </span>
              {doc.typ === 'faktura' && (
                <span>
                  Splatnost:{' '}
                  <InlineInput value={doc.datumSplatnosti} onChange={v => setField('datumSplatnosti', v)} className="w-28" />
                  <PrintVal>{doc.datumSplatnosti}</PrintVal>
                </span>
              )}
            </div>
          </div>
          {doc.zakazka?.nazev && (
            <div className="text-right text-sm" style={{ color: 'var(--text2)' }}>
              <div className="text-xs uppercase font-bold tracking-wide mb-0.5">Zakázka</div>
              <div className="font-semibold" style={{ color: 'var(--wood-dark)' }}>{doc.zakazka.nazev}</div>
            </div>
          )}
        </div>

        {/* Strany */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Dodavatel */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text2)' }}>Dodavatel</div>
            <div className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--wood-dark)' }}>
              {[
                ['nazev', 'Název / Jméno', ''],
                ['ico',   'IČO',           'IČO: '],
                ['dic',   'DIČ',           'DIČ: '],
                ['adresa','Adresa',        ''],
                ['telefon','Telefon',      'Tel: '],
                ['email', 'E-mail',        ''],
                ['ucet',  'Číslo účtu',   'Účet: '],
              ].map(([f, ph, prefix]) => (
                <div key={f}>
                  <span className={`hidden print:inline ${!doc.dodavatel[f] ? 'opacity-0' : ''}`}>
                    {prefix}{doc.dodavatel[f]}
                  </span>
                  <InlineInput
                    value={doc.dodavatel[f]}
                    onChange={v => setField(`dodavatel.${f}`, v)}
                    placeholder={ph}
                    className="w-full block"
                  />
                </div>
              ))}
              <button onClick={handleSaveDodavatel}
                className="mt-1 text-xs underline print:hidden"
                style={{ color: '#3b82f6' }}>
                Uložit jako výchozí dodavatel
              </button>
            </div>
          </div>

          {/* Odběratel */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text2)' }}>Odběratel</div>
            <div className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--wood-dark)' }}>
              {[
                ['nazev', 'Jméno / Firma', ''],
                ['adresa','Adresa',        ''],
                ['ico',   'IČO',           'IČO: '],
              ].map(([f, ph, prefix]) => (
                <div key={f}>
                  <span className={`hidden print:inline ${!doc.odberatel[f] ? 'opacity-0' : ''}`}>
                    {prefix}{doc.odberatel[f]}
                  </span>
                  <InlineInput
                    value={doc.odberatel[f]}
                    onChange={v => setField(`odberatel.${f}`, v)}
                    placeholder={ph}
                    className="w-full block"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabulka položek */}
        <table className="w-full text-sm mb-1">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--wood-dark)' }}>
              <th className="pb-2 text-left font-bold" style={{ color: 'var(--wood-dark)' }}>Popis práce / materiálu</th>
              <th className="pb-2 text-right font-bold w-20" style={{ color: 'var(--wood-dark)' }}>Množství</th>
              <th className="pb-2 text-right font-bold w-16" style={{ color: 'var(--wood-dark)' }}>Jedn.</th>
              <th className="pb-2 text-right font-bold w-28" style={{ color: 'var(--wood-dark)' }}>Cena/jedn.</th>
              <th className="pb-2 text-right font-bold w-28" style={{ color: 'var(--wood-dark)' }}>Celkem</th>
              <th className="pb-2 w-7 print:hidden" />
            </tr>
          </thead>
          <tbody>
            {doc.radky.map(row => {
              const total = parseFloat(row.mnozstvi || 0) * parseFloat(row.cena || 0)
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #e0e7ff' }}>
                  <td className="py-2 pr-2">
                    <span className="hidden print:block">{row.popis}</span>
                    <input type="text" value={row.popis}
                      onChange={e => updateRadek(row.id, 'popis', e.target.value)}
                      className="print:hidden w-full bg-transparent border-b text-sm focus:outline-none"
                      style={{ borderColor: 'var(--cream3)', color: 'var(--wood-dark)' }}
                      placeholder="Popis..." />
                  </td>
                  <td className="py-2 px-1 text-right">
                    <span className="hidden print:inline">{row.mnozstvi}</span>
                    <input type="number" value={row.mnozstvi}
                      onChange={e => updateRadek(row.id, 'mnozstvi', e.target.value)}
                      className="print:hidden w-16 bg-transparent border-b text-sm text-right focus:outline-none"
                      style={{ borderColor: 'var(--cream3)', color: 'var(--wood-dark)' }} />
                  </td>
                  <td className="py-2 px-1 text-right">
                    <span className="hidden print:inline">{row.jednotka}</span>
                    <select value={row.jednotka}
                      onChange={e => updateRadek(row.id, 'jednotka', e.target.value)}
                      className="print:hidden bg-transparent text-sm text-right focus:outline-none border-b"
                      style={{ borderColor: 'var(--cream3)', color: 'var(--wood-dark)' }}>
                      {JEDNOTKY.map(j => <option key={j}>{j}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-1 text-right">
                    <span className="hidden print:inline">{formatNum(parseFloat(row.cena || 0), 0)} Kč</span>
                    <input type="number" value={row.cena}
                      onChange={e => updateRadek(row.id, 'cena', e.target.value)}
                      className="print:hidden w-24 bg-transparent border-b text-sm text-right focus:outline-none"
                      style={{ borderColor: 'var(--cream3)', color: 'var(--wood-dark)' }}
                      placeholder="0" />
                  </td>
                  <td className="py-2 pl-1 text-right font-semibold" style={{ color: 'var(--wood-dark)' }}>
                    {formatNum(total, 0)} Kč
                  </td>
                  <td className="py-2 print:hidden">
                    <button onClick={() => removeRadek(row.id)} className="p-1 hover:text-red-500" style={{ color: '#3b82f6' }}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button onClick={addRadek}
          className="flex items-center gap-1.5 text-xs font-medium mb-6 print:hidden"
          style={{ color: 'var(--text2)' }}>
          <Plus size={14} /> Přidat řádek
        </button>

        {/* Součty + DPH */}
        <div className="flex justify-end">
          <div className="w-72 text-sm">
            {platceDph ? (
              <>
                <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #e0e7ff', color: 'var(--text2)' }}>
                  <span>Základ DPH (bez DPH)</span>
                  <span className="font-semibold" style={{ color: 'var(--wood-dark)' }}>{formatNum(bezDph, 0)} Kč</span>
                </div>
                <div className="flex justify-between py-1 items-center" style={{ borderBottom: '1px solid #e0e7ff', color: 'var(--text2)' }}>
                  <span className="flex items-center gap-1">
                    DPH{' '}
                    <select value={doc.sazbaDP}
                      onChange={e => setField('sazbaDP', parseFloat(e.target.value))}
                      className="print:hidden bg-transparent text-xs focus:outline-none border-b"
                      style={{ borderColor: 'var(--cream3)', color: 'var(--text2)', width: 40 }}>
                      {[0, 10, 12, 15, 21].map(v => <option key={v} value={v}>{v} %</option>)}
                    </select>
                    <span className="hidden print:inline">{doc.sazbaDP} %</span>
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--wood-dark)' }}>{formatNum(dphCast, 0)} Kč</span>
                </div>
              </>
            ) : (
              <div className="py-1 text-xs italic" style={{ color: 'var(--text2)', borderBottom: '1px solid #e0e7ff' }}>
                Fakturující subjekt není plátcem DPH dle §6 zák. č. 235/2004 Sb.
              </div>
            )}
            <div className="flex justify-between py-2 text-base font-black" style={{ color: 'var(--wood-dark)' }}>
              <span>Celkem k úhradě</span>
              <span>{formatNum(celkemSDph, 0)} Kč</span>
            </div>
          </div>
        </div>

        {/* Poznámka */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid #e0e7ff' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text2)' }}>Poznámky</div>
          <span className="hidden print:block text-sm" style={{ color: 'var(--wood-dark)', whiteSpace: 'pre-wrap' }}>
            {doc.poznamka || '—'}
          </span>
          <textarea value={doc.poznamka}
            onChange={e => setField('poznamka', e.target.value)}
            rows={2}
            className="print:hidden w-full bg-transparent text-sm resize-none focus:outline-none"
            style={{ color: 'var(--wood-dark)' }}
            placeholder="Platnost nabídky, způsob platby, bankovní spojení, poznámky..." />
        </div>

        {/* Patička účtu */}
        {doc.dodavatel.ucet && (
          <div className="mt-4 text-xs" style={{ color: 'var(--text2)' }}>
            Bankovní spojení: <span className="font-semibold" style={{ color: 'var(--wood-dark)' }}>{doc.dodavatel.ucet}</span>
            {ucetNaIBAN(doc.dodavatel.ucet) && (
              <span className="ml-2" style={{ color: '#94a3b8' }}>
                · IBAN: {ucetNaIBAN(doc.dodavatel.ucet)}
              </span>
            )}
          </div>
        )}

        {/* QR Platba — react-qr-code, čistě SVG, žádný canvas ani async */}
        {spaydStr && (
          <div className="mt-6 pt-4 flex items-start gap-6" style={{ borderTop: '1px solid #e0e7ff' }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text2)' }}>
                QR Platba
              </div>
              <div style={{ padding: 6, background: '#fff', border: '1px solid #e0d0c0', borderRadius: 4, display: 'inline-block' }}>
                <QRCodeSVG value={spaydStr} size={120} level="M" />
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text2)', paddingTop: 24 }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--wood-dark)' }}>Platba převodem</p>
              <p>Naskenujte QR kód v mobilní aplikaci banky.</p>
              <p className="mt-1">Formát: <span className="font-mono text-xs">SPAYD</span> (standard ČBA).</p>
              {ucetNaIBAN(doc.dodavatel?.ucet) && (
                <p className="mt-1.5 font-mono" style={{ color: '#94a3b8', wordBreak: 'break-all', fontSize: 10 }}>
                  {ucetNaIBAN(doc.dodavatel.ucet)}
                </p>
              )}
            </div>
          </div>
        )}
        {doc.typ === 'faktura' && !spaydStr && doc.dodavatel?.ucet && celkemSDph > 0 && (
          <p className="mt-4 text-xs print:hidden" style={{ color: 'var(--amber)' }}>
            QR platba: zkontrolujte formát čísla účtu (např. 123456789/0800).
          </p>
        )}
        {doc.typ === 'faktura' && !doc.dodavatel?.ucet && (
          <p className="mt-4 text-xs print:hidden" style={{ color: '#94a3b8' }}>
            Vyplňte číslo účtu (formát 123456789/0800) pro automatické vygenerování QR platby.
          </p>
        )}
      </div>
    </div>
  )
}
