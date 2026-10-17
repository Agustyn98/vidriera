// Acceso a datos y validación de comercios.

const { db, parsearComercio } = require('./db');
const { RUBROS, ZONAS, PLANTILLAS, DOMINIOS } = require('./config');
const { comoArreglo, normalizar, destacadoVigente, soloDigitos, normalizarDominio, dominioLibre } = require('./helpers');

const porId = (id) => parsearComercio(db.prepare('SELECT * FROM comercios WHERE id = ?').get(id));
const porSlug = (slug) => parsearComercio(db.prepare('SELECT * FROM comercios WHERE slug = ?').get(slug));
const porDominio = (dominio) => parsearComercio(db.prepare('SELECT * FROM comercios WHERE dominio = ?').get(dominio));
const porToken = (token) => parsearComercio(db.prepare('SELECT * FROM comercios WHERE previewToken = ?').get(token));

// Un comercio del dueño indicado, o null (así nunca se accede a uno ajeno).
const delDueno = (id, duenoId) =>
  parsearComercio(db.prepare('SELECT * FROM comercios WHERE id = ? AND duenoId = ?').get(id, duenoId));

const delUsuario = (duenoId) =>
  db.prepare('SELECT * FROM comercios WHERE duenoId = ? ORDER BY id DESC').all(duenoId).map(parsearComercio);

// Directorio: solo publicados, primero los destacados vigentes.
function publicados({ q = '', rubro = '', zona = '' } = {}) {
  const texto = normalizar(q);
  return db
    .prepare(`SELECT * FROM comercios WHERE estado = 'publicado'`)
    .all()
    .map(parsearComercio)
    .filter((c) => !rubro || c.rubro === rubro)
    .filter((c) => !zona || c.zona === zona)
    .filter((c) => {
      if (!texto) return true;
      const rubroNombre = (RUBROS.find((r) => r.id === c.rubro) || {}).nombre;
      const zonaNombre = (ZONAS.find((z) => z.id === c.zona) || {}).nombre;
      const productos = c.productos.map((p) => p.nombre).join(' ');
      return normalizar([c.nombre, c.descripcion, rubroNombre, zonaNombre, productos].join(' ')).includes(texto);
    })
    .map((c) => ({ ...c, destacado: destacadoVigente(c) }))
    .sort((a, b) => b.destacado - a.destacado || a.nombre.localeCompare(b.nombre, 'es'));
}

const MAX_FILAS = 20;

// Lee y valida el formulario. `completo` = campos que solo edita el admin; `subidas` = fotos recién subidas;
// `id` = comercio que se edita (al crear no hay, y el dominio vacío se arma después con el nombre).
function leerFormulario(body, { completo, subidas = { urls: [], error: null }, id = null }) {
  const errores = {};
  const txt = (campo) => String(body[campo] || '').trim();

  const datos = {
    descripcion: txt('descripcion'),
    whatsapp: txt('whatsapp'),
    telefono: txt('telefono'),
    direccion: txt('direccion'),
  };

  if (completo) {
    datos.nombre = txt('nombre');
    datos.rubro = txt('rubro');
    datos.zona = txt('zona');
    datos.plantilla = txt('plantilla');
    if (datos.nombre.length < 2 || datos.nombre.length > 80) errores.nombre = 'Ingresá un nombre de 2 a 80 caracteres.';
    if (!RUBROS.some((r) => r.id === datos.rubro)) errores.rubro = 'Elegí un rubro de la lista.';
    if (!ZONAS.some((z) => z.id === datos.zona)) errores.zona = 'Elegí una zona de la lista.';
    if (!PLANTILLAS.some((p) => p.id === datos.plantilla)) errores.plantilla = 'Elegí una plantilla.';
  }

  datos.dominio = normalizarDominio(body.dominio);
  if (!datos.dominio) {
    if (id) errores.dominio = `Elegí la dirección web de tu página, por ejemplo tucomercio${DOMINIOS.sufijo}.`;
    else delete datos.dominio;
  } else if (!new RegExp(`^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?${DOMINIOS.sufijo.replaceAll('.', '\\.')}$`).test(datos.dominio)) {
    errores.dominio = `La dirección tiene que terminar en ${DOMINIOS.sufijo} y usar solo letras, números y guiones, por ejemplo donvicente${DOMINIOS.sufijo}.`;
  } else if (!dominioLibre(datos.dominio, id)) {
    errores.dominio = `La dirección ${datos.dominio} ya está en uso. Probá con otra.`;
  }

  if (datos.descripcion.length < 20) errores.descripcion = 'Escribí una descripción de al menos 20 caracteres.';
  else if (datos.descripcion.length > 600) errores.descripcion = 'La descripción puede tener hasta 600 caracteres.';

  for (const campo of ['whatsapp', 'telefono']) {
    const d = soloDigitos(datos[campo]);
    if (datos[campo] && (d.length < 10 || d.length > 13 || /[^\d\s()+-]/.test(datos[campo]))) {
      errores[campo] = 'Ingresá el número con código de área, por ejemplo 261 555-0101.';
    }
  }
  if (!datos.whatsapp && !datos.telefono && !errores.whatsapp) {
    errores.whatsapp = 'Cargá al menos un WhatsApp o un teléfono para que te puedan contactar.';
  }
  if (datos.direccion.length > 120) errores.direccion = 'La dirección puede tener hasta 120 caracteres.';

  // Productos: filas de nombre + precio. Las filas vacías se ignoran.
  const nombres = comoArreglo(body.productoNombre);
  const precios = comoArreglo(body.productoPrecio);
  datos.productos = [];
  for (let i = 0; i < Math.max(nombres.length, precios.length); i++) {
    const nombre = String(nombres[i] || '').trim();
    const precioTxt = String(precios[i] || '').trim().replace(/[$.\s]/g, '').replace(',', '.');
    if (!nombre && !precioTxt) continue;
    const precio = Number(precioTxt);
    if (!nombre || nombre.length > 80) errores.productos = `Revisá el producto ${i + 1}: le falta el nombre o es muy largo.`;
    else if (precioTxt === '' || !Number.isFinite(precio) || precio < 0) {
      errores.productos = `Revisá el precio del producto ${i + 1}: tiene que ser un número, por ejemplo 12500.`;
    }
    datos.productos.push({ nombre, precio: Number.isFinite(precio) ? Math.round(precio) : precioTxt });
  }

  // Horarios: filas de días + horario.
  const dias = comoArreglo(body.horarioDias);
  const horas = comoArreglo(body.horarioHoras);
  datos.horarios = [];
  for (let i = 0; i < Math.max(dias.length, horas.length); i++) {
    const d = String(dias[i] || '').trim();
    const h = String(horas[i] || '').trim();
    if (!d && !h) continue;
    if (!d || !h || d.length > 60 || h.length > 60) {
      errores.horarios = `Completá los días y el horario de la fila ${i + 1}.`;
    }
    datos.horarios.push({ dias: d, horas: h });
  }

  // Fotos: URLs ya cargadas (locales, por ejemplo /img/comercios/… o /uploads/…, o links https://) más las recién subidas.
  datos.fotos = comoArreglo(body.fotos)
    .map((u) => String(u).trim())
    .filter(Boolean)
    .concat(subidas.urls);
  if (subidas.error) errores.fotos = subidas.error;
  else if (datos.fotos.some((u) => !/^(\/[\w\-./]+|https?:\/\/\S+)$/i.test(u) || u.length > 300)) {
    errores.fotos = 'Cada foto tiene que ser una dirección web (https://…) o una imagen de la lista.';
  }

  if (datos.productos.length > MAX_FILAS || datos.horarios.length > MAX_FILAS || datos.fotos.length > MAX_FILAS) {
    errores.general = `Se pueden cargar hasta ${MAX_FILAS} filas de productos, horarios o fotos.`;
  }

  return { datos, errores };
}

function actualizar(id, datos) {
  const campos = { ...datos };
  for (const k of ['productos', 'horarios', 'fotos']) if (campos[k]) campos[k] = JSON.stringify(campos[k]);
  const columnas = Object.keys(campos);
  db.prepare(`UPDATE comercios SET ${columnas.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`).run({
    ...campos,
    id,
  });
}

function crear(datos) {
  const fila = {
    duenoId: null,
    estado: 'vista_previa',
    destacadoHasta: null,
    ...datos,
    productos: JSON.stringify(datos.productos || []),
    horarios: JSON.stringify(datos.horarios || []),
    fotos: JSON.stringify(datos.fotos || []),
  };
  const columnas = Object.keys(fila);
  const info = db
    .prepare(`INSERT INTO comercios (${columnas.join(', ')}) VALUES (${columnas.map((c) => '@' + c).join(', ')})`)
    .run(fila);
  return porId(info.lastInsertRowid);
}

module.exports = {
  porId,
  porSlug,
  porDominio,
  porToken,
  delDueno,
  delUsuario,
  publicados,
  leerFormulario,
  actualizar,
  crear,
};
