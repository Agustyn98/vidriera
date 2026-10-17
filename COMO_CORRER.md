# Cómo correr Vidriera

Sirve igual en Windows, macOS y Linux.

## Antes de empezar

Necesitás **Node.js 20 o superior**. Para ver si lo tenés, abrí una terminal y escribí `node -v`. Si no lo tenés, bajalo de [nodejs.org](https://nodejs.org) (la versión LTS).

Abrí una terminal en la carpeta `vidriera` (la que tiene este archivo).

## Los comandos

**1. Instalar** (solo la primera vez):

```bash
npm install
```

**2. Cargar los datos de demo.** Borra la base y la deja como nueva. Repetilo cuando quieras volver a empezar:

```bash
npm run seed
```

**3. Arrancar la app:**

```bash
npm start
```

Abrí **http://localhost:3000** en cualquier navegador. No cierres la terminal: si la cerrás, la app se apaga. Para apagarla, usá Ctrl+C.

**4. (Opcional) Ver cada comercio en su propio dominio**, por ejemplo `http://donvicente.com.ar`. Con la app andando, abrí **otra** terminal en la misma carpeta y escribí:

```bash
npm run chrome-demo
```

Se abre un Chrome aparte en `http://vidriera.com.ar`. Usá esa ventana para la demo. Al cerrarla no queda nada configurado en la computadora. Hace falta tener Google Chrome instalado.

## Usuarios para entrar

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | `admin` | `admin` |
| Comerciante | `comercio` | `comercio` |

## Si algo falla

- **`npm` no se reconoce:** falta instalar Node.js, o hay que cerrar y volver a abrir la terminal después de instalarlo.
- **El puerto 3000 está ocupado:** ya hay otra copia de la app corriendo. Cerrá esa terminal, o apagala con Ctrl+C.
- **Más detalles:** [README.md](README.md), [GUION_DEMO.md](GUION_DEMO.md) (el guion de la presentación) y [DOMINIOS_DEMO.md](DOMINIOS_DEMO.md) (los dominios propios).
