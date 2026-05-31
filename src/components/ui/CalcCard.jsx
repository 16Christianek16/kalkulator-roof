export default function CalcCard({ title, description, children }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
      {(title || description) && (
        <div className="px-5 py-3.5 border-b" style={{ borderColor: '#f1f5f9' }}>
          {title && <h3 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{title}</h3>}
          {description && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{description}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
