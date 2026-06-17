export default function ResultCard({ label, value, unit, highlight, note }) {
  if (highlight) {
    return (
      <div className="rounded-xl p-4"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
        <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold text-white leading-none">{value}</span>
          {unit && <span className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{unit}</span>}
        </div>
        {note && <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{note}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4 bg-white"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold leading-none" style={{ color: '#0f172a' }}>{value}</span>
        {unit && <span className="text-sm mb-0.5" style={{ color: '#94a3b8' }}>{unit}</span>}
      </div>
      {note && <p className="text-xs mt-1.5" style={{ color: '#94a3b8' }}>{note}</p>}
    </div>
  )
}
