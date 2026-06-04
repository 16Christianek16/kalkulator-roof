import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildRoofScene, buildBuilding, buildKrov } from '../../utils/roofGeometry3d'

const TYP_LABELS = {
  sedlova: 'Sedlová', valbova: 'Valbová', pultova: 'Pultová', stanova: 'Stanová',
  mansardova: 'Mansardová', pulvalbova: 'Půlvalbová', asymetricka: 'Asymetrická', pilova: 'Pilová',
}

const KROV_LEGENDA = [
  { color: '#2e1005', label: 'Hřebenová vaznice' },
  { color: '#4a2008', label: 'Pozednice' },
  { color: '#6b3010', label: 'Vaznice' },
  { color: '#7a4520', label: 'Sloupky' },
  { color: '#a05020', label: 'Krokve' },
  { color: '#d08840', label: 'Kleštiny' },
]

function addControls(camera, domEl, target = { x: 0, y: 3, z: 0 }) {
  let down = false, px = 0, py = 0
  let theta = 0.8, phi = 0.55, radius = 25

  const sync = () => {
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    )
    camera.lookAt(target.x, target.y, target.z)
  }

  const md = e => { down = true; px = e.clientX; py = e.clientY }
  const mm = e => {
    if (!down) return
    theta -= (e.clientX - px) * 0.007
    phi = Math.max(0.08, Math.min(1.45, phi + (e.clientY - py) * 0.007))
    px = e.clientX; py = e.clientY; sync()
  }
  const mu = () => { down = false }
  const mw = e => { radius = Math.max(4, Math.min(80, radius + e.deltaY * 0.05)); sync(); e.preventDefault() }
  const ts = e => { if (e.touches.length === 1) { down = true; px = e.touches[0].clientX; py = e.touches[0].clientY } }
  const tm = e => { if (!down || e.touches.length !== 1) return; e.preventDefault(); mm({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }) }
  const te = () => { down = false }

  domEl.addEventListener('mousedown', md)
  domEl.addEventListener('mousemove', mm)
  domEl.addEventListener('mouseup', mu)
  domEl.addEventListener('mouseleave', mu)
  domEl.addEventListener('wheel', mw, { passive: false })
  domEl.addEventListener('touchstart', ts, { passive: true })
  domEl.addEventListener('touchmove', tm, { passive: false })
  domEl.addEventListener('touchend', te)

  sync()

  return {
    setTarget(x, y, z) { target.x = x; target.y = y; target.z = z; sync() },
    setRadius(r) { radius = r; sync() },
    dispose() {
      domEl.removeEventListener('mousedown', md)
      domEl.removeEventListener('mousemove', mm)
      domEl.removeEventListener('mouseup', mu)
      domEl.removeEventListener('mouseleave', mu)
      domEl.removeEventListener('wheel', mw)
      domEl.removeEventListener('touchstart', ts)
      domEl.removeEventListener('touchmove', tm)
      domEl.removeEventListener('touchend', te)
    }
  }
}

export default function RoofPreview3D({
  typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi,
  krytina = 'bobrovka', roztecKrokvi = 900
}) {
  const mountRef = useRef(null)
  const stateRef = useRef({})
  const [viewMode, setViewMode] = useState('stecha')
  const [initError, setInitError] = useState(null)

  // ── Three.js setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    let renderer, raf, ro, controls

    try {
      const W = el.clientWidth || 600, H = el.clientHeight || 420

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.outputColorSpace = THREE.SRGBColorSpace
      el.appendChild(renderer.domElement)

      // Scene + sky
      const scene = new THREE.Scene()
      const skyC = document.createElement('canvas'); skyC.width = 2; skyC.height = 256
      const sc = skyC.getContext('2d')
      const grad = sc.createLinearGradient(0, 0, 0, 256)
      grad.addColorStop(0, '#1a4fa8'); grad.addColorStop(0.5, '#4a9fd4')
      grad.addColorStop(0.85, '#b0d8f0'); grad.addColorStop(1, '#ddeef8')
      sc.fillStyle = grad; sc.fillRect(0, 0, 2, 256)
      scene.background = new THREE.CanvasTexture(skyC)

      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500)
      controls = addControls(camera, renderer.domElement, { x: 0, y: 3, z: 0 })

      // Lights
      scene.add(new THREE.AmbientLight(0xcce8f4, 0.75))
      const sun = new THREE.DirectionalLight(0xfff8e8, 2.6)
      sun.position.set(16, 26, 12); sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 120
      sun.shadow.camera.left = -28; sun.shadow.camera.right = 28
      sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28
      sun.shadow.bias = -0.0005; scene.add(sun)
      const fill = new THREE.DirectionalLight(0x88b8d8, 0.55)
      fill.position.set(-10, 6, -8); scene.add(fill)

      // Ground
      const gC = document.createElement('canvas'); gC.width = 256; gC.height = 256
      const gc = gC.getContext('2d')
      gc.fillStyle = '#4a7a3e'; gc.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 2000; i++) {
        gc.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`
        gc.fillRect(Math.random() * 256, Math.random() * 256, 3, 4)
      }
      const gTex = new THREE.CanvasTexture(gC)
      gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping; gTex.repeat.set(10, 10)
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
        new THREE.MeshStandardMaterial({ map: gTex, roughness: 1 }))
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)

      const tick = () => { raf = requestAnimationFrame(tick); renderer.render(scene, camera) }
      tick()

      ro = new ResizeObserver(() => {
        const nw = el.clientWidth, nh = el.clientHeight
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh)
        }
      })
      ro.observe(el)

      stateRef.current = { scene, camera, controls, renderer }
    } catch (err) {
      console.error('[RoofPreview3D] Three.js init failed:', err)
      if (renderer) { try { renderer.dispose() } catch (_) {} }
      if (el && renderer?.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement)
      }
      setInitError(err instanceof Error ? err : new Error(String(err)))
      return
    }

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      controls?.dispose()
      if (renderer) {
        renderer.dispose()
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      }
      stateRef.current = {}
    }
  }, [])

  // ── Rebuild geometry ────────────────────────────────────────────────────────
  useEffect(() => {
    const { scene, camera, controls } = stateRef.current
    if (!scene) return

    // Cleanup
    scene.children.filter(c => c.userData.building).forEach(c => {
      scene.remove(c)
      c.traverse(o => { o.geometry?.dispose(); if (o.material) [o.material].flat().forEach(m => m.dispose()) })
    })

    const s  = parseFloat(sirka)    || 8
    const d  = parseFloat(delka)    || 12
    const wH = parseFloat(vyskaZdi) || 2.7

    const building = buildBuilding(s, d, wH)
    building.userData.building = true

    if (viewMode === 'krov') {
      building.children.forEach(child => {
        if (child.isMesh) {
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = 0.15
        }
      })
      scene.add(building)
      const krov = buildKrov(typ, s, d, sklon, presahOkap, presahStit, wH, roztecKrokvi)
      krov.userData.building = true
      scene.add(krov)
    } else {
      scene.add(building)
      const roof = buildRoofScene(typ, s, d, sklon, presahOkap, presahStit, wH, krytina)
      roof.userData.building = true
      scene.add(roof)
    }

    // Fit camera
    const maxDim = Math.max(d, s)
    const dist = maxDim * 1.6 + 9
    if (controls) {
      controls.setTarget(0, wH / 2 + 1, 0)
      controls.setRadius(dist)
    }
  }, [typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi, krytina, roztecKrokvi, viewMode])

  // All hooks above — propagate Three.js init errors to ErrorBoundary
  if (initError) throw initError

  return (
    <div className="relative w-full rounded-xl overflow-hidden select-none"
      style={{ height: 430, background: '#1a4fa8', cursor: 'grab' }}>
      <div ref={mountRef} className="w-full h-full" />

      {/* Přepínač pohledu */}
      <div className="absolute top-3 left-3 flex rounded-lg overflow-hidden"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <button onClick={() => setViewMode('stecha')}
          className="px-3 py-1.5 text-xs font-semibold"
          style={{ background: viewMode === 'stecha' ? '#f97316' : 'rgba(15,23,42,0.75)', color: '#fff' }}>
          🏠 Střecha
        </button>
        <button onClick={() => setViewMode('krov')}
          className="px-3 py-1.5 text-xs font-semibold"
          style={{ background: viewMode === 'krov' ? '#a05020' : 'rgba(15,23,42,0.75)', color: '#fff' }}>
          🪵 Krov
        </button>
      </div>

      {/* Info */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(15,23,42,0.65)', color: '#fff' }}>
        {TYP_LABELS[typ] || typ} · {sklon}°
      </div>

      {/* Legenda krov */}
      {viewMode === 'krov' && (
        <div className="absolute bottom-10 left-3 rounded-xl p-2.5 flex flex-col gap-1"
          style={{ background: 'rgba(15,23,42,0.80)' }}>
          {KROV_LEGENDA.map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.88)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-3 left-3 text-xs px-2.5 py-1 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.40)', color: 'rgba(255,255,255,0.82)' }}>
        🖱 Táhni pro rotaci · Kolečko pro zoom
      </div>
    </div>
  )
}
