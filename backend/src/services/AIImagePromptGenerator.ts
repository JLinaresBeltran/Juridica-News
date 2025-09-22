/**
 * AIImagePromptGenerator - Generador Inteligente de Prompts para Imágenes Jurídicas
 *
 * Sistema híbrido que combina análisis de IA con plantillas especializadas
 * para generar prompts únicos y contextualmente relevantes.
 *
 * Adaptado para el sistema editorial jurídico sin dependencia de Anthropic.
 */

import { logger } from '../utils/logger';

interface AnalysisResult {
  profesional: string;
  grupoEtnico: string;
  escenario: string;
  objetoLegal: string;
  tema: string;
  tono: string;
  paletaColores?: string;
}

interface GeneratedImageContent {
  prompt: string;
  metaDescription: string;
}

/**
 * Generador IA inteligente adaptado para el sistema jurídico colombiano
 */
export class AIImagePromptGenerator {
  private recentPrompts = new Set<string>();
  private maxHistorySize = 50;

  /**
   * Genera un prompt único para imagen basado en artículo jurídico
   * FUNCIÓN PRINCIPAL QUE REEMPLAZA buildImagePrompt básico
   */
  async generateImagePrompt(
    articleText: string,
    thematic: string,
    previousPrompts: string[] = []
  ): Promise<GeneratedImageContent> {
    try {
      logger.info('🧠 Iniciando generación inteligente de prompt', {
        thematic,
        articleLength: articleText.length,
        previousPromptsCount: previousPrompts.length
      });

      // Construir prompts del sistema y usuario
      const systemPrompt = this.buildSystemPrompt(thematic, previousPrompts);
      const userPrompt = this.buildUserPrompt(articleText, thematic);

      // Intentar usar OpenAI para análisis inteligente
      try {
        logger.info('🔗 Llamando a OpenAI para análisis inteligente...');

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const generatedResponse = response.choices[0]?.message?.content?.trim();

        if (generatedResponse) {
          try {
            const parsedResponse = JSON.parse(generatedResponse) as GeneratedImageContent;

            if (parsedResponse.prompt && parsedResponse.metaDescription) {
              // Validar que la metaDescription no exceda 125 caracteres
              if (parsedResponse.metaDescription.length > 125) {
                parsedResponse.metaDescription = parsedResponse.metaDescription.substring(0, 122) + '...';
              }

              this.addToHistory(parsedResponse.prompt);
              logger.info('✅ Prompt y metadescripción generados con OpenAI', {
                promptLength: parsedResponse.prompt.length,
                metaDescriptionLength: parsedResponse.metaDescription.length,
                thematic
              });
              return parsedResponse;
            }
          } catch (parseError) {
            logger.warn('❌ Error parseando JSON de OpenAI, usando fallback', parseError);
          }
        }

      } catch (aiError) {
        logger.warn('❌ Error en OpenAI, usando fallback local:', aiError);
      }

      // Fallback local con análisis inteligente
      logger.info('⚠️ Usando fallback local con análisis inteligente');
      const localAnalysis = this.analyzeContentLocally(articleText);
      const fallbackContent = this.generateContentFromAnalysis(localAnalysis, thematic);

      this.addToHistory(fallbackContent.prompt);
      return fallbackContent;

    } catch (error) {
      logger.error('❌ Error generando prompt inteligente:', error);
      return this.getFallbackPrompt(thematic);
    }
  }

  /**
   * Construye el prompt del sistema según la temática
   */
  private buildSystemPrompt(thematic: string, previousPrompts: string[]): string {
    const baseInstructions = `Eres un experto en generación de prompts para IA de imágenes especializado en contenido jurídico.

Tu tarea es generar un prompt en INGLÉS para crear una imagen de tipo "${thematic}" basada en un artículo jurídico.

ANÁLISIS TEMÁTICO CRUCIAL:
1. IDENTIFICA EL TEMA CENTRAL del artículo (NO la institución emisora)
2. ENFÓCATE en los espacios/personas/objetos relacionados con ESE TEMA ESPECÍFICO
3. Para salud → espacios médicos colombianos, hospitales nacionales, EPS, consultorios
4. Para trabajo → oficinas colombianas, fábricas, espacios laborales urbanos
5. Para educación → colegios colombianos, universidades nacionales, aulas
6. Para vivienda → casas colombianas, urbanismo, construcción local
7. Para familia → hogares colombianos, centros de bienestar familiares
8. Para medio ambiente → espacios naturales colombianos, zonas industriales
9. Para consumidor → tiendas colombianas, centros comerciales, servicios locales

CONTEXTO COLOMBIANO SUTIL:
- Incluye elementos arquitectónicos y de diseño típicos colombianos
- Menciona "Colombian healthcare facility", "Colombian institutional design"
- Agrega referencias a "urban Colombian setting", "Colombian professional environment"
- Incluye detalles como "Latin American institutional architecture"

REGLAS CRÍTICAS:
- El prompt debe ser 100% en inglés
- Máximo 150 palabras
- Evita clichés legales (balanza de justicia, martillo de juez, tribunales genéricos)
- Analiza QUÉ CONFLICTO REAL se está resolviendo
- Genera espacios donde SUCEDE ESE CONFLICTO, no donde se juzga
- Incluye detalles de composición, iluminación y estilo fotográfico

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "prompt": "aquí tu prompt en inglés para la imagen",
  "metaDescription": "aquí una meta descripción de máximo 125 caracteres para SEO"
}

La metaDescription debe:
- Describir VISUALMENTE qué elementos, objetos o escenas aparecen en la imagen
- Usar lenguaje descriptivo como si fuera un alt text detallado
- Ejemplos: "Oficina moderna con documentos legales sobre escritorio de madera", "Profesionales discutiendo documentos en sala de juntas corporativa"
- No superar 125 caracteres incluyendo espacios
- Estar en español y ser útil para SEO y accesibilidad

PRIVACIDAD Y NEUTRALIDAD CRÍTICA:
- NUNCA incluir nombres específicos de empresas (Olímpica, Sanitas, etc.)
- NUNCA incluir nombres de personas reales
- USAR términos genéricos del sector (supermarket chain, healthcare provider, etc.)
- MANTENER contexto sectorial sin identificar marcas específicas
- PRESERVAR neutralidad periodística y profesional

INSTRUCCIONES POR TIPO:`;

    const thematicInstructions = {
      lugares: `
LUGARES: Genera espacios donde OCURRE EL CONFLICTO REAL (no tribunales). Analiza el sub-tema específico EN CONTEXTO COLOMBIANO:

SALUD - Espacios específicos por contexto colombiano:
- EPS/Petición: "modern Colombian healthcare administration office with patient service counters, Latin American institutional design"
- Hospital: "Colombian hospital emergency room with medical equipment, Colombian healthcare facility architecture"
- Farmacia: "Colombian pharmacy consultation room with medication dispensing area, typical Colombian medical setting"
- Salud Mental: "Colombian psychology clinic waiting room with calming therapeutic environment, Colombian professional healthcare design"
- General: "Colombian primary healthcare clinic with examination rooms, Colombian institutional medical facilities"

TRABAJO - Espacios específicos por contexto colombiano:
- Despido: "Colombian corporate HR office with meeting rooms, Colombian business architecture"
- Seguridad: "Colombian industrial workplace with safety equipment, Colombian factory setting"
- Sindicatos: "Colombian union headquarters conference room, Colombian institutional negotiation space"
- Salarios: "Colombian payroll administrative office, Colombian corporate financial environment"
- General: "Colombian modern corporate office environment, Colombian business district setting"

EDUCACIÓN - Espacios específicos por contexto colombiano:
- Acceso: "Colombian university admissions office, Colombian academic institutional design"
- Calidad: "Colombian modern classroom with educational technology, Colombian school architecture"
- Especial: "Colombian inclusive education classroom, Colombian special education facility"
- General: "Colombian academic institution library, Colombian university study areas"

CONSUMIDOR - Espacios específicos por contexto colombiano:
- Retail: "Colombian modern supermarket customer service area, Colombian retail environment"
- Financiero: "Colombian bank branch office with consultation booths, Colombian financial institution"
- Servicios Públicos: "Colombian public utilities customer service center, Colombian government office"
- Telecomunicaciones: "Colombian telecommunications service center, Colombian tech support facility"

VARIACIÓN CRÍTICA:
- Genera 3-5 elementos arquitectónicos únicos por espacio
- Especifica iluminación característica (natural/artificial/mixta)
- Incluye detalles de mobiliario específico del sector
- Agrega elementos tecnológicos apropiados
- Describe atmósfera específica del contexto profesional

NEUTRALIDAD EMPRESARIAL ABSOLUTA:
- "healthcare provider facility" NO "Sanitas clinic"
- "retail chain store" NO "Olimpica supermarket"
- "telecommunications company office" NO nombres específicos
- "financial institution branch" NO nombres de bancos específicos`,

      personas: `
PERSONAS: Genera personas en el CONTEXTO REAL específico del conflicto EN ENTORNO COLOMBIANO. Analiza el sub-tema:

SALUD - Personas específicas por contexto colombiano:
- EPS/Petición: "Colombian healthcare administrator reviewing patient requests, back view only, professional attire in Colombian hospital waiting area"
- Hospital: "Colombian medical staff in consultation, side profiles completely blurred, medical uniforms in Latin American hospital setting"
- Farmacia: "Colombian pharmacist explaining medication, hands visible only, white coat, face completely obscured, Colombian pharmacy environment"
- Salud Mental: "therapist and patient in session, both shown from behind, Colombian professional healthcare setting"

TRABAJO - Personas específicas por contexto colombiano:
- Despido: "Colombian HR professional and employee in meeting, back views only, business attire in Colombian corporate office"
- Seguridad: "Colombian safety inspector reviewing protocols, profile view with face in shadow, protective equipment visible"
- Sindicatos: "Colombian union representatives in negotiation, silhouettes around table in Colombian institutional setting"
- Salarios: "Colombian payroll administrator reviewing documents, hands visible only, Colombian office environment"

EDUCACIÓN - Personas específicas por contexto colombiano:
- Acceso: "Colombian admissions counselor assisting student, both back views, Colombian academic institution setting"
- Calidad: "Colombian teacher and students in classroom, general view from back, Colombian educational materials visible"
- Especial: "Colombian special education professional, side profile with face blurred, Colombian inclusive classroom"

PRIVACIDAD ABSOLUTA - TÉCNICAS OBLIGATORIAS:
- SIEMPRE usar "back view walking away from camera"
- OBLIGATORIO "side profile with face completely blurred/in shadow"
- REQUERIDO "hands visible holding documents, face entirely out of frame"
- ESENCIAL "silhouette against window light, unidentifiable features"
- MANDATORIO "group shot from elevated angle, faces completely unidentifiable"
- CRÍTICO "over-the-shoulder shot focusing on documents, face never visible"

ANONIMIZACIÓN TOTAL - NO NEGOCIABLE:
- NUNCA mostrar características faciales identificables
- USAR "completely blurred facial features", "face entirely obscured"
- ESPECIFICAR "unidentifiable individuals", "anonymous silhouettes"
- ENFORCAR "focus on body language and gestures, never facial expressions"
- REQUERIR "professional interaction without facial identification"

CONTEXTO COLOMBIANO ESPECÍFICO:
- "Colombian healthcare facility", "Latin American hospital waiting room"
- "Colombian institutional architecture", "urban Colombian professional setting"
- "Colombian corporate office environment", "Colombian educational institution"
- "Colombian public service center", "Colombian government office setting"

VESTIMENTA ESPECÍFICA POR SECTOR COLOMBIANO:
- Salud: "Colombian medical scrubs", "white coats typical in Colombian hospitals"
- Trabajo: "Colombian business attire", "professional Colombian corporate wear"
- Educación: "Colombian academic professional attire", "Colombian teaching wear"
- Consumidor: "Colombian service uniforms", "Colombian customer service attire"`,

      primer_plano: `
PRIMER PLANO: Objetos específicos del SUB-TEMA del conflicto. Evita documentos legales genéricos:

SALUD - Objetos específicos por contexto:
- EPS/Petición: "EPS membership card on desk, petition response letter, medical appointment forms"
- Hospital: "medical chart with stethoscope, diagnostic equipment close-up, hospital wristband"
- Farmacia: "prescription bottle with pills, medical prescription form, pharmacy label"
- Salud Mental: "psychological evaluation forms, therapy session notes, mental health assessment tools"

TRABAJO - Objetos específicos por contexto:
- Despido: "termination letter on desk, severance calculation documents, office box with belongings"
- Seguridad: "safety helmet and gloves, industrial safety manual, protective equipment"
- Sindicatos: "collective bargaining agreement, union membership card, negotiation documents"
- Salarios: "payroll statement detailed view, salary calculation spreadsheet, employment contract"

EDUCACIÓN - Objetos específicos por contexto:
- Acceso: "university application form, admission test results, enrollment documents"
- Calidad: "academic evaluation rubric, curriculum materials, educational assessment forms"
- Especial: "individualized education plan, accessibility accommodation documents"

CONSUMIDOR - Objetos específicos por contexto:
- Retail: "product receipt close-up, warranty certificate, consumer protection documentation"
- Financiero: "bank statement detailed view, credit agreement, financial service contract"
- Servicios Públicos: "utility bill close-up, service contract, public service complaint form"

COMPOSICIÓN TÉCNICA ESPECÍFICA:
- "macro lens 100mm shallow depth of field"
- "selective focus on key text or numbers"
- "soft professional lighting with subtle shadows"
- "document texture and paper grain visible"
- "hands partially visible holding or pointing to specific information"
- "office desk context with professional accessories"

VARIACIÓN DE ÁNGULOS:
- "overhead shot looking down at documents"
- "45-degree angle highlighting specific sections"
- "side angle showing document thickness and authenticity"
- "close-up corner detail with official stamps or signatures"`
    };

    let avoidanceNote = "";
    if (previousPrompts.length > 0) {
      avoidanceNote = `\n\nPROMPTS RECIENTES A EVITAR (genera algo DIFERENTE):
${previousPrompts.slice(-3).map((p, i) => `${i+1}. ${p.substring(0, 100)}...`).join('\n')}`;
    }

    return baseInstructions + (thematicInstructions[thematic as keyof typeof thematicInstructions] || thematicInstructions.primer_plano) + avoidanceNote;
  }

  /**
   * Construye el prompt del usuario con el contenido del artículo
   */
  private buildUserPrompt(articleText: string, thematic: string): string {
    const truncatedArticle = articleText.length > 2000
      ? articleText.substring(0, 2000) + "..."
      : articleText;

    return `ARTÍCULO JURÍDICO:
${truncatedArticle}

ANÁLISIS REQUERIDO:
1. IDENTIFICA el tema central/conflicto real del artículo (salud, trabajo, educación, consumidor, etc.)
2. IGNORA la institución emisora (corte, tribunal, etc.)
3. ENFÓCATE en dónde OCURRE realmente este tipo de conflicto

NEUTRALIDAD OBLIGATORIA:
- NO incluyas nombres específicos de empresas (Olímpica, Sanitas, etc.)
- NO incluyas nombres de personas reales
- USA términos genéricos del sector (supermarket, healthcare facility, etc.)
- MANTÉN el contexto sectorial sin identificar marcas

Ejemplos del enfoque correcto:
- Sentencia sobre EPS → "modern healthcare facility", NO "Sanitas clinic"
- Sentencia sobre despido laboral → "corporate office", NO "empresa XYZ office"
- Sentencia sobre educación → "university campus", NO "Universidad ABC"
- Sentencia sobre retail → "supermarket chain store", NO "Olimpica supermarket"

Genera un prompt creativo y específico para una imagen de tipo "${thematic}" que muestre el ESPACIO/PERSONA/OBJETO relacionado con el TEMA REAL del conflicto, manteniendo total neutralidad empresarial y personal.

Incluye también una metadescripción SEO de máximo 125 caracteres que describa la imagen de forma concisa.

Responde ÚNICAMENTE en formato JSON con "prompt" (en inglés) y "metaDescription" (en español), sin explicaciones adicionales.`;
  }

  /**
   * Analiza el contenido localmente cuando la IA no está disponible
   */
  private analyzeContentLocally(articleText: string): AnalysisResult {
    logger.info('🔍 Realizando análisis local del contenido');

    // Análisis temático expandido con sub-categorías específicas
    const isAfroCase = /afrocolombian|afrodescendient|negro|negra/i.test(articleText);
    const isIndigenousCase = /indígena|indígenas|ancestral|territorio|resguardo/i.test(articleText);
    const isEnvironmentalCase = /agua|río|ambiente|minería|deforest|contamina/i.test(articleText);

    // SALUD - Sub-categorías específicas
    const isHealthGeneral = /salud|eps|medicina|hospital|médico|enfermedad/i.test(articleText);
    const isHealthEPS = /eps|entidad promotora|sanitas|sura|nueva eps|cafesalud/i.test(articleText);
    const isHealthHospital = /hospital|clínica|centro médico|urgencias|cirugía/i.test(articleText);
    const isHealthMedication = /medicamento|droga|fármaco|tratamiento|prescripción/i.test(articleText);
    const isHealthMental = /salud mental|psiquiatra|psicología|depresión|ansiedad/i.test(articleText);
    const isHealthPetition = /derecho de petición|solicitud|respuesta|información médica|cita/i.test(articleText);

    // TRABAJO - Sub-categorías específicas
    const isLaborGeneral = /trabajo|empleo|laboral|sindicato|despido|salario/i.test(articleText);
    const isLaborDismissal = /despido|terminación|liquidación|cesantías|indemnización/i.test(articleText);
    const isLaborSafety = /riesgo laboral|accidente|seguridad industrial|arl|prevención/i.test(articleText);
    const isLaborUnion = /sindicato|sindical|negociación colectiva|huelga|fuero/i.test(articleText);
    const isLaborSalary = /salario|sueldo|nómina|prima|bonificación|mínimo/i.test(articleText);

    // EDUCACIÓN - Sub-categorías específicas
    const isEducationGeneral = /educación|colegio|universidad|estudiante|profesor|académico/i.test(articleText);
    const isEducationAccess = /acceso|matrícula|cupo|admisión|inclusión educativa/i.test(articleText);
    const isEducationQuality = /calidad educativa|currículo|evaluación|acreditación/i.test(articleText);
    const isEducationSpecial = /necesidades especiales|discapacidad|inclusión|adaptación/i.test(articleText);

    // CONSUMIDOR - Sub-categorías específicas
    const isConsumerGeneral = /consumidor|cliente|producto|servicio|comercio|compra/i.test(articleText);
    const isConsumerRetail = /supermercado|tienda|almacén|retail|venta|olímpica/i.test(articleText);
    const isConsumerFinancial = /banco|financiero|crédito|tarjeta|préstamo|interés/i.test(articleText);
    const isConsumerUtilities = /servicios públicos|agua|luz|gas|energía|acueducto/i.test(articleText);
    const isConsumerTelcom = /telecomunicaciones|internet|telefonía|celular|datos/i.test(articleText);

    // VIVIENDA - Sub-categorías específicas
    const isHousingGeneral = /vivienda|casa|hogar|arriendo|construcción|urbanismo/i.test(articleText);
    const isHousingRental = /arriendo|alquiler|canon|fiador|depósito|inquilino/i.test(articleText);
    const isHousingConstruction = /construcción|obra|urbanización|licencia|planos/i.test(articleText);
    const isHousingSocial = /vivienda de interés social|vis|subsidio habitacional/i.test(articleText);

    // FAMILIA - Sub-categorías específicas
    const isFamilyGeneral = /familia|matrimonio|divorcio|custodia|alimentos|patria/i.test(articleText);
    const isFamilyCustody = /custodia|régimen de visitas|menor|hijo|patria potestad/i.test(articleText);
    const isFamilyDomestic = /violencia intrafamiliar|maltrato|protección|refugio/i.test(articleText);

    // PENAL - Sub-categorías específicas
    const isPenalGeneral = /penal|delito|crimen|cárcel|prisión|condena/i.test(articleText);
    const isPenalDrugs = /narcóticos|drogas|estupefacientes|tráfico|porte/i.test(articleText);
    const isPenalCorruption = /corrupción|peculado|cohecho|enriquecimiento|soborno/i.test(articleText);

    // Determinar tipo de profesional específico
    const profesionalType = /juez|magistrado/i.test(articleText) ? 'magistrado' :
                            /abogad/i.test(articleText) ? 'abogado' :
                            /médico|doctor/i.test(articleText) ? 'healthcare professional' :
                            /profesor|docente/i.test(articleText) ? 'educational professional' :
                            /ingeniero|constructor/i.test(articleText) ? 'construction professional' :
                            /registrador/i.test(articleText) ? 'registrador' :
                            'profesional especializado';

    // Determinar escenario específico basado en sub-temas
    const escenarioType =
      // SALUD - Contextos específicos
      isHealthEPS ? 'modern EPS healthcare facility with patient service areas' :
      isHealthHospital ? 'hospital emergency room and medical consultation areas' :
      isHealthMedication ? 'pharmacy consultation room and medication dispensing area' :
      isHealthMental ? 'psychology clinic consultation room and therapy space' :
      isHealthPetition ? 'healthcare administrative office with patient service desk' :
      isHealthGeneral ? 'general healthcare facility with medical equipment' :

      // TRABAJO - Contextos específicos
      isLaborDismissal ? 'corporate human resources office and meeting room' :
      isLaborSafety ? 'industrial workplace with safety equipment and protocols' :
      isLaborUnion ? 'union headquarters meeting room and negotiation space' :
      isLaborSalary ? 'payroll office with administrative workstations' :
      isLaborGeneral ? 'modern corporate office environment' :

      // EDUCACIÓN - Contextos específicos
      isEducationAccess ? 'university admissions office and enrollment center' :
      isEducationQuality ? 'classroom and academic evaluation center' :
      isEducationSpecial ? 'inclusive education classroom with accessibility features' :
      isEducationGeneral ? 'educational institution classroom and library' :

      // CONSUMIDOR - Contextos específicos
      isConsumerRetail ? 'modern supermarket customer service area' :
      isConsumerFinancial ? 'bank branch office with customer consultation booths' :
      isConsumerUtilities ? 'public utilities customer service center' :
      isConsumerTelcom ? 'telecommunications service center and technical support area' :
      isConsumerGeneral ? 'retail customer service and consultation area' :

      // VIVIENDA - Contextos específicos
      isHousingRental ? 'real estate office with rental consultation area' :
      isHousingConstruction ? 'construction site office and urban planning area' :
      isHousingSocial ? 'social housing development and community center' :
      isHousingGeneral ? 'residential development and urban planning office' :

      // FAMILIA - Contextos específicos
      isFamilyCustody ? 'family counseling center and mediation room' :
      isFamilyDomestic ? 'family protection center and safe space' :
      isFamilyGeneral ? 'family court consultation and counseling area' :

      // PENAL - Contextos específicos
      isPenalDrugs ? 'forensic laboratory and evidence analysis center' :
      isPenalCorruption ? 'anti-corruption investigation office' :
      isPenalGeneral ? 'correctional facility administrative area' :

      // Casos especiales y fallbacks
      isEnvironmentalCase ? 'natural environment and conservation area' :
      /corte|tribunal supremo/i.test(articleText) ? 'high court judicial chamber' :
      /juzgado/i.test(articleText) ? 'local court facility' :
      /notaría/i.test(articleText) ? 'notary public office' :
      'professional legal institution';

    // Determinar objetos específicos por contexto
    const objetoType =
      // SALUD - Objetos específicos
      isHealthEPS ? 'EPS membership cards, medical appointment forms, and health insurance documents' :
      isHealthHospital ? 'medical charts, diagnostic equipment, and hospital administrative forms' :
      isHealthMedication ? 'prescription bottles, medical prescriptions, and pharmaceutical documentation' :
      isHealthMental ? 'psychological evaluation forms and mental health assessment tools' :
      isHealthPetition ? 'petition response letters and medical information request forms' :
      isHealthGeneral ? 'medical records and healthcare administrative documents' :

      // TRABAJO - Objetos específicos
      isLaborDismissal ? 'employment termination letters and severance documentation' :
      isLaborSafety ? 'safety helmets, protective equipment, and industrial safety manuals' :
      isLaborUnion ? 'collective bargaining agreements and union membership documents' :
      isLaborSalary ? 'payroll statements, salary calculation sheets, and employment contracts' :
      isLaborGeneral ? 'employment contracts and workplace documentation' :

      // EDUCACIÓN - Objetos específicos
      isEducationAccess ? 'university application forms and admission documents' :
      isEducationQuality ? 'academic evaluation forms and educational curriculum materials' :
      isEducationSpecial ? 'inclusive education plans and accessibility accommodation documents' :
      isEducationGeneral ? 'academic transcripts and educational certificates' :

      // CONSUMIDOR - Objetos específicos
      isConsumerRetail ? 'product receipts, warranty certificates, and shopping documentation' :
      isConsumerFinancial ? 'bank statements, credit agreements, and financial service contracts' :
      isConsumerUtilities ? 'utility bills, service contracts, and public service documentation' :
      isConsumerTelcom ? 'mobile phone contracts, internet service agreements, and telecom bills' :
      isConsumerGeneral ? 'purchase receipts and consumer protection documents' :

      // VIVIENDA - Objetos específicos
      isHousingRental ? 'rental agreements, lease contracts, and housing documentation' :
      isHousingConstruction ? 'construction blueprints, building permits, and architectural plans' :
      isHousingSocial ? 'social housing applications and subsidy documentation' :
      isHousingGeneral ? 'property deeds and real estate documents' :

      // Otros contextos
      isEnvironmentalCase ? 'environmental impact reports and conservation documents' :
      'official legal documents and administrative forms';

    return {
      profesional: profesionalType,
      grupoEtnico: isAfroCase ? 'afrocolombianos' :
                   isIndigenousCase ? 'indígenas colombianos' :
                   'profesional colombiano',
      escenario: escenarioType,
      objetoLegal: objetoType,
      tema: isHealthGeneral ? 'derecho a la salud y sistema de salud' :
            isLaborGeneral ? 'derecho laboral y relaciones de trabajo' :
            isEducationGeneral ? 'derecho a la educación y sistema educativo' :
            isConsumerGeneral ? 'derechos del consumidor y protección comercial' :
            isHousingGeneral ? 'derecho a la vivienda y desarrollo urbano' :
            isFamilyGeneral ? 'derecho de familia y protección familiar' :
            isPenalGeneral ? 'derecho penal y sistema de justicia' :
            isEnvironmentalCase ? 'derecho ambiental y conservación' :
            'normativa jurídica especializada',
      tono: isEnvironmentalCase ? 'esperanzador y sostenible' :
            isFamilyDomestic ? 'protector y empático' :
            isPenalGeneral ? 'serio y institucional' :
            isHealthMental ? 'calmado y profesional' :
            /conflicto|violencia/i.test(articleText) ? 'serio y solemne' :
            'profesional y contemporáneo',
      paletaColores: isEnvironmentalCase ? 'verdes naturales y azules sostenibles' :
                     isHealthGeneral ? 'azules médicos y blancos clínicos' :
                     isEducationGeneral ? 'azules académicos y tonos educativos' :
                     isLaborGeneral ? 'grises corporativos y azules profesionales' :
                     isAfroCase ? 'tonos cálidos y dorados culturales' :
                     isIndigenousCase ? 'tonos tierra y naturales ancestrales' :
                     'azules institucionales y grises contemporáneos'
    };
  }

  /**
   * Genera prompt y metadescripción basados en análisis con múltiples variaciones
   */
  private generateContentFromAnalysis(analysis: AnalysisResult, thematic: string): GeneratedImageContent {
    // Templates múltiples para mayor diversidad
    const templateVariations = {
      lugares: [
        `Professional architectural photography of ${analysis.escenario}, captured with wide-angle 24mm lens, natural daylight streaming through large windows. Modern Colombian institutional design, ${analysis.tono} professional atmosphere, ${analysis.paletaColores} color scheme. Contemporary editorial style, high resolution, realistic documentary approach.`,

        `Interior documentary shot of ${analysis.escenario}, photographed with 35mm lens, balanced artificial and natural lighting. Professional space design related to ${analysis.tema}, clean architectural lines, ${analysis.tono} ambiance. Commercial photography quality, sharp focus, institutional aesthetic.`,

        `Wide-angle environmental portrait of ${analysis.escenario}, shot from elevated perspective, soft diffused lighting. Colombian professional facility, ${analysis.paletaColores} institutional colors, modern functional design. Photojournalistic documentary style, high-end commercial quality.`,

        `Architectural detail photograph of ${analysis.escenario}, 50mm lens perspective, morning natural light. Professional institutional environment, ${analysis.tono} atmosphere, contemporary Colombian design elements. Editorial magazine quality, realistic rendering, professional composition.`,

        `Environmental documentary photography of ${analysis.escenario}, captured with tilt-shift lens technique, ambient professional lighting. Modern institutional space related to ${analysis.tema}, ${analysis.paletaColores} color palette. High-end commercial photography, realistic style.`
      ],

      personas: [
        `Professional documentary photography, 85mm portrait lens, natural window lighting. ${analysis.profesional} working in ${analysis.escenario}, back view silhouette, formal professional attire, hands visible interacting with ${analysis.objetoLegal}. No identifiable facial features, ${analysis.tono} atmosphere, photojournalistic style.`,

        `Corporate environmental portrait, 50mm lens, soft artificial lighting. Side profile of ${analysis.profesional} in ${analysis.escenario}, face in shadow, professional uniform, engaged with ${analysis.objetoLegal}. Blurred facial features, ${analysis.paletaColores} color scheme, editorial quality.`,

        `Documentary lifestyle photography, 35mm lens, available light technique. ${analysis.profesional} shown from behind in ${analysis.escenario}, professional posture, hands holding ${analysis.objetoLegal}. Complete anonymity preserved, ${analysis.tono} professional mood, realistic style.`,

        `Over-shoulder documentary shot, 70mm lens, balanced studio lighting. ${analysis.profesional} working with ${analysis.objetoLegal} in ${analysis.escenario}, focus on hands and documents, face out of frame. Professional setting, ${analysis.paletaColores} institutional colors.`,

        `Wide-angle professional scene, 24mm lens, ambient office lighting. Multiple silhouettes of professionals in ${analysis.escenario}, unidentifiable faces, formal attire, ${analysis.objetoLegal} prominently featured. Group anonymity, ${analysis.tono} atmosphere, commercial quality.`
      ],

      primer_plano: [
        `Macro documentary photography, 100mm macro lens, controlled studio lighting. Close-up detail of ${analysis.objetoLegal} on professional desk surface, selective focus on key information, hands partially visible. ${analysis.paletaColores} color scheme, institutional context, high-resolution detail.`,

        `Product photography style, 85mm lens, soft box lighting setup. Overhead perspective of ${analysis.objetoLegal}, organized on clean desk surface, official document texture visible. Professional composition, ${analysis.tono} mood, editorial quality.`,

        `Forensic documentation style, 60mm macro lens, even diffused lighting. ${analysis.objetoLegal} photographed at 45-degree angle, official stamps and signatures visible, professional office context. Administrative atmosphere, realistic detail capture.`,

        `Editorial still life, 50mm lens, natural window light. ${analysis.objetoLegal} arranged with related professional items, shallow depth of field, texture and paper grain prominent. ${analysis.paletaColores} institutional colors, magazine quality.`,

        `Documentary evidence photography, 100mm macro lens, professional lighting kit. Corner detail of ${analysis.objetoLegal}, focusing on official text and markings, clean professional background. Legal documentation style, high clarity, realistic rendering.`
      ]
    };

    // Seleccionar template aleatorio para mayor variación
    const availableTemplates = templateVariations[thematic as keyof typeof templateVariations] || templateVariations.primer_plano;
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    const selectedTemplate = availableTemplates[randomIndex];

    // Instrucciones técnicas variadas
    const technicalVariations = [
      `Professional commercial photography, editorial publication quality, high resolution 300dpi, balanced exposure, sharp detail throughout.`,
      `Documentary photojournalism style, suitable for legal publication, professional lighting setup, realistic color rendering, publication-ready quality.`,
      `Corporate editorial photography, institutional communication standard, high-end commercial quality, appropriate for professional documentation.`,
      `Administrative documentation photography, forensic clarity, professional institutional style, suitable for official publication.`,
      `Contemporary commercial photography, professional editorial standard, high-resolution capture, balanced composition for publication use.`
    ];

    const randomTechIndex = Math.floor(Math.random() * technicalVariations.length);
    const selectedTechnical = technicalVariations[randomTechIndex];

    const prompt = `${selectedTemplate} ${selectedTechnical}`;

    // Generar metadescripción basada en el análisis
    const metaDescription = this.generateMetaDescription(analysis, thematic);

    return {
      prompt,
      metaDescription
    };
  }

  /**
   * Genera metadescripción basada en análisis local
   */
  private generateMetaDescription(analysis: AnalysisResult, thematic: string): string {
    const metaTemplates = {
      lugares: [
        "Oficina moderna con escritorio ejecutivo y documentos legales organizados",
        "Sala de reuniones corporativa con mesa de juntas y archivos institucionales",
        "Ambiente institucional con mobiliario profesional y papelería oficial",
        "Espacio de trabajo profesional con documentación legal sobre escritorio"
      ],
      personas: [
        "Profesionales en reunión de trabajo revisando documentos legales",
        "Equipo de abogados consultando expedientes en oficina moderna",
        "Consultores especializados analizando documentación institucional",
        "Expertos legales trabajando con archivos y formularios oficiales"
      ],
      primer_plano: [
        "Documentos oficiales extendidos sobre escritorio de madera",
        "Formularios legales y sellos institucionales en primer plano",
        "Papelería oficial con firmas y documentación legal visible",
        "Expedientes y archivos legales organizados sobre superficie de trabajo"
      ]
    };

    const templates = metaTemplates[thematic as keyof typeof metaTemplates] || metaTemplates.primer_plano;
    const randomIndex = Math.floor(Math.random() * templates.length);
    const selectedTemplate = templates[randomIndex];

    // Asegurar que no exceda 125 caracteres
    return selectedTemplate.length > 125
      ? selectedTemplate.substring(0, 122) + '...'
      : selectedTemplate;
  }

  /**
   * Agrega prompt al historial para evitar repeticiones
   */
  private addToHistory(prompt: string): void {
    this.recentPrompts.add(prompt);
    if (this.recentPrompts.size > this.maxHistorySize) {
      const promptsArray = Array.from(this.recentPrompts);
      this.recentPrompts = new Set(promptsArray.slice(-this.maxHistorySize));
    }
  }

  /**
   * Obtiene prompts recientes para evitar repeticiones
   */
  private getRecentPrompts(): string[] {
    return Array.from(this.recentPrompts).slice(-5);
  }

  /**
   * Content de fallback cuando todo falla - con variaciones múltiples
   */
  private getFallbackPrompt(thematic: string): GeneratedImageContent {
    const fallbackVariations = {
      lugares: [
        "Modern Colombian administrative office with professional lighting, Colombian institutional architecture, clean professional environment",
        "Colombian healthcare facility waiting area, Colombian medical institution design, natural lighting through large windows",
        "Colombian corporate office meeting room, Colombian business environment, institutional furniture and contemporary design",
        "Colombian educational institution administrative area, Colombian academic setting, Colombian institutional architecture",
        "Colombian government office consultation space, Colombian institutional design, clean administrative environment"
      ],
      personas: [
        "Colombian professional consultation scene with individuals shown from back view only, completely blurred faces preserving anonymity, Colombian office setting",
        "Colombian healthcare professionals in consultation, side profiles entirely blurred, medical uniforms visible, Colombian clinical environment",
        "Colombian business meeting participants from behind, professional attire, Colombian corporate office setting, faces completely unidentifiable",
        "Colombian administrative staff at work, back views only, professional clothing, Colombian institutional workplace",
        "Colombian educational professionals in consultation, Colombian academic setting, faces entirely obscured, Colombian professional interaction"
      ],
      primer_plano: [
        "Close-up of official documents on professional desk, administrative paperwork, soft professional lighting",
        "Medical forms and healthcare documentation, close-up view, professional medical office setting",
        "Business contracts and corporate documents, macro photography, professional office environment",
        "Educational certificates and academic documents, detailed close-up, institutional setting",
        "Administrative forms and official paperwork, document photography, professional lighting setup"
      ]
    };

    const variations = fallbackVariations[thematic as keyof typeof fallbackVariations] || fallbackVariations.lugares;
    const randomIndex = Math.floor(Math.random() * variations.length);
    const prompt = variations[randomIndex] || fallbackVariations.lugares[0];

    // Generar metadescripción simple para fallback
    const fallbackMetaDescriptions = {
      lugares: "Oficina profesional con mobiliario ejecutivo y ambiente institucional",
      personas: "Profesionales en consulta trabajando con documentación legal",
      primer_plano: "Documentos oficiales y formularios extendidos sobre escritorio"
    };

    const metaDescription = fallbackMetaDescriptions[thematic as keyof typeof fallbackMetaDescriptions] || fallbackMetaDescriptions.lugares;

    return {
      prompt,
      metaDescription
    };
  }

  /**
   * Valida y filtra contenido sensible
   */
  private validateContentSafety(analysis: AnalysisResult): AnalysisResult {
    const sensitiveTerms = [
      'niño', 'niña', 'menor', 'infante', 'bebé', 'adolescente',
      'familia', 'hijo', 'hija', 'padre', 'madre', 'hermano', 'hermana',
      'violencia', 'abuso', 'maltrato', 'conflicto armado', 'guerra',
      'muerte', 'fallecimiento', 'víctima', 'acusado', 'delito grave'
    ];

    const content = JSON.stringify(analysis).toLowerCase();
    const hasSensitiveContent = sensitiveTerms.some(term => content.includes(term));

    if (hasSensitiveContent) {
      logger.warn('⚠️ Contenido sensible detectado, aplicando filtros adicionales');
      return {
        ...analysis,
        profesional: 'profesional legal especializado',
        escenario: 'institución jurídica colombiana',
        objetoLegal: 'documentos legales oficiales',
        grupoEtnico: 'profesional colombiano',
        tono: 'profesional y formal'
      };
    }

    return analysis;
  }
}

// Instancia singleton para uso en el sistema
export const aiImagePromptGenerator = new AIImagePromptGenerator();
export default aiImagePromptGenerator;