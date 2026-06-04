import * as THREE from 'three'
import { buildKrytinaMateriál } from './roofTextures'

// ─── Geometry helpers ────────────────────────────────────────────────────────
function quad(A, B, C, D) { return [...A, ...B, ...C, ...A, ...C, ...D] }
function tri(A, B, C)     { return [...A, ...B, ...C] }

function meshFrom(positions, material) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(positions), 3))
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ─── Wall texture ─────────────────────────────────────────────────────────────
function wallMaterial() {
  const SZ = 512
  const c = document.createElement('canvas'); c.width = SZ; c.height = SZ
  const x = c.getContext('2d')
  x.fillStyle = '#f2ead8'; x.fillRect(0, 0, SZ, SZ)
  for (let i = 0; i < 1500; i++) {
    x.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`
    x.fillRect(Math.random() * SZ, Math.random() * SZ, 3, 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 2)
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide })
}

// ─── Apply texture repeat ─────────────────────────────────────────────────────
// baseRepeat = opakování pro standardní střechu 10m délka / 5m svah
// Škálujeme lineárně podle skutečných rozměrů střechy
function applyRepeat(mat, slopeLen, ridgeLen) {
  const { baseRepeatX, baseRepeatY } = mat.userData
  if (!baseRepeatX) return
  const rX = baseRepeatX * (ridgeLen / 10.0)
  const rY = baseRepeatY * (slopeLen / 5.0)
  if (mat.map)       { mat.map.repeat.set(rX, rY);       mat.map.needsUpdate = true }
  if (mat.normalMap) { mat.normalMap.repeat.set(rX, rY); mat.normalMap.needsUpdate = true }
}

// ─── Main roof builder ────────────────────────────────────────────────────────
export function buildRoofScene(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 2.7, krytina = 'bobrovka') {
  const s  = Math.max(parseFloat(sirka)      || 8,   2)
  const d  = Math.max(parseFloat(delka)      || 12,  2)
  const po = Math.max(parseFloat(presahOkap) || 0.3, 0)
  const ps = Math.max(parseFloat(presahStit) || 0.3, 0)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const slRad = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180

  const h  = (s / 2) * Math.tan(slRad)
  const hw = s / 2 + po
  const hd = d / 2 + ps

  const BL = [-hd, wH, -hw]
  const FL = [ hd, wH, -hw]
  const FR = [ hd, wH,  hw]
  const BR = [-hd, wH,  hw]

  const slopeLen  = Math.sqrt(hw * hw + h * h)   // délka svahu
  const ridgeLen  = hd * 2                        // délka hřebene

  const mat  = buildKrytinaMateriál(krytina)
  applyRepeat(mat, slopeLen, ridgeLen)

  const wMat = wallMaterial()
  const group = new THREE.Group()
  let pos = []

  switch (typ) {
    case 'sedlova': {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      pos = [
        ...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR),
        ...tri(BL, RB, BR),       ...tri(FL, FR, RF),
      ]
      break
    }

    case 'asymetricka': {
      const shift = hw * 0.25, rH = h * 0.88
      const RB = [-hd, wH + rH, shift], RF = [hd, wH + rH, shift]
      pos = [
        ...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR),
        ...tri(BL, RB, BR),       ...tri(FL, FR, RF),
      ]
      break
    }

    case 'valbova': {
      const rx = Math.max(0, hd - hw)
      if (rx < 0.05) {
        const apex = [0, wH + h, 0]
        pos = [...tri(BL, FL, apex), ...tri(FL, FR, apex), ...tri(FR, BR, apex), ...tri(BR, BL, apex)]
      } else {
        const RB = [-rx, wH + h, 0], RF = [rx, wH + h, 0]
        pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR), ...tri(BL, RB, BR), ...tri(FL, FR, RF)]
      }
      break
    }

    case 'stanova': {
      const apex = [0, wH + h, 0]
      pos = [...tri(BL, FL, apex), ...tri(FL, FR, apex), ...tri(FR, BR, apex), ...tri(BR, BL, apex)]
      break
    }

    case 'pultova': {
      const hF = s * Math.tan(slRad)
      const Lo1 = [-hd, wH, hw], Lo2 = [hd, wH, hw]
      const Hi1 = [hd, wH + hF, -hw], Hi2 = [-hd, wH + hF, -hw]
      pos = [
        ...quad(Lo1, Lo2, Hi1, Hi2),
        ...tri(Lo1, Hi2, [-hd, wH, -hw]),
        ...tri(Lo2, [hd, wH, -hw], Hi1),
      ]
      break
    }

    case 'mansardova': {
      const lSlope = Math.min(slRad * 1.9, Math.PI * 0.43)
      const lFrac = 0.40, lHw = hw * lFrac, lH = lHw * Math.tan(lSlope)
      const uHw = hw - lHw, uH = uHw * Math.tan(slRad)
      const iY = wH + lH, iZn = -(hw - lHw), iZp = hw - lHw

      const IBL = [-hd, iY, iZn], IFL = [hd, iY, iZn]
      const IFR = [hd, iY, iZp], IBR = [-hd, iY, iZp]
      const RB = [-hd, iY + uH, 0], RF = [hd, iY + uH, 0]

      // Lower slopes (steeper) — same material, shorter slope
      const lMat = buildKrytinaMateriál(krytina)
      applyRepeat(lMat, lHw / Math.cos(lSlope), ridgeLen)
      group.add(meshFrom([
        ...quad(BL, FL, IFL, IBL), ...quad(BR, IBR, IFR, FR),
        ...quad(BL, IBL, IBR, BR), ...quad(FL, FR, IFR, IFL),
      ], lMat))

      // Upper slopes (shallower)
      applyRepeat(mat, uHw / Math.cos(slRad), ridgeLen)
      pos = [
        ...quad(IBL, IFL, RF, RB), ...quad(IBR, RB, RF, IFR),
        ...tri(IBL, RB, IBR),       ...tri(IFL, IFR, RF),
      ]
      break
    }

    case 'pulvalbova': {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      const kneeH = h  * 0.48
      const kneeZ = hw * (1 - 0.48)
      const KBL = [-hd, wH + kneeH, -kneeZ], KBR = [-hd, wH + kneeH,  kneeZ]
      const KFL = [ hd, wH + kneeH, -kneeZ], KFR = [ hd, wH + kneeH,  kneeZ]

      pos = [
        ...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR),
        ...tri(KBL, RB, KBR),     ...tri(KFL, KFR, RF),
      ]
      // Fill gable walls below knee with wall material
      group.add(meshFrom([
        ...quad([-hd, wH, -hw], KBL, KBR, [-hd, wH, hw]),
        ...quad([hd, wH, -hw], [hd, wH, hw], KFR, KFL),
      ], wMat))
      break
    }

    case 'pilova': {
      const N      = Math.max(2, Math.round((hd * 2) / Math.max(hw * 1.0, 1.5)))
      const toothW = (hd * 2) / N
      const toothH = hw * 1.3 * Math.tan(slRad)
      const slopePct = 0.70

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88bbdd, roughness: 0.08, metalness: 0.25,
        opacity: 0.72, transparent: true, side: THREE.DoubleSide,
      })

      for (let i = 0; i < N; i++) {
        const x0 = -hd + i * toothW
        const xM = x0 + toothW * slopePct
        const x1 = x0 + toothW
        pos.push(...quad([x0,wH,hw],[x0,wH,-hw],[xM,wH+toothH,-hw],[xM,wH+toothH,hw]))
        group.add(meshFrom(quad([xM,wH+toothH,hw],[xM,wH+toothH,-hw],[x1,wH,-hw],[x1,wH,hw]), glassMat.clone()))
      }
      for (let i = 0; i < N; i++) {
        const x0 = -hd + i * toothW
        const xM = x0 + toothW * slopePct
        const x1 = x0 + toothW
        pos.push(
          ...tri([x0,wH,-hw],[xM,wH+toothH,-hw],[x1,wH,-hw]),
          ...tri([x0,wH, hw],[x1,wH, hw],[xM,wH+toothH, hw]),
        )
      }
      break
    }

    default: {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR), ...tri(BL, RB, BR), ...tri(FL, FR, RF)]
    }
  }

  if (pos.length > 0) group.add(meshFrom(pos, mat))

  // Hřebenáč
  if (!['pultova', 'pilova', 'stanova'].includes(typ)) {
    const rY  = wH + (['mansardova'].includes(typ) ? h * 1.5 : h)
    const rx  = typ === 'valbova' ? Math.max(0.1, hd - hw) : typ === 'pulvalbova' ? hd - hd * 0.22 : hd
    const capMat = new THREE.MeshStandardMaterial({ color: 0x5a1800, roughness: 0.9 })
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, rx * 2, 6), capMat)
    cap.rotation.z = Math.PI / 2
    cap.position.set(0, rY + 0.08, 0)
    cap.castShadow = true
    group.add(cap)
  }

  return group
}

// ─── Krov (timber frame) ─────────────────────────────────────────────────────
const V3 = (x, y, z) => new THREE.Vector3(x, y, z)

function addBeam(group, mat, p1, p2, bw = 0.10, bh = 0.16) {
  const dir = new THREE.Vector3().subVectors(p2, p1)
  const len = dir.length()
  if (len < 0.05) return
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, len), mat)
  mesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5))
  mesh.setRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize())
  )
  mesh.castShadow = true
  group.add(mesh)
}

export function buildKrov(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 3, roztecKrokvi = 900) {
  const s   = Math.max(parseFloat(sirka)      || 8,   2)
  const d   = Math.max(parseFloat(delka)      || 12,  2)
  const po  = Math.max(parseFloat(presahOkap) || 0.5, 0)
  const ps  = Math.max(parseFloat(presahStit) || 0.3, 0)
  const wH  = Math.max(parseFloat(wallHeight) || 3,   1)
  const slRad = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180
  const roz = Math.max(0.4, (parseFloat(roztecKrokvi) || 900) / 1000)
  const h   = (s / 2) * Math.tan(slRad)

  // ── Barevné kódování prvků ──────────────────────────────────────────────────
  const mPoz    = new THREE.MeshStandardMaterial({ color: 0x4a2008, roughness: 0.85 })  // tmavě hnědá = pozednice
  const mKrokev = new THREE.MeshStandardMaterial({ color: 0xa05020, roughness: 0.80 })  // středně hnědá = krokve
  const mVaznice = new THREE.MeshStandardMaterial({ color: 0x6b3010, roughness: 0.85 }) // tmavší = vaznice
  const mKles   = new THREE.MeshStandardMaterial({ color: 0xd08840, roughness: 0.78 })  // světlá = kleštiny
  const mHreben = new THREE.MeshStandardMaterial({ color: 0x2e1005, roughness: 0.90 })  // nejtmavší = hřebenová vaznice
  const mSloupek = new THREE.MeshStandardMaterial({ color: 0x7a4520, roughness: 0.85 }) // sloupky

  const group = new THREE.Group()

  // Rozteč krokví
  const nMez = Math.max(1, Math.round(d / roz))
  const dRoz = d / nMez
  const krokvePosX = Array.from({ length: nMez + 1 }, (_, i) => -d / 2 + i * dRoz)

  const buildSedlova = (ridgeZ = 0, ridgeH = h, leftPo = po, rightPo = po) => {
    // Pozednice
    addBeam(group, mPoz, V3(-d/2, wH + 0.06, -s/2), V3(d/2, wH + 0.06, -s/2), 0.16, 0.12)
    addBeam(group, mPoz, V3(-d/2, wH + 0.06,  s/2), V3(d/2, wH + 0.06,  s/2), 0.16, 0.12)

    // Hřebenová vaznice
    addBeam(group, mHreben, V3(-d/2 - ps, wH + ridgeH, ridgeZ), V3(d/2 + ps, wH + ridgeH, ridgeZ), 0.12, 0.10)

    // Vaznice (mid-slope) pro delší krokve
    if (ridgeH > 2.2) {
      const vZ = (s / 2) * 0.55, vY = wH + ridgeH * 0.52
      addBeam(group, mVaznice, V3(-d/2, vY, -vZ + ridgeZ * 0.5), V3(d/2, vY, -vZ + ridgeZ * 0.5), 0.14, 0.10)
      addBeam(group, mVaznice, V3(-d/2, vY,  vZ + ridgeZ * 0.5), V3(d/2, vY,  vZ + ridgeZ * 0.5), 0.14, 0.10)
    }

    // Krokve + kleštiny
    krokvePosX.forEach(x => {
      addBeam(group, mKrokev, V3(x, wH, -(s/2 + leftPo)),  V3(x, wH + ridgeH, ridgeZ), 0.10, 0.16)
      addBeam(group, mKrokev, V3(x, wH,   s/2 + rightPo),  V3(x, wH + ridgeH, ridgeZ), 0.10, 0.16)
      // Kleštiny ve 2/3 výšky
      const klY = wH + ridgeH * 0.62
      const klZ = (s / 2) * 0.42 + Math.abs(ridgeZ) * 0.42
      addBeam(group, mKles, V3(x, klY, -klZ + ridgeZ * 0.62), V3(x, klY, klZ + ridgeZ * 0.62), 0.08, 0.12)
    })
  }

  switch (typ) {
    case 'sedlova':
    case 'pulvalbova':
      buildSedlova()
      break

    case 'asymetricka':
      buildSedlova(s * 0.10, h * 0.88)
      break

    case 'valbova': {
      const rx = Math.max(0.05, d / 2 - s / 2)
      // Pozednice (všechny 4 strany)
      addBeam(group, mPoz, V3(-d/2, wH+0.06, -s/2), V3(d/2, wH+0.06, -s/2), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2, wH+0.06,  s/2), V3(d/2, wH+0.06,  s/2), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2, wH+0.06, -s/2), V3(-d/2, wH+0.06, s/2),  0.16, 0.12)
      addBeam(group, mPoz, V3( d/2, wH+0.06, -s/2), V3( d/2, wH+0.06, s/2),  0.16, 0.12)

      if (rx > 0.2) addBeam(group, mHreben, V3(-rx, wH+h, 0), V3(rx, wH+h, 0), 0.12, 0.10)

      // Nárožní krokve
      ;[[-d/2,-s/2],[-d/2,s/2],[d/2,-s/2],[d/2,s/2]].forEach(([cx,cz]) => {
        const ridgeEnd = cx < 0 ? V3(-rx, wH+h, 0) : V3(rx, wH+h, 0)
        addBeam(group, mKrokev, V3(cx, wH+0.06, cz), ridgeEnd, 0.12, 0.18)
      })

      // Středové krokve
      krokvePosX.filter(x => x > -rx && x < rx).forEach(x => {
        addBeam(group, mKrokev, V3(x, wH, -(s/2+po)), V3(x, wH+h, 0), 0.10, 0.16)
        addBeam(group, mKrokev, V3(x, wH,  s/2+po),   V3(x, wH+h, 0), 0.10, 0.16)
        const klY = wH + h * 0.62
        addBeam(group, mKles, V3(x, klY, -(s/2)*0.42), V3(x, klY, (s/2)*0.42), 0.08, 0.12)
      })
      break
    }

    case 'stanova': {
      const apex = V3(0, wH + h, 0)
      ;[[-d/2,-s/2],[-d/2,s/2],[d/2,-s/2],[d/2,s/2]].forEach(([cx,cz]) =>
        addBeam(group, mKrokev, V3(cx, wH+0.06, cz), apex, 0.12, 0.18)
      )
      addBeam(group, mPoz, V3(-d/2,wH+0.06,-s/2), V3(d/2,wH+0.06,-s/2), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2,wH+0.06, s/2), V3(d/2,wH+0.06, s/2),  0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2,wH+0.06,-s/2), V3(-d/2,wH+0.06,s/2),  0.16, 0.12)
      addBeam(group, mPoz, V3( d/2,wH+0.06,-s/2), V3( d/2,wH+0.06,s/2),  0.16, 0.12)
      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, wH, -(s/2+po)), apex, 0.10, 0.16)
        addBeam(group, mKrokev, V3(x, wH,  s/2+po),  apex, 0.10, 0.16)
      })
      break
    }

    case 'pultova': {
      const hF = s * Math.tan(slRad)
      addBeam(group, mPoz, V3(-d/2, wH+0.06, -(s/2+po)), V3(d/2, wH+0.06, -(s/2+po)), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2, wH+hF+0.06, s/2), V3(d/2, wH+hF+0.06, s/2), 0.16, 0.12)
      krokvePosX.forEach(x =>
        addBeam(group, mKrokev, V3(x, wH, -(s/2+po)), V3(x, wH+hF, s/2), 0.10, 0.16)
      )
      break
    }

    case 'mansardova': {
      const lSlope = Math.min(slRad * 1.9, Math.PI * 0.43)
      const lFrac = 0.40, lHw = s/2 * lFrac, lH = lHw * Math.tan(lSlope)
      const kneeZ = s/2 - lHw, kneeY = wH + lH
      const uH = (s/2 - lHw) * Math.tan(slRad)

      addBeam(group, mPoz, V3(-d/2, wH+0.06, -s/2), V3(d/2, wH+0.06, -s/2), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2, wH+0.06,  s/2), V3(d/2, wH+0.06,  s/2), 0.16, 0.12)
      // Pozednice kolena (upper)
      addBeam(group, mVaznice, V3(-d/2, kneeY, -kneeZ), V3(d/2, kneeY, -kneeZ), 0.14, 0.10)
      addBeam(group, mVaznice, V3(-d/2, kneeY,  kneeZ), V3(d/2, kneeY,  kneeZ), 0.14, 0.10)
      addBeam(group, mHreben, V3(-d/2, kneeY+uH, 0), V3(d/2, kneeY+uH, 0), 0.12, 0.10)

      // Sloupky (knee wall posts) each other rafter
      krokvePosX.filter((_, i) => i % 2 === 0).forEach(x => {
        addBeam(group, mSloupek, V3(x, wH+0.12, -kneeZ), V3(x, kneeY, -kneeZ), 0.12, 0.12)
        addBeam(group, mSloupek, V3(x, wH+0.12,  kneeZ), V3(x, kneeY,  kneeZ), 0.12, 0.12)
      })

      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, wH, -(s/2+po)), V3(x, kneeY, -kneeZ), 0.10, 0.16)
        addBeam(group, mKrokev, V3(x, wH,  s/2+po),   V3(x, kneeY,  kneeZ), 0.10, 0.16)
        addBeam(group, mKrokev, V3(x, kneeY, -kneeZ), V3(x, kneeY+uH, 0),    0.10, 0.14)
        addBeam(group, mKrokev, V3(x, kneeY,  kneeZ), V3(x, kneeY+uH, 0),    0.10, 0.14)
        // Kleštiny horní části
        const klY = kneeY + uH * 0.55
        addBeam(group, mKles, V3(x, klY, -kneeZ * 0.45), V3(x, klY, kneeZ * 0.45), 0.08, 0.12)
      })
      break
    }

    case 'pilova': {
      const N = Math.max(2, Math.round((d) / Math.max(s * 0.8, 1.5)))
      const segW = d / N, segH = s * Math.tan(slRad)
      addBeam(group, mPoz, V3(-d/2,wH+0.06,-s/2), V3(d/2,wH+0.06,-s/2), 0.16, 0.12)
      addBeam(group, mPoz, V3(-d/2,wH+0.06, s/2), V3(d/2,wH+0.06, s/2),  0.16, 0.12)
      for (let i = 0; i <= N; i++) {
        const x = -d/2 + i * segW
        addBeam(group, mKrokev, V3(x, wH, s/2+po), V3(x, wH+segH, -s/2), 0.10, 0.16)
        if (i < N) {
          addBeam(group, mHreben, V3(x, wH+segH, -s/2), V3(x, wH+segH, s/2), 0.08, 0.08)
          addBeam(group, mVaznice, V3(x, wH+segH, -s/2), V3(x+segW, wH+segH, -s/2), 0.10, 0.10)
        }
      }
      break
    }

    default:
      buildSedlova()
  }

  return group
}

// ─── Building ─────────────────────────────────────────────────────────────────
export function buildBuilding(sirka, delka, wallHeight = 2.7) {
  const s  = Math.max(parseFloat(sirka)  || 8,  2)
  const d  = Math.max(parseFloat(delka)  || 12, 2)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const group = new THREE.Group()

  const walls = new THREE.Mesh(new THREE.BoxGeometry(d, wH, s), wallMaterial())
  walls.position.y = wH / 2
  walls.castShadow = true; walls.receiveShadow = true
  group.add(walls)

  const winMat  = new THREE.MeshStandardMaterial({ color: 0x5599cc, roughness: 0.05, metalness: 0.4, opacity: 0.85, transparent: true })
  const fraMat  = new THREE.MeshStandardMaterial({ color: 0xfaf0e0, roughness: 0.8 })
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2e10, roughness: 0.9 })

  const fz = s / 2 + 0.01
  const addWin = (x, y) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.04), winMat)
    w.position.set(x, y, fz)
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.35, 0.03), fraMat)
    f.position.set(x, y, fz - 0.005)
    group.add(w, f)
  }
  addWin(-d * 0.28, wH * 0.58)
  addWin( d * 0.28, wH * 0.58)

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.95, 0.05), doorMat)
  door.position.set(0, 0.975, fz)
  group.add(door)
  return group
}
