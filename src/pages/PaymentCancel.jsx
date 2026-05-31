import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5ede0' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-100 text-center">
          <div className="flex justify-center mb-4">
            <XCircle size={56} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Platba zrušena</h1>
          <p className="text-amber-700/70 text-sm mb-6">
            Platba nebyla dokončena. Váš účet zatím není aktivní.
            Kdykoliv se můžete vrátit a registraci dokončit.
          </p>
          <Link
            to="/registrace"
            className="block w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors text-center mb-3"
          >
            Zkusit znovu
          </Link>
          <Link
            to="/login"
            className="block w-full py-2.5 rounded-lg border border-amber-300 hover:bg-amber-50 text-amber-800 font-medium transition-colors text-center text-sm"
          >
            Zpět na přihlášení
          </Link>
        </div>
      </div>
    </div>
  )
}
