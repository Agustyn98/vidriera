// El comerciante ingresa el código de su vista previa y el comercio pasa a ser suyo.

const { db } = require('./db');
const { normalizarCodigo } = require('./helpers');

function reclamar(codigoIngresado, usuarioId) {
  const codigo = normalizarCodigo(codigoIngresado);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo)) {
    return { ok: false, mensaje: 'El código tiene el formato XXXX-XXXX (por ejemplo DEMO-2026).' };
  }
  const comercio = db.prepare('SELECT * FROM comercios WHERE previewToken = ?').get(codigo);
  if (!comercio) return { ok: false, mensaje: 'No encontramos una vista previa con ese código.' };
  if (comercio.duenoId === usuarioId) return { ok: false, mensaje: `«${comercio.nombre}» ya está en tu cuenta.` };
  if (comercio.duenoId || comercio.estado !== 'vista_previa') {
    return { ok: false, mensaje: 'Ese comercio ya fue reclamado. Si es tuyo, escribinos a soporte.' };
  }
  const r = db
    .prepare('UPDATE comercios SET duenoId = ? WHERE id = ? AND duenoId IS NULL')
    .run(usuarioId, comercio.id);
  if (!r.changes) return { ok: false, mensaje: 'Ese comercio ya fue reclamado.' };
  return { ok: true, mensaje: `«${comercio.nombre}» ahora está asociado a tu cuenta.`, comercioId: comercio.id };
}

module.exports = { reclamar };
