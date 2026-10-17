const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { reclamar } = require('../reclamo');
const { normalizarCodigo } = require('../helpers');

const router = express.Router();
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function iniciarSesion(req, usuario) {
  return new Promise((resolve, reject) => {
    // Nueva sesión al ingresar, para evitar fijación de sesión.
    const volverA = req.session.volverA;
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
      resolve(volverA);
    });
  });
}

const inicioSegunRol = (rol) => (rol === 'admin' ? '/admin/comercios' : '/panel');
const esRutaLocal = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');

router.get('/login', (req, res) => {
  if (req.session.usuario) return res.redirect(inicioSegunRol(req.session.usuario.rol));
  res.render('login', { titulo: 'Ingresar', valores: {}, errores: {} });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  const errores = {};
  if (!email) errores.email = 'Ingresá tu email o usuario.';
  if (!password) errores.password = 'Ingresá tu contraseña.';

  if (!Object.keys(errores).length) {
    // Atajo para las cuentas de demo: "admin" equivale a "admin@vidriera.com.ar".
    const buscado = email.includes('@') ? email : `${email}@vidriera.com.ar`;
    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(buscado);
    if (usuario && (await bcrypt.compare(password, usuario.passwordHash))) {
      const volverA = await iniciarSesion(req, usuario);
      req.session.flash = { tipo: 'exito', texto: `¡Hola, ${usuario.nombre}!` };
      return res.redirect(esRutaLocal(volverA) ? volverA : inicioSegunRol(usuario.rol));
    }
    errores.general = 'El usuario o la contraseña no son correctos.';
  }
  res.status(400).render('login', { titulo: 'Ingresar', valores: { email }, errores });
});

router.get('/registro', (req, res) => {
  if (req.session.usuario) return res.redirect(inicioSegunRol(req.session.usuario.rol));
  res.render('registro', {
    titulo: 'Crear cuenta',
    valores: { codigo: normalizarCodigo(req.query.codigo) },
    errores: {},
  });
});

router.post('/registro', async (req, res) => {
  const valores = {
    nombre: String(req.body.nombre || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    codigo: normalizarCodigo(req.body.codigo),
  };
  const password = String(req.body.password || '');
  const confirmacion = String(req.body.confirmacion || '');
  const errores = {};

  if (valores.nombre.length < 2 || valores.nombre.length > 60) errores.nombre = 'Ingresá tu nombre (de 2 a 60 caracteres).';
  if (!EMAIL_VALIDO.test(valores.email)) errores.email = 'Ingresá un email válido, por ejemplo nombre@correo.com.';
  else if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(valores.email)) {
    errores.email = 'Ya existe una cuenta con ese email. Probá ingresar.';
  }
  if (password.length < 8 || !/\d/.test(password) || !/[a-z]/i.test(password)) {
    errores.password = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
  }
  if (password !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden.';

  if (Object.keys(errores).length) {
    return res.status(400).render('registro', { titulo: 'Crear cuenta', valores, errores });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare(`INSERT INTO usuarios (nombre, email, passwordHash, rol) VALUES (?, ?, ?, 'comerciante')`)
    .run(valores.nombre, valores.email, passwordHash);
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  await iniciarSesion(req, usuario);

  let texto = 'Tu cuenta fue creada.';
  let tipo = 'exito';
  if (valores.codigo) {
    const r = reclamar(valores.codigo, usuario.id);
    if (r.ok) texto += ` ${r.mensaje}`;
    else {
      tipo = 'aviso';
      texto += ` Pero no pudimos asociar el comercio: ${r.mensaje}`;
    }
  }
  req.session.flash = { tipo, texto };
  res.redirect('/panel');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
