import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API = import.meta.env.VITE_API_URL || 'https://kalkulator-roof-backend-production.up.railway.app/api'

async function parseJson(res) {
  const text = await res.text()
  try { return JSON.parse(text) }
  catch { throw new Error(`Neplatná odpověď serveru (HTTP ${res.status}): ${text.slice(0, 100)}`) }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, heslo) => {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, heslo })
        })
        const data = await parseJson(res)
        if (!res.ok) throw new Error(data.error || 'Chyba přihlášení')
        set({ token: data.token, user: data.user })
        return data.user
      },

      logout: () => set({ token: null, user: null }),

      fetchMe: async () => {
        const token = get().token
        if (!token) return
        try {
          const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!res.ok) { set({ token: null, user: null }); return }
          const user = await parseJson(res)
          set({ user })
        } catch {
          // při chybě sítě necháme uživatele přihlášeného
        }
      },

      // Pomocná funkce pro autorizované fetch požadavky
      authFetch: (url, options = {}) => {
        const token = get().token
        return fetch(`${API}${url}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
          }
        })
      }
    }),
    { name: 'auth-storage', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
