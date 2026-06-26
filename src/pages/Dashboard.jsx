import { Link, useNavigate } from 'react-router-dom'
import {
  Hammer, Triangle, Layers, Wrench, Calculator, BarChart2, Package,
  ArrowRight, Ruler, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

// ── Moduly kalkulátoru ─────────────────────────────────────────────────────────
const modules = [
  {
    icon: Ruler,    title: 'Rozměry střechy',  color: 'var(--amber)',
    links: [
      { label: 'Půdorys střechy',   path: '/strechy/pudorys' },
      { label: 'Pohled střechy',    path: '/strechy/pohled' },
    ]
  },
  {
    icon: Hammer,   title: 'Tesařství',         color: '#0ea5e9',
    links: [
      { label: 'Průřez trámů',        path: '/tesarstvi/prurez-tramu' },
      { label: 'Dimenzování krokví',  path: '/tesarstvi/krokve' },
      { label: 'Krov & konstrukce',   path: '/tesarstvi/krov-konstrukce' },
      { label: 'Střešní latě',        path: '/tesarstvi/late' },
    ]
  },
  {
    icon: Triangle, title: 'Geometrie střech',  color: '#10b981',
    links: [
      { label: 'Délka krokví',         path: '/geometrie/delka-krokvi' },
      { label: 'Plocha střechy',       path: '/geometrie/plocha' },
      { label: 'Složité střechy',      path: '/geometrie/slozite-strechy' },
      { label: 'Nárožní krokve',       path: '/geometrie/narozni-krokve' },
    ]
  },
  {
    icon: Layers,   title: 'Pokrývačství',      color: '#f59e0b',
    links: [
      { label: 'Spotřeba krytiny',     path: '/pokryvacstvi/tasky' },
      { label: 'Střešní fólie',        path: '/pokryvacstvi/folie' },
      { label: 'Odvodnění střechy',    path: '/pokryvacstvi/odvodneni' },
      { label: 'Rozteč latí',          path: '/pokryvacstvi/rozted-lati' },
    ]
  },
  {
    icon: Wrench,   title: 'Klempířství',       color: '#8b5cf6',
    links: [
      { label: 'Oplechování ploch',    path: '/klempirsvi/oplechovani' },
      { label: 'Žlaby a svody',        path: '/klempirsvi/zlaby' },
      { label: 'Spotřeba plechu',      path: '/klempirsvi/spotrebaplech' },
    ]
  },
  {
    icon: BarChart2, title: 'Kalkulace & Obchod', color: 'var(--amber)',
    links: [
      { label: 'Zakázky',             path: '/kalkulace/zakazka' },
      { label: 'Doklady & Faktury',   path: '/kalkulace/faktura' },
      { label: 'Zákazníci',           path: '/kalkulace/zakaznici' },
    ]
  },
]

export default function Dashboard() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()

  return (
    <div style={{ margin: '-1.75rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>

      {/* ── Module grid ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--cream2)', flex: 1, padding: '2rem 2rem 2.5rem' }}>
        {user?.jmeno && (
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Dobrý den, <strong style={{ color: 'var(--wood-dark)' }}>{user.jmeno.split(' ')[0]}</strong> — vyberte kalkulátor
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          {modules.map(mod => {
            const Icon = mod.icon
            return (
              <div key={mod.title} className="rounded-2xl bg-white overflow-hidden transition-shadow hover:shadow-md"
                style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${mod.color}18` }}>
                    <Icon size={18} style={{ color: mod.color }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--wood-dark)' }}>{mod.title}</h3>
                </div>
                <div className="px-3 py-2 flex flex-col">
                  {mod.links.map(link => (
                    <Link key={link.path} to={link.path}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors"
                      style={{ color: '#475569', textDecoration: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = 'var(--amber-light)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
                      <span>{link.label}</span>
                      <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Sklad */}
        <div className="rounded-2xl bg-white flex items-center justify-between px-5 py-4"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Package size={18} style={{ color: 'var(--amber)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--wood-dark)' }}>Sklad materiálu</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Evidence zásob, objednávky, upozornění na minimum</p>
            </div>
          </div>
          <Link to="/sklad"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--amber), var(--amber-light))' }}>
            Otevřít <ArrowRight size={14} />
          </Link>
        </div>
      </div>

    </div>
  )
}
