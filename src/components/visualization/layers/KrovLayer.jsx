import { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useWoodMaterial } from '../materials/usePBRMaterial'

// Helper: sdílený dummy Object3D pro instancedMesh matice
const _dummy = new THREE.Object3D()
const _yUp   = new THREE.Vector3(0, 1, 0)

/**
 * Pomocná komponenta — instancedMesh s automatickým nastavením matic.
 * items = array { position: [x,y,z], quaternion?: THREE.Quaternion | rotation?: [rx,ry,rz], scale?: [sx,sy,sz] }
 */
function InstancedBeams({ geometry, material, items }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh || items.length === 0) return
    items.forEach((item, i) => {
      _dummy.position.set(...item.position)
      if (item.quaternion) {
        _dummy.quaternion.copy(item.quaternion)
      } else if (item.rotation) {
        _dummy.rotation.set(...item.rotation)
        _dummy.quaternion.setFromEuler(_dummy.rotation)
      } else {
        _dummy.quaternion.identity()
      }
      _dummy.scale.set(...(item.scale ?? [1, 1, 1]))
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items])

  if (items.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow>
    </instancedMesh>
  )
}

/**
 * KrovLayer — kompletní dřevěná krovová soustava.
 * Prvky: pozednice, krokve, hřebenová vaznice, středové vaznice, kleštiny, sloupky.
 */
export default function KrovLayer({ geo }) {
  const matLight = useWoodMaterial(false)  // světlé dřevo (krokve, pozednice)
  const matDark  = useWoodMaterial(true)   // tmavé dřevo (vaznice, hřeben)

  const {
    uhel_rad, hrebenVyska, sirkaSvahu, delkaKrokve,
    poziceKrokvi, wallHeight, delka, presahStit,
    dimKrokev, dimVaznice, dimPozednice,
    klestinyY, klestinyDelka,
    vaznicePosY, vaznicePosZ,
    hrebenY,
  } = geo

  // ── Geometrie prvků ──────────────────────────────────────────────────────────
  const geos = useMemo(() => {
    const kW = dimKrokev[0], kH = dimKrokev[1]
    const vW = dimVaznice[0], vH = dimVaznice[1]
    const pW = dimPozednice[0], pH = dimPozednice[1]

    return {
      // Krokev: BoxGeometry s délkou podél Y osy
      krokev:    new THREE.BoxGeometry(kW, delkaKrokve + 0.1, kH),
      // Pozednice: podél X osy (délka = celá délka budovy + přesahy)
      pozednice: new THREE.BoxGeometry(delka + 2 * presahStit, pH, pW),
      // Hřebenová vaznice: podél X
      hrebVaznice: new THREE.BoxGeometry(delka + 2 * presahStit + 0.2, vH, vW),
      // Středová vaznice
      stredVaznice: new THREE.BoxGeometry(delka + 2 * presahStit, vH * 0.9, vW * 0.75),
      // Kleština: podél Z osy, délka = vzdálenost mezi krokve obou stran
      klestina:  new THREE.BoxGeometry(kW * 0.75, kH * 0.9, klestinyDelka),
      // Sloupek pod hřebenovou vaznicí
      sloupek:   new THREE.BoxGeometry(0.12, hrebenVyska * 0.55, 0.12),
    }
  }, [delkaKrokve, delka, presahStit, dimKrokev, dimVaznice, dimPozednice, klestinyDelka, hrebenVyska])

  // ── Kvaterniony pro natočení krokví ─────────────────────────────────────────
  const quatPlusZ = useMemo(() => {
    // Krokev na +Z straně: osa Y → (0, sin(α), -cos(α)) [od okapu ke hřebenu]
    const dir = new THREE.Vector3(0, Math.sin(uhel_rad), -Math.cos(uhel_rad))
    return new THREE.Quaternion().setFromUnitVectors(_yUp, dir)
  }, [uhel_rad])

  const quatMinusZ = useMemo(() => {
    // Krokev na -Z straně: osa Y → (0, sin(α), +cos(α))
    const dir = new THREE.Vector3(0, Math.sin(uhel_rad), Math.cos(uhel_rad))
    return new THREE.Quaternion().setFromUnitVectors(_yUp, dir)
  }, [uhel_rad])

  // ── Krokve — instancedMesh ───────────────────────────────────────────────────
  const krokveItems = useMemo(() => {
    const items = []
    const midY  = wallHeight + hrebenVyska / 2      // střed krokve svisle
    const midZ  = sirkaSvahu / 2                     // střed krokve vodorovně

    poziceKrokvi.forEach(x => {
      // +Z strana (přední svah)
      items.push({ position: [x, midY, midZ],  quaternion: quatPlusZ  })
      // -Z strana (zadní svah)
      items.push({ position: [x, midY, -midZ], quaternion: quatMinusZ })
    })
    return items
  }, [poziceKrokvi, wallHeight, hrebenVyska, sirkaSvahu, quatPlusZ, quatMinusZ])

  // ── Kleštiny ─────────────────────────────────────────────────────────────────
  const klestinyItems = useMemo(() => poziceKrokvi.map(x => ({
    position: [x, klestinyY, 0],
    rotation: [0, 0, 0],
  })), [poziceKrokvi, klestinyY])

  // ── Sloupky — každé 3. pole pod hřebenovou vaznicí ──────────────────────────
  const sloupkyItems = useMemo(() => {
    const items = []
    const sloupkaTopY   = hrebenY - 0.08               // pod spodním lícem vaznice
    const sloupkaBotY   = wallHeight + 0.08             // nad horním lícem vazného trámu
    const sloupkaHeight = sloupkaTopY - sloupkaBotY
    if (sloupkaHeight < 0.1) return items

    poziceKrokvi.forEach((x, i) => {
      if (i % 3 !== 0) return
      items.push({ position: [x, (sloupkaTopY + sloupkaBotY) / 2, 0] })
    })
    return items
  }, [poziceKrokvi, hrebenY, wallHeight])

  const gSloupek = useMemo(() => {
    const top = hrebenY - 0.08
    const bot = wallHeight + 0.08
    const h   = Math.max(0.05, top - bot)
    return new THREE.BoxGeometry(0.12, h, 0.12)
  }, [hrebenY, wallHeight])

  return (
    <group name="krov">

      {/* ── Pozednice (2 ks) ──────────────────────────────────────────────── */}
      <mesh geometry={geos.pozednice} material={matLight} castShadow receiveShadow
        position={[0, wallHeight + dimPozednice[1] / 2, sirkaSvahu - dimPozednice[0] / 2]} />
      <mesh geometry={geos.pozednice} material={matLight} castShadow receiveShadow
        position={[0, wallHeight + dimPozednice[1] / 2, -(sirkaSvahu - dimPozednice[0] / 2)]} />

      {/* ── Krokve (instancedMesh) ─────────────────────────────────────────── */}
      <InstancedBeams geometry={geos.krokev} material={matLight} items={krokveItems} />

      {/* ── Hřebenová vaznice ─────────────────────────────────────────────── */}
      <mesh geometry={geos.hrebVaznice} material={matDark} castShadow receiveShadow
        position={[0, hrebenY + dimVaznice[1] / 2, 0]} />

      {/* ── Středové vaznice (2 × 2 ks) ───────────────────────────────────── */}
      {[-1, 1].map(sign => (
        <mesh key={sign} geometry={geos.stredVaznice} material={matDark} castShadow receiveShadow
          position={[0, vaznicePosY, sign * vaznicePosZ]} />
      ))}

      {/* ── Kleštiny (instancedMesh) ───────────────────────────────────────── */}
      <InstancedBeams geometry={geos.klestina} material={matLight} items={klestinyItems} />

      {/* ── Sloupky (instancedMesh) ────────────────────────────────────────── */}
      <InstancedBeams geometry={gSloupek} material={matDark} items={sloupkyItems} />

    </group>
  )
}
