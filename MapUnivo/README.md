# 🗺️ MapUnivo

> **Campus Navigator — Universidad de Oriente (UNIVO)**  
> Plataforma de navegación interactiva para la Ciudad Universitaria de San Miguel, El Salvador.

---

<div align="center">

![MapUnivo Banner](campus_map.jpg)

[![Version](https://img.shields.io/badge/versión-1.0.0-00D4FF?style=flat-square)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)](#)
[![License](https://img.shields.io/badge/licencia-MIT-22C55E?style=flat-square)](#)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API REST](#-api-rest)
- [Base de Datos](#-base-de-datos)
- [Credenciales de Prueba](#-credenciales-de-prueba)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)

---

## 📖 Descripción

**MapUnivo** es una aplicación web de navegación tipo Google Maps diseñada específicamente para la **Ciudad Universitaria de la Universidad de Oriente (UNIVO)** ubicada en el cantón Orrajuelo, Carretera Panamericana, San Miguel, El Salvador.

Permite a estudiantes, docentes y personal administrativo **localizar edificios, salones, servicios y accesos** del campus en tiempo real, con autenticación mediante credenciales institucionales y navegación interactiva sobre el plano topográfico oficial del campus.

---

## ✨ Características

### 🔐 Autenticación
- Login con usuario y contraseña institucional
- Roles diferenciados: `estudiante`, `docente`, `admin`
- Sesiones seguras con **JWT** (JSON Web Tokens)
- Protección de rutas en frontend y backend

### 🗺️ Mapa Interactivo
- Plano topográfico real del campus (Esc. 1:1000)
- **Zoom** con scroll del mouse y botones de control
- **Pan** — arrastrar el mapa con click sostenido
- Marcadores interactivos por zona
- Panel de información al seleccionar un punto

### 📍 Navegación
- Barra de búsqueda en tiempo real por nombre, categoría o badge
- Sidebar con zonas agrupadas por categoría
- Control de capas — activar/desactivar tipos de zonas
- Planificador de rutas (base lista, expansión con plano de salones)

### 🎨 Interfaz
- Tema oscuro con paleta inspirada en cartografía digital
- Animaciones y micro-interacciones
- Notificaciones tipo toast
- Diseño responsive (móvil y escritorio)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18, HTML5, CSS3, JavaScript ES2022 |
| **Backend** | Node.js 18+, Express.js 4 |
| **Base de Datos** | PostgreSQL 15 |
| **Autenticación** | JWT (jsonwebtoken), bcrypt |
| **Mapas** | Google Maps JavaScript API v3 |
| **Fuentes** | Outfit, JetBrains Mono (Google Fonts) |

---

## 📁 Estructura del Proyecto

```
MapUnivo/
│
├── index.html              # Punto de entrada — React via CDN + Babel
├── app.jsx                 # Lógica React completa (componentes, estado, datos)
├── app.css                 # Estilos globales, variables CSS, animaciones
├── campus_map.jpg          # Plano topográfico oficial UNIVO (recortado)
├── .gitignore
├── README.md
│
└── backend/                # API REST — Node.js + Express
    ├── server.js           # Entrada del servidor
    ├── package.json
    ├── .env.example        # Variables de entorno de referencia
    │
    ├── routes/
    │   ├── auth.js         # POST /login, POST /logout, GET /me
    │   ├── zonas.js        # GET /zonas, GET /zonas/:slug
    │   └── salones.js      # GET /salones, GET /salones/:codigo
    │
    ├── middleware/
    │   └── authJWT.js      # Verificación de token en rutas protegidas
    │
    └── db/
        ├── pool.js         # Conexión a PostgreSQL (pg Pool)
        └── schema.sql      # Esquema completo + datos iniciales (seed)
```

---

## ✅ Requisitos Previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v15 o superior
- [VS Code](https://code.visualstudio.com/) + extensión **Live Server** *(para el frontend)*
- Una **Google Maps API Key** *(opcional — el mapa SVG funciona sin ella)*

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/MapUnivo.git
cd MapUnivo
```

### 2. Configurar la base de datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE mapunivo;"

# Ejecutar el esquema y datos iniciales
psql -U postgres -d mapunivo -f backend/db/schema.sql
```

### 3. Configurar el backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

Edita `backend/.env` con tus credenciales:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/mapunivo
JWT_SECRET=mapunivo_jwt_secret_cambiar_en_produccion
PORT=3001
FRONTEND_URL=http://localhost:5500
```

### 4. Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:3001`

### 5. Abrir el frontend

Abre `index.html` con **VS Code Live Server** (clic derecho → *Open with Live Server*).

> ⚠️ El frontend **debe servirse por HTTP** (no abrir directo como archivo) porque Babel necesita cargar `app.jsx` de forma remota.

---

## ⚙️ Configuración

### Google Maps API Key

Para activar el mapa de Google Maps en lugar del plano estático:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto y habilita **Maps JavaScript API**
3. Genera una **API Key**
4. En `app.jsx`, línea 8, reemplaza:

```js
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY'; // ← pega aquí tu clave
```

5. *(Recomendado en producción)* Restringe la clave al dominio institucional de UNIVO.

> Sin API Key, el sistema usa el **plano topográfico real** del campus como mapa base con marcadores SVG interactivos — completamente funcional.

---

## 💻 Uso

### Login

| Rol | Usuario | Contraseña |
|-----|---------|-----------|
| Estudiante | `estudiante` | `1234` |
| Administrador | `admin` | `admin` |
| Docente | `docente` | `pass` |

### Navegación del mapa

| Acción | Cómo |
|--------|------|
| Zoom acercar | Scroll ↑ o botón `+` |
| Zoom alejar | Scroll ↓ o botón `−` |
| Mover mapa | Click sostenido + arrastrar |
| Reset vista | Botón `↺` |
| Ver info de zona | Click en marcador |
| Buscar | Barra superior |
| Filtrar capas | Ícono de capas (topbar) o sidebar |

---

## 📡 API REST

Todas las rutas protegidas requieren header:
```
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión → `{ token, user }` |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET`  | `/api/auth/me` | Info del usuario autenticado |

**Ejemplo login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"carnet":"IS-2021-001","password":"1234"}'
```

### Zonas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/zonas` | Todas las zonas activas |
| `GET` | `/api/zonas?categoria=edificios` | Filtrar por categoría |
| `GET` | `/api/zonas/:slug` | Detalle de una zona |
| `GET` | `/api/zonas/:slug/salones` | Salones de una zona |

### Salones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/salones` | Todos los salones |
| `GET` | `/api/salones?tipo=laboratorio` | Filtrar por tipo |
| `GET` | `/api/salones/:codigo` | Detalle de un salón |

### Health Check

```bash
GET /api/health
# → { "status": "ok", "project": "MapUnivo", "timestamp": "..." }
```

---

## 🗃️ Base de Datos

### Diagrama de tablas

```
usuarios ──────── favoritos ──────── zonas
    │                                  │
    └── sesiones                    salones
                                       │
                               rutas (desde/hasta zonas)
```

### Categorías de zonas

| Valor | Descripción |
|-------|-------------|
| `edificios` | Facultades, administrativo, biblioteca |
| `servicios` | Cafetería, salud |
| `areas_verdes` | Jardines, cancha deportiva |
| `estacionamiento` | Parqueos |
| `accesos` | Entradas al campus |

### Tipos de salones

| Valor | Descripción |
|-------|-------------|
| `aula` | Salón de clase regular |
| `laboratorio` | Lab de cómputo, ciencias, etc. |
| `auditorio` | Auditórium y salas de conferencias |
| `sala_reunion` | Salas administrativas |

---

## 🔑 Credenciales de Prueba

> Estos usuarios están definidos en `app.jsx` para el modo demo (sin backend). Al integrar PostgreSQL, agregar usuarios reales con contraseñas hasheadas usando bcrypt.

```js
// Generar hash para PostgreSQL
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('tu_password', 10);
```

---

## 🗺️ Roadmap

- [x] Mapa interactivo con plano topográfico real
- [x] Autenticación con roles (demo)
- [x] Búsqueda en tiempo real
- [x] Control de capas
- [x] Panel de información de zonas
- [x] Esquema PostgreSQL completo
- [x] API REST con Express.js
- [ ] Integrar autenticación JWT real vs PostgreSQL
- [ ] Plano detallado de salones y aulas
- [ ] Módulo de rutas interiores (Indoor Navigation)
- [ ] Búsqueda de horarios de salones
- [ ] Vista satélite con Google Maps
- [ ] Modo offline (PWA)
- [ ] App móvil con React Native

---

## 🤝 Contribución

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: descripción del cambio"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un **Pull Request**

---

## 📄 Licencia

Distribuido bajo la licencia **MIT**. Ver `LICENSE` para más información.

---

<div align="center">

Desarrollado para la **Universidad de Oriente — UNIVO**  
San Miguel, El Salvador 🇸🇻

</div>
