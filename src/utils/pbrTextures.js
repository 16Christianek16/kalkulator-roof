import * as THREE from 'three'

/**
 * PBR textury z Poly Haven (veřejné CDN, bez API klíče) — 2K JPG.
 * Každý materiál = diff (color) + nor_gl (normal) + rough (roughness) + ao.
 */
const BASE = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k'

const SOURCES = {
  roofTile: 'clay_roof_tiles',     // střešní taška (pálená, terakota)
  wall:     'plastered_wall_02',   // omítka zdí
  wood:     'wood_planks_dirt',    // dřevo — krov, bednění vikýře
  grass:    'aerial_grass_rock',   // tráva / terén
  concrete: 'concrete_wall_008',   // beton / sokl
}

function mapUrl(slug, suffix) {
  return `${BASE}/${slug}/${slug}_${suffix}_2k.jpg`
}

let _cache = null

/**
 * Načte všechny PBR sady přes THREE.TextureLoader napojený na LoadingManager.
 * Vrací Promise<{ roofTile, wall, wood, grass, concrete }>, kde každý záznam
 * je { map, normalMap, roughnessMap, aoMap, repeat(x,y) }.
 */
export function loadAllPBRTextures(manager, renderer) {
  if (_cache) return Promise.resolve(_cache)

  const loader = new THREE.TextureLoader(manager)
  const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() || 8

  const loadOne = (url, srgb = false) =>
    new Promise((resolve) => {
      loader.load(
        url,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping
          tex.anisotropy = maxAniso
          if (srgb) tex.colorSpace = THREE.SRGBColorSpace
          resolve(tex)
        },
        undefined,
        () => resolve(null) // při chybě sítě pokračuj bez textury (fallback na procedurální materiál)
      )
    })

  const entries = Object.entries(SOURCES)
  const all = entries.map(([, slug]) =>
    Promise.all([
      loadOne(mapUrl(slug, 'diff'), true),
      loadOne(mapUrl(slug, 'nor_gl')),
      loadOne(mapUrl(slug, 'rough')),
      loadOne(mapUrl(slug, 'ao')),
    ])
  )

  return Promise.all(all).then((results) => {
    const out = {}
    entries.forEach(([key], i) => {
      const [map, normalMap, roughnessMap, aoMap] = results[i]
      out[key] = { map, normalMap, roughnessMap, aoMap }
    })
    _cache = out
    return out
  })
}

/** aoMap (a light/normal map) potřebuje uv2 — pokud chybí, zkopíruje se z uv. */
export function ensureUV2(geo) {
  if (geo && !geo.attributes.uv2 && geo.attributes.uv) {
    geo.setAttribute('uv2', geo.attributes.uv)
  }
  return geo
}

/** Vytvoří MeshStandardMaterial z PBR sady s daným repeat a volitelným tint. */
export function makePBRMaterial(set, { repeatX = 1, repeatY = 1, color = '#ffffff', extra = {} } = {}) {
  if (!set || !set.map) return null

  const apply = (tex) => {
    if (!tex) return tex
    const t = tex.clone()
    t.needsUpdate = true
    t.repeat.set(repeatX, repeatY)
    return t
  }

  return new THREE.MeshStandardMaterial({
    map: apply(set.map),
    normalMap: apply(set.normalMap),
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: apply(set.roughnessMap),
    aoMap: apply(set.aoMap),
    aoMapIntensity: 1.4,
    envMapIntensity: 0.3,
    color: new THREE.Color(color),
    side: THREE.DoubleSide,
    ...extra,
  })
}
