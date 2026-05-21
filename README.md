# SAFECLASS Backend — Manual del Desarrollador

REST API para el sistema de monitoreo de seguridad escolar SAFECLASS.

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Requisitos del sistema](#2-requisitos-del-sistema)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Configuración del entorno](#4-configuración-del-entorno)
5. [Instalación y arranque](#5-instalación-y-arranque)
6. [Scripts disponibles](#6-scripts-disponibles)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Base de datos](#8-base-de-datos)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Módulos y responsabilidades](#10-módulos-y-responsabilidades)
11. [API — Referencia de endpoints](#11-api--referencia-de-endpoints)
12. [Autenticación y autorización](#12-autenticación-y-autorización)
13. [Middleware](#13-middleware)
14. [Eventos en tiempo real (SSE)](#14-eventos-en-tiempo-real-sse)
15. [Credenciales de prueba](#15-credenciales-de-prueba)
16. [Convenciones de código](#16-convenciones-de-código)
17. [Guía de contribución](#17-guía-de-contribución)

---

## 1. Descripción general

SAFECLASS Backend es una API REST construida con Node.js y Express que sirve como núcleo del sistema de monitoreo de seguridad escolar. Gestiona:

- Autenticación JWT con refresh tokens y recuperación de contraseña.
- Gestión de alertas de seguridad generadas por módulos de IA (agresión, aislamiento, caída, otro).
- Transmisión de alertas en tiempo real mediante Server-Sent Events (SSE).
- Administración de usuarios con roles diferenciados (docente, coordinador, administrador).
- Monitoreo de aulas y estado de cámaras RTSP.
- Estadísticas para dashboards por rol.

---

## 2. Requisitos del sistema

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 18.x LTS | ES Modules (`"type": "module"`) |
| npm | 9.x | Incluido con Node.js 18 |
| PostgreSQL | 14.x | Instancia local o remota |
| Prisma CLI | 5.x | Se instala como devDependency |

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| Runtime | Node.js | 18+ | Entorno de ejecución |
| Framework | Express | ^4.19.2 | Servidor HTTP y enrutamiento |
| ORM | Prisma | ^5.19.0 | Acceso tipado a PostgreSQL |
| Base de datos | PostgreSQL | 14+ | Persistencia relacional |
| Autenticación | jsonwebtoken | ^9.0.2 | JWT access + refresh tokens |
| Hash contraseñas | bcryptjs | ^2.4.3 | Almacenamiento seguro de passwords |
| Seguridad | helmet | ^7.1.0 | Cabeceras HTTP de seguridad |
| CORS | cors | ^2.8.5 | Control de origen cruzado |
| Rate limiting | express-rate-limit | ^7.4.0 | Protección contra abuso de API |
| Cookies | cookie-parser | ^1.4.6 | Manejo de refresh token en cookie |
| UUID | uuid | ^10.0.0 | Generación de IDs únicos |
| Variables de entorno | dotenv | ^16.4.5 | Carga de `.env` |
| Dev server | nodemon | ^3.1.4 | Hot-reload en desarrollo |

---

## 4. Configuración del entorno

### 4.1 Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd SAFECLASS_Backend
```

### 4.2 Crear archivo `.env`

```bash
cp .env.example .env
```

Editar `.env` con las credenciales reales (ver sección [9. Variables de entorno](#9-variables-de-entorno)).

### 4.3 Instalar dependencias

```bash
npm install
```

### 4.4 Preparar la base de datos

```bash
# Crear la base de datos en PostgreSQL primero:
# psql -U postgres -c "CREATE DATABASE safeclass_db;"

# Aplicar migraciones y generar cliente Prisma:
npm run db:migrate

# Poblar con datos iniciales (usuarios, aulas, cámaras, alertas de prueba):
npm run db:seed
```

### 4.5 Levantar el servidor

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

---

## 5. Instalación y arranque

### Desarrollo

```bash
npm run dev      # Inicia con nodemon (hot-reload)
```

### Producción

```bash
npm run db:deploy   # Aplica migraciones sin prompts interactivos
npm start           # Inicia con node directamente
```

### Verificar que el servidor responde

```bash
curl http://localhost:3000/health
# → {"status":"ok","ts":"2026-05-21T..."}
```

---

## 6. Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| Servidor desarrollo | `npm run dev` | Nodemon con hot-reload automático |
| Servidor producción | `npm start` | Node sin watcher |
| Migración dev | `npm run db:migrate` | Crea/aplica migraciones y regenera cliente |
| Migración deploy | `npm run db:deploy` | Aplica migraciones sin interacción (CI/CD) |
| Seed | `npm run db:seed` | Inserta datos de prueba idempotentes |
| Prisma Studio | `npm run db:studio` | GUI web para explorar la BD en `localhost:5555` |
| Generar cliente | `npm run db:generate` | Regenera `@prisma/client` sin migrar |

---

## 7. Estructura del proyecto

```
SAFECLASS_Backend/
├── prisma/
│   ├── schema.prisma          # Definición del esquema de base de datos
│   └── seed.js                # Script de datos iniciales
├── src/
│   ├── index.js               # Punto de entrada: levanta el servidor HTTP
│   ├── app.js                 # Configura Express: middlewares y rutas
│   ├── config/
│   │   ├── env.js             # Validación y exportación de variables de entorno
│   │   └── database.js        # Singleton del cliente Prisma
│   ├── middlewares/
│   │   ├── auth.middleware.js  # Verificación de JWT en cabecera Authorization
│   │   ├── role.middleware.js  # Control de acceso basado en roles (RBAC)
│   │   └── error.middleware.js # Manejador global de errores Express
│   └── modules/
│       ├── auth/
│       │   ├── auth.routes.js      # Rutas: login, refresh, logout, forgot/reset password
│       │   ├── auth.controller.js  # Controladores HTTP del módulo de auth
│       │   └── auth.service.js     # Lógica de negocio: tokens, bcrypt, reset tokens
│       ├── alerts/
│       │   ├── alerts.routes.js    # Rutas: CRUD + SSE stream
│       │   ├── alerts.controller.js
│       │   └── alerts.service.js   # Gestión de suscriptores SSE, queries filtrables
│       ├── classrooms/
│       │   ├── classrooms.routes.js
│       │   ├── classrooms.controller.js
│       │   └── classrooms.service.js
│       ├── cameras/
│       │   ├── cameras.routes.js   # Incluye endpoint de test RTSP
│       │   ├── cameras.controller.js
│       │   └── cameras.service.js
│       ├── users/
│       │   ├── users.routes.js     # Solo accesible por administrador
│       │   ├── users.controller.js
│       │   └── users.service.js
│       └── stats/
│           ├── stats.routes.js     # Dashboard, Coordinator, System
│           ├── stats.controller.js
│           └── stats.service.js
├── .env.example               # Plantilla de variables de entorno
├── package.json
└── README.md
```

### Patrón de módulos

Cada módulo bajo `src/modules/` sigue la misma separación de capas:

```
módulo/
├── módulo.routes.js     → define rutas Express y aplica middlewares de auth/role
├── módulo.controller.js → extrae params de req, llama al service, devuelve res
└── módulo.service.js    → lógica de negocio, queries Prisma, sin HTTP
```

---

## 8. Base de datos

### 8.1 Diagrama de modelos

```
User ──────────────────────────────────────────────────────┐
 │  id (uuid PK)                                            │
 │  name, email (unique), passwordHash                      │
 │  role: docente | coordinador | administrador             │
 │  active, lastSession, createdAt                          │
 │                                                          │
 ├──< AlertAction >── Alert                                 │
 │                      id (uuid PK)                        │
 │                      type: AGRESION | AISLAMIENTO |      │
 │                            CAIDA | OTRO                  │
 │                      status: PENDIENTE | CONFIRMADA |    │
 │                              DESCARTADA                  │
 │                      confidence (Float 0-1)              │
 │                      notes, discardReason                │
 │                      escalated (Boolean)                 │
 │                      escalatedToId → User                │
 │                      classroomId → Classroom             │
 │                      cameraId → Camera                   │
 │                      createdAt, resolvedAt               │
 │                                                          │
 ├──< PasswordResetToken                                    │
 └──< RefreshToken                                          │
                                                            │
Classroom ─────────────────────────────────────────────────┤
 id (uuid PK)                                               │
 name (unique)                                              │
 status: active | alert | offline                           │
 ├──< Camera                                                │
 └──< Alert                                                 │
                                                            │
Camera ─────────────────────────────────────────────────────┘
 id (uuid PK)
 name, rtspUrl
 classroomId → Classroom
 active, status: online | offline | error
 fps, resolution, lastCheck
```

### 8.2 Enumeraciones

| Enum | Valores |
|---|---|
| `Role` | `docente`, `coordinador`, `administrador` |
| `AlertType` | `AGRESION`, `AISLAMIENTO`, `CAIDA`, `OTRO` |
| `AlertStatus` | `PENDIENTE`, `CONFIRMADA`, `DESCARTADA` |
| `CameraStatus` | `online`, `offline`, `error` |
| `ClassroomStatus` | `active`, `alert`, `offline` |
| `ModuleStatus` | `ok`, `warn`, `error` |

### 8.3 Prisma Studio

Para explorar la base de datos visualmente:

```bash
npm run db:studio
# Abre en http://localhost:5555
```

### 8.4 Crear nueva migración

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

---

## 9. Variables de entorno

Archivo `.env` en la raíz del proyecto (`SAFECLASS_Backend/.env`):

| Variable | Requerida | Por defecto | Descripción |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Sí | — | Secreto para firmar access tokens (256 bits) |
| `JWT_EXPIRES_IN` | No | `60m` | TTL del access token |
| `JWT_REFRESH_SECRET` | Sí | — | Secreto para firmar refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | TTL del refresh token |
| `PORT` | No | `3000` | Puerto del servidor HTTP |
| `NODE_ENV` | No | `development` | Entorno (`development` / `production`) |
| `FRONTEND_URL` | No | `http://localhost:5173` | Origen permitido por CORS |
| `RESET_TOKEN_TTL_MINUTES` | No | `30` | Duración del token de recuperación de contraseña |

**Ejemplo de `.env`:**

```env
DATABASE_URL="postgresql://postgres:mi_password@localhost:5432/safeclass_db"
JWT_SECRET="un_secreto_aleatorio_de_256_bits_aqui"
JWT_EXPIRES_IN="60m"
JWT_REFRESH_SECRET="otro_secreto_aleatorio_diferente"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
RESET_TOKEN_TTL_MINUTES=30
```

---

## 10. Módulos y responsabilidades

### auth

Gestión completa del ciclo de vida de sesiones:

- `login`: Valida credenciales, genera access token (JWT) + refresh token (cookie HttpOnly).
- `refresh`: Rota el refresh token y emite nuevo access token.
- `logout`: Revoca el refresh token en base de datos.
- `forgot-password`: Genera token de recuperación con TTL configurable.
- `reset-password`: Valida token y actualiza hash de contraseña.

### alerts

Núcleo del sistema de incidencias:

- CRUD de alertas con filtros combinables (`status`, `type`, `classroom`, `page`, `limit`).
- SSE stream (`/api/alerts/stream`): mantiene conexiones persistentes y notifica a todos los suscriptores al crear o actualizar una alerta.
- Acciones: `confirm`, `discard` (requiere razón), `escalate` (asigna a coordinador).
- Registro de auditoría en `AlertAction` por cada acción realizada.

### classrooms

- Lista aulas con su estado actual y cámaras asociadas.
- El estado (`active`, `alert`, `offline`) se actualiza automáticamente según las alertas pendientes.

### cameras

- Lista cámaras con métricas de estado (fps, resolución, último check).
- Actualización de configuración de cámara (solo administrador).
- Test de conexión RTSP bajo demanda (solo administrador).

### users

- CRUD de usuarios restringido al rol `administrador`.
- Toggle de estado activo/inactivo sin eliminación física.

### stats

- `dashboard`: métricas rápidas para el rol docente (alertas del día, pendientes, por tipo).
- `coordinator`: datos semanales, distribución por tipo, heatmap temporal para coordinadores.
- `system`: estado de módulos IA, métricas de BD y sistema para administradores.

---

## 11. API — Referencia de endpoints

### Health

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Verifica disponibilidad del servidor |

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Inicio de sesión |
| POST | `/api/auth/refresh` | Cookie | Rota refresh token |
| POST | `/api/auth/logout` | Cookie | Cierra sesión |
| POST | `/api/auth/forgot-password` | No | Solicita reset de contraseña |
| POST | `/api/auth/reset-password` | No | Aplica nuevo password con token |

**Body de login:**
```json
{ "email": "user@iecol.edu.co", "password": "contraseña" }
```

**Respuesta exitosa de login:**
```json
{
  "token": "<access_token_jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "docente" }
}
```

### Alertas

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/api/alerts` | JWT | todos | Lista paginada con filtros |
| GET | `/api/alerts/:id` | JWT | todos | Detalle de una alerta |
| GET | `/api/alerts/stream` | JWT | todos | Stream SSE de alertas en tiempo real |
| PUT | `/api/alerts/:id/confirm` | JWT | todos | Confirma una alerta |
| PUT | `/api/alerts/:id/discard` | JWT | todos | Descarta con razón |
| PUT | `/api/alerts/:id/escalate` | JWT | todos | Escala al coordinador |

**Query params de listado:**
```
GET /api/alerts?page=1&limit=20&status=PENDIENTE&type=AGRESION&classroom=<id>
```

**Body de discard:**
```json
{ "reason": "Falsa alarma", "notes": "Era un juego entre estudiantes" }
```

### Aulas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/classrooms` | JWT | Lista todas las aulas |
| GET | `/api/classrooms/:id` | JWT | Detalle de un aula |

### Cámaras

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/api/cameras` | JWT | todos | Lista cámaras con estado |
| PUT | `/api/cameras/:id` | JWT | admin | Actualiza configuración |
| POST | `/api/cameras/:id/test` | JWT | admin | Prueba conexión RTSP |

### Usuarios

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/api/users` | JWT | admin | Lista todos los usuarios |
| POST | `/api/users` | JWT | admin | Crea nuevo usuario |
| PUT | `/api/users/:id/toggle` | JWT | admin | Activa/desactiva usuario |

**Body de creación de usuario:**
```json
{
  "name": "María Torres",
  "email": "maria.torres@iecol.edu.co",
  "password": "contraseña_segura",
  "role": "docente"
}
```

### Estadísticas

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| GET | `/api/stats/dashboard` | JWT | todos | KPIs del dashboard docente |
| GET | `/api/stats/coordinator` | JWT | coord, admin | Estadísticas semanales y heatmap |
| GET | `/api/stats/system` | JWT | admin | Estado de módulos IA y sistema |

---

## 12. Autenticación y autorización

### Flujo JWT

```
Cliente                    API
   │── POST /api/auth/login ──►│
   │◄── { token, user } ───────│  (token: 60 min, refresh en cookie HttpOnly)
   │                            │
   │── GET /api/alerts ─────────│  Authorization: Bearer <token>
   │   (con token válido)       │
   │◄── 200 OK ─────────────────│
   │                            │
   │── POST /api/auth/refresh ──►│  (cookie automática)
   │◄── { token } ──────────────│  (nuevo access token + rota refresh)
```

### Cabecera requerida

Todos los endpoints protegidos requieren:

```
Authorization: Bearer <access_token>
```

### Control de acceso por roles (RBAC)

El middleware `role.middleware.js` verifica que el rol del usuario esté en la lista permitida para cada ruta:

| Rol | Endpoints accesibles |
|---|---|
| `docente` | dashboard, alerts, classrooms, cameras, history |
| `coordinador` | todo lo anterior + stats/coordinator |
| `administrador` | todo + users, cameras CRUD, stats/system |

---

## 13. Middleware

### `auth.middleware.js`

Verifica el JWT en la cabecera `Authorization: Bearer <token>`. En caso de token inválido o expirado devuelve `401 Unauthorized`. Adjunta el payload del token decodificado en `req.user`.

### `role.middleware.js`

Factory que recibe un array de roles permitidos:

```js
router.get('/', authenticate, authorize(['coordinador', 'administrador']), controller);
```

Devuelve `403 Forbidden` si el rol del usuario no está en la lista.

### `error.middleware.js`

Manejador global de Express que captura todos los errores no controlados. En `development` incluye el stack trace completo; en `production` devuelve mensajes genéricos sin exponer detalles internos.

---

## 14. Eventos en tiempo real (SSE)

El endpoint `GET /api/alerts/stream` implementa Server-Sent Events para notificación inmediata de nuevas alertas sin necesidad de polling.

**Características:**
- Requiere autenticación JWT igual que el resto de endpoints.
- Mantiene la conexión abierta (header `Content-Type: text/event-stream`).
- Envía `ping` periódico para mantener la conexión activa.
- Al desconectarse el cliente, se limpia su suscripción automáticamente.
- Cuando se crea o actualiza una alerta, el servicio notifica a todos los suscriptores activos.

**Ejemplo de conexión desde el cliente:**

```js
const es = new EventSource('/api/alerts/stream', {
  headers: { Authorization: `Bearer ${token}` }
});
es.addEventListener('alert', (e) => {
  const alert = JSON.parse(e.data);
  console.log('Nueva alerta:', alert);
});
```

---

## 15. Credenciales de prueba

Insertadas por `npm run db:seed`:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@iecol.edu.co` | `admin1234` | administrador |
| `coordinador@iecol.edu.co` | `coord1234` | coordinador |
| `maria.torres@iecol.edu.co` | `safeclass` | docente |

---

## 16. Convenciones de código

- **ES Modules**: usar `import`/`export`, no `require`. El proyecto tiene `"type": "module"` en `package.json`.
- **Async/await**: toda la lógica asíncrona usa `async/await`. Los errores se propagan con `throw` hacia el `errorHandler`.
- **Prisma**: instanciar el cliente una sola vez desde `src/config/database.js` y reutilizar el singleton.
- **Validación de env**: añadir nuevas variables en `src/config/env.js`; usar `required()` para las obligatorias.
- **Nombrado de archivos**: `kebab-case` con sufijo de capa (`.routes.js`, `.controller.js`, `.service.js`).
- **Errores HTTP**: lanzar objetos con `{ status, message }` desde los services para que `errorHandler` los formatee correctamente.

---

## 17. Guía de contribución

### Añadir un nuevo módulo

1. Crear carpeta `src/modules/<nombre>/` con los tres archivos de capa.
2. Registrar las rutas en `src/app.js`:
   ```js
   import nuevoModuloRoutes from './modules/nuevo-modulo/nuevo-modulo.routes.js';
   app.use('/api/nuevo-modulo', nuevoModuloRoutes);
   ```
3. Si requiere nuevos modelos, añadirlos en `prisma/schema.prisma` y ejecutar `npm run db:migrate`.

### Añadir un nuevo campo a un modelo

1. Modificar `prisma/schema.prisma`.
2. Ejecutar `npm run db:migrate -- --name descripcion_del_cambio`.
3. Actualizar los services que usen ese modelo.

### Cambios de seguridad

- Nunca exponer `passwordHash` en respuestas de API.
- Siempre aplicar `authenticate` y `authorize` en rutas sensibles.
- Rotar `JWT_SECRET` y `JWT_REFRESH_SECRET` en producción regularmente.
- Usar variables de entorno; jamás hardcodear secretos en el código.
