#!/usr/bin/env tsx
/**
 * Script para investigar específicamente el buscador de jurisprudencia
 * y encontrar el botón "Ver últimas sentencias" real
 */

import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

async function main() {
  logger.info('🔍 Investigando buscador de jurisprudencia específicamente');

  const browser = await puppeteer.launch({
    headless: false, // Visible para ver qué pasa
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 30000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Navegar al buscador
    logger.info('🌐 Navegando al buscador de jurisprudencia...');
    await page.goto('https://www.corteconstitucional.gov.co/relatoria/buscador-jurisprudencia', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 8000)); // Esperar mucho tiempo para carga completa

    // 1. Tomar screenshot para análisis visual
    await page.screenshot({ path: '/tmp/buscador-jurisprudencia.png', fullPage: true });
    logger.info('📸 Screenshot guardado en /tmp/buscador-jurisprudencia.png');

    // 2. Buscar TODOS los botones y elementos clickeables
    const clickableElements = await page.evaluate(() => {
      const elements = [];
      
      // Buscar todos los elementos que podrían ser botones
      const selectors = [
        'button', 'a', 'input[type="button"]', 'input[type="submit"]', 
        'div[onclick]', 'span[onclick]', '[role="button"]',
        'div[class*="btn"]', 'span[class*="btn"]', 'div[class*="button"]'
      ];
      
      for (const selector of selectors) {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
          const text = el.textContent?.trim().toLowerCase() || '';
          const onclick = el.getAttribute('onclick') || '';
          const href = el.getAttribute('href') || '';
          const className = el.className || '';
          
          // Solo elementos que contengan palabras relacionadas
          if (text.includes('sentencia') || text.includes('última') || text.includes('reciente') ||
              text.includes('buscar') || text.includes('consulta') || text.includes('ver') ||
              onclick.includes('sentencia') || href.includes('sentencia')) {
            
            elements.push({
              tagName: el.tagName,
              text: el.textContent?.trim().substring(0, 100),
              className: className,
              onclick: onclick,
              href: href,
              id: el.id,
              isVisible: el.offsetParent !== null
            });
          }
        }
      }
      
      return elements;
    });

    logger.info('🔘 Elementos clickeables relacionados encontrados:');
    clickableElements.forEach((el, index) => {
      logger.info(`   ${index + 1}. <${el.tagName}> "${el.text}"`);
      logger.info(`      Clase: "${el.className}"`);
      logger.info(`      ID: "${el.id}"`);
      logger.info(`      Visible: ${el.isVisible}`);
      logger.info(`      OnClick: "${el.onclick}"`);
      logger.info(`      Href: "${el.href}"`);
      logger.info('      ---');
    });

    // 3. Buscar específicamente por "últimas sentencias"
    logger.info('🔍 Buscando específicamente "últimas sentencias"...');
    
    const ultimasSentenciasElements = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('*');
      
      for (const el of allElements) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('últimas sentencias') || text.includes('ultimas sentencias')) {
          results.push({
            tagName: el.tagName,
            text: el.textContent?.trim().substring(0, 200),
            className: el.className,
            id: el.id,
            innerHTML: el.innerHTML.substring(0, 300),
            isClickable: el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick || el.href
          });
        }
      }
      
      return results;
    });

    logger.info('📝 Elementos que contienen "últimas sentencias":');
    ultimasSentenciasElements.forEach((el, index) => {
      logger.info(`   ${index + 1}. <${el.tagName}> "${el.text}"`);
      logger.info(`      Clickeable: ${el.isClickable}`);
      logger.info(`      HTML: ${el.innerHTML}`);
      logger.info('      ---');
    });

    // 4. Buscar formularios y campos de búsqueda
    const forms = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const results = [];
      
      for (const form of forms) {
        const inputs = form.querySelectorAll('input, select, button');
        const formData = {
          action: form.action,
          method: form.method,
          inputs: Array.from(inputs).map(input => ({
            tagName: input.tagName,
            type: input.getAttribute('type'),
            name: input.getAttribute('name'),
            value: input.getAttribute('value'),
            placeholder: input.getAttribute('placeholder'),
            text: input.textContent?.trim()
          }))
        };
        results.push(formData);
      }
      
      return results;
    });

    logger.info('📋 Formularios encontrados:');
    forms.forEach((form, index) => {
      logger.info(`   Formulario ${index + 1}:`);
      logger.info(`      Action: ${form.action}`);
      logger.info(`      Method: ${form.method}`);
      logger.info(`      Inputs:`);
      form.inputs.forEach((input, i) => {
        logger.info(`        ${i + 1}. <${input.tagName}> type="${input.type}" name="${input.name}" value="${input.value}" placeholder="${input.placeholder}" text="${input.text}"`);
      });
      logger.info('      ---');
    });

    // 5. Buscar enlaces que puedan llevar a sentencias recientes
    const sentencesLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]');
      const results = [];
      
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        
        // Buscar enlaces que puedan contener sentencias de 2025
        if (href.includes('2025') || href.includes('relatoria') || 
            text.includes('2025') || text.includes('septiembre') ||
            href.match(/[tc]-\d+/i)) {
          results.push({
            text: text.substring(0, 100),
            href: href
          });
        }
      }
      
      return results.slice(0, 20); // Primeros 20
    });

    logger.info('🔗 Enlaces relacionados con sentencias de 2025:');
    sentencesLinks.forEach((link, index) => {
      logger.info(`   ${index + 1}. "${link.text}" -> ${link.href}`);
    });

    logger.info('✅ Investigación completada. Revisa los logs para encontrar el botón correcto.');
    
  } catch (error) {
    logger.error('❌ Error durante la investigación:', error);
  } finally {
    // Mantener abierto por 30 segundos para inspección manual
    logger.info('🕐 Manteniendo navegador abierto por 30 segundos para inspección...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Error fatal en la investigación:', error);
    process.exit(1);
  });
}