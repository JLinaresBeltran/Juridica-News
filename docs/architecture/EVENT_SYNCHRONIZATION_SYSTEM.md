# 📡 Sistema de Sincronización por Eventos
# Sistema Editorial Jurídico Supervisado

**Versión:** 1.0
**Fecha:** Octubre 2025
**Estado:** ✅ Implementado y Operativo
**Autor:** Equipo de Arquitectura

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Motivación y Contexto](#-motivación-y-contexto)
3. [Arquitectura del Sistema](#-arquitectura-del-sistema)
4. [Eventos Disponibles](#-eventos-disponibles)
5. [Implementación](#-implementación)
6. [Patrones de Uso](#-patrones-de-uso)
7. [Casos de Uso Reales](#-casos-de-uso-reales)
8. [Best Practices](#-best-practices)
9. [Troubleshooting](#-troubleshooting)
10. [Alternativas y Trade-offs](#-alternativas-y-trade-offs)

---

## 🎯 Resumen Ejecutivo

El **Sistema de Sincronización por Eventos** es un mecanismo de comunicación local (frontend) basado en el patrón **EventEmitter** que permite la sincronización en tiempo real entre componentes React sin acoplamiento directo.

### ¿Qué Problema Resuelve?

Cuando un componente realiza una acción que afecta datos mostrados en otros componentes (ej: aprobar un documento en CurationPage debe actualizar contadores en Sidebar y lista en ArticlesPage), necesitamos un mecanismo de notificación desacoplado.

### ¿Por Qué No Usar Solo React Query o Server-Sent Events?

- **React Query**: Requiere invalidación manual de queries desde cada punto de mutación
- **SSE**: Overhead de red, latencia, complejidad de infraestructura
- **Props Drilling**: No escalable, acoplamiento alto
- **Context API**: Re-renders innecesarios, complejidad en grandes apps

**Solución**: Un bus de eventos local que emite notificaciones síncronas a todos los listeners interesados, independientemente de su ubicación en el árbol de componentes.

---

## 💡 Motivación y Contexto

### Problema Original (Octubre 2025)

**Síntoma**: Los artículos aprobados en la sección "Curación" no aparecían en la sección "Listos para publicar" hasta refrescar la página, aunque el contador del Sidebar se actualizaba correctamente.

**Diagnóstico**:

```
CurationPage (aprueba doc)
    ↓
Backend (crea artículo READY)
    ↓
curationStore emite: document:approved
    ↓
Sidebar escucha → ✅ actualiza contador
ArticlesPage NO escucha → ❌ lista desactualizada
```

**Root Cause**: ArticlesPage solo escuchaba eventos `document:ready` y `document:published`, pero el flujo de aprobación emitía `document:approved`.

**Solución**: Agregar listener de `document:approved` en ArticlesPage.

### Arquitectura de Eventos Implementada

El sistema utiliza un **EventEmitter** centralizado que actúa como bus de comunicación:

```typescript
// frontend/src/utils/documentEvents.ts
import { EventEmitter } from 'events'

class DocumentEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(20) // Permitir múltiples listeners
  }
}

export const documentEvents = new DocumentEventBus()
```

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMISORES DE EVENTOS                          │
├─────────────────────────────────────────────────────────────────┤
│  • CurationStore (approveDocument, rejectDocument)             │
│  • ArticlesPage (handlePublishArticle)                         │
│  • Backend Controllers (via SSE - opcional)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ emit(eventName, payload)
                         ↓
              ┌──────────────────────┐
              │  documentEvents      │
              │  (EventEmitter)      │
              └──────────────────────┘
                         │
                         │ on(eventName, callback)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LISTENERS DE EVENTOS                          │
├─────────────────────────────────────────────────────────────────┤
│  • Sidebar (contadores de documentos/artículos)                │
│  • ArticlesPage (lista de artículos READY)                     │
│  • PublishedArticlesPage (lista de artículos PUBLISHED)        │
│  • DashboardPage (estadísticas generales)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Comunicación Detallado

```typescript
// 1. Usuario aprueba documento en CurationPage
CurationPage.handleApprove()
    ↓
// 2. Store actualiza estado y sincroniza con backend
curationStore.approveDocument(document, true, articleData)
    ↓
    POST /api/documents/:id/curate { action: 'approve', articleData }
    ↓
// 3. Backend crea artículo con status: 'READY'
Backend: Article.create({ status: 'READY', ... })
    ↓
// 4. Frontend emite evento local
documentEvents.emit('document:approved')
    ↓
// 5. Todos los listeners reaccionan
    ├─→ Sidebar.loadDocumentCounts()         // Actualiza contador READY
    ├─→ ArticlesPage.loadArticles()          // Recarga lista de artículos
    └─→ DashboardPage.refreshStats()         // Actualiza estadísticas
```

---

## 📢 Eventos Disponibles

### Taxonomía de Eventos

| Evento | Cuándo se emite | Payload | Emisores | Listeners |
|--------|----------------|---------|----------|-----------|
| **`document:approved`** | Documento aprobado (con/sin artículo) | ninguno | `curationStore.approveDocument()` | Sidebar, ArticlesPage, Dashboard |
| **`document:rejected`** | Documento rechazado | ninguno | `curationStore.rejectDocument()` | Sidebar, Dashboard |
| **`document:ready`** | Documento marcado como READY para artículo | ninguno | Backend (raro), manual | ArticlesPage, Sidebar |
| **`document:published`** | Artículo publicado exitosamente | ninguno | `ArticlesPage.handlePublishArticle()` | Sidebar, PublishedArticlesPage |
| **`document:updated`** | Cambios generales en documento | ninguno | Varios | Dashboard, listas |

### Ciclo de Vida de un Documento

```
PENDING → [approve] → APPROVED → [generate article] → READY → [publish] → PUBLISHED
   ↓                    ↓                               ↓                      ↓
rejected          approved event               ready event           published event
   ↓
rejected event
```

---

## 💻 Implementación

### Archivo Base: `documentEvents.ts`

**Ubicación**: `frontend/src/utils/documentEvents.ts`

```typescript
import { EventEmitter } from 'events'

/**
 * Bus de eventos centralizado para sincronización de documentos
 * entre componentes sin acoplamiento directo.
 *
 * @example
 * // Emitir evento
 * documentEvents.emit('document:approved')
 *
 * // Escuchar evento
 * documentEvents.on('document:approved', handleApproved)
 *
 * // Cleanup
 * documentEvents.off('document:approved', handleApproved)
 */
class DocumentEventBus extends EventEmitter {
  constructor() {
    super()
    // Permitir hasta 20 listeners por evento (evitar warning)
    this.setMaxListeners(20)
  }

  /**
   * Log de debug para eventos (desactivar en producción)
   */
  private debug = false

  emit(event: string | symbol, ...args: any[]): boolean {
    if (this.debug) {
      console.debug(`📡 Event emitted: ${String(event)}`, args)
    }
    return super.emit(event, ...args)
  }
}

export const documentEvents = new DocumentEventBus()
```

### Integración en CurationStore

**Ubicación**: `frontend/src/stores/curationStore.ts`

```typescript
import { documentEvents } from '@/utils/documentEvents'

export const useCurationStore = create<CurationState>()((set, get) => ({
  // ... other state

  approveDocument: async (document, syncToBackend = false, articleData = null) => {
    // 1. Actualizar estado local (optimistic update)
    set(state => ({
      approvedDocuments: [...state.approvedDocuments, document]
    }))

    // 2. Sincronizar con backend
    if (syncToBackend) {
      try {
        await api.post(`/documents/${document.id}/curate`, {
          action: 'approve',
          articleData
        })

        // 3. ✅ Emitir evento después de éxito
        documentEvents.emit('document:approved')

      } catch (error) {
        console.error('Failed to sync approval:', error)
        // No revertir estado local (optimistic)
      }
    }
  }
}))
```

---

## 🔧 Patrones de Uso

### Patrón 1: Listener en Componente React

**❌ INCORRECTO** (memory leak):

```typescript
function MyComponent() {
  // ❌ Crea nuevo listener en cada render
  documentEvents.on('document:approved', loadData)

  return <div>...</div>
}
```

**✅ CORRECTO** (con cleanup):

```typescript
function MyComponent() {
  const loadData = useCallback(async () => {
    // Lógica de recarga
  }, [/* deps */])

  useEffect(() => {
    // Suscribirse al montar
    documentEvents.on('document:approved', loadData)

    // 🧹 Cleanup: desuscribirse al desmontar
    return () => {
      documentEvents.off('document:approved', loadData)
    }
  }, [loadData])

  return <div>...</div>
}
```

### Patrón 2: Múltiples Eventos

```typescript
useEffect(() => {
  const handlers = {
    approved: loadData,
    rejected: loadData,
    published: loadData
  }

  // Suscribirse a múltiples eventos
  documentEvents.on('document:approved', handlers.approved)
  documentEvents.on('document:rejected', handlers.rejected)
  documentEvents.on('document:published', handlers.published)

  // Cleanup de todos
  return () => {
    documentEvents.off('document:approved', handlers.approved)
    documentEvents.off('document:rejected', handlers.rejected)
    documentEvents.off('document:published', handlers.published)
  }
}, [loadData])
```

### Patrón 3: Emisión con Delay (opcional)

```typescript
// Útil para evitar condiciones de carrera con backend
const handlePublish = async () => {
  await publishArticleAPI()

  // Esperar a que backend persista cambios
  setTimeout(() => {
    documentEvents.emit('document:published')
  }, 500)
}
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Sincronización Sidebar ↔ ArticlesPage

**Problema**: Contador del Sidebar muestra "1 listo", pero ArticlesPage está vacía.

**Solución Implementada**:

```typescript
// frontend/src/pages/articles/ArticlesPage.tsx
useEffect(() => {
  loadArticles() // Carga inicial

  // ✅ FIX: Escuchar cuando se aprueba con artículo READY
  documentEvents.on('document:approved', loadArticles)
  documentEvents.on('document:ready', loadArticles)
  documentEvents.on('document:published', loadArticles)

  return () => {
    documentEvents.off('document:approved', loadArticles)
    documentEvents.off('document:ready', loadArticles)
    documentEvents.off('document:published', loadArticles)
  }
}, [loadArticles])
```

**Resultado**:
- Usuario aprueba documento → Evento `document:approved` → ArticlesPage recarga → Artículo aparece inmediatamente ✅

### Caso 2: Actualización de Contadores en Sidebar

```typescript
// frontend/src/components/layout/Sidebar.tsx
const loadDocumentCounts = useCallback(async () => {
  const [readyRes, publishedRes] = await Promise.all([
    articlesService.getArticles({ status: 'READY', limit: 1 }),
    articlesService.getArticles({ status: 'PUBLISHED', limit: 1 })
  ])

  setDocumentCounts({
    READY: readyRes.total,
    PUBLISHED: publishedRes.total
  })
}, [])

useEffect(() => {
  loadDocumentCounts() // Inicial

  // Recargar contadores en cualquier cambio
  documentEvents.on('document:approved', loadDocumentCounts)
  documentEvents.on('document:published', loadDocumentCounts)

  return () => {
    documentEvents.off('document:approved', loadDocumentCounts)
    documentEvents.off('document:published', loadDocumentCounts)
  }
}, [loadDocumentCounts])
```

### Caso 3: Dashboard de Estadísticas

```typescript
// frontend/src/pages/dashboard/DashboardPage.tsx
useEffect(() => {
  const refreshStats = async () => {
    const stats = await adminService.getStatistics()
    setStatistics(stats)
  }

  refreshStats()

  // Actualizar stats en cualquier cambio de estado
  documentEvents.on('document:approved', refreshStats)
  documentEvents.on('document:rejected', refreshStats)
  documentEvents.on('document:published', refreshStats)

  return () => {
    documentEvents.off('document:approved', refreshStats)
    documentEvents.off('document:rejected', refreshStats)
    documentEvents.off('document:published', refreshStats)
  }
}, [])
```

---

## ✅ Best Practices

### 1. Siempre Usar `useCallback` para Handlers

```typescript
// ✅ CORRECTO: Handler estable entre renders
const handleEvent = useCallback(async () => {
  await loadData()
}, [loadData])

useEffect(() => {
  documentEvents.on('event', handleEvent)
  return () => documentEvents.off('event', handleEvent)
}, [handleEvent])
```

### 2. Emitir Eventos Solo Después de Éxito

```typescript
// ✅ CORRECTO: Emitir solo si backend confirma
try {
  await api.post('/documents/approve')
  documentEvents.emit('document:approved') // ✅
} catch (error) {
  // No emitir si falló
}

// ❌ INCORRECTO: Emitir antes de confirmar
documentEvents.emit('document:approved') // ❌ Premature
await api.post('/documents/approve')
```

### 3. Nombres de Eventos Descriptivos

```typescript
// ✅ CORRECTO: Nombre claro y específico
documentEvents.emit('document:approved')
documentEvents.emit('document:published')

// ❌ INCORRECTO: Genérico, ambiguo
documentEvents.emit('change')
documentEvents.emit('update')
```

### 4. Evitar Payloads Grandes

```typescript
// ✅ CORRECTO: Sin payload (listeners cargan desde API)
documentEvents.emit('document:approved')

// ❌ INCORRECTO: Payload grande (acoplamiento)
documentEvents.emit('document:approved', entireDocumentObject)
```

**Razón**: Los listeners deben ser responsables de cargar los datos que necesiten, no depender de payloads específicos.

### 5. Documentar Eventos en Componentes

```typescript
/**
 * ArticlesPage - Lista de artículos listos para publicar
 *
 * @listens document:approved - Recarga lista cuando se aprueba documento con artículo
 * @listens document:ready - Recarga lista cuando documento cambia a READY
 * @listens document:published - Recarga lista cuando se publica (para quitar de READY)
 */
export default function ArticlesPage() {
  // ...
}
```

---

## 🔍 Troubleshooting

### Problema 1: Eventos No Se Disparan

**Síntomas**:
- Listener no ejecuta callback
- Console log dentro de listener no aparece

**Diagnóstico**:
```typescript
// Activar debug en documentEvents
documentEvents.debug = true

// Ver todos los listeners activos
console.log(documentEvents.eventNames())
console.log(documentEvents.listenerCount('document:approved'))
```

**Soluciones Comunes**:
1. Verificar que emisor realmente llama `emit()`
2. Verificar nombre exacto del evento (case-sensitive)
3. Verificar que listener se registra antes de que evento se emita

### Problema 2: Listeners Duplicados (Memory Leak)

**Síntomas**:
- Callback se ejecuta múltiples veces
- Warning: "MaxListenersExceededWarning"

**Causa**: No hacer cleanup en `useEffect`

**Solución**:
```typescript
// ✅ Siempre incluir return con off()
useEffect(() => {
  documentEvents.on('event', handler)
  return () => documentEvents.off('event', handler) // 🧹 Cleanup
}, [handler])
```

### Problema 3: Timing Issues (Race Conditions)

**Síntomas**:
- Listener carga datos antes de que backend termine de persistir
- Datos obsoletos después de evento

**Solución 1: Delay en emisión**
```typescript
await api.post('/documents/approve')
setTimeout(() => {
  documentEvents.emit('document:approved')
}, 500) // Dar tiempo al backend
```

**Solución 2: Backend emite evento cuando ready**
```typescript
// Mejor: backend emite via SSE cuando datos están listos
eventSource.addEventListener('document:ready', () => {
  documentEvents.emit('document:ready')
})
```

### Problema 4: Eventos Se Pierden en Navegación

**Síntomas**:
- Usuario navega de página A → B → A
- Eventos emitidos en B no actualizan A

**Causa**: Listeners se desmontan al navegar

**Solución**: Usar stores globales (Zustand) para estado persistente
```typescript
// Store mantiene estado entre navegaciones
export const useDocumentStore = create()(
  persist(
    (set) => ({
      lastUpdate: null,
      setLastUpdate: (date) => set({ lastUpdate: date })
    }),
    { name: 'document-storage' }
  )
)
```

---

## ⚖️ Alternativas y Trade-offs

### Comparación de Soluciones

| Solución | Pros | Contras | Cuándo Usar |
|----------|------|---------|-------------|
| **EventEmitter Local** | • Síncrono<br>• Sin latencia<br>• Simple | • Solo frontend<br>• No persiste entre sesiones | Sincronización local de UI |
| **Server-Sent Events (SSE)** | • Real-time desde backend<br>• Múltiples clientes | • Latencia red<br>• Complejidad infra | Notificaciones entre usuarios |
| **React Query Invalidation** | • Cache management automático<br>• Integrado con data fetching | • Manual en cada mutación<br>• Menos declarativo | Invalidación de queries específicas |
| **WebSockets** | • Bidireccional<br>• Real-time potente | • Overhead grande<br>• Difícil de escalar | Chat, colaboración en tiempo real |
| **Polling** | • Simple<br>• Compatible con cualquier API | • Ineficiente<br>• Latencia | Cuando SSE/WS no disponibles |

### Cuándo Usar Cada Uno

**EventEmitter Local** ✅:
- Sincronizar componentes en mismo cliente
- Actualizaciones de UI inmediatas
- Bajo acoplamiento entre componentes

**SSE** ✅:
- Notificaciones push desde backend
- Progreso de tareas largas (scraping)
- Múltiples usuarios viendo mismos datos

**React Query** ✅:
- Invalidar cache después de mutaciones
- Sincronización con backend
- Data fetching optimizado

**Combinación Recomendada** (implementada):
```
EventEmitter (UI sync) + SSE (backend push) + React Query (data fetching)
```

### Trade-offs de Nuestra Implementación

**Ventajas**:
- ✅ Sincronización instantánea de UI
- ✅ Desacoplamiento de componentes
- ✅ Fácil de debuggear (eventos nombrados)
- ✅ Sin overhead de red

**Desventajas**:
- ⚠️ No sincroniza entre tabs/ventanas
- ⚠️ Requiere disciplina en cleanup
- ⚠️ Puede causar N requests al backend si muchos listeners

**Mitigaciones**:
- Usar `localStorage` events para sync entre tabs (si necesario)
- Linting rules para forzar cleanup en useEffect
- Debounce de llamadas al backend (TanStack Query hace esto automáticamente)

---

## 📚 Referencias

### Código Relevante

- **EventBus**: [`frontend/src/utils/documentEvents.ts`](../../frontend/src/utils/documentEvents.ts)
- **CurationStore**: [`frontend/src/stores/curationStore.ts`](../../frontend/src/stores/curationStore.ts)
- **Sidebar**: [`frontend/src/components/layout/Sidebar.tsx`](../../frontend/src/components/layout/Sidebar.tsx)
- **ArticlesPage**: [`frontend/src/pages/articles/ArticlesPage.tsx`](../../frontend/src/pages/articles/ArticlesPage.tsx)

### Documentación Relacionada

- [Sistema de Arquitectura Black Box](./BLACK_BOX_REFACTORING_SPEC.md) - Adapters y patrones de desacoplamiento
- [Frontend CLAUDE.md](../../frontend/CLAUDE.md) - Guía completa del frontend
- [CLAUDE.md Principal](../../CLAUDE.md) - Arquitectura general del sistema

### Recursos Externos

- [Node.js EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)
- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
- [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html)

---

## 📊 Historial de Cambios

| Versión | Fecha | Cambio | Autor |
|---------|-------|--------|-------|
| 1.0 | Octubre 2025 | Creación inicial del documento | Equipo Arquitectura |
| 1.0 | Octubre 2025 | Fix: ArticlesPage escucha `document:approved` | Jhonathan |

---

**Estado**: ✅ Sistema implementado y operativo
**Próximos Pasos**:
- [ ] Agregar tests unitarios para EventBus
- [ ] Implementar sync entre tabs con localStorage events (opcional)
- [ ] Monitorear performance con múltiples listeners

---

*Última actualización: Octubre 2025*
