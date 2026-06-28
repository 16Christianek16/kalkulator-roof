import { useState, useRef } from 'react'
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, LogOut, ShieldCheck, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { navGroups } from './navGroups'

const LANGS = [
  { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
]

function isItemActive(item, pathname) {
  return item.path === pathname
}

export default function Topbar() {
  const { pathname } = useLocation()
  const [openGroup, setOpenGroup] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const wrapRef = useRef(null)

  const user     = useAuthStore(s => s.user)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const { i18n }  = useTranslation()

  const activeGroup = navGroups.find(g => g.items.some(it => isItemActive(it, pathname)))?.id
  const closeMenus = () => { setOpenGroup(null); setMobileOpen(false) }

  const initials = user?.jmeno
    ? user.jmeno.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  const handleLogout = () => { logout(); navigate('/login') }
  const changeLang   = (code) => { i18n.changeLanguage(code); localStorage.setItem('lang', code); setLangOpen(false) }
  const currentLang  = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  return (
    <div ref={wrapRef} className="relative print:hidden">
      <header className="h-[52px] px-3 lg:px-5 flex items-center gap-1 shrink-0"
        style={{ background: 'var(--wood-dark)', borderBottom: '3px solid var(--amber)' }}>

        <button onClick={() => setMobileOpen(v => !v)}
          className="lg:hidden p-2 rounded-lg transition-colors shrink-0"
          style={{ color: 'rgba(245,237,224,0.6)' }}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <Link to="/" onClick={closeMenus} className="flex items-center gap-2.5 shrink-0 mr-3">
          <div className="w-9 h-9 rounded flex items-center justify-center shrink-0"
            style={{ background: 'var(--amber)' }}>
            <span className="font-condensed" style={{ color: 'var(--wood-dark)', fontSize: 13, fontWeight: 700 }}>CR</span>
          </div>
          <span className="font-condensed font-bold hidden xl:block" style={{ fontSize: 16, color: 'var(--cream)', letterSpacing: '0.02em' }}>
            KalkulatorRoof
          </span>
        </Link>

        {/* Skupiny navigace — desktop */}
        <nav className="hidden lg:flex items-stretch h-full">
          {navGroups.map(g => (
            <div key={g.id} className="relative h-full flex items-stretch">
              <button
                onClick={() => setOpenGroup(o => o === g.id ? null : g.id)}
                className="font-condensed font-bold uppercase flex items-center gap-1 px-3 h-full transition-colors"
                style={{
                  fontSize: 11.5, letterSpacing: '0.08em',
                  color: activeGroup === g.id || openGroup === g.id ? 'var(--amber-light)' : 'rgba(245,237,224,0.6)',
                  borderBottom: activeGroup === g.id ? '3px solid var(--amber)' : '3px solid transparent',
                  marginBottom: -3,
                }}>
                {g.label}
                <ChevronDown size={11} style={{ opacity: 0.6, transform: openGroup === g.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </button>

              {openGroup === g.id && (
                <div className="absolute left-0 top-full z-50 rounded-b shadow-lg py-1 min-w-[210px]"
                  style={{ background: 'var(--wood-dark)', border: '1px solid rgba(212,137,26,0.25)', borderTop: 'none' }}>
                  {g.items.map((it, i) => it.heading ? (
                    <div key={`h${i}`} className="font-condensed font-bold uppercase px-3"
                      style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--amber)', padding: '8px 12px 3px', borderTop: i > 0 ? '1px solid rgba(212,137,26,0.15)' : 'none', marginTop: i > 0 ? 4 : 0 }}>
                      {it.heading}
                    </div>
                  ) : (
                    <NavLink key={it.path} to={it.path} onClick={closeMenus}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <button onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors"
              style={{ color: 'rgba(245,237,224,0.6)' }}>
              <span className="text-base leading-none">{currentLang.flag}</span>
              <Globe size={13} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-10 z-50 rounded shadow-lg border py-1 min-w-[140px]"
                style={{ background: 'var(--cream2)', borderColor: 'var(--cream3)' }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => changeLang(l.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                    style={{ color: i18n.language === l.code ? 'var(--amber)' : 'var(--text2)', fontWeight: i18n.language === l.code ? 700 : 400 }}>
                    <span className="text-base">{l.flag}</span>{l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <Link to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ color: 'rgba(245,237,224,0.6)' }}>
              <ShieldCheck size={14} /><span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ color: 'rgba(245,237,224,0.6)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--amber)', color: 'var(--wood-dark)' }}>
              {initials}
            </div>
            {user && <span className="text-xs font-medium hidden md:block" style={{ color: 'var(--cream)' }}>{user.jmeno}</span>}
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ color: 'rgba(245,237,224,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,237,224,0.6)' }}>
            <LogOut size={14} /><span className="hidden sm:inline">Odhlásit</span>
          </button>
        </div>
      </header>

      {/* Klikací overlay pro zavření flyoutu/mobilního menu */}
      {(openGroup || mobileOpen) && (
        <div className="fixed inset-0 z-40" style={{ top: 52 }} onClick={closeMenus} />
      )}

      {/* Mobilní menu — vertikální seznam všech skupin */}
      {mobileOpen && (
        <nav className="lg:hidden absolute left-0 right-0 top-full z-50 max-h-[80vh] overflow-y-auto shadow-lg"
          style={{ background: 'var(--wood-dark)', borderBottom: '3px solid var(--amber)' }}>
          {navGroups.map(g => (
            <div key={g.id}>
              <div className="font-condensed font-bold uppercase px-4"
                style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--amber)', padding: '12px 16px 4px' }}>
                {g.label}
              </div>
              {g.items.map((it, i) => it.heading ? (
                <div key={`h${i}`} className="font-condensed font-bold uppercase px-4"
                  style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(212,137,26,0.7)', padding: '6px 16px 2px' }}>
                  {it.heading}
                </div>
              ) : (
                <NavLink key={it.path} to={it.path} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ paddingLeft: '1.25rem' }}>
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      )}
    </div>
  )
}
