import * as THREE from 'three'

const SZ = 512
const CACHE = new Map()

// ── Canvas helper ─────────────────────────────────────────────────────────────
function makeCanvas(w = SZ, h = SZ) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  return [c, c.getContext('2d')]
}

// ── Deterministická variace barvy ─────────────────────────────────────────────
function hv(col, row, h, s, l, sp = 6) {
  const v = (Math.sin(col * 7.3 + row * 3.7) * 0.5 + 0.5) * sp - sp / 2
  return `hsl(${h},${s}%,${Math.max(15, Math.min(85, l + v))}%)`
}

// ── Height map → Normal map ───────────────────────────────────────────────────
function heightToNormal(hCanvas, strength = 4) {
  const W = hCanvas.width, H = hCanvas.height
  const hCtx = hCanvas.getContext('2d')
  const hData = hCtx.getImageData(0, 0, W, H).data

  const [nC, nCtx] = makeCanvas(W, H)
  const nImg = nCtx.createImageData(W, H)
  const nData = nImg.data

  const get = (x, y) => hData[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (get(x + 1, y) - get(x - 1, y)) * strength
      const dy = (get(x, y + 1) - get(x, y - 1)) * strength
      const dz = 1.0
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const i = (y * W + x) * 4
      nData[i + 0] = (-dx / len * 0.5 + 0.5) * 255
      nData[i + 1] = (-dy / len * 0.5 + 0.5) * 255
      nData[i + 2] = (dz  / len * 0.5 + 0.5) * 255
      nData[i + 3] = 255
    }
  }
  nCtx.putImageData(nImg, 0, 0)
  return nC
}

// ── Height map → Roughness map ─────────────────────────────────────────────────
// Vyvýšené hrany tašky (hřebeny vlny) jsou o trochu hladší (lehký odlesk
// vypálené glazury), spáry a údolí zůstávají plně matné — keramika nikdy
// nesmí vypadat jako plast, proto je rozsah variace malý.
function heightToRoughness(hCanvas, { base = 0.92, variance = 0.16 } = {}) {
  const W = hCanvas.width, H = hCanvas.height
  const hCtx = hCanvas.getContext('2d')
  const hData = hCtx.getImageData(0, 0, W, H)
  const [rC, rCtx] = makeCanvas(W, H)
  const rImg = rCtx.createImageData(W, H)
  const src = hData.data, dst = rImg.data
  for (let i = 0; i < src.length; i += 4) {
    const h = src[i] / 255
    const v = Math.round(Math.max(0, Math.min(1, base - variance * h)) * 255)
    dst[i] = dst[i + 1] = dst[i + 2] = v
    dst[i + 3] = 255
  }
  rCtx.putImageData(rImg, 0, 0)
  return rC
}

// ── Height map → Ambient Occlusion map ─────────────────────────────────────────
// Spáry/údolí (nízká výška) ztemníme výrazně víc než lineárně — to dává
// největší pocit hloubky mezi jednotlivými taškami.
function heightToAO(hCanvas, { darkenGaps = 1.7, minAO = 0.32 } = {}) {
  const W = hCanvas.width, H = hCanvas.height
  const hCtx = hCanvas.getContext('2d')
  const hData = hCtx.getImageData(0, 0, W, H)
  const [aC, aCtx] = makeCanvas(W, H)
  const aImg = aCtx.createImageData(W, H)
  const src = hData.data, dst = aImg.data
  for (let i = 0; i < src.length; i += 4) {
    const h = src[i] / 255
    const v = Math.round((minAO + (1 - minAO) * Math.pow(h, darkenGaps)) * 255)
    dst[i] = dst[i + 1] = dst[i + 2] = v
    dst[i + 3] = 255
  }
  aCtx.putImageData(aImg, 0, 0)
  return aC
}

// ── Material factory ──────────────────────────────────────────────────────────
function makeMat(colorCanvas, heightCanvas, {
  roughness = 0.88, metalness = 0,
  baseRepeatX = 1, baseRepeatY = 1,
  normalStrength = 4,
  roughnessBase, roughnessVariance,
  aoDarkenGaps, aoMinAO,
} = {}) {
  const tex = new THREE.CanvasTexture(colorCanvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8

  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness, metalness, side: THREE.DoubleSide,
    aoMapIntensity: 1.4, envMapIntensity: 0.3,
  })

  if (heightCanvas) {
    const nC = heightToNormal(heightCanvas, normalStrength)
    const nTex = new THREE.CanvasTexture(nC)
    nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping
    mat.normalMap = nTex
    mat.normalScale = new THREE.Vector2(1, 1)

    // Roughness map — keramický povrch s lehce hladšími hřebeny vlny
    const rC = heightToRoughness(heightCanvas, {
      base: roughnessBase ?? roughness, variance: roughnessVariance ?? 0.16,
    })
    const rTex = new THREE.CanvasTexture(rC)
    rTex.wrapS = rTex.wrapT = THREE.RepeatWrapping
    mat.roughnessMap = rTex

    // AO map — ztemněné spáry mezi taškami (vyžaduje uv2, viz ensureUV2)
    const aC = heightToAO(heightCanvas, { darkenGaps: aoDarkenGaps ?? 1.7, minAO: aoMinAO ?? 0.32 })
    const aTex = new THREE.CanvasTexture(aC)
    aTex.wrapS = aTex.wrapT = THREE.RepeatWrapping
    mat.aoMap = aTex
  }

  mat.userData = { baseRepeatX, baseRepeatY }
  return mat
}

// ── Cache wrapper ─────────────────────────────────────────────────────────────
function cached(key, fn) {
  if (!CACHE.has(key)) CACHE.set(key, fn())
  const base = CACHE.get(key)
  const mat = base.clone()
  ;['map', 'normalMap', 'roughnessMap', 'aoMap'].forEach(k => {
    if (base[k]) { mat[k] = base[k].clone(); mat[k].needsUpdate = true }
  })
  mat.userData = { ...base.userData }
  return mat
}

// ═══════════════════════════════════════════════════════════════════════════════
// KRYTINY
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. BOBROVKA ───────────────────────────────────────────────────────────────
function drawBobrovka() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 64, tH = 52, gap = 4

  ctx.fillStyle = '#1a0805'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const cx = x + tW / 2, cy = y + tH / 2

      // Barva dlaždice s variací
      const base = hv(col, row, 12, 60, 40, 8)
      ctx.fillStyle = base
      // Zaoblený tvar bobrovky
      ctx.beginPath()
      ctx.moveTo(x + gap, y + gap)
      ctx.lineTo(x + tW - gap, y + gap)
      ctx.lineTo(x + tW - gap, y + tH * 0.65)
      ctx.arc(cx, y + tH * 0.65, tW / 2 - gap, 0, Math.PI)
      ctx.closePath()
      ctx.fill()

      // Konvexní gradient — světlo shora, stín dole
      const grd = ctx.createLinearGradient(cx, y + gap, cx, y + tH)
      grd.addColorStop(0,   'rgba(255,255,255,0.35)')
      grd.addColorStop(0.3, 'rgba(255,255,255,0.08)')
      grd.addColorStop(0.7, 'rgba(0,0,0,0.15)')
      grd.addColorStop(1,   'rgba(0,0,0,0.50)')
      ctx.fillStyle = grd
      ctx.fill() // re-fill same path

      // Boční stíny
      const sg = ctx.createLinearGradient(x + gap, cy, x + tW - gap, cy)
      sg.addColorStop(0, 'rgba(0,0,0,0.20)')
      sg.addColorStop(0.15, 'rgba(0,0,0,0)')
      sg.addColorStop(0.85, 'rgba(0,0,0,0)')
      sg.addColorStop(1, 'rgba(0,0,0,0.20)')
      ctx.fillStyle = sg; ctx.fill()

      // Height map: bílá = vyvýšeno (střed tašky), černá = spára
      hCtx.fillStyle = '#888'
      hCtx.beginPath()
      hCtx.moveTo(x + gap, y + gap)
      hCtx.lineTo(x + tW - gap, y + gap)
      hCtx.lineTo(x + tW - gap, y + tH * 0.65)
      hCtx.arc(cx, y + tH * 0.65, tW / 2 - gap, 0, Math.PI)
      hCtx.closePath()
      hCtx.fill()

      // Konvexní kopule výškové mapy
      const hGrd = hCtx.createRadialGradient(cx, y + tH * 0.3, 2, cx, y + tH * 0.35, tW * 0.45)
      hGrd.addColorStop(0, 'rgba(255,255,255,0.9)')
      hGrd.addColorStop(0.6, 'rgba(255,255,255,0.3)')
      hGrd.addColorStop(1, 'rgba(0,0,0,0)')
      hCtx.fillStyle = hGrd; hCtx.fill()
    }
  }
  return makeMat(cC, cH, { roughness: 0.90, baseRepeatX: 7.5, baseRepeatY: 5.0, normalStrength: 5 })
}

// ── 2. PÁLENÁ TAŠKA (esovitá/vlnitá, Tondach styl) ──────────────────────────
function drawPalenaTaska(hue = 14, sat = 65, light = 42) {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 72, tH = 54, gap = 3

  ctx.fillStyle = '#0c0502'; hCtx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH

      // Per-taška barevná variace — nejen jas, ale i mírný posun odstínu/sytosti
      // (přirozené "aging", tón v tónu, ne uniformní plast)
      const hueJ = Math.sin(col * 5.3 + row * 2.1) * 2.5
      const satJ = Math.cos(col * 3.1 + row * 6.7) * 6
      ctx.fillStyle = hv(col, row, hue + hueJ, sat + satJ, light, 11)
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // S-profil: výrazná vlna přes šířku dlaždice + jemná keramická zrnitost
      for (let px = 0; px < tW - gap * 2; px++) {
        const wave = Math.sin((px / (tW - gap * 2)) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5
        const grain = (Math.sin(px * 9.7 + col * 13.1 + row * 4.9) * 0.5 + 0.5) * 0.05
        const bright = 0.55 * wave - 0.28 + grain - 0.025
        if (bright > 0) {
          ctx.fillStyle = `rgba(255,255,255,${bright})`
          ctx.fillRect(x + gap + px, y + gap, 1, tH - gap * 2)
        } else {
          ctx.fillStyle = `rgba(0,0,0,${-bright * 1.5})`
          ctx.fillRect(x + gap + px, y + gap, 1, tH - gap * 2)
        }
      }

      // Horizontální stín nahoře/dole — výraznější přesah/spára
      const vg = ctx.createLinearGradient(0, y + gap, 0, y + tH - gap)
      vg.addColorStop(0,    'rgba(255,255,255,0.22)')
      vg.addColorStop(0.22, 'rgba(0,0,0,0)')
      vg.addColorStop(0.78, 'rgba(0,0,0,0)')
      vg.addColorStop(1,    'rgba(0,0,0,0.55)')
      ctx.fillStyle = vg
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Height map — hlubší S-vlna + zrnitost (řídí normal/roughness/AO mapy)
      hCtx.fillStyle = '#555'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      for (let px = 0; px < tW - gap * 2; px++) {
        const wave = Math.sin((px / (tW - gap * 2)) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5
        const grain = (Math.sin(px * 9.7 + col * 13.1 + row * 4.9) * 0.5 + 0.5) * 14
        const gray = Math.max(0, Math.min(255, Math.round(34 + wave * 200 + grain)))
        hCtx.fillStyle = `rgb(${gray},${gray},${gray})`
        hCtx.fillRect(x + gap + px, y + gap, 1, tH - gap * 2)
      }
      // Tmavý pruh u spodní hrany — stín vrhaný taškou přesahující odshora
      hCtx.fillStyle = 'rgba(0,0,0,0.6)'
      hCtx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
    }
  }
  return makeMat(cC, cH, {
    roughness: 0.90, baseRepeatX: 7.0, baseRepeatY: 4.5, normalStrength: 8,
    roughnessBase: 0.92, roughnessVariance: 0.20,
    aoDarkenGaps: 1.8, aoMinAO: 0.28,
  })
}

// ── 2b. PÁLENÁ DRSNATA (420×275 mm — plochá taška s drsným povrchem) ──────────
// Reálné rozměry: 420×275 mm → aspect ratio 1.527 → canvas tW:tH = 79:52 ≈ 1.52
function drawPalenaDrsnata() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 79, tH = 52, gap = 3

  ctx.fillStyle = '#100604'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2
  const nosekH = Math.round(tH * 0.20) // spodní přesah (nůsek)

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH

      // Základní barva tašky — cihlová, lehká variace mezi kusy
      ctx.fillStyle = hv(col, row, 14, 56, 40, 9)
      ctx.fillRect(x + gap, y + gap, tW - gap*2, tH - gap*2)

      // Drsný povrch — procedurální granule (drsnata = hrubý povrch)
      for (let gx = 0; gx < tW - gap*2; gx += 3) {
        for (let gy = 0; gy < tH - gap*2; gy += 3) {
          const v = (Math.sin((x+gx)*2.3 + col*7.1 + (y+gy)*1.7 + row*4.3) * 0.5 + 0.5) * 0.10
          ctx.fillStyle = `rgba(0,0,0,${v})`
          ctx.fillRect(x + gap + gx, y + gap + gy, 2, 2)
        }
      }

      // Interlocková drážka (pravá strana tašky)
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      ctx.fillRect(x + tW - gap - 7, y + gap, 7, tH - gap*2)
      // Nůsek — přesah spodní hrany (tmavší stín)
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x + gap, y + tH - gap - nosekH, tW - gap*2, nosekH)
      // Světlá horní hrana (odraz světla na vrchní ploše)
      ctx.fillStyle = 'rgba(255,255,255,0.20)'
      ctx.fillRect(x + gap, y + gap, tW - gap*2, 4)
      // Levý světlý okraj (překrytí sousední taškou)
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fillRect(x + gap, y + gap, 5, tH - gap*2)

      // Height map — granule + nůsek pro normal map
      hCtx.fillStyle = 'rgb(128,128,128)'
      hCtx.fillRect(x + gap, y + gap, tW - gap*2, tH - gap*2)
      for (let gx = 0; gx < tW - gap*2; gx += 3) {
        for (let gy = 0; gy < tH - gap*2; gy += 3) {
          const v = Math.round((Math.sin((x+gx)*2.3+col*7.1+(y+gy)*1.7+row*4.3) * 0.5+0.5) * 35)
          hCtx.fillStyle = `rgb(${115+v},${115+v},${115+v})`
          hCtx.fillRect(x + gap + gx, y + gap + gy, 2, 2)
        }
      }
      hCtx.fillStyle = 'rgba(255,255,255,0.45)'
      hCtx.fillRect(x + gap, y + gap, tW - gap*2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.80)'
      hCtx.fillRect(x + gap, y + tH - gap - nosekH, tW - gap*2, nosekH)
    }
  }
  // 275mm šířka → ~3.64 tiles/m; canvas: 512/79≈6.5 tiles → baseRepeatX = 3.64×10/6.5 ≈ 5.5
  // 345mm výška (s přesahem) → ~2.9 rows/m; canvas: 512/52≈9.8 rows → baseRepeatY = 2.9×5/9.8 ≈ 1.5
  return makeMat(cC, cH, { roughness: 0.93, baseRepeatX: 5.5, baseRepeatY: 1.5, normalStrength: 5 })
}

// ── 3. BETONOVÁ TAŠKA ─────────────────────────────────────────────────────────
function drawBetonova() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 80, tH = 56, gap = 4

  ctx.fillStyle = '#202020'; hCtx.fillStyle = '#222'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const baseL = 52 + (Math.sin(col * 4.1 + row * 2.7) * 0.5 + 0.5) * 6

      // Povrch dlaždice
      ctx.fillStyle = `hsl(215,10%,${baseL}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Betonová textura — jemný šum
      for (let gx = 0; gx < 6; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const nx = x + gap + gx * ((tW - gap * 2) / 5), ny = y + gap + gy * ((tH - gap * 2) / 3)
          const v = (Math.sin(nx * 13.7 + ny * 7.3) * 0.5 + 0.5) * 0.08
          ctx.fillStyle = `rgba(0,0,0,${v})`
          ctx.fillRect(nx, ny, (tW - gap * 2) / 5, (tH - gap * 2) / 3)
        }
      }

      // Přední hrana (tmavý stín dole)
      const edgeH = 6
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(x + gap, y + tH - gap - edgeH, tW - gap * 2, edgeH)
      // Horní světlá hrana
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, edgeH)
      // Boční stíny
      ctx.fillStyle = 'rgba(0,0,0,0.20)'
      ctx.fillRect(x + gap, y + gap, 4, tH - gap * 2)
      ctx.fillRect(x + tW - gap - 4, y + gap, 4, tH - gap * 2)

      // Height map
      hCtx.fillStyle = `rgb(140,140,140)`
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      // Horní hrana výše
      hCtx.fillStyle = 'rgba(255,255,255,0.6)'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, 5)
      // Dolní hrana níže
      hCtx.fillStyle = 'rgba(0,0,0,0.7)'
      hCtx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
    }
  }
  return makeMat(cC, cH, { roughness: 0.92, baseRepeatX: 6.0, baseRepeatY: 4.0, normalStrength: 4 })
}

// ── 4. BRIDLICE ───────────────────────────────────────────────────────────────
function drawBridlice() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()

  ctx.fillStyle = '#0e1018'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const widths = [40, 52, 36, 58, 44, 48]
  const tH = 30, gap = 2
  let rowY = 0, ri = 0

  while (rowY < SZ + tH) {
    const rowOx = (ri % 2) * 22
    let x = -rowOx, wi = 0
    while (x < SZ + 60) {
      const tW = widths[(wi + ri) % widths.length]
      const lv = 48 + (Math.sin(wi * 5.1 + ri * 3.7) * 0.5 + 0.5) * 18
      const hue = 215 + (Math.sin(wi * 2.3 + ri * 1.9) * 0.5 + 0.5) * 20

      ctx.fillStyle = `hsl(${hue},14%,${lv}%)`
      ctx.fillRect(x + gap, rowY + gap, tW - gap * 2, tH - gap * 2)

      // Stín dolní hrany (přesah horní dlaždice)
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x + gap, rowY + tH - gap - 4, tW - gap * 2, 4)
      // Světelný odlesk nahoře
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(x + gap, rowY + gap, tW - gap * 2, 4)
      // Jemná textura kamene
      for (let k = 0; k < 3; k++) {
        const kx = x + gap + k * (tW / 3), ky = rowY + gap + 3
        ctx.strokeStyle = `rgba(0,0,0,${0.06 + Math.sin(k + wi + ri) * 0.03})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(kx, ky); ctx.lineTo(kx + tW / 3, ky + 8)
        ctx.stroke()
      }

      // Height map
      hCtx.fillStyle = `rgb(130,130,130)`
      hCtx.fillRect(x + gap, rowY + gap, tW - gap * 2, tH - gap * 2)
      hCtx.fillStyle = 'rgba(255,255,255,0.5)'
      hCtx.fillRect(x + gap, rowY + gap, tW - gap * 2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.8)'
      hCtx.fillRect(x + gap, rowY + tH - gap - 3, tW - gap * 2, 3)

      x += tW; wi++
    }
    rowY += tH; ri++
  }
  return makeMat(cC, cH, { roughness: 0.95, baseRepeatX: 6.0, baseRepeatY: 5.0, normalStrength: 5 })
}

// ── 5. DŘEVĚNÝ ŠINDEL ────────────────────────────────────────────────────────
function drawSindel() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()

  ctx.fillStyle = '#1a0d06'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const tW = 52, tH = 28, gap = 2
  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 3) * (tW / 3)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const br = 65 + (Math.sin(col * 5.2 + row * 3.1) * 0.5 + 0.5) * 28
      const rG = Math.round(br * 0.68), rB = Math.round(br * 0.40)

      ctx.fillStyle = `rgb(${br | 0},${rG},${rB})`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Dřevěná vlákna (podélné linky)
      for (let gi = 0; gi < 5; gi++) {
        const gx = x + gap + gi * ((tW - gap * 2) / 4)
        ctx.strokeStyle = `rgba(0,0,0,${0.12 + Math.sin(gi * 1.7 + col + row) * 0.04})`
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(gx, y + gap); ctx.lineTo(gx + 2, y + tH - gap); ctx.stroke()
      }
      // Letokruhy — jemné horizontální vlny
      for (let li = 1; li < 3; li++) {
        const ly = y + gap + li * ((tH - gap * 2) / 3)
        ctx.strokeStyle = `rgba(0,0,0,${0.10})`
        ctx.lineWidth = 0.6
        ctx.beginPath(); ctx.moveTo(x + gap, ly)
        for (let wx = 0; wx < tW - gap * 2; wx++) {
          ctx.lineTo(x + gap + wx, ly + Math.sin(wx * 0.4) * 1.2)
        }
        ctx.stroke()
      }
      // Stín dolní přesah
      ctx.fillStyle = 'rgba(0,0,0,0.50)'
      ctx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
      // Světlá horní hrana
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, 3)

      // Height map
      hCtx.fillStyle = `rgb(130,130,130)`
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      hCtx.fillStyle = 'rgba(255,255,255,0.5)'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.75)'
      hCtx.fillRect(x + gap, y + tH - gap - 4, tW - gap * 2, 4)
    }
  }
  return makeMat(cC, cH, { roughness: 0.97, baseRepeatX: 5.0, baseRepeatY: 6.0, normalStrength: 4 })
}

// ── 6. FALCOVANÝ PLECH (stojatá falc) ────────────────────────────────────────
function drawFalcovany(r, g, b) {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const pitch = 48 // šíře panelu

  // Základní kov
  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, SZ, SZ)
  hCtx.fillStyle = `rgb(120,120,120)`
  hCtx.fillRect(0, 0, SZ, SZ)

  // Jemná textura válcování (horizontální linie)
  for (let y = 0; y < SZ; y += 3) {
    const v = (Math.sin(y * 0.7) * 0.5 + 0.5) * 0.04
    ctx.fillStyle = `rgba(255,255,255,${v})`
    ctx.fillRect(0, y, SZ, 2)
  }

  // Stojatá falc (svislé spoje)
  for (let sx = pitch; sx < SZ; sx += pitch) {
    // Stín vlevo od spoje
    const sL = ctx.createLinearGradient(sx - 14, 0, sx, 0)
    sL.addColorStop(0, 'rgba(0,0,0,0)'); sL.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = sL; ctx.fillRect(sx - 14, 0, 14, SZ)

    // Světlo na vrcholu spoje
    ctx.fillStyle = `rgba(255,255,255,0.70)`; ctx.fillRect(sx, 0, 3, SZ)
    ctx.fillStyle = `rgba(255,255,255,0.35)`; ctx.fillRect(sx + 3, 0, 3, SZ)

    // Stín vpravo od spoje
    const sR = ctx.createLinearGradient(sx + 6, 0, sx + 20, 0)
    sR.addColorStop(0, 'rgba(0,0,0,0.30)'); sR.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = sR; ctx.fillRect(sx + 6, 0, 14, SZ)

    // Height map — vyvýšený spoj
    hCtx.fillStyle = 'rgba(0,0,0,0.5)'
    hCtx.fillRect(sx - 8, 0, 8, SZ)
    hCtx.fillStyle = `rgb(255,255,255)`
    hCtx.fillRect(sx, 0, 4, SZ)
    hCtx.fillStyle = 'rgba(0,0,0,0.4)'
    hCtx.fillRect(sx + 4, 0, 8, SZ)
  }

  // Horizontální panelové spoje
  for (let py = 0; py < SZ; py += 90) {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, py, SZ, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, py + 3, SZ, 2)
    hCtx.fillStyle = 'rgba(0,0,0,0.7)'; hCtx.fillRect(0, py, SZ, 3)
  }

  return makeMat(cC, cH, { roughness: 0.22, metalness: 0.80, baseRepeatX: 6.0, baseRepeatY: 1.5, normalStrength: 6 })
}

// ── 7. TRAPÉZOVÝ PLECH ────────────────────────────────────────────────────────
function drawTrapez(r, g, b) {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const pitch = 48 // šíře jednoho trapézu

  ctx.fillStyle = `rgb(${Math.round(r*0.7)},${Math.round(g*0.7)},${Math.round(b*0.7)})`
  ctx.fillRect(0, 0, SZ, SZ)
  hCtx.fillStyle = `rgb(60,60,60)` // valley dark
  hCtx.fillRect(0, 0, SZ, SZ)

  for (let sx = 0; sx < SZ; sx += pitch) {
    // Trapéz: vlevo svah (15px), nahoře plochá část (18px), vpravo svah (15px)
    const valleyW = pitch - 48
    const slopeW = 14, topW = pitch - slopeW * 2

    // Levý svah
    const lgL = ctx.createLinearGradient(sx, 0, sx + slopeW, 0)
    lgL.addColorStop(0, `rgba(0,0,0,0.55)`); lgL.addColorStop(1, `rgba(0,0,0,0)`)
    ctx.fillStyle = lgL; ctx.fillRect(sx, 0, slopeW, SZ)
    const hgL = hCtx.createLinearGradient(sx, 0, sx + slopeW, 0)
    hgL.addColorStop(0, `rgb(60,60,60)`); hgL.addColorStop(1, `rgb(190,190,190)`)
    hCtx.fillStyle = hgL; hCtx.fillRect(sx, 0, slopeW, SZ)

    // Vrchní plocha
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(sx + slopeW, 0, topW, SZ)
    // Odlesk na vrcholu
    const topGrd = ctx.createLinearGradient(sx + slopeW, 0, sx + slopeW + topW, 0)
    topGrd.addColorStop(0, 'rgba(255,255,255,0.30)')
    topGrd.addColorStop(0.4, 'rgba(255,255,255,0.55)')
    topGrd.addColorStop(0.6, 'rgba(255,255,255,0.55)')
    topGrd.addColorStop(1, 'rgba(255,255,255,0.30)')
    ctx.fillStyle = topGrd; ctx.fillRect(sx + slopeW, 0, topW, SZ)

    hCtx.fillStyle = `rgb(220,220,220)`
    hCtx.fillRect(sx + slopeW, 0, topW, SZ)

    // Pravý svah
    const lgR = ctx.createLinearGradient(sx + slopeW + topW, 0, sx + pitch, 0)
    lgR.addColorStop(0, `rgba(0,0,0,0)`); lgR.addColorStop(1, `rgba(0,0,0,0.55)`)
    ctx.fillStyle = lgR; ctx.fillRect(sx + slopeW + topW, 0, slopeW, SZ)
    const hgR = hCtx.createLinearGradient(sx + slopeW + topW, 0, sx + pitch, 0)
    hgR.addColorStop(0, `rgb(190,190,190)`); hgR.addColorStop(1, `rgb(60,60,60)`)
    hCtx.fillStyle = hgR; hCtx.fillRect(sx + slopeW + topW, 0, slopeW, SZ)
  }

  // Panelové spoje
  for (let py = 0; py < SZ; py += 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, py, SZ, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, py + 3, SZ, 2)
    hCtx.fillStyle = 'rgba(0,0,0,0.7)'; hCtx.fillRect(0, py, SZ, 3)
  }

  return makeMat(cC, cH, { roughness: 0.30, metalness: 0.72, baseRepeatX: 9.0, baseRepeatY: 1.5, normalStrength: 7 })
}

// ── 8. VLNITÝ PLECH ───────────────────────────────────────────────────────────
function drawVlnity(r, g, b) {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()

  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, SZ, SZ)
  hCtx.fillStyle = `rgb(128,128,128)`
  hCtx.fillRect(0, 0, SZ, SZ)

  const pitch = 32
  for (let x = 0; x < SZ; x++) {
    const wave = Math.sin((x / pitch) * Math.PI * 2)
    const bright = wave * 0.40

    if (bright > 0) {
      ctx.fillStyle = `rgba(255,255,255,${bright})`
    } else {
      ctx.fillStyle = `rgba(0,0,0,${-bright * 1.2})`
    }
    ctx.fillRect(x, 0, 1, SZ)

    // Height map
    const h = Math.round((wave * 0.5 + 0.5) * 220 + 18)
    hCtx.fillStyle = `rgb(${h},${h},${h})`
    hCtx.fillRect(x, 0, 1, SZ)
  }
  for (let py = 0; py < SZ; py += 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, py, SZ, 2)
    hCtx.fillStyle = 'rgba(0,0,0,0.6)'; hCtx.fillRect(0, py, SZ, 2)
  }

  return makeMat(cC, cH, { roughness: 0.32, metalness: 0.68, baseRepeatX: 9.0, baseRepeatY: 1.5, normalStrength: 7 })
}

// ── 9. RÁKOS ──────────────────────────────────────────────────────────────────
function drawRakos() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()

  ctx.fillStyle = '#6a5428'; hCtx.fillStyle = '#888'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  // Vrstvené pásy stébel
  const bandH = 12
  for (let y = 0; y < SZ; y++) {
    const band = Math.floor(y / bandH)
    const pos = (y % bandH) / bandH
    // Tmavší spára, světlejší střed
    const l = 40 + Math.sin(pos * Math.PI) * 20 + (Math.sin(band * 3.7) * 0.5 + 0.5) * 10
    ctx.fillStyle = `hsl(38,45%,${l}%)`
    ctx.fillRect(0, y, SZ, 1)

    const hv = Math.round(100 + Math.sin(pos * Math.PI) * 100)
    hCtx.fillStyle = `rgb(${hv},${hv},${hv})`
    hCtx.fillRect(0, y, SZ, 1)
  }

  // Podélná stébla (vertikální linky)
  for (let x = 0; x < SZ; x += 2) {
    const amp = 1.5 + (Math.sin(x * 3.1) * 0.5 + 0.5) * 1.5
    const phase = x * 0.15
    ctx.strokeStyle = `rgba(0,0,0,${0.04 + (Math.sin(x * 7.3) * 0.5 + 0.5) * 0.06})`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    for (let y = 0; y < SZ; y += 4) {
      const nx = x + Math.sin(y * 0.1 + phase) * amp
      y === 0 ? ctx.moveTo(nx, y) : ctx.lineTo(nx, y)
    }
    ctx.stroke()
  }

  return makeMat(cC, cH, { roughness: 0.98, baseRepeatX: 2.5, baseRepeatY: 4.0, normalStrength: 3 })
}

// ── 10. ASFALTOVÝ ŠINDEL ─────────────────────────────────────────────────────
function drawAsfaltSindel() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 60, tH = 30, gap = 3

  ctx.fillStyle = '#0d0f10'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const lv = 16 + (Math.sin(col * 3.7 + row * 5.1) * 0.5 + 0.5) * 10

      ctx.fillStyle = `hsl(120,6%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Granule simulace (jemné tečky)
      for (let gx = 0; gx < tW - gap * 2; gx += 4) {
        for (let gy = 0; gy < tH - gap * 2; gy += 4) {
          const gv = (Math.sin(x + gx * 2.3 + y + gy * 1.7) * 0.5 + 0.5) * 0.12
          ctx.fillStyle = `rgba(160,140,100,${gv})`
          ctx.fillRect(x + gap + gx, y + gap + gy, 2, 2)
        }
      }
      // Dolní stín (přesah)
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
      // Horní světlo
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, 3)

      hCtx.fillStyle = `rgb(130,130,130)`
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      hCtx.fillStyle = 'rgba(255,255,255,0.45)'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.70)'
      hCtx.fillRect(x + gap, y + tH - gap - 4, tW - gap * 2, 4)
    }
  }
  return makeMat(cC, cH, { roughness: 0.96, baseRepeatX: 7.0, baseRepeatY: 5.0, normalStrength: 4 })
}

// ── 11. PLECHOVÁ TAŠKA (Lindab styl) ─────────────────────────────────────────
function drawPlechovaTaska() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 76, tH = 52, gap = 3

  ctx.fillStyle = '#1a1f22'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const lv = 44 + (Math.sin(col * 4.1 + row * 2.7) * 0.5 + 0.5) * 8

      // Tělo tašky — tmavě grafitová
      ctx.fillStyle = `hsl(200,12%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Horizontální vlna profilu (plechová taška má oblý profil)
      for (let py = 0; py < tH - gap * 2; py++) {
        const wave = Math.sin((py / (tH - gap * 2)) * Math.PI)
        ctx.fillStyle = `rgba(255,255,255,${wave * 0.18})`
        ctx.fillRect(x + gap, y + gap + py, tW - gap * 2, 1)
      }

      // Dolní výrazný stín
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(x + gap, y + tH - gap - 7, tW - gap * 2, 7)
      // Horní světlá hrana
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, 4)
      // Boční stíny
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(x + gap, y + gap, 5, tH - gap * 2)
      ctx.fillRect(x + tW - gap - 5, y + gap, 5, tH - gap * 2)

      // Svislá drážka uprostřed
      ctx.fillStyle = 'rgba(0,0,0,0.20)'
      ctx.fillRect(x + tW / 2 - 2, y + gap + 4, 3, tH - gap * 2 - 8)

      // Height map
      hCtx.fillStyle = `rgb(130,130,130)`
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      for (let py = 0; py < tH - gap * 2; py++) {
        const wave = Math.sin((py / (tH - gap * 2)) * Math.PI)
        const hv2 = Math.round(80 + wave * 120)
        hCtx.fillStyle = `rgb(${hv2},${hv2},${hv2})`
        hCtx.fillRect(x + gap, y + gap + py, tW - gap * 2, 1)
      }
      hCtx.fillStyle = 'rgba(255,255,255,0.5)'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.75)'
      hCtx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
    }
  }
  return makeMat(cC, cH, { roughness: 0.30, metalness: 0.70, baseRepeatX: 6.5, baseRepeatY: 4.5, normalStrength: 5 })
}

// ── 12. VLÁKNOCEMENT ──────────────────────────────────────────────────────────
function drawVlaknocement() {
  const [cC, ctx] = makeCanvas()
  const [cH, hCtx] = makeCanvas()
  const tW = 56, tH = 36, gap = 3

  ctx.fillStyle = '#181c20'; hCtx.fillStyle = '#111'
  ctx.fillRect(0, 0, SZ, SZ); hCtx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 2
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const lv = 56 + (Math.sin(col * 3.7 + row * 5.1) * 0.5 + 0.5) * 8

      ctx.fillStyle = `hsl(210,18%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)

      // Jemná vláknitá textura
      for (let fy = 0; fy < tH - gap * 2; fy += 3) {
        ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.sin(fy * 2.1 + col) * 0.02})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(x + gap, y + gap + fy + Math.sin(fy * 0.3) * 1.5)
        ctx.lineTo(x + tW - gap, y + gap + fy + Math.sin((fy + tW) * 0.3) * 1.5)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(0,0,0,0.50)'
      ctx.fillRect(x + gap, y + tH - gap - 5, tW - gap * 2, 5)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, 3)

      hCtx.fillStyle = `rgb(135,135,135)`
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      hCtx.fillStyle = 'rgba(255,255,255,0.5)'
      hCtx.fillRect(x + gap, y + gap, tW - gap * 2, 3)
      hCtx.fillStyle = 'rgba(0,0,0,0.75)'
      hCtx.fillRect(x + gap, y + tH - gap - 4, tW - gap * 2, 4)
    }
  }
  return makeMat(cC, cH, { roughness: 0.90, baseRepeatX: 3.5, baseRepeatY: 2.5, normalStrength: 4 })
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function buildKrytinaMateriál(krytina) {
  return cached(krytina, () => {
    switch (krytina) {
      // baseRepeatX/Y = počet opakování textury na 10m délky / 5m svahu
      // s world-space UV: rX = baseRepeatX/10, rY = baseRepeatY/5 (tiles per metr)
      case 'bobrovka':                              return drawBobrovka()
      case 'palena_drsnata':                         return drawPalenaDrsnata()
      case 'keramicka':                              return drawPalenaTaska(13, 60, 38)
      case 'palena_romana': case 'tondach_figaro':  return drawPalenaTaska(16, 65, 42)
      case 'palena_francouzska': case 'palena_stredomorska': return drawPalenaTaska(18, 58, 44)
      case 'betonova': case 'bramac_max':           return drawBetonova()
      case 'betonova_mala': case 'betonova_plochá': return drawBetonova()
      case 'bridlice':                              return drawBridlice()
      case 'sindel_dreveny': case 'sindel_stepy':   return drawSindel()
      case 'rakos':                                 return drawRakos()
      case 'falcovany_plech':                       return drawFalcovany(110, 122, 138)
      case 'trapezovy_plech':                       return drawTrapez(108, 120, 135)
      case 'vlnity_plech':                          return drawVlnity(122, 132, 148)
      case 'plechova_taska':                        return drawPlechovaTaska()
      case 'med':                                   return drawFalcovany(175, 95, 38)
      case 'titanzinek':                            return drawFalcovany(85, 97, 112)
      case 'asfaltovy_sindel':                      return drawAsfaltSindel()
      case 'vlaknocement':                          return drawVlaknocement()
      case 'onduline':                              return drawTrapez(28, 62, 26)
      // SATJAM — falcovaný plech / stojatá falc
      case 'satjam_rapid_deluxe':
      case 'satjam_profifalc':
      case 'satjam_rapid_trend':
      case 'satjam_tp26':                           return drawFalcovany(110, 122, 138)
      case 'satjam_trapez':                         return drawTrapez(108, 120, 135)
      // SATJAM — plechová taška (modulová / panelová)
      case 'satjam_roof':
      case 'satjam_grande':
      case 'satjam_trend':
      case 'satjam_taurus_maxx':
      case 'satjam_taurus_modul':
      case 'satjam_york_modul':
      case 'satjam_reno_modul':
      case 'satjam_tira_modul':
      case 'satjam_flat_plus':
      case 'satjam_sindel':
      case 'satjam_arad_modul':
      case 'satjam_rombo_metalic':
      case 'satjam_rombo_premium':                  return drawPlechovaTaska()
      case 'asfaltovy_pas': {
        const [c, ctx] = makeCanvas()
        ctx.fillStyle = '#0f0f0f'; ctx.fillRect(0, 0, SZ, SZ)
        for (let i = 0; i < 800; i++) {
          ctx.fillStyle = `rgba(200,180,140,${(Math.sin(i * 7.3) * 0.5 + 0.5) * 0.12})`
          const x = (Math.sin(i * 5.1) * 0.5 + 0.5) * SZ
          const y = (Math.sin(i * 3.7) * 0.5 + 0.5) * SZ
          ctx.fillRect(x, y, 3, 2)
        }
        return makeMat(c, null, { roughness: 0.98, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }
      case 'epdm_folie': {
        const [c, ctx] = makeCanvas(128, 128)
        ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, 128, 128)
        return makeMat(c, null, { roughness: 0.95, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }
      case 'polykarbonát': {
        const [c, ctx] = makeCanvas()
        ctx.fillStyle = '#c0d8ee'; ctx.fillRect(0, 0, SZ, SZ)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 0, SZ, SZ / 3)
        for (let x = 0; x < SZ; x += 20) {
          ctx.strokeStyle = 'rgba(150,200,240,0.4)'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke()
        }
        return makeMat(c, null, { roughness: 0.10, metalness: 0.05, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }
      default:
        return drawBobrovka()
    }
  })
}
