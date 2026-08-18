import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as XLSX from "xlsx";
import { COLLABORATORS } from "../src/mocks/collaborators.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "demos-ejemplos");
mkdirSync(outDir, { recursive: true });

const HEADER = "username,name,email,area,leader";

interface Row {
  username: string;
  name: string;
  email: string;
  area: string;
  leader: string;
  /** Extra demographic columns, rendered after the known fields. */
  extra?: Readonly<Record<string, string>>;
}

function esc(value: string): string {
  const v = String(value ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function toLine(row: Row): string {
  return [row.username, row.name, row.email, row.area, row.leader]
    .concat(EXTRA_COLUMNS.map((column) => row.extra?.[column] ?? ""))
    .map(esc)
    .join(",");
}

let EXTRA_COLUMNS: string[] = [];

function writeCsv(filename: string, rows: Row[]): void {
  const header = [HEADER, ...EXTRA_COLUMNS].join(",");
  const content = [header, ...rows.map(toLine)].join("\n") + "\n";
  writeFileSync(join(outDir, filename), content, "utf8");
  console.log(`  ${filename}: ${rows.length} filas`);
}

const existing = (count: number): Row[] =>
  COLLABORATORS.slice(0, count).map((p) => ({
    username: p.username,
    name: p.name,
    email: p.email,
    area: p.area,
    leader: p.leader ?? "",
  }));

// New users: usernames are checked against the directory so they can never
// accidentally match an existing platform user (by username or email).
const takenUsernames = new Set(COLLABORATORS.map((p) => p.username.toLowerCase()));

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

let newId = 10;
function freeUsername(first: string, last: string): string {
  let candidate = `${slug(first)}.${slug(last)}${newId}`;
  while (takenUsernames.has(candidate)) {
    newId += 1;
    candidate = `${slug(first)}.${slug(last)}${newId}`;
  }
  takenUsernames.add(candidate);
  return candidate;
}

function newUsers(
  specs: readonly {
    first: string;
    last: string;
    area: string;
    leader: string;
    demographics?: Readonly<Record<string, string>>;
  }[]
): Row[] {
  return specs.map((spec) => ({
    username: freeUsername(spec.first, spec.last),
    name: `${spec.first} ${spec.last}`,
    email: `${slug(spec.first)}.${slug(spec.last)}@correo.com`,
    area: spec.area,
    leader: spec.leader,
    extra: spec.demographics,
  }));
}

const NEW_POOL = [
  { first: "Andrea", last: "Méndez", area: "Innovación", leader: "Marcela Ospina" },
  { first: "Javier", last: "Cárdenas", area: "Tecnología", leader: "Andrés Beltrán" },
  { first: "Paola", last: "Escobar", area: "Marketing", leader: "Jorge Piedrahíta" },
  { first: "Ricardo", last: "Duarte", area: "Finanzas", leader: "Rodrigo Cadena" },
  { first: "Camila", last: "Quintero", area: "Producto", leader: "Emilio Vanegas" },
  { first: "Diego", last: "Navarro", area: "Legal", leader: "Patricia Lozano" },
  { first: "Lucía", last: "Ramírez", area: "Gente y Cultura", leader: "Lucía Fernández" },
  { first: "Sergio", last: "Moreno", area: "Servicio al cliente", leader: "Diana Cortés" },
  { first: "Valeria", last: "Rojas", area: "Logística", leader: "Hernán Zapata" },
] as const;

console.log("Generando demos en demos-ejemplos/");

// Caso 1: todos los usuarios son nuevos (nadie existe en la plataforma).
writeCsv("todos-nuevos.csv", newUsers(NEW_POOL.slice(0, 8)));

// Caso 2: todos ya existen en Ubits.
writeCsv("todos-en-ubits.csv", existing(12));

// Caso 3: mezcla con más nuevos que ya existentes (6 nuevos + 3 existentes).
writeCsv("mixto-mas-nuevos.csv", [...newUsers(NEW_POOL.slice(0, 6)), ...existing(3)]);

// Caso 7: usuarios nuevos con columnas demográficas extra — la pantalla de
// demográficos debería mostrar el nuevo acordeón con las columnas detectadas.
EXTRA_COLUMNS = ["sede", "tipo_contrato", "genero"];
writeCsv(
  "nuevos-con-demograficos.csv",
  newUsers(
    NEW_POOL.slice(0, 8).map((spec, index) => ({
      ...spec,
      demographics: {
        sede: ["Bogotá", "Medellín", "Cali", "Barranquilla"][index % 4],
        tipo_contrato: ["Término indefinido", "Término fijo"][index % 2],
        genero: ["Femenino", "Masculino"][index % 2],
      },
    }))
  )
);

// Los demos que siguen no llevan columnas demográficas extra.
EXTRA_COLUMNS = [];

// Caso 4: archivo corrupto — bytes de imagen con extensión .csv, para que el
// parser falle y la pantalla muestre el mensaje de archivo ilegible.
const corrupt = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe, 0x01, 0x02, 0x03, 0x04, 0xff, 0xff, 0xff,
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0x0a,
]);
writeFileSync(join(outDir, "archivo-corrupto.csv"), corrupt);
console.log("  archivo-corrupto.csv: basura binaria (.csv)");

// Caso 5: formato no reconocido — un .txt se rechaza por extensión antes de
// llegar al parser.
writeFileSync(
  join(outDir, "formato-no-reconocido.txt"),
  "Esto es un archivo de texto plano.\nNo es una planilla de cálculo.\n",
  "utf8"
);
console.log("  formato-no-reconocido.txt: texto (.txt)");

// Caso 5b: es CSV o XLSX válido, pero su estructura no tiene columnas de
// usuario — el parser lee bien el archivo y no encuentra ninguna fila usable.
const NO_STRUCTURE_ROWS = [
  ["cedula", "telefono", "ciudad"],
  ["12345678", "3001112233", "Bogotá"],
  ["87654321", "3209998877", "Medellín"],
  ["11223344", "3105556677", "Cali"],
];
writeFileSync(join(outDir, "estructura-no-detectada.csv"), NO_STRUCTURE_ROWS.map((r) => r.join(",")).join("\n") + "\n", "utf8");
console.log("  estructura-no-detectada.csv: CSV sin columnas de usuario");

{
  const sheet = XLSX.utils.aoa_to_sheet(NO_STRUCTURE_ROWS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Datos");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  writeFileSync(join(outDir, "estructura-no-detectada.xlsx"), buffer);
  console.log("  estructura-no-detectada.xlsx: XLSX sin columnas de usuario");
}

// Caso 6: archivo muy pesado — >5 MB, el límite que valida UploadZone.
const heavyRow = toLine({
  username: COLLABORATORS[0].username,
  name: COLLABORATORS[0].name,
  email: COLLABORATORS[0].email,
  area: COLLABORATORS[0].area,
  leader: COLLABORATORS[0].leader ?? "",
});
const heavyLines = [HEADER, ...Array.from({ length: 75000 }, () => heavyRow)];
writeFileSync(join(outDir, "archivo-muy-pesado.csv"), heavyLines.join("\n") + "\n", "utf8");
console.log("  archivo-muy-pesado.csv: ~6 MB");
