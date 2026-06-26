export default function InputField({ label, value, onChange, unit, type = 'number', min, max, step = 'any', hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-condensed font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text3)' }}>{label}</label>
      <div className="input-wrap">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
          style={{ color: 'var(--text)', fontWeight: 500 }}
        />
        {unit && (
          <span className="px-3 flex items-center font-condensed font-bold shrink-0 border-l"
            style={{ background: 'var(--cream3)', borderColor: 'var(--cream3)', color: 'var(--text3)', fontSize: 11, minWidth: '2.5rem' }}>
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: 'var(--text3)' }}>{hint}</p>}
    </div>
  )
}
