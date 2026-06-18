import { useMemo } from 'react'
import * as THREE from 'three'
import { useMetalMaterial } from '../materials/usePBRMaterial'
import { createGutterPath, getSvodPositions, getHookPositions } from '../geometry/klempirinaGeometry'

/**
 * KlempirinaLayer — klempířské prvky:
 * žlaby, háky žlabů, svody, kotlíky, závětrné listy, hřebenový plech.
 */
export default function KlempirinaLayer({ geo, wireframe = false }) {
  const prumerZlabu = geo.prumerZlabu ?? 0.15
  const prumerSvodu = geo.prumerSvodu ?? 0.10

  const matZinc   = useMetalMaterial('#8a9ba8')   // šedý zinek
  const matCopper = useMetalMaterial('#a07840')   // měď (kotlíky)
  const matDark   = useMetalMaterial('#4a5560')   // tmavý plech (závětrné listy)

  if (wireframe) matZinc.wireframe = true
  else matZinc.wireframe = false

  const { wallHeight, hrebenVyska, sirkaSvahu, delka, presahStit, uhel_rad } = geo

  const halfLen = delka / 2 + presahStit

  // ── Geometrie žlabu ─────────────────────────────────────────────────────
  // Půlkruhový žlab jako TubeGeometry s půlkruhovým průřezem
  const zlobGeo = useMemo(() => {
    const r = prumerZlabu / 2
    const path = new THREE.LineCurve3(
      new THREE.Vector3(-halfLen - 0.20, 0, 0),
      new THREE.Vector3( halfLen + 0.20, 0, 0)
    )
    // Vytvoříme půlkruhový průřez jako custom TubeGeometry
    // Alternativa: CylinderGeometry otočený horizontálně
    return new THREE.CylinderGeometry(r, r, halfLen * 2 + 0.40, 12, 1, false, 0, Math.PI)
  }, [halfLen, prumerZlabu])

  // ── Geometrie svodu ─────────────────────────────────────────────────────
  const svodH = wallHeight - 0.15  // délka svodu (od žlabu k terénu)
  const svodGeo = useMemo(() =>
    new THREE.CylinderGeometry(prumerSvodu / 2, prumerSvodu / 2, svodH, 10),
    [prumerSvodu, svodH]
  )

  // ── Geometrie kotlíku (trychtýř) ────────────────────────────────────────
  const kotlikGeo = useMemo(() =>
    new THREE.ConeGeometry(prumerZlabu / 2, 0.20, 10),
    [prumerZlabu]
  )

  // ── Geometrie háku žlabu ────────────────────────────────────────────────
  const hakGeo = useMemo(() =>
    new THREE.BoxGeometry(0.04, 0.04, 0.18),
    []
  )

  // ── Závětrné listy (štítové) ────────────────────────────────────────────
  // Šikmé plechy podél obou bočních hran střechy (štítů), natočené pod sklonem
  const zavetrneListo = useMemo(() => {
    const listLen = sirkaSvahu + 0.05  // délka listu po svahu
    return new THREE.BoxGeometry(0.06, 0.005, listLen)
  }, [sirkaSvahu])

  // ── Hřebenový plech ────────────────────────────────────────────────────
  const hrebenPlech = useMemo(() =>
    new THREE.BoxGeometry(halfLen * 2 + 0.20, 0.005, 0.24),
    [halfLen]
  )

  // Pozice svodů
  const svodPosPlus  = getSvodPositions(geo, 'pos')
  const svodPosMinus = getSvodPositions(geo, 'neg')

  // Pozice háků
  const hakPosPlus  = getHookPositions(geo, 'pos')
  const hakPosMinus = getHookPositions(geo, 'neg')

  const okapY    = wallHeight
  const hrebenY  = wallHeight + hrebenVyska

  return (
    <group name="klempírina">

      {/* ── Žlaby (2 ks — přední a zadní okap) ──────────────────────────── */}
      {[1, -1].map(sign => {
        const z = sign * sirkaSvahu
        // Žlab = půlkruhová trubka ležící vodorovně
        return (
          <mesh key={sign} geometry={zlobGeo} material={matZinc}
            position={[0, okapY - prumerZlabu / 2 - 0.02, z]}
            rotation={[sign > 0 ? Math.PI : 0, Math.PI / 2, 0]}
            castShadow receiveShadow />
        )
      })}

      {/* ── Háky žlabů ────────────────────────────────────────────────────── */}
      {[...hakPosPlus, ...hakPosMinus].map((hak, i) => (
        <mesh key={i} geometry={hakGeo} material={matZinc}
          position={[hak.x, hak.y, hak.z]}
          rotation={[Math.sign(hak.z) * (Math.PI / 2 - uhel_rad), 0, 0]}
          castShadow />
      ))}

      {/* ── Svody ─────────────────────────────────────────────────────────── */}
      {[...svodPosPlus, ...svodPosMinus].map((svod, i) => (
        <group key={i}>
          {/* Svodová roura */}
          <mesh geometry={svodGeo} material={matZinc}
            position={[svod.x, svodH / 2, svod.z]}
            castShadow receiveShadow />
          {/* Koleno / přechod nahoře */}
          <mesh
            geometry={new THREE.TorusGeometry(prumerSvodu / 2 + 0.02, prumerSvodu / 4, 8, 8, Math.PI / 3)}
            material={matZinc}
            position={[svod.x, okapY - prumerZlabu / 2 - 0.05, svod.z]}
            rotation={[Math.PI / 2, Math.sign(svod.z) * (-Math.PI / 6), 0]} />
        </group>
      ))}

      {/* ── Kotlíky (v místě napojení svodů) ─────────────────────────────── */}
      {[...svodPosPlus, ...svodPosMinus].map((svod, i) => (
        <mesh key={i} geometry={kotlikGeo} material={matCopper}
          position={[svod.x, okapY - prumerZlabu * 0.8, svod.z]}
          castShadow />
      ))}

      {/* ── Závětrné listy — podél obou štítových hran (±X) ──────────────── */}
      {[-1, 1].map(xSide =>
        [-1, 1].map(zSide => {
          const x     = xSide * halfLen
          const sign  = zSide
          // Střed listu: od hřebene dolů ke krajovému bodu okapu
          const midZ  = sign * sirkaSvahu / 2
          const midY  = wallHeight + hrebenVyska / 2
          // Rotace: list leží na svahu
          const rotX  = sign * uhel_rad
          return (
            <mesh key={`${xSide}-${zSide}`}
              geometry={zavetrneListo}
              material={matDark}
              position={[x, midY, midZ]}
              rotation={[rotX, 0, 0]}
              castShadow />
          )
        })
      )}

      {/* ── Hřebenový plech ────────────────────────────────────────────────── */}
      <mesh geometry={hrebenPlech} material={matDark}
        position={[0, hrebenY + 0.06, 0]}
        castShadow />

      {/* ── Nárožní lišty (kotevní plech) u spodního okraje hřebene ─────── */}
      {[-1, 1].map(sign => (
        <mesh key={sign}
          geometry={new THREE.BoxGeometry(halfLen * 2 + 0.20, 0.004, 0.10)}
          material={matZinc}
          position={[0, okapY + 0.01, sign * sirkaSvahu - sign * 0.05]}
          castShadow />
      ))}

    </group>
  )
}
