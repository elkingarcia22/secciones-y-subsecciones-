import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as XLSX from "xlsx";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "demos-ejemplos");
mkdirSync(outDir, { recursive: true });

function esc(value: string): string {
  const v = String(value ?? "");
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function writeCsv(filename: string, rows: readonly readonly string[][], note: string): void {
  const content = rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
  writeFileSync(join(outDir, filename), content, "utf8");
  console.log(`  ${filename}: ${rows.length - 1} filas (${note})`);
}

function writeText(filename: string, text: string, note: string): void {
  writeFileSync(join(outDir, filename), text, "utf8");
  console.log(`  ${filename}: ${note}`);
}

console.log("Generando demos de secciones/preguntas en demos-ejemplos/");

// Caso 1: ejemplo completo en Markdown — secciones, subsecciones nivel 2 y 3,
// descripciones, preguntas de todos los tipos con opciones y etiquetas de tipo.
writeText(
  "secciones-completo.md",
  `# Clima laboral

Encuesta anual de clima organizacional.

## Reconocimiento

### Reconocimiento directo

- ¿Tu líder reconoce tu trabajo cuando lo haces bien? [escala]

  - Nunca
  - Casi nunca
  - A veces
  - Casi siempre
  - Siempre

- ¿Recibes retroalimentación al menos una vez al mes? [opción única]

  - Sí
  - No

### Reconocimiento representativo

- ¿Sientes que la empresa valora tus aportes? [escala]

  - Nunca
  - Casi nunca
  - A veces
  - Casi siempre
  - Siempre

## Bienestar

- ¿Cómo describirías tu nivel de estrés en el último mes? [abierta]

- ¿Qué días trabajas desde casa? [múltiple]

  - Lunes
  - Martes
  - Miércoles
  - Jueves
  - Viernes

- Selecciona tu sede [desplegable]

  - Bogotá
  - Medellín
  - Cali

# Carga horaria

## Horas efectivas

- ¿Cuántas horas efectivas trabajas al día? [opción única]

  - Menos de 6
  - 6 a 8
  - Más de 8
`,
  "caso completo .md"
);

// Caso 2: mismo contenido en CSV plano, con tipo y opciones en columnas.
const CSV_HEADER = ["seccion", "subseccion", "subsubseccion", "pregunta", "tipo", "opciones"];
writeCsv(
  "secciones-completo.csv",
  [
    CSV_HEADER,
    ["Clima laboral", "Reconocimiento", "Reconocimiento directo", "¿Tu líder reconoce tu trabajo cuando lo haces bien?", "escala", ""],
    ["", "", "", "¿Recibes retroalimentación al menos una vez al mes?", "opción única", "Sí|No"],
    ["", "Reconocimiento representativo", "", "¿Sientes que la empresa valora tus aportes?", "escala", "Nunca|A veces|Siempre"],
    ["", "Bienestar", "", "¿Cómo describirías tu nivel de estrés en el último mes?", "abierta", ""],
    ["", "", "", "¿Qué días trabajas desde casa?", "múltiple", "Lunes|Martes|Miércoles|Jueves|Viernes"],
    ["", "", "", "Selecciona tu sede", "desplegable", "Bogotá|Medellín|Cali"],
    ["Carga horaria", "Horas efectivas", "", "¿Cuántas horas efectivas trabajas al día?", "opción única", "Menos de 6|6 a 8|Más de 8"],
  ],
  "caso completo .csv"
);

// Caso 2b: el mismo CSV como XLSX real, para probar el mismo parser por bytes.
{
  const sheet = XLSX.utils.aoa_to_sheet([
    CSV_HEADER,
    ["Clima laboral", "Reconocimiento", "Reconocimiento directo", "¿Tu líder reconoce tu trabajo cuando lo haces bien?", "escala", ""],
    ["", "", "", "¿Recibes retroalimentación al menos una vez al mes?", "opción única", "Sí|No"],
    ["", "Reconocimiento representativo", "", "¿Sientes que la empresa valora tus aportes?", "escala", "Nunca|A veces|Siempre"],
    ["", "Bienestar", "", "¿Cómo describirías tu nivel de estrés en el último mes?", "abierta", ""],
    ["", "", "", "¿Qué días trabajas desde casa?", "múltiple", "Lunes|Martes|Miércoles|Jueves|Viernes"],
    ["", "", "", "Selecciona tu sede", "desplegable", "Bogotá|Medellín|Cali"],
    ["Carga horaria", "Horas efectivas", "", "¿Cuántas horas efectivas trabajas al día?", "opción única", "Menos de 6|6 a 8|Más de 8"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Secciones");
  writeFileSync(join(outDir, "secciones-completo.xlsx"), XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  console.log("  secciones-completo.xlsx: caso completo en Excel");
}

// Caso 3: sección sin preguntas directas (nivel 1 contenedor) y una subsección
// con preguntas — la pantalla debe dejar la sección vacía y crear la sub sección.
writeText(
  "seccion-sin-preguntas.md",
  `# Permisos y vacaciones

Sección contenedora: sin preguntas propias.

## Solicitudes de permisos

- ¿Sientes que tus permisos se aprueban a tiempo? [escala]

  - Nunca
  - Casi nunca
  - A veces
  - Casi siempre
  - Siempre
`,
  "sección nivel 1 sin preguntas"
);

// Caso 4: pregunta sin tipo explícito (queda escala por defecto).
writeText(
  "pregunta-sin-tipo.md",
  `# Satisfacción

- ¿Qué tan satisfecho estás con tu equipo?

  - Muy insatisfecho
  - Insatisfecho
  - Neutral
  - Satisfecho
  - Muy satisfecho
`,
  "pregunta sin etiqueta de tipo"
);

// Caso 5: opciones cortas — una pregunta de opción única con una sola opción;
// el importador rellena hasta el mínimo de opciones.
writeCsv(
  "opciones-cortas.csv",
  [
    CSV_HEADER,
    ["Feedback", "Frecuencia", "", "¿Recibes feedback mensual?", "opción única", "Sí"],
  ],
  "opciones por debajo del mínimo"
);

// Caso 6: títulos repetidos — dos secciones con el mismo nombre, algo común al
// exportar la misma encuesta dos veces; no deben fusionarse.
writeCsv(
  "titulos-repetidos.csv",
  [
    CSV_HEADER,
    ["Cultura", "", "", "¿Recomiendas la empresa?", "escala", ""],
    ["Cultura", "", "", "¿Te sientes orgulloso de pertenecer?", "escala", ""],
  ],
  "secciones con títulos repetidos"
);

// Caso 7: descripción multilínea en Markdown — varios párrafos bajo una sección.
writeText(
  "descripcion-multilinea.md",
  `# Liderazgo

La encuesta mide el estilo de liderazgo percibido.

Estas respuestas son confidenciales y anónimas.

Tómate unos minutos y responde con sinceridad.

## Confianza

- ¿Confías en las decisiones de tu líder? [escala]

  - Nada
  - Poco
  - Algo
  - Bastante
  - Mucho
`,
  "descripción multilínea"
);

// Caso 8: profundidad excesiva — encabezados nivel 4+ se clavan en nivel 3.
writeText(
  "profundidad-excesiva.md",
  `# Estrategia

## Dirección estratégica

### Metas

#### Detalles operativos

- ¿Conoces las metas del área? [opción única]

  - Sí
  - No
`,
  "encabezados más profundos que el máximo permitido"
);

// Caso 9: archivo corrupto — bytes de imagen con extensión .csv.
const corrupt = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe, 0x01, 0x02, 0x03, 0x04, 0xff, 0xff, 0xff,
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0x0a,
]);
writeFileSync(join(outDir, "secciones-corrupto.csv"), corrupt);
console.log("  secciones-corrupto.csv: basura binaria (.csv)");

// Caso 10: estructura no detectable — un CSV válido sin columnas de sección o
// pregunta; el parser lee bien pero no encuentra nada que importar.
writeCsv(
  "secciones-sin-estructura.csv",
  [
    ["periodo", "anio"],
    ["T1", "2026"],
    ["T2", "2026"],
  ],
  "CSV sin columnas de sección/pregunta"
);

// Caso 11: formato no soportado — un .docx se rechaza por extensión antes de
// llegar al parser (quedan fuera PDF/DOC/DOCX).
{
  const fakeDocx = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), // firma ZIP / PK
    Buffer.from("Secciones y preguntas de ejemplo"),
  ]);
  writeFileSync(join(outDir, "secciones-no-soportado.docx"), fakeDocx);
  console.log("  secciones-no-soportado.docx: formato rechazado por extensión");
}

// Caso 12: archivo muy pesado — >5 MB, el límite que valida UploadZone.
const heavyRow = ["Cultura", "", "", "¿Repite la pregunta para llenar peso?", "escala", ""];
const heavyLines = [CSV_HEADER.join(","), ...Array.from({ length: 75000 }, () => heavyRow.map(esc).join(","))];
writeFileSync(join(outDir, "secciones-muy-pesado.csv"), heavyLines.join("\n") + "\n", "utf8");
console.log("  secciones-muy-pesado.csv: ~6 MB");