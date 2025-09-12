/**
 * BACKUP del CorteConstitucionalScraper.ts - VERSIÓN FUNCIONAL ORIGINAL
 * 
 * Fecha de backup: 2025-01-11
 * Líneas originales: 1,848
 * Razón: Preservar versión funcional antes de refactorización/limpieza
 * 
 * IMPORTANTE: Este archivo NO debe modificarse. Es el backup funcional.
 * Si la refactorización falla, restaurar desde este archivo.
 */

import puppeteer, { Browser } from 'puppeteer';
import { BaseScrapingService } from '@/scrapers/base/BaseScrapingService';
import { 
  ExtractionParameters, 
  ExtractionResult, 
  ExtractedDocument, 
  SourceMetadata,
  DocumentType,
  LegalArea
} from '@/scrapers/base/types';
import { logger } from '@/utils/logger';

export class CorteConstitucionalScraper extends BaseScrapingService {
  private browser: Browser | null = null;

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
      this.updateProgress({ progress: 5, message: 'Iniciando extracción real...' });
      
      const limit = Math.min(parameters.limit || 10, 20);
      logger.info(`🔍 Iniciando extracción real de ${limit} documentos de Corte Constitucional`);

      // Inicializar Puppeteer
      this.updateProgress({ progress: 15, message: 'Inicializando navegador...' });
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

      this.updateProgress({ progress: 25, message: 'Navegando a Corte Constitucional...' });

      // Seguir el flujo correcto del usuario
      logger.info(`🌐 PASO 1: Navegando a página principal`);
      await page.goto('https://www.corteconstitucional.gov.co/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logger.info(`🌐 PASO 2: Navegando al buscador de jurisprudencia`);
      const buscadorUrl = 'https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia';
      
      await page.goto(buscadorUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
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
      this.updateProgress({ progress: 40, message: 'Buscando enlaces de sentencias...' });

      // Esperar a que Angular/contenido dinámico cargue
      await this.waitForAngularLoad(page);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PASO 5: Extraer sentencias siguiendo el patrón del usuario (t-373-25.htm)
      logger.info(`🔍 PASO 5: Extrayendo sentencias del patrón correcto`);
      const sentenceLinks = await this.extractSentencesFromUltimasSentencias(page, limit);

      logger.info(`📋 Encontrados ${sentenceLinks.length} enlaces de sentencias`);
      this.updateProgress({ progress: 60, message: `Procesando ${sentenceLinks.length} sentencias encontradas...` });

      // Navegación adicional eliminada - no es necesaria, el scraper funciona perfectamente solo con "Ver últimas sentencias"
      if (false && sentenceLinks.length < limit) { // Deshabilitado
        logger.info('🔍 Buscando más sentencias en páginas específicas...');
        
        const additionalPages = [
          'https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia',
          'https://www.corteconstitucional.gov.co/relatoria/tutela.php',
          'https://www.corteconstitucional.gov.co/relatoria/constitucionalidad.php',
          'https://www.corteconstitucional.gov.co/relatoria/autos.php',
          'https://www.corteconstitucional.gov.co/relatoria/2025/',
          'https://www.corteconstitucional.gov.co/relatoria/2024/'
        ];

        for (const pageUrl of additionalPages) {
          if (sentenceLinks.length >= limit) break;
          
          try {
            logger.info(`📄 Navegando a: ${pageUrl}`);
            await page.goto(pageUrl, {
              waitUntil: 'networkidle2',
              timeout: 20000
            });

            await new Promise(resolve => setTimeout(resolve, 1500));

            const moreSentences = await page.evaluate((currentCount, maxResults, pageUrl) => {
              const links = [];
              const allLinks = Array.from(document.querySelectorAll('a[href]'));
              console.log(`Página ${pageUrl}: ${allLinks.length} enlaces encontrados`);
              
              for (let i = 0; i < allLinks.length && links.length < (maxResults - currentCount); i++) {
                const link = allLinks[i];
                const href = link.getAttribute('href') || '';
                const text = (link.textContent || '').trim();
                const fullContent = (text + ' ' + href).toLowerCase();
                
                let documentId = '';
                let foundMatch = false;
                
                // Aplicar filtro simplificado
                if (!href.includes('teams.microsoft.com') && 
                    !href.includes('centroderelevo') && 
                    !href.includes('mailto:') &&
                    !href.includes('javascript:') &&
                    !href.includes('#') &&
                    href.trim().length > 0) {
                  
                  // Usar la misma lógica simplificada
                  const tMatch = fullContent.match(/t[-\s]*(\d{1,4})[-\/](\d{2,4})/i);
                  if (tMatch) {
                    documentId = `T-${tMatch[1]}-${tMatch[2]}`;
                    foundMatch = true;
                  }
                  
                  if (!foundMatch) {
                    const cMatch = fullContent.match(/c[-\s]*(\d{1,4})[-\/](\d{2,4})/i);
                    if (cMatch) {
                      documentId = `C-${cMatch[1]}-${cMatch[2]}`;
                      foundMatch = true;
                    }
                  }
                  
                  if (!foundMatch) {
                    const suMatch = fullContent.match(/su[-\s]*(\d{1,4})[-\/](\d{2,4})/i);
                    if (suMatch) {
                      documentId = `SU-${suMatch[1]}-${suMatch[2]}`;
                      foundMatch = true;
                    }
                  }
                }
                
                if (!foundMatch && (href.includes('.htm') || href.includes('.rtf'))) {
                  // Aplicar el mismo filtro para evitar URLs no jurídicas
                  if (href.includes('corteconstitucional.gov.co') || href.includes('/relatoria/')) {
                    if (!href.includes('teams.microsoft.com') && 
                        !href.includes('centroderelevo') && 
                        !href.includes('portal') &&
                        !href.includes('servicio') &&
                        !href.includes('soporte')) {
                      foundMatch = true;
                      documentId = `DOC-${currentCount + links.length + 1}`;
                    }
                  }
                }
                
                if (foundMatch && href) {
                  let fullUrl = href;
                  if (!href.startsWith('http')) {
                    if (href.startsWith('/')) {
                      fullUrl = 'https://www.corteconstitucional.gov.co' + href;
                    } else {
                      fullUrl = 'https://www.corteconstitucional.gov.co/relatoria/' + href;
                    }
                  }
                  
                  links.push({
                    documentId: documentId,
                    title: text || `Documento ${documentId}`,
                    url: fullUrl,
                    rawText: text,
                    rawTitle: '',
                    sourcePage: pageUrl
                  });
                  
                  console.log(`Encontrado en ${pageUrl}: ${documentId} - ${text.substring(0, 30)}`);
                }
              }
              
              return links;
            }, sentenceLinks.length, limit, pageUrl);

            if (moreSentences.length > 0) {
              sentenceLinks.push(...moreSentences);
              logger.info(`📋 +${moreSentences.length} sentencias de ${pageUrl}`);
            }

          } catch (error) {
            logger.warn(`⚠️ Error en página ${pageUrl}:`, (error as Error).message);
            continue;
          }
        }
        
        logger.info(`📋 Total final de sentencias encontradas: ${sentenceLinks.length}`);
      }

      this.updateProgress({ progress: 75, message: 'Procesando documentos extraídos...' });

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
          } else if (linkData.documentId.startsWith('A-')) {
            typeKey = 'auto';
          }

          this.updateProgress({ 
            progress: 75 + (i / sentenceLinks.length) * 15,
            message: `Verificando documento RTF: ${linkData.documentId}`
          });

          // VERIFICAR DUPLICADOS - Si ya existe, omitir
          const documentExists = await this.checkDocumentExists(linkData.documentId);
          if (documentExists) {
            logger.info(`⏩ OMITIENDO ${linkData.documentId} - Ya existe`);
            continue; // Saltar al siguiente documento
          }

          // Verificar y validar documento RTF/DOCX
          const documentVerification = await this.verifyAndDownloadRTFDocument(
            linkData.documentId, 
            linkData.url
          );

          let finalUrl = linkData.url;
          let documentStatus = 'extracted';
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

          if (documentVerification.success) {
            logger.info(`✅ Documento RTF verificado: ${linkData.documentId}`);
            finalUrl = documentVerification.localPath || linkData.url;
            documentStatus = 'verified_rtf';
            documentMetadata.rtfVerification = {
              verified: true,
              contentType: documentVerification.contentType,
              isValidOffice: documentVerification.isValidOffice,
              verifiedUrl: finalUrl
            };
          } else {
            logger.warn(`⚠️ Documento RTF no verificado: ${linkData.documentId} - ${documentVerification.error}`);
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
            content += `\n\nEste documento fue extraído del sitio web oficial de la Corte Constitucional de Colombia usando el sistema de scraping actualizado con filtrado por los últimos 2 días hábiles.`;
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
            summary: `${linkData.title} - Documento oficial de la Corte Constitucional de Colombia${documentVerification.success ? ' (RTF verificado)' : ''}`,
            metadata: documentMetadata
          };

          extractedDocuments.push(document);
          
          this.updateProgress({ 
            progress: 75 + (i / sentenceLinks.length) * 20,
            message: `Procesado: ${linkData.documentId}${documentVerification.success ? ' ✓' : ' ⚠'}`
          });

        } catch (error) {
          logger.warn(`⚠️ Error procesando ${linkData.documentId}:`, (error as Error).message);
          continue;
        }
      }

      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000;

      this.updateProgress({ progress: 100, message: `Extracción completada - ${extractedDocuments.length} documentos reales` });
      
      logger.info(`✅ Extracción REAL completada: ${extractedDocuments.length} documentos en ${extractionTime}s`);

      return {
        success: true,
        documents: extractedDocuments,
        downloadedCount: extractedDocuments.length,
        extractionTime,
        totalFound: extractedDocuments.length,
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
          parameters
        }
      };

    } catch (error) {
      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000;
      
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
    logger.info('🔍 Buscando botón "Ver últimas sentencias" con clases CSS específicas...');
    
    try {
      // Usar selectores CSS específicos basados en la información del debug
      const cssSelectors = [
        'button.btn.btn-corte.rounded-0.btn-outline-primary', // Selector específico del botón visible
        'button[class*="btn-outline-primary"]',
        'button:contains("Ver últimas sentencias")'
      ];
      
      for (const selector of cssSelectors) {
        logger.debug(`🔍 Probando selector CSS: ${selector}`);
        
        try {
          const buttons = await page.$$(selector);
          
          for (const button of buttons) {
            // Verificar el texto del botón
            const text = await page.evaluate((el: any) => el.textContent?.trim(), button);
            
            if (text && text.toLowerCase().includes('ver últimas sentencias')) {
              // Verificar si es visible
              const isVisible = await button.isIntersectingViewport();
              const boundingBox = await button.boundingBox();
              
              logger.info(`📍 Botón encontrado: "${text}" - Visible: ${isVisible} - BoundingBox: ${boundingBox ? 'Sí' : 'No'}`);
              
              if (isVisible && boundingBox) {
                logger.info(`✅ Botón "Ver últimas sentencias" encontrado y visible`);
                
                // Hacer scroll al botón
                await page.evaluate((el: any) => {
                  el.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }, button);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Intentar hacer clic
                try {
                  await button.click();
                  logger.info('✅ Click exitoso en "Ver últimas sentencias"');
                  
                  // Esperar que se carguen los resultados
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  await this.waitForAngularLoad(page, 15);
                  
                  // Verificar que aparecieron resultados
                  const hasResults = await page.evaluate(() => {
                    // Buscar indicadores de que se cargaron las últimas sentencias
                    const indicators = [
                      () => document.querySelectorAll('a[href*="/relatoria/"]').length > 5,
                      () => document.querySelectorAll('a[href*=".htm"]').length > 0,
                      () => document.body.textContent?.includes('T-') || document.body.textContent?.includes('C-'),
                      () => document.querySelectorAll('table tr').length > 3
                    ];
                    
                    const results = indicators.map(test => test()).filter(Boolean);
                    console.log(`Indicadores de resultados: ${results.length}/4`);
                    
                    return results.length >= 1;
                  });
                  
                  if (hasResults) {
                    logger.info('✅ "Ver últimas sentencias" cargó resultados exitosamente');
                    return true;
                  } else {
                    logger.warn('⚠️ Click exitoso pero no se detectaron resultados');
                    return true; // Aún es exitoso el click
                  }
                  
                } catch (clickError) {
                  logger.warn(`⚠️ Error haciendo clic: ${(clickError as Error).message}`);
                  
                  // Intentar click con JavaScript como fallback
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
          }
        } catch (error) {
          logger.debug(`⚠️ Error con selector ${selector}: ${(error as Error).message}`);
          continue;
        }
      }
      
      // Fallback con XPath más específico
      logger.info('🔍 Intentando XPath como fallback...');
      const xpathSelectors = [
        '//button[contains(@class, "btn-outline-primary") and contains(text(), "Ver últimas sentencias")]',
        '//button[contains(text(), "Ver últimas sentencias")]'
      ];
      
      for (const xpath of xpathSelectors) {
        try {
          const elements = await page.$x(xpath);
          
          for (const element of elements) {
            const isVisible = await element.isIntersectingViewport();
            const text = await page.evaluate((el: any) => el.textContent?.trim(), element);
            
            logger.info(`📍 XPath encontró: "${text}" - Visible: ${isVisible}`);
            
            if (isVisible) {
              await page.evaluate((el: any) => el.scrollIntoView({ block: 'center' }), element);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              try {
                await element.click();
                logger.info('✅ XPath click exitoso');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return true;
              } catch (error) {
                await page.evaluate((el: any) => el.click(), element);
                logger.info('✅ XPath JS click exitoso');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return true;
              }
            }
          }
        } catch (error) {
          logger.debug(`⚠️ XPath falló: ${(error as Error).message}`);
          continue;
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
      // 1. Obtener fechas de HOY y AYER (días hábiles únicamente)
      const targetDates = this.getTodayAndYesterdayWorkingDays();
      
      if (targetDates.length === 0) {
        logger.warn('⚠️ No hay días hábiles para extraer (HOY y AYER no son días hábiles)');
        return results;
      }
      
      logger.info(`🔍 Extrayendo documentos SOLO de las fechas: ${targetDates.map(d => d.dateShort).join(', ')}`);
      
      // 2. Buscar tabla estructurada con las 7 columnas
      logger.info('📊 Buscando tabla estructurada con datos de sentencias...');
      
      // Esperar a que las sentencias se carguen
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const sentences = await page.evaluate((maxResults: number, targetDatesData: any[]) => {
        const foundSentences = [];
        console.log('🔍 Buscando tabla con estructura de 7 columnas...');
        
        // Buscar todas las tablas
        const tables = document.querySelectorAll('table, .table, [role="table"]');
        console.log(`📊 Total tablas encontradas: ${tables.length}`);
        
        let structuredTableFound = false;
        
        for (const table of tables) {
          const rows = table.querySelectorAll('tr');
          if (rows.length < 2) continue; // Necesita al menos header + 1 fila de datos
          
          // Buscar header con las 7 columnas esperadas
          const headerRow = rows[0];
          const headers = Array.from(headerRow.querySelectorAll('th, td')).map(th => 
            th.textContent?.toLowerCase().trim() || ''
          );
          
          // Verificar si tiene las columnas que esperamos
          const hasNo = headers.some(h => h.includes('no'));
          const hasFechaPublicacion = headers.some(h => h.includes('fecha') && h.includes('publicación'));
          const hasNumero = headers.some(h => h.includes('número') || h.includes('numero'));
          const hasExpediente = headers.some(h => h.includes('expediente'));
          const hasFechaSentencia = headers.some(h => h.includes('fecha') && h.includes('sentencia'));
          const hasTipo = headers.some(h => h.includes('tipo'));
          const hasTema = headers.some(h => h.includes('tema'));
          
          if (hasNo && hasFechaPublicacion && hasNumero && hasExpediente && hasFechaSentencia && hasTipo && hasTema) {
            console.log('✅ Tabla estructurada encontrada con 7 columnas');
            console.log(`📋 Headers: ${headers.join(' | ')}`);
            structuredTableFound = true;
            
            // DEBUG: Mostrar fechas objetivo
            console.log('🎯 Fechas objetivo que estamos buscando:');
            targetDatesData.forEach(targetDate => {
              console.log(`   ${targetDate.label}: "${targetDate.dateShort}" OR "${targetDate.dateAlt}" OR "${targetDate.dateStr}" OR "${targetDate.dateISO}"`);
            });
            
            // Procesar TODAS las filas con filtro de fechas
            console.log('📊 Analizando filas de la tabla con filtro de fechas:');
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              const cells = Array.from(row.querySelectorAll('td, th'));
              
              if (cells.length >= 7) {
                const cellData = cells.map(cell => cell.textContent?.trim() || '');
                
                const no = cellData[0];
                const fechaPublicacion = cellData[1];
                const numero = cellData[2];
                const expediente = cellData[3];
                const fechaSentencia = cellData[4];
                const tipo = cellData[5];
                const tema = cellData[6];
                
                console.log(`📄 Fila ${i}: ${cellData.join(' | ')}`);
                console.log(`   📅 Fecha publicación encontrada: "${fechaPublicacion}"`);
                
                // FILTRO CRÍTICO: Solo procesar si la fecha de publicación es de HOY o AYER
                const isTargetDate = targetDatesData.some(targetDate => {
                  // Verificar múltiples formatos de fecha incluyendo ISO (YYYY-MM-DD)
                  const match1 = fechaPublicacion.includes(targetDate.dateShort);
                  const match2 = fechaPublicacion.includes(targetDate.dateAlt);
                  const match3 = fechaPublicacion.includes(targetDate.dateStr);
                  const match4 = fechaPublicacion.includes(targetDate.dateISO); // ¡NUEVO! Formato ISO
                  
                  console.log(`     Comparando con ${targetDate.label}:`);
                  console.log(`       "${fechaPublicacion}".includes("${targetDate.dateShort}") = ${match1}`);
                  console.log(`       "${fechaPublicacion}".includes("${targetDate.dateAlt}") = ${match2}`);
                  console.log(`       "${fechaPublicacion}".includes("${targetDate.dateStr}") = ${match3}`);
                  console.log(`       "${fechaPublicacion}".includes("${targetDate.dateISO}") = ${match4} ← FORMATO ISO`);
                  
                  return match1 || match2 || match3 || match4;
                });
                
                if (isTargetDate && numero && foundSentences.length < maxResults) {
                  // Generar ID de documento
                  const sentenceId = numero.toUpperCase().replace(/[\s\/]+/g, '-');
                  
                  // Determinar año y generar URLs correctas
                  const currentYear = new Date().getFullYear();
                  // Convertir "T-373/25" -> "t-373-25"
                  const urlSafeName = numero.toLowerCase().replace(/[\s\/]+/g, '-');
                  const htmlUrl = `https://www.corteconstitucional.gov.co/relatoria/${currentYear}/${urlSafeName}.htm`;
                  const rtfUrl = htmlUrl.replace('.htm', '.rtf');
                  
                  console.log(`🔧 DEBUG URL: "${numero}" -> "${urlSafeName}" -> ${rtfUrl}`);
                  
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
                      fechaPublicacion: fechaPublicacion,
                      numero: numero,
                      expediente: expediente,
                      fechaSentencia: fechaSentencia,
                      tipo: tipo,
                      tema: tema
                    }
                  });
                  
                  console.log(`✅ Documento de fecha objetivo AGREGADO: ${sentenceId} - ${fechaPublicacion}`);
                } else if (!isTargetDate) {
                  console.log(`     ⏩ Omitiendo documento de fecha diferente: ${fechaPublicacion} (no está en fechas objetivo)`);
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
          console.log('❌ No se encontró tabla estructurada con 7 columnas, usando método fallback...');
          console.log('🔍 DEBUG: Analizando todas las tablas disponibles...');
          
          // DEBUG: Mostrar información de todas las tablas
          const allTables = document.querySelectorAll('table, .table, [role="table"]');
          console.log(`📊 Total tablas encontradas: ${allTables.length}`);
          
          for (let t = 0; t < allTables.length; t++) {
            const table = allTables[t];
            const rows = table.querySelectorAll('tr');
            const headerRow = rows[0];
            const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(th => th.textContent?.trim() || '') : [];
            
            console.log(`📋 Tabla ${t + 1}:`);
            console.log(`   Headers (${headers.length}): ${headers.join(' | ')}`);
            console.log(`   Filas totales: ${rows.length}`);
            
            // Mostrar algunas filas de muestra
            for (let r = 1; r < Math.min(rows.length, 4); r++) {
              const row = rows[r];
              const cells = Array.from(row.querySelectorAll('td, th'));
              const cellData = cells.map(cell => cell.textContent?.trim() || '');
              console.log(`   Fila ${r}: ${cellData.join(' | ')}`);
              
              // Si la fila tiene fecha, verificar si es de nuestras fechas objetivo
              if (cellData.length > 1 && cellData[1]) {
                const fechaCell = cellData[1];
                const isTargetDate = targetDatesData.some(targetDate => {
                  const match1 = fechaCell.includes(targetDate.dateShort);
                  const match2 = fechaCell.includes(targetDate.dateAlt);
                  const match3 = fechaCell.includes(targetDate.dateStr);
                  
                  if (match1 || match2 || match3) {
                    console.log(`     ✅ FECHA OBJETIVO ENCONTRADA: "${fechaCell}" coincide con ${targetDate.dateShort}`);
                    return true;
                  }
                  return false;
                });
                
                if (isTargetDate) {
                  console.log(`     🎯 Esta fila tiene fecha objetivo, debería ser extraída`);
                }
              }
            }
          }
          
          // Fallback: buscar enlaces como antes SIN filtro de fecha para ver qué hay disponible
          const allLinks = document.querySelectorAll('a[href]');
          console.log(`🔗 Total enlaces encontrados: ${allLinks.length}`);
          
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
              
              // Solo extraer si es 2025 (pero sin filtro de fecha específica para ver disponibilidad)
              if (year === '2025' && foundSentences.length < maxResults) {
                // Generar URL completa
                const fullUrl = href.startsWith('http') ? href : `https://www.corteconstitucional.gov.co${href}`;
                
                // Generar URL de descarga RTF
                const rtfUrl = fullUrl.replace('.htm', '.rtf');
                
                foundSentences.push({
                  documentId: sentenceId,
                  title: text || `Sentencia ${sentenceId} de ${year}`,
                  url: rtfUrl, // URL de descarga RTF
                  htmlUrl: fullUrl, // URL de visualización HTML
                  year: year,
                  rawText: text,
                  rawTitle: text,
                  extractionSource: 'ultimas-sentencias-fallback-no-date-filter'
                });
                
                console.log(`✅ Sentencia extraída (sin filtro de fecha): ${sentenceId} - ${year}`);
              }
            }
          }
          
          console.log(`📊 DEBUG: Total sentencias encontradas con fallback: ${foundSentences.length}`);
        }
        
        return foundSentences;
      }, limit, targetDates);
      
      logger.info(`📋 Encontrados ${sentences.length} documentos de las fechas objetivo`);
      
      if (sentences.length === 0) {
        logger.warn('⚠️ No se encontraron documentos de HOY ni AYER en las fechas objetivo');
        logger.info('💡 Esto puede suceder si:');
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
          
          // Crear el objeto de documento
          const document = {
            documentId: sentence.documentId,
            title: sentence.title,
            url: sentence.url,
            content: `Documento jurídico extraído: ${sentence.documentId}\n\nURL: ${sentence.url}\nTipo: SENTENCIA\n\nEste documento fue extraído del sitio web oficial de la Corte Constitucional de Colombia.`,
            summary: `${sentence.documentId} - Documento oficial de la Corte Constitucional de Colombia (RTF verificado)`,
            documentType: 'SENTENCE' as const,
            legalArea: 'CONSTITUTIONAL' as const,
            extractionDate: new Date(),
            publicationDate: new Date(),
            metadata: {
              extractionMethod: 'puppeteer-typescript-v3',
              extractionVersion: 'v3-with-rtf-verification',
              rtfVerification: rtfVerification,
              structuredData: sentence.structuredData || null,
              extractionSource: sentence.extractionSource
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
      logger.error('❌ Error extrayendo sentencias de "Ver últimas sentencias":', (error as Error).message);
    }
    
    return results;
  }

  private async extractFromStructuredTable(page: any, limit: number): Promise<any[]> {
    const results: any[] = [];
    
    try {
      logger.info('🔍 Buscando tabla con columnas: No, Fecha publicación, Número, Expediente, Fecha sentencia, Tipo, Tema...');
      
      // Esperar a que las tablas se carguen completamente
      await this.waitForAngularLoad(page, 20);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Más tiempo para carga completa
      
      const structuredData = await page.evaluate((maxResults: number) => {
        const documents = [];
        
        // Selectores para encontrar la tabla de últimas sentencias
        const tableSelectors = [
          'table',
          '.table',
          '[role="table"]',
          'div[class*="table"]',
          'table[class*="sentencias"]',
          'table[class*="providencias"]'
        ];
        
        let targetTable = null;
        
        // Buscar la tabla que contiene las columnas específicas
        for (const selector of tableSelectors) {
          const tables = document.querySelectorAll(selector);
          
          for (const table of tables) {
            const headerText = table.textContent?.toLowerCase() || '';
            
            // Verificar que la tabla contenga las columnas requeridas
            const requiredColumns = [
              'fecha', 'número', 'expediente', 'tipo', 'tema'
            ];
            
            const hasRequiredColumns = requiredColumns.some(col => 
              headerText.includes(col) || 
              headerText.includes(col.replace('ú', 'u')) ||
              headerText.includes(col.replace('é', 'e'))
            );
            
            if (hasRequiredColumns) {
              console.log(`✅ Tabla encontrada con selector: ${selector}`);
              targetTable = table;
              break;
            }
          }
          
          if (targetTable) break;
        }
        
        if (!targetTable) {
          console.log('⚠️ No se encontró tabla estructurada, buscando en todas las tablas...');
          
          // Fallback: buscar en cualquier tabla con filas de datos
          for (const selector of tableSelectors) {
            const tables = document.querySelectorAll(selector);
            
            for (const table of tables) {
              const rows = table.querySelectorAll('tr');
              if (rows.length > 2) { // Al menos header + 2 filas de datos
                targetTable = table;
                console.log(`📋 Usando tabla con ${rows.length} filas`);
                break;
              }
            }
            if (targetTable) break;
          }
        }
        
        if (!targetTable) {
          console.log('❌ No se encontró ninguna tabla válida');
          return documents;
        }
        
        // Analizar estructura de la tabla
        const rows = targetTable.querySelectorAll('tr');
        console.log(`📊 Analizando tabla con ${rows.length} filas`);
        
        if (rows.length < 2) {
          console.log('⚠️ Tabla sin datos suficientes');
          return documents;
        }
        
        // Identificar columnas en el header
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map((cell, index) => {
          const text = cell.textContent?.trim().toLowerCase() || '';
          return { index, text, original: cell.textContent?.trim() || '' };
        });
        
        console.log('📋 Headers encontrados:', headers.map(h => h.original).join(' | '));
        
        // Mapear columnas por contenido (flexible)
        const columnMap = {
          no: -1,
          fechaPublicacion: -1,
          numero: -1,
          expediente: -1,
          fechaSentencia: -1,
          tipo: -1,
          tema: -1
        };
        
        headers.forEach((header, index) => {
          const text = header.text;
          
          if (text.includes('no.') || text === 'no' || text.includes('núm')) {
            columnMap.no = index;
          } else if (text.includes('fecha') && (text.includes('public') || text.includes('notific'))) {
            columnMap.fechaPublicacion = index;
          } else if (text.includes('número') || text.includes('numero') || (text.includes('no') && text.includes('sent'))) {
            columnMap.numero = index;
          } else if (text.includes('expediente') || text.includes('exp')) {
            columnMap.expediente = index;
          } else if (text.includes('fecha') && text.includes('sent')) {
            columnMap.fechaSentencia = index;
          } else if (text.includes('tipo') || text.includes('clase')) {
            columnMap.tipo = index;
          } else if (text.includes('tema') || text.includes('materia') || text.includes('asunto')) {
            columnMap.tema = index;
          }
        });
        
        console.log('🗂️ Mapeo de columnas:', columnMap);
        
        // Obtener fechas de los últimos 2 días hábiles para filtrado
        const getLastWorkingDays = (count: number) => {
          const dates = [];
          const today = new Date();
          let currentDate = new Date(today);
          let daysAdded = 0;
          
          while (daysAdded < count) {
            // Solo incluir días hábiles (lunes = 1, viernes = 5)
            if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
              dates.push(new Date(currentDate));
              daysAdded++;
            }
            currentDate.setDate(currentDate.getDate() - 1);
          }
          
          return dates;
        };
        
        const targetDates = getLastWorkingDays(2);
        const targetDateStrings = targetDates.map(date => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear().toString();
          
          return [
            `${day}/${month}/${year}`,
            `${day}-${month}-${year}`,
            `${date.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][date.getMonth()]} de ${year}`
          ];
        }).flat();
        
        console.log('📅 Fechas objetivo para filtro:', targetDateStrings.slice(0, 6));
        
        // Procesar filas de datos
        for (let i = 1; i < rows.length && documents.length < maxResults; i++) {
          const row = rows[i];
          const cells = Array.from(row.querySelectorAll('td, th'));
          
          if (cells.length < 3) continue; // Skip filas con muy pocas columnas
          
          const rowData = {
            no: cells[columnMap.no]?.textContent?.trim() || '',
            fechaPublicacion: cells[columnMap.fechaPublicacion]?.textContent?.trim() || '',
            numero: cells[columnMap.numero]?.textContent?.trim() || '',
            expediente: cells[columnMap.expediente]?.textContent?.trim() || '',
            fechaSentencia: cells[columnMap.fechaSentencia]?.textContent?.trim() || '',
            tipo: cells[columnMap.tipo]?.textContent?.trim() || '',
            tema: cells[columnMap.tema]?.textContent?.trim() || ''
          };
          
          // Si no tenemos mapeo específico, intentar extraer de todas las celdas
          if (columnMap.numero === -1) {
            for (const cell of cells) {
              const cellText = cell.textContent?.trim() || '';
              
              // Buscar número de sentencia
              const sentenceMatch = cellText.match(/([TCG]-\d{1,4}[-\/]\d{2,4}|SU[-.\\s]*\d{1,4}[-\/]\d{2,4}|[A]-\d{1,4}[-\/]\d{2,4})/i);
              if (sentenceMatch && !rowData.numero) {
                rowData.numero = sentenceMatch[1];
              }
              
              // Buscar expediente
              const expedientMatch = cellText.match(/([A-Z]-\d{3,4}[-\/]\d{2,4}[-\/]?\d*)/i);
              if (expedientMatch && !rowData.expediente) {
                rowData.expediente = expedientMatch[1];
              }
              
              // Buscar fechas
              const dateMatch = cellText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/);
              if (dateMatch && !rowData.fechaPublicacion) {
                rowData.fechaPublicacion = dateMatch[1];
              }
            }
          }
          
          // Solo procesar si tiene número de sentencia
          if (!rowData.numero) {
            continue;
          }
          
          // Aplicar filtro de últimos 2 días hábiles si tenemos fecha de publicación
          let matchesDateFilter = true;
          if (rowData.fechaPublicacion) {
            matchesDateFilter = targetDateStrings.some(targetDate => 
              rowData.fechaPublicacion.includes(targetDate) || 
              targetDate.includes(rowData.fechaPublicacion)
            );
          }
          
          if (matchesDateFilter) {
            // Determinar tipo de documento
            let documentType = 'SENTENCE';
            if (rowData.numero.toUpperCase().startsWith('T-')) {
              documentType = 'TUTELA';
            } else if (rowData.numero.toUpperCase().startsWith('C-')) {
              documentType = 'CONSTITUCIONALIDAD';
            } else if (rowData.numero.toUpperCase().startsWith('SU')) {
              documentType = 'SALA_UNIFICADA';
            } else if (rowData.numero.toUpperCase().startsWith('A-')) {
              documentType = 'AUTO';
            }
            
            const document = {
              documentId: rowData.numero.toUpperCase(),
              title: `Sentencia ${rowData.numero} de la Corte Constitucional`,
              numero: rowData.numero,
              expediente: rowData.expediente,
              fechaPublicacion: rowData.fechaPublicacion,
              fechaSentencia: rowData.fechaSentencia,
              tipo: rowData.tipo || documentType,
              tema: rowData.tema,
              no: rowData.no,
              rawRowData: rowData,
              extractionSource: 'structured-table'
            };
            
            documents.push(document);
            console.log(`✅ Documento estructurado: ${rowData.numero} - ${rowData.fechaPublicacion}`);
          }
        }
        
        console.log(`📊 Total documentos extraídos de tabla estructurada: ${documents.length}`);
        return documents;
        
      }, limit);
      
      // Procesar resultados y generar URLs
      for (const docData of structuredData) {
        const pdfUrl = this.generateDocumentUrl(docData.documentId);
        const htmlUrl = this.generateHtmlUrl(docData.documentId);
        
        results.push({
          documentId: docData.documentId,
          title: docData.title,
          url: pdfUrl,
          htmlUrl: htmlUrl,
          rawText: `${docData.title} - Expediente: ${docData.expediente} - Fecha: ${docData.fechaPublicacion}`,
          rawTitle: docData.title,
          structuredData: {
            no: docData.no,
            fechaPublicacion: docData.fechaPublicacion,
            numero: docData.numero,
            expediente: docData.expediente,
            fechaSentencia: docData.fechaSentencia,
            tipo: docData.tipo,
            tema: docData.tema
          },
          extractionSource: 'structured-table'
        });
      }
      
      return results;
      
    } catch (error) {
      logger.error('Error extrayendo de tabla estructurada:', error);
      return [];
    }
  }

  private async extractSentencesGeneral(page: any, limit: number): Promise<any[]> {
    const results: any[] = [];
    
    try {
      // Buscar todos los documentos sin filtro de fecha
      const foundSentences = await page.evaluate((maxResults: number) => {
        const sentences = [];
        
        // Buscar en tablas
        const tableSelectors = ['table tr', 'tbody tr', '.table tr', '[role="table"] tr'];
        
        for (const selector of tableSelectors) {
          const rows = document.querySelectorAll(selector);
          
          if (rows.length <= 1) continue; // Skip if no data rows
          
          for (let i = 0; i < Math.min(rows.length, 100); i++) {
            const row = rows[i];
            if (!row) continue;
            
            const rowText = row.textContent?.trim() || '';
            if (rowText.length < 10) continue;
            
            // Buscar patrones de sentencias (más permisivos)
            const sentencePatterns = [
              /\b([TC]-\d{1,4}[-\/]\d{2,4})\b/gi,    // T-343/25, C-123/25
              /\b(SU[-.\\s]*\d{1,4}[-\/]\d{2,4})\b/gi, // SU-123/25, SU.123/25
              /\b([A]-\d{1,4}[-\/]\d{2,4})\b/gi,      // A-123/25
              /\bSentencia\\s+([TC]-\d{1,4}[-\/]\d{2,4})/gi,
              /\bSentencia\\s+(SU[-.\\s]*\d{1,4}[-\/]\d{2,4})/gi
            ];
            
            for (const pattern of sentencePatterns) {
              let match;
              const regex = new RegExp(pattern.source, pattern.flags);
              while ((match = regex.exec(rowText)) !== null && sentences.length < maxResults) {
                const sentenceNumber = match[1].toUpperCase().replace(/\\s/g, '');
                
                // Evitar duplicados
                if (!sentences.find(s => s.documentId === sentenceNumber)) {
                  sentences.push({
                    documentId: sentenceNumber,
                    title: `Sentencia ${sentenceNumber} de la Corte Constitucional`,
                    rawText: rowText.substring(0, 200)
                  });
                  
                  console.log(`✅ Documento encontrado: ${sentenceNumber}`);
                  
                  if (sentences.length >= maxResults) {
                    return sentences;
                  }
                }
              }
            }
          }
          
          if (sentences.length > 0) {
            console.log(`Encontrados ${sentences.length} documentos en selector: ${selector}`);
            break; // Si encontramos resultados, no buscar en otros selectores
          }
        }
        
        // Si no encuentra en tablas, buscar en enlaces directos
        if (sentences.length === 0) {
          console.log('No se encontraron documentos en tablas, buscando en enlaces...');
          
          const allLinks = Array.from(document.querySelectorAll('a[href]'));
          for (let i = 0; i < allLinks.length && sentences.length < maxResults; i++) {
            const link = allLinks[i];
            const href = link.getAttribute('href') || '';
            const text = link.textContent?.trim() || '';
            const fullContent = (text + ' ' + href).toLowerCase();
            
            // Buscar patrones de sentencias en enlaces
            const linkPatterns = [
              /([tc]-\d{1,4}[-\/]\d{2,4})/i,
              /(su[-.\\s]*\d{1,4}[-\/]\d{2,4})/i,
              /([a]-\d{1,4}[-\/]\d{2,4})/i
            ];
            
            for (const pattern of linkPatterns) {
              const match = fullContent.match(pattern);
              if (match) {
                const sentenceNumber = match[1].toUpperCase().replace(/\\s/g, '');
                
                if (!sentences.find(s => s.documentId === sentenceNumber)) {
                  sentences.push({
                    documentId: sentenceNumber,
                    title: text || `Documento ${sentenceNumber}`,
                    rawText: text
                  });
                  
                  console.log(`✅ Enlace encontrado: ${sentenceNumber}`);
                  break;
                }
              }
            }
          }
        }
        
        console.log(`Total documentos extraídos: ${sentences.length}`);
        return sentences;
      }, limit);
      
      // Procesar resultados y generar URLs
      for (const sentence of foundSentences) {
        const pdfUrl = this.generateDocumentUrl(sentence.documentId);
        const htmlUrl = this.generateHtmlUrl(sentence.documentId);
        
        results.push({
          documentId: sentence.documentId,
          title: sentence.title,
          url: pdfUrl,
          rawText: sentence.rawText,
          rawTitle: '',
          htmlUrl
        });
      }
      
      return results;
      
    } catch (error) {
      logger.error('Error en extracción general:', error);
      return [];
    }
  }

  private async checkDocumentExists(documentId: string): Promise<boolean> {
    try {
      // Verificar en base de datos si el documento ya existe
      const existingDoc = await global.prisma?.document.findFirst({
        where: {
          OR: [
            { documentId: documentId },
            { title: { contains: documentId } },
            { url: { contains: documentId } }
          ]
        }
      });

      if (existingDoc) {
        logger.info(`📋 Documento ${documentId} YA EXISTE en BD (ID: ${existingDoc.id}) - OMITIENDO`);
        return true;
      }

      // También verificar por archivo descargado localmente
      const fs = require('fs');
      const path = require('path');
      const downloadPath = path.join(process.cwd(), 'test_documents', `${documentId}.rtf`);
      
      if (fs.existsSync(downloadPath)) {
        logger.info(`📁 Documento ${documentId} YA EXISTE como archivo local - OMITIENDO`);
        return true;
      }

      logger.debug(`🆕 Documento ${documentId} es NUEVO - PROCESAR`);
      return false;
    } catch (error) {
      logger.warn(`⚠️ Error verificando duplicado para ${documentId}: ${(error as Error).message}`);
      return false; // En caso de error, procesar el documento
    }
  }

  private getTodayAndYesterdayWorkingDays(): any[] {
    const monthsSpanish = {
      1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
      7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    };
    
    const datesToExtract = [];
    const today = new Date();
    
    logger.info(`🔍 Buscando HOY y AYER (solo días hábiles) desde: ${today.toLocaleDateString('es-CO')}`);
    
    // Función para procesar una fecha
    const processDate = (date: Date, label: string) => {
      const dayOfWeek = date.getDay();
      
      // Solo procesar días hábiles (lunes = 1, viernes = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const day = date.getDate();
        const monthName = monthsSpanish[date.getMonth() + 1];
        const year = date.getFullYear();
        
        const dateStr = `${day} de ${monthName} de ${year}`;
        const dateShort = `${day.toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${year}`;
        const dateAlt = `${day.toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${year}`;
        const dateISO = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Formato YYYY-MM-DD
        
        const dateInfo = { 
          dateStr, 
          dateShort, 
          dateAlt, 
          dateISO, // ¡NUEVO! Para coincidir con formato de tabla
          date: new Date(date),
          dayOfWeek: date.toLocaleDateString('es-CO', { weekday: 'long' }),
          label,
          isToday: label === 'HOY'
        };
        
        datesToExtract.push(dateInfo);
        logger.info(`📅 ${label}: ${dateStr} (${date.toLocaleDateString('es-CO', { weekday: 'long' })}) ✅ DÍA HÁBIL`);
        return true;
      } else {
        logger.info(`📅 ${label}: ${date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ⏩ NO ES DÍA HÁBIL`);
        return false;
      }
    };
    
    // 1. Procesar HOY (si es día hábil)
    processDate(today, 'HOY');
    
    // 2. Procesar AYER (si es día hábil)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    processDate(yesterday, 'AYER');
    
    // 3. Si no tenemos días hábiles, buscar el último día hábil anterior
    if (datesToExtract.length === 0) {
      logger.warn('⚠️ Ni HOY ni AYER son días hábiles, buscando último día hábil...');
      
      let searchDate = new Date(today);
      let daysSearched = 0;
      const maxSearch = 7; // Buscar máximo 7 días atrás
      
      while (datesToExtract.length === 0 && daysSearched < maxSearch) {
        searchDate.setDate(searchDate.getDate() - 1);
        daysSearched++;
        
        if (processDate(searchDate, `ÚLTIMO DÍA HÁBIL (-${daysSearched} días)`)) {
          break;
        }
      }
    }
    
    // Ordenar por fecha (más reciente primero)
    datesToExtract.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    logger.info(`✅ Generados ${datesToExtract.length} días hábiles para extracción:`);
    datesToExtract.forEach((d, index) => {
      logger.info(`   ${index + 1}. ${d.label}: ${d.dateShort} (${d.dayOfWeek})`);
    });
    
    return datesToExtract;
  }

  private async extractSentencesByDate(page: any, targetDateStr: string, targetDateShort: string, targetDateAlt: string, limit: number): Promise<any[]> {
    const results: any[] = [];
    
    try {
      // Crear patrones de fecha para búsqueda (como el scraper Python)
      const datePatterns = [
        targetDateStr,  // "4 de septiembre de 2025"
        targetDateShort,  // "04/09/2025"
        targetDateAlt,  // "04-09-2025"
        targetDateStr.replace(/ de /g, '/'),
      ];
      
      // Agregar formato ISO
      const dateParts = targetDateShort.split('/');
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        const isoDate = `${year}-${month}-${day}`;
        datePatterns.push(isoDate);
      }
      
      // Buscar en tabla usando evaluate como el scraper Python
      const foundSentences = await page.evaluate((patterns: string[], maxResults: number) => {
        const sentences = [];
        const tableSelectors = ['//table//tr', '//tbody//tr'];
        
        for (const selector of tableSelectors) {
          try {
            const rows = document.evaluate(selector, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            
            if (rows.snapshotLength <= 2) continue;
            
            for (let i = 0; i < Math.min(rows.snapshotLength, 50); i++) {
              const row = rows.snapshotItem(i);
              if (!row) continue;
              
              const rowText = (row as HTMLElement).textContent?.trim() || '';
              if (rowText.length < 10) continue;
              
              // Verificar si la fila contiene la fecha objetivo
              let dateFound = false;
              for (const pattern of patterns) {
                if (rowText.toLowerCase().includes(pattern.toLowerCase())) {
                  dateFound = true;
                  break;
                }
              }
              
              if (!dateFound) continue;
              
              // Buscar número de sentencia con patrones mejorados
              const sentencePatterns = [
                /([TCG]-\d{1,4}[/-]\d{2,4})/i,  // T-343/25, C-123/25, etc.
                /(SU\.\d{1,4}[/-]\d{2,4})/i,
                /(SU-\d{1,4}[/-]\d{2,4})/i, 
                /([A]-\d{1,4}[/-]\d{2,4})/i,
                /([TCG]\d{1,4}[/-]\d{2,4})/i,   // Sin guión
                /(SU\d{1,4}[/-]\d{2,4})/i      // SU sin punto ni guión
              ];
              
              let sentenceNumber = null;
              for (const pattern of sentencePatterns) {
                const matches = rowText.match(pattern);
                if (matches) {
                  sentenceNumber = matches[1].toUpperCase();
                  break;
                }
              }
              
              if (!sentenceNumber) continue;
              
              sentences.push({
                documentId: sentenceNumber,
                title: `Sentencia ${sentenceNumber} de la Corte Constitucional`,
                rawText: rowText
              });
              
              console.log(`✅ Sentencia encontrada: ${sentenceNumber}`);
              
              if (sentences.length >= maxResults) {
                return sentences;
              }
            }
            
            if (sentences.length > 0) break;
            
          } catch (error) {
            console.debug(`Error con selector ${selector}:`, error);
            continue;
          }
        }
        
        return sentences;
      }, datePatterns, limit);
      
      // Procesar resultados y generar URLs
      for (const sentence of foundSentences) {
        const pdfUrl = this.generateDocumentUrl(sentence.documentId);
        const htmlUrl = this.generateHtmlUrl(sentence.documentId);
        
        results.push({
          documentId: sentence.documentId,
          title: sentence.title,
          url: pdfUrl,
          rawText: sentence.rawText,
          rawTitle: '',
          htmlUrl
        });
      }
      
      return results;
      
    } catch (error) {
      logger.error(`Error extrayendo por fecha ${targetDateStr}:`, error);
      return [];
    }
  }

  private generateDocumentUrl(sentenceNumber: string): string {
    try {
      const cleanNumber = sentenceNumber.trim().toUpperCase();
      let normalizedId = '';
      
      // Casos especiales para SU (como el scraper Python)
      if (cleanNumber.startsWith('SU.')) {
        normalizedId = cleanNumber.replace('SU.', 'su').replace('/', '-').toLowerCase();
      } else if (cleanNumber.startsWith('SU')) {
        normalizedId = cleanNumber.replace('SU', 'su').replace('/', '-').toLowerCase();
      } else {
        // Para T, C, A, etc. mantener formato estándar
        normalizedId = cleanNumber.toLowerCase().replace('/', '-');
      }
      
      const currentYear = new Date().getFullYear();
      
      // Generar múltiples URLs candidatas (RTF que son realmente DOCX)
      const candidateUrls = [
        `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${normalizedId}.rtf`,
        `https://www.corteconstitucional.gov.co/relatoria/${currentYear}/${normalizedId}.rtf`,
        `https://www.corteconstitucional.gov.co/archivos/${normalizedId}.rtf`,
        `https://www.corteconstitucional.gov.co/sentencias/${currentYear - 1}/${normalizedId}.rtf` // Año anterior por si acaso
      ];
      
      // Por ahora devolver la URL principal, pero guardamos las alternativas para verificación
      const primaryUrl = candidateUrls[0];
      logger.debug(`URL RTF generada: ${sentenceNumber} -> ${primaryUrl}`);
      
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
    error?: string;
  }> {
    try {
      logger.info(`📥 Verificando documento RTF/DOCX: ${documentId} - ${url}`);
      
      // Verificar que la URL sea accesible
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        logger.warn(`⚠️ URL no accesible: ${url} - Status: ${response.status}`);
        
        // Intentar URLs alternativas
        const alternativeUrls = this.generateAlternativeDocumentUrls(documentId);
        
        for (const altUrl of alternativeUrls) {
          try {
            const altResponse = await fetch(altUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              }
            });
            
            if (altResponse.ok) {
              logger.info(`✅ URL alternativa funcional: ${altUrl}`);
              return await this.verifyAndDownloadRTFDocument(documentId, altUrl);
            }
          } catch (error) {
            logger.debug(`⚠️ URL alternativa falló: ${altUrl}`);
            continue;
          }
        }
        
        return {
          success: false,
          error: `Documento no accesible. Probadas ${alternativeUrls.length + 1} URLs`
        };
      }
      
      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      
      logger.info(`📄 Documento encontrado - Tipo: ${contentType}, Tamaño: ${contentLength} bytes`);
      
      // Verificar que sea un documento válido
      const isValidDocument = 
        contentType.includes('application/rtf') ||
        contentType.includes('application/msword') ||
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('text/rtf') ||
        contentLength > 1000; // Al menos 1KB
      
      if (!isValidDocument) {
        logger.warn(`⚠️ El documento no parece ser RTF/DOCX válido: ${contentType}`);
        return {
          success: false,
          error: `Tipo de contenido no válido: ${contentType}`
        };
      }
      
      // Si llegamos aquí, el documento es válido y accesible
      logger.info(`✅ Documento RTF/DOCX verificado: ${documentId}`);
      
      return {
        success: true,
        isValidOffice: true,
        contentType,
        localPath: url // Por ahora devolvemos la URL, en implementación completa descargaríamos localmente
      };
      
    } catch (error) {
      logger.error(`❌ Error verificando documento ${documentId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private generateAlternativeDocumentUrls(sentenceNumber: string): string[] {
    const cleanNumber = sentenceNumber.trim().toUpperCase();
    let normalizedId = cleanNumber.toLowerCase().replace('/', '-');
    
    // Casos especiales para SU
    if (cleanNumber.startsWith('SU.')) {
      normalizedId = cleanNumber.replace('SU.', 'su').replace('/', '-').toLowerCase();
    } else if (cleanNumber.startsWith('SU')) {
      normalizedId = cleanNumber.replace('SU', 'su').replace('/', '-').toLowerCase();
    }
    
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // URLs alternativas más comunes para documentos de la Corte Constitucional
    return [
      `https://www.corteconstitucional.gov.co/relatoria/${currentYear}/${normalizedId}.rtf`,
      `https://www.corteconstitucional.gov.co/sentencias/${previousYear}/${normalizedId}.rtf`,
      `https://www.corteconstitucional.gov.co/relatoria/${previousYear}/${normalizedId}.rtf`,
      `https://www.corteconstitucional.gov.co/archivos/${normalizedId}.rtf`,
      `https://www.corteconstitucional.gov.co/documentos/${currentYear}/${normalizedId}.rtf`,
      `https://www.corteconstitucional.gov.co/providencias/${currentYear}/${normalizedId}.rtf`,
      // Variaciones con puntos y sin puntos para SU
      ...(cleanNumber.startsWith('SU') ? [
        `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${cleanNumber.replace('SU', 'su.').replace('/', '-').toLowerCase()}.rtf`,
        `https://www.corteconstitucional.gov.co/relatoria/${currentYear}/${cleanNumber.replace('SU', 'su.').replace('/', '-').toLowerCase()}.rtf`
      ] : [])
    ];
  }

  private generateHtmlUrl(sentenceNumber: string): string {
    const currentYear = new Date().getFullYear();
    return `https://www.corteconstitucional.gov.co/relatoria/${currentYear}/${sentenceNumber.replace('/', '-')}.htm`;
  }

  private parseSpanishDate(dateString: string): Date {
    try {
      if (!dateString) return new Date();
      
      // Formatos: "04/09/2025", "04-09-2025", "4 de septiembre de 2025"
      const monthsSpanish = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
      };
      
      // Formato DD/MM/YYYY o DD-MM-YYYY
      const numericMatch = dateString.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (numericMatch) {
        const day = parseInt(numericMatch[1]);
        const month = parseInt(numericMatch[2]) - 1; // JavaScript months are 0-indexed
        const year = parseInt(numericMatch[3]);
        return new Date(year, month, day);
      }
      
      // Formato "4 de septiembre de 2025"
      const spanishMatch = dateString.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
      if (spanishMatch) {
        const day = parseInt(spanishMatch[1]);
        const monthName = spanishMatch[2].toLowerCase();
        const year = parseInt(spanishMatch[3]);
        const month = monthsSpanish[monthName as keyof typeof monthsSpanish];
        
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }
      
      // Fallback: intentar parseado directo
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      
      logger.warn(`⚠️ No se pudo parsear fecha: ${dateString}`);
      return new Date();
      
    } catch (error) {
      logger.error(`❌ Error parseando fecha "${dateString}":`, error);
      return new Date();
    }
  }
}