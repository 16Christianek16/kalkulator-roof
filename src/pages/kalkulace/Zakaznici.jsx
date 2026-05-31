import { useState } from 'react'
import { BarChart2, Plus, Trash2, User } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import { useAppStore } from '../../store/appStore'

const emptyZakaznik = { jmeno: '', prijmeni: '', telefon: '', email: '', adresa: '', ico: '' }

export default function Zakaznici() {
  const { zakaznici, addZakaznik, deleteZakaznik } = useAppStore()
  const [form, setForm] = useState(emptyZakaznik)
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.jmeno) return
    addZakaznik(form)
    setForm(emptyZakaznik)
    setShowForm(false)
  }

  return (
    <div>
      <PageHeader title="Zákazníci" description="Evidence zákazníků a kontaktů" icon={BarChart2} />
      <div className="flex flex-col gap-5">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Nový zákazník
          </button>
        </div>

        {showForm && (
          <CalcCard title="Nový zákazník">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['jmeno', 'Jméno'], ['prijmeni', 'Příjmení / Firma'],
                ['telefon', 'Telefon'], ['email', 'E-mail'],
                ['adresa', 'Adresa'], ['ico', 'IČO'],
              ].map(([field, label]) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Uložit
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100">
                Zrušit
              </button>
            </div>
          </CalcCard>
        )}

        <CalcCard title={`Zákazníci (${zakaznici.length})`}>
          {zakaznici.length === 0 ? (
            <p className="text-slate-400 text-sm">Žádní zákazníci. Přidejte prvního zákazníka.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {zakaznici.map(z => (
                <div key={z.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{z.jmeno} {z.prijmeni}</p>
                      <p className="text-xs text-slate-500">{z.telefon} {z.email && `· ${z.email}`}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteZakaznik(z.id)} className="p-2 text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  )
}
