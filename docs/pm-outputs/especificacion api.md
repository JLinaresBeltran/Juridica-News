# Especificación API - Sistema Editorial Jurídico Supervisado

## Información General

**Base URL**: `https://api.editorialjuridico.com/v1`  
**Autenticación**: Bearer Token (JWT)  
**Formato**: JSON  
**Versionado**: Versionado por URL (/v1/, /v2/, etc.)

## Endpoints de Documentos Fuente: /api/documents

### GET /api/documents
Obtiene lista paginada de documentos scraped con filtros.

**Parámetros de Query:**
- `page` (int): Número de página (default: 1)
- `limit` (int): Elementos por página (default: 20, max: 100)
- `status` (string): `pending`, `approved`, `rejected`, `processing`
- `source` (string): Fuente del documento (`boe`, `tribunal_supremo`, etc.)
- `legal_area` (string): Área jurídica (`civil`, `penal`, `mercantil`, etc.)
- `date_from` (string): Fecha inicio (ISO 8601)
- `date_to` (string): Fecha fin (ISO 8601)
- `priority` (string): `low`, `normal`, `high`, `urgent`
- `search` (string): Búsqueda en título y resumen

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Título del documento oficial",
      "source": "boe",
      "url": "https://boe.es/...",
      "publication_date": "2024-01-15T00:00:00Z",
      "legal_area": "civil",
      "document_type": "ley",
      "priority": "normal",
      "status": "pending",
      "ai_summary": "Resumen automático generado por IA...",
      "confidence_score": 0.85,
      "created_at": "2024-01-15T10:30:00Z",
      "metadata": {
        "pages": 45,
        "file_size": 2048576,
        "language": "es"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### POST /api/documents/{id}/curate
Curación de documento (aprobar/rechazar).

**Body:**
```json
{
  "action": "approve", // approve | reject
  "priority": "high", // low | normal | high | urgent (opcional)
  "notes": "Documento relevante para actualización de normativa civil",
  "estimated_effort": 120 // minutos estimados de trabajo
}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "status": "approved",
  "curated_by": "user_uuid",
  "curated_at": "2024-01-15T14:30:00Z",
  "notes": "Documento relevante..."
}
```

### POST /api/documents/batch-curate
Curación masiva de documentos.

**Body:**
```json
{
  "documents": [
    {
      "id": "uuid1",
      "action": "approve",
      "priority": "normal"
    },
    {
      "id": "uuid2", 
      "action": "reject",
      "notes": "Fuera del scope editorial"
    }
  ]
}
```

## Endpoints de Artículos: /api/articles

### GET /api/articles
Lista de artículos en proceso o publicados.

**Parámetros de Query:**
- `status` (string): `draft`, `in_review`, `published`
- `author` (string): UUID del autor
- `created_after` (string): Fecha ISO 8601

### POST /api/articles
Crear nuevo artículo desde documento aprobado.

**Body:**
```json
{
  "source_document_id": "uuid",
  "title": "Título propuesto del artículo",
  "target_length": 1500, // palabras aproximadas
  "tone": "professional", // professional | academic | accessible
  "focus_areas": ["aspectos_practicos", "jurisprudencia_relevante"]
}
```

### GET /api/articles/{id}
Obtener artículo específico con todo su contenido y metadata.

### PUT /api/articles/{id}
Actualizar artículo completo.

**Body:**
```json
{
  "title": "Título actualizado",
  "content": "Contenido HTML del artículo...",
  "summary": "Resumen ejecutivo",
  "keywords": ["derecho civil", "contratos", "actualización"],
  "seo_title": "Título optimizado para SEO",
  "meta_description": "Descripción meta para motores de búsqueda",
  "legal_area": "civil",
  "publication_section": "actualizaciones_normativas"
}
```

### POST /api/articles/{id}/versions
Crear nueva versión del artículo.

**Body:**
```json
{
  "label": "Revisión post-feedback cliente",
  "auto_generated": false
}
```

### GET /api/articles/{id}/versions
Obtener historial de versiones del artículo.

### POST /api/articles/{id}/restore-version
Restaurar versión específica del artículo.

**Body:**
```json
{
  "version_id": "uuid"
}
```

## Endpoints de Servicios IA: /api/ai

### POST /api/ai/generate-content
Generar contenido de artículo desde documento fuente.

**Body:**
```json
{
  "source_document_id": "uuid",
  "article_id": "uuid", // si ya existe
  "generation_type": "full", // full | section | summary
  "section": "introduccion", // si generation_type = section
  "parameters": {
    "target_length": 1200,
    "tone": "professional",
    "include_practical_examples": true,
    "focus_areas": ["cambios_normativos", "impacto_juridico"]
  }
}
```

**Respuesta:**
```json
{
  "request_id": "uuid",
  "generated_content": "Contenido HTML generado...",
  "metadata": {
    "word_count": 1185,
    "generation_time": 8.5,
    "confidence_score": 0.92,
    "sources_referenced": 3
  }
}
```

### POST /api/ai/regenerate-section
Regenerar sección específica de un artículo.

**Body:**
```json
{
  "article_id": "uuid",
  "section_text": "Texto actual de la sección a regenerar",
  "instruction": "expandir", // expandir | resumir | cambiar_tono | aclarar
  "parameters": {
    "target_length": 300,
    "tone": "accessible"
  }
}
```

### POST /api/ai/generate-images
Generar imágenes para artículo.

**Body:**
```json
{
  "article_id": "uuid",
  "content_context": "Texto del artículo para contexto...",
  "image_type": "hero", // hero | illustration | diagram
  "custom_prompt": "Imagen profesional representando...", // opcional
  "style": "professional", // professional | academic | modern
  "count": 4 // número de variaciones (1-6)
}
```

**Respuesta:**
```json
{
  "request_id": "uuid",
  "images": [
    {
      "id": "uuid",
      "url": "https://storage.com/generated/image1.jpg",
      "thumbnail_url": "https://storage.com/thumbnails/image1.jpg",
      "prompt": "Prompt usado para generación",
      "style": "professional",
      "dimensions": {"width": 1200, "height": 800}
    }
  ]
}
```

### GET /api/ai/requests/{id}/status
Verificar estado de operaciones de IA asíncronas.

## Endpoints de Multimedia: /api/media

### POST /api/media/upload
Subir archivos multimedia.

### GET /api/media/{id}
Obtener archivo multimedia específico.

### POST /api/media/{id}/edit
Aplicar ediciones básicas (crop, resize, filters).

**Body:**
```json
{
  "operations": [
    {
      "type": "crop",
      "parameters": {"x": 100, "y": 50, "width": 800, "height": 600}
    },
    {
      "type": "resize", 
      "parameters": {"width": 1200, "height": 800, "maintain_ratio": true}
    }
  ]
}
```

## Endpoints del Portal Público: /api/public

### GET /api/public/articles
Artículos publicados para consumo público.

**Parámetros de Query:**
- `section` (string): Sección del portal
- `legal_area` (string): Área jurídica
- `search` (string): Búsqueda full-text
- `page`, `limit`: Paginación

### GET /api/public/articles/{slug}
Artículo específico por slug público.

### GET /api/public/search
Búsqueda avanzada en contenido público.

**Parámetros de Query:**
- `q` (string): Consulta de búsqueda
- `legal_area` (string): Filtro por área
- `date_range` (string): `last_month`, `last_year`, etc.
- `sort` (string): `relevance`, `date`, `popularity`

## Endpoints de Auditoría: /api/audit

### GET /api/audit/activity
Historial de actividad del usuario.

**Parámetros de Query:**
- `user_id` (string): UUID del usuario (admin only)
- `action_type` (string): Tipo de acción
- `resource_type` (string): `document`, `article`, etc.
- `date_from`, `date_to`: Rango de fechas

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action_type": "article_edited",
      "resource_type": "article",
      "resource_id": "uuid",
      "timestamp": "2024-01-15T14:30:00Z",
      "details": {
        "changes": {
          "title": {
            "from": "Título anterior",
            "to": "Título nuevo"
          }
        },
        "section_modified": "introduccion"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

### POST /api/audit/export
Exportar historial de auditoría.

## Endpoints de Gestión de Usuario: /api/auth

### POST /api/auth/login
Autenticación de usuario.

### POST /api/auth/refresh
Renovar token de acceso.

### GET /api/auth/profile
Perfil del usuario autenticado.

### PUT /api/auth/profile
Actualizar perfil de usuario.

## Endpoint de Streaming de Eventos: /api/events/stream

**Protocolo**: Server-Sent Events (SSE)  
**URL**: `GET /api/events/stream`  
**Headers**: `Authorization: Bearer {token}`

### Tipos de Eventos

#### Evento: document_scraped
Nuevo documento disponible para curación.
```json
{
  "type": "document_scraped",
  "data": {
    "document_id": "uuid",
    "title": "Nuevo documento BOE",
    "priority": "high",
    "legal_area": "civil"
  }
}
```

#### Evento: ai_generation_complete
Generación de IA completada.
```json
{
  "type": "ai_generation_complete", 
  "data": {
    "request_id": "uuid",
    "article_id": "uuid",
    "generation_type": "full",
    "status": "success"
  }
}
```

#### Evento: article_auto_saved
Guardado automático realizado.
```json
{
  "type": "article_auto_saved",
  "data": {
    "article_id": "uuid", 
    "timestamp": "2024-01-15T14:35:00Z",
    "changes_count": 3
  }
}
```

#### Evento: system_notification
Notificaciones del sistema.
```json
{
  "type": "system_notification",
  "data": {
    "level": "info", // info | warning | error
    "title": "Sistema actualizado",
    "message": "Nueva versión del editor disponible",
    "action_url": "/updates"
  }
}
```

#### Evento: error
Errores del sistema que requieren atención.
```json
{
  "type": "error",
  "data": {
    "error_code": "AI_SERVICE_UNAVAILABLE",
    "message": "Servicio de IA temporalmente no disponible",
    "retry_after": 300,
    "affected_features": ["content_generation", "image_generation"]
  }
}
```

#### Evento: connected
Confirmación de conexión establecida.
```json
{
  "type": "connected",
  "data": {
    "session_id": "uuid",
    "server_time": "2024-01-15T14:30:00Z"
  }
}
```

#### Evento: done
Finalización del stream.
```json
{
  "type": "done",
  "data": {
    "reason": "client_disconnect",
    "session_duration": 3600
  }
}
```

## Códigos de Error Estándar

### 4xx - Errores de Cliente
- **400**: Bad Request - Parámetros inválidos
- **401**: Unauthorized - Token faltante o inválido  
- **403**: Forbidden - Sin permisos para la acción
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Conflicto de estado (ej: artículo ya publicado)
- **429**: Rate Limited - Límite de peticiones excedido

### 5xx - Errores de Servidor
- **500**: Internal Server Error - Error general del servidor
- **502**: Bad Gateway - Error en servicio de IA
- **503**: Service Unavailable - Servicio temporalmente no disponible
- **504**: Gateway Timeout - Timeout en servicios externos

### Códigos Personalizados del Dominio
- **4001**: `DOCUMENT_ALREADY_CURATED` - Documento ya fue curado
- **4002**: `INVALID_GENERATION_PARAMETERS` - Parámetros de IA inválidos  
- **5001**: `AI_SERVICE_UNAVAILABLE` - Servicio de IA no disponible
- **5002**: `SCRAPING_SERVICE_ERROR` - Error en sistema de scraping