import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { buildRoofScene, buildBuilding, buildKrov, buildDormer, buildRoofWindow, buildKlempirsky } from '../../utils/roofGeometry3d'

const TYP_LABELS = {
  sedlova: 'Sedlová', valbova: 'Valbová', pultova: 'Pultová', stanova: 'Stanová',
  mansardova: 'Mansardová', pulvalbova: 'Půlvalbová', asymetricka: 'Asymetrická', pilova: 'Pilová',
  'tvar-L': 'Tvar L', 'tvar-T': 'Tvar T',
}

const KROV_LEGENDA = [
  { color: '#2e1005', label: 'Hřebenová vaznice' },
  { color: '#4a2008', label: 'Pozednice' },
  { color: '#6b3010', label: 'Vaznice' },
  { color: '#7a4520', label: 'Sloupky' },
  { color: '#a05020', label: 'Krokve' },
  { color: '#d08840', label: 'Kleštiny' },
]

const KLEMPIR_LEGENDA = [
  { color: '#8a9ba8', label: 'Žlaby + svody (zinek)' },
  { color: '#a07840', label: 'Kotlíky (měď)' },
  { color: '#778899', label: 'Střešní háky' },
  { color: '#606878', label: 'Oplechování komínu' },
  { color: '#4a5560', label: 'Hřebenový plech' },
  { color: '#3a4050', label: 'Závětrné listy' },
]

const KROV_LEGENDA_BY_TYP = {
  krokevni: [
    { color: '#4a2008', label: 'Pozednice' },
    { color: '#a05020', label: 'Krokve' },
    { color: '#d08840', label: 'Kleštiny' },
  ],
  hambalkovy: [
    { color: '#4a2008', label: 'Pozednice' },
    { color: '#a05020', label: 'Krokve' },
    { color: '#d08840', label: 'Hambalky' },
  ],
  'vaznicova-stoj': [
    { color: '#2e1005', label: 'Hřebenová vaznice' },
    { color: '#4a2008', label: 'Pozednice' },
    { color: '#6b3010', label: 'Vaznice' },
    { color: '#7a4520', label: 'Stojky' },
    { color: '#a05020', label: 'Krokve' },
    { color: '#d08840', label: 'Kleštiny' },
  ],
  'vaznicova-lez': [
    { color: '#2e1005', label: 'Hřebenová vaznice' },
    { color: '#4a2008', label: 'Pozednice' },
    { color: '#6b3010', label: 'Vaznice' },
    { color: '#7a4520', label: 'Vzpěry' },
    { color: '#a05020', label: 'Krokve' },
    { color: '#d08840', label: 'Kleštiny' },
  ],
  valbovy: [
    { color: '#2e1005', label: 'Hřebenová vaznice' },
    { color: '#4a2008', label: 'Pozednice' },
    { color: '#a05020', label: 'Krokve' },
    { color: '#d08840', label: 'Kleštiny' },
  ],
}

const KROV_TYP_LABELS = {
  krokevni: 'Prostý krov', hambalkovy: 'Hambalkový', 'vaznicova-stoj': 'Stojatá stolice',
  'vaznicova-lez': 'Ležatá stolice', valbovy: 'Valbový krov',
}

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
    getRadius() { return radius },
    getTheta() { return theta },
    setTheta(t) { theta = t; sync() },
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

// Promítne 3D bod do 2D souřadnic canvasu
function project(pos3, camera, W, H) {
  const v = new THREE.Vector3(...pos3).project(camera)
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 }
}

export default function RoofPreview3D({
  typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi,
  krytina = 'bobrovka', roztecKrokvi = 900, defaultView = 'stecha', krovTyp,
  vikyre = [], stresniOkna = [],
  kridloSirka = 4, kridloDelka = 6, kridloOffset = 0,
}) {
  const mountRef   = useRef(null)
  const stateRef   = useRef({})
  const colorRef   = useRef('#ffffff')
  const autoRotRef = useRef(null)

  const [viewMode,   setViewMode]   = useState(defaultView)
  const [roofColor,  setRoofColor]  = useState('#ffffff')
  const [initError,  setInitError]  = useState(null)
  const [dims,       setDims]       = useState(null)
  const [labelPos,   setLabelPos]   = useState([])
  const [showLabels, setShowLabels] = useState(true)

  // ── Three.js setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    let renderer, raf, ro, controls

    try {
      const W = el.clientWidth || 600, H = el.clientHeight || 420

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default', preserveDrawingBuffer: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.outputColorSpace = THREE.SRGBColorSpace
      el.appendChild(renderer.domElement)

      // Scene + sky gradient
      const scene = new THREE.Scene()
      const skyC = document.createElement('canvas'); skyC.width = 2; skyC.height = 256
      const sc = skyC.getContext('2d')
      const grad = sc.createLinearGradient(0, 0, 0, 256)
      grad.addColorStop(0,    '#1a4fa8')
      grad.addColorStop(0.45, '#4a9fd4')
      grad.addColorStop(0.80, '#b0d8f0')
      grad.addColorStop(1,    '#ddeef8')
      sc.fillStyle = grad; sc.fillRect(0, 0, 2, 256)
      scene.background = new THREE.CanvasTexture(skyC)

      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500)
      controls = addControls(camera, renderer.domElement, { x: 0, y: 3, z: 0 })

      // Světla
      scene.add(new THREE.AmbientLight(0xcce8f4, 0.80))
      const sun = new THREE.DirectionalLight(0xfff8e8, 2.8)
      sun.position.set(16, 26, 12); sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 140
      sun.shadow.camera.left = -35; sun.shadow.camera.right = 35
      sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35
      sun.shadow.bias = -0.0005
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0x88b8d8, 0.60)
      fill.position.set(-10, 6, -8); scene.add(fill)
      const back = new THREE.DirectionalLight(0xd0e8ff, 0.25)
      back.position.set(0, 4, -20); scene.add(back)

      // Terén
      const gC = document.createElement('canvas'); gC.width = 512; gC.height = 512
      const gc = gC.getContext('2d')
      gc.fillStyle = '#3d6e30'; gc.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 4000; i++) {
        const x = (Math.sin(i * 7.3) * 0.5 + 0.5) * 512
        const y = (Math.sin(i * 3.1) * 0.5 + 0.5) * 512
        const l = 30 + (Math.sin(i * 2.7) * 0.5 + 0.5) * 20
        gc.fillStyle = `hsl(120,40%,${l}%)`
        gc.fillRect(x, y, 2, 3)
      }
      for (let gy = 0; gy < 512; gy += 16) {
        gc.fillStyle = 'rgba(0,0,0,0.04)'
        gc.fillRect(0, gy, 512, 1)
      }
      const gTex = new THREE.CanvasTexture(gC)
      gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping
      gTex.repeat.set(12, 12)
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160, 4, 4),
        new THREE.MeshStandardMaterial({ map: gTex, roughness: 0.95 })
      )
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)

      // Animační smyčka
      let frameCount = 0
      const tick = () => {
        raf = requestAnimationFrame(tick)
        renderer.render(scene, camera)
        frameCount++

        if (frameCount % 5 === 0 && stateRef.current.labelPoints) {
          const { labelPoints, canvasW, canvasH } = stateRef.current
          const newPos = labelPoints.map(lp => {
            const p = project(lp.pos, camera, canvasW, canvasH)
            return { ...lp, screenX: p.x, screenY: p.y, behind: p.behind }
          })
          setLabelPos(newPos)
        }

        if (frameCount % 30 === 0 && stateRef.current.controls) {
          const r = stateRef.current.controls.getRadius()
          const showDetail = r < 35
          scene.traverse(obj => {
            if (obj.userData?.lod === 'detail') obj.visible = showDetail
          })
        }
      }
      tick()

      ro = new ResizeObserver(() => {
        const nw = el.clientWidth, nh = el.clientHeight
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh
          camera.updateProjectionMatrix()
          renderer.setSize(nw, nh)
          stateRef.current.canvasW = nw
          stateRef.current.canvasH = nh
        }
      })
      ro.observe(el)

      stateRef.current = { scene, camera, controls, renderer, canvasW: W, canvasH: H }

      // Auto-rotace při prvním načtení
      let rotStart = null
      const ROT_DURATION = 4000
      const startTheta = controls.getTheta()
      const autoRotate = (ts) => {
        if (!rotStart) rotStart = ts
        const elapsed = ts - rotStart
        if (elapsed < ROT_DURATION) {
          controls.setTheta(startTheta + (elapsed / ROT_DURATION) * Math.PI * 2)
          autoRotRef.current = requestAnimationFrame(autoRotate)
        } else {
          controls.setTheta(startTheta)
          autoRotRef.current = null
        }
      }
      autoRotRef.current = requestAnimationFrame(autoRotate)

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
      if (autoRotRef.current) cancelAnimationFrame(autoRotRef.current)
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

  // ── Rebuild geometrie ───────────────────────────────────────────────────────
  useEffect(() => {
    const { scene, camera, controls } = stateRef.current
    if (!scene) return

    scene.children.filter(c => c.userData.building).forEach(c => {
      scene.remove(c)
      c.traverse(o => { o.geometry?.dispose(); if (o.material) [o.material].flat().forEach(m => m.dispose()) })
    })

    const s  = parseFloat(sirka)    || 8
    const d  = parseFloat(delka)    || 12
    const wH = parseFloat(vyskaZdi) || 2.7
    const sl = parseFloat(sklon)    || 35
    const po = parseFloat(presahOkap) || 0.3
    const ps = parseFloat(presahStit) || 0.3
    const slRad = sl * Math.PI / 180
    const h = (s / 2) * Math.tan(slRad)

    const building = buildBuilding(s, d, wH, h)
    building.userData.building = true

    const roofParams = { sirka: s, delka: d, sklon: sl, presahOkap: po, wallHeight: wH }

    if (viewMode === 'krov') {
      scene.add(building)
      const krov = buildKrov(krovTyp || typ, s, d, sklon, presahOkap, presahStit, wH, roztecKrokvi)
      krov.userData.building = true
      scene.add(krov)
    } else {
      scene.add(building)
      const roof = buildRoofScene(
        typ, s, d, sklon, presahOkap, presahStit, wH, krytina, colorRef.current,
        { kridloSirka, kridloDelka, kridloOffset }
      )
      roof.userData.building = true
      scene.add(roof)

      // Vikýře
      if (Array.isArray(vikyre)) {
        vikyre.forEach(v => {
          try {
            const dg = buildDormer(v, roofParams)
            dg.userData.building = true
            scene.add(dg)
          } catch (e) { console.warn('buildDormer error', e) }
        })
      }

      // Střešní okna
      if (Array.isArray(stresniOkna)) {
        stresniOkna.forEach(o => {
          try {
            const og = buildRoofWindow(o, roofParams)
            og.userData.building = true
            scene.add(og)
          } catch (e) { console.warn('buildRoofWindow error', e) }
        })
      }

      // Klempířina
      if (viewMode === 'klempir') {
        try {
          const kl = buildKlempirsky(typ, s, d, sklon, presahOkap, presahStit, wH, roztecKrokvi, vikyre, krytina)
          kl.userData.building = true
          scene.add(kl)
        } catch (e) { console.warn('buildKlempirsky error', e) }
      }
    }

    // Kamera
    const maxDim = Math.max(d, s)
    const dist = maxDim * 1.6 + 9
    if (controls) {
      controls.setTarget(0, wH / 2 + 1, 0)
      controls.setRadius(dist)
    }

    // Dimenze pro popisky
    const hw = s / 2 + po
    const hd = d / 2 + ps
    const ridgeLen = ['sedlova','asymetricka','mansardova','pulvalbova'].includes(typ)
      ? d + 2 * ps
      : ['valbova'].includes(typ) ? Math.max(0.2, d - s) + 2 * ps : 0
    const slopeLen = Math.sqrt(hw * hw + h * h)

    setDims({ hrebenLen: ridgeLen.toFixed(1), sirkaStrechy: (s + 2*po).toFixed(1), vyska: h.toFixed(1), slopeLen: slopeLen.toFixed(1) })

    stateRef.current.labelPoints = [
      { id: 'ridge',  pos: [0, wH + h + 0.3, 0],  text: `Hřeben: ${ridgeLen > 0 ? ridgeLen.toFixed(1) : '—'} m` },
      { id: 'width',  pos: [0, wH, -(s/2 + po + 0.5)], text: `Šířka: ${(s + 2*po).toFixed(1)} m` },
      { id: 'height', pos: [hd + 0.4, wH + h / 2, 0], text: `Výška: ${h.toFixed(1)} m` },
      { id: 'slope',  pos: [hd / 2, wH + h / 2, -(hw / 2)], text: `Svah: ${slopeLen.toFixed(1)} m` },
    ]

  }, [typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi, krytina, roztecKrokvi, viewMode, krovTyp,
      vikyre, stresniOkna, kridloSirka, kridloDelka, kridloOffset])

  // ── Reakce na změnu barvy ───────────────────────────────────────────────────
  useEffect(() => {
    colorRef.current = roofColor
    const { scene } = stateRef.current
    if (!scene) return
    scene.children.filter(c => c.userData.building).forEach(c => {
      c.traverse(o => {
        if (o.isMesh && o.material?.map) {
          o.material.color = new THREE.Color(roofColor)
          o.material.needsUpdate = true
        }
      })
    })
  }, [roofColor])

  if (initError) throw initError

  // ── Screenshot ──────────────────────────────────────────────────────────────
  const handleScreenshot = useCallback(() => {
    const { renderer } = stateRef.current
    if (!renderer) return
    renderer.render(stateRef.current.scene, stateRef.current.camera)
    const url = renderer.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `strecha-${typ}-${Date.now()}.png`
    a.click()
  }, [typ])

  return (
    <div className="relative w-full rounded-xl overflow-hidden select-none"
      style={{ height: 430, background: '#1a4fa8', cursor: 'grab' }}>

      <div ref={mountRef} className="w-full h-full" />

      {/* Popisky rozměrů */}
      {showLabels && viewMode === 'stecha' && labelPos.map(lp => (
        !lp.behind && (
          <div key={lp.id}
            className="absolute pointer-events-none text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              left: lp.screenX, top: lp.screenY,
              transform: 'translate(-50%,-50%)',
              background: 'rgba(10,20,40,0.72)',
              color: '#e0f0ff',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}>
            {lp.text}
          </div>
        )
      ))}

      {/* Přepínač pohledu */}
      <div className="absolute top-3 left-3 flex rounded-lg overflow-hidden"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <button onClick={() => setViewMode('stecha')}
          className="px-3 py-1.5 text-xs font-semibold"
          style={{ background: viewMode === 'stecha' ? '#2563eb' : 'rgba(15,23,42,0.75)', color: '#fff' }}>
          🏠 Střecha
        </button>
        <button onClick={() => setViewMode('krov')}
          className="px-3 py-1.5 text-xs font-semibold"
          style={{ background: viewMode === 'krov' ? '#a05020' : 'rgba(15,23,42,0.75)', color: '#fff' }}>
          🪵 Krov
        </button>
        <button onClick={() => setViewMode('klempir')}
          className="px-3 py-1.5 text-xs font-semibold"
          style={{ background: viewMode === 'klempir' ? '#0e7490' : 'rgba(15,23,42,0.75)', color: '#fff' }}>
          🔩 Klempíř
        </button>
      </div>

      {/* Info + barva střechy */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(15,23,42,0.65)', color: '#fff' }}>
          {viewMode === 'krov' && krovTyp ? KROV_TYP_LABELS[krovTyp] || krovTyp : (TYP_LABELS[typ] || typ)} · {sklon}°
        </div>
        {viewMode === 'stecha' && (
          <label title="Barva střechy"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            style={{ background: 'rgba(15,23,42,0.65)', color: '#fff' }}>
            🎨
            <input type="color" value={roofColor}
              onChange={e => setRoofColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
              style={{ background: 'none' }} />
          </label>
        )}
      </div>

      {/* Tlačítka akcí */}
      <div className="absolute top-12 right-3 flex flex-col gap-1.5">
        <button onClick={handleScreenshot}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(15,23,42,0.72)', color: '#fff' }}
          title="Stáhnout jako PNG">
          📷
        </button>
        <button onClick={() => setShowLabels(v => !v)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: showLabels ? 'rgba(37,99,235,0.85)' : 'rgba(15,23,42,0.72)', color: '#fff' }}
          title="Zobrazit/skrýt rozměry">
          📐
        </button>
      </div>

      {/* Vikýře + okna badge */}
      {(viewMode === 'stecha' || viewMode === 'klempir') && (vikyre.length > 0 || stresniOkna.length > 0) && (
        <div className="absolute top-12 left-3 flex flex-col gap-1">
          {vikyre.length > 0 && (
            <div className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(15,23,42,0.72)', color: '#e0f0ff' }}>
              🏘 {vikyre.length} vikýř{vikyre.length > 1 ? 'e' : ''}
            </div>
          )}
          {stresniOkna.length > 0 && (
            <div className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(15,23,42,0.72)', color: '#e0f0ff' }}>
              🪟 {stresniOkna.length} okno{stresniOkna.length > 1 ? 'na' : ''}
            </div>
          )}
        </div>
      )}

      {/* Rozměry — textový přehled dole */}
      {dims && viewMode === 'stecha' && (
        <div className="absolute bottom-10 right-3 rounded-xl px-2.5 py-2 flex flex-col gap-0.5"
          style={{ background: 'rgba(10,20,40,0.72)' }}>
          {parseFloat(dims.hrebenLen) > 0 && (
            <div className="text-xs" style={{ color: 'rgba(200,220,255,0.90)' }}>
              ▬ Hřeben: <b>{dims.hrebenLen} m</b>
            </div>
          )}
          <div className="text-xs" style={{ color: 'rgba(200,220,255,0.90)' }}>
            ↔ Šířka: <b>{dims.sirkaStrechy} m</b>
          </div>
          <div className="text-xs" style={{ color: 'rgba(200,220,255,0.90)' }}>
            ↑ Výška: <b>{dims.vyska} m</b>
          </div>
          <div className="text-xs" style={{ color: 'rgba(200,220,255,0.90)' }}>
            ⟋ Svah: <b>{dims.slopeLen} m</b>
          </div>
        </div>
      )}

      {/* Legenda krov */}
      {viewMode === 'krov' && (
        <div className="absolute bottom-10 left-3 rounded-xl p-2.5 flex flex-col gap-1"
          style={{ background: 'rgba(15,23,42,0.80)' }}>
          {(KROV_LEGENDA_BY_TYP[krovTyp] || KROV_LEGENDA).map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.88)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legenda klempíř */}
      {viewMode === 'klempir' && (
        <div className="absolute bottom-10 left-3 rounded-xl p-2.5 flex flex-col gap-1"
          style={{ background: 'rgba(15,23,42,0.80)' }}>
          {KLEMPIR_LEGENDA.map(l => (
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
