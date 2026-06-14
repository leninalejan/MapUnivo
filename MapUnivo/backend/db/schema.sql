-- ============================================================
-- MapUnivo — Database Schema
-- PostgreSQL 15+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- USUARIOS
-- ----------------------------------------------------------
CREATE TABLE usuarios (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carnet        VARCHAR(20)  UNIQUE NOT NULL,
    nombre        VARCHAR(120) NOT NULL,
    apellido      VARCHAR(120) NOT NULL,
    email         VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(30)  NOT NULL DEFAULT 'estudiante', -- estudiante | docente | admin
    facultad      VARCHAR(100),
    carrera       VARCHAR(100),
    activo        BOOLEAN DEFAULT TRUE,
    creado_en     TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

-- ----------------------------------------------------------
-- ZONAS DEL CAMPUS
-- ----------------------------------------------------------
CREATE TABLE zonas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(60) UNIQUE NOT NULL,
    nombre      VARCHAR(120) NOT NULL,
    descripcion TEXT,
    categoria   VARCHAR(50) NOT NULL, -- edificios | areas_verdes | accesos | estacionamiento | servicios
    icono       VARCHAR(10),
    color_hex   VARCHAR(7),
    latitud     DECIMAL(10,7) NOT NULL,
    longitud    DECIMAL(10,7) NOT NULL,
    horario     VARCHAR(200),
    telefono    VARCHAR(50),
    activo      BOOLEAN DEFAULT TRUE,
    orden       INTEGER DEFAULT 0
);

-- ----------------------------------------------------------
-- SALONES / AULAS
-- ----------------------------------------------------------
CREATE TABLE salones (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona_id      UUID REFERENCES zonas(id) ON DELETE CASCADE,
    codigo       VARCHAR(20) UNIQUE NOT NULL,
    nombre       VARCHAR(120) NOT NULL,
    piso         INTEGER DEFAULT 1,
    capacidad    INTEGER,
    tipo         VARCHAR(50),  -- aula | laboratorio | auditorio | sala_reunion
    equipamiento JSONB DEFAULT '{}',
    latitud      DECIMAL(10,7),
    longitud     DECIMAL(10,7),
    activo       BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------
-- RUTAS
-- ----------------------------------------------------------
CREATE TABLE rutas (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    desde_zona_id UUID REFERENCES zonas(id),
    hasta_zona_id UUID REFERENCES zonas(id),
    distancia_m   INTEGER,
    tiempo_min    INTEGER,
    instrucciones JSONB DEFAULT '[]',
    activo        BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------
-- FAVORITOS
-- ----------------------------------------------------------
CREATE TABLE favoritos (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    zona_id    UUID REFERENCES zonas(id) ON DELETE CASCADE,
    creado_en  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (usuario_id, zona_id)
);

-- ----------------------------------------------------------
-- SESIONES
-- ----------------------------------------------------------
CREATE TABLE sesiones (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip         INET,
    user_agent TEXT,
    creado_en  TIMESTAMPTZ DEFAULT NOW(),
    expira_en  TIMESTAMPTZ NOT NULL,
    activo     BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------
CREATE INDEX idx_zonas_categoria ON zonas(categoria);
CREATE INDEX idx_zonas_activo    ON zonas(activo);
CREATE INDEX idx_salones_zona    ON salones(zona_id);
CREATE INDEX idx_sesiones_token  ON sesiones(token_hash);
CREATE INDEX idx_sesiones_exp    ON sesiones(expira_en);

-- ----------------------------------------------------------
-- ESTADO COMPARTIDO DEL MAPA
-- ----------------------------------------------------------
CREATE TABLE app_state (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_state (key, value) VALUES (
    'map_state',
    '{
      "siteContent": {
        "bannerTitle": "Bienvenido a MapUNIVO",
        "bannerBody": "Consulta el campus, ubica zonas y, si eres administrador, actualiza este mensaje desde el menu de usuario."
      },
      "zonePositions": {},
      "customZones": []
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------
-- SEED — Zonas iniciales del campus
-- ----------------------------------------------------------
INSERT INTO zonas (slug, nombre, descripcion, categoria, icono, color_hex, latitud, longitud, horario, telefono) VALUES
('administracion',  'Edificio Administrativo',  'Rectoría, Vicerrectoría, Decanatos.',           'edificios',       '🏛️', '#3B82F6', 13.3396, -88.4418, 'Lun-Vie 7:00-17:00', '2669-2000'),
('biblioteca',      'Biblioteca Central',        'Sala de lectura, recursos digitales.',           'edificios',       '📚', '#00D4FF', 13.3390, -88.4415, 'Lun-Vie 7:30-17:30', '2669-2010'),
('ingenieria',      'Fac. Ingeniería y Arq.',    'Labs de cómputo y talleres.',                    'edificios',       '⚙️', '#3B82F6', 13.3398, -88.4425, 'Lun-Vie 7:00-18:00', '2669-2020'),
('ccee',            'Ciencias Económicas',       'Aulas y labs de la Fac. CCEE.',                  'edificios',       '📊', '#3B82F6', 13.3388, -88.4422, 'Lun-Vie 7:00-18:00', '2669-2030'),
('juridicas',       'Ciencias Jurídicas',        'Sala de juicios, clínica jurídica.',             'edificios',       '⚖️', '#3B82F6', 13.3393, -88.4430, 'Lun-Vie 7:00-18:00', '2669-2040'),
('cafeteria',       'Cafetería Universitaria',   'Comedor estudiantil y área de descanso.',        'servicios',       '☕', '#EC4899', 13.3386, -88.4416, 'Lun-Vie 7:00-17:00', '2669-2050'),
('salud',           'Unidad de Salud',           'Atención médica y orientación psicológica.',     'servicios',       '🏥', '#EC4899', 13.3395, -88.4412, 'Lun-Vie 8:00-16:00', '2669-2060'),
('cancha',          'Cancha Polideportiva',       'Cancha multiusos para deportes.',               'areas_verdes',    '⚽', '#22C55E', 13.3382, -88.4428, 'Lun-Dom 6:00-20:00', NULL),
('area_verde',      'Áreas Verdes / Jardines',   'Jardines y espacios al aire libre.',            'areas_verdes',    '🌳', '#22C55E', 13.3394, -88.4435, 'Acceso libre',        NULL),
('estacionamiento', 'Estacionamiento Principal', 'Capacidad 120 vehículos.',                       'estacionamiento', '🅿️', '#8B5CF6', 13.3400, -88.4410, 'Lun-Vie 6:30-18:30', NULL),
('entrada',         'Entrada Principal',         'Acceso principal con vigilancia.',               'accesos',         '🚪', '#F59E0B', 13.3402, -88.4405, 'Lun-Sáb 6:00-19:00', '2669-2001'),
('entrada2',        'Acceso Secundario',         'Acceso para personal y servicios.',              'accesos',         '🚧', '#F59E0B', 13.3378, -88.4432, 'Lun-Vie 6:30-17:30', NULL);
