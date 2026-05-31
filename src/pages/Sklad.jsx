import { useState } from 'react'
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import CalcCard from '../components/ui/CalcCard'
import { useAppStore } from '../store/appStore'

const emptyItem = { nazev: '', mnozstvi: 0, jednotka: 'm²', minimum: 5, cena: 0, dodavatel: '' }

export default function Sklad() {
  const { sklad, addSkladItem, deleteSkladItem, updateSkladItem } = useAppStore()
  const [form, setForm] = useState(emptyItem)
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.nazev) return
    addSkladItem(form)
    setForm(emptyItem)
    setShowForm(false)
  }

  const podMinimem = sklad.filter(i => parseFloat(i.mnozstvi) < parseFloat(i.minimum))

  return (
    <div>
      <PageHeader title="Sklad materiálu" description="Evidence zásob a upozornění na minimum" icon={Package} />
      <div className="flex flex-col gap-5">
        {podMinimem.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Upozornění: pod minimální zásobou</p>
              <ul className="mt-1 text-sm text-orange-700">
                {podMinimem.map(i => (
                  <li key={i.id}>• {i.nazev} — zásoba: {i.mnozstvi} {i.jednotka} (min: {i.minimum} {i.jednotka})</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Přidat položku
          </button>
        </div>

        {showForm && (
          <CalcCard title="Nová skladová položka">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ['nazev', 'Název materiálu', 'text'],
                ['mnozstvi', 'Množství', 'number'],
                ['jednotka', 'Jednotka', 'text'],
                ['minimum', 'Minimální zásoba', 'number'],
                ['cena', 'Cena/jedn. (Kč)', 'number'],
                ['dodavatel', 'Dodavatel', 'text'],
              ].map(([f, l, t]) => (
                <div key={f} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{l}</label>
                  <input
                    type={t}
                    value={form[f]}
                    onChange={e => setForm(d => ({ ...d, [f]: e.target.value }))}
                    className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Uložit</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100">Zrušit</button>
            </div>
          </CalcCard>
        )}

        <CalcCard title={`Skladové zásoby (${sklad.length} položek)`}>
          {sklad.length === 0 ? (
            <p className="text-slate-400 text-sm">Sklad je prázdný. Přidejte první položku.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-2 text-slate-600 font-medium">Materiál</th>
                    <th className="pb-2 text-slate-600 font-medium text-right">Zásoba</th>
                    <th className="pb-2 text-slate-600 font-medium text-right">Min.</th>
                    <th className="pb-2 text-slate-600 font-medium text-right">Cena/jedn.</th>
                    <th className="pb-2 text-slate-600 font-medium">Dodavatel</th>
                    <th className="pb-2 text-slate-600 font-medium">Stav</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {sklad.map(item => {
                    const podMin = parseFloat(item.mnozstvi) < parseFloat(item.minimum)
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 font-medium text-slate-800">{item.nazev}</td>
                        <td className="py-2.5 text-right">
                          <input
                            type="number"
                            value={item.mnozstvi}
                            onChange={e => updateSkladItem(item.id, { mnozstvi: e.target.value })}
                            className="w-20 px-2 py-1 text-sm rounded border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="ml-1 text-slate-500">{item.jednotka}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{item.minimum} {item.jednotka}</td>
                        <td className="py-2.5 text-right text-slate-600">{item.cena ? `${item.cena} Kč` : '—'}</td>
                        <td className="py-2.5 text-slate-500">{item.dodavatel || '—'}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${podMin ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {podMin ? 'Pod min.' : 'OK'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <button onClick={() => deleteSkladItem(item.id)} className="p-1 text-slate-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
