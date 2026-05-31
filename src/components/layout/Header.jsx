import { Menu, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Header({ onMenuToggle }) {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const initials = user?.jmeno
    ? user.jmeno.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }

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
