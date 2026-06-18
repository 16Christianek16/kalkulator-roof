/**
 * Konfigurace materiálů pro každý typ krytiny.
 * Textury z /public/textures/roof/ — pokud neexistují, použije se barva.
 * PBR textury stáhněte z https://ambientcg.com a umístěte do /public/textures/roof/
 */
export const materialConfig = {
  taskaBetonova: {
    label: 'Betonová taška',
    colorMap:     '/textures/roof/beton_color.jpg',    // TODO: přidat PBR textury
    normalMap:    '/textures/roof/beton_normal.jpg',
    roughnessMap: '/textures/roof/beton_rough.jpg',
    aoMap:        '/textures/roof/beton_ao.jpg',
    repeatX: 4, repeatY: 8,
    barva: '#7a6558',
    roughness: 0.85,
    metalness: 0.02,
    // Fyzické rozměry jedné tašky [m]
    tileW: 0.25,   // šířka (podél hřebene)
    tileH: 0.40,   // výška (podél svahu)
    tileT: 0.025,  // tloušťka
    tileOverlap: 0.10,  // přesah řad
  },
  taskaPalenova: {
    label: 'Pálená taška (bobrovka)',
    colorMap:     '/textures/roof/palena_color.jpg',
    normalMap:    '/textures/roof/palena_normal.jpg',
    roughnessMap: '/textures/roof/palena_rough.jpg',
    aoMap:        '/textures/roof/palena_ao.jpg',
    repeatX: 5, repeatY: 10,
    barva: '#8B4513',
    roughness: 0.90,
    metalness: 0.01,
    tileW: 0.18, tileH: 0.38, tileT: 0.02, tileOverlap: 0.08,
  },
  plochyPlech: {
    label: 'Falcovaný plech',
    colorMap:     '/textures/roof/plech_color.jpg',
    normalMap:    '/textures/roof/plech_normal.jpg',
    roughnessMap: '/textures/roof/plech_rough.jpg',
    aoMap:        null,
    repeatX: 2, repeatY: 6,
    barva: '#607D8B',
    roughness: 0.25,
    metalness: 0.80,
    tileW: 0.60, tileH: 0.0, tileT: 0.005, tileOverlap: 0,  // panely přes celý svah
  },
  trapezovyPlech: {
    label: 'Trapézový plech',
    colorMap:     '/textures/roof/trapez_color.jpg',
    normalMap:    '/textures/roof/trapez_normal.jpg',
    roughnessMap: '/textures/roof/trapez_rough.jpg',
    aoMap:        null,
    repeatX: 3, repeatY: 8,
    barva: '#546E7A',
    roughness: 0.20,
    metalness: 0.85,
    tileW: 1.00, tileH: 0, tileT: 0.006, tileOverlap: 0,
  },
  sindel: {
    label: 'Dřevěný šindel',
    colorMap:     '/textures/roof/sindel_color.jpg',
    normalMap:    '/textures/roof/sindel_normal.jpg',
    roughnessMap: '/textures/roof/sindel_rough.jpg',
    aoMap:        '/textures/roof/sindel_ao.jpg',
    repeatX: 6, repeatY: 12,
    barva: '#795548',
    roughness: 0.92,
    metalness: 0,
    tileW: 0.12, tileH: 0.30, tileT: 0.015, tileOverlap: 0.10,
  },
}

export const krytinyOptions = Object.entries(materialConfig).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}))
