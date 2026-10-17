const path = require('path');
const express = require('express');
const session = require('express-session');

const config = require('./config');
const helpers = require('./helpers');
const pagos = require('./pagos');
const { DIR_SUBIDAS } = require('./subidas');

const app = express();
const RAIZ = path.join(__dirname, '..');

app.set('view engine', 'ejs');
app.set('views', path.join(RAIZ, 'views'));
app.disable('x-powered-by');

app.use(express.static(path.join(RAIZ, 'public')));
app.use('/uploads', express.static(DIR_SUBIDAS));
app.use('/vendor/pico', express.static(path.join(RAIZ, 'node_modules', '@picocss', 'pico', 'css')));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vidriera-solo-para-desarrollo',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: Boolean(process.env.HTTPS_CERT),
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// Variables disponibles en todas las vistas.
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.ruta = req.path;
  res.locals.cfg = config;
  const conDominio = helpers.enDominios(req);
  res.locals.h = { ...helpers, urlComercio: (c) => helpers.urlComercio(c, conDominio) };
  res.locals.modoPagos = pagos.modo;
  res.locals.noindex = false;
  next();
});

app.use(require('./routes/publico'));
app.use(require('./routes/auth'));
app.use(require('./routes/panel'));
app.use(require('./routes/admin'));
app.use(require('./routes/pagos'));
if (pagos.router) app.use(pagos.router);

app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensaje: 'La página que buscás no existe o ya no está disponible.',
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('error', {
    titulo: 'Ocurrió un error',
    mensaje: 'Algo salió mal de nuestro lado. Probá de nuevo en unos minutos.',
  });
});

module.exports = app;
