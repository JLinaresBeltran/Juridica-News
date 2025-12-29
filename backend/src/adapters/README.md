# 📐 Black Box Architecture - Adapters

Esta carpeta contiene las **interfaces** y **adaptadores** del sistema siguiendo los principios de **Black Box Architecture** inspirados en Eskil Steenberg.

## 🎯 Principios Fundamentales

> "Es más rápido escribir 5 líneas de código hoy que escribir 1 línea hoy y editarla en el futuro."
> — Eskil Steenberg

### Reglas de Black Box

1. **Cada módulo = Una responsabilidad clara**
2. **Interfaces antes que implementación**
3. **Detalles internos completamente ocultos**
4. **Cualquier módulo debe poder reescribirse desde cero usando solo su interfaz**
5. **Dependencias externas siempre envueltas, nunca usadas directamente**

## 📁 Estructura de Carpetas

```
backend/src/adapters/
├── storage/              # Almacenamiento de datos
│   ├── IDocumentStorage.ts       # Interfaz para persistencia de documentos
│   ├── IFileStorage.ts           # Interfaz para archivos físicos
│   ├── PrismaDocumentStorage.ts  # Implementación con Prisma (TODO)
│   └── LocalFileStorage.ts       # Implementación local (TODO)
│
├── ai/                   # Proveedores de IA
│   ├── IAIProvider.ts            # Interfaz para proveedores de IA
│   ├── OpenAIProvider.ts         # Implementación OpenAI (TODO)
│   ├── GeminiProvider.ts         # Implementación Gemini (TODO)
│   └── ClaudeProvider.ts         # Implementación Claude (TODO)
│
├── content/              # Procesamiento de contenido
│   ├── IContentProcessor.ts      # Interfaz para extracción de texto
│   ├── MammothProcessor.ts       # Procesador DOCX (TODO)
│   └── PDFProcessor.ts           # Procesador PDF (TODO)
│
├── metadata/             # Extracción de metadatos
│   ├── IMetadataExtractor.ts     # Interfaz para metadatos
│   ├── RegexExtractor.ts         # Extractor por regex (TODO)
│   └── HybridExtractor.ts        # Extractor híbrido (TODO)
│
└── events/               # Sistema de eventos
    ├── INotificationBus.ts       # Interfaz para notificaciones
    └── SSENotificationBus.ts     # Implementación SSE (TODO)
```

## 🔌 Adaptadores Disponibles

### 1. IDocumentStorage (PRIORIDAD ALTA)

**Responsabilidad**: Persistir y recuperar documentos jurídicos.

**Métodos principales**:
- `save(document)`: Guardar documento individual
- `saveMany(documents)`: Guardar en batch
- `findById(id)`: Buscar por ID interno
- `findByExternalId(externalId)`: Buscar por ID externo
- `findDuplicate(criteria)`: Detectar duplicados
- `findMany(filters, pagination)`: Búsqueda con paginación
- `updateMetadata(id, metadata)`: Actualizar metadatos
- `updateStatus(id, status)`: Cambiar estado
- `getStats(filters)`: Obtener estadísticas
- `delete(id)`: Eliminar documento

**Implementaciones**:
- `PrismaDocumentStorage` (Pendiente - Fase 2)
- `MongoDocumentStorage` (Futuro)
- `InMemoryDocumentStorage` (Testing)

### 2. IFileStorage (PRIORIDAD ALTA)

**Responsabilidad**: Gestionar archivos físicos (DOCX, RTF, PDF).

**Métodos principales**:
- `save(filename, buffer, metadata)`: Guardar archivo
- `get(path)`: Recuperar archivo
- `exists(path)`: Verificar existencia
- `delete(path)`: Eliminar archivo
- `getPublicUrl(path, expiresIn)`: Obtener URL pública
- `list(directory)`: Listar archivos

**Implementaciones**:
- `LocalFileStorage` (Pendiente - Fase 2)
- `S3FileStorage` (Futuro)
- `MinIOFileStorage` (Futuro)

### 3. IAIProvider (PRIORIDAD ALTA)

**Responsabilidad**: Análisis de IA sobre documentos legales.

**Métodos principales**:
- `analyzeDocument(fragments, options)`: Analizar documento
- `generateSummary(content, options)`: Generar resumen
- `checkHealth()`: Verificar disponibilidad
- `getUsage()`: Obtener uso de cuota

**Implementaciones**:
- `OpenAIProvider` (Pendiente - Fase 3)
- `GeminiProvider` (Pendiente - Fase 3)
- `ClaudeProvider` (Pendiente - Fase 3)
- `MockAIProvider` (Testing)

### 4. IContentProcessor (PRIORIDAD MEDIA)

**Responsabilidad**: Extracción y procesamiento de texto de documentos.

**Métodos principales**:
- `extractText(buffer, filename)`: Extraer texto
- `generateSummary(fullText, maxChars)`: Generar resumen
- `extractStructure(text)`: Extraer estructura legal
- `canProcess(filename)`: Verificar compatibilidad

**Implementaciones**:
- `MammothProcessor` (Pendiente)
- `PDFProcessor` (Pendiente)
- `RTFProcessor` (Pendiente)

### 5. IMetadataExtractor (PRIORIDAD MEDIA)

**Responsabilidad**: Extracción de metadatos legales estructurados.

**Métodos principales**:
- `extract(content, context)`: Extraer metadatos
- `validate(metadata)`: Validar metadatos
- `merge(metadataList, strategy)`: Combinar metadatos

**Implementaciones**:
- `RegexExtractor` (Pendiente)
- `AIExtractor` (Pendiente)
- `HybridExtractor` (Pendiente)

### 6. INotificationBus (PRIORIDAD BAJA)

**Responsabilidad**: Sistema de notificaciones en tiempo real.

**Métodos principales**:
- `publish(userId, eventType, payload)`: Publicar evento
- `broadcast(eventType, payload)`: Broadcast global
- `subscribe(userId, callback)`: Suscribirse a eventos
- `getActiveConnections()`: Obtener conexiones activas

**Implementaciones**:
- `SSENotificationBus` (Pendiente)
- `WebSocketNotificationBus` (Futuro)
- `MockNotificationBus` (Testing)

### 7. IAuthenticationManager (Frontend - PRIORIDAD MEDIA)

**Responsabilidad**: Gestión de autenticación y tokens.

**Métodos principales**:
- `getAuthHeaders()`: Obtener headers de autenticación
- `handleUnauthorized()`: Manejar 401
- `refreshCredentials()`: Refrescar credenciales
- `clearSession()`: Limpiar sesión
- `isAuthenticated()`: Verificar autenticación
- `getCurrentUser()`: Obtener usuario actual

**Implementaciones**:
- `JWTAuthManager` (Pendiente - Fase 4)
- `OAuth2AuthManager` (Futuro)
- `MockAuthManager` (Testing)

## 🚀 Beneficios de Esta Arquitectura

### ✅ Velocidad de Desarrollo Constante
- Agregar nuevo proveedor de IA = crear 1 archivo (~200 líneas)
- Cambiar base de datos = modificar 1 línea de config
- No hay refactoring masivo al crecer el proyecto

### ✅ Testabilidad Alta
```typescript
// Test sin dependencias externas
const storage = new InMemoryDocumentStorage()
const orchestrator = new ScrapingOrchestrator(storage, ...)
await orchestrator.extractDocuments(...)
```

### ✅ Onboarding Rápido
- Nuevos desarrolladores leen solo las interfaces
- Implementaciones específicas son black boxes
- Documentación clara y concisa

### ✅ Módulos Reemplazables
```typescript
// Producción
const storage = new PrismaDocumentStorage(prisma)

// Testing
const storage = new InMemoryDocumentStorage()

// Futuro: MongoDB
const storage = new MongoDocumentStorage(client)
```

## 📊 Estado de Implementación

| Componente | Interfaz | Implementación | Tests | Estado |
|-----------|----------|----------------|-------|--------|
| **IDocumentStorage** | ✅ | ⏳ Fase 2 | ❌ | Interfaz completa |
| **IFileStorage** | ✅ | ⏳ Fase 2 | ❌ | Interfaz completa |
| **IAIProvider** | ✅ | ⏳ Fase 3 | ❌ | Interfaz completa |
| **IContentProcessor** | ✅ | ⏳ Fase 3 | ❌ | Interfaz completa |
| **IMetadataExtractor** | ✅ | ⏳ Fase 3 | ❌ | Interfaz completa |
| **INotificationBus** | ✅ | ⏳ Fase 4 | ❌ | Interfaz completa |
| **IAuthenticationManager** | ✅ | ⏳ Fase 4 | ❌ | Interfaz completa |

## 📝 Plan de Implementación

- [x] **FASE 1**: Definición de Interfaces (Semana 1-2) - ✅ **COMPLETADO**
- [ ] **FASE 2**: DocumentStorageAdapter (Semana 3-4)
- [ ] **FASE 3**: AIProviderAdapter (Semana 5-6)
- [ ] **FASE 4**: AuthenticationManager (Semana 7)

## 🔍 Ejemplos de Uso

### Ejemplo 1: Inyección de Dependencias

```typescript
// ScrapingOrchestrator (ANTES - Acoplado)
class ScrapingOrchestrator {
  private async saveDocuments(docs: any[]) {
    await prisma.document.create({ data: ... })  // ❌ Acoplamiento directo
  }
}

// ScrapingOrchestrator (DESPUÉS - Desacoplado)
class ScrapingOrchestrator {
  constructor(
    private documentStorage: IDocumentStorage,
    private fileStorage: IFileStorage
  ) {}

  private async saveDocuments(docs: DocumentInput[]) {
    await this.documentStorage.saveMany(docs)  // ✅ Interfaz limpia
  }
}
```

### Ejemplo 2: Tests Simples

```typescript
// Test con mock (sin BD real)
describe('ScrapingOrchestrator', () => {
  it('should save documents', async () => {
    const mockStorage = new InMemoryDocumentStorage()
    const orchestrator = new ScrapingOrchestrator(mockStorage, ...)

    await orchestrator.extractDocuments('corte_constitucional', { limit: 2 })

    const saved = await mockStorage.findMany({}, { page: 1, pageSize: 10 })
    expect(saved.data.length).toBeGreaterThan(0)
  })
})
```

### Ejemplo 3: Cambio de Proveedor IA

```typescript
// Configuración en server.ts
const aiProvider = process.env.AI_PROVIDER === 'claude'
  ? new ClaudeProvider(process.env.ANTHROPIC_API_KEY)
  : new OpenAIProvider(process.env.OPENAI_API_KEY)

const aiService = new AiAnalysisService(aiProvider)
```

## 📚 Recursos Adicionales

- [Black Box Refactoring Spec](../../../docs/architecture/BLACK_BOX_REFACTORING_SPEC.md)
- [Eskil Steenberg - Video Original](https://www.youtube.com/watch?v=SqaS2O0OHMY)
- [Documentación completa del proyecto](../../../CLAUDE.md)

---

**Última actualización**: Octubre 2025
**Estado**: FASE 1 COMPLETADA ✅
