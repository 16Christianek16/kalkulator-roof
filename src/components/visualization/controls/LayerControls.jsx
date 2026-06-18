import { krytinyOptions } from '../materials/materialConfig'

const VRSTVY = [
  { key: 'krov',       label: 'Krov',       icon: '🪵', color: '#92400e' },
  { key: 'krytina',    label: 'Krytina',    icon: '🏠', color: '#1e3a5f' },
  { key: 'klempírina', label: 'Klempířina', icon: '🔩', color: '#374151' },
]

/**
 * LayerControls — přepínač vrstev 3D vizualizace.
 * Fixně v pravém dolním rohu canvasu.
 */
export default function LayerControls({
  layers,
  onLayerToggle,
  typKrytiny,
  onKrytinaChange,
  onResetCamera,
  wireframe,
  onWireframeToggle,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        userSelect: 'none',
        zIndex: 10,
      }}
    >
      {/* Vrstva přepínače */}
      {VRSTVY.map(v => {
        const active = layers[v.key]
        return (
          <button
            key={v.key}
            onClick={() => onLayerToggle(v.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: active ? v.color : 'rgba(15,23,42,0.72)',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              minWidth: 120,
              transition: 'background 0.15s',
            }}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 10 }}>
              {active ? 'ON' : 'OFF'}
            </span>
          </button>
        )
      })}

      {/* Výběr krytiny (jen když je vrstva krytiny aktivní) */}
      {layers['krytina'] && (
        <select
          value={typKrytiny}
          onChange={e => onKrytinaChange(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            background: 'rgba(15,23,42,0.85)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {krytinyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Oddělovač */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '2px 0' }} />

      {/* Reset kamery */}
      <button
        onClick={onResetCamera}
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(15,23,42,0.72)',
          color: '#cbd5e1',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        📷 Reset kamery
      </button>

      {/* Wireframe toggle */}
      <button
        onClick={onWireframeToggle}
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          background: wireframe ? 'rgba(37,99,235,0.85)' : 'rgba(15,23,42,0.72)',
          color: '#cbd5e1',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        〰 Drátěný model
      </button>
    </div>
  )
}
