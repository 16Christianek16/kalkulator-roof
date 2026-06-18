import * as THREE from 'three'

/**
 * Vrací body pro žlab jako CatmullRomCurve3 podél okapní hrany.
 * Žlab přesahuje 20 cm za okraje budovy na obou stranách.
 */
export function createGutterPath(geo, side) {
  const sign = side === 'pos' ? 1 : -1
  const z = sign * geo.okapZ
  const overhang = 0.20  // přesah žlabu za budovu
  const x0 = -(geo.delka / 2 + geo.presahStit + overhang)
  const x1 =  (geo.delka / 2 + geo.presahStit + overhang)
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(x0, geo.okapY - 0.04, z),
    new THREE.Vector3(x1, geo.okapY - 0.04, z),
  ])
}

/**
 * Pozice svodů — 2 svody na každou stranu, nebo každých 10 m.
 */
export function getSvodPositions(geo, side) {
  const sign = side === 'pos' ? 1 : -1
  const z = sign * (geo.okapZ + 0.02)
  const halfL = geo.delka / 2 + geo.presahStit
  const positions = []

  if (geo.delka <= 12) {
    positions.push(-halfL + 0.3, halfL - 0.3)
  } else {
    const step = Math.min(10, geo.delka / 2)
    for (let x = -halfL + 0.3; x <= halfL - 0.3 + 0.01; x += step) {
      positions.push(x)
    }
  }
  return positions.map(x => ({ x, z, y: geo.okapY }))
}

/**
 * Pozice háků žlabu — každých 60 cm podél okapu.
 */
export function getHookPositions(geo, side) {
  const sign = side === 'pos' ? 1 : -1
  const z = sign * geo.okapZ
  const halfL = geo.delka / 2 + geo.presahStit
  const spacing = 0.60
  const count = Math.floor((halfL * 2) / spacing) + 1
  return Array.from({ length: count }, (_, i) => ({
    x: -halfL + i * spacing,
    y: geo.okapY - 0.02,
    z,
  }))
}
