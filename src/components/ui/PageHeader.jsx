export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div className="mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4">
      {Icon && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
          <Icon size={18} className="text-white" />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: '#0f172a' }}>{title}</h2>
        {description && <p className="text-xs sm:text-sm mt-0.5 line-clamp-2" style={{ color: '#64748b' }}>{description}</p>}
      </div>
    </div>
  )
}
