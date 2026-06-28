import { useLocation } from 'react-router-dom'
import { useRoofStore } from '../../store/roofStore'

const ROOF_ROUTE_PREFIXES = ['/strechy', '/tesarstvi', '/geometrie', '/pokryvacstvi', '/klempirsvi']

export default function Statusbar() {
  const { pathname } = useLocation()
  const { delka, sirka, getVyskaHrebene } = useRoofStore()

  const isRoofContext = ROOF_ROUTE_PREFIXES.some(p => pathname.startsWith(p))

  return (
    <footer className="h-6 px-3 lg:px-5 flex items-center gap-4 shrink-0 print:hidden"
      style={{ background: 'var(--wood-dark)', borderTop: '1px solid rgba(212,137,26,0.2)' }}>
      <span className="font-mono" style={{ fontSize: 10.5, color: 'rgba(245,237,224,0.45)' }}>
        {isRoofContext ? (
          <>X: {parseFloat(delka).toFixed(2)}&nbsp;&nbsp;Y: {parseFloat(sirka).toFixed(2)}&nbsp;&nbsp;Z: {getVyskaHrebene().toFixed(2)}</>
        ) : (
          <>KalkulatorRoof v1.0</>
        )}
      </span>
      <span style={{ color: 'rgba(212,137,26,0.3)' }}>|</span>
      <span className="font-mono" style={{ fontSize: 10.5, color: 'rgba(245,237,224,0.45)' }}>Měřítko 1:100</span>
      <div className="flex-1" />
      <span className="font-mono hidden sm:inline" style={{ fontSize: 10.5, color: 'rgba(245,237,224,0.3)' }}>
        © 2025 CalkulatorRoof
      </span>
    </footer>
  )
}
