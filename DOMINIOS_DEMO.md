# Ver los comercios con dominio propio (Chrome de demo)

Durante la presentación, cada landing se ve con su propio dominio, por ejemplo `http://donvicente.com.ar`. No hace falta comprar dominios ni cambiar nada de la computadora: se abre un Chrome aparte con una regla que manda todos los `*.com.ar` a la app local. Al cerrarlo, todo vuelve a la normalidad.

## Pasos

1. **Arrancar la app con los dominios activados** (en la carpeta `vidriera`):

   ```bash
   npm run seed   # opcional: deja los datos de demo a cero
   npm run demo   # igual que npm start, pero con DEMO_DOMINIOS=1
   ```

   La terminal muestra: `Dominios de demo activos: ...`. No la cierres.

2. **Abrir el Chrome de demo** en otra terminal:

   ```bash
   npm run chrome-demo
   ```

   Se abre una ventana de Chrome nueva, con un perfil aparte y sin tus pestañas, directamente en `http://vidriera.com.ar`.

3. **Hacer toda la demo en esa ventana.** Para el comerciante, abrí una ventana de incógnito desde ese mismo Chrome (Cmd+Shift+N); la regla también aplica ahí.

## Qué direcciones funcionan

| Dirección | Qué muestra |
|---|---|
| `http://vidriera.com.ar` | El sitio de Vidriera (inicio, directorio, login, paneles) |
| `http://donvicente.com.ar` | Pizzería Don Vicente |
| `http://vinotecaellagar.com.ar` | Vinoteca El Lagar |
| `http://laespiga.com.ar` | Panadería La Espiga, después de que se publique en la demo |
| `http://<nombre-del-comercio>.com.ar` | El resto de los comercios del seed, por ejemplo `cafe-de-la-alameda.com.ar` |

- El dominio de cada comercio figura en el panel del comerciante y en la lista de comercios del admin. Se cambia desde el formulario del comercio.
- Un comercio creado durante la presentación funciona en su dominio apenas se publica.
- Si el dominio no existe o el comercio todavía no está publicado, Chrome te lleva a `vidriera.com.ar`. Las vistas previas siguen en `vidriera.com.ar/preview/CÓDIGO`.

## Sin npm (comando completo)

Si hiciera falta abrirlo a mano, este es el comando que ejecuta `npm run chrome-demo` (si la app usa otro puerto, cambiá el `3000`):

```bash
open -na "Google Chrome" --args \
  --user-data-dir=/tmp/vidriera-chrome-demo \
  --no-first-run --no-default-browser-check \
  --host-resolver-rules="MAP *.com.ar 127.0.0.1:3000" \
  http://vidriera.com.ar
```

- `--host-resolver-rules` hace que esa ventana resuelva cualquier `.com.ar` a tu propia computadora, en el puerto de la app.
- `--user-data-dir` crea un Chrome independiente. Sin esa opción, si ya tenés Chrome abierto, la regla se ignora.

## Si algo no anda

- **Chrome muestra el sitio real o un error de "no se puede acceder":** la regla no se aplicó. Cerrá esa ventana de demo (Cmd+Q sobre ella) y volvé a ejecutar `npm run chrome-demo`.
- **"No se puede conectar" en `vidriera.com.ar`:** la app no está corriendo, o corre en otro puerto. Revisá la terminal de `npm run demo`.
- **Los links llevan a `/c/...` en vez de al dominio:** la app se arrancó con `npm start`. Cortala (Ctrl+C) y usá `npm run demo`.
- **Chrome avisa que la conexión no es segura:** es normal, la demo usa `http`, no `https`. Elegí continuar al sitio.
- **Un sitio `.com.ar` real no carga:** es esperable en esa ventana. Usá tu Chrome de siempre para navegar.

## Al terminar

Cerrá la ventana de demo y cortá la app con Ctrl+C. No queda nada instalado ni configurado. Si querés, borrá la carpeta del perfil temporal:

```bash
rm -r /tmp/vidriera-chrome-demo
```
