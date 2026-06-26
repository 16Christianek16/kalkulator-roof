import { Menu, LogOut, ShieldCheck, Globe } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'

const LANGS = [
  { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
]

export default function Header({ onMenuToggle }) {
  const user    = useAuthStore(s => s.user)
  const logout  = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)

  const initials = user?.jmeno
    ? user.jmeno.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }
  const changeLang   = (code) => { i18n.changeLanguage(code); localStorage.setItem('lang', code); setLangOpen(false) }
  const currentLang  = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  return (
    <header className="h-[52px] px-4 lg:px-5 flex items-center gap-3 shrink-0"
      style={{ background: 'var(--wood)', borderBottom: '3px solid var(--amber)' }}>

      <button onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: 'rgba(245,237,224,0.6)' }}>
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded flex items-center justify-center shrink-0"
          style={{ background: 'var(--amber)' }}>
          <span className="font-condensed" style={{ color: 'var(--wood-dark)', fontSize: 13, fontWeight: 700 }}>CR</span>
        </div>
        <span className="font-condensed font-bold hidden sm:block" style={{ fontSize: 17, color: 'var(--cream)', letterSpacing: '0.02em' }}>
          KalkulatorRoof
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Jazyk */}
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
  )
}
