import * as THREE from 'three'

// --- helpers ---
function quad(A, B, C, D) {
  return [...A, ...B, ...C, ...A, ...C, ...D]
}
function tri(A, B, C) {
  return [...A, ...B, ...C]
}

function createRoofTexture(color = '#b04520') {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base color
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)

  // Tile pattern (brick offset)
  const tw = 72, th = 30
  for (let row = 0; row <= size / th + 1; row++) {
    const offset = (row % 2) * (tw / 2)
    for (let col = -1; col <= size / tw + 1; col++) {
      const x = col * tw + offset
      const y = row * th
      // Shadow (bottom + right)
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.fillRect(x, y + th - 2, tw, 2)
      ctx.fillRect(x + tw - 1, y, 1, th)
      // Highlight (top of tile)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(x + 2, y + 2, tw - 4, th * 0.40)
      // Subtle color variation per tile
      ctx.fillStyle = `rgba(0,0,0,${(Math.sin(col * 3.7 + row * 2.1) * 0.5 + 0.5) * 0.07})`
      ctx.fillRect(x + 1, y + 1, tw - 2, th - 2)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

function createWallTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f0e8d0'
  ctx.fillRect(0, 0, size, size)
  // Subtle plaster texture
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const a = Math.random() * 0.04
    ctx.fillStyle = `rgba(0,0,0,${a})`
    ctx.fillRect(x, y, 2, 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 2)
  return tex
}

function meshFrom(positions, material) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(positions), 3))
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// Color mapping by roof type label
const KRYTINA_COLORS = {
  tasky:    '#b04520',
  pálená:   '#b04520',
  betonová: '#6b7280',
  bridlice: '#4b5563',
  plech:    '#708090',
  bitumen:  '#374151',
  default:  '#c05020',
}

export function buildRoofScene(typ, sirka, delka, sklon, presahOkap, presahStit, wallHeight = 2.7, krytinaColor = '#b04520') {
  const s  = Math.max(parseFloat(sirka)      || 8,   2)
  const d  = Math.max(parseFloat(delka)      || 12,  2)
  const po = Math.max(parseFloat(presahOkap) || 0.3, 0)
  const ps = Math.max(parseFloat(presahStit) || 0.3, 0)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)
  const slRad = ((parseFloat(sklon) || 35) * Math.PI) / 180

  const h  = (s / 2) * Math.tan(slRad)   // ridge height
  const hw = s / 2 + po                   // half-width (z) with eave overhang
  const hd = d / 2 + ps                   // half-depth (x) with gable overhang

  // Eave corners (y = wallH)
  const BL = [-(hd), wH, -(hw)]
  const FL = [  hd,  wH, -(hw)]
  const FR = [  hd,  wH,   hw]
  const BR = [-(hd), wH,   hw]

  const roofTex = createRoofTexture(krytinaColor)
  // Scale texture: ~1 tile per 0.4m along ridge, 1 tile per 0.35m up slope
  const slopeLen = Math.sqrt(hw * hw + h * h)
  roofTex.repeat.set((hd * 2) / 0.4, slopeLen / 0.35)

  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex, roughness: 0.88, metalness: 0.02,
  })
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2d1a0e, roughness: 1 })

  const group = new THREE.Group()
  let pos = []

  switch (typ) {
    case 'sedlova':
    case 'asymetricka': {
      const RB = [-(hd), wH + h, 0]
      const RF = [  hd,  wH + h, 0]
      pos = [
        ...quad(BL, FL, RF, RB),
        ...quad(BR, RB, RF, FR),
        ...tri(BL, RB, BR),
        ...tri(FL, FR, RF),
      ]
      if (typ === 'asymetricka') {
        // Shift ridge off-center by 20% of width
        const shift = hw * 0.2
        const aRB = [-(hd), wH + h * 0.9,  shift]
        const aRF = [  hd,  wH + h * 0.9,  shift]
        pos = [
          ...quad(BL, FL, aRF, aRB),
          ...quad(BR, aRB, aRF, FR),
          ...tri(BL, aRB, BR),
          ...tri(FL, FR, aRF),
        ]
      }
      break
    }

    case 'valbova': {
      const rx = Math.max(0, hd - hw)
      if (rx < 0.01) {
        // Pyramid degenerate
        const apex = [0, wH + h, 0]
        pos = [
          ...tri(BL, FL, apex),
          ...tri(FL, FR, apex),
          ...tri(FR, BR, apex),
          ...tri(BR, BL, apex),
        ]
      } else {
        const RB = [-rx, wH + h, 0]
        const RF = [ rx, wH + h, 0]
        pos = [
          ...quad(BL, FL, RF, RB),
          ...quad(BR, RB, RF, FR),
          ...tri(BL, RB, BR),
          ...tri(FL, FR, RF),
        ]
      }
      break
    }

    case 'stanova': {
      const apex = [0, wH + h, 0]
      pos = [
        ...tri(BL, FL, apex),
        ...tri(FL, FR, apex),
        ...tri(FR, BR, apex),
        ...tri(BR, BL, apex),
      ]
      break
    }

    case 'pultova': {
      const hFull = s * Math.tan(slRad)
      // Slope from low (z = +hw) to high (z = -hw)
      const Lo1 = [-(hd), wH,         hw]
      const Lo2 = [  hd,  wH,         hw]
      const Hi1 = [  hd,  wH + hFull, -hw]
      const Hi2 = [-(hd), wH + hFull, -hw]
      // Side triangles
      const Mid1 = [-(hd), wH, -hw]
      const Mid2 = [  hd,  wH, -hw]
      pos = [
        ...quad(Lo1, Lo2, Hi1, Hi2),
        ...tri(Lo1, Hi2, Mid1),
        ...tri(Lo2, Mid2, Hi1),
      ]
      break
    }

    case 'mansardova': {
      // Lower steep slope (~60°) + upper shallow slope
      const lSlope = Math.min(slRad * 1.8, Math.PI * 0.42)
      const lFrac  = 0.38  // how much of hw the lower slope covers
      const lHw    = hw * lFrac
      const lH     = lHw * Math.tan(lSlope)

      const uHw = hw - lHw  // upper width from intermediate to center
      const uH  = uHw * Math.tan(slRad)

      // Intermediate eave (top of lower slope)
      const iY = wH + lH
      const iZ = -(hw - lHw)   // = -(hw * (1 - lFrac))
      const IBL = [-(hd), iY,  iZ]
      const IFL = [  hd,  iY,  iZ]
      const IFR = [  hd,  iY, -iZ]
      const IBR = [-(hd), iY, -iZ]

      // Ridge
      const rY = iY + uH
      const RB  = [-(hd), rY, 0]
      const RF  = [  hd,  rY, 0]

      // Lower slopes (4 sides, steep)
      const lMat = new THREE.MeshStandardMaterial({
        map: createRoofTexture('#8b3a1a'), roughness: 0.9,
      })
      lMat.map.repeat.set((hd * 2) / 0.4, (lHw / 0.35))

      const lPos = [
        ...quad(BL, FL, IFL, IBL),   // left lower
        ...quad(BR, IBR, IFR, FR),   // right lower
        ...quad(BL, IBL, IBR, BR),   // back lower
        ...quad(FL, FR, IFR, IFL),   // front lower
      ]
      group.add(meshFrom(lPos, lMat))

      pos = [
        ...quad(IBL, IFL, RF, RB),   // left upper
        ...quad(IBR, RB, RF, IFR),   // right upper
        ...tri(IBL, RB, IBR),         // back upper gable
        ...tri(IFL, IFR, RF),         // front upper gable
      ]
      break
    }

    case 'pulvalbova': {
      // Gable roof with small hip at each end (krüppelwalm)
      const hipDepth = Math.min(hd * 0.22, hw * 0.4)  // how far in the hip extends
      const hipH = hipDepth * Math.tan(slRad)

      const RB = [-(hd), wH + h, 0]
      const RF = [  hd,  wH + h, 0]

      // Hip eave intermediate points
      const HBL = [-(hd - hipDepth), wH + hipH, -(hw)]
      const HBR = [-(hd - hipDepth), wH + hipH,   hw ]
      const HFL = [  hd - hipDepth,  wH + hipH, -(hw)]
      const HFR = [  hd - hipDepth,  wH + hipH,   hw ]

      pos = [
        // Main slopes (from intermediate hip to ridge)
        ...quad(HBL, HFL, RF, RB),
        ...quad(HBR, RB, RF, HFR),
        // Hip sections at gable ends (back)
        ...tri(BL, HBL, RB),
        ...tri(BL, RB, BR),   // filler below
        ...tri(BR, RB, HBR),
        // Hip sections at gable ends (front)
        ...tri(FL, RF, HFL),
        ...tri(FL, FR, RF),   // filler below
        ...tri(FR, HFR, RF),
        // Lower slopes (eave to intermediate)
        ...quad(BL, HBL, HFL, FL),
        ...quad(BR, FR, HFR, HBR),
      ]
      break
    }

    case 'pilova': {
      // Sawtooth roof
      const numSaws = Math.max(2, Math.round((d + 2 * ps) / Math.max(s / 2, 1)))
      const sawW = (hd * 2) / numSaws
      const sawH = (hw * 2) * Math.tan(slRad)

      for (let i = 0; i < numSaws; i++) {
        const x0 = -hd + i * sawW
        const x1 = x0 + sawW

        // Slope face: rises from low (z=hw) to high (z=-hw) ... actually along height
        // Sawtooth: slope goes up over x-distance, drops vertically
        const A = [x0, wH,         -hw]
        const B = [x0, wH,          hw]
        const C = [x1, wH,          hw]
        const D = [x1, wH,         -hw]
        const E = [x1, wH + sawH,   hw]
        const F = [x1, wH + sawH,  -hw]

        // Slope face (quadrilateral: B→C→E and E→F and back to B via A)
        pos.push(...quad(B, C, E, [x0, wH + sawH, hw]))  // sloped surface
        // Replace with simpler: just an angled plane
        pos.splice(pos.length - 12) // undo
        // Sloped face: A at base-left, D at base-right, F at top-right, E_x0 at top-left
        const Etop = [x0, wH + sawH,  hw]
        const Ftop = [x0, wH + sawH, -hw]
        // Slope goes: from (x0) low to (x1) high - along Z direction rising in Y
        const Lo_L = [x0, wH,         -hw]
        const Lo_R = [x0, wH,          hw]
        const Hi_L = [x1, wH + sawH,  -hw]
        const Hi_R = [x1, wH + sawH,   hw]
        pos.push(...quad(Lo_R, Lo_L, Hi_L, Hi_R))

        // Side triangles
        pos.push(...tri(Lo_L, Lo_R, Hi_R))
        pos.push(...tri(Lo_L, Hi_R, Hi_L))

        // Vertical face (glass / north light) - render with different (darker) material later
        // For now same material
        if (i < numSaws - 1) {
          const VBL = [x1, wH,          -hw]
          const VBR = [x1, wH,           hw]
          const VTL = [x1, wH + sawH,   -hw]
          const VTR = [x1, wH + sawH,    hw]
          // vertical glass panel - skip for simplicity
        }
      }
      break
    }

    default: {
      const RB = [-(hd), wH + h, 0]
      const RF = [  hd,  wH + h, 0]
      pos = [
        ...quad(BL, FL, RF, RB),
        ...quad(BR, RB, RF, FR),
        ...tri(BL, RB, BR),
        ...tri(FL, FR, RF),
      ]
    }
  }

  if (pos.length > 0) {
    group.add(meshFrom(pos, roofMat))
  }

  // Ridge cap (decorative bar along ridge)
  const capMat = new THREE.MeshStandardMaterial({ color: 0x7a2010, roughness: 0.9 })
  if (typ !== 'pultova' && typ !== 'pilova') {
    const rY = wH + h
    const rX = typ === 'valbova' ? Math.max(0, hd - hw) : hd
    const capGeo = new THREE.CylinderGeometry(0.05, 0.06, rX * 2, 8)
    const cap = new THREE.Mesh(capGeo, capMat)
    cap.rotation.z = Math.PI / 2
    cap.position.set(0, rY + 0.06, 0)
    cap.castShadow = true
    group.add(cap)
  }

  return group
}

export function buildBuilding(sirka, delka, wallHeight = 2.7) {
  const s  = Math.max(parseFloat(sirka)  || 8, 2)
  const d  = Math.max(parseFloat(delka)  || 12, 2)
  const wH = Math.max(parseFloat(wallHeight) || 2.7, 1)

  const group = new THREE.Group()

  const wallTex = createWallTexture()
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex, roughness: 0.85, metalness: 0.0,
  })

  // Main box
  const wallGeo = new THREE.BoxGeometry(d, wH, s)
  const walls = new THREE.Mesh(wallGeo, wallMat)
  walls.position.y = wH / 2
  walls.castShadow = true
  walls.receiveShadow = true
  group.add(walls)

  // Windows (simple dark rectangles on walls - using box geometry)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x4488cc, roughness: 0.1, metalness: 0.3, opacity: 0.8, transparent: true,
  })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8 })

  const addWindow = (wx, wy, wz, rx = 0) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.05), winMat)
    win.position.set(wx, wy, wz)
    win.rotation.y = rx
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.35, 0.04), frameMat)
    frame.position.set(wx, wy, wz - 0.01)
    frame.rotation.y = rx
    group.add(win)
    group.add(frame)
  }

  // Front windows
  const frontZ = s / 2 + 0.01
  addWindow(-d * 0.25, wH * 0.55, frontZ)
  addWindow( d * 0.25, wH * 0.55, frontZ)

  // Door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.9 })
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.06), doorMat)
  door.position.set(0, 1.0, frontZ)
  group.add(door)

  return group
}
