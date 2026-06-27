import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { materialConfig } from './materialConfig'

const _loader = new THREE.TextureLoader()
const _texCache = new Map()

/** Načte texturu s graceful fallbackem — při chybě (404, chybějící soubor) vrátí null. */
function loadTextureSafe(url) {
  if (!url) return Promise.resolve(null)
  if (_texCache.has(url)) return _texCache.get(url)
  const p = new Promise(resolve => {
    _loader.load(url, resolve, undefined, () => resolve(null))
  })
  _texCache.set(url, p)
  return p
}

/**
 * Vrací MeshStandardMaterial pro daný typ krytiny.
 * Materiál je okamžitě k dispozici s plnou barvou (cfg.barva) a doplní se
 * PBR mapami asynchronně, pokud textury v /public/textures/roof/ existují.
 * Pokud textury chybí (404), materiál zůstává jen barevný — žádná výjimka.
 */
export function usePBRMaterial(typKrytiny, wireframe = false) {
  const cfg = materialConfig[typKrytiny] ?? materialConfig.taskaBetonova

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.barva),
    roughness: cfg.roughness ?? 0.85,
    metalness: cfg.metalness ?? 0.02,
    side: THREE.FrontSide,
    wireframe,
  }), [cfg.barva, cfg.roughness, cfg.metalness, wireframe])

  useEffect(() => {
    let cancelled = false
    // TODO: přidat PBR textury do /public/textures/roof/ (ambientcg.com) —
    // dokud chybí, loadTextureSafe vrátí null a materiál zůstane jednobarevný.
    Promise.all([
      loadTextureSafe(cfg.colorMap),
      loadTextureSafe(cfg.normalMap),
      loadTextureSafe(cfg.roughnessMap),
      loadTextureSafe(cfg.aoMap),
    ]).then(([map, normalMap, roughnessMap, aoMap]) => {
      if (cancelled) return
      ;[map, normalMap, roughnessMap, aoMap].forEach(t => {
        if (!t) return
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(cfg.repeatX ?? 1, cfg.repeatY ?? 1)
      })
      if (map) { map.colorSpace = THREE.SRGBColorSpace; mat.map = map; mat.color.set('#ffffff') }
      if (normalMap)    mat.normalMap = normalMap
      if (roughnessMap) mat.roughnessMap = roughnessMap
      if (aoMap)        mat.aoMap = aoMap
      mat.needsUpdate = true
    })
    return () => { cancelled = true }
  }, [cfg, mat])

  return mat
}

/** Materiál pro hřebenáče (tmavší varianta krytiny) */
export function useRidgeMaterial(typKrytiny) {
  const cfg = materialConfig[typKrytiny] ?? materialConfig.taskaBetonova
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.barva).multiplyScalar(0.7),
    roughness: (cfg.roughness ?? 0.85) * 1.05,
    metalness: cfg.metalness ?? 0.02,
  }), [cfg.barva, cfg.roughness, cfg.metalness])
}

/** Materiál pro dřevěné prvky krovu */
export function useWoodMaterial(dark = false) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: dark ? '#5a3018' : '#C8A96E',
    roughness: 0.85,
    metalness: 0,
  }), [dark])
}

/** Materiál pro klempířské prvky (zinek/hliník) */
export function useMetalMaterial(color = '#8a9ba8', wireframe = false) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.20,
    envMapIntensity: 1.0,
    wireframe,
  }), [color, wireframe])
}
