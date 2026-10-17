const crypto = require('crypto');
const { db } = require('./db');
const { DOMINIOS } = require('./config');

const ZONA_HORARIA = 'America/Argentina/Mendoza';

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function pesos(importe) {
  return formatoPesos.format(Number(importe) || 0);
}

function fecha(iso, conHora = false) {
  if (!iso) return '';
  const opciones = { timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric' };
  if (conHora) Object.assign(opciones, { hour: '2-digit', minute: '2-digit', hour12: false });
  return new Intl.DateTimeFormat('es-AR', opciones).format(new Date(iso));
}

function sumarDias(desde, dias) {
  const d = new Date(desde);
  d.setDate(d.getDate() + dias);
  return d;
}

// Para buscar sin importar mayúsculas ni tildes.
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function slugUnico(nombre) {
  const base =
    normalizar(nombre)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'comercio';
  const existe = db.prepare('SELECT 1 FROM comercios WHERE slug = ?');
  let slug = base;
  for (let i = 2; existe.get(slug); i++) slug = `${base}-${i}`;
  return slug;
}

// Código de vista previa legible, por ejemplo "K7MP-Q2XR" (sin 0/O ni 1/I para evitar confusiones).
function nuevoCodigoPreview() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existe = db.prepare('SELECT 1 FROM comercios WHERE previewToken = ?');
  let codigo;
  do {
    const bytes = crypto.randomBytes(8);
    const c = Array.from(bytes, (b) => letras[b % letras.length]).join('');
    codigo = `${c.slice(0, 4)}-${c.slice(4)}`;
  } while (existe.get(codigo));
  return codigo;
}

// "https://www.DonVicente.com.ar/" → "donvicente.com.ar"; "donvicente" → "donvicente.com.ar".
function normalizarDominio(texto) {
  const d = String(texto || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  return d && !d.includes('.') ? d + DOMINIOS.sufijo : d;
}

function dominioLibre(dominio, id = null) {
  return dominio !== DOMINIOS.sitio && !db.prepare('SELECT 1 FROM comercios WHERE dominio = ? AND id IS NOT ?').get(dominio, id);
}

function dominioUnico(slug) {
  let dominio = slug + DOMINIOS.sufijo;
  for (let i = 2; !dominioLibre(dominio); i++) dominio = `${slug}-${i}${DOMINIOS.sufijo}`;
  return dominio;
}

// Link a la landing publicada: con la demo de dominios activa, el dominio propio del comercio.
function urlComercio(c) {
  return DOMINIOS.activo && c.dominio ? `http://${c.dominio}/` : `/c/${c.slug}`;
}

function normalizarCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/\s+/g, '');
}

function soloDigitos(texto) {
  return String(texto || '').replace(/\D/g, '');
}

// Enlaces de contacto a partir de números cargados como "261 555-0101".
function linkWhatsapp(numero, nombreComercio) {
  let d = soloDigitos(numero);
  if (!d) return null;
  if (!d.startsWith('54')) d = `549${d}`;
  const texto = encodeURIComponent(`Hola ${nombreComercio}, los encontré en Vidriera y quería hacer una consulta.`);
  return `https://wa.me/${d}?text=${texto}`;
}

function linkTelefono(numero) {
  let d = soloDigitos(numero);
  if (!d) return null;
  if (!d.startsWith('54')) d = `54${d}`;
  return `tel:+${d}`;
}

// Los formularios mandan un valor suelto o un arreglo según la cantidad de filas.
function comoArreglo(valor) {
  if (valor === undefined || valor === null) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function destacadoVigente(comercio) {
  return Boolean(comercio.destacadoHasta && comercio.destacadoHasta > new Date().toISOString());
}

// Atributos y mensaje de error accesibles para un campo de formulario.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function invalido(errores, campo, ayudaId) {
  const ids = [errores && errores[campo] ? `error-${campo}` : null, ayudaId].filter(Boolean).join(' ');
  const partes = [];
  if (errores && errores[campo]) partes.push('aria-invalid="true"');
  if (ids) partes.push(`aria-describedby="${ids}"`);
  return partes.join(' ');
}

// Para grupos (fieldset), que no admiten aria-invalid.
function describir(errores, campo, ayudaId) {
  const ids = [errores && errores[campo] ? `error-${campo}` : null, ayudaId].filter(Boolean).join(' ');
  return ids ? `aria-describedby="${ids}"` : '';
}

function errorCampo(errores, campo) {
  if (!errores || !errores[campo]) return '';
  return `<small id="error-${campo}" class="error-campo">${escapar(errores[campo])}</small>`;
}

module.exports = {
  invalido,
  describir,
  errorCampo,
  pesos,
  fecha,
  sumarDias,
  normalizar,
  slugUnico,
  nuevoCodigoPreview,
  normalizarCodigo,
  normalizarDominio,
  dominioLibre,
  dominioUnico,
  urlComercio,
  soloDigitos,
  linkWhatsapp,
  linkTelefono,
  comoArreglo,
  destacadoVigente,
};
