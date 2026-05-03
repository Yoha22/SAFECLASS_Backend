# SAFECLASS Backend

REST API para el sistema de monitoreo de seguridad escolar SAFECLASS.

## Stack

Node.js · Express · PostgreSQL · Prisma ORM · JWT

## Arranque rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y secretos JWT

# 3. Crear la base de datos y aplicar migraciones
npm run db:migrate

# 4. Poblar con datos iniciales
npm run db:seed

# 5. Levantar servidor en modo desarrollo
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con hot-reload (nodemon) |
| `npm start` | Producción |
| `npm run db:migrate` | Aplicar migraciones pendientes |
| `npm run db:seed` | Insertar datos de prueba |
| `npm run db:studio` | Abrir Prisma Studio (GUI de BD) |

## Estructura

```
src/
├── config/        env.js · database.js
├── middlewares/   auth · role · error
├── modules/
│   ├── auth/      login · logout · forgot/reset password
│   ├── alerts/    CRUD + SSE stream
│   ├── classrooms/
│   ├── cameras/   + test de conexión RTSP
│   ├── users/     solo administrador
│   └── stats/     dashboard · coordinator · system
└── app.js · index.js
prisma/
├── schema.prisma
└── seed.js
```

## Endpoints principales

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/refresh

GET    /api/alerts?page&limit&status&type&classroom
GET    /api/alerts/stream          (SSE)
PUT    /api/alerts/:id/confirm
PUT    /api/alerts/:id/discard
PUT    /api/alerts/:id/escalate

GET    /api/classrooms
GET    /api/cameras
PUT    /api/cameras/:id
POST   /api/cameras/:id/test

GET    /api/users                  (admin)
POST   /api/users                  (admin)
PUT    /api/users/:id/toggle       (admin)

GET    /api/stats/dashboard
GET    /api/stats/coordinator
GET    /api/stats/system           (admin)

GET    /health
```
