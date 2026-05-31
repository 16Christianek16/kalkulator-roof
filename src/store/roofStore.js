import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delkaKrokve, vyskaHrebene, plochaSedlovaStecha, deg2rad } from '../utils/calculations'

export const useRoofStore = create(
  persist(
    (set, get) => ({
      // --- Základní parametry střechy ---
      typ:          'sedlova',  // sedlova | valbova | pultova | stanova
      sirka:        8,          // m — šířka budovy
      delka:        12,         // m — délka budovy
      presahOkap:   0.6,        // m — okapní přesah (ve směru šířky)
      presahStit:   0.4,        // m — štítový přesah (ve směru délky)
      sklon:        35,         // ° — sklon střechy
      vyskaZdi:     3,          // m — výška zdiva
      roztecKrokvi: 900,        // mm — rozteč krokví

      // --- Settery ---
      setTyp:          (v) => set({ typ: v }),
      setSirka:        (v) => set({ sirka: parseFloat(v) || 8 }),
      setDelka:        (v) => set({ delka: parseFloat(v) || 12 }),
      setPresahOkap:   (v) => set({ presahOkap: parseFloat(v) || 0 }),
      setPresahStit:   (v) => set({ presahStit: parseFloat(v) || 0 }),
      setSklon:        (v) => set({ sklon: parseFloat(v) || 35 }),
      setVyskaZdi:     (v) => set({ vyskaZdi: parseFloat(v) || 3 }),
      setRoztecKrokvi: (v) => set({ roztecKrokvi: parseFloat(v) || 900 }),

      // --- Odvozené hodnoty (computed) ---
      getDelkaKrokve: () => {
        const { sirka, sklon, presahOkap } = get()
        return delkaKrokve(sirka, sklon) + presahOkap
      },
      getVyskaHrebene: () => {
        const { sirka, sklon } = get()
        return vyskaHrebene(sirka, sklon)
      },
      getPlocha: () => {
        const { sirka, delka, sklon, presahOkap, presahStit } = get()
        return plochaSedlovaStecha(sirka + 2 * presahOkap, delka + 2 * presahStit, sklon)
      },
      getPocetKrokvi: () => {
        const { delka, roztecKrokvi } = get()
        const rozm = roztecKrokvi / 1000
        const nMezery = Math.max(1, Math.round(delka / rozm))
        return nMezery + 1
      },
      getSkutecnaRozted: () => {
        const { delka, roztecKrokvi } = get()
        const rozm = roztecKrokvi / 1000
        const nMezery = Math.max(1, Math.round(delka / rozm))
        return (delka / nMezery) * 1000  // mm
      },
    }),
    { name: 'roof-params-v1' }
  )
)
