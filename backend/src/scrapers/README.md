# Sistema de Scrapers Modulares

## 🎯 Visión General

El sistema de scrapers modulares permite agregar fácilmente nuevas fuentes de extracción jurídica sin modificar el código existente. Cada scraper es independiente y sigue una arquitectura común.

## 🏗️ Arquitectura

```
backend/src/scrapers/
├── base/                           # Clases y tipos base
│   ├── types.ts                    # Interfaces y tipos
│   ├── BaseScrapingService.ts      # Clase abstracta base
│   └── SourceRegistry.ts           # Registro de fuentes
├── corte-constitucional/           # Scraper Corte Constitucional
│   └── CorteConstitucionalScraper.ts
├── consejo-estado/                 # Scraper Consejo de Estado
│   └── ConsejoEstadoScraper.ts
└── index.ts                        # Factory y exports principales
```

## 📋 Pasos para Agregar un Nuevo Scraper

### 1. Crear el Directorio del Scraper

```bash
mkdir backend/src/scrapers/tribunal-superior-bogota
```

### 2. Implementar el Scraper

Crear `TribunalSuperiorBogotaScraper.ts`:

```typescript
import { BaseScrapingService } from '@/scrapers/base/BaseScrapingService';
import {
  ExtractionParameters,
  ExtractionResult,
  ExtractedDocument,
  SourceMetadata,
  DocumentType,
  LegalArea
} from '@/scrapers/base/types';

export class TribunalSuperiorBogotaScraper extends BaseScrapingService {
  constructor() {
    const metadata: SourceMetadata = {
      id: 'tribunal_superior_bogota',
      name: 'Tribunal Superior de Bogotá',
      description: 'Sentencias del Tribunal Superior de Bogotá',
      baseUrl: 'https://www.tribunalsuperior.gov.co',
      supportedDocumentTypes: ['SENTENCE', 'RULING'],
      supportedLegalAreas: ['CIVIL', 'COMMERCIAL', 'CRIMINAL'],
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerHour: 150
      },
      capabilities: {
        supportsDownload: true,
        supportsSearch: true,
        supportsDateRange: true,
        supportsFullText: false,
        requiresAuthentication: false,
        hasRateLimiting: true
      },
      configuration: {
        timeout: 180000,
        retries: 3,
        concurrent: false,
        maxConcurrency: 1
      }
    };

    super('tribunal_superior_bogota', metadata);
  }

  async extractDocuments(parameters: ExtractionParameters): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      this.updateProgress({
        progress: 10,
        message: 'Iniciando extracción del Tribunal Superior...'
      });

      // Implementar lógica de extracción específica aquí
      const documents = await this.performExtraction(parameters);
      
      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000;

      return {
        success: true,
        documents,
        downloadedCount: 0,
        extractionTime,
        totalFound: documents.length,
        metadata: {
          source: this.sourceId
        }
      };

    } catch (error) {
      throw new Error(`Error en extracción: ${error}`);
    }
  }

  private async performExtraction(parameters: ExtractionParameters): Promise<ExtractedDocument[]> {
    // Implementar la lógica específica de extracción
    // Puede usar Selenium, Puppeteer, APIs REST, etc.
    
    this.updateProgress({
      progress: 50,
      message: 'Extrayendo documentos...'
    });

    // Ejemplo de documentos mock
    return [
      {
        documentId: 'TSB-2024-001',
        title: 'Sentencia TSB-2024-001',
        source: this.sourceId,
        url: 'https://tribunal.gov.co/sentencia/001',
        content: 'Contenido de la sentencia...',
        summary: 'Resumen de la sentencia...',
        documentType: DocumentType.SENTENCE,
        legalArea: LegalArea.CIVIL,
        publicationDate: new Date(),
        extractionDate: new Date(),
        metadata: {
          tribunal: 'Tribunal Superior de Bogotá',
          sala: 'Sala Civil'
        }
      }
    ];
  }

  protected async performHealthCheck(): Promise<void> {
    const response = await fetch(this.metadata.baseUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }
}
```

### 3. Registrar en el Factory

Agregar en `backend/src/scrapers/index.ts`:

```typescript
import { TribunalSuperiorBogotaScraper } from './tribunal-superior-bogota/TribunalSuperiorBogotaScraper';

export class ScrapersFactory {
  private static scrapers: Map<string, () => BaseScrapingService> = new Map([
    ['corte_constitucional', () => new CorteConstitucionalScraper()],
    ['consejo_estado', () => new ConsejoEstadoScraper()],
    ['tribunal_superior_bogota', () => new TribunalSuperiorBogotaScraper()], // NUEVO
  ]);
  
  // ... resto del código
}
```

### 4. Probar el Nuevo Scraper

```bash
# Ejecutar el backend
npm run dev

# Probar la nueva fuente
curl -X GET "http://localhost:3001/api/scraping/v2/sources" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Ejecutar extracción
curl -X POST "http://localhost:3001/api/scraping/v2/extract" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sourceId": "tribunal_superior_bogota",
    "limit": 5
  }'
```

## 🔧 Componentes Principales

### BaseScrapingService

Clase abstracta que proporciona:
- ✅ Manejo de progreso y eventos
- ✅ Validación de documentos
- ✅ Health checks automáticos
- ✅ Manejo de errores y reintentos
- ✅ Sistema de eventos

### SourceRegistry

Gestiona todas las fuentes:
- ✅ Registro dinámico de scrapers
- ✅ Monitoreo de salud
- ✅ Estadísticas por fuente
- ✅ Búsqueda por capacidades

### ScrapingOrchestrator

Coordina todas las operaciones:
- ✅ Cola de trabajos
- ✅ Ejecución concurrente
- ✅ Persistencia de resultados
- ✅ Notificaciones en tiempo real

### QueueManager

Sistema de colas con BullMQ:
- ✅ Colas por fuente
- ✅ Reintentos automáticos
- ✅ Persistencia Redis
- ✅ Monitoreo de trabajos

## 📊 Tipos de Documentos Soportados

```typescript
enum DocumentType {
  SENTENCE = 'SENTENCE',      // Sentencias
  RULING = 'RULING',          // Providencias
  DECISION = 'DECISION',      // Decisiones
  ORDINANCE = 'ORDINANCE',    // Ordenanzas
  RESOLUTION = 'RESOLUTION',  // Resoluciones
  CONCEPT = 'CONCEPT',        // Conceptos
  CIRCULAR = 'CIRCULAR'       // Circulares
}

enum LegalArea {
  CONSTITUTIONAL = 'CONSTITUTIONAL',  // Constitucional
  ADMINISTRATIVE = 'ADMINISTRATIVE', // Administrativo
  CIVIL = 'CIVIL',                   // Civil
  COMMERCIAL = 'COMMERCIAL',         // Comercial
  CRIMINAL = 'CRIMINAL',             // Penal
  LABOR = 'LABOR',                   // Laboral
  FAMILY = 'FAMILY',                 // Familia
  TAX = 'TAX',                       // Tributario
  DIGITAL = 'DIGITAL'                // Digital/Tecnología
}
```

## 🚀 APIs Disponibles

### Obtener Fuentes
```
GET /api/scraping/v2/sources
```

### Extraer Documentos
```
POST /api/scraping/v2/extract
{
  "sourceId": "tribunal_superior_bogota",
  "limit": 10,
  "downloadDocuments": false,
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "documentTypes": ["SENTENCE", "RULING"]
}
```

### Estado del Trabajo
```
GET /api/scraping/v2/jobs/{jobId}
```

### Estadísticas
```
GET /api/scraping/v2/stats
```

### Salud del Sistema
```
GET /api/scraping/v2/health
```

## 🔍 Monitoreo y Debugging

### Logs Estructurados
Los scrapers generan logs detallados:
- ✅ Inicio y fin de extracción
- ✅ Progreso en tiempo real
- ✅ Errores con stack trace
- ✅ Métricas de rendimiento

### Server-Sent Events (SSE)
Notificaciones en tiempo real al frontend:
- ✅ Progreso de extracción
- ✅ Documentos encontrados
- ✅ Errores y reintentos
- ✅ Finalización exitosa

### Health Checks
Verificación automática cada 5 minutos:
- ✅ Conectividad de fuentes
- ✅ Tiempo de respuesta
- ✅ Tasa de éxito/error
- ✅ Estado general del sistema

## 🛠️ Herramientas de Desarrollo

### Testing
Cada scraper debe incluir tests:
```typescript
// tribunal-superior-bogota.test.ts
import { TribunalSuperiorBogotaScraper } from './TribunalSuperiorBogotaScraper';

describe('TribunalSuperiorBogotaScraper', () => {
  test('should extract documents', async () => {
    const scraper = new TribunalSuperiorBogotaScraper();
    const result = await scraper.extractDocuments({ limit: 5 });
    
    expect(result.success).toBe(true);
    expect(result.documents.length).toBeGreaterThan(0);
  });
});
```

### Validación
El sistema valida automáticamente:
- ✅ Estructura de documentos
- ✅ URLs válidas
- ✅ Metadatos requeridos
- ✅ Tipos de datos

### Performance
Métricas automáticas:
- ✅ Tiempo de extracción
- ✅ Documentos por minuto
- ✅ Tasa de éxito
- ✅ Uso de memoria

## 📚 Ejemplos de Integración

### Selenium WebDriver
```typescript
import { Builder, By, WebDriver } from 'selenium-webdriver';

private async extractWithSelenium(): Promise<ExtractedDocument[]> {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    await driver.get(this.metadata.baseUrl);
    
    // Lógica de navegación y extracción
    const elements = await driver.findElements(By.css('.document-link'));
    
    // Procesar elementos...
    
  } finally {
    await driver.quit();
  }
}
```

### API REST
```typescript
private async extractFromAPI(): Promise<ExtractedDocument[]> {
  const response = await fetch(`${this.metadata.baseUrl}/api/documents`, {
    headers: {
      'Authorization': 'Bearer ' + this.getApiKey(),
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return this.processApiResponse(data);
}
```

### Web Scraping con Cheerio
```typescript
import * as cheerio from 'cheerio';

private async extractWithCheerio(html: string): Promise<ExtractedDocument[]> {
  const $ = cheerio.load(html);
  const documents: ExtractedDocument[] = [];
  
  $('.document-item').each((index, element) => {
    const title = $(element).find('.title').text();
    const url = $(element).find('a').attr('href');
    
    documents.push({
      documentId: `DOC-${index}`,
      title,
      url,
      // ... otros campos
    });
  });
  
  return documents;
}
```

## 🔐 Consideraciones de Seguridad

- ✅ Rate limiting por fuente
- ✅ Timeout para prevenir hang
- ✅ Validación de URLs
- ✅ Sanitización de contenido
- ✅ Logging de actividad

## 📈 Roadmap de Nuevas Fuentes

### Prioritarias (Q1 2025)
1. Tribunal Superior de Bogotá
2. Corte Suprema de Justicia
3. Tribunal Contencioso Administrativo

### Mediano Plazo (Q2 2025)
4. Superintendencia Financiera
5. Superintendencia de Industria y Comercio
6. DIAN (Dirección de Impuestos)

### Largo Plazo (Q3-Q4 2025)
7. Procuraduría General
8. Contraloría General
9. Defensoría del Pueblo
10. INVIMA

---

¿Preguntas? Consulta la documentación completa o contacta al equipo de desarrollo.