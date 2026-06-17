import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

// Bezpečné parsování odpovědi — vrátí objekt nebo vyhodí smysluplnou chybu
async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ')
    throw new Error(`Server vrátil neplatnou odpověď (HTTP ${res.status}): ${preview}`)
  }
}

const prazdnyForm = {
  email: '', heslo: '', jmeno: '', role: 'user',
  predplatne: false, predplatne_do: ''
}

export default function Admin() {
  const authFetch = useAuthStore(s => s.authFetch)
  const [uzivatele, setUzivatele] = useState([])
  const [loading, setLoading] = useState(true)
  const [chyba, setChyba] = useState('')
  const [form, setForm] = useState(null)       // null = zavřený, objekt = editace/nový
  const [editId, setEditId] = useState(null)   // null = nový uživatel
  const [ukladam, setUkladam] = useState(false)
  const [mazuId, setMazuId] = useState(null)

  const nacistUzivatele = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/users')
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setUzivatele(data)
    } catch (err) {
      setChyba(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { nacistUzivatele() }, [])

  const otevritNovy = () => {
    setEditId(null)
    setForm({ ...prazdnyForm })
  }

  const otevritEditaci = (u) => {
    setEditId(u.id)
    setForm({
      email: u.email,
      heslo: '',
      jmeno: u.jmeno,
      role: u.role,
      predplatne: u.predplatne,
      predplatne_do: u.predplatne_do ? u.predplatne_do.slice(0, 10) : ''
    })
  }

  const ulozit = async () => {
    setUkladam(true)
    setChyba('')
    try {
      const body = { ...form, predplatne_do: form.predplatne_do || null }
      if (!body.heslo && editId) delete body.heslo
      const res = await authFetch(
        editId ? `/users/${editId}` : '/users',
        { method: editId ? 'PUT' : 'POST', body: JSON.stringify(body) }
      )
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setForm(null)
      nacistUzivatele()
    } catch (err) {
      setChyba(err.message)
    } finally {
      setUkladam(false)
    }
  }

  const smazat = async (id) => {
    setMazuId(id)
    try {
      const res = await authFetch(`/users/${id}`, { method: 'DELETE' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setUzivatele(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      setChyba(err.message)
    } finally {
      setMazuId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-900">Správa uživatelů</h1>
        <button
          onClick={otevritNovy}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={16} /> Nový uživatel
        </button>
      </div>

      {chyba && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex justify-between">
          {chyba}
          <button onClick={() => setChyba('')}><X size={14} /></button>
        </div>
      )}

      {/* Formulář */}
      {form && (
        <div className="mb-6 bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">{editId ? 'Upravit uživatele' : 'Nový uživatel'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Jméno" value={form.jmeno} onChange={v => setForm(f => ({ ...f, jmeno: v }))} />
            <FormField label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} disabled={!!editId} />
            <FormField label={editId ? 'Nové heslo (nechte prázdné pro beze změny)' : 'Heslo'} type="password" value={form.heslo} onChange={v => setForm(f => ({ ...f, heslo: v }))} />
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="user">Uživatel</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="predplatne"
                checked={form.predplatne}
                onChange={e => setForm(f => ({ ...f, predplatne: e.target.checked }))}
                className="w-4 h-4 accent-amber-600"
              />
              <label htmlFor="predplatne" className="text-sm font-medium text-amber-900">Aktivní předplatné</label>
            </div>
            <FormField label="Předplatné do (nechte prázdné = bez omezení)" type="date" value={form.predplatne_do} onChange={v => setForm(f => ({ ...f, predplatne_do: v }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={ulozit}
              disabled={ukladam}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Check size={14} /> {ukladam ? 'Ukládám...' : 'Uložit'}
            </button>
            <button
              onClick={() => { setForm(null); setChyba('') }}
              className="flex items-center gap-2 px-4 py-2 border border-amber-300 hover:bg-amber-50 text-amber-800 rounded-lg text-sm font-medium transition-colors"
            >
              <X size={14} /> Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Tabulka */}
      {loading ? (
        <p className="text-amber-700/60 text-center py-8">Načítám...</p>
      ) : (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/60">
                <th className="text-left px-4 py-3 text-amber-800 font-semibold">Jméno</th>
                <th className="text-left px-4 py-3 text-amber-800 font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-amber-800 font-semibold">Role</th>
                <th className="text-left px-4 py-3 text-amber-800 font-semibold">Předplatné</th>
                <th className="text-left px-4 py-3 text-amber-800 font-semibold">Platí do</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {uzivatele.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-amber-700/50">Žádní uživatelé</td></tr>
              )}
              {uzivatele.map(u => (
                <tr key={u.id} className="border-b border-amber-50 hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-amber-900">{u.jmeno}</td>
                  <td className="px-4 py-3 text-amber-800">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Uživatel'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.predplatne ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      {u.predplatne ? 'Aktivní' : 'Neaktivní'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-amber-700">
                    {u.predplatne_do ? new Date(u.predplatne_do).toLocaleDateString('cs-CZ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => otevritEditaci(u)}
                        className="p-1.5 rounded hover:bg-amber-100 text-amber-700 transition-colors"
                        title="Upravit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => smazat(u.id)}
                        disabled={mazuId === u.id}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-40"
                        title="Smazat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FormField({ label, type = 'text', value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-amber-800 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm
                   focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
