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

      // --- L/T tvary — parametry křídla ---
      kridloSirka:  4,   // šířka přistavěného křídla (m)
      kridloDelka:  6,   // délka křídla (m)
      kridloOffset: 0,   // pro T: posunutí křídla od středu (-1..1)

      // --- Vikýře ---
      vikyre: [],
      // [ { id, typ: 'sedlovy'|'pultovy', sirka, vyska, poziceX, strana: 'predni'|'zadni' } ]

      // --- Střešní okna ---
      stresniOkna: [],
      // [ { id, sirka, vyska, poziceX, poziceSklon, strana: 'predni'|'zadni' } ]

      // --- Settery ---
      setTyp:           (v) => set({ typ: v }),
      setKrytina:       (v) => set({ krytina: v }),
      setSirka:         (v) => set({ sirka: parseFloat(v) || 8 }),
      setDelka:         (v) => set({ delka: parseFloat(v) || 12 }),
      setPresahOkap:    (v) => set({ presahOkap: parseFloat(v) || 0 }),
      setPresahStit:    (v) => set({ presahStit: parseFloat(v) || 0 }),
      setSklon:         (v) => set({ sklon: parseFloat(v) || 35 }),
      setVyskaZdi:      (v) => set({ vyskaZdi: parseFloat(v) || 3 }),
      setRoztecKrokvi:  (v) => set({ roztecKrokvi: parseFloat(v) || 900 }),
      setKridloSirka:   (v) => set({ kridloSirka: parseFloat(v) || 4 }),
      setKridloDelka:   (v) => set({ kridloDelka: parseFloat(v) || 6 }),
      setKridloOffset:  (v) => set({ kridloOffset: parseFloat(v) || 0 }),

      // --- Vikýře CRUD ---
      addVikyf: (vikyf) => set(s => ({
        vikyre: [...s.vikyre, { id: Date.now(), typ: 'sedlovy', sirka: 1.5, vyska: 1.4, poziceX: 0, strana: 'predni', ...vikyf }]
      })),
      updateVikyf: (id, patch) => set(s => ({
        vikyre: s.vikyre.map(v => v.id === id ? { ...v, ...patch } : v)
      })),
      removeVikyf: (id) => set(s => ({ vikyre: s.vikyre.filter(v => v.id !== id) })),

      // --- Střešní okna CRUD ---
      addStresniOkno: (okno) => set(s => ({
        stresniOkna: [...s.stresniOkna, { id: Date.now(), sirka: 0.78, vyska: 0.98, poziceX: 0, poziceSklon: 0.45, strana: 'predni', ...okno }]
      })),
      updateStresniOkno: (id, patch) => set(s => ({
        stresniOkna: s.stresniOkna.map(o => o.id === id ? { ...o, ...patch } : o)
      })),
      removeStresniOkno: (id) => set(s => ({ stresniOkna: s.stresniOkna.filter(o => o.id !== id) })),

      // --- Odvozené hodnoty ---
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
    { name: 'roof-params-v2' }
  )
)
