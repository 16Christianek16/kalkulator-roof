import { NavLink } from 'react-router-dom'
import {
  Home, Hammer, Triangle, Layers, Wrench, Calculator,
  BarChart2, Package, ChevronDown, ChevronRight, X, Ruler
} from 'lucide-react'
import { useState } from 'react'

const menuGroups = [
  {
    cat: 'Projekt',
    items: [
      { label: 'Dashboard', icon: Home, path: '/' },
      {
        label: 'Rozměry střechy', icon: Ruler, children: [
          { label: 'Půdorys střechy', path: '/strechy/pudorys' },
          { label: 'Pohled střechy', path: '/strechy/pohled' },
        ]
      },
    ],
  },
  {
    cat: 'Konstrukce',
    items: [
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
    ],
  },
  {
    cat: 'Materiál',
    items: [
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
    ],
  },
  {
    cat: 'Nástroje',
    items: [
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
    ],
  },
]

function MenuItem({ item, onClose }) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  if (!hasChildren) {
    return (
      <NavLink to={item.path} end={item.path === '/'} onClick={onClose}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <span className="nav-dot" style={{
          width: 5, height: 5, borderRadius: '50%', background: 'currentColor',
          opacity: 0.5, flexShrink: 0,
        }} />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-[0.78rem] transition-colors"
        style={{ color: open ? 'var(--cream)' : 'rgba(245,237,224,0.55)', background: open ? 'rgba(212,137,26,0.08)' : 'transparent', cursor: 'pointer' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.5, flexShrink: 0 }} />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={11} style={{ opacity: 0.6 }} /> : <ChevronRight size={11} style={{ opacity: 0.6 }} />}
      </button>
      {open && (
        <div className="mb-1 flex flex-col gap-0.5">
          {item.children.map(child => (
            <NavLink key={child.path} to={child.path} onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: '1.5rem' }}>
              <span style={{
                width: 4, height: 4, borderRadius: '50%', background: 'currentColor',
                opacity: 0.5, flexShrink: 0,
              }} />
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
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-[210px] z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--wood-dark)', position: 'relative' }}>

        {/* Zlatý pravý okraj */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
          background: 'linear-gradient(180deg, var(--amber) 0%, var(--amber-light) 30%, var(--amber) 70%, var(--amber-light) 100%)',
        }} />

        {/* Logo */}
        <div className="px-4 pt-4 pb-3.5 shrink-0 flex items-start justify-between"
          style={{ borderBottom: '2px solid rgba(212,137,26,0.3)' }}>
          <div>
            <div className="font-condensed inline-block font-bold uppercase mb-2"
              style={{
                background: 'var(--amber)', color: 'var(--wood-dark)', fontSize: 10,
                letterSpacing: '0.15em', padding: '3px 8px', borderRadius: 2,
              }}>
              Tesař &amp; Pokrývač
            </div>
            <div className="font-condensed font-bold leading-tight" style={{ fontSize: 17, color: 'var(--cream)', letterSpacing: '0.02em' }}>
              Kalkulator<br />Roof
            </div>
            <div style={{ fontSize: 10, color: 'rgba(245,237,224,0.4)', marginTop: 3, fontWeight: 300, letterSpacing: '0.04em' }}>
              Profesionální kalkulace střech
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded" style={{ color: 'rgba(245,237,224,0.4)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 flex flex-col">
          {menuGroups.map((group, gi) => (
            <div key={group.cat}>
              <div className="font-condensed font-bold uppercase px-4"
                style={{
                  fontSize: 9, letterSpacing: '0.2em', color: 'var(--amber)',
                  padding: '12px 16px 4px', borderTop: gi === 0 ? 'none' : '1px solid rgba(212,137,26,0.15)',
                  marginTop: gi === 0 ? 0 : 4,
                }}>
                {group.cat}
              </div>
              {group.items.map(item => <MenuItem key={item.label} item={item} onClose={onClose} />)}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-center shrink-0"
          style={{ borderTop: '1px solid rgba(212,137,26,0.15)', color: 'rgba(245,237,224,0.25)', fontSize: '0.65rem' }}>
          v1.0 © 2025 CalkulatorRoof
        </div>
      </aside>
    </>
  )
}
