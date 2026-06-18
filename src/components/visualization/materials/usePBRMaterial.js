import { useMemo } from 'react'
import * as THREE from 'three'
import { materialConfig } from './materialConfig'

/**
 * Vrací MeshStandardMaterial pro daný typ krytiny.
 * Pokusí se načíst PBR textury — pokud neexistují, použije čistou barvu.
 * TODO: Přidat useTexture z @react-three/drei až budou textury dostupné.
 */
export function usePBRMaterial(typKrytiny) {
  const cfg = materialConfig[typKrytiny] ?? materialConfig.taskaBetonova

  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.barva),
      roughness: cfg.roughness ?? 0.85,
      metalness: cfg.metalness ?? 0.02,
      side: THREE.FrontSide,
    })
    return mat
    // Po přidání textur nahradit výše za:
    // const loader = new THREE.TextureLoader()
    // mat.map = loader.load(cfg.colorMap, ...)
    // mat.normalMap = loader.load(cfg.normalMap, ...)
    // mat.roughnessMap = loader.load(cfg.roughnessMap, ...)
  }, [typKrytiny])
}

/** Materiál pro hřebenáče (tmavší varianta krytiny) */
export function useRidgeMaterial(typKrytiny) {
  const cfg = materialConfig[typKrytiny] ?? materialConfig.taskaBetonova
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.barva).multiplyScalar(0.7),
    roughness: (cfg.roughness ?? 0.85) * 1.05,
    metalness: cfg.metalness ?? 0.02,
  }), [typKrytiny])
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
export function useMetalMaterial(color = '#8a9ba8') {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.20,
    envMapIntensity: 1.0,
  }), [color])
}
