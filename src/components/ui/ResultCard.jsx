export default function ResultCard({ label, value, unit, highlight, note }) {
  if (highlight) {
    return (
      <div className="rounded p-4" style={{ background: 'var(--wood)', border: '2px solid var(--amber)' }}>
        <p className="font-condensed font-bold uppercase mb-1.5" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(212,137,26,0.7)' }}>{label}</p>
        <div className="flex items-end gap-1.5">
          <span className="font-condensed text-2xl font-bold leading-none" style={{ color: 'var(--amber-light)' }}>{value}</span>
          {unit && <span className="text-sm mb-0.5" style={{ color: 'rgba(245,237,224,0.5)' }}>{unit}</span>}
        </div>
        {note && <p className="text-xs mt-1.5" style={{ color: 'rgba(245,237,224,0.5)' }}>{note}</p>}
      </div>
    )
  }

  return (
    <div className="rounded p-4 bg-white" style={{ border: '2px solid var(--cream3)' }}>
      <p className="font-condensed font-bold uppercase mb-1.5" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text3)' }}>{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="font-condensed text-xl font-bold leading-none" style={{ color: 'var(--text)' }}>{value}</span>
        {unit && <span className="text-sm mb-0.5" style={{ color: 'var(--text3)' }}>{unit}</span>}
      </div>
      {note && <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>{note}</p>}
    </div>
  )
}
