import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail]   = useState('')
  const [heslo, setHeslo]   = useState('')
  const [chyba, setChyba]   = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChyba('')
    setLoading(true)
    try {
      await login(email, heslo)
      navigate('/')
    } catch (err) {
      setChyba(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 shrink-0"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <span className="text-white text-sm font-black">CR</span>
          </div>
          <span className="text-white font-bold text-lg">CalkulatorRoof</span>
        </div>

        <div>
          <div className="flex flex-col gap-4 mb-8">
            {['Komplexní výpočty pro střechy', 'Automatická kalkulace zakázek', 'Generování nabídek a faktur'].map(t => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(37,99,235,0.2)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#2563eb' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{t}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2025 CalkulatorRoof · Profesionální nástroj pro stavební profese
          </p>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <span className="text-white text-xs font-black">CR</span>
              </div>
              <span className="font-bold text-base" style={{ color: '#0f172a' }}>CalkulatorRoof</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Přihlášení</h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Přihlaste se ke svému účtu</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Email</label>
              <div className="input-wrap">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoFocus placeholder="vas@email.cz"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                  style={{ color: '#0f172a' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#64748b' }}>Heslo</label>
              <div className="input-wrap">
                <input
                  type="password" value={heslo} onChange={e => setHeslo(e.target.value)}
                  required placeholder="••••••••"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                  style={{ color: '#0f172a' }}
                />
              </div>
            </div>

            {chyba && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                {chyba}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              {loading ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#64748b' }}>
            Nemáte účet?{' '}
            <Link to="/registrace" className="font-semibold hover:underline" style={{ color: '#2563eb' }}>
              Registrovat se (20 €/měs.)
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
