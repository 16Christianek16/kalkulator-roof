import { useMemo, useEffect, useRef, useState, lazy, Suspense } from 'react'
import { LayoutDashboard, FileDown, Upload, Box, Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/ui/PageHeader'
import CalcCard from '../../components/ui/CalcCard'
import InputField from '../../components/ui/InputField'
import ResultCard from '../../components/ui/ResultCard'
import ZakazkaModal from '../../components/ui/ZakazkaModal'
import Preview3DErrorBoundary from '../../components/ui/Preview3DErrorBoundary'
import { useRoofStore } from '../../store/roofStore'
import { krytinyOptions, getKrytina } from '../../data/krytiny'
import { formatNum } from '../../utils/calculations'
import { exportRoofPdf } from '../../utils/pdfExport'
import { parseRoofCsv } from '../../utils/csvImport'

const RoofPreview3D = lazy(() => import('../../components/ui/RoofPreview3D'))

const TYPY = [
  { id: 'sedlova',     skupinaCs: 'Základní' },
  { id: 'valbova',     skupinaCs: 'Základní' },
  { id: 'pultova',     skupinaCs: 'Základní' },
  { id: 'stanova',     skupinaCs: 'Základní' },
  { id: 'mansardova',  skupinaCs: 'Složené'  },
  { id: 'pulvalbova',  skupinaCs: 'Složené'  },
  { id: 'asymetricka', skupinaCs: 'Složené'  },
  { id: 'pilova',      skupinaCs: 'Složené'  },
]

// ─── Paleta barev pro výkresy ─────────────────────────────────────────────────
const DC = {
  roof:    '#c0391a',
  wall:    '#ede9e6',
  wStroke: '#a09080',
  krov:    '#8b5e3c',
  dim:     '#334155',
  ridge:   '#7c2d12',
  ground:  '#8a9ab0',
  bg:      '#f8fafc',
  grid:    '#e8edf2',
}

// Šipka pro kóty
const Arw = ({ x, y, dir }) => {
  const s = 5, f = DC.dim
  if (dir === 'l') return <polygon points={`${x},${y} ${x+s},${y-s/2} ${x+s},${y+s/2}`} fill={f} />
  if (dir === 'r') return <polygon points={`${x},${y} ${x-s},${y-s/2} ${x-s},${y+s/2}`} fill={f} />
  if (dir === 'u') return <polygon points={`${x},${y} ${x-s/2},${y+s} ${x+s/2},${y+s}`} fill={f} />
  if (dir === 'd') return <polygon points={`${x},${y} ${x-s/2},${y-s} ${x+s/2},${y-s}`} fill={f} />
  return null
}

// ─── ŘEZ A-A — příčný řez střechou ─────────────────────────────────────────
function RezSVG({ typ, sirka, sklon, presahOkap, vyskaZdi }) {
  const s   = Math.max(parseFloat(sirka) || 8, 2)
  const wH  = Math.max(parseFloat(vyskaZdi) || 3, 1)
  const po  = Math.max(parseFloat(presahOkap) || 0.6, 0)
  const deg = Math.max(5, Math.min(parseFloat(sklon) || 35, 75))
  const rad = deg * Math.PI / 180
  const h   = (s / 2) * Math.tan(rad)

  const W = 540, H = 260
  const ML = 70, MR = 50, MT = 28, MB = 52
  const totW = s + 2 * po
  const totH = wH + h
  const sc   = Math.min((W - ML - MR) / totW, (H - MT - MB) / (totH + 0.4))

  const gY   = H - MB
  const wlx  = ML + po * sc
  const wrx  = wlx + s * sc
  const eLx  = ML
  const eRx  = ML + totW * sc
  const wTopY = gY - wH * sc
  const ridY  = gY - (wH + h) * sc
  const cx    = (eLx + eRx) / 2

  // Pro mansardovou střechu: přidej koleno
  const isMans = typ === 'mansardova'
  const mansLFrac = 0.40, mansLSlope = Math.min(rad * 1.9, Math.PI * 0.43)
  const mansLHw = (s / 2) * mansLFrac
  const mansLH  = mansLHw * Math.tan(mansLSlope)
  const mansKneeY = gY - (wH + mansLH) * sc
  const mansKneeInL = wlx + mansLHw * sc
  const mansKneeInR = wrx - mansLHw * sc
  const mansTotH = wH + mansLH + (s / 2 - mansLHw) * Math.tan(rad)
  const mansRidY  = gY - mansTotH * sc

  const isPult = typ === 'pultova'
  const pultH  = s * Math.tan(rad)
  const isAsym  = typ === 'asymetricka'
  const isPila  = typ === 'pilova'

  const dim = DC.dim

  // ── Geometrie prvků krovů (shoduje se s buildSedlova / buildKrov) ─────────
  const tanRad  = Math.tan(rad)
  const cosRad  = Math.cos(rad)
  const kroAdj  = 0.09 * cosRad              // (KRO_H/2)*cos(sklon) = svislá složka ½ výšky
  const eaveY   = wTopY + po * tanRad * sc   // screen Y okrajové hrany krokve (nižší než wTopY)

  // Středová vaznice — vrchní strana na spodní straně krokve v místě vZ
  const vZ_L    = (s / 2) * 0.55
  const t_vaz   = Math.max(0, Math.min(1, (s/2 + po - vZ_L) / (s/2 + po)))
  const vKroY   = eaveY + t_vaz * (ridY - eaveY)   // osa krokve v místě vaznice (screen Y)
  const vazTopY = vKroY + kroAdj * sc               // spodní líc krokve = vrchní líc vaznice
  const vazBotY = vazTopY + 0.18 * sc               // STV_H = 180 mm
  const vazLx   = cx - vZ_L * sc - 0.06 * sc        // levá vaznice střed − STV_W/2
  const vazRx   = cx + vZ_L * sc - 0.06 * sc        // pravá vaznice střed − STV_W/2
  const vazW    = 0.12 * sc                          // STV_W = 120 mm

  // Kleštiny — centrum: spodní strana vaznice + KLE_H/2
  const kleCenterY = vazBotY + 0.08 * sc            // KLE_H/2 = 80 mm
  const kleTopY    = kleCenterY - 0.08 * sc
  const kleBotY    = kleCenterY + 0.08 * sc
  // X poloha krokve v místě kleštiny (v screen souřadnicích = Z v reálném prostoru)
  const t_kle_s = (eaveY - kleCenterY) / (eaveY - ridY + 0.001)
  const kleXL   = eLx  + t_kle_s * (cx   - eLx)    // levá krokev X v místě kleštiny
  const kleXR   = eRx  + t_kle_s * (cx   - eRx)    // pravá krokev X
  const dzSc    = (0.08 * sc) / Math.max(0.3, tanRad)  // šířka zářezu v screen px

  return (
    <svg width={W} height={H} style={{ display: 'block', background: DC.bg }}>

      {/* Mřížka */}
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`gv${i}`} x1={ML + i * (W - ML - MR) / 9} y1={MT}
          x2={ML + i * (W - ML - MR) / 9} y2={gY} stroke={DC.grid} strokeWidth={0.5} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`gh${i}`} x1={ML} y1={MT + i * (gY - MT) / 5}
          x2={W - MR} y2={MT + i * (gY - MT) / 5} stroke={DC.grid} strokeWidth={0.5} />
      ))}

      {/* Země */}
      <line x1={eLx - 18} y1={gY} x2={eRx + 18} y2={gY} stroke={DC.ground} strokeWidth={2} />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={`gh${i}`} x1={eLx - 15 + i * 20} y1={gY}
          x2={eLx - 25 + i * 20} y2={gY + 11} stroke={DC.ground} strokeWidth={1} />
      ))}

      {/* Zdi */}
      <rect x={wlx - 14} y={wTopY} width={14} height={wH * sc} fill="#d4d0cc" stroke={DC.wStroke} strokeWidth={1} />
      <rect x={wrx}      y={wTopY} width={14} height={wH * sc} fill="#d4d0cc" stroke={DC.wStroke} strokeWidth={1} />

      {/* Střecha — fill */}
      {!isMans && !isPult && !isPila && (
        <polygon
          points={
            isAsym
              ? `${eLx},${wTopY} ${cx + s * 0.10 * sc},${gY - (wH + h * 0.88) * sc} ${eRx},${wTopY}`
              : `${eLx},${wTopY} ${cx},${ridY} ${eRx},${wTopY}`
          }
          fill={DC.roof} fillOpacity={0.85} stroke={DC.ridge} strokeWidth={2}
        />
      )}
      {isPila && (() => {
        const N = Math.max(2, Math.round(d / Math.max(s * 0.8, 1.5)))
        const segW = (eRx - eLx) / N
        const segH = s * Math.tan(rad) * sc
        const pts = [`${eLx},${wTopY}`]
        for (let i = 0; i < N; i++) {
          pts.push(`${eLx + i * segW},${wTopY - segH}`)
          pts.push(`${eLx + (i + 1) * segW},${wTopY}`)
        }
        return <polygon points={pts.join(' ')} fill={DC.roof} fillOpacity={0.85} stroke={DC.ridge} strokeWidth={2} />
      })()}
      {isMans && (
        <polygon points={`${eLx},${wTopY} ${mansKneeInL},${mansKneeY} ${cx},${mansRidY} ${mansKneeInR},${mansKneeY} ${eRx},${wTopY}`}
          fill={DC.roof} fillOpacity={0.85} stroke={DC.ridge} strokeWidth={2} />
      )}
      {isPult && (
        <polygon points={`${eLx},${wTopY} ${eLx},${gY - (wH + pultH) * sc} ${eRx},${wTopY}`}
          fill={DC.roof} fillOpacity={0.85} stroke={DC.ridge} strokeWidth={2} />
      )}

      {/* Krokve — od okapu (klesají za zeď) až po hřeben */}
      {!isMans && !isPult && !isPila && (
        <>
          <line x1={eLx} y1={eaveY} x2={isAsym ? cx + s * 0.10 * sc : cx} y2={isAsym ? gY - (wH + h * 0.88) * sc : ridY} stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
          <line x1={eRx} y1={eaveY} x2={isAsym ? cx + s * 0.10 * sc : cx} y2={isAsym ? gY - (wH + h * 0.88) * sc : ridY} stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
          {/* Středové vaznice — vrchní strana na spodní straně krokve */}
          <rect x={vazLx} y={vazTopY} width={vazW} height={0.18*sc} fill="#5a2808" rx={1} />
          <rect x={vazRx} y={vazTopY} width={vazW} height={0.18*sc} fill="#5a2808" rx={1} />
          {/* Kleštiny — parallelogram se zaříznutými konci */}
          {kleXR > kleXL + 4 && (
            <polygon
              points={`${kleXL+dzSc},${kleTopY} ${kleXR-dzSc},${kleTopY} ${kleXR+dzSc},${kleBotY} ${kleXL-dzSc},${kleBotY}`}
              fill="#8B5E3C" stroke="#5a3010" strokeWidth={0.8}
            />
          )}
        </>
      )}
      {isPila && (() => {
        const N = Math.max(2, Math.round(d / Math.max(s * 0.8, 1.5)))
        const segW = (eRx - eLx) / N
        const segH = s * Math.tan(rad) * sc
        return Array.from({ length: N }, (_, i) => (
          <line key={i} x1={eLx + (i + 1) * segW} y1={wTopY} x2={eLx + i * segW} y2={wTopY - segH}
            stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
        ))
      })()}
      {isMans && (
        <>
          <line x1={wlx} y1={wTopY} x2={mansKneeInL} y2={mansKneeY} stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
          <line x1={wrx} y1={wTopY} x2={mansKneeInR} y2={mansKneeY} stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
          <line x1={mansKneeInL} y1={mansKneeY} x2={cx} y2={mansRidY} stroke={DC.krov} strokeWidth={4} strokeLinecap="round" />
          <line x1={mansKneeInR} y1={mansKneeY} x2={cx} y2={mansRidY} stroke={DC.krov} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {isPult && (
        <line x1={eLx} y1={gY - (wH + pultH) * sc} x2={eRx} y2={wTopY} stroke={DC.krov} strokeWidth={5} strokeLinecap="round" />
      )}

      {/* Pozednice */}
      <rect x={wlx - 6} y={wTopY - 9} width={26} height={9} fill="#6b4020" rx={1} />
      <rect x={wrx - 20} y={wTopY - 9} width={26} height={9} fill="#6b4020" rx={1} />

      {/* Hřebenová vaznice */}
      {!isPult && (
        <rect x={cx - 9} y={(isMans ? mansRidY : ridY) - 11} width={18} height={11} fill="#4a2808" rx={1} />
      )}

      {/* Úhel sklonu */}
      {(() => {
        const r = 34
        const ax2 = wlx + r * Math.cos(rad), ay2 = wTopY - r * Math.sin(rad)
        return (
          <g>
            <path d={`M ${wlx + r},${wTopY} A ${r},${r} 0 0,0 ${ax2},${ay2}`}
              fill="none" stroke={dim} strokeWidth={1.2} />
            <text x={wlx + r + 10} y={wTopY - 12} fontSize={11} fill={dim} fontWeight="700">{deg}°</text>
          </g>
        )
      })()}

      {/* Kóta: výška zdi vlevo */}
      {(() => {
        const x = eLx - 38
        return (
          <g>
            <line x1={eLx - 4} y1={wTopY} x2={x + 4} y2={wTopY} stroke={dim} strokeWidth={0.8} />
            <line x1={eLx - 4} y1={gY} x2={x + 4} y2={gY} stroke={dim} strokeWidth={0.8} />
            <line x1={x} y1={wTopY} x2={x} y2={gY} stroke={dim} strokeWidth={1} />
            <Arw x={x} y={wTopY} dir="d" /><Arw x={x} y={gY} dir="u" />
            <text x={x - 5} y={(wTopY + gY) / 2 + 4} textAnchor="middle" fontSize={10} fill={dim} fontWeight="600"
              transform={`rotate(-90,${x - 5},${(wTopY + gY) / 2 + 4})`}>{wH.toFixed(1)} m</text>
          </g>
        )
      })()}

      {/* Kóta: výška hřebene vpravo */}
      {!isPult && (() => {
        const x = eRx + 38
        const rY2 = isMans ? mansRidY : ridY
        return (
          <g>
            <line x1={eRx + 4} y1={rY2} x2={x - 4} y2={rY2} stroke={dim} strokeWidth={0.8} />
            <line x1={eRx + 4} y1={wTopY} x2={x - 4} y2={wTopY} stroke={dim} strokeWidth={0.8} />
            <line x1={x} y1={rY2} x2={x} y2={wTopY} stroke={dim} strokeWidth={1} />
            <Arw x={x} y={rY2} dir="d" /><Arw x={x} y={wTopY} dir="u" />
            <text x={x + 6} y={(rY2 + wTopY) / 2 + 4} textAnchor="middle" fontSize={10} fill={dim} fontWeight="600"
              transform={`rotate(-90,${x + 6},${(rY2 + wTopY) / 2 + 4})`}>{h.toFixed(1)} m</text>
          </g>
        )
      })()}

      {/* Kóta: šířka dole */}
      {(() => {
        const y = gY + 28
        return (
          <g>
            <line x1={eLx} y1={gY + 5} x2={eLx} y2={y + 4} stroke={dim} strokeWidth={0.8} />
            <line x1={eRx} y1={gY + 5} x2={eRx} y2={y + 4} stroke={dim} strokeWidth={0.8} />
            <line x1={eLx} y1={y} x2={eRx} y2={y} stroke={dim} strokeWidth={1} />
            <Arw x={eLx} y={y} dir="l" /><Arw x={eRx} y={y} dir="r" />
            <text x={cx} y={y + 14} textAnchor="middle" fontSize={10} fill={dim} fontWeight="600">
              {(s + 2 * po).toFixed(2)} m
            </text>
          </g>
        )
      })()}

      <text x={W / 2} y={MT - 8} textAnchor="middle" fontSize={11} fill={dim} fontWeight="700" letterSpacing={1.5}>
        ŘEZ A–A
      </text>
    </svg>
  )
}

// ─── POHLEDY — přední + boční pohled ─────────────────────────────────────────
function PohledySVG({ typ, sirka, delka, sklon, presahOkap, presahStit, vyskaZdi }) {
  const s   = Math.max(parseFloat(sirka) || 8, 2)
  const d   = Math.max(parseFloat(delka) || 12, 2)
  const wH  = Math.max(parseFloat(vyskaZdi) || 3, 1)
  const po  = Math.max(parseFloat(presahOkap) || 0.6, 0)
  const ps  = Math.max(parseFloat(presahStit) || 0.4, 0)
  const deg = Math.max(5, Math.min(parseFloat(sklon) || 35, 75))
  const rad = deg * Math.PI / 180
  const h   = (s / 2) * Math.tan(rad)

  const W = 540, H = 240
  const dim = DC.dim

  // ── Levý panel: pohled zepředu (štítem) ──────────────────────────────────
  const FML = 18, FMR = 14, FMT = 22, FMB = 38
  const fW = W / 2 - FML - FMR
  const fH = H - FMT - FMB
  const fw = s + 2 * po, fh = wH + h
  const fsc = Math.min(fW / fw, fH / fh)
  const fox = FML + (fW - fw * fsc) / 2
  const foy = H - FMB
  const fPO = po * fsc, fS = s * fsc, fWH = wH * fsc, fRH = h * fsc

  // Tvar střechy zepředu (štítový pohled)
  let frontRoof
  switch (typ) {
    case 'valbova': case 'stanova': {
      frontRoof = `${fox},${foy - fWH} ${fox + (fPO * 2 + fS) / 2},${foy - fWH - fRH} ${fox + fPO * 2 + fS},${foy - fWH}`
      break
    }
    case 'pultova':
      frontRoof = `${fox},${foy - fWH} ${fox},${foy - fWH - fRH} ${fox + fPO * 2 + fS},${foy - fWH}`
      break
    case 'mansardova': {
      const mLF = 0.4, mSH = fRH * 0.55, mKI = fPO + fS * mLF
      frontRoof = `${fox},${foy - fWH} ${fox + fPO},${foy - fWH - mSH} ${fox + mKI},${foy - fWH - mSH} ${fox + fPO * 2 + fS / 2},${foy - fWH - fRH} ${fox + fPO * 2 + fS - mKI},${foy - fWH - mSH} ${fox + fPO * 2 + fS - fPO},${foy - fWH - mSH} ${fox + fPO * 2 + fS},${foy - fWH}`
      break
    }
    default:
      frontRoof = `${fox},${foy - fWH} ${fox + fPO + fS / 2},${foy - fWH - fRH} ${fox + fPO * 2 + fS},${foy - fWH}`
  }

  // ── Pravý panel: pohled z boku (okapem) ──────────────────────────────────
  const SML = W / 2 + 14, SMR = 18, SMT = 22, SMB = 38
  const sW2 = W - SML - SMR
  const sH2 = H - SMT - SMB
  const sw = d + 2 * ps, sh = wH + h
  const ssc = Math.min(sW2 / sw, sH2 / sh)
  const sox = SML + (sW2 - sw * ssc) / 2
  const soy = H - SMB
  const sPS = ps * ssc, sD = d * ssc, sWH2 = wH * ssc, sRH = h * ssc

  let sideRoof
  switch (typ) {
    case 'pultova':
      sideRoof = `${sox},${soy - sWH2 - sRH} ${sox + sPS + sD + sPS},${soy - sWH2} ${sox},${soy - sWH2}`
      break
    case 'valbova': case 'stanova': {
      const rxSc = Math.max(0, (d / 2 - s / 2)) * ssc
      const cxS  = sox + sPS + sD / 2
      sideRoof = `${sox},${soy - sWH2} ${cxS - rxSc},${soy - sWH2 - sRH} ${cxS + rxSc},${soy - sWH2 - sRH} ${sox + sPS * 2 + sD},${soy - sWH2}`
      break
    }
    default:
      sideRoof = `${sox},${soy - sWH2} ${sox + sPS},${soy - sWH2 - sRH} ${sox + sPS + sD},${soy - sWH2 - sRH} ${sox + sPS * 2 + sD},${soy - sWH2}`
  }

  return (
    <svg width={W} height={H} style={{ display: 'block', background: DC.bg }}>

      {/* Oddělovač */}
      <line x1={W / 2} y1={10} x2={W / 2} y2={H - 15} stroke="#d1d9e0" strokeWidth={1.5} strokeDasharray="5 3" />

      {/* ── Přední pohled ── */}
      {/* Zeď */}
      <rect x={fox + fPO} y={foy - fWH} width={fS} height={fWH}
        fill={DC.wall} stroke={DC.wStroke} strokeWidth={1.5} />
      {/* Sokl */}
      <rect x={fox + fPO - 2} y={foy - fWH * 0.15} width={fS + 4} height={fWH * 0.15}
        fill="#c8c0b8" stroke={DC.wStroke} strokeWidth={1} />
      {/* Střecha */}
      <polygon points={frontRoof} fill={DC.roof} fillOpacity={0.88} stroke={DC.ridge} strokeWidth={1.8} />
      {/* Okap přesah — vodorovné čáry */}
      <line x1={fox} y1={foy - fWH} x2={fox + fPO} y2={foy - fWH} stroke={DC.ridge} strokeWidth={1.8} />
      <line x1={fox + fPO * 2 + fS - fPO} y1={foy - fWH} x2={fox + fPO * 2 + fS} y2={foy - fWH} stroke={DC.ridge} strokeWidth={1.8} />
      {/* Okna */}
      {[0.25, 0.72].map((xf, i) => (
        <g key={i}>
          <rect x={fox + fPO + fS * xf - fS * 0.09} y={foy - fWH * 0.72} width={fS * 0.18} height={fWH * 0.28}
            fill="#b8d4e8" fillOpacity={0.75} stroke={DC.wStroke} strokeWidth={1} />
          <line x1={fox + fPO + fS * xf} y1={foy - fWH * 0.72} x2={fox + fPO + fS * xf} y2={foy - fWH * 0.44}
            stroke={DC.wStroke} strokeWidth={0.8} />
          <line x1={fox + fPO + fS * xf - fS * 0.09} y1={foy - fWH * 0.58}
            x2={fox + fPO + fS * xf + fS * 0.09} y2={foy - fWH * 0.58} stroke={DC.wStroke} strokeWidth={0.8} />
        </g>
      ))}
      {/* Dveře */}
      <rect x={fox + fPO + fS / 2 - fS * 0.1} y={foy - fWH * 0.44} width={fS * 0.2} height={fWH * 0.44}
        fill="#6b4020" stroke={DC.wStroke} strokeWidth={1} rx={1} />
      {/* Terén */}
      <line x1={fox - 8} y1={foy} x2={fox + fPO * 2 + fS + 8} y2={foy} stroke={DC.ground} strokeWidth={2} />
      {/* Kóta šířka */}
      {(() => {
        const y = foy + 22
        const x1 = fox, x2 = fox + fPO * 2 + fS
        return (
          <g>
            <line x1={x1} y1={foy + 5} x2={x1} y2={y + 3} stroke={dim} strokeWidth={0.8} />
            <line x1={x2} y1={foy + 5} x2={x2} y2={y + 3} stroke={dim} strokeWidth={0.8} />
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={dim} strokeWidth={1} />
            <Arw x={x1} y={y} dir="l" /><Arw x={x2} y={y} dir="r" />
            <text x={(x1 + x2) / 2} y={y + 12} textAnchor="middle" fontSize={9} fill={dim} fontWeight="600">
              {(s + 2 * po).toFixed(2)} m
            </text>
          </g>
        )
      })()}
      <text x={fox + fPO + fS / 2} y={FMT - 6} textAnchor="middle" fontSize={10} fill={dim} fontWeight="700" letterSpacing={1}>
        POHLED ZEPŘEDU
      </text>

      {/* ── Boční pohled ── */}
      <rect x={sox + sPS} y={soy - sWH2} width={sD} height={sWH2}
        fill={DC.wall} stroke={DC.wStroke} strokeWidth={1.5} />
      {/* Sokl */}
      <rect x={sox + sPS - 2} y={soy - sWH2 * 0.15} width={sD + 4} height={sWH2 * 0.15}
        fill="#c8c0b8" stroke={DC.wStroke} strokeWidth={1} />
      <polygon points={sideRoof} fill={DC.roof} fillOpacity={0.88} stroke={DC.ridge} strokeWidth={1.8} />
      {/* Okna boční */}
      {[0.25, 0.6].map((xf, i) => (
        <rect key={i} x={sox + sPS + sD * xf - sD * 0.06} y={soy - sWH2 * 0.72}
          width={sD * 0.12} height={sWH2 * 0.28}
          fill="#b8d4e8" fillOpacity={0.75} stroke={DC.wStroke} strokeWidth={1} />
      ))}
      <line x1={sox - 8} y1={soy} x2={sox + sPS * 2 + sD + 8} y2={soy} stroke={DC.ground} strokeWidth={2} />
      {/* Kóta délka */}
      {(() => {
        const y = soy + 22
        const x1 = sox, x2 = sox + sPS * 2 + sD
        return (
          <g>
            <line x1={x1} y1={soy + 5} x2={x1} y2={y + 3} stroke={dim} strokeWidth={0.8} />
            <line x1={x2} y1={soy + 5} x2={x2} y2={y + 3} stroke={dim} strokeWidth={0.8} />
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={dim} strokeWidth={1} />
            <Arw x={x1} y={y} dir="l" /><Arw x={x2} y={y} dir="r" />
            <text x={(x1 + x2) / 2} y={y + 12} textAnchor="middle" fontSize={9} fill={dim} fontWeight="600">
              {(d + 2 * ps).toFixed(2)} m
            </text>
          </g>
        )
      })()}
      <text x={sox + sPS + sD / 2} y={SMT - 6} textAnchor="middle" fontSize={10} fill={dim} fontWeight="700" letterSpacing={1}>
        POHLED Z BOKU
      </text>
    </svg>
  )
}

// ─── DETAILY — vrstvy střechy ─────────────────────────────────────────────────
function DetailyTable({ krytina, sklon }) {
  const info = getKrytina(krytina)
  const sklonOk = !info?.minSklon || parseFloat(sklon) >= info.minSklon

  const layers = [
    { name: 'Krytina',                 desc: info?.label || krytina,         color: '#c0391a', th: '—'      },
    { name: 'Kontralaté',              desc: 'smrk, impregnováno',            color: '#8b5e3c', th: '25×50' },
    { name: 'Latě',                    desc: 'smrk, impregnováno',            color: '#7a4020', th: '40×60' },
    { name: 'Pojistná hydroizolace',   desc: 'PE / PP fólie',                 color: '#4a9fd4', th: '≥0,2 mm'},
    { name: 'Krokve',                  desc: 'konstrukční dřevo C24',         color: '#6b4020', th: '100×160'},
    { name: 'Tepelná izolace',         desc: 'minerální vata / EPS',          color: '#94a3b8', th: 'dle proj.'},
    { name: 'Parotěsná zábrana',       desc: 'fólie, sd ≥ 100 m',            color: '#64748b', th: '≥0,1 mm'},
    { name: 'Pohledová vrstva / SDK',  desc: 'sádrokarton / záklop',          color: '#475569', th: 'dle proj.'},
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5">
      {/* Vrstvy */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: DC.dim }}>
          Skladba střechy — odshora
        </p>
        <div className="flex flex-col">
          {layers.map((l, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 border-b last:border-0"
              style={{ borderColor: '#e8edf2' }}>
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
              <span className="text-xs font-medium flex-1" style={{ color: '#334155' }}>{l.name}</span>
              <span className="text-xs font-mono ml-auto" style={{ color: '#94a3b8' }}>{l.th}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Parametry krytiny */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: DC.dim }}>
          Parametry krytiny
        </p>
        {info ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg p-3" style={{ background: '#f1f5f9' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1e3a5f' }}>{info.label}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ['Kategorie', info.kategorie],
                  ['Min. sklon', `${info.minSklon}°`],
                  info.ks_m2 ? ['Spotřeba', `${info.ks_m2} ks/m²`] : null,
                  info.vaha  ? ['Hmotnost', `${info.vaha} kg/m²`]   : null,
                  info.rozted ? ['Rozteč latí', `${info.rozted.min}–${info.rozted.max} mm`] : null,
                ].filter(Boolean).map(([k, v], i) => (
                  <div key={i}>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{k}: </span>
                    <span className="text-xs font-semibold" style={{ color: '#334155' }}>{v}</span>
                  </div>
                ))}
              </div>
              {!sklonOk && (
                <div className="mt-2 text-xs font-medium px-2 py-1 rounded" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  ⚠ Sklon {sklon}° je nižší než minimální {info.minSklon}° pro tuto krytinu!
                </div>
              )}
            </div>
            {info.poznamka && (
              <div className="text-xs p-2.5 rounded-lg" style={{ background: '#f8f9fa', color: '#64748b' }}>
                ℹ {info.poznamka}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#94a3b8' }}>Vyberte krytinu pro zobrazení parametrů.</p>
        )}
      </div>
    </div>
  )
}

// ─── PŮDORYS SVG (pohled shora) ───────────────────────────────────────────────
const SVG_W = 560
const SVG_H = 320
const ML = 90, MT = 40, MR = 40, MB = 65

function PudorysSVG({ typ, sirka, delka, presahOkap, presahStit, roztecKrokvi }) {
  const s   = parseFloat(sirka)      || 8
  const d   = parseFloat(delka)      || 12
  const po  = parseFloat(presahOkap) || 0
  const ps  = parseFloat(presahStit) || 0
  const roz = parseFloat(roztecKrokvi) / 1000 || 0.9

  const totalW = s + 2 * po
  const totalL = d + 2 * ps

  const availW = SVG_W - ML - MR
  const availH = SVG_H - MT - MB
  const scale  = Math.min(availW / totalL, availH / totalW)

  const drawL = totalL * scale
  const drawW = totalW * scale
  const ox = ML + (availW - drawL) / 2
  const oy = MT + (availH - drawW) / 2

  const bx  = ox + ps * scale
  const by  = oy + po * scale
  const bx2 = bx + d * scale
  const by2 = by + s * scale
  const ry  = oy + (totalW / 2) * scale
  const cx  = ox + drawL / 2

  const nMezery = Math.max(1, Math.round(d / roz))
  const nKrokvi = nMezery + 1
  const skutRoz = d / nMezery
  const showAll = nKrokvi <= 60
  const krokveX = Array.from({ length: nKrokvi }, (_, i) => bx + i * skutRoz * scale)

  const dimColor = '#475569'
  const AS = 6
  const arw = (x, y, dir) => {
    if (dir === 'l') return `M${x},${y} l${AS},${-AS/2} l0,${AS}Z`
    if (dir === 'r') return `M${x},${y} l${-AS},${-AS/2} l0,${AS}Z`
    if (dir === 'u') return `M${x},${y} l${-AS/2},${AS} l${AS},0Z`
    if (dir === 'd') return `M${x},${y} l${-AS/2},${-AS} l${AS},0Z`
  }

  // Hřeben dle typu
  let rx1, rx2
  switch (typ) {
    case 'sedlova':     rx1 = bx;  rx2 = bx2; break
    case 'asymetricka': rx1 = bx;  rx2 = bx2; break
    case 'valbova':     rx1 = bx + (s / 2) * scale; rx2 = bx2 - (s / 2) * scale; break
    case 'pulvalbova':  rx1 = bx + (s / 4) * scale; rx2 = bx2 - (s / 4) * scale; break
    case 'stanova':     rx1 = cx; rx2 = cx; break
    case 'mansardova':  rx1 = bx; rx2 = bx2; break
    case 'pultova':     rx1 = null; rx2 = null; break
    case 'pilova':      rx1 = null; rx2 = null; break
    default:            rx1 = bx;  rx2 = bx2
  }

  const hasNarozi = ['valbova', 'stanova', 'pulvalbova'].includes(typ)
  const hasDiag   = ['sedlova', 'asymetricka', 'mansardova'].includes(typ)

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block', background: DC.bg }}>

      {/* Přesah střechy — červená plocha */}
      <rect x={ox} y={oy} width={drawL} height={drawW}
        fill={DC.roof} fillOpacity={0.82} stroke={DC.ridge} strokeWidth={2} rx={1} />

      {/* Obrys zdí — čárkovaně */}
      {(po > 0 || ps > 0) && (
        <rect x={bx} y={by} width={d * scale} height={s * scale}
          fill="#e8c0a8" fillOpacity={0.35} stroke="#c05020" strokeWidth={1.5} strokeDasharray="7 3" />
      )}

      {/* Pilová střecha — zuby */}
      {typ === 'pilova' && Array.from({ length: Math.max(2, Math.round(d / (s / 2))) }, (_, i) => {
        const segW = (d / Math.max(2, Math.round(d / (s / 2)))) * scale
        const x1 = bx + i * segW, x2 = x1 + segW
        return (
          <g key={i}>
            <line x1={x2} y1={by} x2={x1} y2={by2} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
            <line x1={x2} y1={by2} x2={x2} y2={by} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          </g>
        )
      })}

      {/* Mansardová — vnitřní linie */}
      {typ === 'mansardova' && (
        <rect x={bx + (s * 0.3) * scale} y={by + (s * 0.3) * scale}
          width={(d - s * 0.6) * scale} height={(s * 0.4) * scale}
          fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      )}

      {/* Krokve */}
      {showAll ? krokveX.map((x, i) => (
        <line key={i} x1={x} y1={oy} x2={x} y2={oy + drawW}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={i === 0 || i === nKrokvi - 1 ? 1.8 : 1} />
      )) : (
        <>
          {[0, 1, 2, Math.floor(nKrokvi/2)-1, Math.floor(nKrokvi/2), Math.floor(nKrokvi/2)+1, nKrokvi-3, nKrokvi-2, nKrokvi-1]
            .filter((v, i, a) => v >= 0 && v < nKrokvi && a.indexOf(v) === i)
            .map(i => (
              <line key={i} x1={bx + i * skutRoz * scale} y1={oy}
                x2={bx + i * skutRoz * scale} y2={oy + drawW}
                stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
            ))}
          <text x={cx} y={ry - 8} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.85)">
            … ({nKrokvi} krokví) …
          </text>
        </>
      )}

      {/* Hřeben */}
      {rx1 !== null && rx2 !== null && rx1 < rx2 && (
        <line x1={rx1} y1={ry} x2={rx2} y2={ry}
          stroke="rgba(255,255,255,0.90)" strokeWidth={3.5} strokeLinecap="round" />
      )}
      {typ === 'stanova' && (
        <circle cx={cx} cy={ry} r={5} fill="rgba(255,255,255,0.90)" />
      )}

      {/* Nárožní linie */}
      {hasNarozi && (
        <>
          <line x1={ox}       y1={oy}       x2={rx1} y2={ry} stroke="rgba(255,255,255,0.60)" strokeWidth={2} />
          <line x1={ox}       y1={oy+drawW} x2={rx1} y2={ry} stroke="rgba(255,255,255,0.60)" strokeWidth={2} />
          <line x1={ox+drawL} y1={oy}       x2={rx2} y2={ry} stroke="rgba(255,255,255,0.60)" strokeWidth={2} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2} y2={ry} stroke="rgba(255,255,255,0.60)" strokeWidth={2} />
        </>
      )}
      {hasDiag && (
        <>
          <line x1={ox} y1={oy}       x2={rx1 ?? cx} y2={ry} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
          <line x1={ox} y1={oy+drawW} x2={rx1 ?? cx} y2={ry} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
          <line x1={ox+drawL} y1={oy}       x2={rx2 ?? cx} y2={ry} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
          <line x1={ox+drawL} y1={oy+drawW} x2={rx2 ?? cx} y2={ry} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
        </>
      )}

      {/* Kóta — délka dole */}
      {(() => {
        const y = oy + drawW + 28
        return <g>
          <line x1={ox} y1={oy+drawW+6} x2={ox} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox+drawL} y1={oy+drawW+6} x2={ox+drawL} y2={y+4} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox} y1={y} x2={ox+drawL} y2={y} stroke={dimColor} strokeWidth={1} />
          <path d={arw(ox, y, 'r')} fill={dimColor} />
          <path d={arw(ox+drawL, y, 'l')} fill={dimColor} />
          <text x={cx} y={y+14} textAnchor="middle" fontSize={11} fill={dimColor} fontWeight="700">
            {(d+2*ps).toFixed(2)} m{ps>0 ? ` (bud. ${d} m)` : ''}
          </text>
        </g>
      })()}

      {/* Kóta — šířka vlevo */}
      {(() => {
        const x = ox - 30
        return <g>
          <line x1={ox-6} y1={oy} x2={x+4} y2={oy} stroke={dimColor} strokeWidth={0.8} />
          <line x1={ox-6} y1={oy+drawW} x2={x+4} y2={oy+drawW} stroke={dimColor} strokeWidth={0.8} />
          <line x1={x} y1={oy} x2={x} y2={oy+drawW} stroke={dimColor} strokeWidth={1} />
          <path d={arw(x, oy, 'd')} fill={dimColor} />
          <path d={arw(x, oy+drawW, 'u')} fill={dimColor} />
          <text x={x-6} y={oy+drawW/2} textAnchor="middle" fontSize={11} fill={dimColor} fontWeight="700"
            transform={`rotate(-90,${x-6},${oy+drawW/2})`}>
            {(s+2*po).toFixed(2)} m{po>0 ? ` (bud. ${s} m)` : ''}
          </text>
        </g>
      })()}

      {/* Kóta — rozteč krokví */}
      {showAll && nKrokvi >= 2 && (() => {
        const x1 = bx, x2 = bx + skutRoz * scale, y  = oy - 14
        return <g>
          <line x1={x1} y1={y} x2={x2} y2={y} stroke="#64748b" strokeWidth={1} />
          <path d={arw(x1, y, 'r')} fill="#64748b" />
          <path d={arw(x2, y, 'l')} fill="#64748b" />
          <text x={(x1+x2)/2} y={y-5} textAnchor="middle" fontSize={9} fill="#64748b">
            {Math.round(skutRoz*1000)} mm
          </text>
        </g>
      })()}
    </svg>
  )
}

// ─── Záložky výkresů ──────────────────────────────────────────────────────────
const DRAW_TABS = [
  { id: 'pudorys', label: 'PŮDORYS'  },
  { id: 'rez',     label: 'ŘEZ A-A'  },
  { id: 'pohledy', label: 'POHLEDY'  },
  { id: 'detaily', label: 'DETAILY'  },
]

// ─── Hlavní stránka ───────────────────────────────────────────────────────────
export default function Pudorys() {
  const { t } = useTranslation()
  const {
    typ, setTyp, sirka, setSirka, delka, setDelka,
    presahOkap, setPresahOkap, presahStit, setPresahStit,
    sklon, setSklon, vyskaZdi,
    roztecKrokvi, setRoztecKrokvi,
    krytina, setKrytina,
    getPlocha, getPocetKrokvi, getSkutecnaRozted,
  } = useRoofStore()

  const [showModal, setShowModal] = useState(false)
  const [view3d,    setView3d]    = useState(false)
  const [drawTab,   setDrawTab]   = useState('pudorys')
  const [csvError,  setCsvError]  = useState('')
  const isMounted = useRef(false)
  const lastShown = useRef(null)
  const csvRef    = useRef()

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    const key = JSON.stringify({ sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi })
    if (key === lastShown.current) return
    const t2 = setTimeout(() => { lastShown.current = key; setShowModal(true) }, 1500)
    return () => clearTimeout(t2)
  }, [sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi])

  const res = useMemo(() => {
    const s  = parseFloat(sirka)      || 0
    const d  = parseFloat(delka)      || 0
    const po = parseFloat(presahOkap) || 0
    const ps = parseFloat(presahStit) || 0
    const plocha   = getPlocha()
    const n        = getPocetKrokvi()
    const skutRoz  = getSkutecnaRozted()
    const plocha2D = (s + 2*po) * (d + 2*ps)
    const obvod    = 2 * ((s + 2*po) + (d + 2*ps))
    const varovani = roztecKrokvi < 600 || roztecKrokvi > 1200
    return { plocha: formatNum(plocha), plocha2D: formatNum(plocha2D), obvod: formatNum(obvod), n, skutRoz: Math.round(skutRoz), varovani }
  }, [sirka, delka, presahOkap, presahStit, roztecKrokvi])

  // Ridge height for status bar
  const ridgeH = useMemo(() => {
    const s = parseFloat(sirka) || 8
    const r = Math.max(5, Math.min(parseFloat(sklon) || 35, 75)) * Math.PI / 180
    return ((s / 2) * Math.tan(r)).toFixed(2)
  }, [sirka, sklon])

  const handleCsvImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = parseRoofCsv(ev.target.result)
        if (data.sirka)        setSirka(data.sirka)
        if (data.delka)        setDelka(data.delka)
        if (data.sklon)        setSklon(data.sklon)
        if (data.presahOkap)   setPresahOkap(data.presahOkap)
        if (data.presahStit)   setPresahStit(data.presahStit)
        if (data.roztecKrokvi) setRoztecKrokvi(data.roztecKrokvi)
        setCsvError('')
      } catch (err) { setCsvError('Chyba v CSV souboru: ' + err.message) }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportPdf = () =>
    exportRoofPdf({ typ, sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi, res })

  const skupiny = [...new Set(TYPY.map(t => t.skupinaCs))]

  return (
    <div>
      <PageHeader
        title={t('nav.pudorys')}
        description="Pohled na střechu shora — tvar, rozměry, přesahy a rozmístění krokví"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Levý panel — parametry ── */}
        <CalcCard title={t('roof.typLabel')}>
          <div className="flex flex-col gap-4">
            {skupiny.map(sk => (
              <div key={sk}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>{sk}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TYPY.filter(t => t.skupinaCs === sk).map(rt => (
                    <button key={rt.id} onClick={() => setTyp(rt.id)}
                      className="py-2 px-2 rounded-lg text-xs font-medium transition-colors border text-left"
                      style={typ === rt.id
                        ? { background: '#3b2008', color: '#fff', borderColor: '#3b2008' }
                        : { background: '#fffaf4', color: '#7a5030', borderColor: '#d4b896' }}>
                      {t(`roof.${rt.id}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <InputField label={t('roof.sirka')}      value={sirka}      onChange={setSirka}      unit="m"  min={2}   step={0.5} hint="Kratší rozměr" />
            <InputField label={t('roof.delka')}      value={delka}      onChange={setDelka}      unit="m"  min={2}   step={0.5} hint="Delší rozměr" />
            <InputField label={t('roof.presahOkap')} value={presahOkap} onChange={setPresahOkap} unit="m"  min={0}   step={0.1} />
            <InputField label={t('roof.presahStit')} value={presahStit} onChange={setPresahStit} unit="m"  min={0}   step={0.1} />
            <div>
              <InputField label={t('roof.roztecKrokvi')} value={roztecKrokvi} onChange={setRoztecKrokvi}
                unit="mm" min={400} max={1500} step={50} hint="Doporučeno 700–1000 mm (ČSN 73 1702)" />
              {res.varovani && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#c05020' }}>
                  ⚠ Rozteč mimo doporučený rozsah 600–1200 mm
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              <button onClick={() => csvRef.current.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1"
                style={{ borderColor: '#d4b896', color: '#7a5030', background: '#fffaf4' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5e0b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fffaf4'}>
                <Upload size={13} />{t('common.importCsv')}
              </button>
              <button onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1"
                style={{ borderColor: '#d4b896', color: '#7a5030', background: '#fffaf4' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5e0b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fffaf4'}>
                <FileDown size={13} />{t('common.exportPdf')}
              </button>
            </div>
            {csvError && <p className="text-xs" style={{ color: '#dc2626' }}>{csvError}</p>}
          </div>
        </CalcCard>

        {/* ── Pravý panel ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* 3D / 2D náhled */}
          <CalcCard title={
            <div className="flex items-center justify-between w-full">
              <span>{view3d ? '3D Náhled střechy' : 'Půdorys střechy'}</span>
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
                <button onClick={() => setView3d(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={!view3d ? { background: '#0f172a', color: '#fff' } : { background: '#f8fafc', color: '#64748b' }}>
                  <Map size={13} /> 2D
                </button>
                <button onClick={() => setView3d(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={view3d ? { background: '#f97316', color: '#fff' } : { background: '#f8fafc', color: '#64748b' }}>
                  <Box size={13} /> 3D
                </button>
              </div>
            </div>
          }>
            {view3d && (
              <div className="mb-3">
                <select value={krytina} onChange={e => setKrytina(e.target.value)}
                  className="select-field text-xs" style={{ maxWidth: 280 }}>
                  {krytinyOptions().map(({ kategorie, items }) => (
                    <optgroup key={kategorie} label={kategorie}>
                      {items.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
            {view3d ? (
              <Preview3DErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center rounded-xl" style={{ height: 420, background: '#f1f5f9' }}>
                    <div className="text-sm" style={{ color: '#94a3b8' }}>Načítám 3D náhled…</div>
                  </div>
                }>
                  <RoofPreview3D
                    typ={typ} sirka={sirka} delka={delka} sklon={sklon}
                    presahOkap={presahOkap} presahStit={presahStit} vyskaZdi={vyskaZdi}
                    krytina={krytina} roztecKrokvi={roztecKrokvi} />
                </Suspense>
              </Preview3DErrorBoundary>
            ) : (
              <div className="overflow-x-auto">
                <PudorysSVG typ={typ} sirka={sirka} delka={delka}
                  presahOkap={presahOkap} presahStit={presahStit} roztecKrokvi={roztecKrokvi} />
              </div>
            )}
          </CalcCard>

          {/* ── Technické výkresy se záložkami ── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#dde3ea', background: '#fff' }}>

            {/* Tab bar */}
            <div className="flex border-b" style={{ borderColor: '#dde3ea', background: '#f8fafc' }}>
              {DRAW_TABS.map(tab => (
                <button key={tab.id} onClick={() => setDrawTab(tab.id)}
                  className="px-4 py-2.5 text-xs font-bold tracking-wider transition-colors relative"
                  style={drawTab === tab.id
                    ? { color: '#c0391a', borderBottom: '2px solid #c0391a', background: '#fff', marginBottom: -1 }
                    : { color: '#64748b', borderBottom: '2px solid transparent' }}>
                  {tab.label}
                </button>
              ))}
              {/* Stavový řádek vpravo */}
              <div className="ml-auto flex items-center px-4 gap-3 text-xs font-mono" style={{ color: '#94a3b8' }}>
                <span>X: <b style={{ color: '#475569' }}>{parseFloat(delka).toFixed(2)}</b></span>
                <span>Y: <b style={{ color: '#475569' }}>{parseFloat(sirka).toFixed(2)}</b></span>
                <span>Z: <b style={{ color: '#475569' }}>{ridgeH}</b></span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span>Měřítko <b style={{ color: '#475569' }}>1:100</b></span>
              </div>
            </div>

            {/* Tab obsah */}
            <div className="overflow-x-auto">
              {drawTab === 'pudorys' && (
                <PudorysSVG typ={typ} sirka={sirka} delka={delka}
                  presahOkap={presahOkap} presahStit={presahStit} roztecKrokvi={roztecKrokvi} />
              )}
              {drawTab === 'rez' && (
                <RezSVG typ={typ} sirka={sirka} sklon={sklon}
                  presahOkap={presahOkap} vyskaZdi={vyskaZdi} />
              )}
              {drawTab === 'pohledy' && (
                <PohledySVG typ={typ} sirka={sirka} delka={delka} sklon={sklon}
                  presahOkap={presahOkap} presahStit={presahStit} vyskaZdi={vyskaZdi} />
              )}
              {drawTab === 'detaily' && (
                <DetailyTable krytina={krytina} sklon={sklon} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Výsledky ── */}
      <div className="mt-5">
        <CalcCard title="Výsledky a přehled krokví">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <ResultCard label={t('roof.plocha')}        value={res.plocha}    unit="m²" highlight />
            <ResultCard label={t('roof.plocha2D')}      value={res.plocha2D}  unit="m²" />
            <ResultCard label={t('roof.obvod')}         value={res.obvod}     unit="m"  />
            <ResultCard label={t('roof.pocetKrokvi')}   value={res.n}         unit="ks" highlight />
            <ResultCard label={t('roof.skutecnaRozted')} value={res.skutRoz}  unit="mm" />
          </div>
          <p className="mt-3 text-xs" style={{ color: '#a07850' }}>
            Parametry jsou sdíleny se všemi výpočetními sekcemi. Změna zde se projeví v{' '}
            <Link to="/strechy/pohled" className="underline">pohledu střechy</Link>,{' '}
            <Link to="/tesarstvi/krokve" className="underline">dimenzování krokví</Link>,{' '}
            <Link to="/geometrie/plocha" className="underline">ploše střechy</Link> a dalších.
          </p>
        </CalcCard>
      </div>

      {showModal && (
        <ZakazkaModal
          params={{ typ, sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi, vyskaZdi }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
