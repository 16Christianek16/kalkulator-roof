import { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { usePBRMaterial, useRidgeMaterial } from '../materials/usePBRMaterial'
import { materialConfig } from '../materials/materialConfig'

const _dummy = new THREE.Object3D()

/**
 * KrytinaLayer — střešní krytina s hřebenáči a krajovými prvky.
 * Používá instancedMesh pro stovky tašek / panelů.
 *
 * Systém souřadnic svahu (pro stranu +Z):
 *  - v=0 → hřeben (z=0, y=wallHeight+hrebenVyska)
 *  - v=1 → okap   (z=sirkaSvahu, y=wallHeight)
 */
export default function KrytinaLayer({ geo, typKrytiny = 'taskaBetonova', wireframe = false }) {
  const cfg = materialConfig[typKrytiny] ?? materialConfig.taskaBetonova

  const tileMat  = usePBRMaterial(typKrytiny)
  const ridgeMat = useRidgeMaterial(typKrytiny)

  // Přepnutí wireframe
  if (wireframe) { tileMat.wireframe = true } else { tileMat.wireframe = false }

  const {
    uhel_rad, hrebenVyska, sirkaSvahu, delkaKrokve,
    wallHeight, delka, presahStit,
  } = geo

  // ── Normála sklonu (pro offset tašek nad rovinu) ─────────────────────────
  // Pro +Z stranu: outward normal = (0, cos(α), sin(α))
  const cosA = Math.cos(uhel_rad)
  const sinA = Math.sin(uhel_rad)

  // ── Dimenze tašky / panelu ───────────────────────────────────────────────
  const tileW = cfg.tileW       // šířka podél hřebene [m]
  const tileH = cfg.tileH || delkaKrokve  // výška podél svahu (pro plechy = celý svah)
  const tileT = cfg.tileT       // tloušťka [m]
  const overlap = cfg.tileOverlap  // přesah řad [m]

  // Pro plechové krytiny: jeden panel přes celý svah
  const isSheet = cfg.tileH === 0

  // ── Grid tašek ──────────────────────────────────────────────────────────
  const { tileItems, ridgeItems, vergeItems, totalCount } = useMemo(() => {
    const halfL = delka / 2 + presahStit  // polovina délky vč. přesahu
    const tileItems = []
    const ridgeItems = []
    const vergeItems = []

    if (isSheet) {
      // PLECHOVÉ KRYTINY: pásy podél celého svahu
      const panelW   = tileW   // šířka pásu
      const panelLen = delkaKrokve + 0.05  // délka pásu (celý svah)
      const nCols = Math.ceil((halfL * 2) / panelW) + 1

      for (let c = 0; c < nCols; c++) {
        const x = -halfL + c * panelW + panelW / 2
        // +Z strana
        tileItems.push({ x, sign: 1  })
        // -Z strana
        tileItems.push({ x, sign: -1 })
      }

      // Hřebenáče (překrývají oba svahy)
      const nRidge = Math.ceil((halfL * 2) / 0.5) + 1
      for (let r = 0; r < nRidge; r++) {
        ridgeItems.push(-halfL + r * 0.5)
      }

    } else {
      // TAŠKOVÉ KRYTINY: mřížka tašek
      const stepH   = tileH - overlap     // svahová vzdálenost řad (s přesahem)
      const nCols   = Math.ceil((halfL * 2) / tileW) + 1
      const nRows   = Math.ceil(delkaKrokve / stepH) + 1

      for (let c = 0; c < nCols; c++) {
        for (let r = 0; r < nRows; r++) {
          // Střídání šachovnicového vzoru (každá druhá řada odsazena o tileW/2)
          const xOff = (r % 2) * (tileW / 2)
          const x = -halfL + c * tileW + xOff + tileW / 2
          const v = r / (nRows - 1)  // 0 = hřeben, 1 = okap
          // +Z a -Z strana
          tileItems.push({ x, v, sign:  1 })
          tileItems.push({ x, v, sign: -1 })
        }
      }

      // Hřebenáče
      const nRidge = Math.ceil((halfL * 2) / 0.36) + 1
      for (let r = 0; r < nRidge; r++) {
        ridgeItems.push(-halfL + r * 0.36 + 0.18)
      }

      // Větrací taška — uprostřed každé strany
      vergeItems.push({ sign: 1 })
      vergeItems.push({ sign: -1 })
    }

    return {
      tileItems,
      ridgeItems,
      vergeItems,
      totalCount: tileItems.length,
    }
  }, [delka, presahStit, tileW, tileH, tileT, overlap, delkaKrokve, isSheet])

  // ── Geometrie tašky ─────────────────────────────────────────────────────
  const tileGeo = useMemo(() => {
    if (isSheet) {
      // Panel: šířka × svah (jako plocha)
      const g = new THREE.BoxGeometry(tileW, tileT, delkaKrokve + 0.05)
      return g
    } else {
      // Taška: zaoblená boxová forma
      const g = new THREE.BoxGeometry(tileW - 0.008, tileT, tileH)
      return g
    }
  }, [isSheet, tileW, tileT, tileH, delkaKrokve])

  // ── Geometrie hřebenáče ────────────────────────────────────────────────
  const ridgeGeo = useMemo(() => {
    // Půlválec (hřebenáč)
    const r = 0.08
    return new THREE.CylinderGeometry(r, r * 1.04, 0.38, 10, 1, false, -Math.PI / 2, Math.PI)
  }, [])

  // ── instancedMesh pro tašky ────────────────────────────────────────────
  const tileRef = useRef()
  useLayoutEffect(() => {
    const mesh = tileRef.current
    if (!mesh || tileItems.length === 0) return

    tileItems.forEach((item, i) => {
      if (isSheet) {
        // Panel: jeden kus na celý svah
        const sign = item.sign
        const z = sign * sirkaSvahu / 2     // střed panelu
        const y = wallHeight + hrebenVyska / 2 + cosA * (tileT / 2)
        _dummy.position.set(item.x, y, z)
        _dummy.rotation.set(sign * uhel_rad, 0, 0)
      } else {
        const sign = item.sign
        const v    = item.v
        const slopeZ = sign * (sirkaSvahu * v)
        const slopeY = wallHeight + hrebenVyska * (1 - v)
        // Offset nad povrch sklonu
        const offY = cosA * (tileT / 2)
        const offZ = sinA * (tileT / 2) * sign
        _dummy.position.set(item.x, slopeY + offY, slopeZ + offZ)
        _dummy.rotation.set(sign * uhel_rad, 0, 0)
      }
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [tileItems, isSheet, wallHeight, hrebenVyska, sirkaSvahu, uhel_rad, cosA, sinA, tileT])

  // ── instancedMesh pro hřebenáče ───────────────────────────────────────
  const ridgeRef = useRef()
  useLayoutEffect(() => {
    const mesh = ridgeRef.current
    if (!mesh) return
    const rY = wallHeight + hrebenVyska + 0.05   // mírně nad hřebenem

    ridgeItems.forEach((x, i) => {
      _dummy.position.set(x, rY, 0)
      _dummy.rotation.set(0, 0, Math.PI / 2)  // osa válce = X
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [ridgeItems, wallHeight, hrebenVyska])

  return (
    <group name="krytina">

      {/* ── Tašky / panely (instancedMesh) ───────────────────────────────── */}
      {tileItems.length > 0 && (
        <instancedMesh ref={tileRef} args={[tileGeo, tileMat, tileItems.length]} castShadow receiveShadow>
        </instancedMesh>
      )}

      {/* ── Hřebenáče (instancedMesh) ────────────────────────────────────── */}
      {ridgeItems.length > 0 && (
        <instancedMesh ref={ridgeRef} args={[ridgeGeo, ridgeMat, ridgeItems.length]} castShadow receiveShadow>
        </instancedMesh>
      )}

      {/* ── Štítová (větrací) taška — uprostřed každé plochy ────────────── */}
      {!isSheet && vergeItems.map((item, i) => {
        const sign = item.sign
        const v    = 0.50   // 50 % svahu
        const x    = 0      // střed
        const slopeZ = sign * sirkaSvahu * v
        const slopeY = wallHeight + hrebenVyska * (1 - v) + cosA * (tileT * 3)
        return (
          <mesh key={i}
            geometry={new THREE.BoxGeometry(tileW * 1.1, tileT * 2.5, tileH * 0.8)}
            material={ridgeMat}
            position={[x, slopeY, slopeZ]}
            rotation={[sign * uhel_rad, 0, 0]}
            castShadow receiveShadow />
        )
      })}

      {/* ── Krajové tašky (štítové) — první a poslední sloupec ───────────── */}
      {!isSheet && [-1, 1].map(xSide =>
        [-1, 1].map(zSide => {
          const x = xSide * (delka / 2 + presahStit - tileW / 2)
          const v = 0.45
          const sign = zSide
          const slopeZ = sign * sirkaSvahu * v
          const slopeY = wallHeight + hrebenVyska * (1 - v) + cosA * tileT * 2
          return (
            <mesh key={`${xSide}-${zSide}`}
              geometry={new THREE.BoxGeometry(tileW, tileT * 2, tileH * 0.9)}
              material={ridgeMat}
              position={[x, slopeY, slopeZ]}
              rotation={[sign * uhel_rad, 0, 0]}
              castShadow receiveShadow />
          )
        })
      )}

    </group>
  )
}
