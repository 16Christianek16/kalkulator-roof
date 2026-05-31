export default function InputField({ label, value, onChange, unit, type = 'number', min, max, step = 'any', hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</label>
      <div className="input-wrap">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
          style={{ color: '#0f172a' }}
        />
        {unit && (
          <span className="px-3 flex items-center text-xs font-medium shrink-0 border-l"
            style={{ background: '#f1f5f9', borderColor: '#e2e8f0', color: '#94a3b8', minWidth: '2.5rem' }}>
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}
