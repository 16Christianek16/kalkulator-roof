import { Link, useNavigate } from 'react-router-dom'
import {
  Hammer, Triangle, Layers, Wrench, Calculator, BarChart2, Package,
  ArrowRight, Ruler, Clock, Star, Lock, Shield, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

// ── Architektonický SVG dům (reference image aesthetic) ──────────────────────
function HouseGraphic() {
  return (
    <div className="relative w-full h-full select-none" style={{ minHeight: 380 }}>
      {/* Grid overlay */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1d4ed8" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Measurement arrows */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {/* Horizontal arrow top */}
        <line x1="60" y1="32" x2="340" y2="32" stroke="#2563eb" strokeWidth="1.2" markerEnd="url(#arrowR)" markerStart="url(#arrowL)" opacity="0.6" />
        <text x="200" y="26" textAnchor="middle" fontSize="10" fill="#2563eb" opacity="0.7" fontFamily="monospace">12.80 m</text>
        {/* Vertical arrow right */}
        <line x1="365" y1="60" x2="365" y2="340" stroke="#2563eb" strokeWidth="1.2" opacity="0.6" />
        <text x="380" y="210" textAnchor="start" fontSize="10" fill="#2563eb" opacity="0.7" fontFamily="monospace" transform="rotate(90,380,210)">8.00 m</text>
        <defs>
          <marker id="arrowR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="#2563eb" opacity="0.7" />
          </marker>
          <marker id="arrowL" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6" fill="#2563eb" opacity="0.7" />
          </marker>
        </defs>
      </svg>

      {/* House SVG */}
      <svg viewBox="0 0 420 420" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {/* Shadow */}
        <ellipse cx="210" cy="385" rx="130" ry="14" fill="rgba(0,0,0,0.18)" />
        {/* Walls */}
        <rect x="60" y="220" width="300" height="155" fill="#1e293b" rx="2" />
        {/* Roof */}
        <polygon points="40,225 210,75 380,225" fill="#0f172a" />
        {/* Roof ridge highlight */}
        <line x1="40" y1="225" x2="210" y2="75" stroke="#334155" strokeWidth="2.5" />
        <line x1="210" y1="75" x2="380" y2="225" stroke="#334155" strokeWidth="2.5" />
        {/* Chimney */}
        <rect x="275" y="120" width="28" height="70" fill="#1e293b" />
        <rect x="271" y="116" width="36" height="8" fill="#334155" />
        {/* Windows front */}
        <rect x="88" y="260" width="52" height="52" fill="#0ea5e9" opacity="0.25" rx="2" />
        <rect x="88" y="260" width="52" height="52" fill="none" stroke="#334155" strokeWidth="2" rx="2" />
        <line x1="114" y1="260" x2="114" y2="312" stroke="#334155" strokeWidth="1.2" />
        <line x1="88" y1="286" x2="140" y2="286" stroke="#334155" strokeWidth="1.2" />
        <rect x="165" y="260" width="52" height="52" fill="#0ea5e9" opacity="0.25" rx="2" />
        <rect x="165" y="260" width="52" height="52" fill="none" stroke="#334155" strokeWidth="2" rx="2" />
        <line x1="191" y1="260" x2="191" y2="312" stroke="#334155" strokeWidth="1.2" />
        <line x1="165" y1="286" x2="217" y2="286" stroke="#334155" strokeWidth="1.2" />
        {/* Window right */}
        <rect x="245" y="260" width="52" height="52" fill="#0ea5e9" opacity="0.25" rx="2" />
        <rect x="245" y="260" width="52" height="52" fill="none" stroke="#334155" strokeWidth="2" rx="2" />
        <line x1="271" y1="260" x2="271" y2="312" stroke="#334155" strokeWidth="1.2" />
        <line x1="245" y1="286" x2="297" y2="286" stroke="#334155" strokeWidth="1.2" />
        {/* Door */}
        <rect x="170" y="320" width="50" height="55" fill="#0f172a" rx="2" />
        <rect x="170" y="320" width="50" height="55" fill="none" stroke="#334155" strokeWidth="2" rx="2" />
        <circle cx="214" cy="348" r="3" fill="#475569" />
        {/* Roof tiles pattern */}
        {[0,1,2,3,4].map(row => (
          [0,1,2,3,4,5,6,7].map(col => {
            const x = 60 + col * 40 - row * 4
            const y = 188 + row * 8
            return x > 40 && x < 370 ? (
              <line key={`${row}-${col}`} x1={x} y1={y} x2={x + 32} y2={y}
                stroke="#2d3f55" strokeWidth="0.8" opacity="0.6" />
            ) : null
          })
        ))}
        {/* Ground line */}
        <line x1="30" y1="375" x2="390" y2="375" stroke="#334155" strokeWidth="1.5" opacity="0.5" />
        {/* Slope angle indicator */}
        <path d="M 40 225 A 50 50 0 0 1 85 210" fill="none" stroke="#2563eb" strokeWidth="1.2" opacity="0.7" />
        <text x="62" y="208" fontSize="9" fill="#2563eb" fontFamily="monospace" opacity="0.8">35°</text>
      </svg>
    </div>
  )
}

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
        <div className="grid lg:grid-cols-2 gap-0" style={{ minHeight: 480 }}>

          {/* Left — text + card */}
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

          {/* Right — house graphic */}
          <div className="hidden lg:block relative" style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>
            <HouseGraphic />
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
