import { useState } from 'react'
import { BarChart2, Trash2, ChevronDown, ChevronUp, BookOpen, ArrowRight, FileText, Receipt, FileDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import ZakazkaModal from '../../components/ui/ZakazkaModal'
import { useAppStore } from '../../store/appStore'
import { useRoofStore } from '../../store/roofStore'
import { formatNum } from '../../utils/calculations'
import { exportZakazkaPdf } from '../../utils/pdfExport'

function InfoRow({ label, value, unit }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
      <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>
        {value}{unit && <span className="text-xs font-normal ml-1" style={{ color: '#64748b' }}>{unit}</span>}
      </span>
    </div>
  )
}

function SekceTitle({ children }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest mt-4 mb-2 pb-1 border-b" style={{ color: '#94a3b8', borderColor: '#e2e8f0' }}>
      {children}
    </div>
  )
}

function ZakazkaCard({ zakazka, onDelete, onDoklad }) {
  const [open, setOpen] = useState(true)
  const c = zakazka.computed
  const p = zakazka.params
  const hasComputed = !!c

  return (
    <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        style={{ borderBottom: open ? '1px solid #f1f5f9' : 'none' }}
        onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base truncate" style={{ color: '#0f172a' }}>{zakazka.nazev}</div>
          <div className="text-xs mt-0.5 flex gap-3" style={{ color: '#94a3b8' }}>
            {zakazka.zakaznik && <span>{zakazka.zakaznik}</span>}
            <span>{zakazka.datum}</span>
            {hasComputed && p && <span>{p.sirka}×{p.delka} m · {p.sklon}°</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button onClick={e => { e.stopPropagation(); onDoklad(zakazka.id, 'nabidka') }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
            title="Cenová nabídka">
            <FileText size={13} /> Nabídka
          </button>
          <button onClick={e => { e.stopPropagation(); onDoklad(zakazka.id, 'faktura') }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            title="Faktura">
            <Receipt size={13} /> Faktura
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(zakazka.id) }}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: '#cbd5e1' }}
            title="Smazat">
            <Trash2 size={15} />
          </button>
          {open ? <ChevronUp size={16} style={{ color: '#cbd5e1' }} /> : <ChevronDown size={16} style={{ color: '#cbd5e1' }} />}
        </div>
      </div>

      {open && hasComputed && (
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
            <div>
              <SekceTitle>Parametry střechy</SekceTitle>
              <InfoRow label="Typ střechy" value={p.typ?.charAt(0).toUpperCase() + p.typ?.slice(1)} />
              <InfoRow label="Šířka budovy" value={p.sirka} unit="m" />
              <InfoRow label="Délka budovy" value={p.delka} unit="m" />
              <InfoRow label="Sklon střechy" value={p.sklon} unit="°" />
              <InfoRow label="Přesah okapní" value={p.presahOkap} unit="m" />
              <InfoRow label="Přesah štítový" value={p.presahStit} unit="m" />
              <InfoRow label="Rozteč krokví" value={p.roztecKrokvi} unit="mm" />
            </div>
            <div>
              <SekceTitle>Geometrie střechy</SekceTitle>
              <InfoRow label="Rozvinutá plocha" value={formatNum(c.plocha)} unit="m²" />
              <InfoRow label="Půdorysná plocha" value={formatNum(c.plocha2D)} unit="m²" />
              <InfoRow label="Délka krokve" value={formatNum(c.delkaKrokve)} unit="m" />
              <InfoRow label="Výška hřebene" value={formatNum(c.vyskaHrebene)} unit="m" />
              <SekceTitle>Krokve</SekceTitle>
              <InfoRow label="Počet krokví" value={c.pocetKrokvi} unit="ks" />
              <InfoRow label="Skutečná rozteč" value={c.skutRoz} unit="mm" />
              <InfoRow label="Navržený průřez" value={c.prurezKrokve} />
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Dle zat. 1,5 kN/m², třída C24</p>
            </div>
            <div>
              <SekceTitle>Krytina — {zakazka.krytinaLabel}</SekceTitle>
              {c.typKrytiny === 'tasky' ? (
                <>
                  <InfoRow label="Počet tašek (+5 %)" value={c.pocetTasek?.toLocaleString('cs-CZ')} unit="ks" />
                  <InfoRow label="Palety (200 ks/pal.)" value={c.palety} unit="pal" />
                  {c.roztedLati && <InfoRow label="Rozteč latí" value={c.roztedLati} unit="mm" />}
                  {c.pocetLatiNaKrokev && <InfoRow label="Latě/krokev" value={c.pocetLatiNaKrokev} unit="ks" />}
                  {c.pocetLatiCelkem && <InfoRow label="Celkem latí" value={c.pocetLatiCelkem} unit="ks" />}
                </>
              ) : (
                <InfoRow label="Plocha krytiny (+5 %)" value={formatNum(c.plochaMaterial)} unit="m²" />
              )}
              <SekceTitle>Fólie a parozábrana</SekceTitle>
              <InfoRow label="Počet rolí" value={c.foliePocetPasu} unit="ks" />
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Role 1 500 mm × 50 m, přesah 150 mm</p>
            </div>
          </div>
        </div>
      )}

      {open && !hasComputed && (
        <div className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>
          Tato zakázka byla vytvořena ručně — podrobný přehled prvků není k dispozici.
        </div>
      )}

      {open && (
        <div className="px-5 py-3 flex gap-3 flex-wrap" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => onDoklad(zakazka.id, 'nabidka')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }}>
            <FileText size={14} /> Vytvořit cenovou nabídku
          </button>
          <button onClick={() => onDoklad(zakazka.id, 'faktura')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Receipt size={14} /> Vytvořit fakturu
          </button>
          <button onClick={() => exportZakazkaPdf({
              name: zakazka.nazev,
              customer: zakazka.zakaznik,
              krytina: zakazka.krytinaLabel,
              plocha: zakazka.computed ? formatNum(zakazka.computed.plocha) : '',
              pocetKrokvi: zakazka.computed?.pocetKrokvi,
              delkaKrokvi: zakazka.computed ? formatNum(zakazka.computed.delkaKrokve) : '',
              pocetLati: zakazka.computed?.pocetLatiCelkem,
              pocetTasek: zakazka.computed?.pocetTasek?.toLocaleString('cs-CZ'),
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }}>
            <FileDown size={14} /> Export PDF
          </button>
        </div>
      )}
    </div>
  )
}

export default function Zakazka() {
  const { zakazky, deleteZakazka } = useAppStore()
  const roofState = useRoofStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const handleDoklad = (zakazkaId, typ) => navigate('/kalkulace/faktura', { state: { zakazkaId, typ } })

  const autoZakazky = zakazky.filter(z => !!z.computed)
  const sorted = [...autoZakazky].sort((a, b) => b.id - a.id)

  const currentParams = {
    typ: roofState.typ, sirka: roofState.sirka, delka: roofState.delka,
    sklon: roofState.sklon, presahOkap: roofState.presahOkap,
    presahStit: roofState.presahStit, roztecKrokvi: roofState.roztecKrokvi,
    vyskaZdi: roofState.vyskaZdi,
  }

  return (
    <div>
      <PageHeader title="Zakázky" description="Přehled uložených zakázek s výpočty všech prvků střechy" icon={BarChart2} />

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: '#64748b' }}>
          Zakázky se vytvářejí automaticky při změně parametrů v{' '}
          <Link to="/strechy/pudorys" className="font-semibold hover:underline" style={{ color: '#2563eb' }}>sekci Půdorys</Link>.
        </p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <BookOpen size={15} /> Nová zakázka
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-white" style={{ border: '1px solid #e2e8f0' }}>
          <BarChart2 size={40} className="mx-auto mb-3" style={{ color: '#e2e8f0' }} />
          <p className="font-semibold mb-1" style={{ color: '#0f172a' }}>Žádné zakázky</p>
          <p className="text-sm mb-5" style={{ color: '#64748b' }}>
            Přejděte do sekce Půdorys, nastavte rozměry střechy — po chvíli vyskočí dialog pro uložení zakázky.
          </p>
          <Link to="/strechy/pudorys"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            Přejít na Půdorys <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map(z => (
            <ZakazkaCard key={z.id} zakazka={z} onDelete={deleteZakazka} onDoklad={handleDoklad} />
          ))}
        </div>
      )}

      {showModal && (
        <ZakazkaModal params={currentParams} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
