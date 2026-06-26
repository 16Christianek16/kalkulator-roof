export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div className="mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4">
      {Icon && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--amber)' }}>
          <Icon size={18} style={{ color: 'var(--wood-dark)' }} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="font-condensed text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text)' }}>{title}</h2>
        {description && <p className="text-xs sm:text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--text3)' }}>{description}</p>}
      </div>
    </div>
  )
}
