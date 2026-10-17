# Vidriera

Landing pages y directorio de comercios del Gran Mendoza. App del TP3 de Comercialización de Servicios.

## Cómo arrancar la app

Requisito: Node.js 20 o superior. Los mismos comandos sirven en macOS, Windows y Linux, desde la carpeta `vidriera`:

```bash
npm install       # solo la primera vez
npm run seed      # carga los datos de demo (borra la base)
npm start         # abrí http://localhost:3000
```

Usuarios: `admin` / `admin` y `comercio` / `comercio`.

Opcional, para ver cada comercio en su propio dominio (por ejemplo `http://donvicente.com.ar`): con la app andando, en otra terminal:

```bash
npm run chrome-demo
```

Node + Express + EJS, SQLite (`vidriera.db`), sesiones con contraseñas cifradas con bcrypt y Pico.css (servido localmente, así la demo no depende de internet).

Las fotos que se suben desde el formulario de un comercio se guardan en la carpeta `uploads/` (no se versiona). Las fotos de los comercios de demo están en `public/img/comercios/` (créditos en `CREDITOS.md`).

## Configuración

No hace falta un `.env`: todo tiene valores por defecto. Para cambiar el puerto, el modo de pagos o activar HTTPS, copiá `.env.example` como `.env` y editalo.

Para volver la demo a cero, repetí `npm run seed` (si el servidor está corriendo, reinicialo también, porque las sesiones viven en memoria).

## Usuarios de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | admin | admin |
| Comerciante | comercio | comercio |

En el login se puede escribir solo el usuario o el email completo (`admin@vidriera.com.ar`, `comercio@vidriera.com.ar`). Las cuentas nuevas que se registran sí tienen que usar una contraseña de al menos 8 caracteres, con letras y números.

El seed carga 10 comercios publicados (Pizzería Don Vicente y Vinoteca El Lagar están destacados) y **Panadería La Espiga**, en Vista Previa y sin dueño, con el código **DEMO-2026**.

## Guion de la demo (unos 10 minutos)

Conviene usar dos ventanas: una normal para el admin y una de incógnito para el comerciante.

1. **Inicio** (`/`): misión, visión y compromiso, servicios con precios y comercios destacados.
2. **Directorio** (`/directorio`): buscar «pizza» o filtrar por rubro y zona. Los destacados aparecen primero. Abrir una landing y mostrar los botones de WhatsApp y Llamar.
3. **Admin crea la vista previa** (paso 1): ingresar como admin y, en *Comercios*, usar *Nueva con datos de ejemplo* y luego *Crear vista previa*. Se genera un código y el botón *Copiar link*.
   Para ir más rápido, el resto del guion usa la vista previa del seed, `/preview/DEMO-2026`.
4. **El comerciante ve su vista previa** (paso 2): abrir `http://localhost:3000/preview/DEMO-2026` y mostrar el cartel de «Vista previa». Ese comercio no figura en el directorio.
5. **Reclamar el comercio** (paso 3): ingresar como comerciante y escribir `DEMO-2026` en *Reclamar un comercio*.
   Otra opción es registrar un usuario nuevo desde el link del cartel: el código ya viene cargado.
   Si quieren, editar algún producto o el horario desde *Editar datos*.
6. **Contratar y pagar** (pasos 4 y 5): tocar *Contratar Landing Profesional · $ 50.000*, que lleva al checkout simulado. Elegir un medio y tocar *Pagar*. El servidor verifica el pago y el comercio pasa a «Pendiente de revisión».
7. **Comprobante** (paso 6): se abre solo después del pago. Tocar *Imprimir comprobante*: en la impresión solo sale el ticket, con la leyenda «No válido como factura».
8. **El admin publica** (paso 7): en *Comercios* aparece el aviso «1 comercio pendiente de revisión». Tocar *Publicar* y mostrar que ya figura en el directorio.
9. **Destacado** (paso 8): como comerciante, tocar *Destacar 30 días* y pagar. En el directorio, La Espiga pasa a aparecer primero.
10. **Operaciones**: como admin, abrir *Operaciones* para ver todos los pagos y el total cobrado.
    Si se quiere mostrar un pago rechazado, tocar *Pagar abono mensual* y después *Rechazar pago*.

## Dominios propios (solo para la presentación)

Para mostrar cada landing con su propio dominio (por ejemplo `http://donvicente.com.ar`) sin comprar dominios ni tocar el sistema:

```bash
npm start             # la app, como siempre
npm run chrome-demo   # en otra terminal: abre un Chrome aparte que manda todo *.com.ar a la app
```

- En ese Chrome, Vidriera se ve en `http://vidriera.com.ar` y cada comercio publicado en su dominio. Los comercios nuevos funcionan al instante.
- El dominio se elige en el formulario del comercio (admin y comerciante). Si el admin lo deja vacío, se arma con el nombre.
- El truco es la opción `--host-resolver-rules` de Chrome: solo afecta a esa ventana. Al cerrarla no queda nada configurado. En ese Chrome no cargan los sitios `.com.ar` reales.
- No hay que activar nada: la app usa los dominios cuando se entra por un `.com.ar`. Por `http://localhost:3000` (cualquier navegador), las landings siguen en `/c/slug`.
- `npm run chrome-demo` funciona en macOS, Windows y Linux.

Paso a paso, el comando completo y qué hacer si algo falla: [DOMINIOS_DEMO.md](DOMINIOS_DEMO.md).

## Pagos

Todo el código de pagos está en `src/pagos/`. El resto de la app usa solo `crearPago()` y `verificarPago()`; la interfaz está documentada en `src/pagos/index.js`.
La variable `PAGOS_MODO` del `.env` elige la implementación:

- `simulado` (implementado): pantalla propia de checkout con los botones *Pagar* y *Rechazar*. No usa credenciales ni hace cobros.
- `mercadopago` (pendiente): `src/pagos/mercadopago.js` tiene los pasos para Checkout Pro en modo prueba. Para pasar a Mercado Pago alcanza con completar ese archivo y cargar `MP_ACCESS_TOKEN` en `.env`.

El precio de cada servicio lo define el servidor (`src/config.js`). Además, la aprobación de un pago es idempotente: si el comerciante recarga la página de retorno, el pago no se procesa dos veces.

## Seguridad

- Contraseñas cifradas con bcrypt y sesión nueva en cada ingreso.
- Rutas protegidas por rol en el servidor: `/panel` es solo para comerciantes y `/admin` solo para el admin.
- Un comerciante solo ve y edita sus propios comercios, operaciones y comprobantes. Si intenta abrir los de otro, recibe un 404.
- `.env` y la base de datos están en `.gitignore`.

### HTTPS local (opcional)

En producción el HTTPS lo da el hosting con su certificado. Para mostrarlo en local:

```bash
mkdir certs
openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
  -keyout certs/localhost-key.pem -out certs/localhost.pem
```

Después, en `.env`, cargar `HTTPS_CERT=certs/localhost.pem` y `HTTPS_KEY=certs/localhost-key.pem`, y abrir `https://localhost:3000`. El navegador va a advertir que el certificado es autofirmado.

## Estructura

```
src/
  server.js        arranque (HTTP o HTTPS)
  app.js           configuración de Express
  db.js            SQLite: tablas usuarios, comercios y operaciones
  config.js        precios, rubros, zonas y plantillas
  comercios.js     consultas y validación de comercios
  operaciones.js   reglas de pagos y efectos (revisión, destacado)
  reclamo.js       reclamar un comercio con su código
  pagos/           módulo de pagos (simulado / mercadopago)
  routes/          público, auth, panel, admin y pagos
views/             plantillas EJS
public/            CSS, JS y las imágenes SVG de muestra
scripts/seed.js    datos de demo
```
