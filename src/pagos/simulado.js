// Proveedor de pagos simulado: imita un checkout externo sin credenciales ni cobros reales.
// Guarda en memoria las "preferencias" y los "pagos" como lo haría el proveedor real,
// así la verificación del servidor funciona igual que con Mercado Pago.

const crypto = require('crypto');
const express = require('express');
const { SERVICIOS } = require('../config');

const MEDIOS = {
  credito: 'Tarjeta de crédito',
  debito: 'Tarjeta de débito',
  cuenta: 'Dinero en cuenta',
};

const preferencias = new Map(); // id -> { operacionId, titulo, comercio, importe, volverA }
const pagos = new Map(); // id -> { operacionId, estado, medio }

async function crearPago({ operacion, comercio, baseUrl }) {
  const id = crypto.randomUUID();
  preferencias.set(id, {
    operacionId: operacion.id,
    titulo: SERVICIOS[operacion.servicio].nombre,
    comercio: comercio.nombre,
    importe: operacion.importe,
    volverA: `${baseUrl}/pagos/retorno/${operacion.id}`,
  });
  return { url: `/checkout-simulado/${id}` };
}

async function verificarPago({ operacion, query }) {
  const pago = pagos.get(String(query.payment_id || ''));
  if (!pago || pago.operacionId !== operacion.id) return { estado: 'pendiente' };
  return { estado: pago.estado, mpPaymentId: query.payment_id, medio: `${pago.medio} (pago simulado)` };
}

const router = express.Router();

router.get('/checkout-simulado/:id', (req, res) => {
  const pref = preferencias.get(req.params.id);
  if (!pref) {
    return res.status(404).render('error', {
      titulo: 'Pago no encontrado',
      mensaje: 'El link de pago venció o no existe. Volvé a tu panel e intentá de nuevo.',
    });
  }
  res.render('pagos/checkout-simulado', { titulo: 'Checkout de prueba', pref, prefId: req.params.id, MEDIOS });
});

router.post('/checkout-simulado/:id', (req, res) => {
  const pref = preferencias.get(req.params.id);
  if (!pref) return res.redirect('/panel');
  const aprobado = req.body.accion === 'pagar';
  const medio = MEDIOS[req.body.medio] || MEDIOS.credito;
  const paymentId = `SIM-${Date.now()}${crypto.randomInt(100, 999)}`;
  pagos.set(paymentId, { operacionId: pref.operacionId, estado: aprobado ? 'aprobado' : 'rechazado', medio });
  preferencias.delete(req.params.id);
  const params = new URLSearchParams({
    payment_id: paymentId,
    status: aprobado ? 'approved' : 'rejected',
    external_reference: String(pref.operacionId),
  });
  res.redirect(`${pref.volverA}?${params}`);
});

module.exports = { crearPago, verificarPago, router };
