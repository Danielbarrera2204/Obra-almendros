// ─────────────────────────────────────────────────────────────
//  Exportar a Excel y PDF (se cargan solo cuando se usan)
//  Reciben un "modelo" ya armado por app.js:
//  { obra, fecha: Date, filas: [{ bloque, c:[pend,proc,term], pct, estado, aptos:[{apto,s,n,t}] }],
//    totales:[pend,proc,term], total, pct }
// ─────────────────────────────────────────────────────────────
import { ESTADOS } from '../config.js';

const ETIQ = ESTADOS.map((e) => e.etiqueta);
const COLOR = [
  { bg: '#CBD2D7', fg: '#12222D', rgb: [203, 210, 215], rgbFg: [18, 34, 45] },
  { bg: '#F2B705', fg: '#12222D', rgb: [242, 183, 5], rgbFg: [18, 34, 45] },
  { bg: '#1B7F68', fg: '#FFFFFF', rgb: [27, 127, 104], rgbFg: [255, 255, 255] },
];

const pad = (n) => String(n).padStart(2, '0');
export const fechaISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fechaHora = (t) =>
  t
    ? new Date(t).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ─── Excel ──────────────────────────────────────────────── */
export function hojasExcel(m) {
  const cab = (value) => ({
    value,
    fontWeight: 'bold',
    backgroundColor: '#12222D',
    textColor: '#FFFFFF',
    align: 'center',
  });
  const centro = (value) => ({ value, align: 'center' });
  const estadoCelda = (s) => ({
    value: ETIQ[s],
    align: 'center',
    backgroundColor: COLOR[s].bg,
    textColor: COLOR[s].fg,
  });

  const resumen = [
    [cab('Bloque'), cab('Terminados'), cab('En proceso'), cab('Pendientes'), cab('Avance'), cab('Estado')],
    ...m.filas.map((f) => [
      centro(f.bloque),
      centro(f.c[2]),
      centro(f.c[1]),
      centro(f.c[0]),
      { value: f.pct / 100, format: '0%', align: 'center' },
      estadoCelda(f.estado),
    ]),
    [
      { value: 'Total', fontWeight: 'bold', align: 'center' },
      { value: m.totales[2], fontWeight: 'bold', align: 'center' },
      { value: m.totales[1], fontWeight: 'bold', align: 'center' },
      { value: m.totales[0], fontWeight: 'bold', align: 'center' },
      { value: m.pct / 100, format: '0%', fontWeight: 'bold', align: 'center' },
      null,
    ],
  ];

  const detalle = [
    [cab('Bloque'), cab('Apartamento'), cab('Estado'), cab('Nota'), cab('Última actualización')],
    ...m.filas.flatMap((f) =>
      f.aptos.map((a) => [centro(f.bloque), centro(String(a.apto)), estadoCelda(a.s), { value: a.n || null }, centro(fechaHora(a.t) || null)])
    ),
  ];

  return [
    {
      data: resumen,
      sheet: 'Resumen',
      columns: [{ width: 10 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 10 }, { width: 14 }],
      stickyRowsCount: 1,
    },
    {
      data: detalle,
      sheet: 'Detalle',
      columns: [{ width: 10 }, { width: 14 }, { width: 14 }, { width: 44 }, { width: 22 }],
      stickyRowsCount: 1,
    },
  ];
}

export async function descargarExcel(m) {
  const { default: writeExcelFile } = await import('write-excel-file/universal');
  const blob = await writeExcelFile(hojasExcel(m)).toBlob();
  descargar(blob, `avance-cubiertas-${fechaISO(m.fecha)}.xlsx`);
}

/* ─── PDF ────────────────────────────────────────────────── */
export async function descargarPDF(m) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margen = 14;

  // Encabezado
  doc.setFillColor(18, 34, 45);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(m.obra.nombre, margen, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${m.obra.conjunto} - Avance al ${m.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, margen, 20);

  // Barra de avance
  const bw = W - margen * 2;
  const by = 36;
  doc.setFillColor(225, 230, 233);
  doc.roundedRect(margen, by, bw, 6, 3, 3, 'F');
  const wOk = (bw * m.totales[2]) / m.total;
  const wPr = (bw * m.totales[1]) / m.total;
  if (wOk > 0) {
    doc.setFillColor(...COLOR[2].rgb);
    doc.rect(margen, by, wOk, 6, 'F');
  }
  if (wPr > 0) {
    doc.setFillColor(...COLOR[1].rgb);
    doc.rect(margen + wOk, by, wPr, 6, 'F');
  }
  doc.setTextColor(18, 34, 45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${m.pct}% terminado`, margen, by + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Terminados: ${m.totales[2]}   En proceso: ${m.totales[1]}   Pendientes: ${m.totales[0]}   Total: ${m.total} apartamentos`,
    margen + 34,
    by + 13
  );

  // Tabla por bloque, con un color por apartamento
  const aptosNombres = m.filas[0] ? m.filas[0].aptos.map((a) => a.apto) : [];
  autoTable(doc, {
    startY: by + 19,
    margin: { left: margen, right: margen, bottom: 16 },
    head: [['Bloque', ...aptosNombres.map((a) => `Apto ${a}`), 'Avance']],
    body: m.filas.map((f) => [f.bloque, ...f.aptos.map((a) => ETIQ[a.s]), `${f.pct}%`]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.6, halign: 'center', lineColor: [195, 205, 211], lineWidth: 0.2, textColor: [18, 34, 45] },
    headStyles: { fillColor: [18, 34, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 } },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const col = data.column.index;
      if (col >= 1 && col <= aptosNombres.length) {
        const s = ETIQ.indexOf(data.cell.raw);
        if (s >= 0) {
          data.cell.styles.fillColor = COLOR[s].rgb;
          data.cell.styles.textColor = COLOR[s].rgbFg;
          if (s === 2) data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Notas (solo si hay)
  const notas = m.filas.flatMap((f) => f.aptos.filter((a) => a.n).map((a) => [f.bloque, a.apto, ETIQ[a.s], a.n]));
  if (notas.length) {
    const yNotas = (doc.lastAutoTable ? doc.lastAutoTable.finalY : by + 19) + 10;
    autoTable(doc, {
      startY: yNotas,
      margin: { left: margen, right: margen, bottom: 16 },
      head: [['Bloque', 'Apto', 'Estado', 'Nota']],
      body: notas,
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.8, textColor: [18, 34, 45] },
      headStyles: { fillColor: [18, 34, 45], textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 28 } },
      didDrawPage: () => {},
    });
  }

  // Pie con número de página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(110, 125, 135);
    doc.text(`Página ${i} de ${total}`, W - margen, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  doc.save(`avance-cubiertas-${fechaISO(m.fecha)}.pdf`);
}
