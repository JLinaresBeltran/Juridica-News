#!/usr/bin/env tsx
/**
 * Script de diagnóstico para examinar el contenido real del sitio de la Corte Constitucional
 */

import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

async function main() {
  logger.info('🔍 Diagnóstico del sitio de la Corte Constitucional');

  const browser = await puppeteer.launch({
    headless: false, // Visible para depuración
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    timeout: 30000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // 1. Examinar página principal
    logger.info('🌐 Navegando a la página principal...');
    await page.goto('https://www.corteconstitucional.gov.co', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Buscar botones y enlaces relacionados con "sentencias"
    const buttons = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('button, a, div[onclick], span[onclick]');
      
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() || '';
        const onclick = el.getAttribute('onclick') || '';
        const href = el.getAttribute('href') || '';
        
        if (text.includes('sentencia') || text.includes('jurisprudencia') || 
            text.includes('últimas') || text.includes('reciente') ||
            href.includes('sentencia') || href.includes('jurisprudencia') ||
            onclick.includes('sentencia')) {
          results.push({
            tagName: el.tagName,
            text: text.substring(0, 100),
            href: href,
            onclick: onclick,
            classes: el.className
          });
        }
      }
      
      return results;
    });

    logger.info('📋 Elementos encontrados relacionados con sentencias:');
    buttons.forEach((btn, index) => {
      logger.info(`   ${index + 1}. <${btn.tagName}> "${btn.text}" ${btn.href ? `href="${btn.href}"` : ''} ${btn.classes ? `class="${btn.classes}"` : ''}`);
    });

    // 2. Buscar tablas en la página principal
    const tables = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, .table, [role="table"]');
      const results = [];
      
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = table.querySelectorAll('tr');
        const text = table.textContent?.substring(0, 300) || '';
        
        if (text.toLowerCase().includes('sentencia') || 
            text.toLowerCase().includes('fecha') ||
            text.toLowerCase().includes('expediente')) {
          results.push({
            index: i,
            rowCount: rows.length,
            text: text,
            headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()).join(' | ')
          });
        }
      }
      
      return results;
    });

    logger.info('📊 Tablas encontradas con contenido relevante:');
    tables.forEach((table, index) => {
      logger.info(`   Tabla ${index + 1}: ${table.rowCount} filas`);
      logger.info(`      Headers: ${table.headers}`);
      logger.info(`      Contenido: ${table.text.substring(0, 150)}...`);
    });

    // 3. Navegar a relatoria específicamente
    logger.info('🌐 Navegando a relatoria...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Buscar contenido con patrones de sentencias
    const sentencePatterns = await page.evaluate(() => {
      const results = [];
      const allText = document.body.textContent || '';
      
      // Buscar patrones de sentencias
      const patterns = [
        /T-\d{1,4}\/\d{2,4}/gi,
        /C-\d{1,4}\/\d{2,4}/gi,
        /SU-\d{1,4}\/\d{2,4}/gi,
        /A-\d{1,4}\/\d{2,4}/gi
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(allText)) !== null && results.length < 20) {
          results.push(match[0]);
        }
      }
      
      return [...new Set(results)]; // Eliminar duplicados
    });

    logger.info('📄 Patrones de sentencias encontrados en relatoria:');
    sentencePatterns.forEach((pattern, index) => {
      logger.info(`   ${index + 1}. ${pattern}`);
    });

    // 4. Buscar enlaces directos a documentos RTF/DOCX
    const documentLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]');
      const results = [];
      
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        
        if (href.includes('.rtf') || href.includes('.doc') || href.includes('.pdf') ||
            href.includes('sentencias') || href.includes('providencias')) {
          results.push({
            text: text.substring(0, 50),
            href: href
          });
        }
      }
      
      return results.slice(0, 10); // Solo los primeros 10
    });

    logger.info('📎 Enlaces a documentos encontrados:');
    documentLinks.forEach((link, index) => {
      logger.info(`   ${index + 1}. "${link.text}" -> ${link.href}`);
    });

    // 5. Examinar páginas específicas de tutela
    logger.info('🌐 Navegando a tutela...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/tutela.php', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const tutelaContent = await page.evaluate(() => {
      const sentences = [];
      const allElements = document.querySelectorAll('*');
      
      for (const el of allElements) {
        const text = el.textContent || '';
        const matches = text.match(/T-\d{1,4}\/\d{2,4}/gi);
        
        if (matches) {
          matches.forEach(match => {
            if (!sentences.find(s => s.id === match)) {
              sentences.push({
                id: match,
                context: text.substring(0, 100),
                tagName: el.tagName
              });
            }
          });
        }
      }
      
      return sentences.slice(0, 10);
    });

    logger.info('⚖️ Sentencias de tutela encontradas:');
    tutelaContent.forEach((sentence, index) => {
      logger.info(`   ${index + 1}. ${sentence.id} en <${sentence.tagName}>`);
      logger.info(`      Contexto: ${sentence.context}...`);
    });

    logger.info('✅ Diagnóstico completado. Revisa los resultados arriba para entender el contenido disponible.');

  } catch (error) {
    logger.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Error fatal en el diagnóstico:', error);
    process.exit(1);
  });
}