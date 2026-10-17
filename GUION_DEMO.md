# Guion de la demo: Vidriera (TP3)

Duración: unos 10 minutos. La demo es local y no necesita internet.

## Antes de la presentación

### Instalar (una sola vez)

Hace falta Node.js 20 o superior (`node -v` para verificar). En la carpeta `vidriera/`:

```bash
npm install
cp .env.example .env    # solo si todavía no existe .env
```

### Dejar la demo lista (cada vez)

```bash
npm run seed    # borra la base y carga los datos de demo
npm start       # abre la app en http://localhost:3000
```

No cierres la terminal donde corre `npm start`: si la cerrás, la app se detiene.

### Cuentas

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | admin | admin |
| Comerciante | comercio | comercio |

En el campo del login alcanza con escribir `admin` o `comercio`; el email completo también funciona.

- Código de vista previa para la demo: **DEMO-2026**. Corresponde a Panadería La Espiga.
- Link directo: http://localhost:3000/preview/DEMO-2026

### Preparar el navegador

- **Ventana normal:** para el visitante y el admin.
- **Ventana de incógnito:** para el comerciante.

Así las dos sesiones quedan abiertas al mismo tiempo y no hace falta cerrar sesión durante la demo.

## Guion

### 1. Inicio (1 min), como visitante

- Abrir http://localhost:3000.
- Mostrar la misión, la visión y el compromiso. La cátedra los pide en la página principal.
- Mostrar los servicios con precios y los comercios destacados.

### 2. Directorio (1 min), como visitante

- Ir a **Directorio**, buscar "pizza" y filtrar por rubro o zona.
- Remarcar que los destacados aparecen primero.
- Abrir una landing y mostrar las fotos, los productos, los horarios y los botones de **WhatsApp** y **Llamar**.

### 3. El admin crea una vista previa (1 min), paso 1

- En la ventana normal, ingresar como **admin**.
- En **Comercios**, tocar **Nueva con datos de ejemplo** y después **Crear vista previa**.
- Mostrar el código que se genera y el botón **Copiar link**.
- Qué decir: "Esto es lo que le mandamos al comercio antes de venderle: su página ya armada, gratis."

### 4. El comerciante ve su vista previa (30 s), paso 2

- En la ventana de incógnito, abrir http://localhost:3000/preview/DEMO-2026.
- Mostrar el cartel de "Vista previa".
- Este comercio no aparece en el directorio y Google no lo indexa.

### 5. Reclamar el comercio (1 min), paso 3

- En incógnito, ingresar como **comerciante**.
- En **Reclamar un comercio**, escribir `DEMO-2026`. La panadería queda asociada a su cuenta.
- Opcional: en **Editar datos**, cambiar un precio para mostrar que el comerciante autogestiona su página.

### 6. Contratar y pagar (1 min), pasos 4 y 5

- Tocar **Contratar Landing Profesional · $ 50.000**. Se abre el checkout simulado.
- Elegir un medio de pago y tocar **Pagar**.
- Qué decir: "El servidor verifica el pago antes de aprobarlo y el precio lo define el servidor, no el navegador. Más adelante este checkout se reemplaza por Mercado Pago sin tocar el resto de la app."

### 7. Comprobante (1 min), paso 6

- El comprobante se abre solo después del pago.
- Tocar **Imprimir comprobante**: solo se imprime el ticket, con la leyenda "No válido como factura".
- En el panel, el comercio ahora figura como **Pendiente de revisión**.

### 8. El admin publica (1 min), paso 7

- En la ventana normal (admin), recargar **Comercios**. Aparece el aviso "1 comercio pendiente de revisión".
- Tocar **Publicar**.
- Ir al **Directorio** y mostrar que la panadería ya aparece.

### 9. Destacado (1 min), paso 8

- En incógnito (comerciante), tocar **Destacar 30 días** y pagar.
- En el **Directorio**, La Espiga aparece primero, con la etiqueta "Destacado".

### 10. Cierre (1 min), como admin

- Abrir **Operaciones**: están todos los pagos, con su estado y el total cobrado.
- Si sobra tiempo:
  - **Pago rechazado:** como comerciante, tocar **Pagar abono mensual** y después **Rechazar pago**. Queda registrado como rechazado y sin comprobante.
  - **Seguridad:** como comerciante, abrir http://localhost:3000/admin/comercios. Aparece "Acceso denegado".

## Si algo sale mal

- **Volver todo al estado inicial:**
  1. Cortar el servidor con `Ctrl + C`.
  2. Correr `npm run seed`.
  3. Correr `npm start`.
  4. Volver a ingresar en las dos ventanas.
- **"La app no abre":** revisar que `npm start` siga corriendo en la terminal y que la dirección sea http://localhost:3000.
- **Pide iniciar sesión de nuevo:** pasa después de reiniciar el servidor, porque las sesiones se guardan en memoria. Volver a ingresar con las cuentas de arriba.
- **Si falta tiempo:** saltear el paso 3. El resto del guion usa DEMO-2026, que ya viene cargado.

## Datos útiles por si preguntan

- **Tecnología:** Node.js + Express con vistas EJS, base de datos SQLite (archivo `vidriera.db`) y Pico.css.
- **Contraseñas:** se guardan cifradas con bcrypt.
- **Permisos:**
  - Cada rol tiene sus propias rutas y el servidor controla quién entra.
  - Un comerciante no puede ver ni editar comercios, pagos o comprobantes de otro.
- **Pagos:**
  - Por ahora el modo es simulado (`PAGOS_MODO=simulado` en `.env`).
  - Mercado Pago Checkout Pro en modo prueba es el paso siguiente: se completa solo el módulo `src/pagos/`.
  - Si se recarga la página de vuelta del pago, no se cobra dos veces.
- **HTTPS:**
  - La demo corre en local con http, como aceptó el profesor.
  - En producción, el hosting provee el certificado SSL para vidriera.com.ar.
  - La app también puede correr con HTTPS local. Las instrucciones están en el README.
- **Accesibilidad:** Lighthouse da 100 en las cuatro categorías (incluida Accesibilidad) en el inicio, el directorio y una landing.
- **Precios:** Landing Profesional $50.000 (incluye el primer mes), Abono mensual $15.000 y Destacado $10.000 por 30 días.
