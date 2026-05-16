// src/data/campusData.js
// ============================================================
// Zonas calibradas al plano topográfico oficial UNIVO
// Escala 1:1000 — Cantón Orrajuelo, San Miguel
//
// px / py = porcentaje sobre el área del plano actualizado (CAD (1).pdf)
// Origen (0,0) = esquina superior-izquierda del plano 800x600
//
// Distribución real del plano:
//  - ÁREA TRES (norte):  zona verde/baldía 45,784.868 m²
//  - ÁREA UNO  (centro): edificios principales 29,899.742 m²
//  - ÁREA DOS  (este):   lote adicional 3,970.053 m²
//  - Carretera Panamericana: límite sur
//  - Calle Universidad de Oriente: límite este
// ============================================================

export const CAMPUS_ZONES = [
  // ── ACCESOS ─────────────────────────────────────────────
  {
    id: 'entrada_principal',
    name: 'Entrada Principal',
    badge: 'ACCESO',
    cat: 'accesos',
    icon: '🚪',
    color: '#F2B544',
    // Portón norte sobre Calle Universidad de Oriente — nodo visible en plano
    px: 73.5, py: 18.5,
    desc: 'Acceso principal al campus desde la Calle Universidad de Oriente. Caseta de vigilancia, control peatonal y vehicular.',
    horario: 'Lun–Sáb: 6:00–19:00',
    tel: '2669-2001',
  },
  {
    id: 'entrada_panamericana',
    name: 'Acceso Carretera Panamericana',
    badge: 'ACCESO',
    cat: 'accesos',
    icon: '🚧',
    color: '#F2B544',
    // Salida/entrada vehicular al sur sobre Carretera Panamericana
    px: 44.0, py: 87.5,
    desc: 'Acceso vehicular secundario desde la Carretera Panamericana (CA-1). Uso principalmente de carga y servicios.',
    horario: 'Lun–Vie: 6:30–17:30',
    tel: '—',
  },

  // ── EDIFICIOS / ÁREA UNO ────────────────────────────────
  {
    id: 'bloque_principal',
    name: 'Bloque Principal de Aulas',
    badge: 'EDIFICIO',
    cat: 'edificios',
    icon: '🏛️',
    color: '#0F5EA8',
    // Bloque largo horizontal en el centro-sur del plano
    px: 37.0, py: 63.5,
    desc: 'Edificio principal de aulas que atraviesa horizontalmente el Área Uno. Contiene las principales aulas de clases de todas las facultades.',
    horario: 'Lun–Vie: 7:00–18:00',
    tel: '2669-2000',
  },
  {
    id: 'administracion',
    name: 'Edificio Administrativo',
    badge: 'ADMIN',
    cat: 'edificios',
    icon: '🏢',
    color: '#0F5EA8',
    // Bloque con módulos cuadrados al este del bloque principal
    px: 56.0, py: 62.0,
    desc: 'Rectoría, Vicerrectoría, Decanatos, Registro Académico y Unidades Administrativas centrales de la UNIVO.',
    horario: 'Lun–Vie: 7:00–17:00',
    tel: '2669-2000',
  },
  {
    id: 'bloque_modular',
    name: 'Bloque Modular Central',
    badge: 'EDIFICIO',
    cat: 'edificios',
    icon: '🔲',
    color: '#0F5EA8',
    // El rectángulo central aislado visible en el plano (área cuatro)
    px: 52.0, py: 53.0,
    desc: 'Bloque de aulas modulares ubicado en el centro del campus. Área cuatro del plano. Laboratorios y salones especializados.',
    horario: 'Lun–Vie: 7:00–18:00',
    tel: '2669-2020',
  },
  {
    id: 'estacionamiento_oeste',
    name: 'Estacionamiento Oeste',
    badge: 'PARQUEO',
    cat: 'estacionamiento',
    icon: '🅿️',
    color: '#4C6A88',
    // Área punteada al extremo izquierdo (oeste), frente a edificios
    px: 14.5, py: 62.0,
    desc: 'Estacionamiento principal del campus, ubicado en el extremo oeste frente al bloque de aulas. Capacidad para vehículos del personal y estudiantes.',
    horario: 'Lun–Vie: 6:30–18:30',
    tel: '—',
  },
  {
    id: 'modulos_sur',
    name: 'Módulos / Kioscos Sur',
    badge: 'SERVICIO',
    cat: 'servicios',
    icon: '🏪',
    color: '#1C9C72',
    // Los círculos/módulos visibles al sur del bloque principal
    px: 50.0, py: 79.5,
    desc: 'Módulos de servicios estudiantiles, cafetería y kioscos ubicados en la zona sur del campus frente a la Carretera Panamericana.',
    horario: 'Lun–Vie: 7:00–17:00',
    tel: '—',
  },

  // ── ÁREA DOS (este) ─────────────────────────────────────
  {
    id: 'area_dos',
    name: 'Área Dos — Lote Este',
    badge: 'ÁREA',
    cat: 'areas_verdes',
    icon: '🌿',
    color: '#2EAB5E',
    // Área DOS marcada con asteriscos verdes al este, junto a Calle Univ.
    px: 83.5, py: 70.0,
    desc: 'Lote adicional de 3,970.053 m² al oriente del campus, delimitado por la Calle Universidad de Oriente. Área de expansión futura.',
    horario: 'Acceso restringido',
    tel: '—',
  },

  // ── ÁREA TRES (norte) ───────────────────────────────────
  {
    id: 'area_tres',
    name: 'Área Tres — Zona Norte',
    badge: 'ÁREA VERDE',
    cat: 'areas_verdes',
    icon: '🌳',
    color: '#2EAB5E',
    // Gran zona norte del campus 45,784 m²
    px: 42.0, py: 35.0,
    desc: 'Zona verde y baldía de 45,784.868 m² al norte del campus. Mayor área del predio. Espacio para expansión de infraestructura universitaria.',
    horario: 'Acceso libre',
    tel: '—',
  },

  // ── CALLE UNIVERSIDAD DE ORIENTE (este) ─────────────────
  {
    id: 'calle_univo',
    name: 'Calle Universidad de Oriente',
    badge: 'VIALIDAD',
    cat: 'accesos',
    icon: '🛣️',
    color: '#F2B544',
    // Vía diagonal en el borde derecho del campus
    px: 76.0, py: 42.0,
    desc: 'Vía pública que bordea el campus por el oriente y sirve de acceso principal a la institución. Tráfico peatonal y vehicular.',
    horario: 'Acceso público 24/7',
    tel: '—',
  },

  // ── CARRETERA PANAMERICANA (sur) ────────────────────────
  {
    id: 'carretera_panamericana',
    name: 'Carretera Panamericana (CA-1)',
    badge: 'VIALIDAD',
    cat: 'accesos',
    icon: '🛤️',
    color: '#F2B544',
    // Límite sur del campus
    px: 28.0, py: 93.0,
    desc: 'Carretera Panamericana CA-1 que delimita el campus por el sur. Principal vía de acceso al campus desde San Miguel y el resto del país.',
    horario: 'Acceso público 24/7',
    tel: '—',
  },

  // ── PORTÓN / GARITA NORTE ───────────────────────────────
  {
    id: 'garita_norte',
    name: 'Garita Norte',
    badge: 'ACCESO',
    cat: 'accesos',
    icon: '🔒',
    color: '#F2B544',
    // Nodo de garita visible en la parte superior del plano
    px: 59.0, py: 21.5,
    desc: 'Garita de acceso norte al campus. Control de ingreso peatonal conectado a la Calle Universidad de Oriente.',
    horario: 'Lun–Sáb: 6:00–19:00',
    tel: '2669-2001',
  },
]

// Categorías con metadatos visuales
export const LAYER_CONFIG = [
  { id: 'edificios',       label: 'Edificios y facultades', color: '#0F5EA8', defaultOn: true  },
  { id: 'servicios',       label: 'Servicios universitarios', color: '#1C9C72', defaultOn: true  },
  { id: 'areas_verdes',    label: 'Areas y lotes',        color: '#2EAB5E', defaultOn: true  },
  { id: 'estacionamiento', label: 'Parqueos',             color: '#4C6A88', defaultOn: true  },
  { id: 'accesos',         label: 'Accesos y vialidad',   color: '#F2B544', defaultOn: true  },
]

export const CAT_LABELS = {
  edificios:       '🏛 Edificios y facultades',
  servicios:       '🛎 Servicios universitarios',
  areas_verdes:    '🌿 Areas y lotes',
  estacionamiento: '🅿️ Parqueos',
  accesos:         '🚪 Accesos y vialidad',
}

// Demo users (replace with PostgreSQL auth in production)
export const DEMO_USERS = [
  { username: 'estudiante', password: '1234',  name: 'Juan Sánchez',  role: 'Estudiante · Ing. de Sistemas', initials: 'JS', carnet: 'IS-2021-001' },
  { username: 'admin',      password: 'admin', name: 'María López',   role: 'Administradora del Sistema',    initials: 'ML', carnet: 'ADM-001'     },
  { username: 'docente',    password: 'pass',  name: 'Carlos Rivas',  role: 'Docente · CCEE',                initials: 'CR', carnet: 'DOC-042'     },
]
