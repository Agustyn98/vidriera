const express = require('express');
const { db, parsearComercio } = require('../db');
const comercios = require('../comercios');
const subidas = require('../subidas');
const { slugUnico, nuevoCodigoPreview } = require('../helpers');
const { soloAdmin } = require('../middleware/auth');

const router = express.Router();
router.use('/admin', soloAdmin);

// Datos de ejemplo para crear una vista previa rápido durante la demo.
const EJEMPLO = {
  nombre: 'Heladería Cordillera',
  rubro: 'gastronomia',
  zona: 'maipu',
  plantilla: 'clasica',
  descripcion:
    'Helados artesanales elaborados todos los días con leche de tambo mendocino y frutas de estación. Sabores clásicos, al agua y opciones sin TACC.',
  whatsapp: '261 555-0190',
  telefono: '261 555-0191',
  direccion: 'Padre Vázquez 520, Maipú',
  horarios: [
    { dias: 'Martes a domingo', horas: '14 a 23' },
    { dias: 'Lunes', horas: 'Cerrado' },
  ],
  fotos: ['/img/comercios/heladeria-cordillera-1.jpg', '/img/comercios/heladeria-cordillera-2.jpg'],
  productos: [
    { nombre: 'Cucurucho 2 sabores', precio: 4500 },
    { nombre: 'Cuarto kilo', precio: 7000 },
    { nombre: 'Kilo', precio: 22000 },
  ],
};

const ORDEN_ESTADOS = { pendiente_revision: 0, vista_previa: 1, publicado: 2, suspendido: 3 };

router.get('/admin', (req, res) => res.redirect('/admin/comercios'));

router.get('/admin/comercios', (req, res) => {
  const lista = db
    .prepare(
      `SELECT c.*, u.nombre AS duenoNombre, u.email AS duenoEmail
       FROM comercios c LEFT JOIN usuarios u ON u.id = c.duenoId`
    )
    .all()
    .map(parsearComercio)
    .sort((a, b) => ORDEN_ESTADOS[a.estado] - ORDEN_ESTADOS[b.estado] || b.id - a.id);
  res.render('admin/comercios', { titulo: 'Administrar comercios', comercios: lista });
});

router.get('/admin/comercios/nuevo', (req, res) => {
  const valores = req.query.ejemplo ? EJEMPLO : { plantilla: 'clasica', horarios: [], fotos: [], productos: [] };
  res.render('admin/comercio-form', { titulo: 'Nueva vista previa', comercio: null, valores, errores: {} });
});

router.post('/admin/comercios/nuevo', subidas.recibirFotos, (req, res) => {
  const { datos, errores } = comercios.leerFormulario(req.body, { completo: true, subidas: subidas.deRequest(req) });
  if (Object.keys(errores).length) {
    return res
      .status(400)
      .render('admin/comercio-form', { titulo: 'Nueva vista previa', comercio: null, valores: datos, errores });
  }
  const comercio = comercios.crear({ ...datos, slug: slugUnico(datos.nombre), previewToken: nuevoCodigoPreview() });
  req.session.flash = {
    tipo: 'exito',
    texto: `Vista previa de «${comercio.nombre}» creada. Código para el comerciante: ${comercio.previewToken}.`,
  };
  res.redirect(`/admin/comercios#comercio-${comercio.id}`);
});

router.get('/admin/comercios/:id', (req, res, next) => {
  const comercio = comercios.porId(req.params.id);
  if (!comercio) return next();
  res.render('admin/comercio-form', { titulo: `Editar ${comercio.nombre}`, comercio, valores: comercio, errores: {} });
});

router.post('/admin/comercios/:id', subidas.recibirFotos, (req, res, next) => {
  const comercio = comercios.porId(req.params.id);
  if (!comercio) return next();
  const { datos, errores } = comercios.leerFormulario(req.body, { completo: true, subidas: subidas.deRequest(req) });
  if (Object.keys(errores).length) {
    return res.status(400).render('admin/comercio-form', {
      titulo: `Editar ${comercio.nombre}`,
      comercio,
      valores: { ...comercio, ...datos },
      errores,
    });
  }
  comercios.actualizar(comercio.id, datos);
  req.session.flash = { tipo: 'exito', texto: `Se guardaron los cambios de «${datos.nombre}».` };
  res.redirect(`/admin/comercios#comercio-${comercio.id}`);
});

// Cambios de estado permitidos para el admin.
const TRANSICIONES = {
  publicar: { desde: ['pendiente_revision', 'suspendido'], hacia: 'publicado', texto: 'publicado' },
  suspender: { desde: ['publicado'], hacia: 'suspendido', texto: 'suspendido' },
};

router.post('/admin/comercios/:id/:accion', (req, res, next) => {
  const t = TRANSICIONES[req.params.accion];
  const comercio = comercios.porId(req.params.id);
  if (!t || !comercio) return next();
  if (!t.desde.includes(comercio.estado)) {
    req.session.flash = { tipo: 'error', texto: `«${comercio.nombre}» no se puede ${req.params.accion} en su estado actual.` };
  } else {
    comercios.actualizar(comercio.id, { estado: t.hacia });
    req.session.flash = { tipo: 'exito', texto: `«${comercio.nombre}» fue ${t.texto}.` };
  }
  res.redirect(`/admin/comercios#comercio-${comercio.id}`);
});

router.get('/admin/operaciones', (req, res) => {
  const lista = db
    .prepare(
      `SELECT o.*, c.nombre AS comercioNombre, u.nombre AS usuarioNombre, u.email AS usuarioEmail
       FROM operaciones o
       JOIN comercios c ON c.id = o.comercioId
       JOIN usuarios u ON u.id = o.usuarioId
       ORDER BY o.id DESC`
    )
    .all();
  const totalAprobado = lista.filter((o) => o.estado === 'aprobado').reduce((s, o) => s + o.importe, 0);
  res.render('admin/operaciones', { titulo: 'Operaciones', operaciones: lista, totalAprobado });
});

module.exports = router;
