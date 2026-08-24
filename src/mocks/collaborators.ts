/**
 * Company directory used by the participants step.
 *
 * Built deterministically from name pools rather than hand-written rows: the
 * step needs a directory big enough for search, paging and "select all" to
 * behave like they will in production, and a list that shuffles between
 * reloads would make the builder impossible to reason about.
 */

export interface Collaborator {
  id: string;
  username: string;
  name: string;
  email: string;
  area: string;
  /** Direct manager, or null for the people at the top of an area. */
  leader: string | null;
  country: string;
  age: string;
  gender: string;
}

const COUNTRIES = ["Colombia", "México", "Perú", "Chile", "Argentina", "España"] as const;
const AGES = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;
const GENDERS = ["Femenino", "Masculino", "Otro", "Prefiero no decirlo"] as const;

const FIRST_NAMES = [
  "Ana", "Carlos", "Sofía", "Daniel", "Valentina", "Andrés", "Camila", "Julián",
  "Laura", "Santiago", "Mariana", "Felipe", "Isabella", "Sebastián", "Paula",
  "Nicolás", "Daniela", "Mateo", "Catalina", "Alejandro", "Juliana", "Esteban",
  "Natalia", "Ricardo", "Gabriela", "Tomás", "Verónica", "Óscar", "Manuela", "Iván",
] as const;

const LAST_NAMES = [
  "García", "Rodríguez", "Martínez", "Hernández", "López", "Gómez", "Díaz",
  "Vargas", "Ramírez", "Torres", "Moreno", "Rojas", "Castro", "Ortiz", "Silva",
  "Mendoza", "Guerrero", "Peña", "Cárdenas", "Restrepo", "Quintero", "Navarro",
  "Salazar", "Arango", "Bermúdez", "Cifuentes", "Duarte", "Escobar",
] as const;

/** Each area comes with the person who leads it. */
const AREAS = [
  { name: "Tecnología", leader: "Andrés Beltrán" },
  { name: "Comercial", leader: "Carolina Suárez" },
  { name: "Marketing", leader: "Jorge Piedrahíta" },
  { name: "Operaciones", leader: "Marcela Ospina" },
  { name: "Gente y Cultura", leader: "Lucía Fernández" },
  { name: "Finanzas", leader: "Rodrigo Cadena" },
  { name: "Servicio al cliente", leader: "Diana Cortés" },
  { name: "Producto", leader: "Emilio Vanegas" },
  { name: "Legal", leader: "Patricia Lozano" },
  { name: "Logística", leader: "Hernán Zapata" },
] as const;

export const COLLABORATOR_COUNT = 6760;

/** Accent-free, lowercase — what a username and an email address can hold. */
function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Deterministic hash with good avalanche (a xorshift-multiply finalizer).
 *
 * Plain strides like `index * 7` don't work here: the stride and the pool size
 * share factors with the other pools' sizes, which locks the fields together —
 * every "Sofía" ends up in the same area, and filtering by area then appears
 * broken because it really does return one name over and over. Salting the
 * same index per field decorrelates them while staying reproducible.
 */
function hash(index: number, salt: number): number {
  let value = (index + Math.imul(salt, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0;
  return (value ^ (value >>> 15)) >>> 0;
}

function buildDirectory(): readonly Collaborator[] {
  const people: Collaborator[] = [];

  for (let index = 0; index < COLLABORATOR_COUNT; index += 1) {
    const first = FIRST_NAMES[hash(index, 1) % FIRST_NAMES.length];
    const paternal = LAST_NAMES[hash(index, 2) % LAST_NAMES.length];
    const maternal = LAST_NAMES[hash(index, 3) % LAST_NAMES.length];
    const area = AREAS[hash(index, 4) % AREAS.length];

    const username = `${slug(first)}.${slug(paternal)}${index}`;
    
    // Some basic correlation for gender based on first name if possible? 
    // Actually, hash is fine to just distribute them. 
    // But FIRST_NAMES are mixed. Let's just use hash.
    const country = COUNTRIES[hash(index, 6) % COUNTRIES.length];
    const age = AGES[hash(index, 7) % AGES.length];
    const gender = GENDERS[hash(index, 8) % GENDERS.length];

    people.push({
      id: `collab-${index}`,
      username,
      name: `${first} ${paternal} ${maternal}`,
      email: `${username}@ubits.co`,
      area: area.name,
      // Roughly one in twenty reports to nobody, so the column isn't a wall of
      // identical values.
      leader: hash(index, 5) % 20 === 0 ? null : area.leader,
      country,
      age,
      gender,
    });
  }

  return people;
}

export const COLLABORATORS: readonly Collaborator[] = buildDirectory();
