import { useEffect, useRef, useState } from 'react'

// ─── Interaktivní zadávání rozměrů střechy — půdorys + řez s tahatelnými body ──
// Konvence (shodná se zbytkem appky): hřeben vede ve směru DÉLKY, šířka je rozpětí
// kolmé na hřeben (výška hřebene h = (šířka/2) * tan(sklon) — stejný vzorec jako
// v RezSVG / roofGeometry3d.js). Přesah štítový prodlužuje délku, přesah okapní šířku.

const GOLD = '#c8820a'
const BG_PANEL = '#151515'
const BG_OUTER = '#181818'
const TEXT_LIGHT = '#e0d5c5'
const MUTED = '#777'
const BLUE = '#7ab8ff'

const CANVAS_H = 340
const MG = 70

function rnd(v, step) { return Math.round(v / step) * step }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export default function RoofDimensionsCanvas({
  typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi = 2.8, kridloSirka = 4, kridloDelka = 4,
  onChangeSirka, onChangeDelka, onChangeSklon, onChangePresahOkap, onChangePresahStit,
}) {
  const wrapRef       = useRef(null)
  const planPanelRef   = useRef(null)
  const rezPanelRef    = useRef(null)
  const planCanvasRef  = useRef(null)
  const rezCanvasRef   = useRef(null)
  const handleEls      = useRef({})
  const geom           = useRef({})
  const dragState      = useRef(null)
  const [hoverId, setHoverId] = useState(null)

  const d  = parseFloat(delka)      || 12
  const s  = parseFloat(sirka)      || 8
  const sk = parseFloat(sklon)      || 35
  const po = parseFloat(presahOkap) || 0
  const ps = parseFloat(presahStit) || 0
  const wH = parseFloat(vyskaZdi)   || 2.8

  const isLT       = typ === 'tvar-L' || typ === 'tvar-T'
  const noRidge    = ['pultova', 'valbova', 'stanova'].includes(typ)
  const hasNarozi  = ['valbova', 'stanova', 'pulvalbova'].includes(typ)
  const isMansarda = typ === 'mansardova'
  const isPultova  = typ === 'pultova'
  const isAsym     = typ === 'asymetricka'

  // ── Velikost plátna podle kontejneru ────────────────────────────────────────
  function sizeCanvases() {
    const planEl = planCanvasRef.current, rezEl = rezCanvasRef.current
    if (!planEl || !rezEl) return
    const w = Math.max(200, planEl.parentElement.clientWidth)
    planEl.width = w; planEl.height = CANVAS_H
    rezEl.width  = w; rezEl.height  = CANVAS_H
  }

  // ── Výpočet měřítka a kotev — půdorys ───────────────────────────────────────
  function computePlan() {
    const el = planCanvasRef.current
    const totD = d + 2 * ps + 2, totS = s + 2 * po + 2
    const sx = (el.width - MG * 2) / totD
    const sy = (el.height - MG * 2) / totS
    const sc = Math.min(sx, sy, 55)
    const pD = d * sc, pS = s * sc, pPs = ps * sc, pPo = po * sc
    const ox = (el.width - pD) / 2, oy = (el.height - pS) / 2
    geom.current.plan = { sc, pD, pS, pPs, pPo, ox, oy }
  }

  // ── Výpočet měřítka a kotev — řez (kolmo na hřeben, přes šířku) ─────────────
  function computeRez() {
    const el = rezCanvasRef.current
    const sc0 = Math.min((el.width - MG * 2) / (s + 2 * po + 1), 60)
    const hw0 = (s / 2) * sc0
    const rise0 = Math.tan(sk * Math.PI / 180) * hw0
    const wallH0 = sc0 * wH
    const sc = Math.min(sc0, (el.height - 90) / ((rise0 + wallH0) / sc0 || 1))
    const hw = (s / 2) * sc
    const rise = Math.min(Math.tan(sk * Math.PI / 180) * hw, el.height * 0.55)
    const wallH = Math.min(sc * wH, el.height * 0.32)
    const baseY = el.height * 0.74
    const cx = el.width / 2
    geom.current.rez = { sc, hw, rise, wallH, baseY, cx, eaveOv: po * sc }
  }

  // ── Kreslení půdorysu ────────────────────────────────────────────────────────
  function drawPlan() {
    const el = planCanvasRef.current
    if (!el) return
    const c = el.getContext('2d')
    computePlan()
    const { pD, pS, pPs, pPo, ox, oy } = geom.current.plan

    c.clearRect(0, 0, el.width, el.height)
    c.fillStyle = BG_PANEL
    c.fillRect(0, 0, el.width, el.height)

    const fox = ox - pPs, foy = oy - pPo, fow = pD + 2 * pPs, foh = pS + 2 * pPo

    // přesah (vnější obdélník)
    c.shadowColor = 'rgba(200,130,10,.18)'; c.shadowBlur = 14
    c.fillStyle = '#1f1b0f'; c.fillRect(fox, foy, fow, foh)
    c.shadowBlur = 0
    c.strokeStyle = GOLD; c.lineWidth = 1.5; c.setLineDash([]); c.strokeRect(fox, foy, fow, foh)

    // budova
    c.fillStyle = '#232323'; c.fillRect(ox, oy, pD, pS)
    c.strokeStyle = TEXT_LIGHT; c.lineWidth = 2.5; c.strokeRect(ox, oy, pD, pS)

    // krokve (svislé čáry po délce)
    c.strokeStyle = '#6b4d14'; c.lineWidth = 1
    const rSp = geom.current.plan.sc * 0.7
    const nr = Math.max(1, Math.floor(pD / rSp))
    for (let i = 1; i < nr; i++) {
      const x = ox + i * (pD / nr)
      c.beginPath(); c.moveTo(x, oy); c.lineTo(x, oy + pS); c.stroke()
    }

    // hřeben — podél délky
    if (!noRidge) {
      c.strokeStyle = GOLD; c.lineWidth = 2.5; c.setLineDash([7, 3])
      c.beginPath(); c.moveTo(ox, oy + pS / 2); c.lineTo(ox + pD, oy + pS / 2); c.stroke()
      c.setLineDash([])
    }
    // nárožní (valbová / stanová / půlvalbová)
    if (hasNarozi) {
      const m1 = [ox + pD * 0.18, oy + pS / 2], m2 = [ox + pD * 0.82, oy + pS / 2]
      c.strokeStyle = GOLD; c.lineWidth = 1.6; c.setLineDash([5, 3])
      if (typ === 'stanova') {
        ;[[fox, foy], [fox + fow, foy], [fox, foy + foh], [fox + fow, foy + foh]].forEach(([x, y]) => {
          c.beginPath(); c.moveTo(x, y); c.lineTo(ox + pD / 2, oy + pS / 2); c.stroke()
        })
      } else {
        c.beginPath(); c.moveTo(fox, foy); c.lineTo(...m1); c.stroke()
        c.beginPath(); c.moveTo(fox, foy + foh); c.lineTo(...m1); c.stroke()
        c.beginPath(); c.moveTo(fox + fow, foy); c.lineTo(...m2); c.stroke()
        c.beginPath(); c.moveTo(fox + fow, foy + foh); c.lineTo(...m2); c.stroke()
      }
      c.setLineDash([])
    }
    if (isMansarda) {
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.5
      c.strokeRect(ox + pD * 0.18, oy + pS * 0.22, pD * 0.64, pS * 0.56)
    }

    // L/T křídlo (ilustrativní, modré)
    if (isLT) {
      const wb = Math.min(parseFloat(kridloDelka) || 4, d) * geom.current.plan.sc
      const hb = Math.min(parseFloat(kridloSirka) || 4, s) * geom.current.plan.sc
      const wx = ox + pD - wb, wy = oy - hb
      c.strokeStyle = BLUE; c.lineWidth = 2; c.setLineDash([]); c.strokeRect(wx, wy, wb, hb)
      c.strokeStyle = BLUE + '88'; c.lineWidth = 1.5; c.setLineDash([4, 3])
      c.beginPath(); c.moveTo(wx, wy + hb / 2); c.lineTo(wx + wb, wy + hb / 2); c.stroke()
      c.setLineDash([])
      c.fillStyle = BLUE; c.font = 'bold 10px monospace'; c.textAlign = 'center'
      c.fillText(typ === 'tvar-L' ? 'Křídlo L' : 'Křídlo T', wx + wb / 2, wy - 6)
    }

    // ── kóty ──
    dimH(c, ox, oy - 18, pD, `${d.toFixed(2)} m`, TEXT_LIGHT)
    dimV(c, ox + pD + 18, oy, pS, `${s.toFixed(2)} m`, TEXT_LIGHT)
    if (ps > 0) dimH(c, fox, foy - 38, fow, `${(d + 2 * ps).toFixed(2)} m`, GOLD)
    if (po > 0) dimV(c, fox - 38, foy, foh, `${(s + 2 * po).toFixed(2)} m`, GOLD)

    if (pPs > 1.5) { arrH(c, ox - pPs, oy + pS / 2, pPs, ps.toFixed(2)); arrH(c, ox + pD, oy + pS / 2, pPs, ps.toFixed(2)) }
    if (pPo > 1.5) { arrV(c, ox + pD / 2, oy - pPo, pPo, po.toFixed(2)); arrV(c, ox + pD / 2, oy + pS, pPo, po.toFixed(2)) }
  }

  function dimH(c, x, y, w, label, color) {
    c.strokeStyle = color; c.lineWidth = 1; c.setLineDash([3, 2])
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); c.setLineDash([])
    c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.moveTo(x + w, y - 5); c.lineTo(x + w, y + 5); c.stroke()
    c.fillStyle = color; c.font = 'bold 10px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(label, x + w / 2, y - 9)
  }
  function dimV(c, x, y, h, label, color) {
    c.strokeStyle = color; c.lineWidth = 1; c.setLineDash([3, 2])
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h); c.stroke(); c.setLineDash([])
    c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.moveTo(x - 5, y + h); c.lineTo(x + 5, y + h); c.stroke()
    c.fillStyle = color; c.font = 'bold 10px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.save(); c.translate(x + 9, y + h / 2); c.rotate(-Math.PI / 2); c.fillText(label, 0, 0); c.restore()
  }
  function arrH(c, x, y, len, label) {
    if (len < 2) return
    c.strokeStyle = GOLD + '66'; c.lineWidth = 1; c.setLineDash([2, 2])
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke(); c.setLineDash([])
    const mx = x + len / 2
    c.font = '9px monospace'; const tw = c.measureText(label).width + 4
    c.fillStyle = BG_PANEL; c.fillRect(mx - tw / 2, y - 6, tw, 12)
    c.fillStyle = GOLD; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, mx, y)
  }
  function arrV(c, x, y, len, label) {
    if (len < 2) return
    c.strokeStyle = GOLD + '66'; c.lineWidth = 1; c.setLineDash([2, 2])
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + len); c.stroke(); c.setLineDash([])
    const my = y + len / 2
    c.font = '9px monospace'; const tw = c.measureText(label).width + 4
    c.fillStyle = BG_PANEL; c.fillRect(x - tw / 2, my - 6, tw, 12)
    c.fillStyle = GOLD; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x, my)
  }

  // ── Kreslení řezu ────────────────────────────────────────────────────────────
  function drawRez() {
    const el = rezCanvasRef.current
    if (!el) return
    const c = el.getContext('2d')
    computeRez()
    const { sc, hw, rise, wallH, baseY, cx, eaveOv } = geom.current.rez

    c.clearRect(0, 0, el.width, el.height)
    c.fillStyle = BG_PANEL
    c.fillRect(0, 0, el.width, el.height)

    const wallTop = baseY - wallH
    const ridgeY  = wallTop - rise
    const lx = cx - hw, rx = cx + hw
    const eaveL = lx - eaveOv, eaveR = rx + eaveOv

    // terén
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 1; c.setLineDash([4, 3])
    c.beginPath(); c.moveTo(lx - 40, baseY); c.lineTo(rx + 40, baseY); c.stroke(); c.setLineDash([])
    c.fillStyle = '#2a2a2a'; c.fillRect(lx - 40, baseY, hw * 2 + 80, 8)

    // stěny
    c.fillStyle = '#2c2c2c'; c.fillRect(lx, wallTop, hw * 2, wallH)
    c.strokeStyle = TEXT_LIGHT; c.lineWidth = 2; c.setLineDash([]); c.strokeRect(lx, wallTop, hw * 2, wallH)
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 1
    for (let i = 0; i < wallH; i += 10) {
      c.beginPath(); c.moveTo(lx, wallTop + i); c.lineTo(lx + 10, wallTop + i + 10); c.stroke()
      c.beginPath(); c.moveTo(rx, wallTop + i); c.lineTo(rx - 10, wallTop + i + 10); c.stroke()
    }

    // střecha
    c.fillStyle = '#201c0e'
    let apex = [cx, ridgeY]
    if (isPultova) {
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(eaveR, wallTop - rise)
      c.lineTo(rx, wallTop - rise); c.lineTo(rx, wallTop); c.closePath(); c.fill()
      c.strokeStyle = GOLD; c.lineWidth = 2.5
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(eaveR, wallTop - rise); c.stroke()
      apex = [eaveR, wallTop - rise]
    } else if (isMansarda) {
      const kneeH = rise * 0.4, kneeIn = hw * 0.25
      c.beginPath()
      c.moveTo(eaveL, wallTop); c.lineTo(lx + kneeIn, wallTop - kneeH)
      c.lineTo(cx, ridgeY); c.lineTo(rx - kneeIn, wallTop - kneeH); c.lineTo(eaveR, wallTop)
      c.closePath(); c.fill()
      c.strokeStyle = GOLD; c.lineWidth = 2.5
      c.beginPath()
      c.moveTo(eaveL, wallTop); c.lineTo(lx + kneeIn, wallTop - kneeH)
      c.lineTo(cx, ridgeY); c.lineTo(rx - kneeIn, wallTop - kneeH); c.lineTo(eaveR, wallTop)
      c.stroke()
    } else if (isAsym) {
      const ridgeX = cx - hw * 0.3
      const riseL = Math.tan((sk + 10) * Math.PI / 180) * Math.abs(ridgeX - lx)
      const riseR = Math.tan(Math.max(5, sk - 10) * Math.PI / 180) * Math.abs(rx - ridgeX)
      const topY = wallTop - Math.max(riseL, riseR)
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(ridgeX, topY); c.lineTo(eaveR, wallTop); c.closePath(); c.fill()
      c.strokeStyle = GOLD; c.lineWidth = 2.5
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(ridgeX, topY); c.lineTo(eaveR, wallTop); c.stroke()
      apex = [ridgeX, topY]
    } else {
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(cx, ridgeY); c.lineTo(eaveR, wallTop); c.closePath(); c.fill()
      c.strokeStyle = GOLD; c.lineWidth = 2.5
      c.beginPath(); c.moveTo(eaveL, wallTop); c.lineTo(cx, ridgeY); c.lineTo(eaveR, wallTop); c.stroke()
    }

    // přesah okapu (přerušovaně)
    c.strokeStyle = GOLD + '44'; c.lineWidth = 1; c.setLineDash([2, 2])
    c.beginPath(); c.moveTo(lx, wallTop); c.lineTo(eaveL, wallTop); c.stroke()
    c.beginPath(); c.moveTo(rx, wallTop); c.lineTo(eaveR, wallTop); c.stroke(); c.setLineDash([])

    // kóty
    dimH(c, lx, baseY + 20, hw * 2, `${s.toFixed(2)} m`, TEXT_LIGHT)
    dimV(c, eaveL - 22, wallTop, wallH, `${wH.toFixed(2)} m`, MUTED)
    dimV(c, eaveR + 22, ridgeY, rise, `${(rise / sc).toFixed(2)} m`, GOLD)

    // úhel sklonu
    const arcR = Math.min(hw * 0.5, 36)
    c.strokeStyle = GOLD; c.lineWidth = 1.5
    c.beginPath()
    c.arc(lx, wallTop, arcR, -Math.PI / 2 + Math.atan2(rise, hw), -Math.PI / 2)
    c.stroke()
    c.fillStyle = GOLD; c.font = 'bold 13px monospace'; c.textAlign = 'left'; c.textBaseline = 'middle'
    c.fillText(`${sk}°`, lx + arcR + 4, wallTop - arcR / 2 - 2)

    c.fillStyle = '#555'; c.font = '10px monospace'; c.textAlign = 'center'
    c.fillText('Řez A–A · Pohled čelní', el.width / 2, el.height - 8)

    geom.current.rezApex = apex
  }

  // ── Handles: pozice ─────────────────────────────────────────────────────────
  const planHandleDefs = [
    { id: 'pDelka', cursor: 'ew-resize', title: 'Délka →' },
    { id: 'pSirka',  cursor: 'ns-resize', title: 'Šířka ↓' },
    { id: 'pBoth',   cursor: 'nwse-resize', title: 'Délka + Šířka' },
    { id: 'pOkap',   cursor: 'ns-resize', title: 'Přesah okapní' },
    { id: 'pStit',   cursor: 'ew-resize', title: 'Přesah štítový' },
  ]
  const rezHandleDefs = [
    { id: 'rSirka', cursor: 'ew-resize', title: 'Šířka →' },
    { id: 'rSklon', cursor: 'ns-resize', title: 'Sklon ↕' },
  ]

  function posHandle(id, x, y) {
    const el = handleEls.current[id]
    if (!el) return
    el.style.left = x + 'px'; el.style.top = y + 'px'
  }

  function updateHandlePositions() {
    const gp = geom.current.plan, gr = geom.current.rez
    if (gp) {
      posHandle('pDelka', gp.ox + gp.pD,           gp.oy + gp.pS / 2)
      posHandle('pSirka', gp.ox + gp.pD / 2,        gp.oy + gp.pS)
      posHandle('pBoth',  gp.ox + gp.pD,            gp.oy + gp.pS)
      posHandle('pOkap',  gp.ox + gp.pD / 2,        gp.oy + gp.pS + gp.pPo + 16)
      posHandle('pStit',  gp.ox + gp.pD + gp.pPs + 16, gp.oy + gp.pS / 2)
    }
    if (gr) {
      posHandle('rSirka', gr.cx + gr.hw, gr.baseY)
      posHandle('rSklon', gr.cx, gr.baseY - gr.wallH - gr.rise)
    }
  }

  function redraw() { drawPlan(); drawRez(); updateHandlePositions() }

  // ── Drag logika ─────────────────────────────────────────────────────────────
  function getPoint(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }
  }

  function startDrag(id, e) {
    e.preventDefault(); e.stopPropagation()
    dragState.current = {
      id, start: getPoint(e),
      snap: { d, s, sk, po, ps },
      gp: { ...geom.current.plan }, gr: { ...geom.current.rez },
    }
    const el = handleEls.current[id]
    if (el) el.style.transform = 'translate(-50%,-50%) scale(1.6)'
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('touchmove', onDrag, { passive: false })
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchend', endDrag)
  }

  function onDrag(e) {
    const ds = dragState.current
    if (!ds) return
    e.preventDefault()
    const p = getPoint(e)
    const dx = p.x - ds.start.x, dy = p.y - ds.start.y
    const { snap, gp, gr } = ds

    switch (ds.id) {
      case 'pDelka':
        onChangeDelka?.(clamp(rnd(snap.d + dx / gp.sc, 0.1), 2, 60)); break
      case 'pSirka':
        onChangeSirka?.(clamp(rnd(snap.s + dy / gp.sc, 0.1), 2, 40)); break
      case 'pBoth':
        onChangeDelka?.(clamp(rnd(snap.d + dx / gp.sc, 0.1), 2, 60))
        onChangeSirka?.(clamp(rnd(snap.s + dy / gp.sc, 0.1), 2, 40)); break
      case 'pOkap':
        onChangePresahOkap?.(clamp(rnd(snap.po + dy / gp.sc, 0.05), 0, 2)); break
      case 'pStit':
        onChangePresahStit?.(clamp(rnd(snap.ps + dx / gp.sc, 0.05), 0, 2)); break
      case 'rSirka':
        onChangeSirka?.(clamp(rnd(snap.s + dx / gr.sc * 2, 0.1), 2, 40)); break
      case 'rSklon': {
        const newRise = Math.max(0.3 * gr.sc, gr.rise - dy)
        const newSlope = Math.atan2(newRise, gr.hw) * 180 / Math.PI
        onChangeSklon?.(clamp(Math.round(newSlope), 5, 75)); break
      }
      default: break
    }
  }

  function endDrag() {
    const ds = dragState.current
    if (ds) {
      const el = handleEls.current[ds.id]
      if (el) el.style.transform = 'translate(-50%,-50%)'
    }
    dragState.current = null
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('mouseup', endDrag)
    document.removeEventListener('touchend', endDrag)
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  useEffect(() => {
    sizeCanvases()
    redraw()
    const ro = new ResizeObserver(() => { sizeCanvases(); redraw() })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { redraw() })

  // ── Odvozené hodnoty pro status bar ─────────────────────────────────────────
  const ridgeHeight = (s / 2) * Math.tan(sk * Math.PI / 180)
  const plochaPudorysu = d * s
  const slopeLen = (s / 2 + po) / Math.cos(sk * Math.PI / 180)
  const plochaStrechy = isPultova ? (d + 2 * ps) * (s + po) / Math.cos(sk * Math.PI / 180)
    : (d + 2 * ps) * slopeLen * 2

  return (
    <div ref={wrapRef} className="rounded-lg overflow-hidden" style={{ background: BG_OUTER, border: '1px solid #2a2a2a' }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* PŮDORYS */}
        <div ref={planPanelRef} className="relative" style={{ borderRight: '1px solid #2a2a2a' }}>
          <div className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider z-10" style={{ color: MUTED }}>
            Půdorys — pohled shora
          </div>
          <canvas ref={planCanvasRef} style={{ display: 'block', width: '100%', height: CANVAS_H }} />
          {planHandleDefs.map(h => (
            <Handle key={h.id} id={h.id} title={h.title} cursor={h.cursor}
              setRef={el => { handleEls.current[h.id] = el }}
              onStart={e => startDrag(h.id, e)}
              hovered={hoverId === h.id} onHover={setHoverId} />
          ))}
        </div>

        {/* ŘEZ */}
        <div ref={rezPanelRef} className="relative">
          <div className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider z-10" style={{ color: MUTED }}>
            Řez A–A — příčný profil
          </div>
          <canvas ref={rezCanvasRef} style={{ display: 'block', width: '100%', height: CANVAS_H }} />
          {rezHandleDefs.map(h => (
            <Handle key={h.id} id={h.id} title={h.title} cursor={h.cursor}
              setRef={el => { handleEls.current[h.id] = el }}
              onStart={e => startDrag(h.id, e)}
              hovered={hoverId === h.id} onHover={setHoverId} />
          ))}
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5" style={{ background: '#111', borderTop: '1px solid #2a2a2a' }}>
        <Stat label="Délka" value={d.toFixed(2)} unit="m" />
        <Stat label="Šířka" value={s.toFixed(2)} unit="m" />
        <Stat label="Sklon" value={sk} unit="°" />
        <Stat label="Přesah okapní" value={po.toFixed(2)} unit="m" />
        <Stat label="Přesah štítový" value={ps.toFixed(2)} unit="m" />
        <Stat label="Výška hřebene" value={ridgeHeight.toFixed(2)} unit="m" />
        <Stat label="Plocha půdorysu" value={plochaPudorysu.toFixed(1)} unit="m²" />
        <Stat label="Plocha střechy" value={plochaStrechy.toFixed(1)} unit="m²" />
      </div>
      <div className="px-4 py-1.5 text-center" style={{ background: '#1a1a10', borderTop: '1px solid #2a2500', fontSize: 10.5, color: '#888' }}>
        <b style={{ color: GOLD }}>Půdorys:</b> táhni → vpravo = délka · ↓ dole = šířka · rohem = obojí · vnější body = přesahy&nbsp;&nbsp;·&nbsp;&nbsp;
        <b style={{ color: GOLD }}>Řez:</b> táhni → bok = šířka · ↕ hřeben = sklon
      </div>
    </div>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div style={{ fontSize: 11, fontFamily: 'monospace', color: MUTED }}>
      {label}: <b style={{ color: GOLD, fontSize: 13 }}>{value}</b>{unit}
    </div>
  )
}

function Handle({ id, title, cursor, setRef, onStart, hovered, onHover }) {
  return (
    <div
      ref={setRef}
      onMouseDown={onStart}
      onTouchStart={onStart}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      title={title}
      style={{
        position: 'absolute', width: 16, height: 16, left: 0, top: 0,
        background: GOLD, border: '2.5px solid #fff', borderRadius: '50%',
        transform: 'translate(-50%,-50%)', cursor, zIndex: 20,
        boxShadow: hovered ? '0 0 14px rgba(200,130,10,.8)' : '0 0 8px rgba(200,130,10,.5)',
        touchAction: 'none', transition: 'box-shadow .1s',
      }}
    />
  )
}
