#!/usr/bin/env tsx

/**
 * Script simple para inspeccionar el buscador
 */

import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

async function simpleDiagnosis() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 30000
  });

  const page = await browser.newPage();

  try {
    logger.info('🌐 Navegando al buscador...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // Información básica
    const title = await page.title();
    const url = page.url();
    
    logger.info(`Título: ${title}`);
    logger.info(`URL final: ${url}`);

    // Contar enlaces
    const linkCount = await page.$$eval('a[href]', links => links.length);
    logger.info(`Total enlaces: ${linkCount}`);

    // Buscar texto que contenga números de sentencia
    const hasContent = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const has2024 = bodyText.includes('2024');
      const has2025 = bodyText.includes('2025'); 
      const hasTutela = bodyText.toLowerCase().includes('tutela');
      const hasConstitucional = bodyText.toLowerCase().includes('constitucional');
      
      return { has2024, has2025, hasTutela, hasConstitucional, textLength: bodyText.length };
    });

    logger.info('Contenido encontrado:', hasContent);

    // Buscar algunos enlaces específicos
    const sampleLinks = await page.$$eval('a[href]', links => 
      links.slice(0, 10).map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim().substring(0, 50) || ''
      }))
    );

    logger.info('Muestra de enlaces:');
    sampleLinks.forEach((link, i) => {
      logger.info(`${i + 1}. ${link.text} -> ${link.href}`);
    });

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await browser.close();
  }
}

simpleDiagnosis().catch(console.error);