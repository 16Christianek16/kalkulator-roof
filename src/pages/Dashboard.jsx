import { Link } from 'react-router-dom'
import { Hammer, Triangle, Layers, Wrench, Calculator, BarChart2, Package, ArrowRight, Ruler } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const modules = [
  {
    icon: Ruler,
    title: 'Rozměry střechy',
    description: 'Půdorys, pohled, vizualizace',
    color: '#6366f1',
    links: [
      { label: 'Půdorys střechy', path: '/strechy/pudorys' },
      { label: 'Pohled střechy', path: '/strechy/pohled' },
    ]
  },
  {
    icon: Hammer,
    title: 'Tesařství',
    description: 'Průřezy, krokve, latě, schodiště',
    color: '#0ea5e9',
    links: [
      { label: 'Průřez trámů', path: '/tesarstvi/prurez-tramu' },
      { label: 'Dimenzování krokví', path: '/tesarstvi/krokve' },
      { label: 'Střešní latě', path: '/tesarstvi/late' },
      { label: 'Dřevěná schodiště', path: '/tesarstvi/schody' },
    ]
  },
  {
    icon: Triangle,
    title: 'Geometrie střech',
    description: 'Délky krokví, plochy, nárožní',
    color: '#10b981',
    links: [
      { label: 'Délka krokví', path: '/geometrie/delka-krokvi' },
      { label: 'Plocha střechy', path: '/geometrie/plocha' },
      { label: 'Složité střechy', path: '/geometrie/slozite-strechy' },
      { label: 'Nárožní krokve', path: '/geometrie/narozni-krokve' },
    ]
  },
  {
    icon: Layers,
    title: 'Pokrývačství',
    description: 'Krytiny, fólie, odvodnění, latě',
    color: '#f59e0b',
    links: [
      { label: 'Spotřeba krytiny', path: '/pokryvacstvi/tasky' },
      { label: 'Střešní fólie', path: '/pokryvacstvi/folie' },
      { label: 'Odvodnění střechy', path: '/pokryvacstvi/odvodneni' },
      { label: 'Rozteč latí', path: '/pokryvacstvi/rozted-lati' },
    ]
  },
  {
    icon: Wrench,
    title: 'Klempířství',
    description: 'Oplechování, žlaby, svody',
    color: '#8b5cf6',
    links: [
      { label: 'Oplechování ploch', path: '/klempirsvi/oplechovani' },
      { label: 'Žlaby a svody', path: '/klempirsvi/zlaby' },
      { label: 'Spotřeba plechu', path: '/klempirsvi/spotrebaplech' },
    ]
  },
  {
    icon: Calculator,
    title: 'Obecné nástroje',
    description: 'Plochy, sklon, jednotky, sníh',
    color: '#ef4444',
    links: [
      { label: 'Plochy a objemy', path: '/obecne/plochy' },
      { label: 'Sklon střechy', path: '/obecne/sklon' },
      { label: 'Zatížení sněhem', path: '/obecne/zatizeni-snehem' },
      { label: 'Převodník jednotek', path: '/obecne/jednotky' },
    ]
  },
  {
    icon: BarChart2,
    title: 'Kalkulace & Obchod',
    description: 'Zakázky, doklady, faktury',
    color: '#f97316',
    links: [
      { label: 'Zakázky', path: '/kalkulace/zakazka' },
      { label: 'Doklady & Faktury', path: '/kalkulace/faktura' },
      { label: 'Zákazníci', path: '/kalkulace/zakaznici' },
    ]
  },
]

export default function Dashboard() {
  const user = useAuthStore(s => s.user)

  return (
    <div>
      {/* Welcome */}
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
          <span className="text-white text-lg font-black">CR</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">
            {user?.jmeno ? `Dobrý den, ${user.jmeno.split(' ')[0]}` : 'Vítejte v CalkulatorRoof'}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Profesionální kalkulace pro tesaře, pokrývače a klempíře
          </p>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <div key={mod.title} className="rounded-2xl bg-white overflow-hidden"
              style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

              {/* Card header */}
              <div className="px-5 pt-4 pb-3 flex items-center gap-3"
                style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${mod.color}18` }}>
                  <Icon size={18} style={{ color: mod.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>{mod.title}</h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{mod.description}</p>
                </div>
              </div>

              {/* Links */}
              <div className="px-3 py-2 flex flex-col">
                {mod.links.map(link => (
                  <Link key={link.path} to={link.path}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors group"
                    style={{ color: '#475569', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={13} style={{ color: '#cbd5e1' }} />
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#f0fdf4' }}>
            <Package size={18} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Sklad materiálu</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Evidence zásob, objednávky, upozornění na minimum</p>
          </div>
        </div>
        <Link to="/sklad"
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          Otevřít <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
