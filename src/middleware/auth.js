// Protección de rutas por rol, siempre del lado del servidor.

function requiereLogin(req, res, next) {
  if (req.session.usuario) return next();
  if (req.method === 'GET') req.session.volverA = req.originalUrl;
  req.session.flash = { tipo: 'info', texto: 'Iniciá sesión para continuar.' };
  return res.redirect('/login');
}

function requiereRol(rol) {
  return (req, res, next) =>
    requiereLogin(req, res, () => {
      if (req.session.usuario.rol === rol) return next();
      return res.status(403).render('error', {
        titulo: 'Acceso denegado',
        mensaje: 'Tu usuario no tiene permiso para ver esta página.',
      });
    });
}

module.exports = {
  requiereLogin,
  soloAdmin: requiereRol('admin'),
  soloComerciante: requiereRol('comerciante'),
};
