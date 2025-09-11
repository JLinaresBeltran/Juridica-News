# ⚖️ Sistema Editorial Jurídico Supervisado

> **Una estación de trabajo digital especializada que combina automatización inteligente con supervisión profesional para la producción de contenido jurídico de alta calidad.**

**Estado del Proyecto:** 🚀 **82% Completado** - Sistema funcional en desarrollo

---

## 📖 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Características Principales](#-características-principales)
- [Estado de Implementación](#-estado-de-implementación)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [Web Scraping](#️-web-scraping)
- [Arquitectura Técnica](#-arquitectura-técnica)
- [Desarrollo](#-desarrollo)
- [Contribución](#-contribución)

## 🎯 Visión General

El **Sistema Editorial Jurídico Supervisado** es una plataforma digital avanzada diseñada para acelerar la producción de contenido jurídico especializado manteniendo los más altos estándares profesionales mediante supervisión humana experta.

### 💡 Valor Principal
Transforma la manera en que se produce, cura y publica contenido jurídico, integrando automatización inteligente con supervisión profesional.

### 🏗️ Arquitectura del Sistema
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Prisma ORM
- **Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **Web Scraping:** Python + Selenium
- **Tiempo Real:** Server-Sent Events (SSE)
- **Autenticación:** JWT + Refresh Tokens + RBAC

## ✨ Características Principales

### 🎯 **Portal Público Jurídico**
- **9 Secciones Especializadas:** Administrativo, Civil, Comercial, Digital, Familia, Laboral, Opinión, Penal, Tributario
- **Navegación Optimizada:** Categorización y búsqueda avanzada
- **SEO Optimizado:** Metadatos, slugs y contador de vistas
- **Responsive Design:** Adaptado para todos los dispositivos

### 📊 **Dashboard Administrativo**
- **Sistema de Curación:** Dashboard completo con filtros y acciones por lotes
- **Gestión de Documentos:** Estados, preview modal, curación individual
- **Gestión de Artículos:** Editor completo con versionado
- **Monitoreo en Tiempo Real:** SSE para notificaciones instantáneas

### 🕷️ **Web Scraping Automatizado**
- **Extractor de Corte Constitucional:** Sistema Python completamente funcional
- **Selenium WebDriver:** Navegación automatizada con Chrome headless
- **Extracción Inteligente:** Búsqueda por fechas hábiles (últimos 7-15 días)
- **Tipos de Documentos:** Sentencias T, C, SU y Autos A

### 🔐 **Sistema de Autenticación**
- **JWT + Refresh Tokens:** Autenticación segura y persistente
- **RBAC:** Control de acceso basado en roles
- **Gestión de Usuarios:** Perfiles, departamentos y permisos

### 🎨 **Sistema de Diseño**
- **Componentes Profesionales:** Header, Sidebar, Modales, Cards
- **Inter Font:** Tipografía profesional
- **Dark Mode:** Soporte completo para tema oscuro
- **Animaciones:** Framer Motion para transiciones suaves

## 📊 Estado de Implementación

### ✅ **Completamente Implementado (82%)**

#### **Frontend - 92% Completado**
- [x] Sistema de diseño y componentes UI
- [x] Routing y navegación (público y protegido)
- [x] Gestión de estado con Zustand (3 stores)
- [x] Integración completa con API
- [x] Portal público con 9 secciones
- [x] Dashboard administrativo funcional

#### **Backend - 90% Completado**
- [x] 40+ endpoints REST + SSE implementados
- [x] Base de datos Prisma con 9 modelos
- [x] Sistema de autenticación completo
- [x] Middleware de seguridad (Helmet, CORS, Rate limiting)
- [x] Documentación API (Swagger)
- [x] Logging estructurado (Winston)

#### **Integración - 88% Completado**
- [x] Frontend ↔ Backend completamente integrados
- [x] Autenticación end-to-end funcional
- [x] SSE para notificaciones en tiempo real
- [x] Sistema de persistencia con validación

#### **Web Scraping - 100% Implementado**
- [x] Extractor Python completamente funcional
- [x] Selenium WebDriver configurado
- [x] Integración con backend Node.js
- [x] Manejo de errores y logging

### 🔄 **Parcialmente Implementado**

#### **Servicios AI - 35% Completado**
- [x] Estructura y endpoints preparados
- [x] Gemini AI y OpenAI SDK configurados
- [ ] Integración completa con servicios reales

#### **Editor de Artículos - 60% Completado**
- [x] Editor básico TipTap implementado
- [x] Versionado en backend
- [ ] Auto-save system
- [ ] Split-view comparativo

### ❌ **Pendiente de Implementación**

- **Redis Cache:** Error de conexión activo
- **Elasticsearch:** Motor de búsqueda full-text
- **Tests Suite:** Configuración lista, tests pendientes
- **Docker:** Configuración para deployment
- **Media Storage:** AWS S3/MinIO

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** 18+ 
- **Python** 3.11+ (para web scraping)
- **Git**
- **Chrome/Chromium** (para web scraping)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd Juridica-News
```

### 2. Instalación de Dependencias
```bash
# Instalar todas las dependencias (root, backend, frontend)
npm run install:all

# O instalar por separado:
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies  
cd ../frontend && npm install  # Frontend dependencies
```

### 3. Configuración de Base de Datos
```bash
# Generar Prisma client
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos iniciales
npm run db:seed
```

### 4. Variables de Entorno
Crea un archivo `.env` en el directorio `backend/` basado en `.env.example`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

## 🎮 Uso del Sistema

### Desarrollo Full Stack
```bash
# Ejecutar backend + frontend simultáneamente
npm run dev:all

# O ejecutar por separado:
npm run dev:backend   # Backend en puerto 3001
npm run dev:frontend  # Frontend en puerto 5173
```

### Acceso al Sistema
- **Frontend (Portal Público):** http://localhost:5173/portal
- **Frontend (Dashboard Admin):** http://localhost:5173/dashboard
- **Backend API:** http://localhost:3001/api
- **Documentación API:** http://localhost:3001/api-docs

### Credenciales por Defecto
```
Email: admin@editorial.com
Password: admin123
```

## 🕷️ Web Scraping

### Extractor de Corte Constitucional

El sistema incluye un extractor Python completamente funcional para la Corte Constitucional de Colombia:

```bash
# Ejecutar extractor (desde directorio raíz)
/Users/jhonathan/Desktop/Juridica-News/backend/services/scraping/venv/bin/python ./backend/services/scraping/run_extractor.py --source corte_constitucional --limit 5

# Opciones disponibles:
--source corte_constitucional    # Fuente a extraer
--limit [número]                 # Límite de documentos (default: 10)
--download                       # Descargar documentos RTF/DOCX
```

### Características del Scraping
- **Navegación Automatizada:** Selenium WebDriver con Chrome headless
- **Búsqueda Inteligente:** Por fechas hábiles recientes
- **Validación de URLs:** Cache para optimizar verificaciones
- **Tipos de Documentos:** Sentencias T, C, SU y Autos A
- **Integración Automática:** Se conecta con el backend Node.js

### Archivos del Sistema de Scraping
- `backend/services/scraping/corte_constitucional_extractor.py` (656 líneas)
- `backend/services/scraping/run_extractor.py` (121 líneas)
- `backend/services/scraping/base.py` - Clase base para extractores

## 🏗️ Arquitectura Técnica

### Stack Tecnológico Implementado

#### **Frontend (React SPA)**
- **Framework:** React 18 + TypeScript + Vite
- **Estado:** Zustand + React Query para cache
- **Styling:** Tailwind CSS + Headless UI
- **Componentes:** Sistema de diseño personalizado
- **Testing:** Vitest + React Testing Library
- **Extras:** Framer Motion, TipTap Editor, Lucide Icons

#### **Backend (Node.js API)**
- **Framework:** Express.js + TypeScript
- **ORM:** Prisma con SQLite/PostgreSQL
- **Autenticación:** JWT + Refresh Tokens + RBAC
- **Real-time:** Server-Sent Events (SSE)
- **Documentación:** OpenAPI 3.0 + Swagger UI
- **Seguridad:** Helmet, CORS, Rate Limiting
- **Logging:** Winston Logger estructurado

#### **Web Scraping (Python)**
- **Automatización:** Selenium WebDriver
- **Navegador:** Chrome headless optimizado
- **Extracción:** Patrones de fecha y contenido
- **Integración:** Scripts compatibles con Node.js

### Estructura del Proyecto
```
Juridica-News/
├── 📁 backend/                 # API Node.js + Express
│   ├── prisma/                 # Schema y migraciones DB
│   ├── src/                    # Código fuente backend
│   │   ├── controllers/        # Endpoints REST
│   │   ├── middleware/         # Auth, validación, errores
│   │   ├── services/           # Lógica de negocio
│   │   └── utils/              # Utilidades (logger, swagger)
│   └── services/scraping/      # Sistema Python scraping
├── 📁 frontend/                # SPA React + TypeScript
│   ├── src/                    # Código fuente frontend
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas y rutas
│   │   ├── services/           # API clients
│   │   ├── stores/             # Estado global (Zustand)
│   │   └── utils/              # Utilidades frontend
├── 📁 shared/                  # Tipos TypeScript compartidos
├── 📁 technical-patterns/      # Patrones y guías técnicas
├── 📄 CLAUDE.md               # Documentación completa
└── 📄 README.md               # Este archivo
```

## 🛠️ Desarrollo

### Comandos Principales

#### **Backend**
```bash
cd backend/
npm run dev          # Desarrollo con hot reload
npm run build        # Build para producción
npm run test         # Ejecutar tests
npm run db:studio    # Prisma Studio (GUI DB)
```

#### **Frontend**
```bash
cd frontend/
npm run dev          # Desarrollo en localhost:5173
npm run build        # Build optimizado
npm run preview      # Preview del build
npm run lint         # ESLint + Prettier
npm run typecheck    # Verificación TypeScript
```

#### **Base de Datos**
```bash
npm run db:generate  # Generar Prisma client
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar con datos iniciales
npm run db:reset     # Reset completo + seed
```

### Patrones de Desarrollo
- **TypeScript estricto** en todo el proyecto
- **Validación con Zod** en APIs
- **Logging estructurado** con Winston
- **Manejo de errores centralizado**
- **Autenticación stateless** con JWT
- **Componentes reutilizables** con props tipadas

## 🚨 Problemas Conocidos

### Errores Activos
- **Redis Connection:** `Error: connect ECONNREFUSED 127.0.0.1:6379`
- **Database:** SQLite funciona, migración a PostgreSQL pendiente

### Servicios Pendientes
- **Elasticsearch:** Motor de búsqueda full-text
- **Media Storage:** AWS S3/MinIO para archivos
- **Email Service:** Notificaciones y verificación
- **Docker:** Configuración para deployment

## 📋 Próximos Pasos

1. **Configurar Redis** para cache y sesiones
2. **Implementar AI Services** reales (conectar APIs)
3. **Tests Suite** para backend y frontend
4. **Docker Configuration** para deployment
5. **Elasticsearch Integration** para búsqueda avanzada
6. **Ampliar Web Scraping** para más fuentes jurídicas

## 🤝 Contribución

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit changes: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

### Estándares de Código
- **ESLint + Prettier** configurados
- **TypeScript strict mode** habilitado
- **Conventional Commits** para mensajes
- **Tests requeridos** para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:
- **Issues:** Utiliza el sistema de issues de GitHub
- **Documentación:** Consulta `CLAUDE.md` para documentación técnica completa
- **API Docs:** http://localhost:3001/api-docs (cuando esté ejecutándose)

---

<p align="center">
  <b>⚖️ Sistema Editorial Jurídico Supervisado</b><br>
  <i>Transformando la producción de contenido jurídico con tecnología avanzada</i>
</p>

<p align="center">
  <b>Estado: 82% Completado - Sistema Funcional en Desarrollo</b>
</p>