import { Menu, LogOut, ShieldCheck, Globe } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'

const LANGS = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

export default function Header({ onMenuToggle }) {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)

  const initials = user?.jmeno
    ? user.jmeno.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }

  const changeLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setLangOpen(false)
  }

  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  return (
    <header className="h-14 px-4 lg:px-6 flex items-center gap-3 shrink-0"
      style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>

      <button onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: '#64748b' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }} />
        <span className="text-sm font-bold hidden sm:block" style={{ color: '#0f172a' }}>CalkulatorRoof</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Přepínač jazyka */}
        <div className="relative">
          <button onClick={() => setLangOpen(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => { if (!langOpen) e.currentTarget.style.background = 'transparent' }}>
            <span className="text-base leading-none">{currentLang.flag}</span>
            <Globe size={13} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-10 z-50 rounded-xl shadow-lg border py-1 min-w-[140px]"
              style={{ background: '#fff', borderColor: '#e2e8f0' }}>
              {LANGS.map(l => (
                <button key={l.code} onClick={() => changeLang(l.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                  style={{
                    color: i18n.language === l.code ? '#f97316' : '#334155',
                    fontWeight: i18n.language === l.code ? 600 : 400,
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span className="text-base">{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {user?.role === 'admin' && (
          <Link to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}>
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ color: '#64748b' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            {initials}
          </div>
          {user && <span className="text-xs font-medium hidden md:block" style={{ color: '#0f172a' }}>{user.jmeno}</span>}
        </div>

        <button onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}>
          <LogOut size={14} />
          <span className="hidden sm:inline">Odhlásit</span>
        </button>
      </div>
    </header>
  )
}
