import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SyncBanner({ to = '/strechy/pudorys', label = 'Parametry sdíleny s půdorysem střechy' }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-5 text-xs"
      style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#f97316' }} />
      <span className="font-medium">{label}</span>
      <Link to={to} className="ml-auto flex items-center gap-1 font-semibold hover:underline shrink-0" style={{ color: '#ea580c' }}>
        Upravit <ArrowRight size={11} />
      </Link>
    </div>
  )
}
