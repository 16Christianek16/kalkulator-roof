import { NavLink } from 'react-router-dom'
import {
  Home, Hammer, Triangle, Layers, Wrench, Calculator,
  BarChart2, Package, ChevronDown, ChevronRight, X, Ruler
} from 'lucide-react'
import { useState } from 'react'

const SIDEBAR_BG = '#0f172a'

const menu = [
  { label: 'Dashboard', icon: Home, path: '/' },
  {
    label: 'Rozměry střechy', icon: Ruler, children: [
      { label: 'Půdorys střechy', path: '/strechy/pudorys' },
      { label: 'Pohled střechy', path: '/strechy/pohled' },
    ]
  },
  {
    label: 'Tesařství', icon: Hammer, children: [
      { label: 'Průřez trámů', path: '/tesarstvi/prurez-tramu' },
      { label: 'Dimenzování krokví', path: '/tesarstvi/krokve' },
      { label: 'Střešní latě', path: '/tesarstvi/late' },
      { label: 'Dřevěná schodiště', path: '/tesarstvi/schody' },
      { label: 'Stropy a podlahy', path: '/tesarstvi/stropy' },
      { label: 'Krov & konstrukce', path: '/tesarstvi/krov-konstrukce' },
    ]
  },
  {
    label: 'Geometrie střech', icon: Triangle, children: [
      { label: 'Délka krokví', path: '/geometrie/delka-krokvi' },
      { label: 'Složité střechy', path: '/geometrie/slozite-strechy' },
      { label: 'Nárožní krokve', path: '/geometrie/narozni-krokve' },
      { label: 'Plocha střechy', path: '/geometrie/plocha' },
    ]
  },
  {
    label: 'Pokrývačství', icon: Layers, children: [
      { label: 'Spotřeba krytiny', path: '/pokryvacstvi/tasky' },
      { label: 'Střešní fólie', path: '/pokryvacstvi/folie' },
      { label: 'Odvodnění střechy', path: '/pokryvacstvi/odvodneni' },
      { label: 'Rozteč latí', path: '/pokryvacstvi/rozted-lati' },
    ]
  },
  {
    label: 'Klempířství', icon: Wrench, children: [
      { label: 'Oplechování ploch', path: '/klempirsvi/oplechovani' },
      { label: 'Žlaby a svody', path: '/klempirsvi/zlaby' },
      { label: 'Spotřeba plechu', path: '/klempirsvi/spotrebaplech' },
    ]
  },
  {
    label: 'Obecné nástroje', icon: Calculator, children: [
      { label: 'Plochy a objemy', path: '/obecne/plochy' },
      { label: 'Sklon střechy', path: '/obecne/sklon' },
      { label: 'Pythagorova věta', path: '/obecne/pythagoras' },
      { label: 'Převodník jednotek', path: '/obecne/jednotky' },
      { label: 'Zatížení sněhem', path: '/obecne/zatizeni-snehem' },
    ]
  },
  {
    label: 'Kalkulace', icon: BarChart2, children: [
      { label: 'Zakázky', path: '/kalkulace/zakazka' },
      { label: 'Doklady & Faktury', path: '/kalkulace/faktura' },
      { label: 'Zákazníci', path: '/kalkulace/zakaznici' },
    ]
  },
  { label: 'Sklad', icon: Package, path: '/sklad' },
]

function MenuItem({ item, onClose }) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={onClose}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <Icon size={15} className="shrink-0 opacity-60" />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors"
        style={{
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.07em',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <Icon size={13} style={{ opacity: 0.5 }} />
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown size={11} style={{ opacity: 0.4 }} />
          : <ChevronRight size={11} style={{ opacity: 0.4 }} />}
      </button>

      {open && (
        <div className="ml-4 mt-0.5 mb-1 pl-3 flex flex-col gap-0.5"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          {item.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 z-30 flex flex-col
          transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              <span className="text-white text-xs font-black">CR</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">CalkulatorRoof</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                Stavební kalkulace
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          {menu.map(item => (
            <MenuItem key={item.label} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-center shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
          v1.0 © 2025 CalkulatorRoof
        </div>
      </aside>
    </>
  )
}
