/**
 * Výpočet geometrie sedlové střechy.
 * Souřadnicový systém:
 *  X = podél hřebene (délka budovy)
 *  Z = kolmě na hřeben (šířka budovy)
 *  Y = svislá osa
 * Budova centrovaná na [0, 0, 0], Y=0 je terén.
 */
export function calculateRoofGeometry(params) {
  const {
    rozpeti       = 8,     // světlá šířka budovy [m]
    delka         = 12,    // délka budovy [m]
    sklon         = 35,    // sklon střechy [°]
    previslost    = 0.6,   // okapní přesah [m]
    vzdalenostKrokvi = 0.9,// osová vzdálenost krokví [m]
    wallHeight    = 2.7,   // výška zdiva od terénu [m]
    presahStit    = 0.4,   // štítový přesah [m]
    dimKrokev     = [0.08, 0.16],   // [šířka, výška] průřezu krokve [m]
    dimVaznice    = [0.16, 0.20],   // [šířka, výška] vaznice [m]
    dimPozednice  = [0.14, 0.16],   // [šířka, výška] pozednice [m]
  } = params

  const uhel_rad   = (Math.max(5, Math.min(75, sklon)) * Math.PI) / 180
  const sirkaSvahu = rozpeti / 2 + previslost          // vodorovná délka svahu vč. přesahu
  const hrebenVyska= (rozpeti / 2) * Math.tan(uhel_rad)// výška hřebene nad pozednicí
  const delkaKrokve= sirkaSvahu / Math.cos(uhel_rad)   // skutečná délka krokve

  // Krokve — osová vzdálenost
  const pocetMezery  = Math.max(1, Math.round(delka / vzdalenostKrokvi))
  const pocetKrokvi  = pocetMezery + 1
  const skutecnaRozted = delka / pocetMezery

  const poziceKrokvi = Array.from({ length: pocetKrokvi }, (_, i) =>
    -delka / 2 + i * skutecnaRozted
  )

  // Kleštiny — ve výšce 60 % krokve od okapu
  const klestinyFrac    = 0.60
  const klestinyY       = wallHeight + klestinyFrac * hrebenVyska
  const klestinyZ       = sirkaSvahu * (1 - klestinyFrac)  // vzdálenost od hřebene
  const klestinyDelka   = klestinyZ * 2                    // spojují obě strany

  // Středová vaznice — ve výšce 55 % krokve
  const vazniceFrac = 0.55
  const vaznicePosY = wallHeight + vazniceFrac * hrebenVyska
  const vaznicePosZ = sirkaSvahu * (1 - vazniceFrac)

  return {
    uhel_rad,
    hrebenVyska,
    sirkaSvahu,
    delkaKrokve,
    pocetKrokvi,
    poziceKrokvi,
    skutecnaRozted,
    wallHeight,
    delka,
    rozpeti,
    previslost,
    presahStit,
    dimKrokev,
    dimVaznice,
    dimPozednice,
    // Pozice hřebene
    hrebenY: wallHeight + hrebenVyska,
    // Kleštiny
    klestinyFrac, klestinyY, klestinyZ, klestinyDelka,
    // Středová vaznice
    vaznicePosY, vaznicePosZ,
    // Okapní hrana (pro žlaby)
    okapY: wallHeight,
    okapZ: sirkaSvahu,
    hrebenPozice: [0, wallHeight + hrebenVyska, 0],
    sirkaSterchy: delkaKrokve,
  }
}
