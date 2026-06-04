import * as THREE from 'three'

const SZ = 256   // malý canvas = rychlé generování
const CACHE = new Map()

// ── Helpers ──────────────────────────────────────────────────────────────────
function canvas256() {
  const c = document.createElement('canvas')
  c.width = SZ; c.height = SZ
  return [c, c.getContext('2d')]
}

function makeMat(canvas, { roughness = 0.88, metalness = 0, baseRepeatX = 1, baseRepeatY = 1 } = {}) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 16
  tex.needsUpdate = true

  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness, metalness, side: THREE.DoubleSide,
  })
  mat.userData = { baseRepeatX, baseRepeatY }
  return mat
}

// Deterministická variace barvy (bez Math.random → konzistentní výsledek)
function hslVar(col, row, h, s, l, spread = 6) {
  const v = (Math.sin(col * 7.3 + row * 3.7) * 0.5 + 0.5) * spread - spread / 2
  return `hsl(${h},${s}%,${Math.max(20, Math.min(80, l + v))}%)`
}

// ── Tile-based drawer ─────────────────────────────────────────────────────────
function drawTiles(ctx, { tW, tH, gap = 3, h, s, l, spread = 6, mortarColor = '#1a0a04', convex = true, offset = true }) {
  ctx.fillStyle = mortarColor
  ctx.fillRect(0, 0, SZ, SZ)

  const rows = Math.ceil(SZ / tH) + 1
  const cols = Math.ceil(SZ / tW) + 2

  for (let row = 0; row < rows; row++) {
    const ox = offset ? (row % 2) * (tW / 2) : 0
    for (let col = -1; col < cols; col++) {
      const x = col * tW - ox, y = row * tH
      const ix = x + gap, iy = y + gap, iW = tW - gap * 2, iH = tH - gap * 2

      // Tile base
      ctx.fillStyle = hslVar(col, row, h, s, l, spread)
      ctx.fillRect(ix, iy, iW, iH)

      if (convex) {
        // Highlight top (convex curve)
        const vg = ctx.createLinearGradient(ix, iy, ix, iy + iH)
        vg.addColorStop(0,    'rgba(255,255,255,0.30)')
        vg.addColorStop(0.30, 'rgba(255,255,255,0.08)')
        vg.addColorStop(0.65, 'rgba(0,0,0,0.05)')
        vg.addColorStop(1,    'rgba(0,0,0,0.38)')
        ctx.fillStyle = vg
        ctx.fillRect(ix, iy, iW, iH)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.fillRect(ix, iy, iW, iH * 0.28)
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.fillRect(ix, iy + iH - iH * 0.22, iW, iH * 0.22)
      }
    }
  }
}

// ── Standing seam metal ───────────────────────────────────────────────────────
function drawFalc(ctx, { baseR, baseG, baseB, seamPitch }) {
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`
  ctx.fillRect(0, 0, SZ, SZ)

  // Brushed metal grain
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.sin(i) * 0.01 + 0.01})`
    ctx.fillRect(0, (i / 600) * SZ, SZ, 1)
  }

  // Standing seams
  for (let sx = 0; sx < SZ; sx += seamPitch) {
    // Shadow left of seam
    const lg = ctx.createLinearGradient(sx - seamPitch * 0.15, 0, sx, 0)
    lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.45)')
    ctx.fillStyle = lg; ctx.fillRect(sx - seamPitch * 0.15, 0, seamPitch * 0.15, SZ)

    // Seam crown
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(sx, 0, 3, SZ)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(sx + 3, 0, 4, SZ)

    // Shadow right of seam
    const rg = ctx.createLinearGradient(sx + 7, 0, sx + seamPitch * 0.2, 0)
    rg.addColorStop(0, 'rgba(0,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg; ctx.fillRect(sx + 7, 0, seamPitch * 0.2, SZ)
  }

  // Panel joints
  for (let hy = 0; hy < SZ; hy += 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, hy, SZ, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, hy + 3, SZ, 2)
  }
}

// ── Trapéz ────────────────────────────────────────────────────────────────────
function drawTrapez(ctx, { baseR, baseG, baseB, pitch }) {
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`
  ctx.fillRect(0, 0, SZ, SZ)

  for (let sx = 0; sx < SZ; sx += pitch) {
    // Valley (dark)
    const vg = ctx.createLinearGradient(sx, 0, sx + pitch * 0.15, 0)
    vg.addColorStop(0, 'rgba(0,0,0,0.60)'); vg.addColorStop(1, 'rgba(0,0,0,0.08)')
    ctx.fillStyle = vg; ctx.fillRect(sx, 0, pitch * 0.15, SZ)

    // Slope up
    const ag = ctx.createLinearGradient(sx + pitch * 0.15, 0, sx + pitch * 0.35, 0)
    ag.addColorStop(0, 'rgba(0,0,0,0.08)'); ag.addColorStop(1, 'rgba(255,255,255,0.28)')
    ctx.fillStyle = ag; ctx.fillRect(sx + pitch * 0.15, 0, pitch * 0.20, SZ)

    // Top (bright)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(sx + pitch * 0.35, 0, pitch * 0.30, SZ)

    // Slope down
    const dg = ctx.createLinearGradient(sx + pitch * 0.65, 0, sx + pitch * 0.85, 0)
    dg.addColorStop(0, 'rgba(255,255,255,0.28)'); dg.addColorStop(1, 'rgba(0,0,0,0.08)')
    ctx.fillStyle = dg; ctx.fillRect(sx + pitch * 0.65, 0, pitch * 0.20, SZ)
  }

  for (let hy = 0; hy < SZ; hy += 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, hy, SZ, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, hy + 3, SZ, 2)
  }
}

// ── Vlnitý plech ──────────────────────────────────────────────────────────────
function drawVlnity(ctx, { baseR, baseG, baseB, pitch }) {
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`
  ctx.fillRect(0, 0, SZ, SZ)

  for (let x = 0; x < SZ; x++) {
    const wave = Math.sin((x % pitch) / pitch * Math.PI * 2)
    if (wave > 0.05) {
      ctx.fillStyle = `rgba(255,255,255,${wave * 0.32})`
      ctx.fillRect(x, 0, 1, SZ)
    } else if (wave < -0.05) {
      ctx.fillStyle = `rgba(0,0,0,${-wave * 0.38})`
      ctx.fillRect(x, 0, 1, SZ)
    }
  }
  for (let hy = 0; hy < SZ; hy += 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, hy, SZ, 2)
  }
}

// ── Břidlice ──────────────────────────────────────────────────────────────────
function drawBridlice(ctx) {
  ctx.fillStyle = '#1a1e24'
  ctx.fillRect(0, 0, SZ, SZ)

  const widths = [36, 44, 32, 48, 40], tH = 26, gap = 3
  let y = 0, ri = 0
  while (y < SZ + tH) {
    const ox = (ri % 2) * 20
    let x = -ox, wi = 0
    while (x < SZ + 48) {
      const tW = widths[wi % widths.length]
      const lv = 55 + (Math.sin(wi * 4.1 + ri * 2.7) * 0.5 + 0.5) * 15
      ctx.fillStyle = `hsl(220,15%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, (tH - gap * 2) * 0.35)
      ctx.fillStyle = 'rgba(0,0,0,0.30)'
      ctx.fillRect(x + gap, y + tH - gap - 3, tW - gap * 2, 3)
      x += tW; wi++
    }
    y += tH; ri++
  }
}

// ── Šindel ────────────────────────────────────────────────────────────────────
function drawSindel(ctx) {
  ctx.fillStyle = '#2a1206'
  ctx.fillRect(0, 0, SZ, SZ)

  const tW = 44, tH = 22, gap = 2
  for (let row = 0; row < SZ / tH + 1; row++) {
    const ox = (row % 3) * 15
    for (let col = -1; col < SZ / tW + 2; col++) {
      const x = col * tW - ox, y = row * tH
      const br = 75 + (Math.sin(col * 5.2 + row * 3.1) * 0.5 + 0.5) * 30
      ctx.fillStyle = `rgb(${br | 0},${(br * 0.68) | 0},${(br * 0.40) | 0})`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      // Wood grain
      for (let gi = 0; gi < 3; gi++) {
        ctx.fillStyle = 'rgba(0,0,0,0.10)'
        ctx.fillRect(x + gap + gi * (tW / 3), y + gap, 1, tH - gap * 2)
      }
      ctx.fillStyle = 'rgba(0,0,0,0.40)'
      ctx.fillRect(x + gap, y + tH - gap - 3, tW - gap * 2, 3)
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH * 0.25)
    }
  }
}

// ── Rákos ─────────────────────────────────────────────────────────────────────
function drawRakos(ctx) {
  ctx.fillStyle = '#8a7040'
  ctx.fillRect(0, 0, SZ, SZ)
  for (let i = 0; i < SZ; i++) {
    const wave = Math.sin(i * 0.5) * 0.5 + 0.5
    ctx.fillStyle = `rgba(0,0,0,${0.05 + wave * 0.12})`
    ctx.fillRect(0, i, SZ, 1)
  }
  for (let band = 0; band < SZ; band += 32) {
    const g = ctx.createLinearGradient(0, band, 0, band + 32)
    g.addColorStop(0,   'rgba(0,0,0,0.25)')
    g.addColorStop(0.2, 'rgba(0,0,0,0.05)')
    g.addColorStop(0.8, 'rgba(255,255,255,0.04)')
    g.addColorStop(1,   'rgba(0,0,0,0.18)')
    ctx.fillStyle = g; ctx.fillRect(0, band, SZ, 32)
  }
}

// ── Asfaltový šindel ──────────────────────────────────────────────────────────
function drawAsfaltSindel(ctx) {
  ctx.fillStyle = '#111318'
  ctx.fillRect(0, 0, SZ, SZ)

  const tW = 48, tH = 24, gap = 3
  for (let row = 0; row < SZ / tH + 1; row++) {
    const ox = (row % 2) * (tW / 2)
    for (let col = -1; col < SZ / tW + 2; col++) {
      const x = col * tW - ox, y = row * tH
      const lv = 18 + (Math.sin(col * 3.7 + row * 5.1) * 0.5 + 0.5) * 10
      ctx.fillStyle = `hsl(120,8%,${lv}%)`
      ctx.fillRect(x + gap, y + gap, tW - gap * 2, tH - gap * 2)
      // Granule simulation
      ctx.fillStyle = 'rgba(180,160,120,0.25)'
      ctx.fillRect(x + gap, y + gap + 2, tW - gap * 2, 3)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(x + gap, y + tH - gap - 3, tW - gap * 2, 3)
    }
  }
}

// ── Cache-based material getter ───────────────────────────────────────────────
function cached(key, fn) {
  if (!CACHE.has(key)) CACHE.set(key, fn())
  const base = CACHE.get(key)
  const mat = base.clone()
  // Klonujeme i textury — jinak dispose() zničí sdílenou texturu v cache
  if (base.map)       { mat.map = base.map.clone();           mat.map.needsUpdate = true }
  if (base.normalMap) { mat.normalMap = base.normalMap.clone(); mat.normalMap.needsUpdate = true }
  mat.userData = { ...base.userData }
  return mat
}

// ── Public API ────────────────────────────────────────────────────────────────
// baseRepeatX/Y = počet opakování plátna pro 10m délku / 5m svah
// rX = baseRepeatX × (ridgeLen/10), rY = baseRepeatY × (slopeLen/5)

export function buildKrytinaMateriál(krytina) {
  return cached(krytina, () => {
    const [c, ctx] = canvas256()

    switch (krytina) {
      // Pálené — tW=52,tH=36 → ~5 tiles/row, cíl 15 tiles → baseX=3.0
      case 'bobrovka':
        drawTiles(ctx, { tW: 32, tH: 26, gap: 3, h: 12, s: 68, l: 43, spread: 8, convex: true })
        return makeMat(c, { roughness: 0.90, baseRepeatX: 4.0, baseRepeatY: 3.0 })

      case 'palena_drsnata': case 'keramicka':
        drawTiles(ctx, { tW: 58, tH: 40, gap: 4, h: 14, s: 62, l: 40, spread: 7, convex: true })
        return makeMat(c, { roughness: 0.87, baseRepeatX: 3.0, baseRepeatY: 2.0 })

      case 'palena_romana': case 'tondach_figaro':
        drawTiles(ctx, { tW: 54, tH: 38, gap: 4, h: 16, s: 65, l: 42, spread: 8, convex: true })
        return makeMat(c, { roughness: 0.86, baseRepeatX: 3.0, baseRepeatY: 2.0 })

      case 'palena_francouzska': case 'palena_stredomorska':
        drawTiles(ctx, { tW: 64, tH: 44, gap: 4, h: 18, s: 60, l: 44, spread: 7, convex: true })
        return makeMat(c, { roughness: 0.85, baseRepeatX: 2.5, baseRepeatY: 1.8 })

      case 'betonova': case 'bramac_max':
        drawTiles(ctx, { tW: 60, tH: 40, gap: 4, h: 220, s: 10, l: 52, spread: 5, convex: false, mortarColor: '#282830' })
        return makeMat(c, { roughness: 0.92, baseRepeatX: 3.0, baseRepeatY: 2.0 })

      case 'betonova_mala': case 'betonova_plochá':
        drawTiles(ctx, { tW: 46, tH: 32, gap: 3, h: 220, s: 8, l: 54, spread: 4, convex: false, mortarColor: '#282830' })
        return makeMat(c, { roughness: 0.93, baseRepeatX: 3.5, baseRepeatY: 2.5 })

      case 'bridlice':
        drawBridlice(ctx)
        return makeMat(c, { roughness: 0.95, baseRepeatX: 2.5, baseRepeatY: 2.0 })

      case 'sindel_dreveny': case 'sindel_stepy':
        drawSindel(ctx)
        return makeMat(c, { roughness: 0.97, baseRepeatX: 2.0, baseRepeatY: 2.5 })

      case 'rakos':
        drawRakos(ctx)
        return makeMat(c, { roughness: 0.98, baseRepeatX: 1.0, baseRepeatY: 1.5 })

      case 'falcovany_plech':
        drawFalc(ctx, { baseR: 118, baseG: 132, baseB: 148, seamPitch: 32 })
        return makeMat(c, { roughness: 0.28, metalness: 0.72, baseRepeatX: 2.5, baseRepeatY: 1.0 })

      case 'trapezovy_plech':
        drawTrapez(ctx, { baseR: 115, baseG: 128, baseB: 142, pitch: 38 })
        return makeMat(c, { roughness: 0.32, metalness: 0.68, baseRepeatX: 4.0, baseRepeatY: 1.0 })

      case 'vlnity_plech':
        drawVlnity(ctx, { baseR: 128, baseG: 140, baseB: 155, pitch: 30 })
        return makeMat(c, { roughness: 0.35, metalness: 0.65, baseRepeatX: 4.5, baseRepeatY: 1.0 })

      case 'plechova_taska':
        drawTiles(ctx, { tW: 60, tH: 42, gap: 4, h: 210, s: 12, l: 48, spread: 4, convex: true, mortarColor: '#1a2028' })
        return makeMat(c, { roughness: 0.32, metalness: 0.68, baseRepeatX: 3.0, baseRepeatY: 2.0 })

      case 'med': {
        drawFalc(ctx, { baseR: 185, baseG: 100, baseB: 40, seamPitch: 32 })
        // Patina overlay
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = `rgba(60,160,90,0.4)`
          ctx.fillRect(Math.sin(i) * SZ + SZ / 2, i * 14, 40, 8)
        }
        ctx.globalAlpha = 1
        return makeMat(c, { roughness: 0.26, metalness: 0.74, baseRepeatX: 2.5, baseRepeatY: 1.0 })
      }

      case 'titanzinek':
        drawFalc(ctx, { baseR: 90, baseG: 102, baseB: 118, seamPitch: 32 })
        return makeMat(c, { roughness: 0.22, metalness: 0.78, baseRepeatX: 2.5, baseRepeatY: 1.0 })

      case 'asfaltovy_sindel':
        drawAsfaltSindel(ctx)
        return makeMat(c, { roughness: 0.96, baseRepeatX: 3.5, baseRepeatY: 2.5 })

      case 'vlaknocement':
        drawTiles(ctx, { tW: 42, tH: 28, gap: 3, h: 215, s: 18, l: 58, spread: 6, convex: false, mortarColor: '#1a2030' })
        return makeMat(c, { roughness: 0.90, baseRepeatX: 3.5, baseRepeatY: 2.5 })

      case 'onduline':
        drawTrapez(ctx, { baseR: 30, baseG: 65, baseB: 28, pitch: 38 })
        return makeMat(c, { roughness: 0.88, metalness: 0.08, baseRepeatX: 4.0, baseRepeatY: 1.0 })

      case 'asfaltovy_pas': {
        ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, SZ, SZ)
        for (let i = 0; i < 500; i++) {
          ctx.fillStyle = `rgba(200,180,140,0.15)`
          ctx.fillRect(Math.random() * SZ, Math.random() * SZ, 3, 2)
        }
        return makeMat(c, { roughness: 0.98, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }

      case 'epdm_folie': {
        ctx.fillStyle = '#0e0e0e'; ctx.fillRect(0, 0, SZ, SZ)
        return makeMat(c, { roughness: 0.95, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }

      case 'polykarbonát': {
        ctx.fillStyle = '#c0d8ee'; ctx.fillRect(0, 0, SZ, SZ)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, 0, SZ, SZ / 3)
        return makeMat(c, { roughness: 0.10, metalness: 0.05, baseRepeatX: 0.5, baseRepeatY: 0.5 })
      }

      default:
        // Pálená taška default
        drawTiles(ctx, { tW: 52, tH: 36, gap: 4, h: 14, s: 66, l: 42, spread: 8, convex: true })
        return makeMat(c, { roughness: 0.88, baseRepeatX: 3.0, baseRepeatY: 2.0 })
    }
  })
}
