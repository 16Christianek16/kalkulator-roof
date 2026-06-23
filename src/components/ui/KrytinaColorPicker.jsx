import { useState } from 'react'
import { BARVY_KRYTINY } from '../../utils/krytinaColors'

/**
 * Panel výběru barvy krytiny — 9 reálných odstínů tašek.
 * Klikem se okamžitě (bez reloadu) změní barva na střeše v 3D náhledu.
 */
export default function KrytinaColorPicker({ value, onChange }) {
  const [hoverHex, setHoverHex] = useState(null)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1e3a5f' }}>
        Barva krytiny
      </p>
      <div className="grid grid-cols-9 gap-2 sm:gap-3">
        {BARVY_KRYTINY.map(b => {
          const active = value === b.hex
          const hovered = hoverHex === b.hex
          return (
            <button key={b.hex}
              type="button"
              title={b.nazev}
              onClick={() => onChange(b.hex)}
              onMouseEnter={() => setHoverHex(b.hex)}
              onMouseLeave={() => setHoverHex(null)}
              className="flex flex-col items-center gap-1"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: b.hex,
                  border: active ? '3px solid #2563eb' : '2px solid #e2e8f0',
                  boxShadow: active ? '0 0 0 2px rgba(37,99,235,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
                  transform: hovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease, border 0.15s ease',
                  display: 'block',
                }}
              />
              <span
                className="text-[10px] text-center leading-tight"
                style={{
                  color: active ? '#1d4ed8' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  maxWidth: 56,
                }}>
                {b.nazev}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
