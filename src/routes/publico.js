const express = require('express');
const comercios = require('../comercios');
const { RUBROS, ZONAS } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const destacados = comercios.publicados().filter((c) => c.destacado);
  res.render('inicio', { titulo: 'Inicio', destacados });
});

router.get('/directorio', (req, res) => {
  const filtros = {
    q: String(req.query.q || '').trim().slice(0, 80),
    rubro: RUBROS.some((r) => r.id === req.query.rubro) ? req.query.rubro : '',
    zona: ZONAS.some((z) => z.id === req.query.zona) ? req.query.zona : '',
  };
  const resultados = comercios.publicados(filtros);
  res.render('directorio', { titulo: 'Directorio de comercios', filtros, resultados });
});

router.get('/c/:slug', (req, res, next) => {
  const comercio = comercios.porSlug(req.params.slug);
  if (!comercio || comercio.estado !== 'publicado') return next();
  res.render('landing', { titulo: comercio.nombre, comercio, preview: false });
});

router.get('/preview/:token', (req, res, next) => {
  const comercio = comercios.porToken(String(req.params.token).toUpperCase());
  if (!comercio || comercio.estado === 'suspendido') return next();
  if (comercio.estado === 'publicado') return res.redirect(`/c/${comercio.slug}`);
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.render('landing', { titulo: `Vista previa: ${comercio.nombre}`, comercio, preview: true, noindex: true });
});

module.exports = router;
