import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validation';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const generateArticleSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['gpt4o-mini', 'gemini']).optional(),
  maxWords: z.number().min(100).max(500).default(500),
  tone: z.enum(['professional', 'academic', 'accessible']).default('professional'),
  customInstructions: z.string().optional(),
});

const generateTitlesSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['gpt4o-mini', 'gemini']).optional(),
  style: z.enum(['serious', 'catchy', 'educational']),
  count: z.number().min(1).max(5).default(3),
});

const generateImagesSchema = z.object({
  documentId: z.string().cuid(),
  model: z.enum(['dalle', 'gemini']).optional(),
  prompt: z.string().optional(),
  style: z.enum(['professional', 'conceptual', 'abstract']).default('professional'),
  count: z.number().min(1).max(3).default(1),
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

    res.json({
      data: articleContent,
      message: 'Article generated successfully'
    });

    logger.info('AI article generation completed', {
      documentId,
      userId: req.user.id,
      model: articleContent.modelUsed,
      wordCount: articleContent.wordCount
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
    const { documentId, model, style, count } = req.body;

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Generate titles using AI
    const titles = await generateTitlesWithAI(document, model || 'gpt4o-mini', style, count);

    if (!titles) {
      return res.status(500).json({
        error: 'Failed to generate titles'
      });
    }

    res.json({
      data: titles,
      message: 'Titles generated successfully'
    });

    logger.info('AI title generation completed', {
      documentId,
      userId: req.user.id,
      style,
      count: titles.titles.length
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
 * /api/ai/available-models:
 *   get:
 *     summary: Get available AI models based on API keys
 *     tags: [AI Services]
 *     security:
 *       - bearerAuth: []
 */
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

    // Get full document content
    let documentContent = document.content;
    
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
  const toneInstructions = {
    professional: 'Mantén un tono formal y técnico, usando terminología jurídica precisa.',
    academic: 'Adopta un enfoque analítico y académico, con referencias al contexto jurisprudencial.',
    accessible: 'Usa un lenguaje claro y accesible, explicando términos técnicos cuando sea necesario.'
  };

  return `
Escribe un artículo periodístico jurídico sobre la siguiente sentencia judicial colombiana.

**INFORMACIÓN DEL DOCUMENTO:**
- Tipo: ${document.type}
- Identificador: ${document.title}
- Área jurídica: ${document.legal_area}
- Fuente: ${document.source}
- Título: ${document.title}
${document.magistradoPonente ? `- Magistrado Ponente: ${document.magistradoPonente}` : ''}
${document.temaPrincipal ? `- Tema Principal: ${document.temaPrincipal}` : ''}
${document.resumenIA ? `- Resumen: ${document.resumenIA}` : ''}

**CONTENIDO COMPLETO DE LA SENTENCIA:**
${content}

**INSTRUCCIONES PARA EL ARTÍCULO:**
1. **LÍMITE ESTRICTO**: Máximo ${maxWords} palabras (muy importante)
2. **Tono**: ${toneInstructions[tone as keyof typeof toneInstructions]}
3. **Audiencia**: Abogados y profesionales del derecho colombiano
4. **Estructura requerida**:
   - Título atractivo y profesional
   - Lead/entradilla (1-2 párrafos) con los aspectos más importantes
   - Desarrollo del tema principal (2-3 párrafos)
   - Implicaciones prácticas para la profesión jurídica
   - Conclusión breve

5. **Contenido debe incluir**:
   - Contexto de la decisión judicial
   - Aspectos jurídicos más relevantes
   - Implicaciones para casos similares
   - Relevancia para la práctica profesional

6. **Estilo**:
   - Párrafos cortos y concisos
   - Información precisa y verificable
   - Evitar opiniones personales
   - Usar datos específicos del documento

${customInstructions ? `**INSTRUCCIONES ADICIONALES DEL USUARIO:**\n${customInstructions}` : ''}

**IMPORTANTE**: 
- NO excedas las ${maxWords} palabras bajo ninguna circunstancia
- Enfócate en los aspectos más importantes y prácticos
- Mantén la precisión jurídica en todo momento
- El artículo debe ser original y estar basado únicamente en el contenido proporcionado

Escribe el artículo completo ahora:
`;
}

async function generateTitlesWithAI(
  document: any,
  model: 'gpt4o-mini' | 'gemini',
  style: string,
  count: number
) {
  try {
    const modelToUse = model === 'gemini' ? 'gemini' : 'openai';
    
    if (modelToUse === 'openai') {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = buildTitlePrompt(document, style, count);

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
      
      return {
        titles: parsedResult.titles || [],
        style,
        modelUsed: 'gpt-4o-mini',
        generationTime: Date.now()
      };

    } else {
      // Gemini implementation for titles
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = buildTitlePrompt(document, style, count);
      const result = await geminiModel.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      // Parse titles from response
      const titles = text.split('\n').filter(line => line.trim().length > 10);
      
      return {
        titles: titles.slice(0, count),
        style,
        modelUsed: 'gemini-1.5-flash',
        generationTime: Date.now()
      };
    }

  } catch (error) {
    logger.error(`Error generating titles: ${error}`);
    return null;
  }
}

function buildTitlePrompt(document: any, style: string, count: number): string {
  const styleInstructions = {
    serious: 'Títulos formales, técnicos y directos. Enfoque profesional para audiencia especializada.',
    catchy: 'Títulos atractivos que generen interés y clicks, pero manteniendo veracidad jurídica.',
    educational: 'Títulos informativos y claros que eduquen al lector sobre el tema jurídico.'
  };

  return `
Genera ${count} títulos para un artículo sobre esta sentencia judicial colombiana:

**DOCUMENTO:**
- ${document.document_type} ${document.title}
- Área: ${document.legal_area}
- Tema: ${document.title}
${document.temaPrincipal ? `- Tema Principal: ${document.temaPrincipal}` : ''}
${document.magistradoPonente ? `- Magistrado Ponente: ${document.magistradoPonente}` : ''}

**ESTILO REQUERIDO:** ${style}
**INSTRUCCIONES:** ${styleInstructions[style as keyof typeof styleInstructions]}

**REQUISITOS:**
- Máximo 120 caracteres por título
- Precisión jurídica
- Relevante para abogados colombianos
- Original y específico al documento

Responde en formato JSON: {"titles": ["título1", "título2", ...]}
`;
}

async function generateImagesWithAI(
  document: any,
  model: 'dalle' | 'gemini',
  customPrompt: string | undefined,
  style: string,
  count: number
) {
  try {
    logger.info('🎨 DEBUG: Iniciando generación real de imágenes', {
      documentId: document.id,
      model,
      style,
      count,
      hasCustomPrompt: !!customPrompt,
      customPrompt: customPrompt || 'N/A'
    });

    const startTime = Date.now();
    
    if (model === 'gemini') {
      return await generateImagesWithGemini(document, customPrompt, style, count, startTime);
    } else if (model === 'dalle') {
      return await generateImagesWithDALLE(document, customPrompt, style, count, startTime);
    }

    throw new Error(`Unsupported model: ${model}`);

  } catch (error) {
    logger.error(`Error generating images: ${error}`);
    
    // No fallback - return null to indicate failure
    return null;
  }
}

async function generateImagesWithGemini(
  document: any,
  customPrompt: string | undefined,
  style: string,
  count: number,
  startTime: number
) {
  logger.info('🔥 Iniciando generación de imágenes con Gemini 2.5 Flash Image');
  
  // Check if Gemini API key is available and valid
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
    throw new Error('GEMINI_API_KEY not configured. Please set a valid Gemini API key in environment variables.');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = customPrompt || buildImagePrompt(document, style);
    
    logger.info('🎨 DEBUG: Prompt para generación con Gemini', {
      prompt,
      promptLength: prompt.length,
      model: 'gemini-2.5-flash-image-preview'
    });

    // Using Gemini 2.5 Flash Image for native image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
    
    // Generate image with Gemini 2.5 Flash Image
    logger.info('🎨 Generando imagen con Gemini 2.5 Flash Image...');
    
    const result = await model.generateContent([{
      text: prompt
    }]);
    
    const response = await result.response;
    
    // Extract image data from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No image candidates returned from Gemini');
    }

    const generatedImages = [];
    
    for (let i = 0; i < Math.min(candidates.length, count); i++) {
      const candidate = candidates[i];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
            // Convert base64 data to data URL
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            
            generatedImages.push({
              id: `gemini_img_${Date.now()}_${i}`,
              url: imageUrl,
              thumbnailUrl: imageUrl,
              prompt: prompt,
              style,
              model: 'gemini-2.5-flash-image-preview',
              dimensions: { width: 1024, height: 1024 }, // Default dimensions
              mimeType: part.inlineData.mimeType
            });
          }
        }
      }
    }

    if (generatedImages.length === 0) {
      throw new Error('No images found in Gemini response');
    }

    const generationTime = Date.now() - startTime;

    logger.info('✅ Generación Gemini completada', {
      totalImages: generatedImages.length,
      generationTime: `${generationTime}ms`,
      model: 'gemini-2.5-flash-image-preview'
    });

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
  customPrompt: string | undefined,
  style: string,
  count: number,
  startTime: number
) {
  logger.info('🎨 Generando imágenes con DALL-E');
  
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = customPrompt || buildImagePrompt(document, style);
  
  logger.info('🎨 DEBUG: Prompt para DALL-E', {
    prompt,
    promptLength: prompt.length
  });

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: Math.min(count, 1), // DALL-E 3 only supports 1 image per request
      size: "1024x1024",
      quality: "standard",
    });

    const generatedImages = response.data.map((image, i) => ({
      id: `dalle_img_${Date.now()}_${i}`,
      url: image.url || '',
      thumbnailUrl: image.url || '', // DALL-E doesn't provide separate thumbnails
      prompt: prompt,
      style,
      model: 'dall-e-3',
      dimensions: { width: 1024, height: 1024 }
    }));

    const generationTime = Date.now() - startTime;

    logger.info('✅ Generación DALL-E completada', {
      totalImages: generatedImages.length,
      generationTimeMs: generationTime
    });

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

export default router;