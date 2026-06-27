import { useMemo, useEffect, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import KrovLayer      from './layers/KrovLayer'
import KrytinaLayer   from './layers/KrytinaLayer'
import KlempirinaLayer from './layers/KlempirinaLayer'
import { calculateRoofGeometry } from './geometry/roofGeometry'

/** Zdi budovy — jednoduchý Box s okny naznačenými jako tmavší plochy */
function ZdiDomu({ params, geo }) {
  const { rozpeti = 8, delka = 12 } = params
  const { wallHeight } = geo

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f0ece4',
    roughness: 0.85,
    metalness: 0,
  }), [])

  const brickMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c8b89a',
    roughness: 0.90,
    metalness: 0,
  }), [])

  return (
    <group name="zdi">
      {/* Sokl */}
      <mesh receiveShadow material={brickMat}
        position={[0, 0.22, 0]}>
        <boxGeometry args={[delka + 0.12, 0.44, rozpeti + 0.12]} />
      </mesh>
      {/* Hlavní zdi */}
      <mesh castShadow receiveShadow material={wallMat}
        position={[0, 0.44 + (wallHeight - 0.44) / 2, 0]}>
        <boxGeometry args={[delka, wallHeight - 0.44, rozpeti]} />
      </mesh>
      {/* Štítové trojúhelníky (zjednodušené — celé zdivo jako box) */}
      {/* Přesnější štíty by potřebovaly custom geometrii */}
    </group>
  )
}

/** Komponenta pro reset kamery — volána z vně přes ref */
function CameraController({ resetRef, defaultPos }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    resetRef.current = () => {
      camera.position.set(...defaultPos)
      camera.lookAt(0, defaultPos[1] * 0.4, 0)
      if (controls) controls.target.set(0, defaultPos[1] * 0.4, 0)
    }
  }, [resetRef, defaultPos, camera, controls])
  return null
}

/** Terén (travnatá plocha) */
function Terrain() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[80, 80, 4, 4]} />
      <meshStandardMaterial color="#5a8040" roughness={0.95} metalness={0} />
    </mesh>
  )
}

/** Hlavní 3D scéna — použij uvnitř Canvas */
function Scene({ roofParams, layers, typKrytiny, wireframe, cameraResetRef }) {
  const geo = useMemo(() => calculateRoofGeometry(roofParams), [roofParams])

  const { delka, wallHeight = 2.7 } = geo
  const camDist  = Math.max(delka, geo.rozpeti) * 1.4 + 8
  const camY     = wallHeight + geo.hrebenVyska + 4
  const defaultCamPos = [camDist * 0.7, camY, camDist * 0.7]

  return (
    <>
      {/* Osvětlení */}
      <ambientLight intensity={0.35} color="#cce8f4" />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />
      <hemisphereLight skyColor="#87CEEB" groundColor="#8B7355" intensity={0.45} />
      <directionalLight position={[-8, 8, -12]} intensity={0.35} color="#b0c8e8" />

      {/* Environment (odrazy na kovu) */}
      <Suspense fallback={null}>
        <Environment preset="sunset" background={false} />
      </Suspense>

      {/* Ovládání kamery */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[0, wallHeight / 2 + geo.hrebenVyska * 0.3, 0]}
      />

      {/* Reset kamery (interní) */}
      <CameraController resetRef={cameraResetRef} defaultPos={defaultCamPos} />

      {/* Orientační gizmo */}
      <GizmoHelper alignment="top-left" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.8} />
      </GizmoHelper>

      {/* Terén */}
      <Terrain />

      {/* Zdi domu */}
      <ZdiDomu params={roofParams} geo={geo} />

      {/* ── Vrstvy střechy ─────────────────────────────────────────── */}
      {layers.krov && (
        <Suspense fallback={null}>
          <KrovLayer geo={geo} />
        </Suspense>
      )}
      {layers.krytina && (
        <Suspense fallback={null}>
          <KrytinaLayer geo={geo} typKrytiny={typKrytiny} wireframe={wireframe} />
        </Suspense>
      )}
      {layers['klempírina'] && (
        <Suspense fallback={null}>
          <KlempirinaLayer geo={{ ...geo, prumerZlabu: 0.15, prumerSvodu: 0.10 }} wireframe={wireframe} />
        </Suspense>
      )}
    </>
  )
}

/**
 * RoofScene — Canvas wrapper.
 * Vykresluje celou 3D scénu s osvětlením, kamerou a vrstvami střechy.
 */
export default function RoofScene({ roofParams, layers, typKrytiny, wireframe, cameraResetRef, style }) {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 8, 12], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ background: '#1a3c6e', ...style }}
    >
      <Scene
        roofParams={roofParams}
        layers={layers}
        typKrytiny={typKrytiny}
        wireframe={wireframe}
        cameraResetRef={cameraResetRef}
      />
    </Canvas>
  )
}
