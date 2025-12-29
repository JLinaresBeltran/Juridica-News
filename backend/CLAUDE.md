# CLAUDE.md - Backend

Guía específica para Claude Code cuando trabaje con el backend del **Sistema Editorial Jurídico Supervisado**.

---

## 📋 Índice

1. [Visión General](#-visión-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Comandos Esenciales](#-comandos-esenciales)
5. [Base de Datos (Prisma)](#-base-de-datos-prisma)
6. [Arquitectura de Adaptadores](#-arquitectura-de-adaptadores)
7. [Servicios Principales](#-servicios-principales)
8. [Sistema de Scraping](#-sistema-de-scraping)
9. [Rutas y Controladores](#-rutas-y-controladores)
10. [Sistema de Imágenes AI](#-sistema-de-imágenes-ai)
11. [Autenticación y Seguridad](#-autenticación-y-seguridad)
12. [Variables de Entorno](#-variables-de-entorno)
13. [Guías de Desarrollo](#-guías-de-desarrollo)
14. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visión General

El backend es una API RESTful construida con **Node.js + Express + TypeScript** que:

- ✅ **Extrae documentos legales** de fuentes oficiales colombianas mediante scrapers modulares
- ✅ **Analiza contenido** con múltiples proveedores de IA (OpenAI, Gemini, Claude)
- ✅ **Gestiona imágenes AI** con biblioteca compartida y metadatos SEO
- ✅ **Publica artículos** en portal público con 9 secciones legales
- ✅ **Notifica en tiempo real** mediante Server-Sent Events (SSE)
- ✅ **Documenta automáticamente** con Swagger UI

**Estado actual**: 82% completo - Sistema funcional con servicios AI mockeados listos para integración real.

---

## 🛠️ Stack Tecnológico

### Core
- **Runtime**: Node.js 18+ con TypeScript 5.3
- **Framework**: Express 4.18
- **Base de datos**: SQLite (dev) / PostgreSQL (prod) vía Prisma ORM 5.7
- **Validación**: Zod 3.22 para schemas de entrada
- **Logging**: Winston 3.11 con rotación de archivos

### IA y Procesamiento
- **OpenAI SDK** 5.19 - GPT-4, GPT-4o, DALL-E 3
- **Anthropic SDK** 0.65 - Claude 3.5 Sonnet, Claude 3 Opus
- **Google AI SDK** 0.24 - Gemini 1.5 Pro/Flash, Gemini Imagen
- **Mammoth** 1.10 - Extracción de texto DOCX
- **Cheerio** 1.1 - Parsing HTML para scraping
- **Puppeteer** 24.20 - Web scraping con headless Chrome

### Seguridad y Middleware
- **Helmet** 7.1 - Headers de seguridad HTTP
- **CORS** 2.8 - Configuración cross-origin
- **JWT** (jsonwebtoken 9.0) - Tokens de autenticación
- **Bcrypt** 2.4 - Hashing de contraseñas
- **Express Rate Limit** 7.1 - Protección contra ataques

### Infraestructura
- **Redis** 4.6 - Caché y colas (opcional)
- **BullMQ** 5.1 - Sistema de colas con Redis
- **Sharp** 0.34 - Procesamiento de imágenes
- **Morgan** 1.10 - HTTP request logging

### Testing y Documentación
- **Vitest** 1.1 - Framework de testing
- **Supertest** 6.3 - Testing de endpoints HTTP
- **Swagger** (swagger-jsdoc 6.2, swagger-ui-express 5.0) - Documentación API

### Build Tools
- **TSX** 4.6 - Ejecución directa de TypeScript (dev)
- **tsc-alias** 1.8 - Resolución de path aliases en build
- **ESLint** 8.56 - Linting de código TypeScript

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── adapters/              # 🔌 Arquitectura de adaptadores (Black Box)
│   │   ├── ai/                # Proveedores de IA (OpenAI, Gemini, Claude)
│   │   ├── content/           # Procesamiento de documentos (DOCX, PDF)
│   │   ├── storage/           # Persistencia (Prisma, file system)
│   │   ├── metadata/          # Extracción de metadatos legales
│   │   └── events/            # Sistema de notificaciones (SSE)
│   │
│   ├── controllers/           # 🎮 Controladores HTTP
│   │   ├── articles.ts        # CRUD de artículos
│   │   ├── documents.ts       # CRUD de documentos
│   │   ├── ai.ts              # Generación de contenido AI
│   │   ├── auth.ts            # Login, registro, refresh tokens
│   │   ├── scraping-v2.ts     # Sistema de extracción v2 (modular)
│   │   ├── public.ts          # Portal público (sin auth)
│   │   ├── media.ts           # Upload y gestión de archivos
│   │   ├── sse.ts             # Server-Sent Events
│   │   └── health.ts          # Health checks y métricas
│   │
│   ├── services/              # 🏢 Lógica de negocio
│   │   ├── ScrapingOrchestrator.ts       # Orquesta extracción de documentos
│   │   ├── AiAnalysisService.ts          # Análisis AI de documentos
│   │   ├── AIImagePromptGenerator.ts     # Generación de prompts para imágenes
│   │   ├── ImageStorageService.ts        # Gestión de biblioteca de imágenes
│   │   ├── ImageTagService.ts            # Sistema de etiquetado inteligente
│   │   ├── ArticlePositioningService.ts  # Posicionamiento en portal
│   │   ├── PublicationPositionService.ts # Gestión de orden de publicación
│   │   └── QueueManager.ts               # Gestión de colas con BullMQ
│   │
│   ├── scrapers/              # 🕷️ Extractores de fuentes legales
│   │   ├── base/              # Clases base abstractas
│   │   │   ├── BaseScrapingService.ts    # Clase base para scrapers
│   │   │   ├── types.ts                  # Tipos compartidos
│   │   │   └── SourceRegistry.ts         # Registro de fuentes
│   │   ├── corte-constitucional/         # Scraper Corte Constitucional
│   │   ├── consejo-estado/               # Scraper Consejo de Estado
│   │   └── index.ts                      # Factory de scrapers
│   │
│   ├── routes/                # 🛣️ Definición de rutas
│   │   ├── storage.ts         # Endpoints de imágenes y biblioteca
│   │   └── seo.ts             # Endpoints de optimización SEO
│   │
│   ├── middleware/            # 🛡️ Middleware HTTP
│   │   ├── auth.ts            # Validación de JWT
│   │   ├── errorHandler.ts   # Manejo centralizado de errores
│   │   ├── requestLogger.ts  # Logging de peticiones
│   │   └── validation.ts     # Validación de schemas Zod
│   │
│   ├── utils/                 # 🔧 Utilidades
│   │   ├── logger.ts          # Logger Winston configurado
│   │   ├── swagger.ts         # Setup de Swagger docs
│   │   ├── slug.ts            # Generación de slugs SEO
│   │   ├── text.ts            # Utilidades de texto
│   │   └── cleanOrphanImages.ts # Limpieza de imágenes huérfanas
│   │
│   ├── scripts/               # 📜 Scripts de utilidad
│   │   ├── seed.ts            # Seed inicial de BD
│   │   ├── reprocess-documents.ts # Re-análisis de documentos
│   │   └── test-scraping-*.ts     # Scripts de debug de scrapers
│   │
│   └── server.ts              # 🚀 Punto de entrada del servidor
│
├── prisma/
│   ├── schema.prisma          # 📊 Definición del modelo de datos
│   ├── migrations/            # Migraciones de BD
│   └── dev.db                 # SQLite (desarrollo)
│
├── storage/                   # 💾 Almacenamiento local
│   ├── documents/             # Archivos DOCX/RTF originales
│   ├── images/                # Imágenes generadas por IA
│   └── logs/                  # Logs de aplicación
│
├── tests/                     # 🧪 Tests (Vitest)
├── dist/                      # 📦 Build de producción (generado)
├── .env                       # 🔐 Variables de entorno
├── .env.example               # Ejemplo de configuración
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
└── CLAUDE.md                  # 📖 Esta guía
```

---

## ⚡ Comandos Esenciales

### Desarrollo

```bash
# Iniciar servidor con hot-reload
npm run dev

# Verificar tipos sin compilar
npm run type-check

# Ejecutar linter y auto-fix
npm run lint
```

### Base de Datos

```bash
# Generar cliente Prisma después de cambios en schema
npm run db:generate

# Crear y aplicar migración
npm run db:migrate

# Reiniciar BD y aplicar seed
npm run db:reset

# Abrir Prisma Studio (GUI)
npm run db:studio

# Solo seed (sin reset)
npm run db:seed
```

### Build y Producción

```bash
# Compilar TypeScript + resolver aliases
npm run build

# Ejecutar versión compilada
npm start
```

### Scripts de Utilidad

```bash
# Re-procesar documentos con nuevo análisis AI
npm run reprocess-documents

# Testing (Vitest)
npm run test
npm run test:coverage
```

---

## 📊 Base de Datos (Prisma)

### Modelos Principales

#### **User** - Usuarios del sistema
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   # Hasheado con bcrypt
  firstName   String
  lastName    String
  role        String   @default("EDITOR")  # ADMIN | EDITOR | VIEWER
  status      String   @default("ACTIVE")  # ACTIVE | SUSPENDED
  lastLogin   DateTime?
  createdAt   DateTime @default(now())
}
```

**Relaciones**:
- `articlesCreated` → Articles creados
- `documentsCreated` → Documentos curados
- `refreshTokens` → Tokens de autenticación

#### **Document** - Documentos jurídicos extraídos
```prisma
model Document {
  id                 String    @id @default(cuid())
  title              String
  url                String    @unique
  content            String    # Resumen inteligente (≤10K chars)
  fullTextContent    String?   # Texto completo para búsqueda
  documentPath       String?   # Ruta al archivo DOCX/RTF original

  # Metadata de extracción
  source             String    # corte_constitucional | consejo_estado
  legalArea          String    # CONSTITUTIONAL | CIVIL | CRIMINAL
  documentType       String    # SENTENCE | RULING | DECREE
  status             String    # PENDING | APPROVED | REJECTED
  publicationDate    DateTime  # Fecha oficial de publicación
  webOfficialDate    DateTime? # Fecha extraída de la web oficial

  # Análisis IA
  numeroSentencia    String?   # Ej: "T-390/25"
  magistradoPonente  String?
  salaRevision       String?
  expediente         String?
  temaPrincipal      String?
  resumenIA          String?
  decision           String?
  aiAnalysisStatus   String?   # PENDING | IN_PROGRESS | COMPLETED
  aiModel            String?   # gpt-4o | gemini-1.5-pro | claude-3.5

  # Generación de artículos
  generatedArticle   String?
  generatedTitles    String?   # JSON array
  selectedTitle      String?
  articleModel       String?
  articleStyle       String?

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

**Flujo de vida**:
1. **PENDING** → Extraído por scraper, esperando revisión
2. **APPROVED** → Curador aprobó, listo para generar artículo
3. **REJECTED** → Descartado por curador
4. **ARCHIVED** → Archivado manualmente

#### **Article** - Artículos publicados
```prisma
model Article {
  id                  String    @id @default(cuid())
  title               String
  slug                String    @unique  # URL-friendly
  content             String    # HTML del artículo
  summary             String

  # SEO
  metaTitle           String?
  metaDescription     String?
  keywords            String
  canonicalUrl        String?

  # Clasificación
  legalArea           String
  publicationSection  String    # Ej: "Derecho Penal"
  tags                String    # JSON array

  # Estado de publicación
  status              String    # DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  publishedAt         DateTime?
  scheduledAt         DateTime?

  # Posicionamiento en portal
  isGeneral                 Boolean  # Sección general (destacados)
  isUltimasNoticias         Boolean  # Últimas noticias (recientes)
  isDestacadoSemana         Boolean  # Destacado de la semana
  isSeccionIntermedia       Boolean  # Sección intermedia
  isSeccionInferior         Boolean  # Sección inferior
  posicionGeneral           Int?     # Orden en sección general
  posicionUltimasNoticias   Int?     # Orden en últimas noticias

  # Metadata
  imageUrl            String?
  views               Int       @default(0)
  wordCount           Int
  readingTime         Int       # Minutos estimados

  # Relaciones
  authorId            String
  sourceDocumentId    String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

**Sistema de posicionamiento**: Los artículos pueden estar en múltiples secciones del portal con diferente orden de aparición.

#### **GeneratedImage** - Biblioteca de imágenes AI
```prisma
model GeneratedImage {
  id              String    @id @default(cuid())
  imageId         String    @unique        # Identificador externo (ej: img_abc123)
  filename        String                   # generated-timestamp-random.jpg
  originalUrl     String                   # URL original o "base64-image"
  localPath       String                   # Ruta en storage/images/

  # Metadata de imagen
  size            Int                      # Bytes
  width           Int
  height          Int
  format          String                   # jpeg | png | webp

  # Generación AI
  model           String                   # dalle | gemini | library
  style           String                   # persona | paisaje | elemento
  prompt          String                   # Prompt usado para generar
  metaDescription String?                  # Descripción SEO (max 125 chars)

  # Biblioteca y etiquetado
  tags            String    @default("[]") # JSON array de tags
  savedToLibrary  Boolean   @default(false)
  isPublic        Boolean   @default(false) # true = visible en todos los docs
  usageCount      Int       @default(0)
  lastUsedAt      DateTime?

  # Relaciones
  documentId      String?
  articleId       String?

  createdAt       DateTime  @default(now())
}
```

**Sistema de visibilidad**:
- `isPublic: false` → Solo visible en el documento asociado
- `isPublic: true` → Visible en todos los documentos (biblioteca global)

### Workflow de Migración

```bash
# 1. Editar schema.prisma
nano backend/prisma/schema.prisma

# 2. Generar tipos TypeScript actualizados
npm run db:generate

# 3. Crear migración con nombre descriptivo
npm run db:migrate
# Prompt: "add metaDescription to GeneratedImage"

# 4. Los tipos están disponibles automáticamente
import { PrismaClient } from '@prisma/client'
```

**IMPORTANTE**: Siempre ejecutar `db:generate` antes de `db:migrate` para evitar inconsistencias.

### Consultas Comunes

```typescript
// Documentos pendientes de aprobación
const pending = await prisma.document.findMany({
  where: { status: 'PENDING' },
  orderBy: { publicationDate: 'desc' },
  take: 20
})

// Artículos publicados en sección específica
const articles = await prisma.article.findMany({
  where: {
    status: 'PUBLISHED',
    publicationSection: 'Derecho Penal'
  },
  include: {
    author: { select: { firstName: true, lastName: true } },
    sourceDocument: true
  }
})

// Imágenes de biblioteca públicas
const images = await prisma.generatedImage.findMany({
  where: {
    savedToLibrary: true,
    isPublic: true
  },
  orderBy: { createdAt: 'desc' }
})

// Estadísticas de extracción
const stats = await prisma.extractionHistory.aggregate({
  _sum: { documentsFound: true, documentsProcessed: true },
  _avg: { executionTime: true },
  where: {
    source: 'corte_constitucional',
    status: 'COMPLETED'
  }
})
```

---

## 🔌 Arquitectura de Adaptadores

El backend sigue **Black Box Architecture** (inspirado en Eskil Steenberg): cada módulo externo se envuelve en una interfaz para desacoplamiento total.

Ver documentación completa en: `backend/src/adapters/README.md`

### Principios

1. **Interfaces primero**: Define contratos antes de implementar
2. **Implementaciones intercambiables**: Cambiar proveedor = modificar 1 línea
3. **Testing simplificado**: Mocks in-memory sin dependencias
4. **Módulos reemplazables**: Reescribir desde cero usando solo la interfaz

### Adaptadores Principales

- **IAIProvider** - Proveedores de IA (OpenAI, Gemini, Claude, Mock)
- **IContentProcessor** - Procesamiento de documentos (Mammoth para DOCX)
- **IDocumentStorage** - Persistencia (Prisma, InMemory)
- **IFileStorage** - Almacenamiento de archivos (Local, S3 futuro)
- **IMetadataExtractor** - Extracción de metadatos legales
- **INotificationBus** - Sistema de notificaciones SSE

**Beneficio**: Cambiar de SQLite a PostgreSQL o de OpenAI a Claude solo requiere cambiar la implementación, no el código que la usa.

---

## 🏢 Servicios Principales

### ScrapingOrchestrator

**Archivo**: `backend/src/services/ScrapingOrchestrator.ts`

**Responsabilidad**: Orquesta todo el flujo de extracción de documentos.

**Flujo**:
1. Extracción → Llama al scraper específico
2. Descarga → Obtiene archivos DOCX/RTF originales
3. Procesamiento → Extrae texto completo con Mammoth
4. Resumen inteligente → Genera summary optimizado (≤10K chars)
5. Almacenamiento → Guarda archivo físico + registro en BD
6. Análisis IA → Ejecuta análisis con AiAnalysisService
7. Notificación → Emite eventos SSE de progreso

**Sistema de resúmenes inteligentes**:
```typescript
// Extrae secciones estructuradas del documento legal
const structured = await contentProcessor.extractStructuredSections(fullText)

// Prioriza: Tema principal > Hechos > Consideraciones > Decisión
const summary = [
  structured.temaPrincipal,
  structured.hechos?.slice(0, 2000),
  structured.consideraciones?.slice(0, 3000),
  structured.decision
].filter(Boolean).join('\n\n').slice(0, 10000)
```

### AiAnalysisService

**Archivo**: `backend/src/services/AiAnalysisService.ts`

**Responsabilidad**: Análisis de IA sobre documentos legales.

**Funcionalidades**:
- Extracción de metadatos estructurados (número sentencia, magistrado, sala, expediente)
- Generación de resúmenes ejecutivos
- Identificación de tema principal
- Extracción de decisión judicial
- Generación de artículos periodísticos
- Generación de títulos SEO-optimizados
- Generación de prompts para imágenes

**Estado**: Actualmente usa `MockAIProvider`, listo para proveedores reales.

### ArticlePositioningService

**Archivo**: `backend/src/services/ArticlePositioningService.ts`

**Responsabilidad**: Gestión del posicionamiento automático de artículos en la sección General del portal.

**Sistema de empuje (6 posiciones)**:

La sección General tiene **6 posiciones fijas** distribuidas en el portal público:
- Posiciones 1-2: Inicio del portal (destacados principales)
- Posiciones 3-4: Sección intermedia
- Posiciones 5-6: Sección inferior

**Algoritmo de empuje en 3 pasos** (CORRECCIÓN CRÍTICA #7 - Oct 2025):

Cuando se publica un nuevo artículo en General:

1. **Obtener artículos actuales** excluyendo el nuevo (`isGeneral: true`, `posicionGeneral != null`, `id != newArticleId`)
2. **Si hay 6 artículos**: Archivar el de mayor posición (sale del portal)
3. **NORMALIZAR**: Reasignar artículos restantes a posiciones [2,3,4,5,6] secuenciales (elimina gaps)
4. **Insertar nuevo**: Colocar en posición 1

**Garantías del algoritmo**:
- ✅ Siempre posiciones secuenciales [1,2,3,4,5,6] sin gaps
- ✅ No importa el estado inicial (con o sin gaps), el resultado es consistente
- ✅ El artículo nuevo nunca se empuja a sí mismo
- ✅ Solo el artículo en la posición más alta se archiva cuando el portal está lleno

**Correcciones históricas críticas**:
- **#6 (Oct 15)**: Excluir artículo nuevo de la lista de empuje con `id: { not: newArticleId }`
- **#7 (Oct 16)**: Normalizar posiciones secuencialmente para eliminar gaps perpetuados

**⚠️ IMPORTANTE**: El endpoint `POST /api/articles/:id/publish-general` debe establecer `isGeneral: true` y `posicionGeneral: null` ANTES de llamar a `pushArticlesThroughPortal()` para evitar race conditions.

### ImageStorageService & ImageTagService

**Archivos**:
- `backend/src/services/ImageStorageService.ts`
- `backend/src/services/ImageTagService.ts`

**Responsabilidad**: Gestión completa de biblioteca de imágenes AI.

**Sistema de tags**:
- **legal-areas**: Áreas del derecho
- **themes**: Temas específicos (medio ambiente, salud, etc.)
- **styles**: Estilos visuales (tribunal, oficina, naturaleza)
- **concepts**: Conceptos abstractos (justicia, equidad)
- **custom**: Tags personalizados por usuario

**Sistema de visibilidad**:
- `isPublic: false` → Solo visible en documento asociado
- `isPublic: true` → Visible en biblioteca global

### CacheService (In-Memory)

**Archivo**: `backend/src/services/CacheService.ts` (156 líneas)

**Responsabilidad**: Caché en memoria con soporte TTL y patrones de invalidación.

**Características**:
- TTL por defecto: 5 minutos (configurable)
- Verificación de expiración cada 1 minuto
- Patrón get-or-set para cálculos
- Invalidación por patrón o clave específica
- Estadísticas de uso en tiempo real

**Métodos principales**:
```typescript
// Obtener valor
async get<T>(key: string): Promise<T | null>

// Guardar con TTL
async set(key: string, value: any, ttlSeconds: number = 300): Promise<void>

// Patrón común: obtener o calcular
async getOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T>

// Invalidar por patrón (ej: "documents:")
async invalidate(pattern: string): Promise<number>

// Estadísticas
getStats(): { keys: number; memory: any }
```

**Ejemplo de uso**:
```typescript
import { cacheService } from '@/services/CacheService'

// Obtener o calcular documentos pendientes
const pending = await cacheService.getOrSet(
  'documents:pending',
  () => prisma.document.findMany({ where: { status: 'PENDING' } }),
  300 // 5 minutos
)

// Invalidar después de cambio
await cacheService.invalidateKey('documents:pending')

// Invalidar todo lo relacionado con documentos
await cacheService.invalidate('documents:')
```

**Estadísticas esperadas**:
- Cache hit rate: 70-99% dependiendo del patrón de uso
- Mejora: **25-50x** más rápido para datos cacheados

---

### ScheduledTasksService (Tareas Programadas)

**Archivo**: `backend/src/services/ScheduledTasksService.ts` (162 líneas)

**Responsabilidad**: Orquestación de tareas programadas con cron jobs.

**Tareas implementadas**:
```
2:00 AM  → Backup automático de base de datos (comprimido gzip)
2:05 AM  → Invalidación de caché para forzar refresco de datos
3:00 AM  → Limpieza de imágenes huérfanas (no referenciadas)
Cada 10 min → Health check con estadísticas del sistema
```

**Métodos**:
```typescript
start(): void        // Inicia todas las tareas programadas
stop(): void         // Detiene todas las tareas
getStatus(): object  // Retorna estado actual de todas las tareas
```

**Ejemplo de status**:
```typescript
{
  running: true,
  tasks: 4,
  jobs: [
    { name: 'Database Backup', schedule: '0 2 * * *', description: 'Daily at 2:00 AM' },
    { name: 'Cache Invalidation', schedule: '0 2:05 * * *', description: 'Daily at 2:05 AM' },
    { name: 'Orphan Image Cleanup', schedule: '0 3 * * *', description: 'Daily at 3:00 AM' },
    { name: 'Health Check', schedule: '*/10 * * * *', description: 'Every 10 minutes' }
  ]
}
```

**Integración**: Se inicia automáticamente en `backend/src/server.ts` al levantar el servidor.

**Beneficios**:
- ✅ Backups automáticos sin intervención manual
- ✅ Caché siempre actualizado sin intervención
- ✅ Almacenamiento limpio sin imágenes huérfanas
- ✅ Monitoreo continuo con logs detallados

---

## 🛡️ Integridad y Backup

### Verificación de Integridad (SHA-256)

**Archivo**: `backend/src/scripts/verify-document-integrity.ts` (247 líneas)

**Responsabilidad**: Verificación forense de integridad de documentos jurídicos.

**Campos de integridad en Document model**:
```prisma
documentChecksum   String?  // SHA-256 del archivo original DOCX/RTF
contentChecksum    String?  // SHA-256 del campo content
fullTextChecksum   String?  // SHA-256 del campo fullTextContent
checksumVerifiedAt DateTime? // Última verificación exitosa
integrityStatus    String?  // UNVERIFIED | VERIFIED | CORRUPTED | MISSING_FILE
```

**Funciones**:
```typescript
// Verificar documento individual
async function verifyDocumentIntegrity(documentId: string): Promise<IntegrityReport>

// Verificar todos los documentos
async function verifyAllDocuments(limit?: number): Promise<{ report: IntegrityReport[]; summary: any }>
```

**Uso**:
```bash
# Verificar integridad de todos los documentos
npx tsx src/scripts/verify-document-integrity.ts

# Verificar solo los primeros 50 documentos
npx tsx src/scripts/verify-document-integrity.ts 50
```

**Ejemplo de salida**:
```
📊 INTEGRITY VERIFICATION REPORT
================================
Total:     125
Verified:  120 ✅
Corrupted: 0 ⚠️
Missing:   4 ❌
Errors:    1 🔥
Duration:  45.23s

⚠️ CORRUPTED DOCUMENTS:
  📄 Sentencia T-390/25 (doc-123)
     - CORRUPTED: Archivo modificado (esperado: a1b2c3d4..., actual: x9y8z7w6...)
```

**Beneficios**:
- Detección automática de corrupción de archivos
- Cumplimiento normativo para documentación legal
- Auditoría completa de integridad

---

### Sistema de Backups

**Archivo**: `backend/src/scripts/backup-database.ts` (241 líneas)

**Responsabilidad**: Creación y gestión de backups automáticos con compresión.

**Características**:
- ✅ Backup automático diario a las 2 AM (integrado con ScheduledTasksService)
- ✅ Compresión gzip (reducción típica 70-80%)
- ✅ SHA-256 checksum para verificación
- ✅ Limpieza automática de backups >30 días
- ✅ Ubicación: `backend/backups/`

**Interfaz BackupResult**:
```typescript
interface BackupResult {
  filename: string         // backup-YYYY-MM-DD-HH-MM-SS.db.gz
  path: string            // Ruta completa
  size: number            // Tamaño original en bytes
  sizeCompressed: number  // Tamaño comprimido
  checksum: string        // SHA-256 (primeros 16 caracteres)
  timestamp: Date         // Hora de creación
  compressionRatio: number // Porcentaje de reducción
}
```

**Uso**:
```bash
# Crear backup manual
npx tsx src/scripts/backup-database.ts

# Listar todos los backups disponibles
npx tsx src/scripts/backup-database.ts list
```

**Ejemplo de salida - backup**:
```
✅ BACKUP SUCCESSFUL
====================
Filename:         backup-2025-12-27-14-32-45.db.gz
Original size:    15.23 MB
Compressed size:  3.47 MB
Compression:      77%
Checksum (SHA256): a1b2c3d4e5f6g7h8...
Duration:         2.34s
```

**Ejemplo de salida - list**:
```
📦 AVAILABLE BACKUPS
==================
2025-12-27T14:32:45.000Z - backup-2025-12-27-14-32-45.db.gz (3.47 MB)
2025-12-26T02:00:00.000Z - backup-2025-12-26-02-00-00.db.gz (3.42 MB)
2025-12-25T02:00:00.000Z - backup-2025-12-25-02-00-00.db.gz (3.38 MB)
```

**Beneficios**:
- ✅ Recuperación ante desastres sin intervención manual
- ✅ Compresión automática = 70-80% de ahorro de almacenamiento
- ✅ Auditoría de backups con checksums
- ✅ Limpieza automática de backups antiguos

---

## 🕷️ Sistema de Scraping

Sistema **modular** que permite agregar nuevas fuentes legales sin modificar código existente.

### Arquitectura

Ver documentación completa en: `backend/src/scrapers/README.md`

### Scrapers Implementados

#### **CorteConstitucionalScraper**

**Fuente**: Corte Constitucional de Colombia
**URL**: https://www.corteconstitucional.gov.co/relatoria/

**Capacidades**:
- ✅ Descarga de archivos RTF/DOCX
- ✅ Búsqueda con filtros de fecha
- ✅ Extracción de metadata estructurada
- ✅ Rate limiting integrado

**Tipos de documentos**: Sentencias T, C, SU, Autos

**Uso**:
```typescript
const scraper = new CorteConstitucionalScraper()
const result = await scraper.extractDocuments({
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-13'),
  limit: 10,
  downloadFiles: true
})
```

#### **ConsejoEstadoScraper**

**Estado**: Implementación básica (pendiente completar)

### Agregar Nuevo Scraper

1. Crear directorio: `mkdir backend/src/scrapers/nueva-fuente`
2. Implementar clase heredando de `BaseScrapingService`
3. Registrar en factory: `backend/src/scrapers/index.ts`
4. Usar automáticamente vía API: `POST /api/scraping/extract`

Ver guía completa en `backend/src/scrapers/README.md`

---

## 🛣️ Rutas y Controladores

### Documentación Swagger

**Acceso**: http://localhost:3001/api-docs

Incluye:
- 📖 Documentación completa de todos los endpoints
- 🧪 Interfaz de prueba interactiva
- 📋 Schemas de request/response
- 🔐 Configuración de JWT para endpoints protegidos

### Rutas Principales

```
/api/
├── health              # Health checks (sin auth)
├── public              # Portal público (sin auth)
├── auth                # Login, registro, refresh tokens
├── documents           # CRUD de documentos (auth)
├── articles            # CRUD de artículos (auth)
├── ai                  # Generación con IA (auth)
├── storage             # Gestión de imágenes (auth parcial)
├── scraping            # Sistema de extracción (auth)
├── media               # Upload de archivos (auth)
├── audit               # Logs de auditoría (auth admin)
├── events              # Server-Sent Events (auth)
└── seo                 # Optimización SEO (auth)
```

### Server-Sent Events (SSE)

**Endpoint**: `GET /api/events/stream`

Eventos en tiempo real:
- `scraping:progress` - Progreso de extracción
- `scraping:complete` - Extracción completada
- `scraping:error` - Error en extracción
- `document:new` - Nuevo documento disponible
- `article:published` - Artículo publicado

---

## 🖼️ Sistema de Imágenes AI

### Flujo Completo

1. **Generación de Prompt** → `POST /api/ai/generate-image-prompt`
2. **Generación de Imágenes** → `POST /api/ai/generate-images`
3. **Guardar en Biblioteca** → `POST /api/storage/images/save-from-url`
4. **Consultar Biblioteca** → `GET /api/storage/images/library`
5. **Servir Imagen** → `GET /api/storage/images/{filename}`

### Almacenamiento Físico

**Ubicación**: `backend/storage/images/`

**Formato**: `generated-{timestamp}-{randomId}.jpg`

**Limpieza de huérfanos**:
```typescript
import { cleanOrphanImages } from '@/utils/cleanOrphanImages'
await cleanOrphanImages()
```

### Sistema de Tags

**Generación automática basada en**:
- Área legal del documento
- Tema principal extraído por IA
- Keywords del prompt
- Estilo de imagen solicitado

**Búsqueda por tags**:
```bash
GET /api/storage/images/library?tags=tribunal,justicia&style=paisaje
```

---

## 🔐 Autenticación y Seguridad

### Sistema de Tokens JWT

**Dos tipos**:
1. **Access Token** (15-30 min) - Incluir en header `Authorization: Bearer {token}`
2. **Refresh Token** (7-30 días) - Almacenado en BD, obtener nuevo access token

### Flujo de Autenticación

```bash
# 1. Login
POST /api/auth/login
{"email": "user@example.com", "password": "pass"}

# 2. Usar access token
GET /api/documents
Headers: Authorization: Bearer {accessToken}

# 3. Refresh cuando expira
POST /api/auth/refresh
{"refreshToken": "..."}

# 4. Logout
POST /api/auth/logout
{"refreshToken": "..."}
```

### Roles

- `ADMIN` - Acceso completo
- `EDITOR` - Crear/editar artículos y documentos
- `VIEWER` - Solo lectura

### Seguridad Adicional

- **Helmet** - Headers de seguridad HTTP
- **CORS** - Configuración cross-origin
- **Rate Limiting** - 10k req/min (dev), 100 req/min (prod)
- **Bcrypt** - Passwords hasheados con salt 10

---

## 🔧 Variables de Entorno

Crear `.env` en `backend/` basado en `.env.example`:

```bash
# Base de datos
DATABASE_URL="file:./prisma/dev.db"

# JWT Secrets
JWT_SECRET="secret-key-muy-seguro-32-chars-minimo"
JWT_REFRESH_SECRET="otro-secret-diferente"
JWT_EXPIRES_IN="30m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="10000"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
OPENAI_IMAGE_MODEL="dall-e-3"

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Google Gemini
GEMINI_API_KEY="AIza..."
GEMINI_MODEL="gemini-1.5-pro"
GEMINI_IMAGE_MODEL="imagen-3.0-generate-001"

# Proveedor activo
AI_PROVIDER="mock"  # mock | openai | anthropic | gemini

# Servidor
PORT="3001"
NODE_ENV="development"
LOG_LEVEL="info"
```

**IMPORTANTE**: Nunca commitear `.env` a git, usar secrets largos en producción.

---

## 📚 Guías de Desarrollo

### Agregar Nuevo Endpoint

```typescript
// 1. Crear controlador
// backend/src/controllers/mi-modulo.ts
import { Router } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { z } from 'zod'

const router = Router()

const createSchema = z.object({
  campo: z.string().min(1)
})

/**
 * @swagger
 * /api/mi-modulo:
 *   post:
 *     summary: Crear recurso
 *     tags: [MiModulo]
 */
router.post('/', authMiddleware, async (req, res) => {
  const data = createSchema.parse(req.body)
  // Lógica aquí
  res.json({ success: true, data })
})

export default router

// 2. Registrar en server.ts
app.use('/api/mi-modulo', miModuloRoutes)
```

### Agregar Migración de BD

```bash
# 1. Editar schema.prisma
nano backend/prisma/schema.prisma

# 2. Generar tipos
npm run db:generate

# 3. Crear migración
npm run db:migrate
# Prompt: "add new_field to documents"
```

### Debugging

```typescript
// Logs estructurados
import { logger } from '@/utils/logger'

logger.info('Mensaje', { userId: '123' })
logger.warn('Advertencia', { attempts: 3 })
logger.error('Error', { error: error.message })

// Ver logs
tail -f backend/storage/logs/combined.log
```

---

## 🔥 Troubleshooting

### Error: Cannot find module '@/*'

```bash
npm install tsc-alias --save-dev
npm run build
```

### Error: Prisma Client not generated

```bash
npm run db:generate
```

### Error: Port 3001 already in use

```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID {PID} /F
```

### Error: Redis connection failed

**Solución**: Redis es opcional, el sistema funciona sin él. O instalar:
```bash
# macOS
brew install redis
brew services start redis
```

### Imagen guardada pero no se ve en biblioteca

```bash
# Verificar BD
sqlite3 backend/prisma/dev.db "SELECT imageId, filename, savedToLibrary, isPublic FROM generated_images WHERE savedToLibrary = 1;"

# Verificar archivo físico
ls -lh backend/storage/images/{filename}

# Probar endpoint
curl -I http://localhost:3001/api/storage/images/{filename}
```

**Soluciones**:
- Si falta archivo → Re-guardar imagen
- Si `isPublic = 0` → Solo visible con `documentId` correcto
- Si 404 → Revisar permisos de archivo

---

## 📊 Monitoreo y Logs

### Health Checks

```bash
# Health básico
curl http://localhost:3001/api/health

# Health detallado
curl http://localhost:3001/api/health/detailed
```

### Logs

```bash
# Ver últimas líneas
tail -n 100 backend/storage/logs/combined.log

# Seguir en tiempo real
tail -f backend/storage/logs/combined.log

# Buscar errores
grep "error" backend/storage/logs/combined.log
```

---

## 🎯 Próximos Pasos

### Integración con IA Real

```bash
# 1. Configurar API key
OPENAI_API_KEY="sk-..."
AI_PROVIDER="openai"

# 2. Reiniciar
npm run dev

# 3. Los servicios usan proveedor real automáticamente
```

### Deploy a Producción

```bash
# 1. Build
npm run build

# 2. Configurar PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/db"

# 3. Migrar
npm run db:migrate

# 4. Iniciar
npm start
```

---

## 📖 Referencias

- **Documentación Prisma**: https://www.prisma.io/docs/
- **OpenAI API**: https://platform.openai.com/docs/
- **Google Gemini**: https://ai.google.dev/docs
- **Anthropic Claude**: https://docs.anthropic.com/
- **Express.js**: https://expressjs.com/
- **Zod Validation**: https://zod.dev/

---

**Última actualización**: Octubre 2025
**Versión**: 1.0
**Estado**: Sistema funcional 82% completo

---

Para más detalles técnicos, consulta:
- Swagger UI: http://localhost:3001/api-docs
- Arquitectura de adaptadores: `backend/src/adapters/README.md`
- Sistema de scrapers: `backend/src/scrapers/README.md`
- CLAUDE.md principal: `/CLAUDE.md` (raíz del proyecto)
