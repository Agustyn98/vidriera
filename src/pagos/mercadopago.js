// Mercado Pago Checkout Pro (modo prueba). TODAVÍA NO IMPLEMENTADO.
//
// Cuando se implemente solo hay que completar este archivo; el resto de la app
// no cambia. Pasos previstos:
//
//   1. npm install mercadopago
//   2. En .env: PAGOS_MODO=mercadopago y MP_ACCESS_TOKEN=TEST-... (credencial de prueba)
//   3. crearPago: crear una preferencia con el SDK oficial
//        const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
//        const cliente = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
//        const pref = await new Preference(cliente).create({ body: {
//          items: [{ title, quantity: 1, unit_price: operacion.importe, currency_id: 'ARS' }],
//          external_reference: String(operacion.id),
//          back_urls: { success: volverA, failure: volverA, pending: volverA },
//          // auto_return: 'approved' requiere back_urls públicas (no funciona con localhost)
//        }});
//        return { url: pref.sandbox_init_point || pref.init_point };
//   4. verificarPago: consultar el pago a Mercado Pago (servidor a servidor)
//        const pago = await new Payment(cliente).get({ id: query.payment_id });
//        if (pago.external_reference !== String(operacion.id)) return { estado: 'pendiente' };
//        estado: 'approved' -> 'aprobado', 'rejected'/'cancelled' -> 'rechazado', resto -> 'pendiente'
//        mpPaymentId: String(pago.id), medio: pago.payment_method_id
//
// Las credenciales van solo en .env, que no se sube al repositorio.

function noImplementado() {
  throw new Error('El modo de pago "mercadopago" todavía no está implementado. Usá PAGOS_MODO=simulado.');
}

module.exports = {
  crearPago: async () => noImplementado(),
  verificarPago: async () => noImplementado(),
};
