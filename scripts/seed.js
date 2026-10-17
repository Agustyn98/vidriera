// Carga datos de demo: borra todo y crea usuarios y comercios ficticios del Gran Mendoza.
require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const { db, ESQUEMA, DB_PATH } = require('../src/db');
const { sumarDias } = require('../src/helpers');

const ahora = new Date();
const fotos = (rubro) => [`/img/rubros/${rubro}-1.svg`, `/img/rubros/${rubro}-2.svg`];

const USUARIOS = [
  { nombre: 'Administración Vidriera', email: 'admin@vidriera.com.ar', password: 'admin', rol: 'admin' },
  { nombre: 'Lucía Fernández', email: 'comercio@vidriera.com.ar', password: 'comercio', rol: 'comerciante' },
];

const COMERCIOS = [
  {
    nombre: 'Pizzería Don Vicente',
    rubro: 'gastronomia',
    zona: 'godoy-cruz',
    plantilla: 'calida',
    destacadoDias: 21,
    descripcion:
      'Pizzas a la piedra con masa madre y muzzarella de primera desde 1998. Delivery propio en Godoy Cruz y Ciudad, o retirá en el local.',
    whatsapp: '261 555-0101',
    telefono: '261 555-0102',
    direccion: 'San Martín 1250, Godoy Cruz',
    horarios: [
      { dias: 'Martes a domingo', horas: '19:30 a 00:30' },
      { dias: 'Lunes', horas: 'Cerrado' },
    ],
    productos: [
      { nombre: 'Pizza muzzarella', precio: 14000 },
      { nombre: 'Pizza napolitana', precio: 16500 },
      { nombre: 'Fugazzeta rellena', precio: 18900 },
      { nombre: 'Empanada de carne cortada a cuchillo', precio: 1800 },
    ],
  },
  {
    nombre: 'Vinoteca El Lagar',
    rubro: 'vinos',
    zona: 'lujan',
    plantilla: 'clasica',
    destacadoDias: 12,
    descripcion:
      'Más de 300 etiquetas de bodegas de Luján, Valle de Uco y el Este mendocino. Asesoramiento personalizado, cajas para regalo y degustaciones los sábados.',
    whatsapp: '261 555-0111',
    telefono: '',
    direccion: 'Av. San Martín Sur 2100, Luján de Cuyo',
    horarios: [
      { dias: 'Lunes a sábado', horas: '10 a 14 y 17 a 21' },
      { dias: 'Domingo', horas: '11 a 14' },
    ],
    productos: [
      { nombre: 'Malbec reserva (750 ml)', precio: 21000 },
      { nombre: 'Cabernet Franc Valle de Uco', precio: 26500 },
      { nombre: 'Caja regalo con 2 vinos', precio: 48000 },
      { nombre: 'Degustación guiada (por persona)', precio: 15000 },
    ],
  },
  {
    nombre: 'Café de la Alameda',
    rubro: 'gastronomia',
    zona: 'capital',
    plantilla: 'natural',
    descripcion:
      'Café de especialidad, desayunos y meriendas caseras frente a la Alameda. Pastelería propia y opciones sin TACC.',
    whatsapp: '261 555-0121',
    telefono: '261 555-0122',
    direccion: 'San Martín 1720, Ciudad de Mendoza',
    horarios: [{ dias: 'Lunes a domingo', horas: '8 a 21' }],
    productos: [
      { nombre: 'Café con leche y dos medialunas', precio: 6500 },
      { nombre: 'Tostado de jamón y queso', precio: 7800 },
      { nombre: 'Porción de torta de la casa', precio: 5200 },
    ],
  },
  {
    nombre: 'Lana & Algodón',
    rubro: 'indumentaria',
    zona: 'capital',
    plantilla: 'calida',
    descripcion:
      'Ropa de mujer de diseño local, en talles del S al XXL. Prendas de lino, tejidos de lana y básicos de algodón. Cambios sin problema.',
    whatsapp: '261 555-0131',
    telefono: '',
    direccion: 'Av. Arístides Villanueva 410, Ciudad de Mendoza',
    horarios: [
      { dias: 'Lunes a viernes', horas: '10 a 13:30 y 17 a 21' },
      { dias: 'Sábados', horas: '10 a 14' },
    ],
    productos: [
      { nombre: 'Sweater de lana tejido a mano', precio: 42000 },
      { nombre: 'Camisa de lino', precio: 35500 },
      { nombre: 'Remera básica de algodón', precio: 14900 },
    ],
  },
  {
    nombre: 'Estudio Contable Ruiz & Asociados',
    rubro: 'profesionales',
    zona: 'capital',
    plantilla: 'clasica',
    descripcion:
      'Contadores públicos matriculados. Monotributo, sueldos, sociedades e impuestos provinciales para comercios y profesionales de Mendoza.',
    whatsapp: '261 555-0141',
    telefono: '261 555-0142',
    direccion: 'Belgrano 780, piso 3, Ciudad de Mendoza',
    horarios: [{ dias: 'Lunes a viernes', horas: '9 a 17' }],
    productos: [
      { nombre: 'Alta y asesoramiento de monotributo', precio: 35000 },
      { nombre: 'Liquidación mensual de monotributo', precio: 22000 },
      { nombre: 'Consulta inicial', precio: 15000 },
    ],
  },
  {
    nombre: 'Electricidad Pereyra',
    rubro: 'oficios',
    zona: 'las-heras',
    plantilla: 'clasica',
    descripcion:
      'Electricista matriculado con 15 años de experiencia. Instalaciones, tableros, reparaciones y urgencias en Las Heras y alrededores.',
    whatsapp: '261 555-0151',
    telefono: '',
    direccion: 'Atendemos a domicilio en Las Heras, Capital y Guaymallén',
    horarios: [
      { dias: 'Lunes a sábado', horas: '8 a 20' },
      { dias: 'Urgencias', horas: 'Todos los días' },
    ],
    productos: [
      { nombre: 'Visita y diagnóstico', precio: 12000 },
      { nombre: 'Cambio de tablero (mano de obra)', precio: 85000 },
      { nombre: 'Instalación de toma o llave', precio: 9500 },
    ],
  },
  {
    nombre: 'Peluquería Estilo Libre',
    rubro: 'belleza',
    zona: 'maipu',
    plantilla: 'calida',
    descripcion:
      'Cortes, color y peinados para toda la familia en el centro de Maipú. Atención con turno por WhatsApp.',
    whatsapp: '261 555-0161',
    telefono: '',
    direccion: 'Padre Vázquez 145, Maipú',
    horarios: [{ dias: 'Martes a sábado', horas: '9:30 a 20' }],
    productos: [
      { nombre: 'Corte de dama', precio: 15000 },
      { nombre: 'Corte de caballero', precio: 10000 },
      { nombre: 'Color completo', precio: 38000 },
    ],
  },
  {
    nombre: 'La Despensa de Rosa',
    rubro: 'panaderias',
    zona: 'guaymallen',
    plantilla: 'natural',
    descripcion:
      'Almacén de barrio con pan casero, fiambres, productos regionales y dulces de la abuela. Pedidos por WhatsApp y envío en el barrio.',
    whatsapp: '261 555-0171',
    telefono: '261 555-0172',
    direccion: 'Bandera de los Andes 3300, Guaymallén',
    horarios: [
      { dias: 'Lunes a sábado', horas: '8 a 13:30 y 17 a 21:30' },
      { dias: 'Domingo', horas: '9 a 13' },
    ],
    productos: [
      { nombre: 'Pan casero (kg)', precio: 3200 },
      { nombre: 'Dulce de membrillo artesanal', precio: 4800 },
      { nombre: 'Aceite de oliva de Maipú (500 ml)', precio: 11500 },
    ],
  },
  {
    nombre: 'Veterinaria Huellitas',
    rubro: 'mascotas',
    zona: 'godoy-cruz',
    plantilla: 'natural',
    descripcion:
      'Clínica veterinaria para perros y gatos. Consultas, vacunas, cirugías programadas y pet shop con alimento de las mejores marcas.',
    whatsapp: '261 555-0181',
    telefono: '261 555-0182',
    direccion: 'Perú 1050, Godoy Cruz',
    horarios: [
      { dias: 'Lunes a viernes', horas: '9 a 13 y 16 a 20:30' },
      { dias: 'Sábados', horas: '9 a 13' },
    ],
    productos: [
      { nombre: 'Consulta clínica', precio: 18000 },
      { nombre: 'Vacuna antirrábica', precio: 14000 },
      { nombre: 'Baño y corte (perro mediano)', precio: 22000 },
    ],
  },
  {
    nombre: 'Kinesiología Movimiento',
    rubro: 'salud',
    zona: 'guaymallen',
    plantilla: 'clasica',
    descripcion:
      'Kinesiología y rehabilitación deportiva con profesionales matriculados. Atendemos obras sociales y particulares.',
    whatsapp: '261 555-0191',
    telefono: '',
    direccion: 'Mitre 920, Guaymallén',
    horarios: [{ dias: 'Lunes a viernes', horas: '8 a 21' }],
    productos: [
      { nombre: 'Sesión de kinesiología', precio: 16000 },
      { nombre: 'Evaluación postural', precio: 20000 },
    ],
  },
];

// El comercio en Vista Previa que reclama el comerciante de prueba durante la demo.
const VISTA_PREVIA = {
  nombre: 'Panadería La Espiga',
  rubro: 'panaderias',
  zona: 'godoy-cruz',
  plantilla: 'calida',
  previewToken: 'DEMO-2026',
  descripcion:
    'Panadería artesanal con horno a leña. Pan de campo, facturas, tortitas mendocinas y pastelería para eventos, todo hecho en el día.',
  whatsapp: '261 555-0201',
  telefono: '261 555-0202',
  direccion: 'Tomba 640, Godoy Cruz',
  horarios: [
    { dias: 'Lunes a sábado', horas: '7 a 13 y 17 a 21' },
    { dias: 'Domingo', horas: '8 a 13' },
  ],
  productos: [
    { nombre: 'Pan de campo (kg)', precio: 3800 },
    { nombre: 'Docena de facturas', precio: 9600 },
    { nombre: 'Tortitas mendocinas (docena)', precio: 4200 },
    { nombre: 'Torta para 20 personas', precio: 45000 },
  ],
};

const slug = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

let n = 0;
const codigo = () => `SEED-${String(++n).padStart(4, '0')}`;

const insertarComercio = db.prepare(`
  INSERT INTO comercios (duenoId, nombre, slug, rubro, zona, descripcion, whatsapp, telefono, direccion,
                         horarios, fotos, productos, plantilla, estado, previewToken, destacadoHasta)
  VALUES (NULL, @nombre, @slug, @rubro, @zona, @descripcion, @whatsapp, @telefono, @direccion,
          @horarios, @fotos, @productos, @plantilla, @estado, @previewToken, @destacadoHasta)`);

function cargarComercio(c, estado) {
  insertarComercio.run({
    ...c,
    slug: slug(c.nombre),
    horarios: JSON.stringify(c.horarios),
    fotos: JSON.stringify(fotos(c.rubro)),
    productos: JSON.stringify(c.productos),
    estado,
    previewToken: c.previewToken || codigo(),
    destacadoHasta: c.destacadoDias ? sumarDias(ahora, c.destacadoDias).toISOString() : null,
  });
}

db.transaction(() => {
  db.exec('DROP TABLE IF EXISTS operaciones; DROP TABLE IF EXISTS comercios; DROP TABLE IF EXISTS usuarios;');
  db.exec(ESQUEMA);
  const insertarUsuario = db.prepare('INSERT INTO usuarios (nombre, email, passwordHash, rol) VALUES (?, ?, ?, ?)');
  for (const u of USUARIOS) insertarUsuario.run(u.nombre, u.email, bcrypt.hashSync(u.password, 10), u.rol);
  for (const c of COMERCIOS) cargarComercio(c, 'publicado');
  cargarComercio(VISTA_PREVIA, 'vista_previa');
})();

console.log(`Base de datos lista: ${DB_PATH}`);
console.log(`- ${USUARIOS.length} usuarios, ${COMERCIOS.length} comercios publicados (2 destacados), 1 vista previa.`);
console.log('');
for (const u of USUARIOS) console.log(`  ${u.rol.padEnd(12)} usuario: ${u.email.split('@')[0].padEnd(10)} contraseña: ${u.password}`);
console.log('');
console.log(`  Vista previa para la demo: http://localhost:${process.env.PORT || 3000}/preview/${VISTA_PREVIA.previewToken}`);
