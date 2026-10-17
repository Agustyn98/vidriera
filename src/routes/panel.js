const express = require('express');
const { db } = require('../db');
const comercios = require('../comercios');
const operaciones = require('../operaciones');
const pagos = require('../pagos');
const { reclamar } = require('../reclamo');
const { soloComerciante } = require('../middleware/auth');

const router = express.Router();
router.use('/panel', soloComerciante);

router.get('/panel', (req, res) => {
  const lista = comercios.delUsuario(req.session.usuario.id).map((c) => ({
    ...c,
    mantenimientoHasta: operaciones.mantenimientoHasta(c.id),
  }));
  res.render('panel/index', { titulo: 'Mi panel', comercios: lista, codigo: '' });
});

router.post('/panel/reclamar', (req, res) => {
  const r = reclamar(req.body.codigo, req.session.usuario.id);
  req.session.flash = { tipo: r.ok ? 'exito' : 'error', texto: r.mensaje };
  res.redirect('/panel');
});

router.get('/panel/comercio/:id', (req, res, next) => {
  const comercio = comercios.delDueno(req.params.id, req.session.usuario.id);
  if (!comercio) return next(); // 404: no existe o no es suyo
  res.render('panel/comercio', { titulo: `Editar ${comercio.nombre}`, comercio, valores: comercio, errores: {} });
});

router.post('/panel/comercio/:id', (req, res, next) => {
  const comercio = comercios.delDueno(req.params.id, req.session.usuario.id);
  if (!comercio) return next();
  const { datos, errores } = comercios.leerFormulario(req.body, { completo: false });
  if (Object.keys(errores).length) {
    return res.status(400).render('panel/comercio', {
      titulo: `Editar ${comercio.nombre}`,
      comercio,
      valores: { ...comercio, ...datos },
      errores,
    });
  }
  comercios.actualizar(comercio.id, datos);
  req.session.flash = { tipo: 'exito', texto: 'Los cambios se guardaron correctamente.' };
  res.redirect('/panel');
});

// Contratar un servicio: crea la operación con el precio del servidor y redirige al checkout.
router.post('/panel/comercio/:id/contratar', async (req, res, next) => {
  const usuario = req.session.usuario;
  const comercio = comercios.delDueno(req.params.id, usuario.id);
  if (!comercio) return next();
  const servicio = String(req.body.servicio || '');
  const motivo = operaciones.motivoNoContratable(comercio, servicio);
  if (motivo) {
    req.session.flash = { tipo: 'error', texto: motivo };
    return res.redirect('/panel');
  }
  const operacion = operaciones.crear({ usuarioId: usuario.id, comercioId: comercio.id, servicio });
  const { url } = await pagos.crearPago({
    operacion,
    comercio,
    usuario,
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
  res.redirect(url);
});

router.get('/panel/pagos', (req, res) => {
  const lista = db
    .prepare(
      `SELECT o.*, c.nombre AS comercioNombre FROM operaciones o
       JOIN comercios c ON c.id = o.comercioId
       WHERE o.usuarioId = ? ORDER BY o.id DESC`
    )
    .all(req.session.usuario.id);
  res.render('panel/pagos', { titulo: 'Mis pagos', operaciones: lista });
});

module.exports = router;
