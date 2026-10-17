// Módulo de pagos. El resto de la app solo usa esta interfaz:
//
//   crearPago({ operacion, comercio, usuario, baseUrl }) -> Promise<{ url }>
//     Registra el pago en el proveedor y devuelve la URL del checkout a la que
//     hay que redirigir al comerciante. Al terminar, el proveedor lo devuelve a
//     `${baseUrl}/pagos/retorno/${operacion.id}` con sus parámetros en la query.
//
//   verificarPago({ operacion, query }) -> Promise<{ estado, mpPaymentId, medio }>
//     Consulta al proveedor (servidor a servidor) cómo quedó el pago.
//     estado: 'aprobado' | 'rechazado' | 'pendiente'.
//
//   router (opcional): rutas propias del proveedor, por ejemplo el checkout simulado.
//
// PAGOS_MODO en .env elige la implementación: simulado | mercadopago.

const MODOS = {
  simulado: () => require('./simulado'),
  mercadopago: () => require('./mercadopago'),
};

const modo = process.env.PAGOS_MODO || 'simulado';
if (!MODOS[modo]) throw new Error(`PAGOS_MODO inválido: "${modo}". Usá "simulado" o "mercadopago".`);

const proveedor = MODOS[modo]();

module.exports = {
  modo,
  crearPago: proveedor.crearPago,
  verificarPago: proveedor.verificarPago,
  router: proveedor.router || null,
};
