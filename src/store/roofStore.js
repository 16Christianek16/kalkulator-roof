import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delkaKrokve, vyskaHrebene, plochaSedlovaStecha, deg2rad, pocetMezerKrokvi, pocetKrokviStrany, skutecnaRoztecKrokvi } from '../utils/calculations'

export const useRoofStore = create(
  persist(
    (set, get) => ({
      // --- Základní parametry střechy ---
      typ:          'sedlova',
      sirka:        8,
      delka:        12,
      presahOkap:   0.6,
      presahStit:   0.4,
      sklon:        35,
      vyskaZdi:     3,
      roztecKrokvi: 900,
      krytina:      'bobrovka',

      // --- Settery ---
      setTyp:          (v) => set({ typ: v }),
      setKrytina:      (v) => set({ krytina: v }),
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
        return pocetKrokviStrany(delka, roztecKrokvi)
      },
      getSkutecnaRozted: () => {
        const { delka, roztecKrokvi } = get()
        return skutecnaRoztecKrokvi(delka, roztecKrokvi)
      },
    }),
    { name: 'roof-params-v1' }
  )
)
