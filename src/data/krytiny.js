export const krytinyDB = [
  // Pálené tašky
  { value: 'bobrovka', label: 'Bobrovka (330×155 mm)', kategorie: 'Pálené tašky', ks_m2: 22, rozted: { min: 100, max: 180 }, minSklon: 22, vaha: 65,
    pokládky: [
      { value: 'korunove',   label: 'Korunové (dvojité)',  ks_m2: 22, rozted: { min: 100, max: 140 } },
      { value: 'jednoduche', label: 'Jednoduché',          ks_m2: 17, rozted: { min: 140, max: 180 } },
    ],
  },
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

  // Plechové krytiny SATJAM (ocelové)
  { value: 'satjam_roof',          label: 'SATJAM Roof Classic',       kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 10, vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-roof-fe-119.jpg',          url: 'https://www.satjam.cz/satjam-roof' },
  { value: 'satjam_grande',        label: 'SATJAM Grande Plus',        kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 10, vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-grande-fe-121.jpg',        url: 'https://www.satjam.cz/satjam-grande' },
  { value: 'satjam_trend',         label: 'SATJAM Trend Wave',         kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 10, vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-trend-fe-123.jpg',         url: 'https://www.satjam.cz/satjam-trend' },
  { value: 'satjam_rapid_deluxe',  label: 'SATJAM Rapid DeLuxe',      kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 8,  vaha: 4.3, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-rapid-deluxe-fe-258.png',   url: 'https://www.satjam.cz/satjam-rapid-deluxe' },
  { value: 'satjam_profifalc',     label: 'SATJAM ProfiFalc',         kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 3,  vaha: 4.5, poznamka: 'Falcovaný panel — výpočet v m²', image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestn_k-obr-falc-fe-311.jpg',          url: 'https://www.satjam.cz/falcovana-stresni-krytina' },
  { value: 'satjam_taurus_maxx',   label: 'SATJAM Taurus Maxx',       kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 10, vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-taurus-maxx-fe-281.png',         url: 'https://www.satjam.cz/satjam-taurus-maxx' },
  { value: 'satjam_taurus_modul',  label: 'SATJAM Taurus Modul',      kategorie: 'Plechové krytiny SATJAM', ks_m2: 1.24, rozted: null, minSklon: 15, vaha: 4.7,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-taurus-premium-fe-130.jpg',  url: 'https://www.satjam.cz/satjam-taurus-premium' },
  { value: 'satjam_rapid_trend',   label: 'SATJAM Rapid Trend',       kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 8,  vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-rapid-fe-125.jpg',          url: 'https://www.satjam.cz/satjam-rapid' },
  { value: 'satjam_tira_modul',    label: 'SATJAM Tira Modul (2026)', kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 20, vaha: 4.7, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-tira-fe-320.jpg',            url: 'https://www.satjam.cz/satjam-tira-modul' },
  { value: 'satjam_tp26',          label: 'SATJAM TP26 Express',      kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 30, vaha: 4.3, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestn_k-tp26-express-fe-297.png',        url: 'https://www.satjam.cz/satjam-tp26-express' },
  { value: 'satjam_york_modul',    label: 'SATJAM York Modul',        kategorie: 'Plechové krytiny SATJAM', ks_m2: 1.29, rozted: null, minSklon: 20, vaha: 4.7,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-york-fe-263.jpg',                url: 'https://www.satjam.cz/satjam-york-modul' },
  { value: 'satjam_reno_modul',    label: 'SATJAM Reno Modul',        kategorie: 'Plechové krytiny SATJAM', ks_m2: 1.29, rozted: null, minSklon: 15, vaha: 4.7,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-reno-premium-fe-128.jpg',    url: 'https://www.satjam.cz/satjam-reno-premium' },
  { value: 'satjam_rombo_metalic', label: 'SATJAM Rombo Metalic',     kategorie: 'Plechové krytiny SATJAM', ks_m2: 8.33, rozted: null, minSklon: 22, vaha: 5.0,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-rombo-metalic-fe-288.png',        url: 'https://www.satjam.cz/satjam-rombo-metalic' },
  { value: 'satjam_rombo_premium', label: 'SATJAM Rombo Premium',     kategorie: 'Plechové krytiny SATJAM', ks_m2: 3.23, rozted: null, minSklon: 22, vaha: 4.5,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-rombo-premium-fe-137.jpg',   url: 'https://www.satjam.cz/satjam-rombo-premium' },
  { value: 'satjam_flat_plus',     label: 'SATJAM Flat Plus',         kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 25, vaha: 5.0, poznamka: 'Panel — výpočet v m²',           image: 'https://www.satjam.cz/doc/stresni_krytiny_img/flat-perovka-225.png',                                  url: 'https://www.satjam.cz/satjam-flat-plus' },
  { value: 'satjam_sindel',        label: 'SATJAM Šindel',            kategorie: 'Plechové krytiny SATJAM', ks_m2: 2.22, rozted: null, minSklon: 25, vaha: 5.0,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-sindel-fe-132.jpg',           url: 'https://www.satjam.cz/satjam-sindel' },
  { value: 'satjam_arad_modul',    label: 'SATJAM Arad Modul',        kategorie: 'Plechové krytiny SATJAM', ks_m2: 1.32, rozted: null, minSklon: 15, vaha: 4.7,                                               image: 'https://www.satjam.cz/doc/stresni_krytiny_img/sajtam-web-rozcestnik-obr-arad-modul-fe-133.jpg',       url: 'https://www.satjam.cz/satjam-arad-modul' },
  { value: 'satjam_trapez',        label: 'SATJAM Trapéz',            kategorie: 'Plechové krytiny SATJAM', ks_m2: null, rozted: null, minSklon: 3,  vaha: 6.0, poznamka: 'Trapézový panel — výpočet v m²', image: 'https://www.satjam.cz/doc/stresni_krytiny_img/trap-01-222.jpg',                                       url: 'https://www.satjam.cz/satjam-trapez' },

  // Ostatní
  { value: 'asfaltovy_sindel', label: 'Asfaltový šindel (IKO, Tegola…)', kategorie: 'Ostatní', ks_m2: 7,    rozted: { min: 140, max: 170 }, minSklon: 14, vaha: 14 },
  { value: 'vlaknocement', label: 'Vláknocementová taška (Cembrit)', kategorie: 'Ostatní', ks_m2: 22, rozted: { min: 90, max: 150 }, minSklon: 22, vaha: 18,
    pokládky: [
      { value: 'dvojite',    label: 'Dvojité přesahové',  ks_m2: 22, rozted: { min: 90,  max: 120 } },
      { value: 'jednoduche', label: 'Jednoduché',         ks_m2: 18, rozted: { min: 120, max: 150 } },
    ],
  },
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
