// Fotos subidas desde el formulario de comercio. Se guardan en la carpeta uploads/ y se sirven en /uploads.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const DIR_SUBIDAS = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(DIR_SUBIDAS, { recursive: true });

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_MB = 5;
const MAX_ARCHIVOS = 10;

const subir = multer({
  storage: multer.diskStorage({
    destination: DIR_SUBIDAS,
    filename: (req, archivo, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXTENSIONES[archivo.mimetype]),
  }),
  // Los archivos que no son imágenes se ignoran (y se avisa en el formulario).
  fileFilter: (req, archivo, cb) => {
    const ok = Boolean(EXTENSIONES[archivo.mimetype]);
    if (!ok && archivo.originalname) req.fotosRechazadas = true;
    cb(null, ok);
  },
  limits: { fileSize: MAX_MB * 1024 * 1024, files: MAX_ARCHIVOS },
}).array('fotosNuevas', MAX_ARCHIVOS);

const MENSAJES = {
  LIMIT_FILE_SIZE: `Cada foto puede pesar hasta ${MAX_MB} MB.`,
  LIMIT_FILE_COUNT: `Se pueden subir hasta ${MAX_ARCHIVOS} fotos por vez.`,
};

// Middleware: procesa el formulario multipart. Un error de subida no corta el pedido: queda en req.errorFotos.
function recibirFotos(req, res, next) {
  subir(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      req.errorFotos = MENSAJES[err.code] || 'No se pudieron subir las fotos. Probá de nuevo.';
      req.files = [];
      return next();
    }
    if (!err && req.fotosRechazadas) req.errorFotos = 'Solo se pueden subir imágenes JPG, PNG, WebP o GIF.';
    next(err);
  });
}

// URLs públicas de las fotos recién subidas y el error de subida, si hubo.
const deRequest = (req) => ({
  urls: (req.files || []).map((f) => `/uploads/${f.filename}`),
  error: req.errorFotos || null,
});

module.exports = { DIR_SUBIDAS, recibirFotos, deRequest };
