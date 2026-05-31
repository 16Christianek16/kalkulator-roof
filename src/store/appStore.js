import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      zakazky: [],
      addZakazka: (z) => set(s => ({ zakazky: [...s.zakazky, { ...z, id: Date.now() }] })),
      updateZakazka: (id, data) => set(s => ({
        zakazky: s.zakazky.map(z => z.id === id ? { ...z, ...data } : z)
      })),
      deleteZakazka: (id) => set(s => ({ zakazky: s.zakazky.filter(z => z.id !== id) })),

      zakaznici: [],
      addZakaznik: (z) => set(s => ({ zakaznici: [...s.zakaznici, { ...z, id: Date.now() }] })),
      updateZakaznik: (id, data) => set(s => ({
        zakaznici: s.zakaznici.map(z => z.id === id ? { ...z, ...data } : z)
      })),
      deleteZakaznik: (id) => set(s => ({ zakaznici: s.zakaznici.filter(z => z.id !== id) })),

      sklad: [],
      addSkladItem: (item) => set(s => ({ sklad: [...s.sklad, { ...item, id: Date.now() }] })),
      updateSkladItem: (id, data) => set(s => ({
        sklad: s.sklad.map(i => i.id === id ? { ...i, ...data } : i)
      })),
      deleteSkladItem: (id) => set(s => ({ sklad: s.sklad.filter(i => i.id !== id) })),

      dodavatel: { nazev: '', ico: '', dic: '', adresa: '', telefon: '', email: '', ucet: '' },
      saveDodavatel: (d) => set({ dodavatel: d }),

      doklady: [],
      addDoklad: (d) => set(s => ({ doklady: [{ ...d, id: Date.now() }, ...s.doklady] })),
      updateDoklad: (id, data) => set(s => ({
        doklady: s.doklady.map(d => d.id === id ? { ...d, ...data } : d)
      })),
      deleteDoklad: (id) => set(s => ({ doklady: s.doklady.filter(d => d.id !== id) })),
    }),
    { name: 'kalkulator-roof-storage' }
  )
)
