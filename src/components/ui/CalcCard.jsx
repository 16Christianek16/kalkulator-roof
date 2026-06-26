export default function CalcCard({ title, description, children }) {
  return (
    <div className="rounded overflow-hidden bg-white calc-card"
      style={{ border: '2px solid var(--cream3)' }}>
      {(title || description) && (
        <div className="px-4 sm:px-5 py-2.5" style={{ background: 'var(--wood-mid)' }}>
          {title && (
            <h3 className="font-condensed font-bold uppercase flex items-center justify-between"
              style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--cream)' }}>
              {title}
            </h3>
          )}
          {description && <p className="text-xs mt-0.5" style={{ color: 'rgba(245,237,224,0.55)' }}>{description}</p>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
