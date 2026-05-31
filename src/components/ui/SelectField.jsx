export default function SelectField({ label, value, onChange, options, grouped }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</label>
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
