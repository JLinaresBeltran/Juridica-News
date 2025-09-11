export interface MockArticle {
  id: string
  title: string
  excerpt: string
  imageUrl: string
  category: string
  publishedAt: string
  author: string
  readTime: string
  slug: string
  isFeatured?: boolean
  tags: string[]
}

export const mockArticles: MockArticle[] = [
  // ACTUALIDAD - 5 artículos más recientes
  {
    id: '1',
    title: 'Corte Constitucional amplía protección a derechos de víctimas del conflicto armado',
    excerpt: 'La sentencia T-085 de 2024 establece nuevos criterios para la reparación integral y la participación efectiva de las víctimas en los procesos judiciales.',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop',
    category: 'Constitucional',
    publishedAt: '2024-01-15',
    author: 'Dr. María González',
    readTime: '8 min',
    slug: 'corte-constitucional-proteccion-victimas-conflicto',
    tags: ['Derechos Humanos', 'Conflicto Armado', 'Reparación']
  },
  {
    id: '2', 
    title: 'Nueva reforma al Código Civil moderniza contratos digitales',
    excerpt: 'El proyecto de ley 156 de 2024 introduce figuras jurídicas para regular la contratación electrónica y la validez de la firma digital.',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
    category: 'Civil',
    publishedAt: '2024-01-14',
    author: 'Dr. Carlos Rodríguez',
    readTime: '6 min',
    slug: 'reforma-codigo-civil-contratos-digitales',
    tags: ['Derecho Digital', 'Contratos', 'Firma Electrónica']
  },
  {
    id: '3',
    title: 'Corte Suprema unifica criterios sobre feminicidio agravado',
    excerpt: 'La Sala Penal establece precedente vinculante sobre los elementos configurativos del feminicidio y sus circunstancias de agravación.',
    imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=250&fit=crop',
    category: 'Penal',
    publishedAt: '2024-01-13',
    author: 'Dra. Ana Patricia López',
    readTime: '10 min',
    slug: 'corte-suprema-feminicidio-agravado-criterios',
    tags: ['Feminicidio', 'Violencia de Género', 'Jurisprudencia']
  },
  {
    id: '4',
    title: 'Consejo de Estado ordena revisión de política laboral en teletrabajo',
    excerpt: 'Nueva sentencia obliga al Ministerio de Trabajo a actualizar la regulación sobre derechos y deberes en modalidades de trabajo remoto.',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=250&fit=crop',
    category: 'Laboral',
    publishedAt: '2024-01-12',
    author: 'Dr. Roberto Silva',
    readTime: '7 min',
    slug: 'consejo-estado-politica-laboral-teletrabajo',
    tags: ['Teletrabajo', 'Derechos Laborales', 'Política Pública']
  },
  {
    id: '5',
    title: 'Tribunal Administrativo anula licitación millonaria por irregularidades',
    excerpt: 'El fallo evidencia violaciones al debido proceso y al principio de transparencia en la contratación pública de infraestructura vial.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    category: 'Administrativo',
    publishedAt: '2024-01-11',
    author: 'Dr. Luis Hernández',
    readTime: '9 min',
    slug: 'tribunal-administrativo-anula-licitacion-irregularidades',
    tags: ['Contratación Pública', 'Transparencia', 'Infraestructura']
  },

  // ARTÍCULOS INDIVIDUALES - 3 artículos
  {
    id: '6',
    title: 'Análisis: Impacto de la reforma tributaria en pequeñas empresas',
    excerpt: 'Examen detallado de las nuevas obligaciones fiscales y sus efectos en el sector empresarial de menor escala.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    category: 'Tributario',
    publishedAt: '2024-01-10',
    author: 'Dr. Patricia Morales',
    readTime: '12 min',
    slug: 'analisis-reforma-tributaria-pequenas-empresas',
    tags: ['Reforma Tributaria', 'Pequeñas Empresas', 'PYMES']
  },
  {
    id: '7',
    title: 'Superintendencia Financiera actualiza circular sobre lavado de activos',
    excerpt: 'Nuevas medidas de prevención y control obligan a entidades financieras a fortalecer sus sistemas de reporte.',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop',
    category: 'Comercial',
    publishedAt: '2024-01-09',
    author: 'Dr. Fernando Castro',
    readTime: '8 min',
    slug: 'superfinanciera-circular-lavado-activos',
    tags: ['Lavado de Activos', 'Sistema Financiero', 'Compliance']
  },
  {
    id: '8',
    title: 'Corte modifica régimen de custodia y alimentos tras separación',
    excerpt: 'Sentencia establece nuevos criterios para determinar la custodia compartida y el monto de obligaciones alimentarias.',
    imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=250&fit=crop',
    category: 'Familia',
    publishedAt: '2024-01-08',
    author: 'Dra. Isabella Vargas',
    readTime: '11 min',
    slug: 'corte-modifica-regimen-custodia-alimentos',
    tags: ['Derecho de Familia', 'Custodia', 'Alimentos']
  },

  // EXPEDIENTE JUDICIAL - Artículos especializados
  {
    id: '9',
    title: 'Expediente: Caso emblemático de corrupción en contratación estatal',
    excerpt: 'Seguimiento al proceso penal contra exfuncionarios por irregularidades en contratos de salud pública.',
    imageUrl: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&h=250&fit=crop',
    category: 'Penal',
    publishedAt: '2024-01-07',
    author: 'Dr. Miguel Torres',
    readTime: '15 min',
    slug: 'expediente-corrupcion-contratacion-estatal',
    tags: ['Corrupción', 'Expediente Judicial', 'Contratos Estatales'],
    isFeatured: true
  },

  // ARTÍCULOS ADICIONALES - 2 artículos después de expediente
  {
    id: '10',
    title: 'Jurisprudencia internacional influye en decisiones de altas cortes',
    excerpt: 'Análisis del uso de precedentes internacionales en la argumentación de sentencias constitucionales y penales.',
    imageUrl: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=400&h=250&fit=crop',
    category: 'Internacional',
    publishedAt: '2024-01-06',
    author: 'Dr. Alejandro Ruiz',
    readTime: '13 min',
    slug: 'jurisprudencia-internacional-altas-cortes',
    tags: ['Derecho Internacional', 'Precedentes', 'Jurisprudencia']
  },
  {
    id: '11',
    title: 'Procuraduría investiga irregularidades en procesos disciplinarios',
    excerpt: 'Nuevos hallazgos revelan fallas sistemáticas en la tramitación de procesos contra servidores públicos.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    category: 'Administrativo',
    publishedAt: '2024-01-05',
    author: 'Dra. Carmen Jiménez',
    readTime: '9 min',
    slug: 'procuraduria-investigacion-procesos-disciplinarios',
    tags: ['Procesos Disciplinarios', 'Servidores Públicos', 'Control']
  },

  // DESTACADOS DE LA SEMANA - 4 artículos curados
  {
    id: '12',
    title: 'Balance semanal: Las 5 sentencias que marcaron la jurisprudencia',
    excerpt: 'Recopilación de los fallos más relevantes emitidos por las altas cortes durante esta semana.',
    imageUrl: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=400&h=250&fit=crop',
    category: 'Constitucional',
    publishedAt: '2024-01-04',
    author: 'Equipo Editorial',
    readTime: '20 min',
    slug: 'balance-semanal-sentencias-jurisprudencia',
    tags: ['Balance Semanal', 'Jurisprudencia', 'Destacados'],
    isFeatured: true
  },
  {
    id: '13',
    title: 'Entrevista: Magistrado habla sobre retos del sistema judicial',
    excerpt: 'Conversación exclusiva sobre los desafíos actuales de la justicia colombiana y propuestas de modernización.',
    imageUrl: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400&h=250&fit=crop',
    category: 'Constitucional',
    publishedAt: '2024-01-03',
    author: 'Dr. Elena Martínez',
    readTime: '18 min',
    slug: 'entrevista-magistrado-retos-sistema-judicial',
    tags: ['Entrevista', 'Sistema Judicial', 'Modernización'],
    isFeatured: true
  },
  {
    id: '14',
    title: 'Informe especial: Estado actual del derecho digital en Colombia',
    excerpt: 'Análisis comprehensivo sobre la evolución normativa y jurisprudencial en materia de tecnología y derecho.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    category: 'Civil',
    publishedAt: '2024-01-02',
    author: 'Dr. Santiago Pérez',
    readTime: '25 min',
    slug: 'informe-especial-derecho-digital-colombia',
    tags: ['Derecho Digital', 'Tecnología', 'Informe Especial'],
    isFeatured: true
  },
  {
    id: '15',
    title: 'Guía práctica: Nuevos procedimientos en derecho laboral 2024',
    excerpt: 'Manual actualizado sobre cambios procedimentales en demandas laborales y mecanismos de conciliación.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=250&fit=crop',
    category: 'Laboral',
    publishedAt: '2024-01-01',
    author: 'Dra. Lucía Ramírez',
    readTime: '16 min',
    slug: 'guia-practica-procedimientos-derecho-laboral-2024',
    tags: ['Guía Práctica', 'Procedimientos', 'Derecho Laboral'],
    isFeatured: true
  },
  
  // Artículos adicionales para completar categorías
  {
    id: '21',
    title: 'Inteligencia Artificial en el sector jurídico: ¿realidad o expectativa?',
    excerpt: 'Análisis sobre la implementación de IA en firmas de abogados y juzgados colombianos.',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop',
    category: 'Digital',
    publishedAt: '2024-01-10',
    author: 'Dr. Andrés Tech',
    readTime: '12 min',
    slug: 'inteligencia-artificial-sector-juridico-colombia',
    tags: ['IA', 'Tecnología Legal', 'Innovación']
  },
  {
    id: '22',
    title: 'Blockchain y contratos inteligentes: el futuro de las transacciones',
    excerpt: 'Cómo la tecnología blockchain está revolucionando el derecho contractual.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
    category: 'Digital',
    publishedAt: '2024-01-08',
    author: 'Dra. Marina Cripto',
    readTime: '9 min',
    slug: 'blockchain-contratos-inteligentes-futuro',
    tags: ['Blockchain', 'Contratos Inteligentes', 'Fintech']
  },
  {
    id: '23',
    title: 'Nueva ley de sociedades comerciales simplifica constitución de empresas',
    excerpt: 'Los cambios normativos que agilizan los trámites para crear sociedades en Colombia.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=250&fit=crop',
    category: 'Comercial',
    publishedAt: '2024-01-09',
    author: 'Dr. Rafael Empresa',
    readTime: '7 min',
    slug: 'nueva-ley-sociedades-comerciales-simplificacion',
    tags: ['Sociedades', 'Empresas', 'Trámites']
  },
  {
    id: '24',
    title: 'Derecho de la competencia: análisis de concentraciones empresariales',
    excerpt: 'Estudio sobre las últimas decisiones de la SIC en materia de fusiones y adquisiciones.',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop',
    category: 'Comercial',
    publishedAt: '2024-01-07',
    author: 'Dra. Carla Competencia',
    readTime: '11 min',
    slug: 'derecho-competencia-concentraciones-empresariales',
    tags: ['Competencia', 'SIC', 'Fusiones']
  },
  {
    id: '25',
    title: 'Contratación estatal: nuevas reglas para licitaciones públicas',
    excerpt: 'Actualización normativa en contratación pública y sus implicaciones prácticas.',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
    category: 'Administrativo',
    publishedAt: '2024-01-06',
    author: 'Dr. Pablo Estatal',
    readTime: '13 min',
    slug: 'contratacion-estatal-nuevas-reglas-licitaciones',
    tags: ['Contratación Estatal', 'Licitaciones', 'Estado']
  },
  {
    id: '26',
    title: 'Control fiscal en tiempos de pandemia: lecciones aprendidas',
    excerpt: 'Análisis de los mecanismos de control fiscal implementados durante la emergencia sanitaria.',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=250&fit=crop',
    category: 'Administrativo',
    publishedAt: '2024-01-05',
    author: 'Dra. Elena Fiscal',
    readTime: '8 min',
    slug: 'control-fiscal-pandemia-lecciones-aprendidas',
    tags: ['Control Fiscal', 'Pandemia', 'Estado']
  },
  {
    id: '27',
    title: '¿Es necesaria una reforma a la justicia penal juvenil?',
    excerpt: 'Reflexión sobre los desafíos del sistema de responsabilidad penal adolescente.',
    imageUrl: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=400&h=250&fit=crop',
    category: 'Opinión',
    publishedAt: '2024-01-04',
    author: 'Dr. Miguel Opina',
    readTime: '6 min',
    slug: 'reforma-justicia-penal-juvenil-necesaria',
    tags: ['Opinión', 'Justicia Juvenil', 'Reforma']
  },
  {
    id: '28',
    title: 'El futuro de los derechos humanos en Colombia: una perspectiva crítica',
    excerpt: 'Análisis crítico sobre los avances y retrocesos en materia de derechos humanos.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop',
    category: 'Opinión',
    publishedAt: '2024-01-03',
    author: 'Dra. Sofia Crítica',
    readTime: '14 min',
    slug: 'futuro-derechos-humanos-colombia-perspectiva',
    tags: ['Derechos Humanos', 'Opinión', 'Colombia']
  }
]

// Funciones helper para organizar artículos
export const getLatestArticles = (count: number = 5): MockArticle[] => {
  return mockArticles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count)
}

export const getFeaturedArticles = (): MockArticle[] => {
  return mockArticles.filter(article => article.isFeatured)
}

// Nuevas funciones para filtrado por sección
export const getArticlesByCategory = (category: string, limit?: number): MockArticle[] => {
  const filtered = mockArticles.filter(article => 
    article.category.toLowerCase() === category.toLowerCase()
  )
  return limit ? filtered.slice(0, limit) : filtered
}

export const getArticleCountByCategory = (category: string): number => {
  return mockArticles.filter(article => 
    article.category.toLowerCase() === category.toLowerCase()
  ).length
}

// Mapeo de secciones del periódico a categorías
export const sectionCategoryMap: Record<string, string> = {
  'digital': 'Digital',
  'civil': 'Civil', 
  'penal': 'Penal',
  'familia': 'Familia',
  'laboral': 'Laboral',
  'tributario': 'Tributario',
  'comercial': 'Comercial',
  'administrativo': 'Administrativo',
  'opinion': 'Opinión'
}

export const getSectionDisplayName = (sectionKey: string): string => {
  const displayNames: Record<string, string> = {
    'digital': 'Digital',
    'civil': 'Derecho Civil',
    'penal': 'Derecho Penal', 
    'familia': 'Derecho de Familia',
    'laboral': 'Derecho Laboral',
    'tributario': 'Derecho Tributario',
    'comercial': 'Derecho Comercial',
    'administrativo': 'Derecho Administrativo',
    'opinion': 'Opinión'
  }
  return displayNames[sectionKey] || sectionKey
}


export const getJudicialExpedients = (): MockArticle[] => {
  return mockArticles.filter(article => 
    article.tags.includes('Expediente Judicial') || 
    article.title.toLowerCase().includes('expediente')
  )
}

// Función para obtener artículos por slug
export const getArticleBySlug = (slug: string): MockArticle | undefined => {
  return mockArticles.find(article => article.slug === slug)
}

// Función para obtener artículos relacionados
export const getRelatedArticles = (currentArticle: MockArticle, limit: number = 4): MockArticle[] => {
  const related = mockArticles.filter(article => {
    // Excluir el artículo actual
    if (article.id === currentArticle.id) return false
    
    // Misma categoría
    if (article.category === currentArticle.category) return true
    
    // Tags en común
    const commonTags = article.tags.filter(tag => 
      currentArticle.tags.includes(tag)
    )
    return commonTags.length > 0
  })
  
  // Ordenar por relevancia (misma categoría primero, luego por tags comunes)
  const sorted = related.sort((a, b) => {
    const aSameCategory = a.category === currentArticle.category ? 1 : 0
    const bSameCategory = b.category === currentArticle.category ? 1 : 0
    
    if (aSameCategory !== bSameCategory) {
      return bSameCategory - aSameCategory
    }
    
    const aCommonTags = a.tags.filter(tag => currentArticle.tags.includes(tag)).length
    const bCommonTags = b.tags.filter(tag => currentArticle.tags.includes(tag)).length
    
    return bCommonTags - aCommonTags
  })
  
  return sorted.slice(0, limit)
}