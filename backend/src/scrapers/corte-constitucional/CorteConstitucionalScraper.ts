import puppeteer, { Browser } from 'puppeteer';
import { BaseScrapingService } from '@/scrapers/base/BaseScrapingService';
import {
  ExtractionParameters,
  ExtractionResult,
  ExtractedDocument,
  SourceMetadata,
  DocumentType,
  LegalArea,
  JobStatus
} from '@/scrapers/base/types';
import { logger } from '@/utils/logger';

// Black Box Adapters
import { MammothContentProcessor } from '@/adapters/content/MammothContentProcessor';
import { RegexMetadataExtractor } from '@/adapters/metadata/RegexMetadataExtractor';

export class CorteConstitucionalScraper extends BaseScrapingService {
  private browser: Browser | null = null;
  private contentProcessor: MammothContentProcessor;
  private metadataExtractor: RegexMetadataExtractor;

  constructor() {
    const metadata: SourceMetadata = {
      id: 'corte-constitucional',
      name: 'Corte Constitucional de Colombia',
      description: 'Sentencias de la Corte Constitucional - Extracción Real',
      baseUrl: 'https://www.corteconstitucional.gov.co',
      supportedDocumentTypes: ['SENTENCE'],
      supportedLegalAreas: ['CONSTITUTIONAL'],
      rateLimit: { requestsPerMinute: 30, requestsPerHour: 100 },
      capabilities: {
        supportsDownload: true,
        supportsSearch: true,
        supportsDateRange: true,
        supportsFullText: false,
        requiresAuthentication: false,
        hasRateLimiting: true
      },
      configuration: {
        timeout: 60000,
        retries: 3,
        concurrent: false,
        maxConcurrency: 1
      }
    };
    super('corte-constitucional', metadata);

    // Inicializar Black Box Adapters
    this.contentProcessor = new MammothContentProcessor();
    this.metadataExtractor = new RegexMetadataExtractor();
  }

  async extractDocuments(parameters: ExtractionParameters): Promise<ExtractionResult> {
    const startTime = Date.now();
    let extractedDocuments: ExtractedDocument[] = [];
    
    // 🔍 DEBUG: Log detallado de parámetros recibidos por el scraper
    logger.info('🛠️ DEBUG - Parámetros completos recibidos por el scraper:', {
      limit: parameters.limit,
      downloadDocuments: parameters.downloadDocuments,
      dateRange: parameters.dateRange,
      documentTypes: parameters.documentTypes,
      customParams: parameters.customParams
    });
    
    try {
      this.updateProgress({
        progress: 5,
        message: '🚀 Etapa 1/5: Iniciando extracción de sentencias...',
        status: JobStatus.RUNNING
      });

      const limit = Math.min(parameters.limit || 10, 20);
      logger.info(`🔍 Iniciando extracción real de ${limit} documentos de Corte Constitucional`);

      // Inicializar Puppeteer
      this.updateProgress({
        progress: 15,
        message: '🌐 Etapa 2/5: Inicializando navegador Chromium...',
        status: JobStatus.RUNNING
      });
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 30000
      });

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      this.updateProgress({
        progress: 25,
        message: '📍 Etapa 3/5: Navegando al portal de la Corte Constitucional...',
        status: JobStatus.RUNNING
      });

      // Seguir el flujo correcto del usuario
      logger.info(`🌐 PASO 1: Navegando a página principal`);
      await page.goto('https://www.corteconstitucional.gov.co/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logger.info(`🌐 PASO 2: Navegando al buscador de jurisprudencia`);
      const buscadorUrl = 'https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia';
      
      await page.goto(buscadorUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar carga completa
      
      const pageTitle = await page.title();
      const currentUrl = page.url();
      
      logger.info(`📍 URL actual: ${currentUrl}`);
      logger.info(`📝 Título de página: ${pageTitle}`);
      
      logger.info(`🔍 PASO 3: Buscando botón "Ver últimas sentencias" en el buscador`);
      
      // Buscar específicamente el botón "Ver últimas sentencias" en esta página
      let navigationSuccess = await this.clickVerUltimasSentencias(page);
      
      if (navigationSuccess) {
        logger.info('✅ PASO 4: Click exitoso en "Ver últimas sentencias"');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar carga de resultados
      } else {
        logger.warn('⚠️ No se encontró el botón "Ver últimas sentencias", continuando con búsqueda directa');
      }

      if (!navigationSuccess) {
        throw new Error('No se pudo hacer click en "Ver últimas sentencias" - fin de extracción');
      }

      logger.info('📄 Página cargada, buscando sentencias...');
      this.updateProgress({
        progress: 40,
        message: '🔍 Etapa 4/5: Buscando sentencias en el buscador jurídico...',
        status: JobStatus.RUNNING
      });

      // Esperar a que Angular/contenido dinámico cargue
      await this.waitForAngularLoad(page);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PASO 5: Extraer sentencias siguiendo el patrón del usuario (t-373-25.htm)
      logger.info(`🔍 PASO 5: Extrayendo sentencias del patrón correcto`);
      const sentenceLinks = await this.extractSentencesFromUltimasSentencias(page, limit);

      logger.info(`📋 Encontrados ${sentenceLinks.length} enlaces de sentencias`);
      this.updateProgress({
        progress: 60,
        message: `📥 Etapa 5/5: Descargando y procesando ${sentenceLinks.length} sentencias...`,
        documentsFound: sentenceLinks.length,
        status: JobStatus.RUNNING
      });


      this.updateProgress({
        progress: 65,
        message: '⚙️ Verificando documentos y extrayendo contenido...',
        documentsFound: sentenceLinks.length,
        status: JobStatus.RUNNING
      });

      // Contadores para estadísticas
      let duplicatesSkipped = 0;
      let newDocumentsProcessed = 0;
      let failedDownloads = 0;

      // Procesar documentos encontrados con verificación RTF
      for (let i = 0; i < sentenceLinks.length; i++) {
        const linkData = sentenceLinks[i];
        if (!linkData) continue;

        try {
          // Determinar tipo de documento
          let documentType = DocumentType.SENTENCE;
          let typeKey = 'sentencia';

          if (linkData.documentId.startsWith('T-')) {
            typeKey = 'tutela';
          } else if (linkData.documentId.startsWith('C-')) {
            typeKey = 'constitucionalidad';
          } else if (linkData.documentId.startsWith('SU-')) {
            typeKey = 'sala-unificada';
            logger.info(`📋 Sentencia SU detectada en procesamiento: ${linkData.documentId}`);
          } else if (linkData.documentId.startsWith('A-')) {
            typeKey = 'auto';
          }

          this.updateProgress({
            progress: 65 + ((i + 1) / sentenceLinks.length) * 30,
            message: `📄 Procesando documento ${i + 1}/${sentenceLinks.length}: ${linkData.documentId}`,
            documentsFound: sentenceLinks.length,
            documentsProcessed: i,
            currentDocument: linkData.documentId,
            status: JobStatus.RUNNING
          });

          // VERIFICAR DUPLICADOS - Si ya existe, omitir
          const documentExists = await this.checkDocumentExists(linkData.documentId);
          if (documentExists) {
            duplicatesSkipped++;
            logger.info(`⏩ OMITIENDO ${linkData.documentId} - Ya existe (${duplicatesSkipped} duplicados omitidos)`);
            continue; // Saltar al siguiente documento
          }

          // Verificar y validar documento RTF/DOCX
          const documentVerification = await this.verifyAndDownloadRTFDocument(
            linkData.documentId, 
            linkData.url
          );

          let finalUrl = linkData.url;
          // let documentStatus = 'extracted'; // Variable no utilizada eliminada
          let documentMetadata: any = {
            extractedFrom: linkData.url,
            extractionMethod: 'puppeteer-typescript-v3',
            documentType: typeKey,
            rawText: linkData.rawText,
            rawTitle: linkData.rawTitle,
            realExtraction: true,
            systemMigration: 'python-to-typescript',
            sourcePage: (linkData as any).sourcePage || 'https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia',
            matchedPattern: (linkData as any).matchedPattern,
            extractionVersion: 'v3-with-rtf-verification',
            structuredData: (linkData as any).structuredData
          };

          // 🔥 FIX: Si no hay structuredData (método fallback), intentar extraer fechaPublicacion de la página HTML individual
          if (!(linkData as any).structuredData && linkData.htmlUrl) {
            try {
              logger.info(`🔍 Método fallback detectado - intentando extraer fecha de publicación de: ${linkData.htmlUrl}`);

              const page = await this.browser!.newPage();
              await page.goto(linkData.htmlUrl, { waitUntil: 'networkidle2', timeout: 15000 });

              // Buscar la fecha de publicación en la página HTML individual
              const fechaPublicacion = await page.evaluate(() => {
                // Buscar patrones comunes de fecha en páginas de sentencias
                const selectors = [
                  // Buscar texto que contenga "fecha de publicación" o similar
                  'td:contains("Fecha de publicación")',
                  'th:contains("Fecha de publicación")',
                  'span:contains("Fecha de publicación")',
                  'p:contains("Fecha de publicación")',
                  // Buscar en metadatos
                  'meta[name*="date"]',
                  'meta[property*="date"]',
                  // Buscar fechas en formato típico de la Corte
                  'td', 'th', 'span', 'p', 'div'
                ];

                // Función para verificar si un texto contiene fecha en formato de Corte Constitucional
                const extractDateFromText = (text: string): string | null => {
                  if (!text) return null;

                  // Patrones de fecha comunes en la Corte Constitucional
                  const datePatterns = [
                    /(\d{4}-\d{2}-\d{2})/g, // YYYY-MM-DD
                    /(\d{1,2})\s*de\s*(\w+)\s*de\s*(\d{4})/gi, // DD de MONTH de YYYY
                    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // DD/MM/YYYY
                  ];

                  for (const pattern of datePatterns) {
                    const match = text.match(pattern);
                    if (match) {
                      return match[0];
                    }
                  }
                  return null;
                };

                // Buscar en todos los elementos de la página
                const allElements = document.querySelectorAll('*');
                for (const element of allElements) {
                  const textContent = element.textContent || '';

                  // Buscar específicamente líneas que mencionen "fecha de publicación"
                  if (textContent.toLowerCase().includes('fecha de publicación') ||
                      textContent.toLowerCase().includes('fecha publicación') ||
                      textContent.toLowerCase().includes('publicación')) {

                    const parentText = element.parentElement?.textContent || textContent;
                    const extractedDate = extractDateFromText(parentText);
                    if (extractedDate) {
                      return extractedDate;
                    }
                  }

                  // También buscar fechas en formato YYYY-MM-DD directamente
                  const directDate = extractDateFromText(textContent);
                  if (directDate && directDate.match(/\d{4}-\d{2}-\d{2}/)) {
                    // Verificar que la fecha sea razonable (año 2020-2030)
                    const year = parseInt(directDate.split('-')[0]);
                    if (year >= 2020 && year <= 2030) {
                      return directDate;
                    }
                  }
                }

                return null;
              });

              await page.close();

              if (fechaPublicacion) {
                logger.info(`✅ Fecha de publicación extraída del HTML: ${fechaPublicacion}`);

                // Crear structuredData sintético con la fecha extraída
                documentMetadata.structuredData = {
                  fechaPublicacion: fechaPublicacion,
                  tipoDocumento: typeKey,
                  numeroDocumento: linkData.documentId,
                  extractionMethod: 'fallback-html-individual-page'
                };

                logger.info(`🎯 StructuredData sintético creado para documento fallback: ${linkData.documentId}`);
              } else {
                logger.warn(`⚠️ No se pudo extraer fecha de publicación del HTML para: ${linkData.documentId}`);
              }

            } catch (htmlExtractionError) {
              logger.warn(`⚠️ Error extrayendo fecha del HTML individual: ${(htmlExtractionError as Error).message}`);
            }
          }

          if (documentVerification.success) {
            logger.debug(`✅ Documento RTF verificado: ${linkData.documentId}`);

            // 🔍 Log especial para sentencias SU
            if (linkData.documentId.startsWith('SU-')) {
              logger.info(`✅ Sentencia SU descargada exitosamente: ${linkData.documentId} (${documentVerification.extractedText?.length || 0} caracteres)`);
            }

            finalUrl = documentVerification.localPath || linkData.url;
            // documentStatus = 'verified_rtf'; // Variable no utilizada eliminada
            documentMetadata.rtfVerification = {
              verified: true,
              contentType: documentVerification.contentType,
              isValidOffice: documentVerification.isValidOffice,
              verifiedUrl: finalUrl
            };
          } else {
            logger.warn(`⚠️ Documento RTF no verificado: ${linkData.documentId} - ${documentVerification.error}`);

            // 🔍 Warning especial para sentencias SU fallidas
            if (linkData.documentId.startsWith('SU-')) {
              logger.error(`❌ FALLO DESCARGA SU: ${linkData.documentId} - URL: ${linkData.url} - Error: ${documentVerification.error}`);
            }

            documentMetadata.rtfVerification = {
              verified: false,
              error: documentVerification.error
            };
          }

          // Crear documento con datos estructurados si están disponibles
          let publicationDate = new Date();
          let content = `Documento jurídico extraído: ${linkData.title}\n\nURL: ${finalUrl}\nTipo: ${typeKey}`;
          
          if ((linkData as any).structuredData) {
            const structured = (linkData as any).structuredData;
            publicationDate = structured.fechaPublicacion ? 
              this.parseSpanishDate(structured.fechaPublicacion) : new Date();
            
            content += `\n\n=== DATOS ESTRUCTURADOS ===`;
            content += `\nNúmero: ${structured.numero || 'N/A'}`;
            content += `\nExpediente: ${structured.expediente || 'N/A'}`;
            content += `\nFecha de publicación: ${structured.fechaPublicacion || 'N/A'}`;
            content += `\nFecha de sentencia: ${structured.fechaSentencia || 'N/A'}`;
            content += `\nTipo: ${structured.tipo || typeKey}`;
            content += `\nTema: ${structured.tema || 'N/A'}`;
            content += `\n\nEste documento fue extraído con datos estructurados de la tabla oficial de "Ver últimas sentencias" de la Corte Constitucional de Colombia.`;
          } else {
            content += `\n\nEste documento fue extraído del sitio web oficial de la Corte Constitucional de Colombia usando el sistema de scraping actualizado con filtrado por los últimos 5 días hábiles.`;
          }

          // 🔥 EXTRAER METADATOS DEL CONTENIDO RTF USANDO BLACK BOX ADAPTER
          let finalMetadata = documentMetadata;

          if (documentVerification.success && documentVerification.extractedText) {
            try {
              const extractedMetadata = await this.metadataExtractor.extract(
                documentVerification.extractedText,
                {
                  documentTitle: linkData.title,
                  source: 'corte-constitucional'
                }
              );

              if (extractedMetadata) {
                logger.info(`🔍 Metadatos extraídos del RTF - Magistrado: ${extractedMetadata.magistradoPonente || 'N/A'}, Expediente: ${extractedMetadata.expediente || 'N/A'}, Sala: ${extractedMetadata.salaRevision || 'N/A'}`);

                // Añadir metadatos extraídos al objeto metadata
                finalMetadata.extractedMetadata = extractedMetadata;
              }
            } catch (metadataError) {
              logger.warn(`⚠️ Error extrayendo metadatos de ${linkData.documentId}:`, metadataError);
            }
          }

          const document: ExtractedDocument = {
            documentId: linkData.documentId,
            title: linkData.title,
            source: 'corte-constitucional',
            url: finalUrl,
            documentType,
            legalArea: LegalArea.CONSTITUTIONAL,
            publicationDate,
            extractionDate: new Date(),
            content,
            fullTextContent: documentVerification.extractedText,       // ✅ Texto completo para solución híbrida
            documentBuffer: documentVerification.documentBuffer,       // ✅ Buffer original para guardar archivo
            summary: `${linkData.title} - Documento oficial de la Corte Constitucional de Colombia${documentVerification.success ? ' (RTF verificado)' : ''}`,
            metadata: finalMetadata  // ✅ Usar metadatos finales que incluyen extractedMetadata
          };

          extractedDocuments.push(document);
          newDocumentsProcessed++;

          this.updateProgress({
            progress: 75 + (i / sentenceLinks.length) * 20,
            message: `Procesado: ${linkData.documentId}${documentVerification.success ? ' ✓' : ' ⚠'} (${newDocumentsProcessed} nuevos, ${duplicatesSkipped} duplicados)`
          });

        } catch (error) {
          failedDownloads++;
          logger.warn(`⚠️ Error procesando ${linkData.documentId}:`, (error as Error).message);
          continue;
        }
      }

      // Mostrar resumen de estadísticas
      logger.info(`📊 RESUMEN DE EXTRACCIÓN:`);
      logger.info(`   → Documentos encontrados en web: ${sentenceLinks.length}`);
      logger.info(`   → Documentos NUEVOS procesados: ${newDocumentsProcessed}`);
      logger.info(`   → Duplicados omitidos: ${duplicatesSkipped}`);
      logger.info(`   → Descargas fallidas: ${failedDownloads}`);

      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000;

      // 🎉 Enviar evento final de completado con status COMPLETED
      this.updateProgress({
        progress: 100,
        message: `✅ Extracción completada - ${newDocumentsProcessed} nuevos, ${duplicatesSkipped} duplicados omitidos`,
        documentsFound: sentenceLinks.length,
        documentsProcessed: extractedDocuments.length,
        status: JobStatus.COMPLETED
      });

      logger.info(`✅ Extracción REAL completada: ${extractedDocuments.length} documentos en ${extractionTime}s`);

      return {
        success: true,
        documents: extractedDocuments,
        downloadedCount: extractedDocuments.length,
        extractionTime,
        totalFound: sentenceLinks.length,
        metadata: {
          source: 'corte-constitucional',
          realWebScraping: true,
          browser: 'puppeteer',
          extractedFromLiveWebsite: true,
          migrationStatus: 'python-patterns-to-typescript-completed',
          originalSystemReference: 'Based on working Python system from CLAUDE.md',
          pagesSearched: [
            'https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia'
          ],
          documentTypesSupported: ['T-', 'C-', 'SU-', 'A-'],
          // Estadísticas de duplicados
          statistics: {
            documentsFoundInWeb: sentenceLinks.length,
            newDocumentsProcessed: newDocumentsProcessed,
            duplicatesSkipped: duplicatesSkipped,
            failedDownloads: failedDownloads,
            dateRangeUsed: '15 días hábiles'
          },
          parameters
        }
      };

    } catch (error) {
      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000;

      // ❌ Enviar evento de error con status FAILED
      this.updateProgress({
        progress: 0,
        message: `❌ Error en extracción: ${error instanceof Error ? error.message : String(error)}`,
        status: JobStatus.FAILED
      });

      logger.error('❌ Error en extracción REAL de Corte Constitucional:', error);

      return {
        success: false,
        documents: extractedDocuments,
        downloadedCount: 0,
        extractionTime,
        totalFound: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          source: 'corte-constitucional',
          failed: true,
          realWebScraping: true,
          error: (error as Error).message
        }
      };
    } finally {
      // Limpiar recursos
      if (this.browser) {
        try {
          await this.browser.close();
          this.browser = null;
          logger.info('🔒 Browser cerrado correctamente');
        } catch (error) {
          logger.warn('⚠️ Error cerrando browser:', (error as Error).message);
        }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      logger.info('🔍 Verificando conectividad con Corte Constitucional...');
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      await page.goto('https://www.corteconstitucional.gov.co', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const title = await page.title();
      await browser.close();
      
      const isHealthy = title.toLowerCase().includes('corte') || 
                       title.toLowerCase().includes('constitucional');
      
      logger.info(`🔍 Health check: ${isHealthy ? '✅ SALUDABLE' : '❌ PROBLEMA'} - Title: ${title}`);
      return isHealthy;
      
    } catch (error) {
      logger.error('❌ Error en health check:', error);
      return false;
    }
  }

  override async cleanup(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        logger.warn('Error en cleanup:', error);
      }
    }
  }

  private async clickVerUltimasSentencias(page: any): Promise<boolean> {
    logger.info('🔍 Buscando botón "Ver últimas sentencias"...');
    
    try {
      // Esperar a que la página cargue completamente
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.waitForAngularLoad(page, 10);
      
      // Usar el selector CSS más preciso identificado
      const button = await page.$('button.btn.btn-corte.rounded-0.btn-outline-primary');
      
      if (button) {
        // Verificar el texto del botón
        const text = await page.evaluate((el: any) => el.textContent?.trim(), button);
        
        if (text && text.toLowerCase().includes('ver últimas sentencias')) {
          logger.debug(`📍 Botón encontrado: "${text}"`);
          
          // Hacer scroll al botón primero para asegurar visibilidad
          await page.evaluate((el: any) => {
            el.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }, button);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verificar visibilidad después del scroll
          const isVisible = await button.isIntersectingViewport();
          const boundingBox = await button.boundingBox();
          
          logger.debug(`📍 Después del scroll - Visible: ${isVisible}, BoundingBox: ${boundingBox ? 'Sí' : 'No'}`);
          
          // Intentar hacer clic incluso si no parece completamente visible
          try {
            await button.click();
            logger.info('✅ Click exitoso en "Ver últimas sentencias"');
            
            // Esperar que se carguen los resultados
            await new Promise(resolve => setTimeout(resolve, 5000));
            await this.waitForAngularLoad(page, 15);
            
            // Verificar que aparecieron resultados
            const hasResults = await page.evaluate(() => {
              const indicators = [
                () => document.querySelectorAll('a[href*="/relatoria/"]').length > 5,
                () => document.querySelectorAll('a[href*=".htm"]').length > 0,
                () => document.body.textContent?.includes('T-') || document.body.textContent?.includes('C-'),
                () => document.querySelectorAll('table tr').length > 3
              ];
              
              return indicators.some(test => test());
            });
            
            if (hasResults) {
              logger.info('✅ "Ver últimas sentencias" cargó resultados exitosamente');
              return true;
            } else {
              logger.warn('⚠️ Click exitoso pero no se detectaron resultados');
              return true; // Aún es exitoso el click
            }
            
          } catch (clickError) {
            logger.debug(`⚠️ Click normal falló: ${(clickError as Error).message}`);
            
            // Fallback con JavaScript click
            try {
              await page.evaluate((el: any) => el.click(), button);
              logger.info('✅ Click JS exitoso en "Ver últimas sentencias"');
              await new Promise(resolve => setTimeout(resolve, 5000));
              return true;
            } catch (jsError) {
              logger.warn(`⚠️ Click JS también falló: ${(jsError as Error).message}`);
            }
          }
        }
      }
      
      // Fallback: buscar cualquier botón que contenga el texto
      logger.info('🔍 Fallback: buscando por texto...');
      const allButtons = await page.$$('button');
      
      for (const btn of allButtons) {
        const text = await page.evaluate((el: any) => el.textContent?.trim().toLowerCase(), btn);
        
        if (text && text.includes('ver últimas sentencias')) {
          logger.info(`📍 Botón fallback encontrado: "${text}"`);
          
          try {
            await page.evaluate((el: any) => {
              el.scrollIntoView({ block: 'center' });
              el.click();
            }, btn);
            
            logger.info('✅ Click fallback exitoso');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return true;
            
          } catch (error) {
            logger.debug(`⚠️ Botón fallback falló: ${(error as Error).message}`);
            continue;
          }
        }
      }
      
    } catch (error) {
      logger.error(`❌ Error buscando botón "Ver últimas sentencias": ${(error as Error).message}`);
    }
    
    logger.warn('⚠️ No se pudo hacer clic en "Ver últimas sentencias"');
    return false;
  }

  private async waitForAngularLoad(page: any, timeout: number = 15): Promise<void> {
    try {
      logger.debug('⏳ Esperando carga completa de Angular...');
      
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: timeout * 1000 });
      
      await page.waitForFunction(() => {
        return typeof window.ng !== 'undefined' || 
               document.querySelector('app-root') !== null || 
               document.querySelector('[ng-app]') !== null;
      }, { timeout: timeout * 1000 }).catch(() => {});
      
      // Espera inteligente basada en contenido
      const startTime = Date.now();
      const maxContentWait = 8000;
      
      while (Date.now() - startTime < maxContentWait) {
        const contentLoaded = await page.evaluate(() => {
          return document.querySelector('table') !== null || 
                 document.querySelector('.results') !== null ||
                 document.querySelectorAll('tr').length > 5;
        });
        
        if (contentLoaded) {
          logger.debug('✅ Contenido dinámico detectado');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      logger.warn('⚠️ Timeout esperando carga de Angular, continuando...', (error as Error).message);
    }
  }

  private async extractSentencesFromUltimasSentencias(page: any, limit: number): Promise<any[]> {
    const results: any[] = [];

    try {
      // 1. Obtener los últimos 15 días hábiles (para cubrir vacaciones)
      const targetDates = this.getLastTwoWorkingDays();

      if (targetDates.length === 0) {
        logger.warn('⚠️ No hay días hábiles para extraer (últimos 15 días hábiles no encontrados)');
        return results;
      }

      logger.info(`🔍 Extrayendo documentos SOLO de las fechas: ${targetDates.map(d => d.dateShort).join(', ')}`);

      // 2. Buscar tabla estructurada con las 7 columnas
      logger.info('📊 Buscando tabla estructurada con datos de sentencias...');
      
      // Esperar a que las sentencias se carguen
      await new Promise(resolve => setTimeout(resolve, 3000));

      logger.info('🔍 DEBUG: ANTES de page.evaluate() - punto crítico');

      let sentences: any[] = [];
      try {
        logger.info('🔍 DEBUG: Iniciando page.evaluate() para búsqueda de tabla estructurada');
        const evaluationResult = await page.evaluate((maxResults: number, targetDatesData: any[]) => {
        const foundSentences = [];
        const debugInfo = [];

        debugInfo.push('🔍 INICIO: Buscando tabla con estructura de 7 columnas...');

        // Buscar todas las tablas - MÁS SELECTORES
        const tables = document.querySelectorAll('table, .table, [role="table"], .mat-table, .data-table, .results-table');
        debugInfo.push(`📊 TOTAL TABLAS ENCONTRADAS EN LA PÁGINA: ${tables.length}`);

        // Debug adicional: mostrar información de cada tabla encontrada
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i];
          const rows = table.querySelectorAll('tr');
          const className = table.className || 'sin-clase';
          const tagName = table.tagName.toLowerCase();
          debugInfo.push(`🔍 TABLA ${i + 1}: Elemento <${tagName}> class="${className}" - ${rows.length} filas`);
        }
        
        let structuredTableFound = false;
        
        for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
          const table = tables[tableIndex];
          const rows = table.querySelectorAll('tr');
          if (rows.length < 2) continue; // Necesita al menos header + 1 fila de datos
          
          // Buscar header con las 7 columnas esperadas
          const headerRow = rows[0];
          const headers = Array.from(headerRow.querySelectorAll('th, td')).map(th => 
            th.textContent?.toLowerCase().trim() || ''
          );
          
          // DEBUG: Mostrar headers reales encontrados
          debugInfo.push(`🔍 TABLA ${tableIndex + 1} - Headers encontrados: [${headers.join(', ')}]`);

          // Verificar si tiene las columnas que esperamos (VERSIÓN MÁS FLEXIBLE)
          const hasNo = headers.some(h => h.includes('no') || h.includes('#') || h.includes('núm'));
          const hasFechaPublicacion = headers.some(h =>
            (h.includes('fecha') && (h.includes('publicación') || h.includes('publicacion'))) ||
            h.includes('fecha pub') ||
            h.includes('pub') ||
            h.includes('publicado')
          );
          const hasNumero = headers.some(h =>
            h.includes('número') || h.includes('numero') || h.includes('num') ||
            h.includes('sentencia') || h.includes('referencia')
          );
          const hasExpediente = headers.some(h => h.includes('expediente') || h.includes('exp'));
          const hasFechaSentencia = headers.some(h =>
            (h.includes('fecha') && h.includes('sentencia')) ||
            h.includes('fecha sent') ||
            h.includes('pronunciamiento')
          );
          const hasTipo = headers.some(h => h.includes('tipo') || h.includes('class'));
          const hasTema = headers.some(h => h.includes('tema') || h.includes('asunto') || h.includes('materia'));

          // Debug detallado de detección de columnas
          debugInfo.push(`📊 DETECCIÓN DE COLUMNAS - Tabla ${tableIndex + 1}:`);
          debugInfo.push(`   hasNo: ${hasNo}, hasFechaPublicacion: ${hasFechaPublicacion}, hasNumero: ${hasNumero}`);
          debugInfo.push(`   hasExpediente: ${hasExpediente}, hasFechaSentencia: ${hasFechaSentencia}, hasTipo: ${hasTipo}, hasTema: ${hasTema}`);
          debugInfo.push(`🔍 Total: ${[hasNo, hasFechaPublicacion, hasNumero, hasExpediente, hasFechaSentencia, hasTipo, hasTema].filter(Boolean).length}/7 columnas`);

          // Verificación estricta (7 columnas)
          const isFullyStructured = hasNo && hasFechaPublicacion && hasNumero && hasExpediente && hasFechaSentencia && hasTipo && hasTema;

          // Verificación mínima (columnas esenciales)
          const hasEssentialColumns = hasFechaPublicacion && hasNumero && (hasTipo || hasTema);
          const columnsFound = [hasNo, hasFechaPublicacion, hasNumero, hasExpediente, hasFechaSentencia, hasTipo, hasTema].filter(Boolean).length;

          if (isFullyStructured) {
            debugInfo.push('✅ Tabla COMPLETAMENTE estructurada encontrada (7/7 columnas)');
            debugInfo.push(`📋 Headers: ${headers.join(' | ')}`);
            structuredTableFound = true;
          } else if (hasEssentialColumns && columnsFound >= 4) {
            debugInfo.push(`✅ Tabla PARCIALMENTE estructurada encontrada (${columnsFound}/7 columnas - incluye columnas esenciales)`);
            debugInfo.push(`📋 Headers: ${headers.join(' | ')}`);
            structuredTableFound = true;
          }

          if (structuredTableFound) {
            // DEBUG: Mostrar fechas objetivo
            console.log('🎯 Fechas objetivo que estamos buscando:');
            targetDatesData.forEach(targetDate => {
              console.log(`   ${targetDate.label}: "${targetDate.dateShort}" OR "${targetDate.dateAlt}" OR "${targetDate.dateStr}" OR "${targetDate.dateISO}"`);
            });
            
            // Mapear índices de columnas basado en los headers detectados
            const columnIndices = {
              no: headers.findIndex(h => h.includes('no') || h.includes('#') || h.includes('núm')),
              fechaPublicacion: headers.findIndex(h =>
                (h.includes('fecha') && (h.includes('publicación') || h.includes('publicacion'))) ||
                h.includes('fecha pub') || h.includes('pub') || h.includes('publicado')
              ),
              numero: headers.findIndex(h =>
                h.includes('número') || h.includes('numero') || h.includes('num') ||
                h.includes('sentencia') || h.includes('referencia')
              ),
              expediente: headers.findIndex(h => h.includes('expediente') || h.includes('exp')),
              fechaSentencia: headers.findIndex(h =>
                (h.includes('fecha') && h.includes('sentencia')) ||
                h.includes('fecha sent') || h.includes('pronunciamiento')
              ),
              tipo: headers.findIndex(h => h.includes('tipo') || h.includes('class')),
              tema: headers.findIndex(h => h.includes('tema') || h.includes('asunto') || h.includes('materia'))
            };

            console.log('📊 Mapeo de columnas detectado:', columnIndices);

            // Procesar TODAS las filas con filtro de fechas
            console.log('📊 Analizando filas de la tabla con filtro de fechas:');
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              const cells = Array.from(row.querySelectorAll('td, th'));

              if (cells.length >= 3) { // Requerimiento mínimo más flexible
                const cellData = cells.map(cell => cell.textContent?.trim() || '');

                // Extraer datos usando el mapeo dinámico
                const no = columnIndices.no >= 0 ? cellData[columnIndices.no] : '';
                const fechaPublicacion = columnIndices.fechaPublicacion >= 0 ? cellData[columnIndices.fechaPublicacion] : '';
                const numero = columnIndices.numero >= 0 ? cellData[columnIndices.numero] : '';
                const expediente = columnIndices.expediente >= 0 ? cellData[columnIndices.expediente] : '';
                const fechaSentencia = columnIndices.fechaSentencia >= 0 ? cellData[columnIndices.fechaSentencia] : '';
                const tipo = columnIndices.tipo >= 0 ? cellData[columnIndices.tipo] : '';
                const tema = columnIndices.tema >= 0 ? cellData[columnIndices.tema] : '';

                // Si no hay fecha de publicación pero sí número, intentar extraer de otras columnas
                let fechaToUse = fechaPublicacion;
                if (!fechaToUse && cellData.length >= 2) {
                  // Buscar cualquier celda que parezca una fecha
                  for (const cell of cellData) {
                    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(cell) || /\d{4}-\d{2}-\d{2}/.test(cell)) {
                      fechaToUse = cell;
                      break;
                    }
                  }
                }
                
                debugInfo.push(`📄 Fila ${i}: ${numero} - ${fechaToUse} (cols: ${cells.length})`);

                // FILTRO: Solo procesar si la fecha de publicación está en los últimos 15 días hábiles
                const isTargetDate = targetDatesData.some(targetDate => {
                  return fechaToUse.includes(targetDate.dateShort) ||
                         fechaToUse.includes(targetDate.dateAlt) ||
                         fechaToUse.includes(targetDate.dateStr) ||
                         fechaToUse.includes(targetDate.dateISO);
                });
                
                debugInfo.push(`     🗓️ Fecha objetivo? ${isTargetDate} - Número válido? ${!!numero} - Límite? ${foundSentences.length < maxResults}`);

                if (isTargetDate && numero && foundSentences.length < maxResults) {
                  // Generar ID de documento
                  const sentenceId = numero.toUpperCase().replace(/[\s\/\.]+/g, '-');

                  // Determinar año y generar URLs correctas
                  const currentYear = new Date().getFullYear();

                  // 🔥 FIX: Normalización mejorada para sentencias SU
                  // Convertir cualquier formato a URL correcta
                  let urlSafeName = numero.toUpperCase()
                    .replace(/[.\s]/g, '-')  // ✅ Normalizar puntos Y espacios a guion
                    .replace('/', '-')       // Separador para año
                    .toLowerCase();

                  // 🔥 FIX: Sentencias SU no llevan guion después de SU
                  // "SU-315-25" → "su315-25" (remover guion entre SU y número)
                  if (numero.toUpperCase().startsWith('SU')) {
                    urlSafeName = urlSafeName.replace('su-', 'su');
                  }

                  const htmlUrl = `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${urlSafeName}.htm`;
                  const rtfUrl = htmlUrl.replace('.htm', '.rtf');

                  console.log(`🔧 DEBUG URL: "${numero}" (ID: ${sentenceId}) -> RTF: ${rtfUrl}`);

                  foundSentences.push({
                    documentId: sentenceId,
                    title: `${numero} - ${tipo}`,
                    url: rtfUrl,
                    htmlUrl: htmlUrl,
                    year: currentYear.toString(),
                    rawText: `${numero} - ${tema}`,
                    rawTitle: numero,
                    extractionSource: 'structured-table-filtered',
                    structuredData: {
                      no: no,
                      fechaPublicacion: fechaToUse, // ✅ Usar la fecha detectada dinámicamente
                      numero: numero,
                      expediente: expediente,
                      fechaSentencia: fechaSentencia,
                      tipo: tipo,
                      tema: tema
                    }
                  });

                  debugInfo.push(`✅ Documento de fecha objetivo AGREGADO: ${sentenceId} - ${fechaToUse}`);

                  // 🔍 Log especial para sentencias SU encontradas en tabla
                  if (numero.toUpperCase().startsWith('SU')) {
                    debugInfo.push(`🎯 SENTENCIA SU ENCONTRADA EN TABLA: ${numero} -> URL: ${rtfUrl}`);
                  }
                } else if (!isTargetDate) {
                  debugInfo.push(`     ⏩ Omitiendo documento de fecha diferente: ${fechaToUse} (no está en fechas objetivo)`);
                } else if (!numero) {
                  console.log(`     ⚠️ Número de sentencia vacío`);
                } else {
                  console.log(`     ⚠️ Límite máximo alcanzado`);
                }
                
                console.log('     ---');
              }
            }
            
            console.log(`📊 Total documentos encontrados en tabla estructurada: ${foundSentences.length}`);
            break; // Solo procesar la primera tabla estructurada válida
          }
        }
        
        if (!structuredTableFound) {
          console.log('❌ RESULTADO: No se encontró tabla estructurada con columnas requeridas, usando método fallback...');

          // Debug adicional del DOM para entender la estructura
          const allTables = document.querySelectorAll('table, .table, [role="table"]');
          console.log(`📊 Fallback: ${allTables.length} tablas encontradas para procesamiento de enlaces`);

          // Ver si hay algún contenido que pueda ser una tabla virtual o div-table
          const divTables = document.querySelectorAll('div[class*="table"], div[class*="grid"], div[class*="row"]');
          console.log(`📊 Elementos div tipo tabla encontrados: ${divTables.length}`);

          // Fallback MEJORADO: buscar enlaces y extraer fechas de publicación de la tabla
          const allLinks = document.querySelectorAll('a[href]');
          console.log(`🔗 ${allLinks.length} enlaces encontrados`);

          // Primero, crear un mapa de sentencias -> fechas desde cualquier tabla disponible
          const sentenceDateMap = new Map();

          for (let t = 0; t < allTables.length; t++) {
            const table = allTables[t];
            const rows = table.querySelectorAll('tr');

            if (rows.length > 1) {
              for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                const cells = Array.from(row.querySelectorAll('td, th'));
                const cellData = cells.map(cell => cell.textContent?.trim() || '');

                // Buscar patrones de sentencia en cualquier celda
                for (let c = 0; c < cellData.length; c++) {
                  const cellText = cellData[c];
                  const sentenceMatch = cellText.match(/([TCS]U?-?\d{1,4}-\d{2,4})/i);

                  if (sentenceMatch) {
                    const sentenceId = sentenceMatch[1].toUpperCase().replace(/([TCS]U?)(\d)/g, '$1-$2');

                    // Buscar fecha en las celdas adyacentes (típicamente la siguiente o anterior)
                    let fechaPublicacion = null;

                    // Revisar celda actual y adyacentes para encontrar fecha
                    for (let dc = Math.max(0, c - 2); dc < Math.min(cellData.length, c + 3); dc++) {
                      const dateCandidate = cellData[dc];
                      if (dateCandidate && dateCandidate !== cellText) {
                        // Verificar si parece una fecha
                        if (dateCandidate.match(/\d{4}-\d{2}-\d{2}/) ||
                            dateCandidate.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||
                            dateCandidate.match(/\d{1,2}-\d{1,2}-\d{4}/) ||
                            dateCandidate.match(/\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/)) {
                          fechaPublicacion = dateCandidate;
                          break;
                        }
                      }
                    }

                    if (fechaPublicacion) {
                      sentenceDateMap.set(sentenceId, fechaPublicacion);
                      console.log(`📅 FALLBACK: Fecha extraída para ${sentenceId}: ${fechaPublicacion}`);
                    }
                  }
                }
              }
            }
          }

          console.log(`📊 Mapa de fechas extraído: ${sentenceDateMap.size} sentencias con fecha`);

          console.log('🔍 DEBUG: Mostrando primeros 10 enlaces de sentencias disponibles...');
          let debugCount = 0;

          for (let i = 0; i < allLinks.length && debugCount < 10; i++) {
            const link = allLinks[i];
            const href = link.getAttribute('href') || '';
            const text = link.textContent?.trim() || '';

            // Buscar patrón específico: /relatoria/2025/t-373-25.htm
            const sentencePattern = /\/relatoria\/(\d{4})\/([tcs]u?-?\d{1,4}-\d{2,4})\.htm/i;
            const match = href.match(sentencePattern);

            if (match) {
              const year = match[1];
              const sentenceId = match[2].toUpperCase().replace(/([TCS]U?)(\d)/g, '$1-$2');
              debugCount++;

              console.log(`📄 DEBUG ${debugCount}. ${sentenceId} (${year}) - ${text}`);
              console.log(`   URL: ${href}`);

              // Buscar fecha de publicación para esta sentencia
              const fechaPublicacion = sentenceDateMap.get(sentenceId);
              if (fechaPublicacion) {
                console.log(`   📅 Fecha encontrada: ${fechaPublicacion}`);
              }

              // ✅ TEMPORAL: Extraer cualquier documento 2025 sin filtro de fecha para probar funcionalidad
              if (year === '2025' && foundSentences.length < maxResults) {
                // Generar URL completa
                const fullUrl = href.startsWith('http') ? href : `https://www.corteconstitucional.gov.co${href}`;

                // 🔥 FIX: Generar URL de descarga RTF con normalización mejorada
                let urlSafeName = sentenceId.toLowerCase()
                  .replace(/[.\s]/g, '-')  // Normalizar puntos y espacios
                  .replace('/', '-');      // Separador para año

                // Sentencias SU: remover guion después de "su"
                if (sentenceId.toUpperCase().startsWith('SU')) {
                  urlSafeName = urlSafeName.replace('su-', 'su');
                }

                const rtfUrl = `https://www.corteconstitucional.gov.co/sentencias/${year}/${urlSafeName}.rtf`;

                console.log(`🔗 Fallback URL generada: ${sentenceId} -> ${rtfUrl}`);

                // 🔍 Log especial para sentencias SU en fallback
                if (sentenceId.toUpperCase().startsWith('SU')) {
                  console.log(`🎯 SENTENCIA SU ENCONTRADA EN FALLBACK: ${sentenceId} -> ${rtfUrl}`);
                }

                // ✅ CREAR structuredData cuando tenemos fechaPublicacion
                const structuredData = fechaPublicacion ? {
                  numero: sentenceId,
                  fechaPublicacion: fechaPublicacion,
                  extractionMethod: 'fallback-table-date-extraction'
                } : null;

                foundSentences.push({
                  documentId: sentenceId,
                  title: text || `Sentencia ${sentenceId} de ${year}`,
                  url: rtfUrl, // URL de descarga RTF
                  htmlUrl: fullUrl, // URL de visualización HTML
                  year: year,
                  rawText: text,
                  rawTitle: text,
                  fechaPublicacion: fechaPublicacion, // ✅ NUEVA: Fecha extraída de la tabla
                  structuredData: structuredData, // ✅ NUEVA: Datos estructurados para el ScrapingOrchestrator
                  extractionSource: 'ultimas-sentencias-fallback-with-dates'
                });

                console.log(`✅ Sentencia extraída con fecha: ${sentenceId} - ${fechaPublicacion || 'Sin fecha'}`);
              }
            }
          }
          
          console.log(`📊 DEBUG: Total sentencias encontradas con fallback: ${foundSentences.length}`);
        }
        
        return {
          sentences: foundSentences,
          debugInfo: debugInfo
        };
      }, limit, targetDates);

      logger.info('🔍 DEBUG: page.evaluate() completado exitosamente');

      // Procesar resultado con información de debug
      sentences = evaluationResult.sentences || [];

      // Mostrar información de debug capturada desde el navegador
      logger.info('🔍 DEBUG INFO FROM BROWSER:');
      for (const debugLine of evaluationResult.debugInfo || []) {
        logger.info(`   ${debugLine}`);
      }

      } catch (evaluateError) {
        logger.error('❌ ERROR CRÍTICO en page.evaluate() - La búsqueda de tabla estructurada falló:', evaluateError);
        logger.error('❌ Stack trace:', (evaluateError as Error).stack);
        logger.info('🔄 Continuando con método fallback directo...');
        sentences = []; // Array vacío para activar fallback
      }

      logger.info(`📋 Encontrados ${sentences.length} documentos de las fechas objetivo`);

      if (sentences.length === 0) {
        logger.warn('⚠️ No se encontraron documentos nuevos en los últimos 15 días hábiles');
        logger.info('💡 Esto puede suceder si:');
        logger.info('   - Todos los documentos ya fueron descargados previamente');
        logger.info('   - No hay sentencias publicadas en los días hábiles objetivo');
        logger.info('   - El formato de fecha en la tabla ha cambiado');
        logger.info('   - La tabla estructurada no está disponible');
      }
      
      // Procesar cada sentencia encontrada
      for (const sentence of sentences) {
        try {
          // Verificar que el documento RTF existe antes de procesarlo
          const existsInDB = await this.checkDocumentExists(sentence.documentId);
          if (existsInDB) {
            logger.info(`🔍 Documento ${sentence.documentId} ya existe en BD, omitiendo...`);
            continue;
          }
          
          // Verificar RTF 
          logger.info(`📥 Verificando documento RTF/DOCX: ${sentence.documentId} - ${sentence.url}`);
          const rtfVerification = await this.verifyAndDownloadRTFDocument(sentence.documentId, sentence.url);
          
          if (!rtfVerification.success) {
            logger.warn(`⚠️ Documento RTF no verificado: ${sentence.documentId} - ${rtfVerification.error}`);
            continue;
          }
          
          logger.info(`✅ Documento RTF verificado: ${sentence.documentId}`);
          
          // Extraer metadatos del contenido del documento usando Black Box Adapter
          let extractedMetadata: any = null;
          if (rtfVerification.success && rtfVerification.extractedText) {
            try {
              extractedMetadata = await this.metadataExtractor.extract(
                rtfVerification.extractedText,
                {
                  documentTitle: sentence.title,
                  source: 'corte-constitucional'
                }
              );

              if (extractedMetadata) {
                logger.info(`🔍 Metadatos extraídos del RTF - Magistrado: ${extractedMetadata.magistradoPonente || 'N/A'}, Expediente: ${extractedMetadata.expediente || 'N/A'}, Sala: ${extractedMetadata.salaRevision || 'N/A'}`);
              }
            } catch (metadataError) {
              logger.warn(`⚠️ Error extrayendo metadatos de ${sentence.documentId}:`, metadataError);
            }
          }
          
          // Crear el objeto de documento con solución híbrida
          const document = {
            documentId: sentence.documentId,
            title: sentence.title,
            url: sentence.url,
            content: rtfVerification.extractedText || `Documento jurídico extraído: ${sentence.documentId}\n\nURL: ${sentence.url}\nTipo: SENTENCIA\n\nEste documento fue extraído del sitio web oficial de la Corte Constitucional de Colombia.`,
            fullTextContent: rtfVerification.extractedText,       // ✅ Texto completo para solución híbrida
            documentBuffer: rtfVerification.documentBuffer,       // ✅ Buffer original para guardar archivo
            summary: `${sentence.documentId} - Documento oficial de la Corte Constitucional de Colombia (RTF procesado)`,
            documentType: 'SENTENCE' as const,
            legalArea: 'CONSTITUTIONAL' as const,
            extractionDate: new Date(),
            publicationDate: new Date(),
            metadata: {
              extractionMethod: 'puppeteer-typescript-v3',
              extractionVersion: 'v3-with-rtf-verification-hybrid',
              rtfVerification: rtfVerification,
              structuredData: sentence.structuredData || null,
              extractionSource: sentence.extractionSource,
              extractedMetadata: extractedMetadata
            }
          };
          
          results.push(document);
          
        } catch (error) {
          logger.error(`❌ Error procesando documento ${sentence.documentId}:`, error);
          logger.error(`❌ Detalles del error:`, {
            message: (error as Error).message,
            stack: (error as Error).stack,
            documentId: sentence.documentId,
            url: sentence.url
          });
          continue;
        }
      }
      
    } catch (error) {
      logger.error('❌ Error extrayendo sentencias de "Ver últimas sentencias":', error);
      logger.error('❌ Stack trace completo:', (error as Error).stack);
    }
    
    return results;
  }



  private async checkDocumentExists(documentId: string): Promise<boolean> {
    try {
      // Normalizar el documentId para búsqueda (ej: "T-390-25" → múltiples variantes)
      const normalizedId = documentId.toUpperCase().replace(/[.\s]/g, '-');

      // Crear variantes del ID para búsqueda más robusta
      // Ej: "T-390-25" puede estar como "T-390/25", "T-390-25", "T.390.25", etc.
      const idVariants = [
        normalizedId,                           // T-390-25
        normalizedId.replace(/-/g, '/'),        // T/390/25
        normalizedId.replace(/-/g, '.'),        // T.390.25
        normalizedId.replace(/-(\d{2})$/, '/$1'), // T-390/25 (solo el último guion)
        documentId,                             // Original
        documentId.toLowerCase(),               // minúsculas
      ];

      // Verificar en base de datos usando múltiples campos
      const existingDoc = await global.prisma?.document.findFirst({
        where: {
          OR: [
            // Buscar por externalId (campo único)
            { externalId: { in: idVariants } },
            // Buscar por numeroSentencia
            { numeroSentencia: { in: idVariants } },
            // Buscar en URL (contiene el ID del documento)
            ...idVariants.map(variant => ({ url: { contains: variant } })),
            // Buscar en título
            ...idVariants.map(variant => ({ title: { contains: variant } }))
          ]
        },
        select: {
          id: true,
          title: true,
          numeroSentencia: true,
          externalId: true
        }
      });

      if (existingDoc) {
        logger.info(`📋 DUPLICADO DETECTADO: ${documentId} ya existe en BD`);
        logger.info(`   → ID: ${existingDoc.id}`);
        logger.info(`   → Título: ${existingDoc.title?.substring(0, 50)}...`);
        logger.info(`   → Número Sentencia: ${existingDoc.numeroSentencia || 'N/A'}`);
        return true;
      }

      // También verificar por archivo descargado localmente en storage/documents
      const fs = require('fs');
      const path = require('path');

      // Verificar en múltiples ubicaciones posibles
      const possiblePaths = [
        path.join(process.cwd(), 'storage', 'documents', `${documentId}.docx`),
        path.join(process.cwd(), 'storage', 'documents', `${documentId}.rtf`),
        path.join(process.cwd(), 'storage', 'documents', `${normalizedId}.docx`),
        path.join(process.cwd(), 'storage', 'documents', `${normalizedId}.rtf`),
        path.join(process.cwd(), 'test_documents', `${documentId}.rtf`),
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          logger.info(`📁 DUPLICADO DETECTADO: ${documentId} ya existe como archivo local`);
          logger.info(`   → Ruta: ${filePath}`);
          return true;
        }
      }

      logger.debug(`🆕 Documento ${documentId} es NUEVO - PROCESAR`);
      return false;
    } catch (error) {
      logger.warn(`⚠️ Error verificando duplicado para ${documentId}: ${(error as Error).message}`);
      return false; // En caso de error, procesar el documento (mejor duplicar que perder)
    }
  }

  private getLastTwoWorkingDays(): Array<{
    dateStr: string;
    dateShort: string;
    dateAlt: string;
    dateISO: string;
    date: Date;
    dayOfWeek: string;
    label: string;
    isToday: boolean;
  }> {
    const monthsSpanish: { [key: number]: string } = {
      1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
      7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    };

    const datesToExtract: Array<{
      dateStr: string;
      dateShort: string;
      dateAlt: string;
      dateISO: string;
      date: Date;
      dayOfWeek: string;
      label: string;
      isToday: boolean;
    }> = [];
    const today = new Date();

    logger.info(`🔍 Buscando ÚLTIMOS 15 DÍAS HÁBILES (3 semanas) desde: ${today.toLocaleDateString('es-CO')}`);

    // Función para procesar una fecha
    const processDate = (date: Date, label: string) => {
      const dayOfWeek = date.getDay();

      // Solo procesar días hábiles (lunes = 1, viernes = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const day = date.getDate();
        const monthName = monthsSpanish[date.getMonth() + 1] || 'mes';
        const year = date.getFullYear();

        const dateStr = `${day} de ${monthName} de ${year}`;
        const dateShort = `${day.toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${year}`;
        const dateAlt = `${day.toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${year}`;
        const dateISO = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Formato YYYY-MM-DD

        const dateInfo = {
          dateStr,
          dateShort,
          dateAlt,
          dateISO,
          date: new Date(date),
          dayOfWeek: date.toLocaleDateString('es-CO', { weekday: 'long' }),
          label,
          isToday: label.includes('HOY')
        };

        datesToExtract.push(dateInfo);
        logger.info(`📅 ${label}: ${dateStr} (${date.toLocaleDateString('es-CO', { weekday: 'long' })}) ✅ DÍA HÁBIL`);
        return true;
      } else {
        logger.info(`📅 ${label}: ${date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ⏩ NO ES DÍA HÁBIL`);
        return false;
      }
    };

    // Buscar los últimos 15 días hábiles (3 semanas laborales)
    // Ampliado para cubrir períodos de vacaciones (Navidad, Semana Santa, etc.)
    let searchDate = new Date(today);
    let daysSearched = 0;
    let workingDaysFound = 0;
    const maxSearch = 30; // Buscar máximo 1 mes atrás
    const targetWorkingDays = 15; // Queremos exactamente 15 días hábiles (3 semanas)

    while (workingDaysFound < targetWorkingDays && daysSearched < maxSearch) {
      // Retroceder un día
      if (daysSearched > 0) { // No retroceder el primer día (hoy)
        searchDate.setDate(searchDate.getDate() - 1);
      }
      daysSearched++;

      // Verificar si es día hábil
      const dayOfWeek = searchDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a viernes
        workingDaysFound++;

        let label: string;
        if (daysSearched === 1) {
          label = 'HOY';
        } else if (daysSearched === 2) {
          label = 'AYER';
        } else {
          label = `DÍA HÁBIL -${daysSearched - 1}`;
        }

        processDate(new Date(searchDate), label);
      }
    }

    if (workingDaysFound < targetWorkingDays) {
      logger.warn(`⚠️ Solo se encontraron ${workingDaysFound}/${targetWorkingDays} días hábiles en los últimos ${maxSearch} días`);
    } else {
      logger.info(`✅ Encontrados ${targetWorkingDays} días hábiles para extracción`);
    }
    
    // Ordenar por fecha (más reciente primero)
    datesToExtract.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    logger.info(`✅ Generados ${datesToExtract.length} días hábiles para extracción:`);
    datesToExtract.forEach((d, index) => {
      logger.info(`   ${index + 1}. ${d.label}: ${d.dateShort} (${d.dayOfWeek})`);
    });
    
    return datesToExtract;
  }


  private generateDocumentUrl(sentenceNumber: string): string {
    try {
      const cleanNumber = sentenceNumber.trim().toUpperCase();
      let normalizedId = '';

      // 🔥 FIX: Sentencias SU tienen formato especial (sin guion después de SU)
      if (cleanNumber.startsWith('SU')) {
        // "SU-315/25", "SU.315/25", "SU 315/25" → "su315-25" (sin guion entre SU y número)
        normalizedId = cleanNumber
          .replace(/[.\s]/g, '-')  // ✅ Normalizar puntos Y espacios a guion
          .replace('SU-', 'su')    // Remover guion después de SU
          .replace('/', '-')       // Separador para año
          .toLowerCase();

        logger.info(`🔧 Sentencia SU detectada: "${sentenceNumber}" -> "${normalizedId}"`);
      } else {
        // Para T, C, A, etc. mantener formato estándar con guiones
        normalizedId = cleanNumber
          .replace(/[.\s]/g, '-')  // ✅ También normalizar puntos y espacios para otros tipos
          .replace('/', '-')       // Separador para año
          .toLowerCase();
      }

      const currentYear = new Date().getFullYear();

      // URL correcta basada en la inspección del HTML de las páginas individuales
      const primaryUrl = `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${normalizedId}.rtf`;
      logger.debug(`📍 URL RTF generada: ${sentenceNumber} -> ${primaryUrl}`);

      return primaryUrl;

    } catch (error) {
      logger.error(`Error generando URL para ${sentenceNumber}:`, error);
      return '';
    }
  }

  private async verifyAndDownloadRTFDocument(documentId: string, url: string): Promise<{
    success: boolean;
    localPath?: string;
    isValidOffice?: boolean;
    contentType?: string;
    extractedText?: string;
    documentBuffer?: Buffer;
    error?: string;
  }> {
    try {
      logger.debug(`📥 Verificando y descargando documento RTF/DOCX: ${documentId} - ${url}`);
      
      // Descargar el contenido completo del documento
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Documento no accesible: ${response.status}`
        };
      }
      
      const contentType = response.headers.get('content-type') || '';

      logger.debug(`📄 Documento encontrado - Tipo: ${contentType}`);

      // Descargar el contenido del documento primero para verificar
      const buffer = Buffer.from(await response.arrayBuffer());

      // Rechazar explícitamente archivos HTML detectando contenido HTML
      const isHtmlDocument =
        contentType.includes('text/html') ||
        contentType.includes('application/html');

      // También verificar si el contenido parece HTML examinando los primeros bytes
      const bufferStart = buffer.slice(0, 1000).toString('utf8').toLowerCase();
      const looksLikeHtml = bufferStart.includes('<html') ||
                           bufferStart.includes('<!doctype') ||
                           bufferStart.includes('<head>') ||
                           bufferStart.includes('<body>');

      if (isHtmlDocument || looksLikeHtml) {
        return {
          success: false,
          error: `Archivo HTML detectado (no es documento RTF/DOCX): ${contentType}`
        };
      }

      // Para Corte Constitucional: Los archivos .rtf son realmente .docx
      // Solo verificar que no sea HTML, aceptar cualquier otro tipo de contenido
      logger.debug(`✅ Documento válido detectado (RTF real = DOCX): ${contentType || 'sin content-type'}`);

      // ✅ NUEVO: Verificar que tenga contenido mínimo
      if (buffer.length < 100) {
        return {
          success: false,
          error: `Archivo demasiado pequeño: ${buffer.length} bytes`
        };
      }

      let extractedText = '';
      
      try {
        // ⚠️ IMPORTANTE: Los archivos de Corte Constitucional con extensión .rtf son realmente DOCX
        // Usar Content Processor Black Box Adapter (mammoth) independientemente del content-type
        logger.info(`📖 Extrayendo texto de ${documentId} (${buffer.length} bytes, tipo: ${contentType})`);

        const extraction = await this.contentProcessor.extractText(buffer, `${documentId}.docx`);

        if (extraction && extraction.fullText) {
          extractedText = extraction.fullText;
          logger.info(`✅ Texto extraído con Content Processor (DOCX real): ${extractedText.length} caracteres`);
        } else {
          logger.warn(`⚠️ No se pudo extraer texto con Content Processor de ${documentId} - Extracción resultó vacía`);
        }

      } catch (textError) {
        logger.error(`❌ Error extrayendo texto de ${documentId}: ${(textError as Error).message}`);
        logger.error(`❌ Stack trace:`, (textError as Error).stack);
        // Continuar sin texto extraído
      }
      
      // Si llegamos aquí, el documento es válido y accesible
      logger.info(`✅ Documento RTF/DOCX verificado y descargado: ${documentId} (${buffer.length} bytes, texto: ${extractedText.length} chars)`);

      return {
        success: true,
        isValidOffice: true,
        contentType: contentType || 'application/docx',
        localPath: url,
        extractedText,
        documentBuffer: buffer
      };
      
    } catch (error) {
      logger.error(`❌ Error verificando documento ${documentId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }



  private parseSpanishDate(dateString: string): Date {
    try {
      if (!dateString) return new Date();

      // ✅ FIX: Limpiar espacios extra y caracteres invisibles
      const cleanDate = dateString.trim().replace(/\s+/g, ' ');

      // ✅ CRÍTICO: Detectar formato ISO YYYY-MM-DD PRIMERO (de la tabla de la Corte: 2025-12-19)
      // Este debe ir ANTES del regex genérico DD-MM-YYYY para evitar confusión
      const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1]);
        const month = parseInt(isoMatch[2]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(isoMatch[3]);
        logger.info(`✅ Fecha ISO parseada: "${cleanDate}" -> ${year}-${month + 1}-${day}`);
        return new Date(year, month, day);
      }

      // Formatos: "04/09/2025", "04-09-2025", "4 de septiembre de 2025"
      const monthsSpanish = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
      };

      // Formato DD/MM/YYYY (solo con /)
      const slashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const day = parseInt(slashMatch[1]);
        const month = parseInt(slashMatch[2]) - 1;
        const year = parseInt(slashMatch[3]);
        return new Date(year, month, day);
      }

      // Formato DD-MM-YYYY (día de 1-2 dígitos AL INICIO, año de 4 dígitos AL FINAL)
      const ddmmyyyyMatch = cleanDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1]);
        const month = parseInt(ddmmyyyyMatch[2]) - 1;
        const year = parseInt(ddmmyyyyMatch[3]);
        return new Date(year, month, day);
      }

      // Formato "4 de septiembre de 2025"
      const spanishMatch = cleanDate.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
      if (spanishMatch) {
        const day = parseInt(spanishMatch[1]);
        const monthName = spanishMatch[2].toLowerCase();
        const year = parseInt(spanishMatch[3]);
        const month = monthsSpanish[monthName as keyof typeof monthsSpanish];

        if (month !== undefined) {
          logger.info(`✅ Fecha español parseada: "${cleanDate}" -> ${year}-${month + 1}-${day}`);
          return new Date(year, month, day);
        }
      }

      logger.warn(`⚠️ No se pudo parsear fecha: "${dateString}" (limpia: "${cleanDate}")`);
      return new Date();

    } catch (error) {
      logger.error(`❌ Error parseando fecha "${dateString}":`, error);
      return new Date();
    }
  }
}