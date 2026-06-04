import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildRoofScene, buildBuilding } from '../../utils/roofGeometry3d'

function createSkyTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = 1; canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0.0, '#1a4fa8')
  grad.addColorStop(0.5, '#4a9fd4')
  grad.addColorStop(0.85, '#a8d4ef')
  grad.addColorStop(1.0, '#e0eef8')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1, size)
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

export default function RoofPreview3D({ typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({})

  // Mount Three.js once
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const w = el.clientWidth  || 600
    const h = el.clientHeight || 420

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()

    // Sky sphere
    const skyGeo = new THREE.SphereGeometry(300, 32, 16)
    const skyTex = createSkyTexture()
    skyTex.mapping = THREE.EquirectangularReflectionMapping
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    skyMat.map.wrapS = THREE.RepeatWrapping
    skyMat.map.repeat.set(1, 1)
    const skySphere = new THREE.Mesh(skyGeo, skyMat)
    scene.add(skySphere)

    // Camera
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.2, 500)
    camera.position.set(22, 14, 20)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 5
    controls.maxDistance = 80
    controls.maxPolarAngle = Math.PI * 0.52
    controls.target.set(0, 3, 0)
    controls.update()

    // Lights
    const ambient = new THREE.AmbientLight(0xd4e8f8, 0.7)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.8)
    sun.position.set(18, 28, 14)
    sun.castShadow = true
    sun.shadow.mapSize.width  = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 1
    sun.shadow.camera.far  = 120
    sun.shadow.camera.left = -25
    sun.shadow.camera.right = 25
    sun.shadow.camera.top = 25
    sun.shadow.camera.bottom = -25
    sun.shadow.bias = -0.001
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x87ceeb, 0.6)
    fill.position.set(-12, 8, -10)
    scene.add(fill)

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(120, 120, 1, 1)
    const groundCanvas = document.createElement('canvas')
    groundCanvas.width = 512; groundCanvas.height = 512
    const gc = groundCanvas.getContext('2d')
    gc.fillStyle = '#3d6e3a'
    gc.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      gc.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`
      gc.fillRect(x, y, 2, 3)
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas)
    groundTex.wrapS = THREE.RepeatWrapping
    groundTex.wrapT = THREE.RepeatWrapping
    groundTex.repeat.set(12, 12)
    const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1, metalness: 0 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Animation loop
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth
      const nh = el.clientHeight
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
    })
    ro.observe(el)

    stateRef.current = { scene, renderer, camera, controls }

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  // Update building + roof when params change
  useEffect(() => {
    const { scene } = stateRef.current
    if (!scene) return

    // Remove old building objects
    const toRemove = scene.children.filter(c => c.userData.isBuilding)
    toRemove.forEach(c => {
      scene.remove(c)
      c.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose() })
          else { if (obj.material.map) obj.material.map.dispose(); obj.material.dispose() }
        }
      })
    })

    // Building walls
    const building = buildBuilding(sirka, delka, vyskaZdi)
    building.userData.isBuilding = true
    scene.add(building)

    // Roof
    const roof = buildRoofScene(typ, sirka, delka, sklon, presahOkap, presahStit, parseFloat(vyskaZdi) || 2.7)
    roof.userData.isBuilding = true
    scene.add(roof)

    // Auto-fit camera to building size
    const d = parseFloat(delka) || 12
    const s = parseFloat(sirka) || 8
    const maxDim = Math.max(d, s)
    const { camera, controls } = stateRef.current
    if (camera && controls) {
      const dist = maxDim * 1.8 + 8
      camera.position.set(dist * 0.9, dist * 0.6, dist * 0.8)
      controls.target.set(0, (parseFloat(vyskaZdi) || 2.7) / 2, 0)
      controls.update()
    }
  }, [typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi])

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 420, background: '#1a4fa8' }}>
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 text-xs font-medium px-2 py-1 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)' }}>
        🖱 Táhni pro rotaci · Kolečko pro přiblížení
      </div>
    </div>
  )
}
