import { Link, useNavigate } from 'react-router-dom'
import {
  Hammer, Triangle, Layers, Wrench, Calculator, BarChart2, Package,
  ArrowRight, Ruler, Clock, Star, Lock, Shield, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

// ── Moduly kalkulátoru ─────────────────────────────────────────────────────────
const modules = [
  {
    icon: Ruler,    title: 'Rozměry střechy',  color: '#2563eb',
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
    icon: BarChart2, title: 'Kalkulace & Obchod', color: '#2563eb',
    links: [
      { label: 'Zakázky',             path: '/kalkulace/zakazka' },
      { label: 'Doklady & Faktury',   path: '/kalkulace/faktura' },
      { label: 'Zákazníci',           path: '/kalkulace/zakaznici' },
    ]
  },
]

const features = [
  { icon: Clock,  label: 'RYCHLÉ A ZDARMA',  sub: 'Výsledek do pár minut' },
  { icon: Star,   label: 'PŘESNÝ ODHAD',      sub: 'Na základě reálných dat' },
  { icon: Lock,   label: 'NEZÁVAZNĚ',          sub: 'Bez registrace a závazků' },
  { icon: Shield, label: 'NEZÁVISLÉ',          sub: 'Bez napojení na dodavatele' },
]

const steps = [
  { n: '01', title: 'Zadejte parametry střechy',  sub: 'Vyberte typ střechy, plochu a materiál.' },
  { n: '02', title: 'Kalkulace během chvilky',    sub: 'Náš kalkulátor spočítá orientační cenu.' },
  { n: '03', title: 'Výsledek zdarma',             sub: 'Okamžitý přehled ceny vaší nové střechy.' },
]

export default function Dashboard() {
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()

  return (
    <div style={{ margin: '-1.75rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#ffffff', flex: '0 0 auto' }}>
        <div className="flex justify-center" style={{ minHeight: 480 }}>

          {/* Text + card */}
          <div className="flex flex-col justify-center px-8 md:px-12 py-12 lg:py-16">
            <div className="max-w-md">
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#0f172a',
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                SPOČÍTEJTE CENU<br />VAŠÍ NOVÉ STŘECHY
              </h1>
              {/* Blue underline */}
              <div style={{ width: 48, height: 4, background: '#2563eb', borderRadius: 2, marginBottom: 16 }} />
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32, lineHeight: 1.6 }}>
                Rychle, jednoduše a zdarma.<br />
                Získejte orientační nabídku do pár minut.
              </p>

              {/* JAK TO FUNGUJE card */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              }}>
                <div className="px-6 pt-5 pb-2">
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: '#0f172a', marginBottom: 20 }}>
                    JAK TO FUNGUJE?
                  </p>
                  <div className="flex flex-col gap-4 mb-5">
                    {steps.map(s => (
                      <div key={s.n} className="flex items-start gap-3">
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: '2px solid #2563eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb' }}>{s.n}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: 2 }}>{s.title}</p>
                          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 pb-5">
                  <Link to="/strechy/pudorys"
                    className="flex items-center justify-between w-full px-5 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ background: '#2563eb', letterSpacing: '0.04em', textDecoration: 'none' }}>
                    SPUSTIT KALKULÁTOR
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature bar ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ background: '#0f172a' }}>
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.label} className="flex items-center gap-3 px-6 py-4">
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px solid #2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em' }}>{f.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>{f.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Module grid ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#f8fafc', flex: 1, padding: '2rem 2rem 2.5rem' }}>
        {user?.jmeno && (
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Dobrý den, <strong style={{ color: '#0f172a' }}>{user.jmeno.split(' ')[0]}</strong> — vyberte kalkulátor
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
                  <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>{mod.title}</h3>
                </div>
                <div className="px-3 py-2 flex flex-col">
                  {mod.links.map(link => (
                    <Link key={link.path} to={link.path}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors"
                      style={{ color: '#475569', textDecoration: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1d4ed8' }}
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
              <Package size={18} style={{ color: '#2563eb' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Sklad materiálu</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Evidence zásob, objednávky, upozornění na minimum</p>
            </div>
          </div>
          <Link to="/sklad"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            Otevřít <ArrowRight size={14} />
          </Link>
        </div>
      </div>

    </div>
  )
}
