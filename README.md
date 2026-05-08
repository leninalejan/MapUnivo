# 🎓 MapUnivo
Una pagina para orientar a todos los de esta Universidad


> Mapa interactivo del campus universitario de la **Universidad de Oriente (UNIVO)** — Campus San Miguel, El Salvador.

![Version](https://img.shields.io/badge/versión-1.0.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![License](https://img.shields.io/badge/licencia-MIT-green?style=flat-square)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Capturas de pantalla](#-capturas-de-pantalla)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Base de Datos PostgreSQL](#-base-de-datos-postgresql)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [API Reference](#-api-reference)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Puntos de Interés del Campus](#-puntos-de-interés-del-campus)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 📖 Descripción

**UNIVO Maps** es una aplicación web progresiva inspirada en Google Maps y Waze, diseñada específicamente para el campus de la Universidad de Oriente (UNIVO) en San Miguel, El Salvador. Permite a estudiantes, docentes y visitantes navegar el campus de forma intuitiva, encontrar edificios, servicios y eventos, además de reportar problemas en tiempo real.

La aplicación funciona de forma **offline-first**: si no hay conexión al backend, automáticamente utiliza los datos locales del campus sin interrumpir la experiencia del usuario.

---

## ✨ Características

### Mapa Interactivo
- 🗺️ **Tres capas de mapa**: Satelital (ArcGIS), Estándar (OpenStreetMap) y Modo Oscuro (CartoDB)
- 📍 **20+ puntos de interés** del campus con íconos personalizados por categoría
- 🔍 **Búsqueda en tiempo real** con debounce de 300ms y dropdown de resultados
- 🧭 **Navegación entre puntos** con cálculo automático de distancia y tiempo estimado
- 🎯 **Animación fly-to** al seleccionar un punto de interés

### Filtros y Categorías
- Edificios académicos, Laboratorios, Biblioteca, Cafetería
- Áreas deportivas, Estacionamiento, Administración, Baños

### Panel de Información
- Nombre, descripción y tipo de cada instalación
- Horario de atención y teléfono de contacto
- Coordenadas GPS precisas
- Acceso directo a navegación o reporte

### Sistema de Navegación
- Selección visual de origen y destino en el mapa
- Polilínea animada sobre el mapa con ruta calculada
- Indicador de distancia en metros y tiempo en minutos

### Eventos del Campus
- Listado de eventos próximos con fecha, lugar y tipo
- Navegación directa al lugar del evento en el mapa
- Categorías: Académico, Cultural, Deportivo, Administrativo

### Sistema de Reportes
- Tipos: Obstáculo en vía, Área en construcción, Emergencia, Sugerencia
- Envío al backend con persistencia en PostgreSQL
- Confirmación visual al usuario

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend Framework** | React | 19.x |
| **Build Tool** | Vite | 6.x |
| **Mapas** | Leaflet.js + React-Leaflet | 1.9 / 4.x |
| **Íconos UI** | Lucide React | 0.383.x |
| **Estilos** | CSS Custom Properties (Dark Mode) | — |
| **Tipografía** | Sora + DM Mono (Google Fonts) | — |
| **Backend** | Node.js + Express | 18+ / 4.x |
| **Base de datos** | PostgreSQL | 14+ |
| **Driver DB** | node-postgres (pg) | 8.x |
| **HTTP Client** | Fetch API nativa | — |

---

## 🏗 Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────┐
│                     UNIVO Maps App                      │
├─────────────────────┬───────────────────────────────────┤
│   Frontend (React)  │         Backend (Express)         │
│                     │                                   │
│  ┌───────────────┐  │  ┌─────────────────────────────┐  │
│  │   App.jsx     │  │  │       server.js              │  │
│  │  (UI + Map)   │◄─┼─►│   REST API /api/*            │  │
│  └───────┬───────┘  │  └──────────────┬──────────────┘  │
│          │          │                 │                  │
│  ┌───────▼───────┐  │  ┌──────────────▼──────────────┐  │
│  │  services/    │  │  │       PostgreSQL             │  │
│  │    api.js     │  │  │   univo_maps database        │  │
│  │ (+ fallback)  │  │  │  puntos | zonas | rutas      │  │
│  └───────┬───────┘  │  │  eventos | reportes          │  │
│          │          │  └─────────────────────────────┘  │
│  ┌───────▼───────┐  │                                   │
│  │  data/        │  │                                   │
│  │ campusData.js │  │                                   │
│  │ (datos locales│  │                                   │
│  │  de respaldo) │  │                                   │
│  └───────────────┘  │                                   │
└─────────────────────┴───────────────────────────────────┘
```

### Patrón Offline-First

El servicio `api.js` intenta conectar al backend con un timeout de 2 segundos. Si falla, sirve automáticamente los datos locales de `campusData.js` sin mostrar errores al usuario.

```
Frontend → fetch(backend, timeout: 2s) → ✅ datos de PostgreSQL
                                        → ❌ timeout → datos locales
```

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
- **npm** v9 o superior (incluido con Node.js)
- **PostgreSQL** v14 o superior → [postgresql.org](https://www.postgresql.org)
- **Git** → [git-scm.com](https://git-scm.com)

Verifica las versiones:

```bash
node --version   # v18.x.x o superior
npm --version    # 9.x.x o superior
psql --version   # psql (PostgreSQL) 14.x o superior
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/univo-maps.git
cd MapUnivo
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tu editor preferido
nano .env
```

El archivo `.env` debe quedar así:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 5. Configurar la base de datos del backend

Crea el archivo `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=univo_maps
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
PORT=3001
```

### 6. Inicializar la base de datos

```bash
# Desde la raíz del proyecto
psql -U postgres -c "CREATE DATABASE univo_maps;"
psql -U postgres -d univo_maps -f backend/db/schema.sql
```

Esto creará todas las tablas y cargará los datos iniciales del campus.

### 7. Iniciar el servidor backend

```bash
cd backend
node server.js
# ✅ MapUnivo API corriendo en http://localhost:3001
```

### 8. Iniciar el servidor de desarrollo frontend

En otra terminal, desde la raíz del proyecto:

```bash
npm run dev
# ✅ http://localhost:5173
```

### 9. Abrir en el navegador

```
http://localhost:5173
```

---

## 🗄 Base de Datos PostgreSQL

### Esquema de Tablas

#### `zonas`
Zonas o áreas del campus universitario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `nombre` | VARCHAR(100) | Nombre de la zona |
| `descripcion` | TEXT | Descripción detallada |
| `color` | VARCHAR(7) | Color HEX para visualización |
| `tipo` | VARCHAR(50) | Tipo: `edificio`, `area_verde`, `estacionamiento`, `cancha`, `acceso` |
| `created_at` | TIMESTAMP | Fecha de creación |

#### `puntos_interes`
Edificios, servicios e instalaciones del campus.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `nombre` | VARCHAR(150) | Nombre del punto |
| `descripcion` | TEXT | Descripción detallada |
| `tipo` | VARCHAR(50) | Tipo de instalación |
| `zona_id` | INT FK | Referencia a `zonas.id` |
| `lat` | DECIMAL(10,8) | Latitud GPS |
| `lng` | DECIMAL(11,8) | Longitud GPS |
| `piso` | INT | Número de piso (0 = planta baja) |
| `horario` | VARCHAR(200) | Horario de atención |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `activo` | BOOLEAN | Estado del punto |

#### `rutas`
Rutas y caminos entre puntos del campus.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `tipo` | VARCHAR(30) | `peatonal`, `vehicular`, `bicicleta`, `emergencia` |
| `desde_punto_id` | INT FK | Punto de origen |
| `hasta_punto_id` | INT FK | Punto de destino |
| `distancia_metros` | DECIMAL | Distancia en metros |
| `tiempo_minutos` | DECIMAL | Tiempo estimado |
| `coordenadas` | JSONB | Array de `[lat, lng]` para la polilínea |
| `accesible_discapacidad` | BOOLEAN | Accesibilidad |

#### `eventos`
Eventos y actividades del campus.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `titulo` | VARCHAR(200) | Título del evento |
| `descripcion` | TEXT | Descripción del evento |
| `punto_id` | INT FK | Lugar del evento |
| `fecha_inicio` | TIMESTAMP | Fecha y hora de inicio |
| `fecha_fin` | TIMESTAMP | Fecha y hora de fin |
| `tipo` | VARCHAR(50) | `academico`, `cultural`, `deportivo`, `administrativo` |

#### `reportes`
Reportes de problemas enviados por usuarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `tipo` | VARCHAR(50) | `obstaculo`, `construccion`, `emergencia`, `sugerencia` |
| `descripcion` | TEXT | Descripción del problema |
| `lat` | DECIMAL | Latitud del reporte |
| `lng` | DECIMAL | Longitud del reporte |
| `punto_id` | INT FK | Punto asociado (opcional) |
| `estado` | VARCHAR(20) | `pendiente`, `en_proceso`, `resuelto` |

---

## ⚙️ Variables de Entorno

### Frontend (`.env` en raíz del proyecto)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base del backend API | `http://localhost:3001/api` |

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `univo_maps` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | — |
| `PORT` | Puerto del servidor backend | `3001` |

---

## 📜 Scripts Disponibles

### Frontend

```bash
npm run dev        # Inicia servidor de desarrollo (http://localhost:5173)
npm run build      # Compila para producción (genera carpeta /dist)
npm run preview    # Previsualiza el build de producción
npm run lint       # Ejecuta ESLint
```

### Backend

```bash
node server.js           # Inicia el servidor en producción
node --watch server.js   # Inicia con auto-reload en desarrollo
```

---

## 🌐 API Reference

La API REST corre en `http://localhost:3001` por defecto.

### Puntos de Interés

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/puntos` | Listar todos los puntos activos |
| `GET` | `/api/puntos?tipo=edificio` | Filtrar por tipo |
| `GET` | `/api/puntos?buscar=biblioteca` | Buscar por nombre o descripción |
| `GET` | `/api/puntos/:id` | Obtener un punto específico |

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "nombre": "Biblioteca Central",
      "tipo": "biblioteca",
      "lat": "13.47910000",
      "lng": "-88.18530000",
      "horario": "Lun-Vie: 7:00am - 8:00pm",
      "zona_nombre": "Biblioteca y Recursos",
      "zona_color": "#14B8A6"
    }
  ]
}
```

### Zonas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/zonas` | Listar todas las zonas del campus |

### Rutas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/rutas` | Listar todas las rutas |
| `GET` | `/api/rutas?desde=1&hasta=12` | Ruta entre dos puntos |

### Eventos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/eventos` | Listar eventos próximos (desde hoy) |

### Búsqueda

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/buscar?q=cafeteria` | Búsqueda global de puntos (máx. 10 resultados) |

### Reportes

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `POST` | `/api/reportes` | Crear nuevo reporte | `{ tipo, descripcion, lat, lng, punto_id }` |

### Estadísticas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/stats` | Estadísticas generales del campus |

**Ejemplo de respuesta `/api/stats`:**
```json
{
  "success": true,
  "data": {
    "total_puntos": 20,
    "total_zonas": 7,
    "total_rutas": 6,
    "eventos_proximos": 3
  }
}
```

---

## 📁 Estructura de Archivos

```
univo-maps/
│
├── 📄 index.html                    # Punto de entrada HTML
├── 📄 package.json                  # Dependencias del frontend
├── 📄 vite.config.js                # Configuración de Vite
├── 📄 .env.example                  # Plantilla de variables de entorno
├── 📄 README.md                     # Este archivo
│
├── 📁 src/
│   ├── 📄 main.jsx                  # Bootstrap de React
│   ├── 📄 App.jsx                   # Componente raíz (UI + lógica del mapa)
│   │
│   ├── 📁 data/
│   │   └── 📄 campusData.js         # Datos locales: puntos, zonas, rutas, eventos
│   │
│   ├── 📁 services/
│   │   └── 📄 api.js                # Capa de servicio con fallback offline
│   │
│   └── 📁 styles/
│       └── 📄 app.css               # Estilos globales (dark mode + animaciones)
│
└── 📁 backend/
    ├── 📄 server.js                 # Servidor Express + endpoints REST
    ├── 📄 package.json              # Dependencias del backend
    │
    └── 📁 db/
        └── 📄 schema.sql            # Esquema PostgreSQL + datos iniciales
```

---

## 📍 Puntos de Interés del Campus

El sistema incluye los siguientes puntos mapeados del campus UNIVO San Miguel:

| # | Nombre | Tipo |
|---|--------|------|
| 1 | Entrada Principal | 🚪 Entrada |
| 2 | Entrada Norte | 🚪 Entrada |
| 3 | Edificio A – Ciencias Económicas | 🏛️ Edificio |
| 4 | Edificio B – Ingeniería y Arquitectura | 🏛️ Edificio |
| 5 | Edificio C – Jurisprudencia | 🏛️ Edificio |
| 6 | Edificio D – Ciencias de la Salud | 🏛️ Edificio |
| 7 | Laboratorio de Cómputo 1 | 🔬 Laboratorio |
| 8 | Laboratorio de Ciencias | 🔬 Laboratorio |
| 9 | Rectoría | 🏢 Oficina |
| 10 | Secretaría General | 🏢 Oficina |
| 11 | Colecturía / Pagos | 🏢 Oficina |
| 12 | Biblioteca Central | 📚 Biblioteca |
| 13 | Centro de Cómputo UNIVO | 🔬 Laboratorio |
| 14 | Cafetería Central | ☕ Cafetería |
| 15 | Clínica Médica Universitaria | 🏥 Clínica |
| 16 | Cancha de Fútbol | ⚽ Cancha |
| 17 | Cancha de Básketbol | ⚽ Cancha |
| 18 | Parqueo Principal | 🅿️ Estacionamiento |
| 19 | Baños Edificio A | 🚻 Baños |
| 20 | Baños Edificio B | 🚻 Baños |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una rama para tu funcionalidad:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m "feat: agregar nueva funcionalidad"
   ```
4. Sube tu rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. Abre un Pull Request

### Guía de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Cambios en documentación |
| `style:` | Formato, sin cambio de lógica |
| `refactor:` | Refactorización de código |
| `chore:` | Tareas de mantenimiento |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Créditos

Desarrollado para la **Universidad de Oriente (UNIVO)** — Campus San Miguel, El Salvador.

- Mapa base: © [OpenStreetMap](https://www.openstreetmap.org) contributors
- Imágenes satelitales: © [ArcGIS / Esri](https://www.arcgis.com)
- Íconos: [Lucide](https://lucide.dev)

---

<div align="center">
  <strong>🎓 UNIVO Maps</strong> — Hecho con ❤️ para el campus universitario
</div>
