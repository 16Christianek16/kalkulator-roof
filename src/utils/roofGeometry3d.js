import * as THREE from 'three'
import { buildKrytinaMateriál } from './roofTextures'
import { makePBRMaterial, ensureUV2 } from './pbrTextures'

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
  geo.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs, 2))
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
  ;['map', 'normalMap', 'roughnessMap', 'aoMap'].forEach(key => {
    if (mat[key]) { mat[key].repeat.set(rX, rY); mat[key].needsUpdate = true }
  })
}

// ── Reálný PBR materiál tašky (Poly Haven) místo procedurální textury ────────
// Pro plošné plechové krytiny zůstává jednoduchý kovový materiál bez textury.
function getKrytinaMaterial(krytina, roofColor, pbrTex) {
  if (isSheetMetal(krytina)) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x7a8a7a, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide })
    if (roofColor && roofColor !== '#ffffff') mat.color = new THREE.Color(roofColor)
    mat.userData.isKrytina = true
    return mat
  }
  if (pbrTex?.roofTile?.map) {
    const mat = makePBRMaterial(pbrTex.roofTile, { repeatX: 4, repeatY: 4, color: roofColor || '#ffffff' })
    mat.userData = { baseRepeatX: 4, baseRepeatY: 4, isKrytina: true }
    return mat
  }
  const mat = buildKrytinaMateriál(krytina)
  if (roofColor && roofColor !== '#ffffff') mat.color = new THREE.Color(roofColor)
  mat.userData.isKrytina = true
  return mat
}

// ─── Materials ────────────────────────────────────────────────────────────────
// Pozn.: pbrTex = volitelná sada reálných PBR textur z Poly Haven (viz pbrTextures.js).
// Pokud není k dispozici (textury se ještě načítají / selhalo načtení), použije se
// procedurální canvas náhrada jako fallback.
let _wallMat = null
function wallMaterial(pbrTex) {
  if (pbrTex?.wall?.map) {
    const m = makePBRMaterial(pbrTex.wall, { repeatX: 2, repeatY: 2, color: '#e8e0d5' })
    m.side = THREE.DoubleSide
    return m
  }
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
function brickMaterial(pbrTex) {
  if (pbrTex?.concrete?.map) {
    return makePBRMaterial(pbrTex.concrete, { repeatX: 2, repeatY: 1, color: '#ffffff', extra: { roughness: 0.95 } })
  }
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
function woodMaterial(dark = false, pbrTex) {
  if (pbrTex?.wood?.map) {
    const m = makePBRMaterial(pbrTex.wood, {
      repeatX: 1, repeatY: 1,
      color: dark ? '#6b4828' : '#b08858',
      extra: { roughness: 0.88 },
    })
    return m
  }
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
export function buildBuilding(sirka, delka, wallHeight = 2.7, ridgeHeight = 2.0, pbrTex = null) {
  const s  = Math.max(parseFloat(sirka)  || 8,  2)
  const d  = Math.max(parseFloat(delka)  || 12, 2)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const group = new THREE.Group()

  // ── Sokl (beton, výška 0.35 m, mírně vyčnívá) ───────────────────────────────
  const plinthH = 0.35, plinthOut = 0.03
  const plinthGeo = new THREE.BoxGeometry(d + plinthOut*2, plinthH, s + plinthOut*2)
  ensureUV2(plinthGeo)
  const plinth = new THREE.Mesh(plinthGeo, brickMaterial(pbrTex))
  plinth.position.y = plinthH / 2
  plinth.castShadow = true; plinth.receiveShadow = true
  group.add(plinth)

  // ── Zdi — omítka (PBR plaster, pokud k dispozici) ───────────────────────────
  const wallsGeo = new THREE.BoxGeometry(d, wH - plinthH, s)
  ensureUV2(wallsGeo)
  const walls = new THREE.Mesh(wallsGeo, wallMaterial(pbrTex))
  walls.position.y = plinthH + (wH - plinthH) / 2
  walls.castShadow = true; walls.receiveShadow = true
  group.add(walls)

  // ── Materiály oken ───────────────────────────────────────────────────────────
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9dd4e8, roughness: 0.04, metalness: 0.15,
    opacity: 0.25, transparent: true,
  })
  // Bílé rámy oken
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.55 })
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
  const doorFrameMat = woodMaterial(true, pbrTex)
  // Rám
  const dfr = new THREE.Mesh(new THREE.BoxGeometry(1.08, doorH+0.20, 0.12), doorFrameMat.clone())
  dfr.position.set(0, doorH/2 + 0.10, fz - 0.02)
  // Dveřní křídlo
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.96, doorH, 0.07), doorMat)
  door.position.set(0, doorH/2, fz + 0.02)
  // Oblouk nad dveřmi (archivolta)
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.54, 0.12, 12, 1, false, 0, Math.PI),
    doorFrameMat.clone()
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
    woodMaterial(true, pbrTex)
  )
  canopy.position.set(0, doorH + 0.28, fz + canopyD/2 - 0.1)
  canopy.castShadow = true
  canopy.userData.lod = 'detail'
  group.add(canopy)
  // Nosné sloupy stříšky
  ;[-canopyW/2 + 0.1, canopyW/2 - 0.1].forEach(px => {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, doorH + 0.28, 8),
      woodMaterial(true, pbrTex)
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
export function buildRoofScene(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 2.7, krytina = 'bobrovka', roofColor = '#ffffff', extras = {}, pbrTex = null) {
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

  const mat = getKrytinaMaterial(krytina, roofColor, pbrTex)
  applyRepeat(mat, slopeLen, ridgeLen)

  const wMat = wallMaterial(pbrTex)
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

  // ── Větrová lišta / štítová lišta (verge board) ─────────────────────────────
  // Tenká tmavá prkna po okraji štítových přesahů — visí svisle pod okrajem střechy
  const addVergeBoards = (xPos, wH_, hw_, h_, ridgeZ_ = 0) => {
    const vbMat = new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.88 })
    const thick = 0.04, depth = 0.18

    // Přední (záporné Z) a zadní (kladné Z) větrová lišta svisle podél štítu
    ;[-1, 1].forEach(side => {
      const zEdge = side * hw_
      const slopeLen = Math.sqrt((hw_ - Math.abs(ridgeZ_)) ** 2 + h_ ** 2)
      if (slopeLen < 0.1) return
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, depth, slopeLen), vbMat)
      mesh.castShadow = true
      mesh.userData.lod = 'detail'
      // Středový bod lišty: od eave ke hřebenu
      const midZ = (zEdge + ridgeZ_) / 2
      const midY = wH_ + h_ / 2
      mesh.position.set(xPos, midY, midZ)
      // Rotovat podél sklonu
      mesh.rotation.x = Math.atan2(h_, hw_ - Math.abs(ridgeZ_)) * (side < 0 ? -1 : 1)
      group.add(mesh)
    })
  }

  // ── Nárožní lišta (hip trim strip) ───────────────────────────────────────────
  // Tenká hliníková/kovová lišta podél nároží valbové střechy
  const addHipStrip = (p1, p2) => {
    const hipMat = new THREE.MeshStandardMaterial({ color: 0x777788, roughness: 0.3, metalness: 0.6 })
    const dir = new THREE.Vector3(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2])
    const len = dir.length()
    if (len < 0.1) return
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, len), hipMat)
    mesh.position.set((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2)
    mesh.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir.clone().normalize())
    )
    mesh.castShadow = true
    group.add(mesh)
  }

  switch (typ) {

    // ─── SEDLOVÁ ──────────────────────────────────────────────────────────────
    case 'sedlova': {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(0, h)
      // Větrové lišty podél každého štítového přesahu
      addVergeBoards(-hd, wH, hw, h, 0)
      addVergeBoards( hd, wH, hw, h, 0)
      break
    }

    // ─── ASYMETRICKÁ ──────────────────────────────────────────────────────────
    case 'asymetricka': {
      // Hřeben posunutý výrazně na jednu stranu — kratší svah je strmý
      const shift  = hw * 0.38                          // posun hřebene od středu (v Z)
      const ridgeH = (hw - shift) * Math.tan(slRad)     // výška hřebene (z kratší strany při daném sklonu)
      const RB = [-hd, wH + ridgeH, shift], RF = [hd, wH + ridgeH, shift]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      // Štíty — trojúhelníky na stěně (ne na okraji přesahu)
      const gableShift = shift * (s / 2 / hw)
      const gableH     = (s/2 - gableShift) * Math.tan(slRad)
      group.add(meshFrom(tri([-d/2, wH, -s/2], [-d/2, wH, s/2], [-d/2, wH + gableH, gableShift]), wMat.clone()))
      group.add(meshFrom(tri([d/2, wH, s/2], [d/2, wH, -s/2], [d/2, wH + gableH, gableShift]), wMat.clone()))
      addVergeBoards(-hd, wH, hw, ridgeH, shift)
      addVergeBoards( hd, wH, hw, ridgeH, shift)
      break
    }

    // ─── VALBOVÁ ──────────────────────────────────────────────────────────────
    case 'valbova': {
      const rx = Math.max(0.1, hd - hw)
      if (rx < 0.15) {
        // Skoro stanová (čtvercový půdorys)
        const apex = [0, wH + h, 0]
        pos = [...tri(BL, FL, apex), ...tri(FL, FR, apex), ...tri(FR, BR, apex), ...tri(BR, BL, apex)]
        // Nárožní lišty
        addHipStrip([BL[0],BL[1],BL[2]], [0,wH+h,0])
        addHipStrip([FL[0],FL[1],FL[2]], [0,wH+h,0])
        addHipStrip([FR[0],FR[1],FR[2]], [0,wH+h,0])
        addHipStrip([BR[0],BR[1],BR[2]], [0,wH+h,0])
      } else {
        const RB = [-rx, wH + h, 0], RF = [rx, wH + h, 0]
        pos = [
          ...quad(BL, FL, RF, RB),
          ...quad(BR, RB, RF, FR),
          ...tri(BL, RB, BR),
          ...tri(FL, FR, RF),
        ]
        // Nárožní lišty (4 ks od rohu ke hřebeni)
        addHipStrip([BL[0],BL[1],BL[2]], [RB[0],RB[1],RB[2]])
        addHipStrip([BR[0],BR[1],BR[2]], [RB[0],RB[1],RB[2]])
        addHipStrip([FL[0],FL[1],FL[2]], [RF[0],RF[1],RF[2]])
        addHipStrip([FR[0],FR[1],FR[2]], [RF[0],RF[1],RF[2]])
      }
      break
    }

    // ─── STANOVÁ ──────────────────────────────────────────────────────────────
    case 'stanova': {
      const apex = [0, wH + h, 0]
      pos = [
        ...tri(BL, FL, apex),
        ...tri(FL, FR, apex),
        ...tri(FR, BR, apex),
        ...tri(BR, BL, apex),
      ]
      // Nárožní lišty ke štítu
      addHipStrip([BL[0],BL[1],BL[2]], [0,wH+h,0])
      addHipStrip([FL[0],FL[1],FL[2]], [0,wH+h,0])
      addHipStrip([FR[0],FR[1],FR[2]], [0,wH+h,0])
      addHipStrip([BR[0],BR[1],BR[2]], [0,wH+h,0])
      // Špičatý vrchol (ozdobná čapka)
      const apexCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.85 })
      )
      apexCap.position.set(0, wH + h + 0.15, 0)
      apexCap.castShadow = true
      apexCap.userData.lod = 'detail'
      group.add(apexCap)
      break
    }

    // ─── PULTOVÁ ──────────────────────────────────────────────────────────────
    case 'pultova': {
      // Svah stoupá od přední (nízké) ke zadní (vysoké) straně
      const hF = (2 * hw) * Math.tan(slRad)  // výška přes celou šířku včetně přesahu
      const eaveLow  = wH                      // výška nízkého okapu
      const eaveHigh = wH + hF                 // výška vysokého okapu

      // Hlavní svah (celá šířka s přesahy)
      const Lo1 = [-hd, eaveLow,  hw]
      const Lo2 = [ hd, eaveLow,  hw]
      const Hi1 = [ hd, eaveHigh, -hw]
      const Hi2 = [-hd, eaveHigh, -hw]
      pos = [...quad(Lo1, Lo2, Hi1, Hi2)]

      // Boční štítové trojúhelníky (jen na vnitřní stěně ±d/2, zdivo)
      const hAtWall = s * Math.tan(slRad)  // výška přes šířku budovy
      group.add(meshFrom(tri(
        [-d/2, wH, s/2], [-d/2, wH + hAtWall, -s/2], [-d/2, wH, -s/2]
      ), wMat.clone()))
      group.add(meshFrom(tri(
        [d/2, wH, s/2], [d/2, wH, -s/2], [d/2, wH + hAtWall, -s/2]
      ), wMat.clone()))

      // Přesahové boční trojúhelníky — krytina na přesahu štítu
      // Od hrany zdi (±d/2) k přesahu (±hd) — malé trojúhelníkové výplně
      group.add(meshFrom(tri(
        [-hd, eaveLow, hw], [-hd, eaveHigh, -hw], [-d/2, wH, s/2]
      ), mat.clone()))
      group.add(meshFrom(tri(
        [hd, eaveLow, hw], [d/2, wH, s/2], [hd, eaveHigh, -hw]
      ), mat.clone()))

      // Fasciová lišta na nízkém okapu (frontální prkno)
      const fasciaMat = new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.88 })
      const fasciaBoard = new THREE.Mesh(new THREE.BoxGeometry(hd * 2, 0.20, 0.05), fasciaMat)
      fasciaBoard.position.set(0, eaveLow - 0.10, hw + 0.025)
      fasciaBoard.castShadow = true
      fasciaBoard.userData.lod = 'detail'
      group.add(fasciaBoard)
      break
    }

    // ─── MANSARDOVÁ ───────────────────────────────────────────────────────────
    case 'mansardova': {
      // Mansardová střecha: dolní strmý svah + horní mírný svah na obou stranách
      // Klasická česká varianta: 2-svahová (sedlová mansarda)
      const lSlope = Math.min(slRad * 1.85, Math.PI * 0.42)  // dolní sklon ~65-70°
      const lFrac  = 0.38                                      // dolní svah = 38% šířky
      const lHw    = hw * lFrac                                // šířka dolního svahu
      const lH     = lHw * Math.tan(lSlope)                   // výška dolního svahu
      const uHw    = hw - lHw                                  // šířka horního svahu
      const uH     = uHw * Math.tan(slRad)                    // výška horního svahu

      const iY   = wH + lH                    // výška kolenního věnce (= báze horní části)
      const iZn  = -(hw - lHw)                // Z-pozice kolenního věnce (záporná strana)
      const iZp  =   hw - lHw                 // Z-pozice kolenního věnce (kladná strana)

      // Body na kolenní úrovni
      const IBL = [-hd, iY, iZn], IFL = [hd, iY, iZn]
      const IFR = [hd, iY, iZp], IBR = [-hd, iY, iZp]
      // Hřeben (plný)
      const RB = [-hd, iY + uH, 0], RF = [hd, iY + uH, 0]

      // Materiál pro dolní strmý svah (stejná krytina, jiný sklon)
      const lMat = getKrytinaMaterial(krytina, roofColor, pbrTex)
      applyRepeat(lMat, lHw / Math.cos(lSlope), ridgeLen)

      // Dolní svahy — pouze přední a zadní (sedlová varianta)
      group.add(meshFrom([
        ...quad(BL, FL, IFL, IBL),   // přední dolní svah
        ...quad(BR, IBR, IFR, FR),   // zadní dolní svah
      ], lMat))

      // Dolní boční stěny mansardy (svislé zdivo na štítových stranách, od okapu ke koleni)
      // Tyto plochy jsou STĚNA, ne střecha → wMat
      group.add(meshFrom([
        ...quad(BL, IBL, IBR, BR),   // levá (záporný X) boční stěna dolní části
        ...quad(FL, FR, IFR, IFL),   // pravá (kladný X) boční stěna dolní části
      ], wMat.clone()))

      // Horní svahy (mírné) — přední a zadní
      applyRepeat(mat, uHw / Math.cos(slRad), ridgeLen)
      pos = [
        ...quad(IBL, IFL, RF, RB),   // přední horní svah
        ...quad(IBR, RB, RF, IFR),   // zadní horní svah
      ]

      // Horní boční štítové trojúhelníky (zdivo nad kolením věncem)
      group.add(meshFrom(tri([-hd, iY, iZn], [-hd, iY, iZp], [-hd, iY + uH, 0]), wMat.clone()))
      group.add(meshFrom(tri([ hd, iY, iZp], [ hd, iY, iZn], [ hd, iY + uH, 0]), wMat.clone()))

      // Větrová lišta na horní části
      addVergeBoards(-hd, iY, uHw + iZp - iZp, uH, 0)
      addVergeBoards( hd, iY, uHw + iZp - iZp, uH, 0)
      break
    }

    // ─── PŮLVALBOVÁ ───────────────────────────────────────────────────────────
    case 'pulvalbova': {
      // Půlvalbová (Jerkinhead): jako valbová, ale s kratším hřebenem
      // Viditelná část štítu = vertikální zeď nad průsečíkem valbového svahu
      const valFrac = 0.32            // jak velká část šířky tvoří valbu (32 %)
      const rx      = hd - hw * valFrac  // vzdálenost konce hřebene od středu

      const RB = [-rx, wH + h, 0], RF = [rx, wH + h, 0]

      // Hlavní svahy — trapézoidy (od plné šířky okapu k zkrácenému hřebeni)
      pos = [
        ...quad(BL, FL, RF, RB),    // přední svah (trapézoid)
        ...quad(BR, RB, RF, FR),    // zadní svah (trapézoid)
        ...tri(BL, RB, BR),         // levý valbový trojúhelník (šikmý)
        ...tri(FL, FR, RF),         // pravý valbový trojúhelník (šikmý)
      ]

      // Štítové zdi — viditelná část zdiva na čele budovy
      // Tvoří ji trojúhelník od eave až ke střednímu hřebenu
      // Viditelná zeď je na vnitřní straně (±d/2), za přesahem
      const wallTopZ = 0   // zeď se tyčí ke středu (ridge Z=0)
      const wallH    = h   // plná výška od wH k hřebeni
      group.add(meshFrom(tri(
        [-d/2, wH, -s/2], [-d/2, wH, s/2], [-d/2, wH + wallH, 0]
      ), wMat.clone()))
      group.add(meshFrom(tri(
        [d/2, wH, s/2], [d/2, wH, -s/2], [d/2, wH + wallH, 0]
      ), wMat.clone()))

      // Nárožní lišty (4 ks — od rohů ke konci hřebene)
      addHipStrip([BL[0],BL[1],BL[2]], [RB[0],RB[1],RB[2]])
      addHipStrip([BR[0],BR[1],BR[2]], [RB[0],RB[1],RB[2]])
      addHipStrip([FL[0],FL[1],FL[2]], [RF[0],RF[1],RF[2]])
      addHipStrip([FR[0],FR[1],FR[2]], [RF[0],RF[1],RF[2]])
      break
    }

    // ─── TVAR L ───────────────────────────────────────────────────────────────
    case 'tvar-L':
    // ─── TVAR T ───────────────────────────────────────────────────────────────
    case 'tvar-T': {
      // Hlavní těleso — sedlová střecha (podél X osy)
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(0, h)
      addVergeBoards(-hd, wH, hw, h, 0)
      addVergeBoards( hd, wH, hw, h, 0)
      break
    }

    default: {
      const RB = [-hd, wH + h, 0], RF = [hd, wH + h, 0]
      pos = [...quad(BL, FL, RF, RB), ...quad(BR, RB, RF, FR)]
      addGableWalls(0, h)
    }
  }

  // ── L/T tvary — přistavěné křídlo (sedlová střecha kolmá na hlavní) ────────
  if (typ === 'tvar-L' || typ === 'tvar-T') {
    const kS   = Math.max(2, parseFloat(extras.kridloSirka) || 4)
    const kD   = Math.max(2, parseFloat(extras.kridloDelka) || 6)
    const kOff = parseFloat(extras.kridloOffset) || 0

    const kh  = (kS / 2) * Math.tan(slRad)
    const khw = kS / 2 + po
    const khd = kD / 2 + ps
    const kMat = mat.clone()
    const valleyMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.25, metalness: 0.65 })

    const wingGroup = new THREE.Group()
    const offsetX = typ === 'tvar-L'
      ? -(d / 2 + kD / 2)
      : kOff * Math.max(0, d / 2 - kD / 2)
    const offsetZ = s / 2 + kS / 2

    // Střecha křídla (sedlová, hřeben podél X — kolmý na hlavní hřeben)
    const kBL = [-khd, wH, -khw], kFL = [khd, wH, -khw]
    const kFR = [khd,  wH,  khw], kBR = [-khd, wH,  khw]
    const kRB = [-khd, wH + kh, 0], kRF = [khd, wH + kh, 0]
    wingGroup.add(meshFrom([...quad(kBL, kFL, kRF, kRB), ...quad(kBR, kRB, kRF, kFR)], kMat))

    // Štítová zeď křídla (vnější štít) — jen tam kde křídlo nevnavazuje na hlavní budovu
    if (typ === 'tvar-L') {
      wingGroup.add(meshFrom(tri([-kD/2, wH, -kS/2], [-kD/2, wH, kS/2], [-kD/2, wH + kh, 0]), wMat.clone()))
    } else {
      // T-tvar: oba štíty křídla jsou volné
      wingGroup.add(meshFrom(tri([-kD/2, wH, -kS/2], [-kD/2, wH, kS/2], [-kD/2, wH + kh, 0]), wMat.clone()))
      wingGroup.add(meshFrom(tri([kD/2, wH, kS/2], [kD/2, wH, -kS/2], [kD/2, wH + kh, 0]), wMat.clone()))
    }

    // Úžlabí — lesklý kovový plech v místě styku dvou střech
    // Úžlabí jde diagonálně od okapního rohu ke hřebeni
    const valH = Math.min(h, kh)
    const valleyLen = Math.sqrt(valH ** 2 + (kS / 2) ** 2)
    const valley = (xPos) => {
      const vMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.06, valleyLen),
        valleyMat.clone()
      )
      // Diagonální poloha: od [xPos, wH, 0] (na zdi) k [xPos, wH+valH, -kS/2]
      vMesh.position.set(xPos, wH + valH / 2, -kS / 4)
      vMesh.rotation.x = Math.atan2(valH, kS / 2)
      wingGroup.add(vMesh)
    }
    // Úžlabí na straně připojení ke křídlu
    if (typ === 'tvar-L') {
      valley(kD / 2)
    } else {
      valley(-kD / 2)
      valley( kD / 2)
    }

    wingGroup.position.set(offsetX, 0, offsetZ)
    group.add(wingGroup)
    addRidgeTiles(wingGroup, khd, wH + kh, krytina, roofColor, pbrTex)
  }

  if (pos.length > 0) group.add(meshFrom(pos, mat))

  // ── Hřebenáče ────────────────────────────────────────────────────────────────
  if (!['pultova', 'stanova'].includes(typ)) {
    let rY = wH + h
    let rx = hd
    if (typ === 'mansardova') {
      const lSlope = Math.min(slRad * 1.85, Math.PI * 0.42)
      const lH = hw * 0.38 * Math.tan(lSlope)
      const uH = (hw * 0.62) * Math.tan(slRad)
      rY = wH + lH + uH
    } else if (typ === 'valbova') {
      rx = Math.max(0.1, hd - hw)
    } else if (typ === 'pulvalbova') {
      rx = hd - hw * 0.32
    }
    addRidgeTiles(group, rx, rY, krytina, roofColor, pbrTex)
  }

  // ── Okapní plech ─────────────────────────────────────────────────────────────
  addEaveTrim(group, typ, hd, hw, wH, h)

  return group
}

// ── Pomocník: je krytina plošný kov? ────────────────────────────────────────
export function isSheetMetal(krytina = '') {
  return ['falcovany_plech','trapezovy_plech','vlnity_plech','med','titanzinek',
    'satjam_profifalc','satjam_rapid_deluxe','satjam_rapid_trend','satjam_tp26',
    'satjam_trapez','asfaltovy_pas','epdm_folie'].includes(krytina)
}

// ── Barva hřebenáče dle krytiny ─────────────────────────────────────────────
function ridgeTileColor(krytina = '') {
  if (['bobrovka','palena_drsnata','palena_romana','palena_francouzska',
       'tondach_figaro','keramicka','palena_stredomorska'].includes(krytina)) return 0x6e1e08
  if (['betonova','bramac_max','betonova_mala','betonova_plochá'].includes(krytina)) return 0x555563
  if (['sindel_dreveny','sindel_stepy'].includes(krytina)) return 0x3a2005
  if (krytina === 'bridlice') return 0x2a2a38
  if (krytina === 'rakos') return 0x5a4820
  if (krytina === 'asfaltovy_sindel') return 0x1a1a1a
  if (krytina === 'vlaknocement') return 0x3a4450
  if (krytina === 'med') return 0x7a4010
  if (krytina.startsWith('satjam_') || ['plechova_taska','falcovany_plech',
      'trapezovy_plech','vlnity_plech','titanzinek'].includes(krytina)) return 0x38404a
  return 0x3a0f00
}

// ── Hřebenáče — série polokruhových tašek podél hřebene ─────────────────────
function addRidgeTiles(group, rx, rY, krytina = '', roofColor = '#ffffff', pbrTex = null) {
  // Plechové krytiny → trojúhelníkový profil hřebenového plechu (2 lomené pásy)
  if (isSheetMetal(krytina)) {
    const col = roofColor && roofColor !== '#ffffff' ? roofColor : ridgeTileColor(krytina)
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.28, metalness: 0.72 })
    m.userData.isKrytina = true
    const peakH = 0.08, halfW = 0.18
    const slopeAngle = Math.atan2(peakH, halfW)
    const panelLen = Math.sqrt(halfW ** 2 + peakH ** 2)
    ;[-1, 1].forEach(side => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(rx * 2 + 0.06, 0.012, panelLen), m)
      panel.rotation.x = side * slopeAngle
      panel.position.set(0, rY + peakH / 2, side * halfW / 2)
      panel.castShadow = true
      group.add(panel)
    })
    return
  }

  // Hřebenáče stejné barvy/textury jako krytina (tint dle selectedColor)
  const capMat = getKrytinaMaterial(krytina, roofColor, pbrTex)

  const tileLen  = 0.35   // délka jednoho hřebenáče [m]
  const tileR    = 0.06   // poloměr půlkruhu
  const pitch    = 0.32   // spacing mezi sousedními hřebenáči
  const overlap  = tileLen - pitch
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
  const tH = 0.15, tD = 0.02 // výška a tloušťka okapního plechu

  const addBar = (x1, z1, x2, z2) => {
    const len = Math.sqrt((x2-x1)**2 + (z2-z1)**2)
    if (len < 0.1) return
    const bar = new THREE.Mesh(new THREE.BoxGeometry(len, tH, tD), trimMat)
    bar.position.set((x1+x2)/2, wH - tH/2, (z1+z2)/2)
    bar.rotation.y = Math.atan2(z2-z1, x2-x1)
    bar.castShadow = true; bar.receiveShadow = true
    group.add(bar)
  }

  // Okapní plech podél okapních hran
  if (['sedlova','asymetricka','mansardova','pulvalbova','pultova'].includes(typ)) {
    addBar(-hd, -hw, hd, -hw)
    addBar(-hd,  hw, hd,  hw)
  }
  if (['valbova','stanova'].includes(typ)) {
    addBar(-hd, -hw, hd, -hw)
    addBar(-hd,  hw, hd,  hw)
    addBar(-hd, -hw, -hd, hw)
    addBar( hd, -hw,  hd, hw)
  }
  if (typ === 'pulvalbova') {
    // Přidej okapní plech i na boční (valbové) části
    const rx_ = hd - hw * 0.32
    addBar(-hd, -hw, -rx_, 0)
    addBar(-hd,  hw, -rx_, 0)
    addBar( hd, -hw,  rx_, 0)
    addBar( hd,  hw,  rx_, 0)
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

// Kleštiny se zaříznutými konci podle sklonu střechy.
// kZL/kZR = Z osa levé/pravé krokve v místě kleštiny, tanSl = tan(sklon).
function addKlestina(group, mat, x, klY, kZL, kZR, bw, bh, tanSl) {
  if (kZR - kZL < 0.05) return
  const dz = (bh / 2) / tanSl          // vodorovný přesah zářezu (kolik mm)
  const x0 = x - bw / 2, x1 = x + bw / 2
  const y0 = klY - bh / 2, y1 = klY + bh / 2
  const zLb = kZL - dz, zLt = kZL + dz  // levý konec: Z dole / nahoře
  const zRb = kZR + dz, zRt = kZR - dz  // pravý konec: Z dole / nahoře
  // 12 trojúhelníků, neindexováno — computeVertexNormals počítá normály podle ploch
  const pos = new Float32Array([
    // Levý zaříznutý konec (normála ~−Z)
    x0,y0,zLb,  x0,y1,zLt,  x1,y1,zLt,
    x0,y0,zLb,  x1,y1,zLt,  x1,y0,zLb,
    // Pravý zaříznutý konec (normála ~+Z)
    x0,y0,zRb,  x1,y0,zRb,  x1,y1,zRt,
    x0,y0,zRb,  x1,y1,zRt,  x0,y1,zRt,
    // Spodní plocha (−Y)
    x0,y0,zLb,  x1,y0,zLb,  x1,y0,zRb,
    x0,y0,zLb,  x1,y0,zRb,  x0,y0,zRb,
    // Vrchní plocha (+Y)
    x0,y1,zRt,  x1,y1,zRt,  x1,y1,zLt,
    x0,y1,zRt,  x1,y1,zLt,  x0,y1,zLt,
    // Přední stěna x0 (−X)
    x0,y0,zLb,  x0,y0,zRb,  x0,y1,zRt,
    x0,y0,zLb,  x0,y1,zRt,  x0,y1,zLt,
    // Zadní stěna x1 (+X)
    x1,y0,zLb,  x1,y1,zLt,  x1,y1,zRt,
    x1,y0,zLb,  x1,y1,zRt,  x1,y0,zRb,
  ])
  const uvs = new Float32Array(pos.length / 3 * 2)
  for (let i = 0; i < pos.length / 3; i++) {
    uvs[i*2]   = (pos[i*3] - x0) / bw
    uvs[i*2+1] = (pos[i*3+1] - y0) / bh
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2))
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  group.add(mesh)
}

export function buildKrov(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 3, roztecKrokvi = 900, krytina = '') {
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

  const nMez = Math.max(1, Math.ceil(d / roz))
  const dRoz = d / nMez
  const krokvePosX = Array.from({ length: nMez + 1 }, (_, i) => -d / 2 + i * dRoz)

  // ── Skutečné průřezy prvků (shodují se s kalkulátorem Krov & konstrukce) ───
  const POZ_H = 0.12, POZ_W = 0.12  // Pozednice 120×120 mm
  const HRE_H = 0.20, HRE_W = 0.14  // Vrcholová vaznice 140×200 mm
  const STV_H = 0.18, STV_W = 0.12  // Středová vaznice 120×180 mm
  const KRO_H = 0.18, KRO_W = 0.10  // Krokve 100×180 mm
  const KLE_H = 0.16, KLE_W = 0.06  // Kleštiny 60×160 mm
  const kleOffset = KRO_W / 2 + KLE_W / 2  // odsazení kleštiny od osy krokve = 0.08 m
  const cosSlope = Math.cos(slRad)
  const sinSlope = Math.sin(slRad)
  const tanSlope = sinSlope / cosSlope

  const buildSedlova = (ridgeZ = 0, ridgeH = h, leftPo = po, rightPo = po) => {
    // Polohy středů a vrchních ploch podpor
    const pozCY  = wH + POZ_H / 2            // střed pozednice
    const pozTop = wH + POZ_H                 // vrchní strana pozednice
    const hreCY  = wH + ridgeH               // střed vrcholové vaznice
    const hreTop = hreCY + HRE_H / 2         // vrchní strana vrcholové vaznice

    // Krokev — polohování osy:
    //   spodní líc na vrchní straně pozednice (ve zdi),
    //   za zdí krokev klesá k okapu (kroStartY < kroAtWall),
    //   u hřebene se obě krokve uzavírají prodloužením za střed.
    const kroAdj      = (KRO_H / 2) * cosSlope           // svislá složka ½ výšky průřezu
    const kroAtWall   = pozTop + kroAdj                   // osa nad zdí: spodní líc = pozTop ✓
    const kroStartY   = kroAtWall - leftPo  * tanSlope   // osa u levého okapu (nižší)
    const kroStartYr  = kroAtWall - rightPo * tanSlope   // osa u pravého okapu
    const kroEndY     = hreTop + kroAdj                   // osa u hřebene: spodní líc = hreTop ✓
    const kroRidgeExt  = (KRO_H / 2) * sinSlope          // ΔZ prodloužení za hřeben
    const kroRidgeYExt = kroRidgeExt * tanSlope           // ΔY podél osy krokve

    // Pozednice — 120×120 mm
    addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
    addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)

    // Vrcholová vaznice — 140×200 mm, střed na úrovni teoretického hřebene
    addBeam(group, mHreben, V3(-d/2 - ps, hreCY, ridgeZ), V3(d/2 + ps, hreCY, ridgeZ), HRE_W, HRE_H)

    // Středové vaznice — vrchní strana leží na spodní straně krokve v místě vZ
    const vZ   = (s / 2) * 0.55
    const vZ_L = vZ - ridgeZ * 0.5         // abs. Z levé vaznice od středu budovy
    const t_vaz = Math.max(0, Math.min(1,
      (s/2 + leftPo - vZ_L) / Math.max(0.01, s/2 + leftPo + ridgeZ)
    ))
    const vY = kroStartY + t_vaz * (kroEndY - kroStartY) - kroAdj - STV_H / 2
    addBeam(group, mVaznice, V3(-d/2, vY, -(vZ - ridgeZ * 0.5)), V3(d/2, vY, -(vZ - ridgeZ * 0.5)), STV_W, STV_H)
    addBeam(group, mVaznice, V3(-d/2, vY,   vZ + ridgeZ * 0.5 ), V3(d/2, vY,   vZ + ridgeZ * 0.5 ), STV_W, STV_H)

    // Kleštiny — precomputed (nezávisí na x)
    // Vrchní strana kleštiny leží na spodní straně středové vaznice
    const stvBotY = vY - STV_H / 2
    const klY     = stvBotY - KLE_H / 2
    const t_kle   = Math.max(0, Math.min(1, (klY - kroStartY) / (kroEndY - kroStartY)))
    // Z-osa krokve v místě kleštiny (levá a pravá krokev)
    const kZL = -(s/2 + leftPo)  + t_kle * (ridgeZ + s/2 + leftPo)
    const kZR =  (s/2 + rightPo) + t_kle * (ridgeZ - s/2 - rightPo)

    // ── Kominová výměna ─────────────────────────────────────────────────────
    // Komín na kladné straně Z (pravý svah), pozice shodná s buildBuilding:
    //   chimX = d*0.28, chimZ = s*0.12, průřez 400×400 mm, ochranná mezera 100 mm
    const CHIM_X    = d * 0.28
    const CHIM_Z    = s * 0.12
    const VYM_REACH = 0.20 + 0.10        // CHIM_W/2 + clearance = 0.30 m
    const xTrim1    = CHIM_X - VYM_REACH  // levý vymezovací trám (střed osy)
    const xTrim2    = CHIM_X + VYM_REACH  // pravý vymezovací trám
    const zVymBot   = CHIM_Z + VYM_REACH  // dolní výměna (k okapu, kladné Z)
    const zVymTop   = Math.max(0.05, CHIM_Z - VYM_REACH)  // horní výměna (k hřebeni)
    // Y-osa pravé krokve v místě výměn (parametrické polohy podél krokve)
    const _z0     = s/2 + rightPo
    const _dzR    = _z0 - ridgeZ
    const tVymBot = Math.max(0, Math.min(1, (_z0 - zVymBot) / _dzR))
    const tVymTop = Math.max(0, Math.min(1, (_z0 - zVymTop) / _dzR))
    const yVymBot = kroStartYr + tVymBot * (kroEndY - kroStartYr)
    const yVymTop = kroStartYr + tVymTop * (kroEndY - kroStartYr)

    // Krokve — spodní líc na pozednici (ve zdi), nahoře uzavřeny přes hřeben
    krokvePosX.forEach(x => {
      // Levá krokev — vždy plná délka
      addBeam(group, mKrokev,
        V3(x, kroStartY,               -(s/2 + leftPo)),
        V3(x, kroEndY + kroRidgeYExt,   ridgeZ + kroRidgeExt),
        KRO_W, KRO_H
      )
      const inChimZone = x > xTrim1 && x < xTrim2
      if (inChimZone) {
        // Nárokrokve v komínové zóně: jen úseky nad a pod výměnou
        addBeam(group, mKrokev, V3(x, kroEndY+kroRidgeYExt, ridgeZ-kroRidgeExt), V3(x, yVymTop, zVymTop), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, yVymBot, zVymBot), V3(x, kroStartYr, s/2+rightPo), KRO_W, KRO_H)
      } else {
        // Pravá krokev — plná délka mimo zónu
        addBeam(group, mKrokev,
          V3(x, kroStartYr,             s/2 + rightPo),
          V3(x, kroEndY + kroRidgeYExt, ridgeZ - kroRidgeExt),
          KRO_W, KRO_H
        )
        addKlestina(group, mKles, x - kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
        addKlestina(group, mKles, x + kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
      }
    })

    // Vymezovací krokve (trimmers) na obou stranách komínu + kleštiny
    ;[xTrim1, xTrim2].forEach(xt => {
      addBeam(group, mKrokev, V3(xt, kroStartY,  -(s/2+leftPo)),  V3(xt, kroEndY+kroRidgeYExt, ridgeZ+kroRidgeExt), KRO_W, KRO_H)
      addBeam(group, mKrokev, V3(xt, kroStartYr,  s/2+rightPo),   V3(xt, kroEndY+kroRidgeYExt, ridgeZ-kroRidgeExt), KRO_W, KRO_H)
      addKlestina(group, mKles, xt - kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
      addKlestina(group, mKles, xt + kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
    })

    // Výměny (header beams) — vodorovné trámy na pravém svahu po stranách komínu
    addBeam(group, mKrokev, V3(xTrim1, yVymBot, zVymBot), V3(xTrim2, yVymBot, zVymBot), KRO_H, KRO_W)
    addBeam(group, mKrokev, V3(xTrim1, yVymTop, zVymTop), V3(xTrim2, yVymTop, zVymTop), KRO_H, KRO_W)
  }

  switch (typ) {
    case 'sedlova': case 'pulvalbova': buildSedlova(); break
    case 'asymetricka': buildSedlova(s * 0.10, h * 0.88); break

    case 'valbovy':
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
      // Krokve + kleštiny valbová — stejná logika jako buildSedlova
      const kroAtWall_v   = wH + POZ_H + kroAdj            // osa nad zdí (spodní líc = pozTop) ✓
      const kroStartY_v   = kroAtWall_v - po * tanSlope    // osa u okapu (klesá za zeď)
      const kroEndY_v     = hreTop + kroAdj
      const kroRidgeExt_v  = (KRO_H / 2) * sinSlope
      const kroRidgeYExt_v = kroRidgeExt_v * tanSlope
      const vZ_v        = (s / 2) * 0.55
      const t_vaz_v     = Math.max(0, Math.min(1, (s/2 + po - vZ_v) / Math.max(0.01, s/2 + po)))
      const vY_v        = kroStartY_v + t_vaz_v * (kroEndY_v - kroStartY_v) - kroAdj - STV_H / 2
      const klY_v       = vY_v - STV_H / 2 - KLE_H / 2
      const t_kle_v     = Math.max(0, Math.min(1, (klY_v - kroStartY_v) / (kroEndY_v - kroStartY_v)))
      const kZLv        = -(s/2 + po) * (1 - t_kle_v)
      const kZRv        =  (s/2 + po) * (1 - t_kle_v)
      krokvePosX.filter(x => x > -rx && x < rx).forEach(x => {
        addBeam(group, mKrokev, V3(x, kroStartY_v, -(s/2+po)), V3(x, kroEndY_v + kroRidgeYExt_v,  kroRidgeExt_v), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kroStartY_v,  s/2+po),   V3(x, kroEndY_v + kroRidgeYExt_v, -kroRidgeExt_v), KRO_W, KRO_H)
        addKlestina(group, mKles, x - kleOffset, klY_v, kZLv, kZRv, KLE_W, KLE_H, tanSlope)
        addKlestina(group, mKles, x + kleOffset, klY_v, kZLv, kZRv, KLE_W, KLE_H, tanSlope)
      })
      // Zkrácené krokve (jack rafters) ve valbových koncích
      const cornerY_v  = wH + POZ_H + kroAdj  // osa rohu valbové krokve (na zdi)
      const ridgeEndY_v = hreTop + kroAdj     // osa krokve u konce hřebene
      krokvePosX.filter(x => Math.abs(x) > rx).forEach(x => {
        const cornerX = x < 0 ? -d/2 : d/2
        const ridgeX  = x < 0 ? -rx  : rx
        const t = Math.abs((x - cornerX) / (ridgeX - cornerX + 0.001))
        const hipY  = cornerY_v + t * (ridgeEndY_v - cornerY_v)
        const hipZf = -(s/2) * (1 - t)
        const hipZb =  (s/2) * (1 - t)
        addBeam(group, mKrokev, V3(x, kroStartY_v, -(s/2+po)), V3(x, hipY, hipZf), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kroStartY_v,  s/2+po),  V3(x, hipY, hipZb), KRO_W, KRO_H)
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
      // Kleštiny stanové — pár krokví (přední+zadní) na každé pozici
      const stKroAdj = (KRO_H / 2) * cosSlope
      const stKlFrac = 0.62
      const stKlY  = (wH + POZ_H + stKroAdj) + stKlFrac * ((wH + h) - (wH + POZ_H + stKroAdj))
      const stKZh  = (s/2 + po) * (1 - stKlFrac)
      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2, -(s/2+po)), apex, KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, pozCY + POZ_H/2,  s/2+po),   apex, KRO_W, KRO_H)
        addKlestina(group, mKles, x - kleOffset, stKlY, -stKZh, stKZh, KLE_W, KLE_H, tanSlope)
        addKlestina(group, mKles, x + kleOffset, stKlY, -stKZh, stKZh, KLE_W, KLE_H, tanSlope)
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
      const mLTan = Math.tan(lSlope)
      const mURidgeExt  = (KRO_H / 2) * sinSlope
      const mURidgeYExt = mURidgeExt * tanSlope
      krokvePosX.forEach(x => {
        const lAdj = (KRO_H / 2) * lCosSlope
        const uAdj = (KRO_H / 2) * uCosSlope
        // Spodní krokve — osa u okapu klesá za zeď (eave descent) stejně jako u sedlové
        const lEaveY = wH + POZ_H + lAdj - po * mLTan
        addBeam(group, mKrokev, V3(x, lEaveY, -(s/2+po)), V3(x, kneeY + lAdj, -kneeZ), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, lEaveY,  s/2+po),   V3(x, kneeY + lAdj,  kneeZ), KRO_W, KRO_H)
        // Horní krokve — prodlouženy přes hřeben (uzavřená špička)
        addBeam(group, mKrokev, V3(x, kneeY + lAdj, -kneeZ), V3(x, kneeY + uH + uAdj + mURidgeYExt,  mURidgeExt), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kneeY + lAdj,  kneeZ), V3(x, kneeY + uH + uAdj + mURidgeYExt, -mURidgeExt), KRO_W, KRO_H)
        // Kleštiny mansard — vrchní strana na spodní straně hřebenového trámu
        const kroStartY_m = kneeY + lAdj
        const kroEndY_m   = kneeY + uH + uAdj
        const klY_m       = (kneeY + uH) - HRE_H / 2 - KLE_H / 2
        const t_kle_m     = Math.max(0, Math.min(1, (klY_m - kroStartY_m) / (kroEndY_m - kroStartY_m)))
        const kZLm        = -kneeZ * (1 - t_kle_m)
        const kZRm        =  kneeZ * (1 - t_kle_m)
        addKlestina(group, mKles, x - kleOffset, klY_m, kZLm, kZRm, KLE_W, KLE_H, tanSlope)
        addKlestina(group, mKles, x + kleOffset, klY_m, kZLm, kZRm, KLE_W, KLE_H, tanSlope)
      })
      break
    }

    case 'krokevni': {
      // Prostý krov — pozednice + krokve + kleštiny (bez vaznic, krokve se opírají o sebe)
      const pozCY  = wH + POZ_H / 2
      const pozTop = wH + POZ_H
      const kroAdj     = (KRO_H / 2) * cosSlope
      const kroStartY  = pozTop + kroAdj - po * tanSlope
      const kroEndY    = wH + h + kroAdj
      const kroRidgeExt  = (KRO_H / 2) * sinSlope
      const kroRidgeYExt = kroRidgeExt * tanSlope
      const klFrac = 0.58
      const klY    = kroStartY + klFrac * (kroEndY - kroStartY)
      const kZL    = -(s/2 + po) * (1 - klFrac)
      const kZR    =  (s/2 + po) * (1 - klFrac)
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, kroStartY, -(s/2+po)), V3(x, kroEndY + kroRidgeYExt,  kroRidgeExt), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kroStartY,  (s/2+po)), V3(x, kroEndY + kroRidgeYExt, -kroRidgeExt), KRO_W, KRO_H)
        addKlestina(group, mKles, x - kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
        addKlestina(group, mKles, x + kleOffset, klY, kZL, kZR, KLE_W, KLE_H, tanSlope)
      })
      break
    }

    case 'hambalkovy': {
      // Hambalkový krov — krokve + pozednice + hambalky (vodorovná táhla místo vaznic)
      const pozCY  = wH + POZ_H / 2
      const pozTop = wH + POZ_H
      const kroAdj     = (KRO_H / 2) * cosSlope
      const kroStartY  = pozTop + kroAdj - po * tanSlope
      const kroEndY    = wH + h + kroAdj
      const kroRidgeExt  = (KRO_H / 2) * sinSlope
      const kroRidgeYExt = kroRidgeExt * tanSlope
      const HAM_H = 0.18, HAM_W = 0.08
      const hamFrac = 0.48
      const hamY  = kroStartY + hamFrac * (kroEndY - kroStartY)
      const hamZL = -(s/2 + po) * (1 - hamFrac)
      const hamZR =  (s/2 + po) * (1 - hamFrac)
      addBeam(group, mPoz, V3(-d/2, pozCY, -s/2), V3(d/2, pozCY, -s/2), POZ_W, POZ_H)
      addBeam(group, mPoz, V3(-d/2, pozCY,  s/2), V3(d/2, pozCY,  s/2), POZ_W, POZ_H)
      krokvePosX.forEach(x => {
        addBeam(group, mKrokev, V3(x, kroStartY, -(s/2+po)), V3(x, kroEndY + kroRidgeYExt,  kroRidgeExt), KRO_W, KRO_H)
        addBeam(group, mKrokev, V3(x, kroStartY,  (s/2+po)), V3(x, kroEndY + kroRidgeYExt, -kroRidgeExt), KRO_W, KRO_H)
        addBeam(group, mKles, V3(x, hamY, hamZL), V3(x, hamY, hamZR), HAM_W, HAM_H)
      })
      break
    }

    case 'vaznicova-stoj': {
      // Stojatá stolice — sedlová + vazný trám + stojky pod hřeben. vaznicí
      buildSedlova()
      const vatY = wH + POZ_H + 0.14
      addBeam(group, mSloupek, V3(-d/2, vatY, 0), V3(d/2, vatY, 0), 0.14, 0.16)
      const stojkaBotY = vatY + 0.08
      const stojkaTopY = wH + h - HRE_H / 2 - 0.06
      if (stojkaTopY > stojkaBotY + 0.2) {
        krokvePosX.filter((_, i) => i % 2 === 0).forEach(x => {
          addBeam(group, mSloupek, V3(x, stojkaBotY, 0), V3(x, stojkaTopY, 0), 0.12, 0.12)
        })
      }
      break
    }

    case 'vaznicova-lez': {
      // Ležatá stolice — sedlová + šikmé vzpěry od hřebenové vaznice ke krokvím
      buildSedlova()
      const pozTop   = wH + POZ_H
      const kroAdj   = (KRO_H / 2) * cosSlope
      const kroStartY = pozTop + kroAdj - po * tanSlope
      const kroEndY   = wH + h + kroAdj
      const lezFrac   = 0.38
      const lezY      = kroStartY + lezFrac * (kroEndY - kroStartY)
      const lezZ      = (s/2 + po) * (1 - lezFrac)
      const ridgeCY   = wH + h
      krokvePosX.filter((_, i) => i % 3 === 0).forEach(x => {
        addBeam(group, mSloupek, V3(x, ridgeCY, 0), V3(x, lezY, -lezZ), 0.10, 0.14)
        addBeam(group, mSloupek, V3(x, ridgeCY, 0), V3(x, lezY,  lezZ), 0.10, 0.14)
      })
      break
    }

    default: buildSedlova()
  }

  addBattens(group, d, s, po, ps, wH, h, slRad, krytina, krokvePosX, POZ_H, HRE_H, KRO_H)

  return group
}

// ── Rozteč latí podle typu krytiny [m] (přibližně dle ČSN/výrobce) ──────────
function battenSpacing(krytina = '') {
  if (['bobrovka','palena_drsnata','sindel_dreveny','sindel_stepy','bridlice',
       'asfaltovy_sindel'].includes(krytina)) return 0.30
  if (['betonova_mala','betonova_plochá','keramicka','palena_stredomorska'].includes(krytina)) return 0.32
  if (['betonova','bramac_max','palena_romana','tondach_figaro',
       'palena_francouzska'].includes(krytina)) return 0.37
  return 0.35
}

// ── Laťování / bednění — kontralatě dosedají přímo na krokve (stejná X pozice
// i výška horního líce), latě pak dosedají na kontralatě. Vše od okapu po hřeben.
// Geometrie horního líce krokve odpovídá přesně buildSedlova() níže.
function addBattens(group, d, s, po, ps, wH, h, slRad, krytina = '', krokvePosX = null, POZ_H = 0.12, HRE_H = 0.20, KRO_H = 0.18) {
  // Sytší, kontrastnější barva kontralatí — ať jsou na první pohled odlišitelné
  // od latí i od krokví (širší průřez i tmavší tón).
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3e, roughness: 0.85 })
  const battenMat  = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 0.82 })
  const deckMat    = new THREE.MeshStandardMaterial({ color: 0xc4ad84, roughness: 0.88 })
  const foilMat    = new THREE.MeshStandardMaterial({
    color: 0x3a4550, roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide,
  })
  const hw = s / 2 + po, hd = d / 2 + ps
  const cosA = Math.cos(slRad), tanA = Math.tan(slRad)
  const slopeLen = Math.sqrt(hw * hw + h * h)
  const sheet = isSheetMetal(krytina)

  // Horní líc krokve (osa + půl výšky průřezu) — od okapu (t=0) po hřeben (t=1).
  // Shoda s buildSedlova: kroStartY/kroEndY je OSA krokve, +kroAdj = horní líc.
  const kroAdj    = (KRO_H / 2) * cosA
  const kroStartY = wH + POZ_H + kroAdj - po * tanA
  const kroEndY   = wH + h + HRE_H / 2 + kroAdj
  const kroTopAt  = t => kroStartY + t * (kroEndY - kroStartY) + kroAdj

  // X pozice — VŽDY shodné s pozicemi krokví (žádná samostatná rozteč)
  const xs = (krokvePosX && krokvePosX.length) ? krokvePosX : (() => {
    const n = Math.max(4, Math.round((2 * hd) / 0.9))
    return Array.from({ length: n + 1 }, (_, i) => -hd + i * (2 * hd) / n)
  })()

  // ── Pojistná/parotěsná fólie — souvislá vrstva přímo na krokvích, pod
  // kontralatěmi (typicky difúzní fólie chránící krov, zde zjednodušeně
  // jedna vrstva). Kladena v překrývajících se pruzích od okapu k hřebeni.
  const FOIL_T = 0.004
  const nFoilStrips = 5
  const stripOverlap = 1.08
  for (let i = 0; i < nFoilStrips; i++) {
    const t0 = i / nFoilStrips, t1 = (i + 1) / nFoilStrips
    const tm = (t0 + t1) / 2
    const stripLen = (slopeLen / nFoilStrips) * stripOverlap
    ;[-1, 1].forEach(sign => {
      const z = sign * hw * (1 - tm)
      const y = kroTopAt(tm) + cosA * (FOIL_T / 2 + 0.001)
      const m = new THREE.Mesh(new THREE.BoxGeometry(2 * hd, FOIL_T, stripLen), foilMat)
      m.rotation.x = sign * slRad
      m.position.set(0, y, z)
      group.add(m)
    })
  }

  // Kontralatě — leží NA fólii (která leží na krokvích), širší průřez pro
  // dobrou viditelnost (t=0.5, protože krokev i kontralať jsou rovné po celé
  // délce svahu, stačí dosadit ve středu).
  const KL_W = 0.07, KL_H = 0.04
  const kontraBaseY = kroTopAt(0.5) + cosA * FOIL_T
  const kontraCenterY = kontraBaseY + cosA * (KL_H / 2)
  xs.forEach(x => {
    ;[-1, 1].forEach(sign => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(KL_W, KL_H, slopeLen), counterMat)
      m.rotation.x = sign * slRad
      m.position.set(x, kontraCenterY, sign * hw / 2)
      m.castShadow = true
      group.add(m)
    })
  })

  if (sheet) {
    // Plechová krytina — plný záklop (OSB/prkna) na kontralatích, místo řídkého
    // laťování, od okapu (t=0) až po hřeben (t=1), v několika deskách po sklonu.
    const nBoards = 3
    for (let b = 0; b < nBoards; b++) {
      const t0 = b / nBoards, t1 = (b + 1) / nBoards
      const tm = (t0 + t1) / 2
      const boardLen = (slopeLen / nBoards)
      ;[-1, 1].forEach(sign => {
        const z = sign * hw * (1 - tm)
        const y = kroTopAt(tm) + cosA * (FOIL_T + KL_H + 0.012)
        const m = new THREE.Mesh(new THREE.BoxGeometry(2 * hd, 0.024, boardLen - 0.01), deckMat)
        m.rotation.x = sign * slRad
        m.position.set(0, y, z)
        m.castShadow = true
        group.add(m)
      })
    }
    return
  }

  // Latě — příčné, rovnoběžné s okapem/hřebenem, dosedají na kontralatě,
  // rozteč dle typu krytiny, od okapu (t=0) po hřeben (t=1)
  const LT_H = 0.03
  const rozted = battenSpacing(krytina)
  const nRows = Math.max(3, Math.ceil(slopeLen / rozted))
  for (let r = 0; r <= nRows; r++) {
    const t = r / nRows
    ;[-1, 1].forEach(sign => {
      const z = sign * hw * (1 - t)
      const y = kroTopAt(t) + cosA * (FOIL_T + KL_H + LT_H / 2 + 0.005)
      const m = new THREE.Mesh(new THREE.BoxGeometry(2 * hd, LT_H, 0.05), battenMat)
      m.rotation.x = sign * slRad
      m.position.set(0, y, z)
      m.castShadow = true
      group.add(m)
    })
  }
}

// ─── Pultový vikýř — kompletní viditelná tesařská konstrukce ─────────────────
// Sklon střechy vikýře: 15° (plochý pult). Sloupky, krokve, úžlabní krokve,
// vrcholová lata, bednění čelní stěny, okno s příčníkem, kompletní oplechování.
function buildPultovyVikyr(group, opts) {
  const {
    posX, sign, zBase, yBase, zBack, depthZ, depthY, depthSl,
    dw, dh, gMat, pbrTex,
  } = opts

  const postMat  = woodMaterial(true, pbrTex)   // tmavší dřevo — nosné prvky
  const boardMat = woodMaterial(false, pbrTex)  // světlejší dřevo — bednění
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.5 })
  const flashMat = new THREE.MeshStandardMaterial({ color: 0x6b7f6b, roughness: 0.3, metalness: 0.85, side: THREE.DoubleSide })
  const deckMat  = new THREE.MeshStandardMaterial({ color: 0x5a2e10, roughness: 0.85 })

  // Rovina čelní stěny — mírně vysunutá před průsečík se svahem (stejná konvence jako sedlový vikýř)
  const frontOffset = 0.10
  const frontZ = zBase + sign * frontOffset

  // ── Pomocník: dřevěný/kovový trám mezi dvěma body (auto-orientace) ─────────
  const addTimber = (p1, p2, bw, bh, mat) => {
    const dir = new THREE.Vector3(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2])
    const len = dir.length()
    if (len < 0.03) return null
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, len), mat)
    m.position.set((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2)
    m.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize())
    )
    m.castShadow = true; m.receiveShadow = true
    group.add(m)
    return m
  }

  // ── 1. ČELNÍ STĚNA — sloupky, překlad, bednění ─────────────────────────────
  const postW = 0.10
  ;[-1, 1].forEach(side => {
    const px = posX + side * (dw / 2 - postW / 2)
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, dh, postW), postMat.clone())
    post.position.set(px, yBase + dh / 2, frontZ)
    post.castShadow = true; post.receiveShadow = true
    group.add(post)
  })

  const lintelH = 0.16, lintelW = 0.10
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(dw, lintelH, lintelW), postMat.clone())
  lintel.position.set(posX, yBase + dh - lintelH / 2, frontZ)
  lintel.castShadow = true
  group.add(lintel)

  // Bednění — svislé latě 20×100 mm s mezerou 5 mm (vyplňuje celou šířku, okno je před ním)
  const boardW = 0.10, boardGap = 0.005, boardPitch = boardW + boardGap
  const boardCount = Math.max(3, Math.floor((dw - 0.04) / boardPitch))
  const boardH = dh - lintelH - 0.04
  const boardStartX = posX - (boardCount * boardPitch) / 2 + boardPitch / 2
  for (let i = 0; i < boardCount; i++) {
    const bx = boardStartX + i * boardPitch
    const board = new THREE.Mesh(new THREE.BoxGeometry(boardW, boardH, 0.02), boardMat.clone())
    board.position.set(bx, yBase + boardH / 2 + 0.02, frontZ - sign * 0.03)
    board.castShadow = true; board.receiveShadow = true
    group.add(board)
  }

  // ── 5. OKNO vikýře ──────────────────────────────────────────────────────────
  const winW = dw - 0.30, winH = dh - 0.25
  const winCY = yBase + 0.10 + winH / 2
  const winZ  = frontZ + sign * 0.01

  const fT = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.10, 0.06, 0.08), frameMat.clone())
  fT.position.set(posX, winCY + winH / 2 + 0.03, winZ)
  const fB = fT.clone(); fB.position.set(posX, winCY - winH / 2 - 0.03, winZ)
  const fL = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH + 0.10, 0.08), frameMat.clone())
  fL.position.set(posX - winW / 2 - 0.03, winCY, winZ)
  const fR = fL.clone(); fR.position.set(posX + winW / 2 + 0.03, winCY, winZ)
  ;[fT, fB, fL, fR].forEach(m => { m.castShadow = true; group.add(m) })

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), gMat)
  glass.position.set(posX, winCY, winZ + sign * 0.02)
  if (sign < 0) glass.rotation.y = Math.PI
  group.add(glass)

  // Příčník uprostřed (dělení okna na 2 části)
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, winH, 0.06), frameMat.clone())
  mullion.position.set(posX, winCY, winZ + sign * 0.01)
  mullion.castShadow = true
  group.add(mullion)

  // ── 2+3. KROKVE pultové střechy + ÚŽLABNÍ KROKVE ──────────────────────────
  const dormerSlope = 15 * Math.PI / 180
  const rafterW = 0.08, rafterH = 0.16
  const overhang = 0.15
  const frontRafterY = yBase + dh + rafterH / 2
  const frontRafterZ = frontZ + sign * overhang
  const runZ   = depthZ + overhang
  const riseY  = runZ * Math.tan(dormerSlope)
  const backRafterY = frontRafterY + riseY
  const backRafterZ = zBack

  // 4 krokve rovnoměrně po šířce (spacing dw/3) — krajní 2 jsou silnější = úžlabní
  for (let i = 0; i <= 3; i++) {
    const rx = posX - dw / 2 + i * (dw / 3)
    const isEdge = (i === 0 || i === 3)
    addTimber(
      [rx, frontRafterY, frontRafterZ], [rx, backRafterY, backRafterZ],
      isEdge ? 0.10 : rafterW, isEdge ? rafterH : rafterH,
      postMat.clone()
    )
  }

  // Samostatné diagonální úžlabní krokve — od rohů čelní stěny ven k hlavní střeše
  // uhel = atan2(šířka/2, hloubka vikýře) — určuje rozevření diagonály v půdoryse
  const uhel = Math.atan2(dw / 2, depthSl)
  ;[-1, 1].forEach(side => {
    const cornerX = posX + side * dw / 2
    const outX    = posX + side * (dw / 2 + 0.30 * Math.sin(uhel) * 2)
    addTimber(
      [cornerX, frontRafterY - 0.02, frontRafterZ], [outX, backRafterY - 0.05, zBack],
      0.10, rafterH, postMat.clone()
    )
  })

  // ── 4. VRCHOLOVÁ LATA pultového vikýře ─────────────────────────────────────
  const purlin = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.16, 0.10, rafterW), postMat.clone())
  purlin.position.set(posX, backRafterY, backRafterZ)
  purlin.castShadow = true
  group.add(purlin)

  // Bednění/krytina pultové stříšky (kryje krokve)
  addTimber(
    [posX, frontRafterY + rafterH / 2 + 0.015, frontRafterZ],
    [posX, backRafterY + rafterH / 2 + 0.015, backRafterZ],
    dw + 0.14, 0.03, deckMat
  )

  // ── 6. OPLECHOVÁNÍ ──────────────────────────────────────────────────────────
  // Bočnice — trojúhelníkový plech v místě průniku pultové střechy s hlavní střechou
  const slopeDir = new THREE.Vector3(0, depthY, zBack - zBase).normalize()
  ;[-1, 1].forEach(side => {
    const ex = posX + side * dw / 2
    const A = [ex, yBase, zBase]
    const B = [ex, frontRafterY, frontRafterZ]
    const C = [ex, backRafterY, backRafterZ]
    group.add(meshFrom(side > 0 ? tri(A, B, C) : tri(B, A, C), flashMat))
  })

  // Oplechování paty vikýře — vodorovný plech navazující na tašky hlavní střechy
  const baseFlash = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.30, 0.015, 0.20), flashMat)
  baseFlash.setRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), slopeDir)
  )
  baseFlash.position.set(posX, yBase, zBase)
  baseFlash.castShadow = true
  group.add(baseFlash)

  // Okapní plech čelní — pod oknem, sklon ~5° pro odvod vody
  const frontFlash = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.10, 0.012, 0.15), flashMat)
  frontFlash.rotation.x = sign * (5 * Math.PI / 180)
  frontFlash.position.set(posX, yBase + 0.02, frontZ + sign * 0.12)
  frontFlash.castShadow = true
  group.add(frontFlash)
}

// ─── Vikýř (dormer) ──────────────────────────────────────────────────────────
export function buildDormer(vikyf, { sirka, delka, sklon, presahOkap, wallHeight = 2.7 }, pbrTex = null, krytina = '', roofColor = '#ffffff', showStructure = false) {
  const s      = Math.max(parseFloat(sirka) || 8, 2)
  const d      = Math.max(parseFloat(delka) || 12, 2)
  const po     = Math.max(parseFloat(presahOkap) || 0.3, 0)
  const wH     = parseFloat(wallHeight) || 2.7
  const slRad  = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180
  const h      = (s / 2) * Math.tan(slRad)
  const cosA   = Math.cos(slRad), sinA = Math.sin(slRad), tanA = Math.tan(slRad)

  const { typ = 'sedlovy', sirka: dw = 1.5, vyska: dh = 1.4, poziceX = 0, strana = 'predni' } = vikyf

  // FIX: přední strana budovy = kladné Z (kde jsou okna/dveře) → sign = +1
  const sign  = strana === 'predni' ? 1 : -1
  const posX  = poziceX * (d / 2 - dw / 2 - 0.3)

  // Pozice na svahu (40 % od okapu k hřebenu)
  const sT    = 0.40
  const eaveZ = s / 2 + po
  const zBase = sign * eaveZ * (1 - sT)    // Z na svahu (kladné pro přední)
  const yBase = wH + h * sT                // Y výška v tom místě

  // Hloubka vikýře podél svahu směrem k hřebenu
  const depthSl = 0.90
  const depthZ  = depthSl * cosA
  const depthY  = depthSl * sinA

  // Zadní hrana vikýře (blíže hřebenu)
  const zBack  = zBase - sign * depthZ
  const yBack  = yBase + depthY

  const group   = new THREE.Group()
  const wMat    = wallMaterial(pbrTex)
  const gMat    = new THREE.MeshStandardMaterial({ color: 0x7ec8e3, opacity: 0.45, transparent: true, roughness: 0.1 })
  const fMat    = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.8 })
  const kMat    = woodMaterial(false, pbrTex)
  // Sytě hnědá — krokve vikýře musí být v konstrukčním pohledu dobře vidět,
  // odlišně od laťování hlavní střechy (které je v podobném tónu jako kMat).
  const krokveMat = new THREE.MeshStandardMaterial({ color: 0xa05020, roughness: 0.80 })
  const vMat    = new THREE.MeshStandardMaterial({ color: 0x7a9ab0, metalness: 0.85, roughness: 0.15 })

  // ── PULTOVÝ VIKÝŘ — kompletní tesařská konstrukce ──────────────────────────
  if (typ === 'pultovy') {
    buildPultovyVikyr(group, {
      posX, sign, zBase, yBase, zBack, yBack, depthZ, depthY, depthSl,
      dw, dh, cosA, sinA, tanA, wMat, gMat, kMat, pbrTex,
    })
    return group
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEDLOVÝ VIKÝŘ — hřeben vede OD ČELA DOZADU (kolmo na hlavní hřeben),
  // štítová stěna s oknem je vpředu, střecha se sklání doleva/doprava.
  // Celá hmota vikýře je "vytažena" podél sklonu hlavní střechy (slopeDir),
  // takže boční stěny i okapy korektně dosedají na hlavní střešní rovinu.
  // ═══════════════════════════════════════════════════════════════════════════
  const fwZ      = zBase + sign * 0.10        // rovina čelní stěny (mírně před svahem)
  const wallTopY = yBase + dh                  // úroveň okapu vikýře (horní hrana stěny)
  const peakH    = dw * 0.32                   // výška štítového vrcholu nad okapem
  const ridgeY   = wallTopY + peakH            // výška hřebene vpředu
  const overhang = 0.12                        // přesah střechy (boční i čelní)

  // Zadní hrana hřebene/okapu vikýře — VODOROVNÁ, dopočítaná tam, kde rovina
  // hlavní střechy dosáhne příslušné výšky (Y(Z) = wH+h − (h/eaveZ)·|Z|).
  const meetZ = (targetY) => {
    const raw = eaveZ * (h + wH - targetY) / h
    return Math.max(0.15, Math.min(raw, eaveZ * 0.95))
  }
  const ridgeZBack = sign * meetZ(ridgeY)
  const eaveZBack  = sign * meetZ(wallTopY)

  const roofMat = getKrytinaMaterial(krytina, roofColor, pbrTex)
  applyRepeat(roofMat, 1, 1)
  const ridgeCapMat = new THREE.MeshStandardMaterial({ color: 0x3a0f00, roughness: 0.85 })
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a1a05, roughness: 0.85 })

  // ── Čelní stěna (zděná, vertikální, s oknem) ───────────────────────────────
  const fw = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.18), wMat)
  fw.position.set(posX, yBase + dh / 2, fwZ)
  fw.castShadow = true; fw.receiveShadow = true
  group.add(fw)

  // Okno
  const winW = dw * 0.62, winH = dh * 0.58
  const wg  = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.06), gMat)
  wg.position.set(posX, yBase + dh * 0.55, fwZ + sign * 0.08)
  const wfr = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.10, winH + 0.10, 0.10), fMat)
  wfr.position.set(posX, yBase + dh * 0.55, fwZ + sign * 0.05)
  group.add(wg, wfr)

  // ── Štítový trojúhelník (zděný, vertikální, nad oknem) ─────────────────────
  group.add(meshFrom(tri(
    [posX - dw / 2, wallTopY, fwZ],
    [posX + dw / 2, wallTopY, fwZ],
    [posX, ridgeY, fwZ],
  ), wMat.clone()))

  // ── Boční stěny — ZDĚNÉ, trojúhelníkové, dosedají na hlavní střechu ────────
  ;[-1, 1].forEach(side => {
    const x = posX + side * dw / 2
    group.add(meshFrom(tri(
      [x, yBase, zBase],
      [x, wallTopY, fwZ],
      [x, wallTopY, eaveZBack],
    ), wMat.clone()))
  })

  // ── Střecha — dvě rovinné plochy se skutečnou krytinou, hřeben i okap VODOROVNÉ
  const ridgeFrontOvh = [posX, ridgeY, fwZ + sign * overhang]
  const ridgeBackPt   = [posX, ridgeY, ridgeZBack]

  ;[-1, 1].forEach(side => {
    const ex = posX + side * (dw / 2 + overhang)
    const eaveFrontOvh = [ex, wallTopY, fwZ + sign * overhang]
    const eaveBackPt   = [ex, wallTopY, eaveZBack]
    group.add(meshFrom(quad(eaveFrontOvh, ridgeFrontOvh, ridgeBackPt, eaveBackPt), roofMat))

    // Okapní lišta podél boční hrany střechy (vodorovná)
    const edgeLen = Math.abs(eaveZBack - fwZ) + overhang
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, edgeLen), trimMat)
    trim.position.set(ex, wallTopY - 0.02, (fwZ + eaveZBack) / 2)
    trim.castShadow = true
    group.add(trim)
  })

  // Hřebenová lišta (hřebenáč) — vodorovná
  const ridgeLen = Math.abs(ridgeZBack - fwZ) + overhang
  const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, ridgeLen), ridgeCapMat)
  ridgeCap.position.set(posX, ridgeY + 0.02, (fwZ + ridgeZBack) / 2)
  ridgeCap.castShadow = true
  group.add(ridgeCap)

  // ── Krovové prvky vikýře — POUZE v konstrukčním pohledu (Krov/Klempíř) ─────
  // Sytá barva (krokveMat), aby krokve byly dobře odlišitelné od laťování
  // hlavní střechy okolo vikýře.
  if (showStructure) {
    const addKrokev = (p1, p2, bw = 0.08, bh = 0.14) => {
      const dir = new THREE.Vector3(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2])
      const len = dir.length()
      if (len < 0.05) return
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, len), krokveMat)
      m.position.set((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2)
      m.setRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir.clone().normalize())
      )
      m.castShadow = true; m.receiveShadow = true
      group.add(m)
    }
    // Hřebenová vaznice vikýře
    addKrokev([posX, ridgeY, fwZ], [posX, ridgeY, ridgeZBack], 0.10, 0.12)
    // Krokve od hřebene k bočním okapům — přední, střední a zadní pár
    ;[0, 0.5, 1].forEach(t => {
      const rz = fwZ + t * (ridgeZBack - fwZ)
      ;[-1, 1].forEach(side => {
        const ex = posX + side * (dw / 2 + overhang)
        const ez = fwZ + t * (eaveZBack - fwZ)
        addKrokev([posX, ridgeY, rz], [ex, wallTopY, ez])
      })
    })
  }

  // ── Úžlabní plechy — kde vikýř ústí do hlavní střechy ──────────────────────
  ;[-1, 1].forEach(side => {
    const vSX = posX + side * dw / 2
    const vDX = side * 0.55
    const vDY = -tanA * 0.65
    const vDZ = -sign * 0.70
    const vLen = Math.sqrt(vDX**2 + vDY**2 + vDZ**2)
    const vm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.012, vLen), vMat)
    vm.position.set(vSX + vDX/2, wallTopY + vDY/2, eaveZBack + vDZ/2)
    vm.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(vDX, vDY, vDZ).normalize()
      )
    )
    vm.castShadow = true
    group.add(vm)
  })

  return group
}

// ─── Střešní okno (Velux style) ───────────────────────────────────────────────
export function buildRoofWindow(okno, { sirka, delka, sklon, presahOkap, wallHeight = 2.7 }) {
  const s      = Math.max(parseFloat(sirka) || 8, 2)
  const d      = Math.max(parseFloat(delka) || 12, 2)
  const po     = Math.max(parseFloat(presahOkap) || 0.3, 0)
  const wH     = parseFloat(wallHeight) || 2.7
  const slRad  = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180
  const tanA   = Math.tan(slRad)
  const h      = (s / 2) * tanA

  const { sirka: ow = 0.78, vyska: oh = 0.98, poziceX = 0, poziceSklon = 0.45, strana = 'predni' } = okno
  // FIX: přední = kladné Z → sign = +1
  const sign   = strana === 'predni' ? 1 : -1
  const posX   = poziceX * (d / 2 - ow / 2 - 0.5)

  // Pozice na svahu
  const sT     = Math.max(0.1, Math.min(0.85, poziceSklon))
  const slopeZ = sign * (s / 2 + po) * (1 - sT)
  const slopeY = wH + (s / 2 + po) * tanA * sT

  const group   = new THREE.Group()
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6ab8d4, opacity: 0.55, transparent: true, roughness: 0.08, metalness: 0.2 })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.7 })

  const frameBox = new THREE.Mesh(new THREE.BoxGeometry(ow + 0.1, 0.06, oh + 0.1), frameMat)
  frameBox.rotation.x = -sign * slRad
  frameBox.position.set(posX, slopeY + 0.03, slopeZ)
  group.add(frameBox)

  const glassBox = new THREE.Mesh(new THREE.BoxGeometry(ow - 0.06, 0.04, oh - 0.06), glassMat)
  glassBox.rotation.x = -sign * slRad
  glassBox.position.set(posX, slopeY + 0.05, slopeZ)
  group.add(glassBox)

  return group
}

// ─── Klempířina (plumber / metalwork view) ────────────────────────────────────
export function buildKlempirsky(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight, roztecKrokvi, vikyre = [], krytina = '') {
  const s   = Math.max(parseFloat(sirka)      || 8,   2)
  const d   = Math.max(parseFloat(delka)      || 12,  2)
  const po  = Math.max(parseFloat(presahOkap) || 0.3, 0)
  const ps  = Math.max(parseFloat(presahStit) || 0.3, 0)
  const wH  = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const slRad = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180
  const roz = Math.max(0.4, (parseFloat(roztecKrokvi) || 900) / 1000)
  const h   = (s / 2) * Math.tan(slRad)
  const hw  = s / 2 + po
  const hd  = d / 2 + ps
  const sheet = isSheetMetal(krytina)

  const group  = new THREE.Group()
  const zMat   = new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.30, metalness: 0.70 })
  const cuMat  = new THREE.MeshStandardMaterial({ color: 0xa07840, roughness: 0.25, metalness: 0.75 })
  const dkMat  = new THREE.MeshStandardMaterial({ color: 0x3a4550, roughness: 0.40, metalness: 0.60 })
  const hkMat  = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.35, metalness: 0.65 })

  const nMez = Math.max(1, Math.ceil(d / roz))
  const dRoz = d / nMez
  const krokvePosX = Array.from({ length: nMez + 1 }, (_, i) => -d / 2 + i * dRoz)

  // ── Žlaby (půlkruhové trubky podél okapu) ─────────────────────────────────
  const gutterLen = hd * 2 + 0.40
  ;[-1, 1].forEach(sign => {
    const z = sign * hw
    const gutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, gutterLen, 12, 1, false, 0, Math.PI),
      zMat.clone()
    )
    gutter.position.set(0, wH - 0.06, z)
    gutter.rotation.set(sign > 0 ? Math.PI : 0, Math.PI / 2, 0)
    gutter.castShadow = true
    group.add(gutter)
  })

  // ── Střešní háky — jeden na každé krokvi (obě strany) ─────────────────────
  krokvePosX.forEach(x => {
    ;[-1, 1].forEach(sign => {
      // Vodorovná část háku (přichycení ke krokvi)
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), hkMat.clone())
      h1.position.set(x, wH - 0.08, sign * (hw - 0.14))
      h1.rotation.x = -sign * slRad
      h1.castShadow = true
      group.add(h1)
      // Svislá část háku (drží žlab)
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), hkMat.clone())
      h2.position.set(x, wH - 0.12, sign * hw)
      h2.castShadow = true
      group.add(h2)
    })
  })

  // ── Svody + kotlíky — POUZE na krajích budovy (rohy), nikdy uprostřed ──────
  // Kotlík (u žlabu) → koleno 1 → krátký vodorovný úsek ke zdi → koleno 2 →
  // svislý svod uchycený v objímkách 14 cm od líce zdi (osa svodu).
  const svodOffset = 0.14                 // vzdálenost osy svodu od zdi
  const svodPosX   = [-hd + 0.4, hd - 0.4] // jen oba krajní rohy
  const svodH      = wH - 0.20

  svodPosX.forEach(sx => {
    ;[-1, 1].forEach(sign => {
      const eaveSz = sign * hw                    // okap/žlab (vnější hrana přesahu)
      const wallSz = sign * (s / 2)                // skutečné líce zdi
      const svodSz = sign * (s / 2 + svodOffset)   // osa svodu — 14 cm od zdi

      // Kotlík (trychtýř, měď) — pod žlabem
      const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.20, 10), cuMat.clone())
      funnel.position.set(sx, wH - 0.10, eaveSz)
      funnel.castShadow = true
      group.add(funnel)

      // Koleno 1 — od kotlíku směrem ke zdi (vodorovné/šikmé spojení)
      const run1Len = Math.abs(eaveSz - svodSz)
      const run1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, run1Len, 10), zMat.clone())
      run1.position.set(sx, wH - 0.28, (eaveSz + svodSz) / 2)
      run1.rotation.x = Math.PI / 2
      run1.castShadow = true
      group.add(run1)

      const elbow1 = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.022, 8, 8, Math.PI / 2), zMat.clone())
      elbow1.position.set(sx, wH - 0.20, eaveSz - sign * 0.02)
      elbow1.rotation.set(0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0)
      group.add(elbow1)

      // Koleno 2 — otočka z vodorovného úseku do svislého svodu (u zdi)
      const elbow2 = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.022, 8, 8, Math.PI / 2), zMat.clone())
      elbow2.position.set(sx, wH - 0.36, svodSz)
      elbow2.rotation.set(0, sign > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI / 2)
      group.add(elbow2)

      // Svod — svislý, osa 14 cm od zdi
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, svodH, 10), zMat.clone())
      pipe.position.set(sx, svodH / 2, svodSz)
      pipe.castShadow = true
      group.add(pipe)

      // Objímky svodu (úchyty ve zdivu) — po cca 1,2 m, spojují svod se zdí
      const nObj = Math.max(2, Math.floor(svodH / 1.2))
      for (let i = 1; i <= nObj; i++) {
        const oy = svodH * (i / (nObj + 1))
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, svodOffset + 0.04), hkMat.clone())
        strap.position.set(sx, oy, (wallSz + svodSz) / 2)
        strap.castShadow = true
        group.add(strap)
      }
    })
  })

  // ── Oplechování komínu ────────────────────────────────────────────────────
  // Komín je na d*0.28, s*0.12 (ze buildBuilding), na kladné Z svahu
  const chimX = d * 0.28, chimZ = s * 0.12
  const chimSlopeY = wH + h * (1 - chimZ / (s / 2))
  const fmMat = new THREE.MeshStandardMaterial({ color: 0x606878, roughness: 0.30, metalness: 0.65 })
  // Čtyři díly oplechování
  ;[
    { p: [chimX, chimSlopeY + 0.08, chimZ - 0.24], s: [0.70, 0.015, 0.07], rx: -slRad },
    { p: [chimX, chimSlopeY - 0.12, chimZ + 0.24], s: [0.70, 0.015, 0.07], rx: -slRad },
    { p: [chimX - 0.26, chimSlopeY, chimZ],         s: [0.07, 0.015, 0.50], rx: -slRad },
    { p: [chimX + 0.26, chimSlopeY, chimZ],         s: [0.07, 0.015, 0.50], rx: -slRad },
  ].forEach(f => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...f.s), fmMat.clone())
    m.position.set(...f.p)
    m.rotation.x = f.rx
    m.castShadow = true
    group.add(m)
  })

  // ── Závětrné listy (pro plechové krytiny) ────────────────────────────────
  if (sheet) {
    const lMat  = new THREE.MeshStandardMaterial({ color: 0x3a4050, roughness: 0.28, metalness: 0.68 })
    const lLen  = Math.sqrt(hw * hw + h * h) + 0.12
    ;[-1, 1].forEach(xSide => {
      const xPos = xSide * hd
      ;[-1, 1].forEach(zSide => {
        const midZ = zSide * hw / 2
        const midY = wH + h / 2
        const list = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.005, lLen), lMat.clone())
        list.position.set(xPos, midY, midZ)
        list.rotation.x = zSide * slRad
        list.castShadow = true
        group.add(list)
      })
    })
  }

  // ── Hřebenový plech ──────────────────────────────────────────────────────
  const ridgeY = wH + h
  const ridgeCapMat = new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.28, metalness: 0.68 })
  const ridgeCap = new THREE.Mesh(
    new THREE.BoxGeometry(hd * 2 + 0.20, 0.005, 0.32),
    ridgeCapMat
  )
  ridgeCap.position.set(0, ridgeY + 0.04, 0)
  ridgeCap.castShadow = true
  group.add(ridgeCap)
  // L-ohyby na bocích hřebenového plechu
  ;[-1, 1].forEach(side => {
    const fold = new THREE.Mesh(new THREE.BoxGeometry(hd * 2 + 0.20, 0.18, 0.005), ridgeCapMat.clone())
    fold.position.set(0, ridgeY - 0.07, side * 0.16)
    fold.castShadow = true
    group.add(fold)
  })

  // ── Nárožní lišty na okapu ────────────────────────────────────────────────
  ;[-1, 1].forEach(sign => {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(hd * 2 + 0.10, 0.16, 0.025),
      dkMat.clone()
    )
    fascia.position.set(0, wH - 0.08, sign * (hw + 0.01))
    fascia.castShadow = true
    group.add(fascia)
  })

  // Pozn.: úžlabí u vikýřů se vykresluje přímo v buildDormer() (přesně
  // navazuje na geometrii konkrétního vikýře), zde se neduplikuje.

  return group
}
