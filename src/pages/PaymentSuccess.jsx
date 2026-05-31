import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5ede0' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-100 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Platba proběhla úspěšně!</h1>
          <p className="text-amber-700/70 text-sm mb-6">
            Váš účet byl aktivován. Nyní se můžete přihlásit a začít používat CalkulatorRoof.
          </p>
          <Link
            to="/login"
            className="block w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors text-center"
          >
            Přihlásit se
          </Link>
        </div>
      </div>
    </div>
  )
}
