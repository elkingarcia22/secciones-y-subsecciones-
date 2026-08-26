import { BRAND, INK, MUTED, PAPER_BORDER } from "./tokens";

export const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /*
   * Cada hoja conserva su margen — 5mm arriba y abajo, 12mm a los lados. La
   * cifra vertical es deliberada: el navegador dibuja su propia banda de
   * fecha/URL/título dentro del margen de página y la omite cuando ese margen
   * queda por debajo de las ~0,25in que la banda necesita. Así toda página
   * tiene margen y ninguna arrastra el "24/8/26, 7:14 p.m. …". La primera y la
   * última reciben aire extra del padding del body.
   */
  @page { size: A4; margin: 5mm 12mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${INK}; font-size: 12px; line-height: 1.5; background: #fff;
    padding: 6mm 0 8mm;
  }

  /* --- Portada --- */
  .cover {
    background: linear-gradient(120deg, ${BRAND}, #2f7bff 65%, #6aa4ff);
    color: #fff; border-radius: 16px; padding: 28px 28px 22px; margin-bottom: 24px;
  }
  .cover-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .cover-kind {
    background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35);
    border-radius: 999px; padding: 3px 12px; font-size: 11px; font-weight: 700;
  }
  .cover-brand { font-size: 11.5px; font-weight: 600; opacity: .9; }
  .cover h1 { font-size: 26px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 16px; }
  .cover-cut { font-weight: 600; opacity: .85; }
  .cover-meta { display: flex; flex-wrap: wrap; gap: 6px 24px; font-size: 11.5px; opacity: .95; }
  .cover-meta strong { display: block; font-size: 10px; font-weight: 600; opacity: .78; }

  /* --- Estructura --- */
  section { margin-bottom: 24px; }
  .break-avoid { break-inside: avoid; }
  h2 {
    font-size: 15px; font-weight: 800; letter-spacing: -.01em; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 2px solid ${BRAND};
    display: flex; align-items: center; gap: 8px;
  }
  .h2-index {
    width: 19px; height: 19px; border-radius: 6px; background: ${BRAND}; color: #fff;
    font-size: 11px; font-weight: 700; display: inline-flex; align-items: center;
    justify-content: center; flex: none;
  }
  h3 { font-size: 12px; font-weight: 700; color: ${INK}; margin-bottom: 6px; }
  /* Subtítulo de bloque: barra de marca a la izquierda, rótulo en versalitas. */
  .block-title {
    font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
    color: ${INK}; margin: 0 0 8px; padding-left: 9px; position: relative;
  }
  .block-title::before {
    content: ""; position: absolute; left: 0; top: 1px; bottom: 1px; width: 3px;
    background: ${BRAND}; border-radius: 2px;
  }
  .block { margin-top: 16px; }
  .note { color: ${MUTED}; font-size: 11px; margin-bottom: 10px; }
  .note:last-child { margin-bottom: 0; }
  .callout {
    border-left: 3px solid ${BRAND}; background: #f5f8ff; color: ${INK};
    padding: 8px 10px; border-radius: 0 8px 8px 0; margin-top: 10px;
  }
  .lead { font-size: 12.5px; line-height: 1.55; }

  /* --- Indicadores --- */
  .kpi-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
  .kpi {
    flex: 1 1 0; min-width: 0; border: 1px solid ${PAPER_BORDER}; border-radius: 12px;
    padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; break-inside: avoid;
  }
  .kpi-label { font-size: 10.5px; font-weight: 600; color: ${MUTED}; }
  .kpi-value { font-size: 26px; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; }
  .kpi-detail { font-size: 10.5px; color: ${MUTED}; }

  /* --- Pills y leyendas --- */
  .verdict { border-radius: 999px; padding: 2px 10px; font-size: 10.5px; font-weight: 700; white-space: nowrap; }
  .verdict-positive { background: #dcfce7; color: #15803d; }
  .verdict-warning { background: #fef9c3; color: #a16207; }
  .verdict-negative { background: #fee2e2; color: #b91c1c; }
  .verdict-neutral { background: #f1f3f5; color: ${MUTED}; }
  .scale {
    display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px;
    font-size: 10.5px; color: ${MUTED}; margin-bottom: 12px;
  }
  .scale-title { font-weight: 700; color: ${INK}; margin-right: 2px; }
  .legend {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: 6px 16px; font-size: 10px; color: ${MUTED};
    margin-top: 8px; padding-top: 8px; border-top: 1px solid ${PAPER_BORDER};
  }
  .legend-item { display: inline-flex; align-items: center; gap: 5px; }
  .legend-item em { font-style: normal; opacity: .75; }
  .dot { width: 9px; height: 9px; border-radius: 999px; border: 1px solid transparent; display: inline-block; }
  .chip {
    display: inline-block; min-width: 40px; text-align: center; border-radius: 999px;
    border: 1px solid; padding: 1px 8px; font-weight: 700; font-size: 10.5px; font-variant-numeric: tabular-nums;
  }

  /* --- Tablas --- */
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th {
    text-align: left; font-size: 9.5px; color: ${MUTED}; font-weight: 700;
    letter-spacing: .03em; text-transform: uppercase;
    padding: 7px 8px; background: #f8fafc; border-bottom: 1px solid ${PAPER_BORDER};
  }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f3f5; vertical-align: middle; }
  /*
   * Se protege la fila, nunca la tabla.
   *
   * Un break-inside sobre una tabla de veinte filas no la mantiene entera: la
   * empuja completa a la página siguiente y deja media hoja en blanco detrás.
   * La unidad que de verdad no debe partirse es la fila — un renglón cortado
   * por la mitad sí es ilegible — y el encabezado se repite solo en cada
   * página gracias a table-header-group.
   */
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .center { text-align: center; }
  .dim { color: ${MUTED}; }
  /* Fila de agrupación: la sección raíz que encabeza a sus subsecciones. */
  tr.grp td {
    background: #f8fafc; font-size: 10px; font-weight: 800; letter-spacing: .04em;
    text-transform: uppercase; color: ${INK}; padding: 6px 8px;
  }
  tr.total-row td { border-top: 2px solid ${PAPER_BORDER}; font-weight: 800; background: #fbfcfd; }
  .bar { display: flex; height: 9px; border-radius: 999px; overflow: hidden; background: #f1f3f5; min-width: 70px; }
  .bar-lg { height: 16px; }

  /* --- Cobertura --- */
  .coverage { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .cov-row { display: flex; align-items: center; gap: 10px; break-inside: avoid; }
  .cov-label { flex: 0 0 26%; font-size: 11px; font-weight: 600; }
  .cov-track { flex: 1; height: 11px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
  .cov-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${BRAND}, #4d8dff); }
  .cov-value { flex: 0 0 22%; text-align: right; font-size: 10.5px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* --- Heatmap --- */
  table.heatmap { table-layout: fixed; }
  table.heatmap th, table.heatmap td { padding: 5px 3px; }
  table.heatmap th:first-child, table.heatmap td:first-child { text-align: left; }
  /* Los rótulos de grupo son nombres propios y algunos son largos: se parten
     antes que invadir la columna vecina. */
  table.heatmap th {
    text-align: center; font-size: 8.5px; letter-spacing: .02em; line-height: 1.25;
    overflow-wrap: anywhere; hyphens: auto;
  }
  td.heat {
    text-align: center; font-weight: 700; font-variant-numeric: tabular-nums;
    border: 2px solid #fff; border-radius: 5px; font-size: 10px;
  }
  td.heat-label { font-weight: 600; font-size: 10.5px; }
  tr.totals td { border-top: 2px solid ${PAPER_BORDER}; font-weight: 800; }
  /* Sin break-inside: una grilla de veinte secciones no cabe en media página y
     forzarla entera es exactamente lo que abre el hueco. */
  .grid-part { margin-bottom: 14px; }

  /* --- eNPS --- */
  .gauge {
    display: flex; align-items: center; gap: 22px;
    border: 1px solid ${PAPER_BORDER}; border-radius: 12px; padding: 16px 18px;
  }
  .gauge-figure { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; flex: none; }
  .gauge-score { font-size: 34px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  .gauge-detail { font-size: 10.5px; color: ${MUTED}; }
  .gauge-track { flex: 1; position: relative; padding-top: 12px; }
  .gauge-zones { display: flex; height: 12px; border-radius: 999px; overflow: hidden; }
  .gauge-marker { position: absolute; top: 0; transform: translateX(-50%); }
  .gauge-pin { display: block; width: 2px; height: 26px; background: ${INK}; margin: 0 auto; border-radius: 2px; }
  .gauge-ticks { position: relative; height: 12px; margin-top: 4px; }
  .gauge-ticks span {
    position: absolute; transform: translateX(-50%); font-size: 9px; color: ${MUTED};
    font-variant-numeric: tabular-nums;
  }
  .nps-bands { display: flex; gap: 10px; margin-top: 10px; }
  .nps-band {
    flex: 1; border: 1px solid ${PAPER_BORDER}; border-top: 3px solid; border-radius: 10px;
    padding: 9px 12px; display: flex; flex-direction: column; gap: 1px; break-inside: avoid;
  }
  .nps-band-share { font-size: 19px; font-weight: 800; letter-spacing: -.02em; }
  .nps-band-label { font-size: 11px; font-weight: 700; }
  .nps-band-detail { font-size: 10px; color: ${MUTED}; }
  .nps-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 10.5px; color: ${MUTED}; }
  .nps-legend span { display: inline-flex; align-items: center; gap: 5px; }

  /* --- Análisis IA --- */
  .ai-summary {
    border-left: 3px solid ${BRAND}; background: #f5f8ff; border-radius: 0 10px 10px 0;
    padding: 11px 14px; font-size: 12px; line-height: 1.55; margin-bottom: 14px;
  }
  .ai-card {
    border: 1px solid ${PAPER_BORDER}; border-radius: 10px; padding: 10px 12px;
    margin-bottom: 8px; break-inside: avoid;
  }
  .ai-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .ai-title { flex: 1; font-size: 12px; font-weight: 700; }
  .ai-body { font-size: 11px; }
  .ai-evidence { font-size: 10.5px; color: ${MUTED}; margin-top: 4px; }

  .doc-footer {
    margin-top: 8px; padding-top: 10px; border-top: 1px solid ${PAPER_BORDER};
    font-size: 9.5px; color: ${MUTED}; display: flex; justify-content: space-between;
  }
`;
