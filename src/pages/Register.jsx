import { useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

export default function Register() {
  const [form, setForm] = useState({ jmeno: '', email: '', heslo: '', heslo2: '' })
  const [chyba, setChyba] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChyba('')

    if (form.heslo !== form.heslo2) {
      return setChyba('Hesla se neshodují')
    }
    if (form.heslo.length < 8) {
      return setChyba('Heslo musí mít alespoň 8 znaků')
    }

    setLoading(true)
    try {
      // 1. Registrace uživatele
      const regRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno: form.jmeno, email: form.email, heslo: form.heslo })
      })
      const regData = await regRes.json()
      if (!regRes.ok) throw new Error(regData.error)

      // 2. Vytvoření Stripe platební stránky
      const stripeRes = await fetch(`${API}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: regData.id, email: regData.email, jmeno: regData.jmeno })
      })
      const stripeData = await stripeRes.json()
      if (!stripeRes.ok) throw new Error(stripeData.error)

      // 3. Přesměrování na Stripe platební stránku
      window.location.href = stripeData.url

    } catch (err) {
      setChyba(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5ede0' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-amber-900">CalkulatorRoof</h1>
            <p className="text-sm text-amber-700/70 mt-1">Vytvořte si účet a začněte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Celé jméno</label>
              <input
                type="text"
                value={form.jmeno}
                onChange={e => setForm(f => ({ ...f, jmeno: e.target.value }))}
                required
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Jan Novák"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="vas@email.cz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Heslo</label>
              <input
                type="password"
                value={form.heslo}
                onChange={e => setForm(f => ({ ...f, heslo: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="min. 8 znaků"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Heslo znovu</label>
              <input
                type="password"
                value={form.heslo2}
                onChange={e => setForm(f => ({ ...f, heslo2: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="••••••••"
              />
            </div>

            {chyba && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {chyba}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              Po registraci budete přesměrováni na platební stránku.<br />
              <strong>20 € / měsíc</strong> — zrušení kdykoliv.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold
                         transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Přesměrovávám na platbu...' : 'Registrovat a zaplatit →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-amber-700/70">
            Již máte účet?{' '}
            <Link to="/login" className="font-medium text-amber-700 hover:underline">
              Přihlásit se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
