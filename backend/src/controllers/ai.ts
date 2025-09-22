import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { imageStorageService } from '../services/ImageStorageService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const generateArticleSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['gpt4o-mini', 'gemini']).optional(),
  maxWords: z.number().min(100).max(600).default(600),
  tone: z.enum(['professional', 'academic', 'accessible']).default('professional'), // Por defecto usa tono profesional
  customInstructions: z.string().optional(),
});

const generateTitlesSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['gpt4o-mini', 'gemini']).optional(),
  style: z.enum(['serious', 'catchy', 'educational']),
  count: z.number().min(1).max(5).default(3),
  articleContent: z.string().min(1), // Contenido del artículo generado requerido
  includeSubtitle: z.boolean().default(true), // Incluir subtítulos H2 para SEO
});

const generateImagesSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['dalle', 'gemini']).optional(),
  prompt: z.string().optional(),
  style: z.enum(['persona', 'paisaje', 'elemento', 'professional', 'conceptual', 'abstract']).default('paisaje'),
  count: z.number().min(1).max(3).default(1),
});

const generateMetadataSchema = z.object({
  articleContent: z.string().min(1),
  articleTitle: z.string().min(1),
  section: z.string().min(1),
  model: z.enum(['gpt4o-mini', 'gemini']).optional(),
});

const selectTitleSchema = z.object({
  documentId: z.string().cuid(),
  selectedTitle: z.string().min(1),
  style: z.enum(['serious', 'catchy', 'educational'])
});

const getGeneratedContentSchema = z.object({
  documentId: z.string().cuid()
});

/**
 * @swagger
 * /api/ai/generate-article:
 *   post:
 *     summary: Generate complete article from legal document using AI
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate-article', validateRequest(generateArticleSchema), async (req: Request, res: Response) => {
  try {
    const { documentId, model, maxWords, tone, customInstructions } = req.body;

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Import AI service
    const { aiAnalysisService } = await import('../services/AiAnalysisService');
    
    // Generate article using AI
    const articleContent = await generateArticleWithAI(
      document, 
      model || 'gpt4o-mini', 
      maxWords, 
      tone,
      customInstructions
    );

    if (!articleContent) {
      return res.status(500).json({
        error: 'Failed to generate article content'
      });
    }

    // Guardar el artículo generado en la base de datos
    await prisma.document.update({
      where: { id: documentId },
      data: {
        generatedArticle: articleContent.content,
        articleModel: articleContent.modelUsed,
        articleGeneratedAt: new Date(),
        // Si se pasó un tono específico, guardarlo como estilo
        articleStyle: tone === 'accessible' ? 'educational' : 'serious'
      }
    });

    res.json({
      data: articleContent,
      message: 'Article generated successfully'
    });

    logger.info('AI article generation completed', {
      documentId,
      userId: req.user.id,
      model: articleContent.modelUsed,
      wordCount: articleContent.wordCount,
      saved: true
    });

  } catch (error) {
    logger.error('AI article generation error', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to generate article',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/ai/generate-titles:
 *   post:
 *     summary: Generate article titles using AI
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate-titles', validateRequest(generateTitlesSchema), async (req: Request, res: Response) => {
  try {
    const { documentId, model, style, count, articleContent, includeSubtitle } = req.body;

    // DEBUG: Log de los parámetros recibidos
    logger.info('🎯 DEBUG: /generate-titles - Parámetros recibidos:', {
      documentId,
      model: model || 'gpt4o-mini',
      style,
      count,
      articleContentLength: articleContent?.length || 0,
      articleContentPreview: articleContent?.substring(0, 200) + '...' || 'N/A'
    });

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      logger.warn('🚫 DEBUG: Documento no encontrado:', { documentId });
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // DEBUG: Log de documento encontrado
    logger.info('📄 DEBUG: Documento encontrado:', {
      id: document.id,
      title: document.title,
      documentType: document.documentType,
      area: document.area
    });

    // Generate titles using AI
    const titles = await generateTitlesWithAI(document, model || 'gpt4o-mini', style, count, articleContent, includeSubtitle);

    if (!titles) {
      return res.status(500).json({
        error: 'Failed to generate titles'
      });
    }

    // Guardar los títulos generados en la base de datos
    await prisma.document.update({
      where: { id: documentId },
      data: {
        generatedTitles: JSON.stringify(titles.titles),
        titleStyle: style,
        titleModel: titles.modelUsed,
        titlesGeneratedAt: new Date()
      }
    });

    res.json({
      data: titles,
      message: 'Titles generated successfully'
    });

    logger.info('AI title generation completed', {
      documentId,
      userId: req.user.id,
      style,
      count: titles.titles.length,
      saved: true
    });

  } catch (error) {
    logger.error('AI title generation error', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to generate titles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/ai/generate-images:
 *   post:
 *     summary: Generate images for articles
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate-images', validateRequest(generateImagesSchema), async (req: Request, res: Response) => {
  try {
    const { documentId, model, prompt, style, count } = req.body;

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Generate images using AI
    const images = await generateImagesWithAI(document, model || 'dalle', prompt, style, count);

    if (!images) {
      return res.status(500).json({
        error: 'Failed to generate images'
      });
    }

    res.json({
      data: images,
      message: 'Images generated successfully'
    });

    logger.info('AI image generation completed', {
      documentId,
      userId: req.user.id,
      model: model || 'dalle',
      count: images.images.length
    });

  } catch (error) {
    logger.error('AI image generation error', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to generate images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/ai/generate-metadata:
 *   post:
 *     summary: Generate SEO metadata for articles using AI
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate-metadata', validateRequest(generateMetadataSchema), async (req: Request, res: Response) => {
  try {
    const { articleContent, articleTitle, section, model } = req.body;

    logger.info('🎯 Generando metadata SEO con IA', {
      articleTitleLength: articleTitle.length,
      articleContentLength: articleContent.length,
      section,
      model: model || 'gpt4o-mini',
      userId: req.user.id
    });

    // Generate metadata using AI
    const metadata = await generateMetadataWithAI(
      articleContent,
      articleTitle,
      section,
      model || 'gpt4o-mini'
    );

    if (!metadata) {
      return res.status(500).json({
        error: 'Failed to generate metadata'
      });
    }

    res.json({
      data: metadata,
      message: 'Metadata generated successfully'
    });

    logger.info('✅ Metadata SEO generada exitosamente', {
      userId: req.user.id,
      model: metadata.modelUsed,
      descriptionLength: metadata.description.length,
      keywordsCount: metadata.keywords.length,
      hasSchemaDescription: !!metadata.schemaDescription
    });

  } catch (error) {
    logger.error('❌ Error generando metadata SEO', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to generate metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/ai/available-models:
 *   get:
 *     summary: Get available AI models based on API keys
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /api/ai/select-title:
 *   post:
 *     summary: Save selected title for a document
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
router.post('/select-title', validateRequest(selectTitleSchema), async (req: Request, res: Response) => {
  try {
    const { documentId, selectedTitle, style } = req.body;

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Save selected title
    await prisma.document.update({
      where: { id: documentId },
      data: {
        selectedTitle,
        titleStyle: style,
        updatedAt: new Date()
      }
    });

    res.json({
      data: {
        documentId,
        selectedTitle,
        style
      },
      message: 'Title selected successfully'
    });

    logger.info('Title selected and saved', {
      documentId,
      userId: req.user.id,
      selectedTitle,
      style
    });

  } catch (error) {
    logger.error('Error selecting title', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to select title',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/available-models', async (req: Request, res: Response) => {
  try {
    const availableModels = {
      'gpt4o-mini': !!process.env.OPENAI_API_KEY,
      'gemini': !!process.env.GEMINI_API_KEY,
      'dalle': !!process.env.OPENAI_API_KEY
    };

    res.json({
      data: availableModels
    });

  } catch (error) {
    logger.error('Error checking available models', { error });
    res.status(500).json({
      error: 'Failed to check available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions for AI generation
async function generateArticleWithAI(
  document: any,
  model: 'gpt4o-mini' | 'gemini',
  maxWords: number,
  tone: string,
  customInstructions?: string
) {
  try {
    logger.info('🚀 DEBUG: Iniciando generación de artículo con AI', {
      documentId: document.id,
      documentTitle: document.title,
      model,
      maxWords,
      tone,
      hasCustomInstructions: !!customInstructions,
      customInstructions: customInstructions || 'N/A'
    });

    const { aiAnalysisService } = await import('../services/AiAnalysisService');

    // Get full document content - use fullTextContent if available, fallback to content
    let documentContent = document.fullTextContent || document.content;
    
    // If no content stored, try to fetch from URL
    if (!documentContent || documentContent.length < 100) {
      if (document.url) {
        try {
          const response = await fetch(document.url);
          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            const buffer = await response.arrayBuffer();
            const bufferData = Buffer.from(buffer);
            
            logger.info('🌐 DEBUG: Contenido descargado', {
              url: document.url,
              contentType,
              bufferSize: bufferData.length,
              isDocx: bufferData.length > 4 && bufferData.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))
            });
            
            // Si es DOCX/RTF, extraer texto usando DocumentTextExtractor
            if (bufferData.length > 4 && bufferData.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
              logger.info('📄 DEBUG: Detectado archivo DOCX, usando DocumentTextExtractor');
              const { documentTextExtractor } = await import('../services/DocumentTextExtractor');
              const extractedContent = await documentTextExtractor.extractFromBuffer(bufferData, document.title);
              
              if (extractedContent) {
                documentContent = extractedContent.fullText;
                logger.info('✅ DEBUG: Texto extraído exitosamente', {
                  originalSize: bufferData.length,
                  extractedLength: documentContent.length,
                  wordCount: extractedContent.metadata.wordCount,
                  hasStructure: extractedContent.metadata.hasStructure
                });
              } else {
                logger.warn('⚠️  No se pudo extraer texto del DOCX');
                documentContent = bufferData.toString('utf-8', 0, Math.min(bufferData.length, 10000));
              }
            } else {
              // Si no es DOCX, tratar como texto plano
              documentContent = bufferData.toString('utf-8');
            }
          }
        } catch (fetchError) {
          logger.warn(`Could not fetch content from URL: ${fetchError}`);
        }
      }
    }

    if (!documentContent || documentContent.length < 100) {
      throw new Error('Insufficient document content for article generation');
    }

    logger.info('🔍 DEBUG: Contenido del documento procesado', {
      contentLength: documentContent.length,
      contentPreview: documentContent.substring(0, 200) + '...',
      documentFields: {
        title: document.title,
        legal_area: document.legal_area,
        document_type: document.document_type,
        source: document.source,
        url: document.url
      }
    });

    // Use appropriate model for article generation
    const modelToUse = model === 'gemini' ? 'gemini' : 'openai';
    
    logger.info('🤖 DEBUG: Modelo seleccionado', {
      requestedModel: model,
      actualModel: modelToUse
    });
    
    // Generate article using AI service with specialized prompt
    const articleResult = await generateArticleContentWithAI(
      documentContent,
      document,
      modelToUse,
      maxWords,
      tone,
      customInstructions
    );

    return articleResult;

  } catch (error) {
    logger.error(`Error generating article: ${error}`);
    return null;
  }
}

async function generateArticleContentWithAI(
  content: string,
  document: any,
  model: 'openai' | 'gemini',
  maxWords: number,
  tone: string,
  customInstructions?: string
) {
  logger.info('📝 DEBUG: Generando contenido con AI', {
    model,
    maxWords,
    tone,
    contentLength: content.length,
    hasCustomInstructions: !!customInstructions
  });

  if (model === 'openai') {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildArticlePrompt(document, content, maxWords, tone, customInstructions);
    
    logger.info('📋 DEBUG: Prompt construido para OpenAI', {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 300) + '...'
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un periodista jurídico especializado en escribir artículos claros y profesionales sobre sentencias judiciales colombianas. Tu audiencia son abogados y profesionales del derecho que necesitan entender las implicaciones prácticas de las decisiones judiciales.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(maxWords * 2, 2000), // Aproximadamente 2 tokens por palabra
      temperature: 0.7,
    });

    const articleText = response.choices[0]?.message?.content;
    if (!articleText) throw new Error('No content generated');

    logger.info('✅ DEBUG: Artículo generado exitosamente con OpenAI', {
      wordCount: articleText.split(' ').length,
      articleLength: articleText.length,
      articlePreview: articleText.substring(0, 200) + '...',
      usageTokens: response.usage
    });

    return {
      content: articleText,
      wordCount: articleText.split(' ').length,
      modelUsed: 'gpt-4o-mini',
      generationTime: Date.now(),
      metadata: {
        tone,
        maxWords,
        hasCustomInstructions: !!customInstructions
      }
    };

  } else {
    // Gemini implementation
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildArticlePrompt(document, content, maxWords, tone, customInstructions);
    const result = await geminiModel.generateContent([prompt]);
    const response = await result.response;
    const articleText = response.text();

    if (!articleText) throw new Error('No content generated');

    return {
      content: articleText,
      wordCount: articleText.split(' ').length,
      modelUsed: 'gemini-1.5-flash',
      generationTime: Date.now(),
      metadata: {
        tone,
        maxWords,
        hasCustomInstructions: !!customInstructions
      }
    };
  }
}

function buildArticlePrompt(
  document: any,
  content: string,
  maxWords: number,
  tone: string,
  customInstructions?: string
): string {
  // Instrucciones de tono para la generación de artículos
  // Por defecto se usa 'professional' (tono formal y técnico)
  const toneInstructions = {
    professional: 'Mantén un tono formal y técnico, usando terminología jurídica precisa.', // Tono por defecto
    academic: 'Adopta un enfoque analítico y académico, con referencias al contexto jurisprudencial.',
    accessible: 'Usa un lenguaje claro y accesible, explicando términos técnicos cuando sea necesario.'
  };

  return `
  Actúa como un abogado analista y periodista jurídico experto, especializado en la jurisprudencia de las altas cortes de Colombia. Tu objetivo es crear análisis claros, precisos y de alto valor para otros profesionales del derecho.
  Escribe un análisis jurisprudencial sobre la siguiente sentencia judicial colombiana. 

**CONTENIDO COMPLETO DE LA SENTENCIA:**
${content}

// === INSTRUCCIONES GENERALES ===
1.  **AUDIENCIA**: Abogados y profesionales del derecho colombiano.
2.  **TONO**: ${toneInstructions[tone as keyof typeof toneInstructions]}
3.  **LÍMITE DE PALABRAS**: No exceder ${maxWords} palabras para el análisis completo.
4.  **REGLA FUNDAMENTAL**: No incluyas un título.

// === ESTRUCTURA OBLIGATORIA DEL ANÁLISIS ===

**[ENTRADILLA PERIODÍSTICA]** (50-75 palabras):
Redacta un párrafo de apertura cautivador y directo. No resumas el caso, sino su **impacto más relevante**. Responde a la pregunta: **"¿Por qué este fallo es importante para un abogado hoy?"**. Utiliza un lenguaje riguroso pero con gancho periodístico.

**[LEAD JURÍDICO]** (75-100 palabras):
- Resultado del fallo
- Partes procesales involucradas
- Derechos fundamentales en disputa
- Contexto del conflicto

**[ANTECEDENTES Y PROBLEMA JURÍDICO]** (100-125 palabras):
- Hechos relevantes del caso
- Pretensiones/argumentos principales de las partes
- Problema jurídico planteado a la Corte
- Competencia del tribunal (si es relevante)

**[FUNDAMENTOS Y DECISIÓN]** (150-200 palabras):
- Consideraciones principales de la Corte
- **Precedentes citados** (sentencias referenciadas específicas)
- **Tests/criterios** aplicados por la Corte
- **Ratio decidendi** (análisis técnico y fundamento central)
- Decisión específica adoptada

**[ÓRDENES Y EFECTOS]** (100-125 palabras):
- Órdenes concretas impartidas
- Sujetos obligados y sus responsabilidades
- Mecanismos de cumplimiento establecidos
- Plazos (si los hay)

**[IMPACTO Y PROSPECTIVA]** (75-100 palabras):
- Precedente establecido y su alcance
- Aplicación práctica para casos similares
- Consideraciones sobre viabilidad de cumplimiento

**[ELEMENTOS TÉCNICOS ADICIONALES]** (según corresponda):
- **Obiter dicta relevantes** (consideraciones adicionales importantes)
- **Salvamentos de voto** (magistrados disidentes y razones)
- **Aclaraciones de voto** (precisiones de magistrados)

**[LLAMADA A LA ACCIÓN]** (25-30 palabras):
Incluir al final: "📄 **Descarga la sentencia completa** - Accede al documento oficial de esta decisión totalmente gratis."

// === REGLAS DE ESTILO Y CONTENIDO ===
- Cita precedentes y normas de forma específica.
- Identifica y explica claramente el ratio decidendi.
- Utiliza párrafos cortos y terminología jurídica precisa.
- Basa todo el análisis estrictamente en el contenido del documento proporcionado.
- Evita cualquier tipo de opinión personal.


${customInstructions ? `**INSTRUCCIONES ADICIONALES DEL USUARIO:**\n${customInstructions}` : ''}

**IMPORTANTE**:
- NO excedas las ${maxWords} palabras bajo ninguna circunstancia
- NO incluir título
- Seguir estrictamente la estructura de 6 secciones
- Enfócate en elementos técnicos jurídicos
- Identificar claramente precedentes y ratio decidendi
- Mantén la precisión jurídica en todo momento

**IMPORTANTE**: Sigue la estructura y las instrucciones al pie de la letra. No incluyas el título.

Escribe el análisis jurisprudencial completo ahora:
`;
}

async function generateTitlesWithAI(
  document: any,
  model: 'gpt4o-mini' | 'gemini',
  style: string,
  count: number,
  articleContent: string,
  includeSubtitle: boolean = true
) {
  try {
    logger.info('🤖 DEBUG: generateTitlesWithAI - Iniciando generación:', {
      documentId: document.id,
      model,
      style,
      count,
      includeSubtitle,
      articleContentLength: articleContent?.length || 0,
      articleContentWords: articleContent ? articleContent.split(' ').length : 0
    });

    const modelToUse = model === 'gemini' ? 'gemini' : 'openai';
    
    if (modelToUse === 'openai') {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = buildTitlePrompt(document, style, count, articleContent, includeSubtitle);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en redacción de titulares jurídicos. Generas títulos precisos, atractivos y profesionales para artículos sobre sentencias judiciales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) throw new Error('No titles generated');

      const parsedResult = JSON.parse(result);

      // Nuevo formato con titleSets
      if (parsedResult.titleSets && Array.isArray(parsedResult.titleSets)) {
        const titleSets = parsedResult.titleSets
        return {
          titleSets,
          // Mantener compatibilidad con formato anterior
          titles: titleSets.map((set: any) => set.realTitle || ''),
          subtitles: includeSubtitle ? titleSets.map((set: any) => set.realSubtitle || '') : [],
          metaTitles: titleSets.map((set: any) => set.metaTitle || ''),
          style,
          modelUsed: 'gpt-4o-mini',
          generationTime: Date.now(),
          includeSubtitle
        };
      }

      // Fallback para formato anterior
      return {
        titles: parsedResult.titles || [],
        subtitles: includeSubtitle ? (parsedResult.subtitles || []) : [],
        style,
        modelUsed: 'gpt-4o-mini',
        generationTime: Date.now(),
        includeSubtitle
      };

    } else {
      // Gemini implementation for titles
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = buildTitlePrompt(document, style, count, articleContent, includeSubtitle);

      logger.info('🚀 DEBUG: Enviando prompt a Gemini 1.5 Flash');

      const result = await geminiModel.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      logger.info('✅ DEBUG: Respuesta recibida de Gemini:', {
        responseLength: text?.length || 0,
        responsePreview: text?.substring(0, 200) + '...' || 'N/A',
        fullResponse: text // LOG COMPLETO para debug
      });

      // Parse JSON response (como solicita el prompt)
      let parsedResult;
      try {
        // Limpiar respuesta antes de parsear (eliminar ```json y ```)
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '');
        }

        // Buscar el JSON válido en el texto
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }

        // Intentar parsear como JSON
        parsedResult = JSON.parse(cleanedText);
        logger.info('✅ DEBUG: JSON parseado correctamente:', parsedResult);

        // Validar estructura de titleSets (nuevo formato)
        if (parsedResult.titleSets && Array.isArray(parsedResult.titleSets)) {
          logger.info('✅ DEBUG: Formato titleSets detectado');
        }
        // Fallback: validar formato anterior
        else if (!parsedResult.titles || !Array.isArray(parsedResult.titles)) {
          throw new Error('Estructura JSON inválida: no contiene titleSets ni array de titles');
        }

        // Validar subtítulos si están incluidos (formato anterior)
        if (!parsedResult.titleSets && includeSubtitle && (!parsedResult.subtitles || !Array.isArray(parsedResult.subtitles))) {
          logger.warn('⚠️ DEBUG: JSON no contiene array de subtitles, usando array vacío');
          parsedResult.subtitles = [];
        }

      } catch (jsonError) {
        logger.warn('⚠️ DEBUG: Error parseando JSON, intentando extracción manual:', {
          error: jsonError instanceof Error ? jsonError.message : 'Unknown error',
          textLength: text.length,
          textPreview: text.substring(0, 100)
        });

        // Fallback mejorado: extraer títulos del texto
        const extractedTitles = [];

        // Buscar array de títulos en formato JSON malformado
        const titlesArrayMatch = text.match(/\["([^"]+)",\s*"([^"]+)",?\s*"?([^"]*)"?\s*\]/);
        if (titlesArrayMatch) {
          extractedTitles.push(titlesArrayMatch[1], titlesArrayMatch[2]);
          if (titlesArrayMatch[3] && titlesArrayMatch[3].trim()) {
            extractedTitles.push(titlesArrayMatch[3]);
          }
        } else {
          // Si no encuentra el array, usar regex individual
          const titleRegex = /"([^"]+)"/g;
          let match;
          while ((match = titleRegex.exec(text)) !== null) {
            const title = match[1]?.trim();
            // Filtrar títulos válidos (no palabras clave como "titles")
            if (title && title.length > 20 && !title.includes('titles') && !title.includes('{') && !title.includes('}')) {
              extractedTitles.push(title);
            }
          }
        }

        logger.info('🔧 DEBUG: Títulos extraídos manualmente:', extractedTitles);
        parsedResult = {
          titles: extractedTitles.slice(0, count),
          subtitles: includeSubtitle ? [] : undefined
        };
      }

      // Nuevo formato con titleSets
      if (parsedResult.titleSets && Array.isArray(parsedResult.titleSets)) {
        const titleSets = parsedResult.titleSets
        return {
          titleSets,
          // Mantener compatibilidad con formato anterior
          titles: titleSets.map((set: any) => set.realTitle || ''),
          subtitles: includeSubtitle ? titleSets.map((set: any) => set.realSubtitle || '') : [],
          metaTitles: titleSets.map((set: any) => set.metaTitle || ''),
          style,
          modelUsed: 'gemini-1.5-flash',
          generationTime: Date.now(),
          includeSubtitle
        };
      }

      // Fallback para formato anterior
      return {
        titles: parsedResult.titles || [],
        subtitles: includeSubtitle ? (parsedResult.subtitles || []) : [],
        style,
        modelUsed: 'gemini-1.5-flash',
        generationTime: Date.now(),
        includeSubtitle
      };
    }

  } catch (error) {
    logger.error(`Error generating titles: ${error}`);
    return null;
  }
}

function buildTitlePrompt(document: any, style: string, count: number, articleContent: string, includeSubtitle: boolean = true): string {
  logger.info('📝 DEBUG: buildTitlePrompt - Construyendo prompt:', {
    documentId: document.id,
    style,
    count,
    includeSubtitle,
    articleContentLength: articleContent?.length || 0,
    articleFirstWords: articleContent ? articleContent.substring(0, 100) + '...' : 'N/A'
  });

  const styleInstructions = {
    serious: `ESTILO SERIO Y PROFESIONAL:

META TITLE: Formal, técnico, con keyword principal y acción judicial específica
- Ejemplo: "Sentencia T-375: Corte Refuerza Derecho a Salud Oportuna"

TÍTULO REAL H1: Descriptivo completo, técnico, dirigido a profesionales del derecho
- Ejemplo: "Análisis Completo de la Sentencia T-375 de 2025: Corte Constitucional Refuerza la Obligación de Respuesta Oportuna de las Entidades de Salud"

${includeSubtitle ? `SUBTÍTULO H2: Implicaciones legales específicas y precedente establecido
- Ejemplo: "Precedente establece criterios específicos para garantizar el acceso efectivo a servicios médicos sin dilaciones administrativas"` : ''}`,

    catchy: `ESTILO ATRACTIVO Y LLAMATIVO:

META TITLE: Impactante, con elementos de novedad o precedente histórico
- Ejemplo: "Colombia Marca Precedente Histórico en Derecho a la Salud"

TÍTULO REAL H1: Genera interés, enfatiza el impacto nacional o sectorial
- Ejemplo: "Colombia Sienta Precedente Histórico: Sentencia T-375 Revoluciona la Protección del Derecho a la Salud"

${includeSubtitle ? `SUBTÍTULO H2: Consecuencias prácticas amplias, cambios que genera
- Ejemplo: "Nueva jurisprudencia obliga a EPS a responder en máximo 15 días hábiles o enfrentar sanciones constitucionales"` : ''}`,

    educational: `ESTILO EDUCATIVO E INFORMATIVO:

META TITLE: En forma de pregunta o explicación clara y directa
- Ejemplo: "¿Qué Cambia con la Sentencia T-375 en Salud? Claves"

TÍTULO REAL H1: Pregunta directa, lenguaje accesible pero preciso
- Ejemplo: "¿Qué Significa la Sentencia T-375 de 2025 para el Derecho a la Salud de los Colombianos?"

${includeSubtitle ? `SUBTÍTULO H2: Respuesta práctica, conexión con experiencia cotidiana
- Ejemplo: "Guía práctica sobre los nuevos plazos y procedimientos que deben cumplir las entidades de salud"` : ''}`
  };

  const prompt = `
Eres un experto en SEO jurídico. Debes generar ${count} conjuntos completos de elementos SEO para artículos legales.

**ARTÍCULO COMPLETO GENERADO:**
${articleContent}

**ESTILO SOLICITADO:** ${style}

**INSTRUCCIONES ESPECÍFICAS:**
${styleInstructions[style as keyof typeof styleInstructions]}

**DEBES GENERAR 3 ELEMENTOS SEO DISTINTOS:**

**1. META TITLE (<title> tag):**
- LÍMITE: 60-65 caracteres estricto
- PROPÓSITO: Atraer clics en resultados de Google
- CONTENIDO: Keyword principal + gancho atractivo
- APARECE: En pestañas del navegador y SERPs

**2. TÍTULO REAL (H1):**
- LÍMITE: Sin límite estricto (puede ser descriptivo y completo)
- PROPÓSITO: Confirmar al usuario que está en el lugar correcto
- CONTENIDO: Descripción completa y clara del contenido
- APARECE: Como encabezado principal visible del artículo

${includeSubtitle ? `**3. SUBTÍTULO REAL (H2):**
- LÍMITE: Sin límite estricto
- PROPÓSITO: Complementar y expandir el H1
- CONTENIDO: Implicaciones, contexto adicional, keywords secundarias
- APARECE: Como subtítulo visible debajo del H1` : ''}

**DIFERENCIAS CLAVE:**
- META TITLE: Corto y atractivo para Google
- H1: Descriptivo y completo para el lector
- H2: Contexto adicional y keywords secundarias

**REQUISITOS:**
- Dirigido a abogados y profesionales del derecho colombianos
- Basado ÚNICAMENTE en el contenido del artículo generado
- Mantener precisión y veracidad jurídica absoluta
- Cada conjunto debe ser coherente temáticamente

**FORMATO DE RESPUESTA:**
Responde únicamente en formato JSON válido:
${includeSubtitle ?
`{"titleSets": [{"metaTitle": "title 1", "realTitle": "h1 title 1", "realSubtitle": "h2 subtitle 1"}, {"metaTitle": "title 2", "realTitle": "h1 title 2", "realSubtitle": "h2 subtitle 2"}, {"metaTitle": "title 3", "realTitle": "h1 title 3", "realSubtitle": "h2 subtitle 3"}]}` :
`{"titleSets": [{"metaTitle": "title 1", "realTitle": "h1 title 1"}, {"metaTitle": "title 2", "realTitle": "h1 title 2"}, {"metaTitle": "title 3", "realTitle": "h1 title 3"}]}`}

**CRÍTICO:**
- META TITLE: Máximo 65 caracteres
- H1 y H2: Sin límite estricto, enfocados en lectores humanos
- Cada conjunto debe funcionar como unidad SEO completa
`;

  // DEBUG: Log del prompt completo (solo preview para evitar logs muy largos)
  logger.info('📋 DEBUG: buildTitlePrompt - Prompt construido:', {
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 300) + '... [TRUNCADO]',
    styleUsed: style,
    includeSubtitle,
    articleContentIncluded: articleContent ? 'YES' : 'NO'
  });

  return prompt;
}

// Nueva función para generar prompts inteligentes con IA
async function buildImagePromptWithAI(document: any, style: string): Promise<{ prompt: string; metaDescription: string | null }> {
  try {
    // Import del nuevo generador IA
    const { aiImagePromptGenerator } = await import('../services/AIImagePromptGenerator.js');

    // Extraer el contenido del documento usando los nombres correctos de la BD
    // Verificar si generated_article es texto válido (no JSON de metadatos)
    let articleContent = '';

    if (document.generated_article && typeof document.generated_article === 'string' &&
        !document.generated_article.trim().startsWith('{')) {
      // Si generated_article es texto válido (no JSON), usarlo
      articleContent = document.generated_article;
    } else {
      // Fallback: usar content (resumen IA optimizado) o full_text_content
      articleContent = document.content || document.full_text_content || '';
    }

    if (!articleContent) {
      logger.warn('⚠️ No content found in document, using fallback');
      return buildImagePromptFallback(document, style);
    }

    // Mapear estilo del frontend a temáticas IA (nuevos tipos + retrocompatibilidad)
    const thematicMapping = {
      // Nuevos tipos específicos del frontend
      persona: 'personas',          // persona → personas (personas en contexto)
      paisaje: 'lugares',           // paisaje → lugares (espacios y ambientes)
      elemento: 'primer_plano',     // elemento → primer_plano (objetos y documentos)
      // Retrocompatibilidad con tipos antiguos
      professional: 'lugares',      // professional → lugares (espacios profesionales)
      conceptual: 'personas',       // conceptual → personas (conceptos humanos)
      abstract: 'primer_plano'      // abstract → primer_plano (detalles abstractos)
    };

    const thematic = thematicMapping[style as keyof typeof thematicMapping] || 'lugares';

    // Generar prompt inteligente con IA
    logger.info(`🎨 Generando prompt IA para temática: ${thematic}`, {
      documentId: document.id,
      contentLength: articleContent.length,
      style,
      thematic
    });

    const aiResult = await aiImagePromptGenerator.generateImagePrompt(articleContent, thematic);

    // Extraer prompt y metadescripción del objeto retornado
    const aiPrompt = typeof aiResult === 'string' ? aiResult : aiResult.prompt;
    const metaDescription = typeof aiResult === 'string' ? null : aiResult.metaDescription;

    // Combinar con instrucciones de estilo si es necesario
    const styleEnhancement = getStyleEnhancement(style);
    const finalPrompt = `${aiPrompt}, ${styleEnhancement}`;

    logger.info(`✅ Prompt IA generado exitosamente`, {
      promptLength: finalPrompt.length,
      thematic,
      hasMetaDescription: !!metaDescription,
      metaDescriptionLength: metaDescription?.length || 0,
      preview: finalPrompt.substring(0, 100) + '...'
    });

    return { prompt: finalPrompt, metaDescription };

  } catch (error) {
    logger.error('❌ Error generating AI prompt, using fallback:', error);
    const fallbackPrompt = buildImagePromptFallback(document, style);
    return { prompt: fallbackPrompt, metaDescription: null };
  }
}

// Función de respaldo (mejorada de la función original)
function buildImagePromptFallback(document: any, style: string): string {
  const styleInstructions = {
    professional: 'Professional editorial photography, corporate style, formal lighting',
    conceptual: 'Conceptual artistic representation, symbolic elements, creative composition',
    abstract: 'Abstract visual representation, modern design, geometric elements'
  };

  const basePrompt = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional;
  return `${basePrompt} related to ${document.legal_area || 'Colombian law'} and ${document.title}. High quality, editorial style, appropriate for legal publication.`;
}

// Mejoras de estilo específicas
function getStyleEnhancement(style: string): string {
  const enhancements = {
    professional: 'professional photography, corporate editorial style, high-end commercial quality',
    conceptual: 'artistic conceptual photography, creative interpretation, symbolic representation',
    abstract: 'abstract artistic composition, modern minimalist design, contemporary visual style'
  };

  return enhancements[style as keyof typeof enhancements] || enhancements.professional;
}

async function generateImagesWithAI(
  document: any,
  model: 'dalle' | 'gemini',
  customPrompt: string | undefined,
  style: string,
  count: number
) {
  try {
    logger.info('🎨 DEBUG: Iniciando generación con IA inteligente', {
      documentId: document.id,
      model,
      style,
      count,
      hasCustomPrompt: !!customPrompt,
      usingAI: !customPrompt // Solo usa IA si no hay prompt personalizado
    });

    const startTime = Date.now();

    // CAMBIO PRINCIPAL: Usar IA para generar prompt si no hay uno personalizado
    let finalPrompt: string;
    let metaDescription: string | null = null;

    if (customPrompt) {
      finalPrompt = customPrompt;
      logger.info('📝 Usando prompt personalizado');

      // ✅ NUEVO: Generar metadescripción incluso con prompt personalizado
      try {
        logger.info('🧠 Generando metadescripción para prompt personalizado...');
        const aiResult = await buildImagePromptWithAI(document, style);
        metaDescription = aiResult.metaDescription; // Solo tomar la metadescripción
        logger.info('✅ Metadescripción generada para prompt personalizado', {
          hasMetaDescription: !!metaDescription,
          metaDescriptionLength: metaDescription?.length || 0
        });
      } catch (metaError) {
        logger.warn('⚠️ Error generando metadescripción para prompt personalizado:', metaError);
        metaDescription = null;
      }
    } else {
      logger.info('🧠 Generando prompt con IA...');
      const aiResult = await buildImagePromptWithAI(document, style);
      finalPrompt = aiResult.prompt;
      metaDescription = aiResult.metaDescription;
    }

    logger.info('🎯 Prompt final:', {
      promptLength: finalPrompt.length,
      promptPreview: finalPrompt.substring(0, 100) + '...',
      hasMetaDescription: !!metaDescription,
      metaDescriptionPreview: metaDescription?.substring(0, 50) + '...' || 'null'
    });

    if (model === 'gemini') {
      return await generateImagesWithGemini(document, finalPrompt, style, count, startTime, metaDescription);
    } else if (model === 'dalle') {
      return await generateImagesWithDALLE(document, finalPrompt, style, count, startTime, metaDescription);
    }

    throw new Error(`Unsupported model: ${model}`);

  } catch (error) {
    logger.error(`Error generating images: ${error}`);
    return null;
  }
}

async function generateImagesWithGemini(
  document: any,
  prompt: string, // YA NO SE GENERA AQUÍ, SE RECIBE COMO PARÁMETRO
  style: string,
  count: number,
  startTime: number,
  metaDescription: string | null = null
) {
  logger.info('🔥 Iniciando generación de imágenes con Gemini 2.5 Flash Image', {
    hasMetaDescription: !!metaDescription,
    metaDescriptionLength: metaDescription?.length || 0,
    metaDescriptionPreview: metaDescription?.substring(0, 50) + '...' || 'null'
  });

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
    throw new Error('GEMINI_API_KEY not configured. Please set a valid Gemini API key in environment variables.');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    logger.info('🎨 DEBUG: Prompt para generación con Gemini', {
      prompt,
      promptLength: prompt.length,
      model: 'gemini-2.5-flash-image-preview'
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    logger.info('🎨 Generando imagen con Gemini 2.5 Flash Image...');

    const result = await model.generateContent([{
      text: prompt
    }]);

    const response = result.response;

    // Check if response contains image data
    const candidates = response.candidates;
    logger.info('🎨 DEBUG: Gemini response analysis', {
      hasCandidates: !!candidates,
      candidatesCount: candidates?.length || 0,
      responseText: response.text?.() || 'No text response'
    });

    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const generatedImages = [];

    for (let i = 0; i < Math.min(candidates.length, count); i++) {
      const candidate = candidates[i];

      if (candidate?.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check for inline image data
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

            generatedImages.push({
              id: `gemini_img_${Date.now()}_${i}`,
              url: imageUrl,
              thumbnailUrl: imageUrl,
              prompt: prompt,
              metaDescription: metaDescription || null,
              style,
              model: 'gemini-2.5-flash-image-preview',
              dimensions: { width: 1792, height: 1024 }
            });
          }
        }
      }
    }

    // If no images were generated, throw an error
    if (generatedImages.length === 0) {
      logger.error('❌ Gemini did not generate image data');
      throw new Error('Gemini no puede generar imágenes en este momento. Por favor usa DALL-E para generar imágenes.');
    }

    const generationTime = Date.now() - startTime;

    logger.info('✅ Generación Gemini completada', {
      totalImages: generatedImages.length,
      generationTime: `${generationTime}ms`,
      model: 'gemini-2.5-flash-image-preview'
    });

    // Retornar imágenes temporales para preview
    return {
      requestId: `gemini_${Date.now()}`,
      images: generatedImages,
      modelUsed: 'gemini-2.5-flash-image-preview',
      generationTime,
      totalCount: generatedImages.length
    };

  } catch (error) {
    logger.error('❌ Error en generación con Gemini:', error);
    throw new Error(`Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateImagesWithDALLE(
  document: any,
  prompt: string, // YA NO SE GENERA AQUÍ, SE RECIBE COMO PARÁMETRO
  style: string,
  count: number,
  startTime: number,
  metaDescription: string | null = null
) {
  logger.info('🎨 Generando imágenes con DALL-E');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  logger.info('🎨 DEBUG: Prompt para DALL-E', {
    prompt,
    promptLength: prompt.length
  });

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: Math.min(count, 1), // DALL-E 3 only supports 1 image per request
      size: "1792x1024", // Formato landscape 16:9 optimizado para arrastre
      quality: "standard",
    });

    const generatedImages = response.data?.map((image, i) => ({
      id: `dalle_img_${Date.now()}_${i}`,
      url: image.url || '',
      thumbnailUrl: image.url || '', // DALL-E doesn't provide separate thumbnails
      prompt: prompt,
      metaDescription: metaDescription || null,
      style,
      model: 'dall-e-3',
      dimensions: { width: 1792, height: 1024 }
    })) || [];

    const generationTime = Date.now() - startTime;

    logger.info('✅ Generación DALL-E completada', {
      totalImages: generatedImages.length,
      generationTimeMs: generationTime
    });

    // Retornar imágenes temporales para preview
    return {
      requestId: `dalle_${Date.now()}`,
      images: generatedImages,
      modelUsed: 'dall-e-3',
      generationTime: generationTime,
      totalCount: generatedImages.length
    };

  } catch (dalleError) {
    logger.error('❌ Error con DALL-E API:', dalleError);
    throw dalleError;
  }
}

function buildImagePrompt(document: any, style: string): string {
  const styleInstructions = {
    professional: 'Professional editorial photography, corporate style, formal lighting',
    conceptual: 'Conceptual artistic representation, symbolic elements, creative composition',
    abstract: 'Abstract visual representation, modern design, geometric elements'
  };

  const basePrompt = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional;

  return `${basePrompt} related to ${document.legal_area || 'Colombian law'} and ${document.title}. High quality, editorial style, appropriate for legal publication.`;
}

function buildSimplifiedImagePrompt(document: any, style: string, originalPrompt: string): string {
  logger.info('🎨 DEBUG: Simplifying prompt for Gemini image generation', {
    originalLength: originalPrompt.length,
    style
  });

  // Extract key elements from the original prompt
  const keyElements = [];

  // Look for legal/judicial terms but simplify them
  if (originalPrompt.includes('documentos jurídicos') || originalPrompt.includes('legal')) {
    keyElements.push('legal documents');
  }

  if (originalPrompt.includes('profesional') || originalPrompt.includes('professional')) {
    keyElements.push('professional setting');
  }

  if (originalPrompt.includes('colombian') || originalPrompt.includes('colombianos')) {
    keyElements.push('Colombian context');
  }

  // Build a much simpler prompt
  const baseElements = keyElements.length > 0 ? keyElements.join(', ') : 'legal and professional content';

  const styleInstructions = {
    professional: 'Professional editorial photography, corporate office setting',
    conceptual: 'Conceptual representation of legal themes',
    abstract: 'Abstract design representing legal concepts'
  };

  const stylePrompt = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional;

  const simplifiedPrompt = `${stylePrompt} featuring ${baseElements}. Clean, professional composition suitable for legal publication.`;

  logger.info('🎨 DEBUG: Prompt simplified', {
    originalPreview: originalPrompt.substring(0, 100) + '...',
    simplifiedPrompt,
    simplifiedLength: simplifiedPrompt.length
  });

  return simplifiedPrompt;
}

// Helper function to generate metadata with AI
async function generateMetadataWithAI(
  articleContent: string,
  articleTitle: string,
  section: string,
  model: 'gpt4o-mini' | 'gemini'
) {
  try {
    logger.info('🎯 Iniciando generación de metadata SEO con IA', {
      model,
      articleTitleLength: articleTitle.length,
      articleContentLength: articleContent.length,
      section
    });

    const modelToUse = model === 'gemini' ? 'gemini' : 'openai';
    
    if (modelToUse === 'openai') {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = buildMetadataSEOPrompt(articleContent, articleTitle, section);
      
      logger.info('📋 Prompt construido para OpenAI', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 300) + '...'
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en SEO jurídico especializado en posicionamiento de artículos periodísticos sobre jurisprudencia colombiana. Tu objetivo es generar metadata optimizada para motores de búsqueda que ayude a posicionar adecuadamente artículos legales.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        response_format: { type: "json_object" }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) throw new Error('No content generated');

      const parsedResult = JSON.parse(result);

      logger.info('✅ Metadata generada exitosamente con OpenAI', {
        descriptionLength: parsedResult.description?.length || 0,
        keywordsCount: parsedResult.keywords?.length || 0,
        hasSchemaDescription: !!parsedResult.schemaDescription,
        usageTokens: response.usage
      });

      return {
        description: parsedResult.description || '',
        primaryKeyword: parsedResult.primaryKeyword || '',
        keywords: parsedResult.keywords || [],
        schemaDescription: parsedResult.schemaDescription || '',
        modelUsed: 'gpt-4o-mini',
        generationTime: Date.now(),
        metadata: {
          section,
          articleTitle,
          contentLength: articleContent.length
        }
      };

    } else {
      // Gemini implementation
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = buildMetadataSEOPrompt(articleContent, articleTitle, section);
      const result = await geminiModel.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error('No content generated');

      // Parse JSON response
      let parsedResult;
      try {
        // Limpiar respuesta antes de parsear
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '');
        }

        // Buscar el JSON válido en el texto
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }

        parsedResult = JSON.parse(cleanedText);
      } catch (jsonError) {
        logger.error('Error parseando JSON de Gemini:', jsonError);
        throw new Error('Invalid JSON response from Gemini');
      }

      logger.info('✅ Metadata generada exitosamente con Gemini', {
        descriptionLength: parsedResult.description?.length || 0,
        keywordsCount: parsedResult.keywords?.length || 0,
        hasSchemaDescription: !!parsedResult.schemaDescription
      });

      return {
        description: parsedResult.description || '',
        primaryKeyword: parsedResult.primaryKeyword || '',
        keywords: parsedResult.keywords || [],
        schemaDescription: parsedResult.schemaDescription || '',
        modelUsed: 'gemini-1.5-flash',
        generationTime: Date.now(),
        metadata: {
          section,
          articleTitle,
          contentLength: articleContent.length
        }
      };
    }

  } catch (error) {
    logger.error(`Error generating metadata with AI: ${error}`);
    return null;
  }
}

// Build specialized SEO prompt for legal articles
function buildMetadataSEOPrompt(
  articleContent: string,
  articleTitle: string,
  section: string
): string {
  return `
Actúa como un experto en SEO jurídico especializado en posicionamiento de artículos periodísticos sobre jurisprudencia colombiana.

**ARTÍCULO COMPLETO:**
Título: ${articleTitle}
Sección: ${section}
Contenido: ${articleContent}

**TU MISIÓN:**
Generar metadata SEO optimizada para posicionar este artículo jurídico en motores de búsqueda, dirigido a abogados y profesionales del derecho colombiano.

**DEBES GENERAR:**

1. **METADESCRIPCIÓN (description)**:
   - LÍMITE ESTRICTO: 160 caracteres máximo
   - Incluir keyword principal
   - Llamada a la acción implícita
   - Mencionar el beneficio específico para abogados
   - Ejemplo: "Análisis completo de la Sentencia T-375: nuevos criterios para tutelas en salud. Precedente clave para litigios. Descarga gratis."

2. **KEYWORD PRINCIPAL (primaryKeyword)**:
   - Frase de 2-4 palabras que mejor represente el tema
   - Basada en términos que buscarían los abogados
   - Ejemplo: "tutela derecho salud", "precedente constitucional", "responsabilidad civil"

3. **PALABRAS CLAVE ADICIONALES (keywords)**:
   - Array de 5-8 keywords relacionadas
   - Incluir variaciones y términos LSI
   - Mezclar términos técnicos y coloquiales
   - Ejemplo: ["jurisprudencia", "corte constitucional", "derechos fundamentales", "precedente judicial"]

4. **DESCRIPCIÓN SCHEMA.ORG (schemaDescription)**:
   - LÍMITE: 200 caracteres máximo
   - Descripción técnica para rich snippets
   - Enfoque en el valor informativo del artículo
   - Ejemplo: "Análisis jurisprudencial detallado de sentencia colombiana con implicaciones prácticas para el ejercicio profesional del derecho."

**CRITERIOS DE OPTIMIZACIÓN:**
- Priorizar términos que usan abogados colombianos
- Incluir el área específica del derecho (${section})
- Considerar la intención de búsqueda informacional
- Optimizar para featured snippets
- Usar lenguaje técnico pero accesible

**FORMATO DE RESPUESTA:**
Responde únicamente en formato JSON válido:
{
  "description": "metadescripción de máximo 160 caracteres",
  "primaryKeyword": "keyword principal de 2-4 palabras",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "schemaDescription": "descripción para schema.org de máximo 200 caracteres"
}

**CRÍTICO:**
- Respetar límites de caracteres estrictamente
- Basar todo en el contenido del artículo proporcionado
- Mantener precisión jurídica absoluta
- No inventar información no presente en el artículo
`;
}

export default router;