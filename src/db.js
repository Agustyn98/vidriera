const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'vidriera.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  passwordHash  TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('comerciante', 'admin'))
);

CREATE TABLE IF NOT EXISTS comercios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  duenoId         INTEGER REFERENCES usuarios(id),
  nombre          TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  rubro           TEXT NOT NULL,
  zona            TEXT NOT NULL,
  descripcion     TEXT NOT NULL DEFAULT '',
  whatsapp        TEXT NOT NULL DEFAULT '',
  telefono        TEXT NOT NULL DEFAULT '',
  direccion       TEXT NOT NULL DEFAULT '',
  horarios        TEXT NOT NULL DEFAULT '[]',  -- JSON [{dias, horas}]
  fotos           TEXT NOT NULL DEFAULT '[]',  -- JSON [url]
  productos       TEXT NOT NULL DEFAULT '[]',  -- JSON [{nombre, precio}]
  plantilla       TEXT NOT NULL DEFAULT 'clasica',
  estado          TEXT NOT NULL DEFAULT 'vista_previa'
                  CHECK (estado IN ('vista_previa', 'pendiente_revision', 'publicado', 'suspendido')),
  previewToken    TEXT UNIQUE,
  destacadoHasta  TEXT,
  dominio         TEXT  -- dominio propio, por ejemplo donvicente.com.ar
);

CREATE UNIQUE INDEX IF NOT EXISTS comercios_dominio ON comercios (dominio);

CREATE TABLE IF NOT EXISTS operaciones (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuarioId       INTEGER NOT NULL REFERENCES usuarios(id),
  comercioId      INTEGER NOT NULL REFERENCES comercios(id),
  servicio        TEXT NOT NULL CHECK (servicio IN ('landing', 'abono', 'destacado')),
  importe         INTEGER NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  mpPaymentId     TEXT,
  medio           TEXT,
  nroComprobante  TEXT UNIQUE,
  fecha           TEXT NOT NULL
);
`;

// Migración: bases creadas antes de que existiera el dominio propio.
const columnas = db.prepare('PRAGMA table_info(comercios)').all();
if (columnas.length && !columnas.some((c) => c.name === 'dominio')) {
  db.exec("ALTER TABLE comercios ADD COLUMN dominio TEXT; UPDATE comercios SET dominio = slug || '.com.ar';");
}

db.exec(ESQUEMA);

// Convierte una fila de comercios en objeto con los campos JSON ya parseados.
function parsearComercio(fila) {
  if (!fila) return null;
  const json = (texto) => {
    try {
      return JSON.parse(texto || '[]');
    } catch {
      return [];
    }
  };
  return { ...fila, horarios: json(fila.horarios), fotos: json(fila.fotos), productos: json(fila.productos) };
}

module.exports = { db, parsearComercio, ESQUEMA, DB_PATH };
