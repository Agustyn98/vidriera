const express = require('express');
const { db } = require('../db');
const comercios = require('../comercios');
const operaciones = require('../operaciones');
const pagos = require('../pagos');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

// Vuelta desde el checkout: el servidor verifica el pago con el proveedor antes de aprobar.
router.get('/pagos/retorno/:id', requiereLogin, async (req, res, next) => {
  const usuario = req.session.usuario;
  const operacion = operaciones.obtener(req.params.id);
  if (!operacion || operacion.usuarioId !== usuario.id) return next();

  let resultado = operacion;
  if (operacion.estado === 'pendiente') {
    const verificado = await pagos.verificarPago({ operacion, query: req.query });
    resultado = operaciones.aplicarResultado(operacion.id, verificado);
  }

  if (resultado.estado === 'aprobado') {
    req.session.flash = { tipo: 'exito', texto: '¡Pago aprobado! Este es tu comprobante.' };
    return res.redirect(`/comprobante/${resultado.id}`);
  }
  req.session.flash =
    resultado.estado === 'rechazado'
      ? { tipo: 'error', texto: 'El pago fue rechazado. No se realizó ningún cobro; podés intentarlo de nuevo.' }
      : { tipo: 'aviso', texto: 'El pago todavía no se acreditó. Cuando se apruebe lo vas a ver en tus pagos.' };
  res.redirect('/panel/pagos');
});

// Comprobante: lo ve el comerciante que pagó o un admin.
router.get('/comprobante/:id', requiereLogin, (req, res, next) => {
  const usuario = req.session.usuario;
  const operacion = operaciones.obtener(req.params.id);
  if (!operacion || operacion.estado !== 'aprobado') return next();
  if (usuario.rol !== 'admin' && operacion.usuarioId !== usuario.id) return next();

  const cliente = db.prepare('SELECT nombre, email FROM usuarios WHERE id = ?').get(operacion.usuarioId);
  const comercio = comercios.porId(operacion.comercioId);
  res.render('comprobante', { titulo: `Comprobante ${operacion.nroComprobante}`, operacion, cliente, comercio });
});

module.exports = router;
