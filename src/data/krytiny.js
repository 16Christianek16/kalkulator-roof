export const krytinyDB = [
  // Pálené tašky
  { value: 'bobrovka',         label: 'Bobrovka (330×155 mm)',           kategorie: 'Pálené tašky',   ks_m2: 22,   rozted: { min: 100, max: 180 }, minSklon: 22, vaha: 65  },
  { value: 'palena_drsnata',   label: 'Pálená drsnata (420×275 mm)',     kategorie: 'Pálené tašky',   ks_m2: 9,    rozted: { min: 300, max: 380 }, minSklon: 22, vaha: 42  },
  { value: 'palena_romana',    label: 'Pálená románská taška',           kategorie: 'Pálené tašky',   ks_m2: 10,   rozted: { min: 290, max: 360 }, minSklon: 22, vaha: 44  },
  { value: 'palena_francouzska', label: 'Francouzská taška (480×290 mm)', kategorie: 'Pálené tašky', ks_m2: 8,    rozted: { min: 310, max: 390 }, minSklon: 17, vaha: 48  },
  { value: 'tondach_figaro',   label: 'Tondach Figaro (330×500 mm)',     kategorie: 'Pálené tašky',   ks_m2: 7,    rozted: { min: 380, max: 440 }, minSklon: 17, vaha: 55  },
  { value: 'keramicka',        label: 'Keramická taška (430×260 mm)',    kategorie: 'Pálené tašky',   ks_m2: 9,    rozted: { min: 330, max: 380 }, minSklon: 22, vaha: 40  },
  { value: 'palena_stredomorska', label: 'Středomořská (římská) taška',  kategorie: 'Pálené tašky',  ks_m2: 15,   rozted: { min: 200, max: 280 }, minSklon: 25, vaha: 50  },

  // Betonové tašky
  { value: 'betonova',         label: 'Betonová taška (420×330 mm)',     kategorie: 'Betonové tašky', ks_m2: 9,    rozted: { min: 310, max: 370 }, minSklon: 17, vaha: 45  },
  { value: 'bramac_max',       label: 'Bramac Max (420×330 mm)',         kategorie: 'Betonové tašky', ks_m2: 8,    rozted: { min: 310, max: 370 }, minSklon: 17, vaha: 47  },
  { value: 'betonova_mala',    label: 'Malá betonová taška (330×420 mm)', kategorie: 'Betonové tašky', ks_m2: 13,  rozted: { min: 270, max: 330 }, minSklon: 22, vaha: 43  },
  { value: 'betonova_plochá',  label: 'Betonová plochá taška',          kategorie: 'Betonové tašky', ks_m2: 16,   rozted: { min: 200, max: 260 }, minSklon: 25, vaha: 50  },

  // Přírodní materiály
  { value: 'bridlice',         label: 'Přírodní břidlice (400×200 mm)', kategorie: 'Přírodní materiály', ks_m2: 25, rozted: { min: 80, max: 140 }, minSklon: 22, vaha: 30 },
  { value: 'sindel_dreveny',   label: 'Dřevěný šindel (600×150 mm)',    kategorie: 'Přírodní materiály', ks_m2: 30, rozted: { min: 120, max: 180 }, minSklon: 14, vaha: 12 },
  { value: 'sindel_stepy',     label: 'Dřevěné štěpy (riven shingles)', kategorie: 'Přírodní materiály', ks_m2: 40, rozted: { min: 80, max: 130 },  minSklon: 18, vaha: 10 },
  { value: 'rakos',            label: 'Rákos (thatching)',               kategorie: 'Přírodní materiály', ks_m2: null, rozted: null, minSklon: 45, vaha: 35, poznamka: 'Plošná krytina — pokládá se ručně v páscích' },

  // Kovové krytiny
  { value: 'falcovany_plech',  label: 'Falcovaný plech (ocelový/hliník)',  kategorie: 'Kovové krytiny', ks_m2: null, rozted: null, minSklon: 3,  vaha: 5,  poznamka: 'Plošná krytina — výpočet v m²' },
  { value: 'trapezovy_plech',  label: 'Trapézový plech',                   kategorie: 'Kovové krytiny', ks_m2: null, rozted: null, minSklon: 3,  vaha: 6,  poznamka: 'Plošná krytina — výpočet v m²' },
  { value: 'plechova_taska',   label: 'Plechová taška (Lindab, Ruukki…)', kategorie: 'Kovové krytiny', ks_m2: 5.5,  rozted: { min: 350, max: 420 }, minSklon: 14, vaha: 6 },
  { value: 'vlnity_plech',     label: 'Vlnitý plech (ocel/hliník)',        kategorie: 'Kovové krytiny', ks_m2: null, rozted: null, minSklon: 5,  vaha: 5,  poznamka: 'Plošná krytina — výpočet v m²' },
  { value: 'med',              label: 'Měděný plech (falcovaný)',          kategorie: 'Kovové krytiny', ks_m2: null, rozted: null, minSklon: 3,  vaha: 4,  poznamka: 'Plošná krytina — výpočet v m²' },
  { value: 'titanzinek',       label: 'Titanzinkový plech (falcovaný)',    kategorie: 'Kovové krytiny', ks_m2: null, rozted: null, minSklon: 3,  vaha: 5,  poznamka: 'Plošná krytina — výpočet v m²' },

  // Ostatní
  { value: 'asfaltovy_sindel', label: 'Asfaltový šindel (IKO, Tegola…)', kategorie: 'Ostatní', ks_m2: 7,    rozted: { min: 140, max: 170 }, minSklon: 14, vaha: 14 },
  { value: 'vlaknocement',     label: 'Vláknocementová taška (Cembrit)',  kategorie: 'Ostatní', ks_m2: 22,   rozted: { min: 90,  max: 150 }, minSklon: 22, vaha: 18 },
  { value: 'onduline',         label: 'Onduline / vlnitá lepenka',       kategorie: 'Ostatní', ks_m2: null, rozted: null, minSklon: 10, vaha: 6, poznamka: 'Plošná krytina — výpočet v m²' },
  { value: 'asfaltovy_pas',    label: 'Asfaltový pás (modifikovaný)',    kategorie: 'Ostatní', ks_m2: null, rozted: null, minSklon: 0,  vaha: 5, poznamka: 'Plošná krytina — výpočet v m² (ploché střechy)' },
  { value: 'epdm_folie',       label: 'EPDM fólie',                      kategorie: 'Ostatní', ks_m2: null, rozted: null, minSklon: 0,  vaha: 1, poznamka: 'Plošná krytina — výpočet v m² (ploché střechy)' },
  { value: 'polykarbonát',     label: 'Polykarbonát (vlnitý / komůrkový)', kategorie: 'Ostatní', ks_m2: null, rozted: null, minSklon: 5, vaha: 2, poznamka: 'Plošná krytina — výpočet v m²' },
]

export const krytinyKategorie = [...new Set(krytinyDB.map(k => k.kategorie))]

export function getKrytina(value) {
  return krytinyDB.find(k => k.value === value)
}

export function krytinyOptions() {
  return krytinyKategorie.map(kat => ({
    kategorie: kat,
    items: krytinyDB.filter(k => k.kategorie === kat),
  }))
}
