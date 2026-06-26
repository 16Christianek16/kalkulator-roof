import { useState } from 'react'
import { X, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { krytinyOptions, getKrytina } from '../../data/krytiny'
import { delkaKrokve as calcDK, vyskaHrebene as calcVH, plochaSedlovaStecha, formatNum, pocetMezerKrokvi, pocetKrokviStrany, skutecnaRoztecKrokvi } from '../../utils/calculations'

function computeZakazka(params, krytina) {
  const { sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi } = params
  const s = sirka + 2 * presahOkap
  const l = delka + 2 * presahStit
  const plocha = plochaSedlovaStecha(s, l, sklon)
  const plocha2D = s * l
  const dk = calcDK(sirka, sklon) + presahOkap
  const vh = calcVH(sirka, sklon)
  const nMez = pocetMezerKrokvi(delka, roztecKrokvi)
  const pocetKrokvi = pocetKrokviStrany(delka, roztecKrokvi)
  const skutRoz = Math.round(skutecnaRoztecKrokvi(delka, roztecKrokvi))
  const q = 1.5 * (roztecKrokvi / 1000)
  const W_mm3 = ((q * dk * dk) / 8) * 1e6 / 24
  const hKr = Math.max(120, Math.ceil(Math.sqrt((6 * W_mm3) / 60) / 10) * 10)
  const prurezKrokve = `60 × ${hKr} mm`
  const k = getKrytina(krytina)
  const pct = 1.05
  let kr = {}
  if (k) {
    if (k.ks_m2 !== null) {
      const pocetTasek = Math.ceil(plocha * k.ks_m2 * pct)
      kr = { typKrytiny: 'tasky', pocetTasek, palety: Math.ceil(pocetTasek / 200) }
    } else {
      kr = { typKrytiny: 'ploche', plochaMaterial: plocha * pct }
    }
    if (k.rozted) {
      const koef = sklon < 22 ? 0.9 : sklon > 45 ? 1.05 : 1.0
      const roztedLati = Math.round(Math.min(k.rozted.max, Math.max(k.rozted.min, k.rozted.min * koef)))
      kr.roztedLati = roztedLati
      kr.pocetLatiNaKrokev = Math.ceil((dk * 1000) / roztedLati) + 1
      kr.pocetLatiCelkem = kr.pocetLatiNaKrokev * pocetKrokvi
    }
  }
  const foliePocetPasu = Math.ceil(plocha / ((1.5 - 0.15) * 50))
  return { plocha, plocha2D, delkaKrokve: dk, vyskaHrebene: vh, pocetKrokvi, skutRoz, prurezKrokve, foliePocetPasu, ...kr }
}

export default function ZakazkaModal({ params, onClose }) {
  const navigate = useNavigate()
  const { addZakazka, zakaznici } = useAppStore()
  const [nazev,    setNazev]    = useState('')
  const [zakaznik, setZakaznik] = useState('')
  const [krytina,  setKrytina]  = useState('bobrovka')

  const k = getKrytina(krytina)
  const computed = computeZakazka(params, krytina)

  const handleCreate = () => {
    if (!nazev.trim()) return
    addZakazka({ nazev: nazev.trim(), zakaznik, datum: new Date().toLocaleDateString('cs-CZ'), params, krytina, krytinaLabel: k?.label ?? '', computed })
    onClose()
    navigate('/kalkulace/zakazka')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-white"
        style={{ border: '1px solid #e2e8f0' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--amber), var(--amber-light))' }}>
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--wood-dark)' }}>Uložit jako zakázku</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-slate-100">
            <X size={16} style={{ color: '#94a3b8' }} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Plocha', value: formatNum(computed.plocha), unit: 'm²' },
              { label: 'Krokve', value: computed.pocetKrokvi, unit: 'ks' },
              { label: 'Sklon', value: params.sklon, unit: '°' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: 'var(--cream2)', border: '1px solid #e2e8f0' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--wood-dark)' }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>{s.label} · {s.unit}</div>
              </div>
            ))}
          </div>

          {/* Název */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#64748b' }}>Název zakázky *</label>
            <div className="input-wrap">
              <input type="text" value={nazev} onChange={e => setNazev(e.target.value)}
                placeholder="Novák — střecha RD Brno" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                style={{ color: 'var(--wood-dark)' }} />
            </div>
          </div>

          {/* Zákazník */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#64748b' }}>Zákazník (volitelné)</label>
            <div className="input-wrap">
              <input type="text" value={zakaznik} onChange={e => setZakaznik(e.target.value)}
                list="modal-zakaznici-list" placeholder="Jméno zákazníka..."
                className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                style={{ color: 'var(--wood-dark)' }} />
            </div>
            <datalist id="modal-zakaznici-list">
              {zakaznici.map(z => (
                <option key={z.id} value={`${z.jmeno ?? ''} ${z.prijmeni ?? ''}`.trim()} />
              ))}
            </datalist>
          </div>

          {/* Krytina */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#64748b' }}>Typ krytiny</label>
            <select value={krytina} onChange={e => setKrytina(e.target.value)} className="select-field">
              {krytinyOptions().map(g => (
                <optgroup key={g.kategorie} label={g.kategorie}>
                  {g.items.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-slate-100"
            style={{ color: '#64748b', border: '1px solid #e2e8f0' }}>
            Přeskočit
          </button>
          <button onClick={handleCreate} disabled={!nazev.trim()}
            className="flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--amber), var(--amber-light))', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            Vytvořit zakázku →
          </button>
        </div>
      </div>
    </div>
  )
}
