import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const ROOF_LABELS = {
  sedlova: 'Sedlová', valbova: 'Valbová', pultova: 'Pultová',
  stanova: 'Stanová', mansardova: 'Mansardová', pulvalbova: 'Půlvalbová',
  asymetricka: 'Asymetrická', pilova: 'Pilová',
}

export function exportRoofPdf({ typ, sirka, delka, sklon, presahOkap, presahStit, roztecKrokvi, res }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('cs-CZ')

  // Hlavička
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CalkulatorRoof', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Kalkulace střechy', 14, 20)
  doc.text(`Datum: ${now}`, 196, 20, { align: 'right' })

  // Typ střechy
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`Typ střechy: ${ROOF_LABELS[typ] || typ}`, 14, 42)

  // Vstupní parametry
  autoTable(doc, {
    startY: 48,
    head: [['Parametr', 'Hodnota', 'Jednotka']],
    body: [
      ['Šířka budovy',    sirka || '—',        'm'],
      ['Délka budovy',    delka || '—',        'm'],
      ['Sklon střechy',   sklon || '—',        '°'],
      ['Přesah okapní',   presahOkap || '0',   'm'],
      ['Přesah štítový',  presahStit || '0',   'm'],
      ['Rozteč krokví',   roztecKrokvi || '—', 'mm'],
    ],
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  // Výsledky
  const y2 = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Výsledky výpočtu', 14, y2)

  autoTable(doc, {
    startY: y2 + 4,
    head: [['Výsledek', 'Hodnota', 'Jednotka']],
    body: [
      ['Rozvinutá plocha střechy', res.plocha,   'm²'],
      ['Půdorysná plocha střechy', res.plocha2D, 'm²'],
      ['Obvod střechy',            res.obvod,    'm'],
      ['Počet krokví',             res.n,        'ks'],
      ['Skutečná rozteč krokví',   res.skutRoz,  'mm'],
    ],
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { fontStyle: 'bold', textColor: [249, 115, 22] } },
    margin: { left: 14, right: 14 },
  })

  // Patička
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.text('Generováno aplikací CalkulatorRoof', 14, 287)
  doc.text(now, 196, 287, { align: 'right' })

  doc.save(`kalkulace-strechy-${typ}-${now.replace(/\./g, '-')}.pdf`)
}

export function exportKrovPdf({ sirka, delka, sklon, presahOkap, roztecKrokvi, typKrovu, drevina, trida, cenaReziva, res }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('cs-CZ')

  // Hlavička
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CalkulatorRoof', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Krov & konstrukce střechy — Výkaz výměr', 14, 20)
  doc.text(`Datum: ${now}`, 196, 20, { align: 'right' })

  // Název
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`Typ krovu: ${typKrovu}`, 14, 42)

  // Vstupní parametry
  autoTable(doc, {
    startY: 48,
    head: [['Parametr', 'Hodnota', 'Jednotka']],
    body: [
      ['Šířka domu',      sirka || '—',      'm'],
      ['Délka domu',      delka || '—',      'm'],
      ['Sklon střechy',   sklon || '—',      '°'],
      ['Přesah okapnice', presahOkap || '—', 'm'],
      ['Rozteč krokví',   roztecKrokvi || '—', 'mm'],
      ['Dřevina',         drevina,            '—'],
      ['Pevnostní třída', trida,              '—'],
      ['Cena řeziva',     cenaReziva,        'Kč/m³'],
    ],
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  // Výkaz výměr
  const y2 = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Výkaz výměr — přehled prvků', 14, y2)

  autoTable(doc, {
    startY: y2 + 4,
    head: [['Prvek', 'Průřez', 'Délka (m)', 'Počet (ks)', 'Objem (m³)', 'Cena (Kč)']],
    body: res.prvky.map(p => [
      p.prvek,
      p.prurez,
      p.delka.toFixed ? p.delka.toFixed(2) : p.delka,
      p.pocet,
      p.m3.toFixed(3),
      Math.round(p.kc).toLocaleString('cs-CZ'),
    ]),
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 5: { fontStyle: 'bold', textColor: [249, 115, 22] } },
    margin: { left: 14, right: 14 },
  })

  // Cenový souhrn
  const y3 = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Cenový souhrn', 14, y3)

  autoTable(doc, {
    startY: y3 + 4,
    head: [['Položka', 'Hodnota']],
    body: [
      ['Celkem řezivo (+ 12 % odpad)',   res.volTotal],
      ['Cena řeziva',                     res.cenaRez],
      ['Spojovací materiál (~ 8 %)',      res.cenaSpoj],
      ['CELKEM bez DPH',                  res.bezDPH],
      ['CELKEM s DPH 21 %',               res.sDPH],
    ],
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // Patička
  const yPat = Math.max(doc.lastAutoTable.finalY + 8, 270)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.text('Výpočet je orientační dle ČSN 73 1702. Nosné konstrukce vždy ověřte se statikem.', 14, yPat)
  doc.text('Generováno aplikací CalkulatorRoof', 14, yPat + 5)
  doc.text(now, 196, yPat + 5, { align: 'right' })

  doc.save(`krov-kalkulace-${now.replace(/\./g, '-')}.pdf`)
}

export function exportZakazkaPdf(zakazka) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('cs-CZ')

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CalkulatorRoof', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Zakázka: ${zakazka.name}`, 14, 20)
  doc.text(`Datum: ${now}`, 196, 20, { align: 'right' })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(zakazka.name, 14, 42)
  if (zakazka.customer) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Zákazník: ${zakazka.customer}`, 14, 50)
  }

  const rows = []
  if (zakazka.krytina)   rows.push(['Typ krytiny',     zakazka.krytina,       ''])
  if (zakazka.plocha)    rows.push(['Plocha střechy',   zakazka.plocha,       'm²'])
  if (zakazka.pocetKrokvi) rows.push(['Počet krokví',  zakazka.pocetKrokvi,  'ks'])
  if (zakazka.delkaKrokvi) rows.push(['Délka krokve',  zakazka.delkaKrokvi,  'm'])
  if (zakazka.pocetLati)   rows.push(['Počet latí',    zakazka.pocetLati,    'ks'])
  if (zakazka.pocetTasek)  rows.push(['Počet tašek',   zakazka.pocetTasek,   'ks'])

  autoTable(doc, {
    startY: 56,
    head: [['Položka', 'Hodnota', 'Jednotka']],
    body: rows,
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('Generováno aplikací CalkulatorRoof', 14, 287)
  doc.text(now, 196, 287, { align: 'right' })

  doc.save(`zakazka-${zakazka.name.replace(/\s+/g, '-')}.pdf`)
}
