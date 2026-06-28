// ─── Skupiny horní navigace — routes přeskupené ze stávajícího Sidebar.jsx ────
export const navGroups = [
  {
    id: 'projekt', label: 'Projekt', items: [
      { label: 'Dashboard', path: '/' },
      { label: 'Půdorys střechy', path: '/strechy/pudorys' },
      { label: 'Pohled střechy', path: '/strechy/pohled' },
    ],
  },
  {
    id: 'tesar', label: 'Tesař', items: [
      { label: 'Průřez trámů', path: '/tesarstvi/prurez-tramu' },
      { label: 'Dimenzování krokví', path: '/tesarstvi/krokve' },
      { label: 'Střešní latě', path: '/tesarstvi/late' },
      { label: 'Dřevěná schodiště', path: '/tesarstvi/schody' },
      { label: 'Stropy a podlahy', path: '/tesarstvi/stropy' },
      { label: 'Krov & konstrukce', path: '/tesarstvi/krov-konstrukce' },
      { heading: 'Geometrie střech' },
      { label: 'Délka krokví', path: '/geometrie/delka-krokvi' },
      { label: 'Složité střechy', path: '/geometrie/slozite-strechy' },
      { label: 'Nárožní krokve', path: '/geometrie/narozni-krokve' },
      { label: 'Plocha střechy', path: '/geometrie/plocha' },
    ],
  },
  {
    id: 'klempir', label: 'Klempíř', items: [
      { label: 'Oplechování ploch', path: '/klempirsvi/oplechovani' },
      { label: 'Žlaby a svody', path: '/klempirsvi/zlaby' },
      { label: 'Spotřeba plechu', path: '/klempirsvi/spotrebaplech' },
      { label: 'Odvodnění střechy', path: '/pokryvacstvi/odvodneni' },
    ],
  },
  {
    id: 'pokryvac', label: 'Pokrývač', items: [
      { label: 'Spotřeba krytiny', path: '/pokryvacstvi/tasky' },
      { label: 'Střešní fólie', path: '/pokryvacstvi/folie' },
      { label: 'Rozteč latí', path: '/pokryvacstvi/rozted-lati' },
    ],
  },
  {
    id: 'vypocty', label: 'Výpočty', items: [
      { label: 'Plochy a objemy', path: '/obecne/plochy' },
      { label: 'Sklon střechy', path: '/obecne/sklon' },
      { label: 'Pythagorova věta', path: '/obecne/pythagoras' },
      { label: 'Převodník jednotek', path: '/obecne/jednotky' },
      { label: 'Zatížení sněhem', path: '/obecne/zatizeni-snehem' },
    ],
  },
  {
    id: 'knihovna', label: 'Knihovna', items: [
      { label: 'Sklad', path: '/sklad' },
    ],
  },
  {
    id: 'nastaveni', label: 'Nastavení', items: [
      { label: 'Zakázky', path: '/kalkulace/zakazka' },
      { label: 'Doklady & Faktury', path: '/kalkulace/faktura' },
      { label: 'Zákazníci', path: '/kalkulace/zakaznici' },
    ],
  },
]
