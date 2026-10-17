// Reglas de negocio de las operaciones (contrataciones y pagos).
// No sabe nada del proveedor de pagos: recibe el resultado ya verificado.

const { db } = require('./db');
const { SERVICIOS, DIAS_VIGENCIA } = require('./config');
const { sumarDias } = require('./helpers');

const buscar = db.prepare('SELECT * FROM operaciones WHERE id = ?');

function obtener(id) {
  return buscar.get(id);
}

// Devuelve un mensaje de error si el comercio no puede contratar ese servicio, o null si puede.
function motivoNoContratable(comercio, servicio) {
  if (!SERVICIOS[servicio]) return 'Servicio inexistente.';
  if (servicio === 'landing' && comercio.estado !== 'vista_previa') {
    return 'La Landing Profesional ya fue contratada para este comercio.';
  }
  if ((servicio === 'abono' || servicio === 'destacado') && comercio.estado !== 'publicado') {
    return 'Este servicio requiere que la landing esté publicada.';
  }
  return null;
}

function crear({ usuarioId, comercioId, servicio }) {
  const importe = SERVICIOS[servicio].importe; // el precio lo pone el backend
  const info = db
    .prepare(
      `INSERT INTO operaciones (usuarioId, comercioId, servicio, importe, estado, fecha)
       VALUES (?, ?, ?, ?, 'pendiente', ?)`
    )
    .run(usuarioId, comercioId, servicio, importe, new Date().toISOString());
  return obtener(info.lastInsertRowid);
}

function siguienteComprobante() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM operaciones WHERE nroComprobante IS NOT NULL').get();
  return `0001-${String(n + 1).padStart(8, '0')}`;
}

// Aplica el resultado verificado de un pago. Es idempotente: si la operación
// ya no está pendiente (por ejemplo, ya fue aprobada), no hace nada.
const aplicarResultado = db.transaction((id, { estado, mpPaymentId, medio }) => {
  const op = obtener(id);
  if (!op || op.estado !== 'pendiente' || estado === 'pendiente') return op;

  const ahora = new Date();
  if (estado !== 'aprobado') {
    db.prepare(`UPDATE operaciones SET estado = 'rechazado', mpPaymentId = ?, medio = ?, fecha = ? WHERE id = ?`).run(
      mpPaymentId || null,
      medio || null,
      ahora.toISOString(),
      id
    );
    return obtener(id);
  }

  db.prepare(
    `UPDATE operaciones SET estado = 'aprobado', mpPaymentId = ?, medio = ?, nroComprobante = ?, fecha = ? WHERE id = ?`
  ).run(mpPaymentId || null, medio || null, siguienteComprobante(), ahora.toISOString(), id);

  if (op.servicio === 'landing') {
    db.prepare(`UPDATE comercios SET estado = 'pendiente_revision' WHERE id = ? AND estado = 'vista_previa'`).run(
      op.comercioId
    );
  } else if (op.servicio === 'destacado') {
    const comercio = db.prepare('SELECT destacadoHasta FROM comercios WHERE id = ?').get(op.comercioId);
    const desde =
      comercio.destacadoHasta && new Date(comercio.destacadoHasta) > ahora ? comercio.destacadoHasta : ahora;
    db.prepare('UPDATE comercios SET destacadoHasta = ? WHERE id = ?').run(
      sumarDias(desde, DIAS_VIGENCIA).toISOString(),
      op.comercioId
    );
  }
  return obtener(id);
});

// Fecha hasta la que está pago el mantenimiento: la Landing incluye el primer mes
// y cada abono aprobado suma 30 días más.
function mantenimientoHasta(comercioId) {
  const pagos = db
    .prepare(
      `SELECT fecha FROM operaciones
       WHERE comercioId = ? AND estado = 'aprobado' AND servicio IN ('landing', 'abono')
       ORDER BY fecha`
    )
    .all(comercioId);
  let hasta = null;
  for (const { fecha } of pagos) {
    const base = hasta && hasta > new Date(fecha) ? hasta : new Date(fecha);
    hasta = sumarDias(base, DIAS_VIGENCIA);
  }
  return hasta;
}

module.exports = { obtener, crear, motivoNoContratable, aplicarResultado, mantenimientoHasta };
