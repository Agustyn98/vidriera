require('dotenv').config({ quiet: true });

const fs = require('fs');
const http = require('http');
const https = require('https');
const { db } = require('./db');
const app = require('./app');

const PUERTO = Number(process.env.PORT) || 3000;

// HTTPS opcional: si .env indica certificado y clave, se sirve por https.
const { HTTPS_CERT, HTTPS_KEY } = process.env;
const servidor =
  HTTPS_CERT && HTTPS_KEY
    ? https.createServer({ cert: fs.readFileSync(HTTPS_CERT), key: fs.readFileSync(HTTPS_KEY) }, app)
    : http.createServer(app);

servidor.listen(PUERTO, () => {
  const protocolo = HTTPS_CERT && HTTPS_KEY ? 'https' : 'http';
  console.log(`Vidriera funcionando en ${protocolo}://localhost:${PUERTO}`);
  console.log(`Modo de pagos: ${process.env.PAGOS_MODO || 'simulado'}`);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get();
  if (!n) console.log('La base está vacía: corré "npm run seed" para cargar los datos de demo.');
});
