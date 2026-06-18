import { useState, useRef, useCallback, Suspense, lazy } from 'react'
import LayerControls from './controls/LayerControls'

// Lazy-load Canvas (Three.js je velký balíček)
const RoofScene = lazy(() => import('./RoofScene'))

const DEFAULT_LAYERS = {
  krov:       true,
  krytina:    true,
  'klempírina': true,
}

const DEFAULT_PARAMS = {
  rozpeti:          8.0,
  delka:            12.0,
  sklon:            35,
  previslost:       0.6,
  vzdalenostKrokvi: 0.9,
  wallHeight:       2.7,
  presahStit:       0.4,
  dimKrokev:        [0.08, 0.16],
  dimVaznice:       [0.16, 0.20],
  dimPozednice:     [0.14, 0.16],
}

/**
 * RoofVisualization — hlavní wrapper komponenta.
 * Spravuje stav vrstev, typ krytiny a wireframe mode.
 *
 * Props:
 *  roofParams  — parametry střechy (mergují se s DEFAULT_PARAMS)
 *  onLayerChange — callback při změně vrstev
 *  height      — výška canvasu (default 520px)
 *  style       — custom styl wrapperu
 */
export default function RoofVisualization({
  roofParams = {},
  onLayerChange,
  height = 520,
  style = {},
}) {
  const [layers,     setLayers]     = useState(DEFAULT_LAYERS)
  const [typKrytiny, setTypKrytiny] = useState('taskaBetonova')
  const [wireframe,  setWireframe]  = useState(false)

  const cameraResetRef = useRef(() => {})

  const mergedParams = { ...DEFAULT_PARAMS, ...roofParams }

  const handleLayerToggle = useCallback(key => {
    setLayers(prev => {
      const next = { ...prev, [key]: !prev[key] }
      onLayerChange?.(next)
      return next
    })
  }, [onLayerChange])

  const handleResetCamera = useCallback(() => {
    cameraResetRef.current?.()
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1a3c6e',
        ...style,
      }}
    >
      {/* Loading fallback */}
      <Suspense fallback={
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.6)', fontSize: 14,
        }}>
          ⏳ Načítám 3D scénu…
        </div>
      }>
        <RoofScene
          roofParams={mergedParams}
          layers={layers}
          typKrytiny={typKrytiny}
          wireframe={wireframe}
          cameraResetRef={cameraResetRef}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>

      {/* Ovládací panel (vrstvy + krytina + wireframe) */}
      <LayerControls
        layers={layers}
        onLayerToggle={handleLayerToggle}
        typKrytiny={typKrytiny}
        onKrytinaChange={setTypKrytiny}
        onResetCamera={handleResetCamera}
        wireframe={wireframe}
        onWireframeToggle={() => setWireframe(v => !v)}
      />

      {/* Hint text */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        fontSize: 11, color: 'rgba(255,255,255,0.65)',
        background: 'rgba(0,0,0,0.35)', borderRadius: 6,
        padding: '4px 8px', pointerEvents: 'none',
      }}>
        🖱 Táhni pro rotaci · Kolečko zoom · Pravé tlačítko posun
      </div>
    </div>
  )
}
