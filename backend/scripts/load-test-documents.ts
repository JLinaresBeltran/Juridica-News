#!/usr/bin/env ts-node

/**
 * Script para cargar documentos de prueba en la base de datos
 * Ejecutar: npx ts-node scripts/load-test-documents.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
// @ts-ignore - mammoth no tiene tipos oficiales
import mammoth from 'mammoth';

const prisma = new PrismaClient();

// Función para extraer texto de RTF (básico)
function extractTextFromRTF(rtfContent: string): string {
  // Remover comandos RTF básicos
  let text = rtfContent
    .replace(/\\[a-z]+\d*\s?/g, ' ') // Comandos RTF
    .replace(/[{}]/g, ' ')           // Llaves
    .replace(/\\\'/g, "'")           // Comillas escapadas
    .replace(/\\-/g, '-')            // Guiones escapados
    .replace(/\s+/g, ' ')            // Espacios múltiples
    .trim();
  
  return text;
}

// Función para extraer texto de archivos DOCX (que tienen extensión .rtf)
async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error(`Error extrayendo texto de DOCX: ${error}`);
    throw error;
  }
}

// Función para detectar si un archivo es realmente DOCX basado en su contenido
async function isDocxFile(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filePath);
    // Los archivos DOCX empiezan con la secuencia PK (ZIP header)
    return buffer[0] === 0x50 && buffer[1] === 0x4B;
  } catch (error) {
    return false;
  }
}

// Función para extraer título del contenido
function extractTitleFromContent(content: string): string {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  // Buscar líneas que parezcan títulos
  for (const line of lines.slice(0, 10)) { // Revisar primeras 10 líneas
    const trimmed = line.trim();
    
    // Buscar patrones de sentencias
    if (trimmed.match(/sentencia\s+[TCL]-\d+\/\d+/i)) {
      return trimmed.substring(0, 100); // Limitar longitud
    }
    
    // O usar la primera línea significativa
    if (trimmed.length > 20 && trimmed.length < 150) {
      return trimmed;
    }
  }
  
  return 'Documento sin título identificado';
}

// Función para determinar el área legal basada en el tipo de sentencia
function getLegalArea(title: string): string {
  if (title.match(/T-\d+\/\d+/i)) return 'Derechos Fundamentales';
  if (title.match(/C-\d+\/\d+/i)) return 'Control Constitucional';
  if (title.match(/SU-\d+\/\d+/i)) return 'Unificación de Jurisprudencia';
  if (title.match(/A-\d+\/\d+/i)) return 'Auto';
  return 'General';
}

// Función principal
async function loadTestDocuments() {
  const testDocsPath = path.join(__dirname, '../services/scraping/test_documents');
  
  try {
    console.log('🔍 Buscando documentos en:', testDocsPath);
    
    const files = await fs.readdir(testDocsPath);
    const documentFiles = files.filter(file => 
      file.endsWith('.rtf') || 
      file.endsWith('.txt') || 
      file.endsWith('.html')
    );
    
    if (documentFiles.length === 0) {
      console.log('⚠️  No se encontraron documentos para cargar');
      console.log('   Coloca archivos .rtf, .txt o .html en:', testDocsPath);
      return;
    }
    
    console.log(`📄 Encontrados ${documentFiles.length} documentos:`);
    documentFiles.forEach(file => console.log(`   - ${file}`));
    
    for (const filename of documentFiles) {
      const filePath = path.join(testDocsPath, filename);
      
      console.log(`\n📖 Procesando: ${filename}`);
      
      try {
        // Extraer texto según el tipo de archivo
        let content = '';
        
        if (filename.endsWith('.rtf')) {
          // Verificar si es realmente DOCX con extensión .rtf
          const isDocx = await isDocxFile(filePath);
          
          if (isDocx) {
            console.log(`   🔍 Detectado archivo DOCX con extensión .rtf`);
            content = await extractTextFromDOCX(filePath);
          } else {
            // Es RTF real
            const rawContent = await fs.readFile(filePath, 'utf-8');
            content = extractTextFromRTF(rawContent);
          }
        } else {
          // Para archivos .txt, .html, etc.
          const rawContent = await fs.readFile(filePath, 'utf-8');
          content = rawContent;
        }
        
        if (content.length < 100) {
          console.log(`⚠️  Archivo muy corto (${content.length} caracteres), saltando...`);
          continue;
        }
        
        // Extraer información
        const title = extractTitleFromContent(content);
        const legalArea = getLegalArea(title);
        
        console.log(`   📝 Título: ${title}`);
        console.log(`   📊 Área: ${legalArea}`);
        console.log(`   📏 Contenido: ${content.length} caracteres`);
        
        // Verificar si ya existe un documento con el mismo título
        const existingDoc = await prisma.document.findFirst({
          where: { title }
        });
        
        if (existingDoc) {
          console.log(`   ⚠️  Ya existe, actualizando contenido...`);
          
          // Actualizar documento existente
          await prisma.document.update({
            where: { id: existingDoc.id },
            data: {
              content,
              updatedAt: new Date(),
            }
          });
          
          console.log(`   ✅ Documento actualizado: ${existingDoc.id}`);
        } else {
          // Crear nuevo documento
          const newDoc = await prisma.document.create({
            data: {
              title,
              content,
              url: `file://${filePath}`, // URL ficticia para referencia
              source: 'test_local',
              legalArea,
              documentType: 'Sentencia',
              status: 'PENDING',
              priority: 'MEDIUM',
              publicationDate: new Date(),
              extractionDate: new Date(),
              confidenceScore: 0.95, // Alta confianza para docs locales
              keywords: '',
              relevanceTags: '',
              metadata: JSON.stringify({ 
                sourceFile: filename,
                loadedAt: new Date().toISOString()
              }),
            }
          });
          
          console.log(`   ✅ Documento creado: ${newDoc.id}`);
        }
        
      } catch (fileError) {
        console.error(`   ❌ Error procesando ${filename}:`, fileError);
      }
    }
    
    // Mostrar estadísticas finales
    const totalDocs = await prisma.document.count();
    const docsWithContent = await prisma.document.count({
      where: {
        content: { 
          not: {
            equals: null
          }
        }
      }
    });
    
    console.log(`\n📊 Estadísticas finales:`);
    console.log(`   📄 Total documentos: ${totalDocs}`);
    console.log(`   ✅ Con contenido: ${docsWithContent}`);
    console.log(`   🤖 Listos para análisis IA: ${docsWithContent}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  loadTestDocuments()
    .then(() => {
      console.log('\n🎉 ¡Carga completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { loadTestDocuments };