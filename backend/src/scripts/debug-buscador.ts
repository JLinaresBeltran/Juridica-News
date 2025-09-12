#!/usr/bin/env tsx

/**
 * Script de diagnóstico para inspeccionar el buscador de jurisprudencia
 */

import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

async function debugBuscador() {
  logger.info('🔍 Iniciando diagnóstico del buscador de jurisprudencia...');

  const browser = await puppeteer.launch({
    headless: false, // Mostrar browser para depurar
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
    timeout: 30000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    logger.info('🌐 Navegando al buscador...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Esperar a que la página cargue completamente
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Obtener información básica de la página
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        totalLinks: document.querySelectorAll('a[href]').length,
        totalElements: document.querySelectorAll('*').length,
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });

    logger.info('📄 Información de la página:', pageInfo);

    // Buscar enlaces que contengan patrones de sentencias
    const sentenceLinks = await page.evaluate(() => {
      const links = [];
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      
      console.log('Total enlaces encontrados:', allLinks.length);
      
      for (let i = 0; i < Math.min(allLinks.length, 50); i++) { // Solo primeros 50 para diagnóstico
        const link = allLinks[i];
        const href = link.getAttribute('href') || '';
        const text = (link.textContent || '').trim();
        const title = link.getAttribute('title') || '';
        
        // Buscar cualquier patrón que pueda ser una sentencia
        const fullContent = (text + ' ' + title + ' ' + href).toLowerCase();
        
        if (fullContent.match(/[tcs][-\s]*\d+[-\/]\d+/i) || 
            fullContent.match(/sentencia/i) ||
            fullContent.match(/tutela/i) ||
            fullContent.match(/constitucional/i) ||
            href.includes('.htm') ||
            href.includes('.pdf')) {
          
          links.push({
            href,
            text: text.substring(0, 100),
            title,
            fullContent: fullContent.substring(0, 150)
          });
        }
      }
      
      return links;
    });

    logger.info(`🔗 Enlaces potenciales encontrados: ${sentenceLinks.length}`);
    
    sentenceLinks.forEach((link, index) => {
      logger.info(`${index + 1}. ${link.text} | ${link.href}`);
    });

    // También buscar formularios o botones de búsqueda
    const searchElements = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form')).map(f => f.outerHTML.substring(0, 200));
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).map(i => i.outerHTML);
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => b.outerHTML.substring(0, 100));
      
      return { forms, inputs, buttons };
    });

    logger.info('🔍 Elementos de búsqueda encontrados:');
    logger.info('Formularios:', searchElements.forms.length);
    logger.info('Inputs:', searchElements.inputs.length);
    logger.info('Botones:', searchElements.buttons.length);

    // Hacer una pausa para inspección manual si es necesario
    logger.info('⏸️ Pausa de 10 segundos para inspección manual...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    logger.error('❌ Error en diagnóstico:', error);
  } finally {
    await browser.close();
    logger.info('🔒 Browser cerrado');
  }
}

debugBuscador().catch(console.error);