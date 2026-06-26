export default function SelectField({ label, value, onChange, options, grouped }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-condensed font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text3)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select-field"
      >
        {grouped
          ? options.map(group => (
              <optgroup key={group.kategorie} label={group.kategorie}>
                {group.items.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))
          : options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
        }
      </select>
    </div>
  )
}
