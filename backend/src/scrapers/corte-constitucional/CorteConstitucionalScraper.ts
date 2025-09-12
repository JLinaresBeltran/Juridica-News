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
            logger.debug(`⏩ OMITIENDO ${linkData.documentId} - Ya existe`);
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

          if (documentVerification.success) {
            logger.debug(`✅ Documento RTF verificado: ${linkData.documentId}`);
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

          // 🔥 EXTRAER METADATOS DEL CONTENIDO RTF ANTES DE CREAR EL DOCUMENTO FINAL
          let finalMetadata = documentMetadata;
          
          if (documentVerification.success && documentVerification.extractedText) {
            try {
              const { documentMetadataExtractor } = await import('@/services/DocumentMetadataExtractor');
              const extractedMetadata = await documentMetadataExtractor.extractMetadata({
                content: documentVerification.extractedText
              });
              
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
            summary: `${linkData.title} - Documento oficial de la Corte Constitucional de Colombia${documentVerification.success ? ' (RTF verificado)' : ''}`,
            metadata: finalMetadata  // ✅ Usar metadatos finales que incluyen extractedMetadata
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
                  const htmlUrl = `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${urlSafeName}.htm`;
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
          
          // Extraer metadatos del contenido del documento si tenemos texto extraído
          let extractedMetadata: any = null;
          if (rtfVerification.success && rtfVerification.extractedText) {
            try {
              const { documentMetadataExtractor } = await import('@/services/DocumentMetadataExtractor');
              extractedMetadata = await documentMetadataExtractor.extractMetadata({
                content: rtfVerification.extractedText
              });
              
              if (extractedMetadata) {
                logger.info(`🔍 Metadatos extraídos del RTF - Magistrado: ${extractedMetadata.magistradoPonente || 'N/A'}, Expediente: ${extractedMetadata.expediente || 'N/A'}, Sala: ${extractedMetadata.salaRevision || 'N/A'}`);
              }
            } catch (metadataError) {
              logger.warn(`⚠️ Error extrayendo metadatos de ${sentence.documentId}:`, metadataError);
            }
          }
          
          // Crear el objeto de documento
          const document = {
            documentId: sentence.documentId,
            title: sentence.title,
            url: sentence.url,
            content: rtfVerification.extractedText || `Documento jurídico extraído: ${sentence.documentId}\n\nURL: ${sentence.url}\nTipo: SENTENCIA\n\nEste documento fue extraído del sitio web oficial de la Corte Constitucional de Colombia.`,
            summary: `${sentence.documentId} - Documento oficial de la Corte Constitucional de Colombia (RTF procesado)`,
            documentType: 'SENTENCE' as const,
            legalArea: 'CONSTITUTIONAL' as const,
            extractionDate: new Date(),
            publicationDate: new Date(),
            metadata: {
              extractionMethod: 'puppeteer-typescript-v3',
              extractionVersion: 'v3-with-rtf-verification',
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
      logger.error('❌ Error extrayendo sentencias de "Ver últimas sentencias":', (error as Error).message);
    }
    
    return results;
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
        logger.debug(`📋 Documento ${documentId} YA EXISTE en BD (ID: ${existingDoc.id}) - OMITIENDO`);
        return true;
      }

      // También verificar por archivo descargado localmente
      const fs = require('fs');
      const path = require('path');
      const downloadPath = path.join(process.cwd(), 'test_documents', `${documentId}.rtf`);
      
      if (fs.existsSync(downloadPath)) {
        logger.debug(`📁 Documento ${documentId} YA EXISTE como archivo local - OMITIENDO`);
        return true;
      }

      logger.debug(`🆕 Documento ${documentId} es NUEVO - PROCESAR`);
      return false;
    } catch (error) {
      logger.warn(`⚠️ Error verificando duplicado para ${documentId}: ${(error as Error).message}`);
      return false; // En caso de error, procesar el documento
    }
  }

  private getTodayAndYesterdayWorkingDays(): Array<{
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
    
    logger.info(`🔍 Buscando HOY y AYER (solo días hábiles) desde: ${today.toLocaleDateString('es-CO')}`);
    
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
      
      // URL correcta basada en la inspección del HTML de las páginas individuales
      const primaryUrl = `https://www.corteconstitucional.gov.co/sentencias/${currentYear}/${normalizedId}.rtf`;
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
    extractedText?: string;
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
      
      // Verificar que sea un documento válido con validación estricta
      const isValidDocument = 
        contentType.includes('application/rtf') ||
        contentType.includes('application/msword') ||
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('text/rtf');
      
      // Rechazar explícitamente archivos HTML
      const isHtmlDocument = 
        contentType.includes('text/html') ||
        contentType.includes('application/html');
      
      if (isHtmlDocument) {
        return {
          success: false,
          error: `Archivo HTML no válido como documento RTF/DOCX: ${contentType}`
        };
      }
      
      if (!isValidDocument) {
        return {
          success: false,
          error: `Tipo de contenido no válido: ${contentType}. Solo se aceptan RTF/DOCX.`
        };
      }
      
      // Descargar el contenido del documento
      const buffer = Buffer.from(await response.arrayBuffer());
      
      let extractedText = '';
      
      try {
        // ⚠️ IMPORTANTE: Los archivos de Corte Constitucional con extensión .rtf son realmente DOCX
        // Usar siempre DocumentTextExtractor (mammoth) independientemente del content-type
        
        const { documentTextExtractor } = await import('@/services/DocumentTextExtractor');
        const extraction = await documentTextExtractor.extractFromBuffer(buffer, `${documentId}.docx`);
        
        if (extraction) {
          extractedText = extraction.fullText;
          logger.debug(`📖 Texto extraído con mammoth (DOCX real): ${extractedText.length} caracteres`);
        } else {
          logger.warn(`⚠️ No se pudo extraer texto con mammoth de ${documentId}`);
        }
        
      } catch (textError) {
        logger.warn(`⚠️ Error extrayendo texto de ${documentId}: ${textError}`);
        // Continuar sin texto extraído
      }
      
      // Si llegamos aquí, el documento es válido y accesible
      logger.debug(`✅ Documento RTF/DOCX verificado y descargado: ${documentId}`);
      
      return {
        success: true,
        isValidOffice: true,
        contentType,
        localPath: url,
        extractedText
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