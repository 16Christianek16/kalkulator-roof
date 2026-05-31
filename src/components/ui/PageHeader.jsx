export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      {Icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
          <Icon size={20} className="text-white" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>{title}</h2>
        {description && <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{description}</p>}
      </div>
    </div>
  )
}
