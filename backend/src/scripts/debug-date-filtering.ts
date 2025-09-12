#!/usr/bin/env tsx
/**
 * Script de diagnóstico específico para verificar el filtrado de fechas
 * Mostrará exactamente qué fechas hay disponibles vs qué fechas estamos buscando
 */

import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

async function main() {
  logger.info('🔍 Diagnóstico del filtrado de fechas en "Ver últimas sentencias"');

  const browser = await puppeteer.launch({
    headless: false, // Visible para ver exactamente qué pasa
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 30000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // 1. Navegar al buscador
    logger.info('🌐 Navegando al buscador de jurisprudencia...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Hacer click en "Ver últimas sentencias"
    logger.info('🔍 Haciendo click en "Ver últimas sentencias"...');
    
    const clickSuccess = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button.btn.btn-corte.rounded-0.btn-outline-primary');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('ver últimas sentencias')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!clickSuccess) {
      throw new Error('No se pudo hacer click en "Ver últimas sentencias"');
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar carga

    // 3. Generar fechas objetivo
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDates = [
      {
        label: 'HOY',
        date: today,
        dateShort: `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`,
        dateAlt: `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`,
        dateStr: `${today.getDate()} de septiembre de ${today.getFullYear()}`
      },
      {
        label: 'AYER',
        date: yesterday,
        dateShort: `${yesterday.getDate().toString().padStart(2, '0')}/${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getFullYear()}`,
        dateAlt: `${yesterday.getDate().toString().padStart(2, '0')}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getFullYear()}`,
        dateStr: `${yesterday.getDate()} de septiembre de ${yesterday.getFullYear()}`
      }
    ];

    logger.info('📅 Fechas objetivo calculadas:');
    targetDates.forEach(d => {
      logger.info(`   ${d.label}: ${d.dateShort} / ${d.dateAlt} / ${d.dateStr}`);
    });

    // 4. Analizar tablas disponibles
    const tableAnalysis = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, .table, [role="table"]');
      const results = [];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = table.querySelectorAll('tr');
        
        if (rows.length < 2) continue;

        // Analizar header
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(th => 
          th.textContent?.trim() || ''
        );

        // Analizar algunas filas de datos
        const sampleRows = [];
        for (let j = 1; j < Math.min(rows.length, 6); j++) { // Primeras 5 filas
          const row = rows[j];
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellData = cells.map(cell => cell.textContent?.trim() || '');
          sampleRows.push(cellData);
        }

        results.push({
          tableIndex: i,
          headerCount: headers.length,
          headers: headers,
          rowCount: rows.length - 1, // Sin header
          sampleRows: sampleRows
        });
      }

      return results;
    });

    logger.info('📊 Análisis de tablas encontradas:');
    tableAnalysis.forEach((table, index) => {
      logger.info(`   Tabla ${index + 1}:`);
      logger.info(`     Headers (${table.headerCount}): ${table.headers.join(' | ')}`);
      logger.info(`     Filas de datos: ${table.rowCount}`);
      
      if (table.sampleRows.length > 0) {
        logger.info(`     Muestra de datos:`);
        table.sampleRows.forEach((row, rowIndex) => {
          logger.info(`       Fila ${rowIndex + 1}: ${row.join(' | ')}`);
        });
      }
      logger.info('     ---');
    });

    // 5. Buscar específicamente fechas que contengan "11" o "10" y "septiembre" o "09"
    const dateAnalysis = await page.evaluate(() => {
      const results = [];
      const allText = document.body.textContent || '';
      
      // Buscar patrones de fecha
      const datePatterns = [
        /\b1[01]\/09\/2025\b/g,
        /\b1[01]-09-2025\b/g,
        /\b1[01] de septiembre de 2025\b/g,
        /\bseptiembre.*1[01]\b/gi,
        /\b1[01].*septiembre\b/gi
      ];

      for (const pattern of datePatterns) {
        let match;
        while ((match = pattern.exec(allText)) !== null && results.length < 20) {
          const context = allText.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50);
          results.push({
            pattern: pattern.source,
            match: match[0],
            context: context.replace(/\s+/g, ' ').trim()
          });
        }
      }

      return results;
    });

    logger.info('📅 Análisis de fechas encontradas en la página:');
    if (dateAnalysis.length > 0) {
      dateAnalysis.forEach((item, index) => {
        logger.info(`   ${index + 1}. "${item.match}" (patrón: ${item.pattern})`);
        logger.info(`      Contexto: ...${item.context}...`);
      });
    } else {
      logger.warn('   ❌ No se encontraron fechas de septiembre 10 u 11 de 2025');
    }

    // 6. Buscar todos los enlaces de sentencias disponibles
    const sentenceLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]');
      const results = [];

      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';

        // Buscar patrones de sentencias
        const sentencePattern = /\/relatoria\/(\d{4})\/([tcs]u?-?\d{1,4}-\d{2,4})\.htm/i;
        const match = href.match(sentencePattern);

        if (match) {
          results.push({
            year: match[1],
            sentenceId: match[2],
            href: href,
            text: text,
            fullUrl: href.startsWith('http') ? href : `https://www.corteconstitucional.gov.co${href}`
          });
        }
      }

      return results.slice(0, 10); // Primeros 10
    });

    logger.info('📄 Enlaces de sentencias encontrados:');
    sentenceLinks.forEach((link, index) => {
      logger.info(`   ${index + 1}. ${link.sentenceId} (${link.year}) - ${link.text}`);
      logger.info(`      URL: ${link.fullUrl}`);
    });

    // 7. Verificar si existe la tabla estructurada con 7 columnas
    const structuredTableCheck = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, .table, [role="table"]');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) continue;

        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(th => 
          th.textContent?.toLowerCase().trim() || ''
        );

        // Verificar si tiene las columnas esperadas
        const hasNo = headers.some(h => h.includes('no'));
        const hasFechaPublicacion = headers.some(h => h.includes('fecha') && h.includes('publicación'));
        const hasNumero = headers.some(h => h.includes('número') || h.includes('numero'));
        const hasExpediente = headers.some(h => h.includes('expediente'));
        const hasFechaSentencia = headers.some(h => h.includes('fecha') && h.includes('sentencia'));
        const hasTipo = headers.some(h => h.includes('tipo'));
        const hasTema = headers.some(h => h.includes('tema'));

        if (hasNo && hasFechaPublicacion && hasNumero && hasExpediente && hasFechaSentencia && hasTipo && hasTema) {
          // Encontramos la tabla estructurada
          const allRows = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length >= 7) {
              const cellData = cells.map(cell => cell.textContent?.trim() || '');
              allRows.push(cellData);
            }
          }

          return {
            found: true,
            headers: headers,
            totalRows: allRows.length,
            allRows: allRows
          };
        }
      }

      return { found: false };
    });

    if (structuredTableCheck.found) {
      logger.info('✅ Tabla estructurada con 7 columnas encontrada:');
      logger.info(`   Headers: ${structuredTableCheck.headers.join(' | ')}`);
      logger.info(`   Total filas: ${structuredTableCheck.totalRows}`);
      logger.info('   Todas las filas de datos:');
      
      structuredTableCheck.allRows.forEach((row, index) => {
        const fechaPublicacion = row[1];
        logger.info(`     ${index + 1}. ${row.join(' | ')}`);
        
        // Verificar si esta fila contiene nuestras fechas objetivo
        const isTargetDate = targetDates.some(targetDate => {
          return fechaPublicacion.includes(targetDate.dateShort) || 
                 fechaPublicacion.includes(targetDate.dateAlt) ||
                 fechaPublicacion.includes(targetDate.dateStr);
        });
        
        if (isTargetDate) {
          logger.info(`       ✅ ESTA FILA COINCIDE CON NUESTRAS FECHAS OBJETIVO`);
        }
      });
    } else {
      logger.warn('❌ No se encontró tabla estructurada con las 7 columnas esperadas');
    }

    logger.info('✅ Diagnóstico completado.');
    
  } catch (error) {
    logger.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Mantener abierto 10 segundos
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Error fatal en el diagnóstico:', error);
    process.exit(1);
  });
}