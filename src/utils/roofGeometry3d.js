import * as THREE from 'three'
import { buildKrytinaMateriál } from './roofTextures'

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function quad(A, B, C, D) { return [...A, ...B, ...C, ...A, ...C, ...D] }
function tri(A, B, C)     { return [...A, ...B, ...C] }

// ─── Mesh builder with world-space UV ────────────────────────────────────────
// UV.x = world X, UV.y = world Z — funguje s RepeatWrapping pro tiling krytiny
function meshFrom(positions, material) {
  const geo = new THREE.BufferGeometry()
  const verts = new Float32Array(positions)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))

  // World-space planar XZ UV — tiling je řízen repeat na materiálu
  const count = verts.length / 3
  const uvs = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    uvs[i * 2]     =  verts[i * 3]       // U = X
    uvs[i * 2 + 1] = -verts[i * 3 + 2]   // V = -Z (tak jdou řady tašek od hřebene dolů)
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.computeVertexNormals()

  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ─── Texture repeat ───────────────────────────────────────────────────────────
// World-space UV: 1 UV unit = 1 m. Repeat = počet opakování na referenčních 10/5 m.
function applyRepeat(mat, _slopeLen, _ridgeLen) {
  const { baseRepeatX, baseRepeatY } = mat.userData
  if (!baseRepeatX) return
  const rX = baseRepeatX / 10.0  // tiles per metr ve směru hřebene
  const rY = baseRepeatY / 5.0   // tiles per metr ve směru svahu
  if (mat.map)       { mat.map.repeat.set(rX, rY);       mat.map.needsUpdate = true }
  if (mat.normalMap) { mat.normalMap.repeat.set(rX, rY); mat.normalMap.needsUpdate = true }
}

// ─── Materials ────────────────────────────────────────────────────────────────
let _wallMat = null
function wallMaterial() {
  if (_wallMat) return _wallMat.clone()
  const SZ = 512
  const c = document.createElement('canvas'); c.width = SZ; c.height = SZ
  const ctx = c.getContext('2d')
  // Bílá omítka
  ctx.fillStyle = '#f8f5f0'; ctx.fillRect(0, 0, SZ, SZ)
  for (let i = 0; i < 2000; i++) {
    const x = Math.sin(i * 7.3) * 0.5 + 0.5, y = Math.sin(i * 4.1) * 0.5 + 0.5
    ctx.fillStyle = `rgba(0,0,0,${(Math.sin(i * 2.7) * 0.5 + 0.5) * 0.025})`
    ctx.fillRect(x * SZ, y * SZ, 2, 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2)
  _wallMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, side: THREE.DoubleSide })
  return _wallMat.clone()
}

let _brickMat = null
function brickMaterial() {
  if (_brickMat) return _brickMat.clone()
  const SZ = 256
  const c = document.createElement('canvas'); c.width = SZ; c.height = SZ
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#2a1f18'; ctx.fillRect(0, 0, SZ, SZ)
  const bW = 38, bH = 16, gap = 3
  const rows = Math.ceil(SZ / bH) + 1
  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (bW / 2)
    for (let col = -1; col < SZ / bW + 2; col++) {
      const x = col * bW - ox, y = row * bH
      const lv = 26 + (Math.sin(col * 3.7 + row * 2.3) * 0.5 + 0.5) * 10
      ctx.fillStyle = `hsl(18,28%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, bW - gap*2, bH - gap*2)
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      ctx.fillRect(x + gap, y + bH - gap - 2, bW - gap*2, 2)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(x + gap, y + gap, bW - gap*2, 3)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2)
  _brickMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 })
  return _brickMat.clone()
}

let _woodMat = null, _woodDarkMat = null
function woodMaterial(dark = false) {
  if (dark && _woodDarkMat) return _woodDarkMat.clone()
  if (!dark && _woodMat) return _woodMat.clone()
  const c = document.createElement('canvas'); c.width = 256; c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = dark ? '#5a3018' : '#8B5E3C'; ctx.fillRect(0, 0, 256, 64)
  for (let i = 0; i < 18; i++) {
    const y = i * 4, a = 0.06 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 0.08
    ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y + Math.sin(i) * 3); ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1)
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.88 })
  if (dark) _woodDarkMat = m; else _woodMat = m
  return m.clone()
}

let _chimMat = null
function chimneyMaterial() {
  if (_chimMat) return _chimMat.clone()
  const SZ = 256
  const c = document.createElement('canvas'); c.width = SZ; c.height = SZ
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#7a2a18'; ctx.fillRect(0, 0, SZ, SZ)
  const bW = 36, bH = 14, gap = 3
  const rows = Math.ceil(SZ / bH) + 1
  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (bW / 2)
    for (let col = -1; col < SZ / bW + 2; col++) {
      const x = col * bW - ox, y = row * bH
      const lv = 38 + (Math.sin(col * 5.1 + row * 3.7) * 0.5 + 0.5) * 12
      ctx.fillStyle = `hsl(10,62%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, bW - gap*2, bH - gap*2)
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.fillRect(x + gap, y + bH - gap - 2, bW - gap*2, 2)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3)
  _chimMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.90 })
  return _chimMat.clone()
}

// ─── Building ─────────────────────────────────────────────────────────────────
export function buildBuilding(sirka, delka, wallHeight = 2.7, ridgeHeight = 2.0) {
  const s  = Math.max(parseFloat(sirka)  || 8,  2)
  const d  = Math.max(parseFloat(delka)  || 12, 2)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const group = new THREE.Group()

  // ── Sokl (tmavý cihlový základ, výška 0.45 m, mírně vyčnívá) ────────────────
  const plinthH = 0.45, plinthOut = 0.06
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(d + plinthOut*2, plinthH, s + plinthOut*2),
    brickMaterial()
  )
  plinth.position.y = plinthH / 2
  plinth.castShadow = true; plinth.receiveShadow = true
  group.add(plinth)

  // ── Zdi — bílá omítka ────────────────────────────────────────────────────────
  const walls = new THREE.Mesh(new THREE.BoxGeometry(d, wH - plinthH, s), wallMaterial())
  walls.position.y = plinthH + (wH - plinthH) / 2
  walls.castShadow = true; walls.receiveShadow = true
  group.add(walls)

  // ── Materiály oken ───────────────────────────────────────────────────────────
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9dd4e8, roughness: 0.04, metalness: 0.15,
    opacity: 0.38, transparent: true,
  })
  // Hnědé dřevěné rámy (jako na obrázku)
  const frameMat = woodMaterial(false)
  frameMat.color = new THREE.Color(0x7a4820)
  const doorMat  = new THREE.MeshStandardMaterial({ color: 0x4a2c10, roughness: 0.85 })

  // ── Pomocník pro přední/zadní okno ──────────────────────────────────────────
  const addWindow = (x, y, fz, wW = 0.95, wHt = 1.15) => {
    // Sklo
    const g = new THREE.Mesh(new THREE.BoxGeometry(wW, wHt, 0.05), glassMat.clone())
    g.position.set(x, y, fz)
    // Vnější rám
    const fr = new THREE.Mesh(new THREE.BoxGeometry(wW+0.16, wHt+0.16, 0.09), frameMat.clone())
    fr.position.set(x, y, fz - 0.02)
    // Příčka H
    const hb = new THREE.Mesh(new THREE.BoxGeometry(wW+0.18, 0.07, 0.11), frameMat.clone())
    hb.position.set(x, y, fz - 0.02)
    // Příčka V
    const vb = new THREE.Mesh(new THREE.BoxGeometry(0.07, wHt+0.18, 0.11), frameMat.clone())
    vb.position.set(x, y, fz - 0.02)
    // Parapet (kamenná lišta pod oknem)
    const sill = new THREE.Mesh(new THREE.BoxGeometry(wW+0.30, 0.08, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xddd8d0, roughness: 0.7 }))
    sill.position.set(x, y - wHt/2 - 0.04, fz - 0.04)
    ;[g, fr, hb, vb, sill].forEach(m => { m.castShadow = true; m.receiveShadow = true })
    ;[hb, vb, sill].forEach(m => { m.userData.lod = 'detail' })
    group.add(g, fr, hb, vb, sill)
  }

  const fz = s / 2 + 0.01
  const winY = plinthH + (wH - plinthH) * 0.58

  // Přední okna (2 ks)
  addWindow(-d * 0.30, winY, fz)
  addWindow( d * 0.30, winY, fz)
  // Zadní okna
  addWindow(-d * 0.30, winY, -fz)
  addWindow( d * 0.30, winY, -fz)

  // ── Dveře (přední) ───────────────────────────────────────────────────────────
  const doorH = 2.10
  // Rám
  const dfr = new THREE.Mesh(new THREE.BoxGeometry(1.08, doorH+0.20, 0.12), frameMat.clone())
  dfr.position.set(0, doorH/2 + 0.10, fz - 0.02)
  // Dveřní křídlo
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.96, doorH, 0.07), doorMat)
  door.position.set(0, doorH/2, fz + 0.02)
  // Oblouk nad dveřmi (archivolta)
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.54, 0.12, 12, 1, false, 0, Math.PI),
    frameMat.clone()
  )
  arch.rotation.z = Math.PI/2; arch.rotation.x = Math.PI/2
  arch.position.set(0, doorH + 0.02, fz - 0.02)
  ;[dfr, door, arch].forEach(m => { m.castShadow = true; m.receiveShadow = true })
  arch.userData.lod = 'detail'
  group.add(dfr, door, arch)

  // ── Boční okna ───────────────────────────────────────────────────────────────
  const bx = d / 2 + 0.01
  ;[-s*0.25, s*0.25].forEach(z => {
    ;[-bx, bx].forEach(fx => {
      const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.88), glassMat.clone())
      g2.position.set(fx, winY, z)
      const fr2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.14, 1.02), frameMat.clone())
      fr2.position.set(fx - Math.sign(fx)*0.01, winY, z)
      ;[g2, fr2].forEach(m => { m.castShadow = true; m.receiveShadow = true; group.add(m) })
    })
  })

  // ── Vstupní stříška ──────────────────────────────────────────────────────────
  const canopyW = 1.6, canopyD = 0.9, canopyH = 0.08
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(canopyW, canopyH, canopyD),
    woodMaterial(true)
  )
  canopy.position.set(0, doorH + 0.28, fz + canopyD/2 - 0.1)
  canopy.castShadow = true
  canopy.userData.lod = 'detail'
  group.add(canopy)
  // Nosné sloupy stříšky
  ;[-canopyW/2 + 0.1, canopyW/2 - 0.1].forEach(px => {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, doorH + 0.28, 8),
      woodMaterial(true)
    )
    col.position.set(px, (doorH+0.28)/2, fz + canopyD - 0.2)
    col.castShadow = true; col.receiveShadow = true
    col.userData.lod = 'detail'
    group.add(col)
  })

  // ── Komín ────────────────────────────────────────────────────────────────────
  // Umístění: 28 % délky od středu, 12 % šířky (pod hřeben, viditelný z přední strany)
  const chimX = d * 0.28, chimZ = s * 0.12
  const chimH = wH + ridgeHeight * 0.62 + 1.55 // vyčnívá 1.55 m nad střechou
  const chim = new THREE.Mesh(
    new THREE.BoxGeometry(0.40, chimH, 0.40),
    chimneyMaterial()
  )
  chim.position.set(chimX, chimH / 2, chimZ)
  chim.castShadow = true; chim.receiveShadow = true
  group.add(chim)
  // Komínová čapka — ocelová deska s přesahem
  const capW = 0.52, capD = 0.52, capTH = 0.06
  const chimCap = new THREE.Mesh(
    new THREE.BoxGeometry(capW, capTH, capD),
    new THREE.MeshStandardMaterial({ color: 0x888890, roughness: 0.35, metalness: 0.65 })
  )
  chimCap.position.set(chimX, chimH + capTH / 2, chimZ)
  chimCap.castShadow = true
  group.add(chimCap)

  return group
}

// ─── Main roof builder ────────────────────────────────────────────────────────
export function buildRoofScene(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 2.7, krytina = 'bobrovka', roofColor = '#ffffff') {
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

  const slopeLen = Math.sqrt(hw * hw + h * h)
  const ridgeLen = hd * 2

  const mat = buildKrytinaMateriál(krytina)
  // Aplikuj barvu (white = bez změny, jiná barva = tint)
  if (roofColor && roofColor !== '#ffffff') {
    mat.color = new THREE.Color(roofColor)
  }
  applyRepeat(mat, slopeLen, ridgeLen)

  const wMat = wallMaterial()
  const group = new THREE.Group()
  let pos = []

  // Štítové zdi — trojúhelníkové panely ze zdiva na shtítových stěnách budovy (x = ±d/2)
  // Výška štítu odpovídá výšce hřebene (h = výška nad zdí)
  const addGableWalls = (ridgeZ = 0, ridgeH = h) => {
    // Levý štít (x = -d/2) — od horního okraje zdi do hřebene
    group.add(meshFrom(tri(
      [-d/2, wH, -s/2], [-d/2, wH, s/2], [-d/2, wH + ridgeH, ridgeZ]
    ), wMat))
    // Pravý štít (x = +d/2)
    group.add(meshFrom(tri(
      [d/2, wH, s/2], [d/2, wH, -s/2], [d/2, wH + ridgeH, ridgeZ]
    ), wMat))
  }

  switch (typ) {
    case 'sedlova': {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      // Hlavní svahy — BEZ štítových trojúhelníků (ty jsou ze zdiva níže)
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(0, h)
      break
    }

    case 'asymetricka': {
      const shift = hw * 0.25, rH = h * 0.88
      const RB = [-hd, wH + rH, shift], RF = [hd, wH + rH, shift]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(hw * 0.25 * (s/2 / hw), rH * (s / 2 / hw))
      break
    }

    case 'valbova': {
      const rx = Math.max(0, hd - hw)
      if (rx < 0.05) {
        const apex = [0, wH + h, 0]
        pos = [...tri(BL, FL, apex), ...tri(FL, FR, apex), ...tri(FR, BR, apex), ...tri(BR, BL, apex)]
      } else {
        const RB = [-rx, wH + h, 0], RF = [rx, wH + h, 0]
        // Valbová střecha nemá štíty — nárožní svahy nahrazují štíty
        pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR), ...tri(BL, RB, BR), ...tri(FL, FR, RF)]
      }
      break
    }

    case 'stanova': {
      const apex = [0, wH + h, 0]
      // Stanová střecha nemá štíty
      pos = [...tri(BL, FL, apex), ...tri(FL, FR, apex), ...tri(FR, BR, apex), ...tri(BR, BL, apex)]
      break
    }

    case 'pultova': {
      const hF = s * Math.tan(slRad)
      const Lo1 = [-hd, wH, hw], Lo2 = [hd, wH, hw]
      const Hi1 = [hd, wH + hF, -hw], Hi2 = [-hd, wH + hF, -hw]
      // Hlavní svah
      pos = [...quad(Lo1, Lo2, Hi1, Hi2)]
      // Štítové trojúhelníky — použij zdivo na vnitřní pozici
      group.add(meshFrom(tri([-d/2, wH, s/2], [-d/2, wH + hF, -s/2], [-d/2, wH, -s/2]), wMat))
      group.add(meshFrom(tri([d/2, wH, s/2], [d/2, wH, -s/2], [d/2, wH + hF, -s/2]), wMat))
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

      const lMat = buildKrytinaMateriál(krytina)
      if (roofColor && roofColor !== '#ffffff') lMat.color = new THREE.Color(roofColor)
      applyRepeat(lMat, lHw / Math.cos(lSlope), ridgeLen)
      // Dolní svahy mansardy
      group.add(meshFrom([
        ...quad(BL, FL, IFL, IBL), ...quad(BR, IBR, IFR, FR),
        ...quad(BL, IBL, IBR, BR), ...quad(FL, FR, IFR, IFL),
      ], lMat))

      applyRepeat(mat, uHw / Math.cos(slRad), ridgeLen)
      // Horní svahy (bez štítových trojúhelníků)
      pos = [
        ...quad(IBL, IFL, RF, RB), ...quad(IBR, RB, RF, IFR),
      ]
      // Štítová zeď mansardy
      group.add(meshFrom(tri([-d/2, iY, iZn], [-d/2, iY, iZp], [-d/2, iY + uH, 0]), wMat))
      group.add(meshFrom(tri([d/2, iY, iZp], [d/2, iY, iZn], [d/2, iY + uH, 0]), wMat))
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
      // Štítové zdi pulvalbové (dolní část do kolena)
      group.add(meshFrom([
        ...quad([-d/2, wH, -s/2], [-d/2, wH + kneeH, -kneeZ * (s/2/hw)],
                [-d/2, wH + kneeH, kneeZ * (s/2/hw)], [-d/2, wH, s/2]),
        ...quad([d/2, wH, s/2], [d/2, wH + kneeH, kneeZ * (s/2/hw)],
                [d/2, wH + kneeH, -kneeZ * (s/2/hw)], [d/2, wH, -s/2]),
      ], wMat))
      // Boční části střechy pod kolenem (přesah)
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
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(0, h)
    }
  }

  if (pos.length > 0) group.add(meshFrom(pos, mat))

  // ── Hřebenáče — individuální polokruhové tašky ───────────────────────────────
  if (!['pultova', 'pilova', 'stanova'].includes(typ)) {
    const rY  = wH + (typ === 'mansardova' ? h * 1.5 : h)
    const rx  = typ === 'valbova'   ? Math.max(0.1, hd - hw)
              : typ === 'pulvalbova' ? hd * 0.78
              : hd
    addRidgeTiles(group, rx, rY)
  }

  // ── Okapní plech ─────────────────────────────────────────────────────────────
  addEaveTrim(group, typ, hd, hw, wH, h)

  return group
}

// ── Hřebenáče — série polokruhových tašek podél hřebene ─────────────────────
function addRidgeTiles(group, rx, rY) {
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x3a0f00, roughness: 0.88, metalness: 0.05,
  })

  const tileLen  = 0.33   // délka jedné tašky [m]
  const tileR    = 0.10   // poloměr půlkruhu
  const overlap  = 0.06   // přesah sousedních tašek
  const pitch    = tileLen - overlap
  const totalLen = rx * 2
  const nTiles   = Math.max(1, Math.ceil(totalLen / pitch))
  const step     = totalLen / nTiles

  // Podkladová lišta (plochá, zakrývá spáru mezi svahy)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(totalLen + 0.04, 0.06, tileR * 2.2),
    new THREE.MeshStandardMaterial({ color: 0x2e0c00, roughness: 0.90 })
  )
  base.position.set(0, rY + 0.02, 0)
  base.castShadow = true
  base.userData.lod = 'detail'
  group.add(base)

  // Individuální hřebenáče — polokruhový průřez (thetaStart + thetaLength)
  // CylinderGeometry osa = Y; po rotation.z = π/2 → osa podél X (hřeben)
  // thetaStart = -π/2, thetaLength = π → horní půlkruh (oblouk nahoru)
  for (let i = 0; i < nTiles; i++) {
    const x = -rx + (i + 0.5) * step

    const geo = new THREE.CylinderGeometry(
      tileR, tileR * 1.02,  // lehce kónická taška
      tileLen + overlap * 0.5,
      10, 1,
      false,
      -Math.PI / 2, Math.PI  // horní půlkruh (oblouk nahoru)
    )
    const tile = new THREE.Mesh(geo, capMat)
    tile.rotation.z = Math.PI / 2   // osa tašky podél hřebene (X)
    tile.position.set(x, rY + tileR + 0.03, 0)
    tile.castShadow = true
    tile.userData.lod = 'detail'
    group.add(tile)

    // Tenká dělicí linka (přesah tašky viditelný jako tmavší spára)
    if (i < nTiles - 1) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, tileR * 1.8, tileR * 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1a0500, roughness: 0.95 })
      )
      seam.position.set(-rx + (i + 1) * step, rY + tileR * 0.8 + 0.03, 0)
      seam.userData.lod = 'detail'
      group.add(seam)
    }
  }

  // Čelní zakončení (kulatý uzávěr hřebene)
  ;[-rx, rx].forEach((ex, idx) => {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(tileR * 0.95, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      capMat
    )
    cap.position.set(ex, rY + tileR + 0.03, 0)
    cap.rotation.y = idx === 0 ? Math.PI : 0
    cap.castShadow = true
    cap.userData.lod = 'detail'
    group.add(cap)
  })
}

// ── Okapní plech po obvodu střechy ──────────────────────────────────────────
function addEaveTrim(group, typ, hd, hw, wH, h) {
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x888898, roughness: 0.3, metalness: 0.6,
  })
  const tH = 0.12, tD = 0.06 // výška a tloušťka okapního plechu

  const addBar = (x1, z1, x2, z2) => {
    const len = Math.sqrt((x2-x1)**2 + (z2-z1)**2)
    if (len < 0.1) return
    const bar = new THREE.Mesh(new THREE.BoxGeometry(len, tH, tD), trimMat)
    bar.position.set((x1+x2)/2, wH - tH/2, (z1+z2)/2)
    bar.rotation.y = Math.atan2(z2-z1, x2-x1)
    bar.castShadow = true; bar.receiveShadow = true
    group.add(bar)
  }

  // Okapní plech podél okapních hran (kde je presah)
  if (['sedlova','asymetricka','mansardova','pulvalbova','pultova'].includes(typ)) {
    addBar(-hd, -hw, hd, -hw)  // přední okap
    addBar(-hd,  hw, hd,  hw)  // zadní okap
  }
  if (['valbova','stanova'].includes(typ)) {
    addBar(-hd, -hw, hd, -hw)
    addBar(-hd,  hw, hd,  hw)
    addBar(-hd, -hw, -hd, hw)
    addBar( hd, -hw,  hd, hw)
  }
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

  const mPoz     = new THREE.MeshStandardMaterial({ color: 0x4a2008, roughness: 0.85 })
  const mKrokev  = new THREE.MeshStandardMaterial({ color: 0xa05020, roughness: 0.80 })
  const mVaznice = new THREE.MeshStandardMaterial({ color: 0x6b3010, roughness: 0.85 })
  const mKles    = new THREE.MeshStandardMaterial({ color: 0xd08840, roughness: 0.78 })
  const mHreben  = new THREE.MeshStandardMaterial({ color: 0x2e1005, roughness: 0.90 })
  const mSloupek = new THREE.MeshStandardMaterial({ color: 0x7a4520, roughness: 0.85 })

  const group = new THREE.Group()

  const nMez = Math.max(1, Math.round(d / roz))
  const dRoz = d / nMez
  const krokvePosX = Array.from({ length: nMez + 1 }, (_, i) => -d / 2 + i * dRoz)

  // ── Skutečné průřezy prvků (shodují se s kalkulátorem Krov & konstrukce) ───
  const POZ_H = 0.12, POZ_W = 0.12  // Pozednice 120×120 mm
  const HRE_H = 0.20, HRE_W = 0.14  // Vrcholová vaznice 140×200 mm
  const STV_H = 0.18, STV_W = 0.12  // Středová vaznice 120×180 mm
  const KRO_H = 0.18, KRO_W = 0.10  // Krokve 100×180 mm
  const KLE_H = 0.16, KLE_W = 0.06  // Kleštiny 60×160 mm
  const cosSlope = Math.cos(slRad)   // pro výpočet svislé složky tloušťky krokve

  const buildSedlova = (ridgeZ = 0, ridgeH = h, leftPo = po, rightPo = po) => {
    // Polohy středů a vrchních ploch podpor
    const pozCY  = wH + POZ_H / 2            // střed pozednice
    const pozTop = wH + POZ_H                 // vrchní strana pozednice
    const hreCY  = wH + ridgeH               // střed vrcholové vaznice
    const hreTop = hreCY + HRE_H / 2         // vrchní strana vrcholové vaznice

    // Krokev: spodní líc leží na vrchní straně podpory.
    // Svislá vzdálenost od středu krokve k jejímu spodnímu líci = (KRO_H/2) * cos(sklon)
    const kroAdj    = (KRO_H / 2) * cosSlope
    const kroStartY = pozTop + kroAdj         // střed krokve u pozednice
    const kroEndY   = hreTop + kroAdj        // střed krokve u hřebenové vaznice

    // Pozednice — 120×120 mm
    addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
    addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)

    // Vrcholová vaznice — 140×200 mm, střed na úrovni teoretického hřebene
    addBeam(group, mHreben, V3(-d/2 - ps, hreCY, ridgeZ), V3(d/2 + ps, hreCY, ridgeZ), HRE_W, HRE_H)

    // Středové vaznice — 120×180 mm, vždy 2 ks (symetricky ~52 % výšky hřebene)
    const vZ = (s / 2) * 0.55
    const vY = wH + ridgeH * 0.52
    addBeam(group, mVaznice, V3(-d/2, vY, -(vZ - ridgeZ * 0.5)), V3(d/2, vY, -(vZ - ridgeZ * 0.5)), STV_W, STV_H)
    addBeam(group, mVaznice, V3(-d/2, vY,   vZ + ridgeZ * 0.5 ), V3(d/2, vY,   vZ + ridgeZ * 0.5 ), STV_W, STV_H)

    // Krokve — spodní líc na pozednici dole, na vrcholové vaznici nahoře
    krokvePosX.forEach(x => {
      addBeam(group, mKrokev,
        V3(x, kroStartY, -(s/2 + leftPo)),
        V3(x, kroEndY,   ridgeZ),
        KRO_W, KRO_H
      )
      addBeam(group, mKrokev,
        V3(x, kroStartY, s/2 + rightPo),
        V3(x, kroEndY,   ridgeZ),
        KRO_W, KRO_H
      )
      // Kleštiny — 60×160 mm, přibity po stranách krokví (~62 % výšky hřebene)
      const klY = wH + ridgeH * 0.62
      const klZ = (s / 2) * 0.42 + Math.abs(ridgeZ) * 0.42
      addBeam(group, mKles,
        V3(x, klY, -klZ + ridgeZ * 0.62),
        V3(x, klY,  klZ + ridgeZ * 0.62),
        KLE_W, KLE_H
      )
    })
  }

  switch (typ) {
    case 'sedlova': case 'pulvalbova': buildSedlova(); break
    case 'asymetricka': buildSedlova(s * 0.10, h * 0.88); break

    case 'valbova': {
      const rx = Math.max(0.05, d / 2 - s / 2)
      const pozCY = wH + POZ_H / 2
      const hreTop = wH + h + HRE_H / 2
      const kroAdj = (KRO_H / 2) * cosSlope
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(-d/2, pozCY, s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3( d/2, pozCY, -s/2), V3( d/2, pozCY, s/2), POZ_W, POZ_H)
      if (rx > 0.2) addBeam(group, mHreben, V3(-rx, wH+h, 0), V3(rx, wH+h, 0), HRE_W, HRE_H)
      ;[[-d/2,-s/2],[-d/2,s/2],[d/2,-s/2],[d/2,s/2]].forEach(([cx,cz]) => {
        const ridgeEnd = cx < 0 ? V3(-rx, hreTop + kroAdj, 0) : V3(rx, hreTop + kroAdj, 0)
        addBeam(group, mKrokev, V3(cx, pozCY + POZ_H/2 + kroAdj, cz), ridgeEnd, KRO_W, KRO_H)
      })
      krokvePosX.filter(x => x > -rx && x < rx).forEach(x => {
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2 + kroAdj, -(s/2+po)), V3(x, hreTop + kroAdj, 0), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2 + kroAdj,  s/2+po),  V3(x, hreTop + kroAdj, 0), KRO_W, KRO_H)
        const klY = wH + h * 0.62
        addBeam(group, mKles, V3(x, klY, -(s/2)*0.42), V3(x, klY, (s/2)*0.42), KLE_W, KLE_H)
      })
      break
    }

    case 'stanova': {
      const pozCY = wH + POZ_H / 2
      const apex = V3(0, wH + h, 0)
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(-d/2, pozCY, s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3( d/2, pozCY, -s/2), V3( d/2, pozCY, s/2), POZ_W, POZ_H)
      ;[[-d/2,-s/2],[-d/2,s/2],[d/2,-s/2],[d/2,s/2]].forEach(([cx,cz]) =>
        addBeam(group, mKrokev, V3(cx, pozCY + POZ_H/2, cz), apex, KRO_W, KRO_H)
      )
      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2, -(s/2+po)), apex, KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2,  s/2+po),   apex, KRO_W, KRO_H)
      })
      break
    }

    case 'pultova': {
      const hF = s * Math.tan(slRad)
      const pozCY = wH + POZ_H / 2
      const kroAdj = (KRO_H / 2) * cosSlope
      addBeam(group, mPoz, V3(-d/2, pozCY, -(s/2+po)), V3(d/2, pozCY, -(s/2+po)), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, wH+hF+POZ_H/2, s/2), V3(d/2, wH+hF+POZ_H/2, s/2), POZ_W, POZ_H)
      krokvePosX.forEach(x =>
        addBeam(group, mKrokev, V3(x, wH+POZ_H+kroAdj, -(s/2+po)), V3(x, wH+hF+kroAdj, s/2), KRO_W, KRO_H)
      )
      break
    }

    case 'mansardova': {
      const lSlope = Math.min(slRad * 1.9, Math.PI * 0.43)
      const lFrac = 0.40, lHw = s/2 * lFrac, lH = lHw * Math.tan(lSlope)
      const kneeZ = s/2 - lHw, kneeY = wH + lH
      const uH = (s/2 - lHw) * Math.tan(slRad)
      const pozCY = wH + POZ_H / 2
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      addBeam(group, mVaznice, V3(-d/2, kneeY, -kneeZ), V3(d/2, kneeY, -kneeZ), STV_W, STV_H)
      addBeam(group, mVaznice, V3(-d/2, kneeY,  kneeZ), V3(d/2, kneeY,  kneeZ), STV_W, STV_H)
      addBeam(group, mHreben, V3(-d/2, kneeY+uH, 0), V3(d/2, kneeY+uH, 0), HRE_W, HRE_H)
      const lCosSlope = Math.cos(Math.min(lSlope, Math.PI * 0.43))
      const uCosSlope = cosSlope
      krokvePosX.filter((_, i) => i % 2 === 0).forEach(x => {
        addBeam(group, mSloupek, V3(x, wH + POZ_H, -kneeZ), V3(x, kneeY, -kneeZ), 0.12, 0.12)
        addBeam(group, mSloupek, V3(x, wH + POZ_H,  kneeZ), V3(x, kneeY,  kneeZ), 0.12, 0.12)
      })
      krokvePosX.forEach(x => {
        const lAdj = (KRO_H / 2) * lCosSlope
        const uAdj = (KRO_H / 2) * uCosSlope
        addBeam(group, mKrokev, V3(x, wH + POZ_H + lAdj, -(s/2+po)), V3(x, kneeY + lAdj, -kneeZ), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, wH + POZ_H + lAdj,  s/2+po),   V3(x, kneeY + lAdj,  kneeZ), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kneeY + lAdj, -kneeZ), V3(x, kneeY + uH + uAdj, 0), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kneeY + lAdj,  kneeZ), V3(x, kneeY + uH + uAdj, 0), KRO_W, KRO_H)
        const klY = kneeY + uH * 0.55
        addBeam(group, mKles, V3(x, klY, -kneeZ * 0.45), V3(x, klY, kneeZ * 0.45), KLE_W, KLE_H)
      })
      break
    }

    case 'pilova': {
      const N = Math.max(2, Math.round((d) / Math.max(s * 0.8, 1.5)))
      const segW = d / N, segH = s * Math.tan(slRad)
      const pozCY = wH + POZ_H / 2
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      for (let i = 0; i <= N; i++) {
        const x = -d/2 + i * segW
        addBeam(group, mKrokev, V3(x, wH + POZ_H, s/2+po), V3(x, wH+segH, -s/2), KRO_W, KRO_H)
        if (i < N) {
          addBeam(group, mHreben, V3(x, wH+segH, -s/2), V3(x, wH+segH, s/2), HRE_W, HRE_H)
          addBeam(group, mVaznice, V3(x, wH+segH, -s/2), V3(x+segW, wH+segH, -s/2), STV_W, STV_H)
        }
      }
      break
    }

    default: buildSedlova()
  }

  return group
}
