// Listas fijas y precios. El precio de cada servicio lo define SIEMPRE el servidor.

const fs = require('fs');
const path = require('path');

const SERVICIOS = {
  landing: {
    nombre: 'Landing Profesional',
    importe: 50000,
    detalle: 'Página definitiva con panel de autogestión, alojamiento y soporte. Incluye el primer mes.',
  },
  abono: {
    nombre: 'Abono mensual',
    importe: 15000,
    detalle: 'Mantenimiento, alojamiento y soporte por 30 días más.',
  },
  destacado: {
    nombre: 'Destacado en el directorio',
    importe: 10000,
    detalle: 'Tu comercio aparece primero en el directorio durante 30 días.',
  },
};

const DIAS_VIGENCIA = 30;

const RUBROS = [
  { id: 'gastronomia', nombre: 'Gastronomía' },
  { id: 'panaderias', nombre: 'Panaderías y almacenes' },
  { id: 'indumentaria', nombre: 'Indumentaria' },
  { id: 'profesionales', nombre: 'Profesionales' },
  { id: 'oficios', nombre: 'Oficios' },
  { id: 'salud', nombre: 'Salud y bienestar' },
  { id: 'belleza', nombre: 'Belleza' },
  { id: 'vinos', nombre: 'Vinos y bodegas' },
  { id: 'mascotas', nombre: 'Mascotas' },
];

const ZONAS = [
  { id: 'capital', nombre: 'Ciudad de Mendoza' },
  { id: 'godoy-cruz', nombre: 'Godoy Cruz' },
  { id: 'guaymallen', nombre: 'Guaymallén' },
  { id: 'las-heras', nombre: 'Las Heras' },
  { id: 'lujan', nombre: 'Luján de Cuyo' },
  { id: 'maipu', nombre: 'Maipú' },
];

// Fotos locales de muestra (en public/img/comercios), para no depender de internet.
const IMAGENES_DEMO = fs
  .readdirSync(path.join(__dirname, '..', 'public', 'img', 'comercios'))
  .filter((f) => f.endsWith('.jpg'))
  .map((f) => `/img/comercios/${f}`);

const PLANTILLAS = [
  { id: 'clasica', nombre: 'Clásica (azul y turquesa)' },
  { id: 'calida', nombre: 'Cálida (terracota)' },
  { id: 'natural', nombre: 'Natural (verde oliva)' },
];

const ESTADOS_COMERCIO = {
  vista_previa: 'Vista previa',
  pendiente_revision: 'Pendiente de revisión',
  publicado: 'Publicado',
  suspendido: 'Suspendido',
};

const ESTADOS_OPERACION = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const nombreDe = (lista, id) => (lista.find((x) => x.id === id) || {}).nombre || id;

module.exports = {
  SERVICIOS,
  DIAS_VIGENCIA,
  RUBROS,
  ZONAS,
  PLANTILLAS,
  IMAGENES_DEMO,
  ESTADOS_COMERCIO,
  ESTADOS_OPERACION,
  nombreRubro: (id) => nombreDe(RUBROS, id),
  nombreZona: (id) => nombreDe(ZONAS, id),
  nombrePlantilla: (id) => nombreDe(PLANTILLAS, id),
};
