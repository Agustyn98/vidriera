// Abre un Chrome aparte que manda todos los *.com.ar a la app local (ver DOMINIOS_DEMO.md).
// Funciona en macOS, Windows y Linux. Al cerrar esa ventana no queda nada configurado.
require('dotenv').config({ quiet: true });

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { DOMINIOS } = require('../src/config');

const PUERTO = Number(process.env.PORT) || 3000;
const PERFIL = path.join(process.platform === 'win32' ? os.tmpdir() : '/tmp', 'vidriera-chrome-demo');

function rutasPosibles() {
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ];
  }
  if (process.platform === 'win32') {
    const carpetas = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA];
    return carpetas.filter(Boolean).map((c) => path.join(c, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  }
  return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
}

const chrome = process.env.CHROME_PATH || rutasPosibles().find((r) => fs.existsSync(r));
if (!chrome) {
  console.error('No encontré Google Chrome. Indicá la ruta con CHROME_PATH en el .env.');
  process.exit(1);
}

const args = [
  `--user-data-dir=${PERFIL}`,
  '--no-first-run',
  '--no-default-browser-check',
  `--host-resolver-rules=MAP *${DOMINIOS.sufijo} 127.0.0.1:${PUERTO}`,
  `http://${DOMINIOS.sitio}`,
];

spawn(chrome, args, { detached: true, stdio: 'ignore' }).unref();
console.log(`Chrome de demo abierto en http://${DOMINIOS.sitio} (app en el puerto ${PUERTO}).`);
