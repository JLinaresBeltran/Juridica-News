// Tipo unificado para artículos en el portal público
// Funciona tanto con datos del API real como con mock data
export interface PublicArticle {
  id: string
  title: string
  slug: string
  summary: string
  imageUrl?: string
  category: string
  publishedAt: string
  readingTime: number
  author?: {
    firstName: string
    lastName: string
  }
  tags?: string[]
  viewCount?: number
}

// Función adaptadora para convertir datos del API a PublicArticle
export const adaptApiToPublicArticle = (apiData: any): PublicArticle => {
  // Buscar imagen generada disponible
  let imageUrl = undefined
  if (apiData.generatedImages && apiData.generatedImages.length > 0) {
    // Usar la primera imagen generada disponible
    const firstImage = apiData.generatedImages[0]
    imageUrl = firstImage.originalUrl || `/api/storage/images/${firstImage.filename}`
  }

  return {
    id: apiData.id,
    title: apiData.title,
    slug: apiData.slug,
    summary: apiData.summary || '',
    imageUrl: imageUrl,
    category: getCategoryDisplayName(apiData.legalArea || 'General'),
    publishedAt: apiData.publishedAt,
    readingTime: apiData.readingTime,
    author: apiData.author ? {
      firstName: apiData.author.firstName,
      lastName: apiData.author.lastName
    } : undefined,
    tags: apiData.tags ? apiData.tags.split(',').filter(t => t.trim()) : [],
    viewCount: apiData.views || 0
  }
}

// Función adaptadora para convertir MockArticle a PublicArticle
export const adaptMockToPublicArticle = (mockData: any): PublicArticle => {
  return {
    id: mockData.id,
    title: mockData.title,
    slug: mockData.slug,
    summary: mockData.excerpt || '',
    imageUrl: mockData.imageUrl,
    category: mockData.category,
    publishedAt: mockData.publishedAt,
    readingTime: parseInt(mockData.readTime?.replace(' min', '') || '5'),
    author: mockData.author ? {
      firstName: mockData.author.split(' ')[0] || '',
      lastName: mockData.author.split(' ').slice(1).join(' ') || ''
    } : undefined,
    tags: mockData.tags || [],
    viewCount: 0
  }
}

// Mapeo de áreas legales a nombres de categorías
const getCategoryDisplayName = (legalArea: string): string => {
  const categoryMap: Record<string, string> = {
    'CIVIL': 'Civil',
    'PENAL': 'Penal',
    'COMERCIAL': 'Comercial',
    'LABORAL': 'Laboral',
    'ADMINISTRATIVO': 'Administrativo',
    'TRIBUTARIO': 'Tributario',
    'CONSTITUCIONAL': 'Constitucional',
    'FAMILIA': 'Familia',
    'DIGITAL': 'Digital',
    'General': 'General'
  }
  return categoryMap[legalArea] || legalArea
}

// Imagen por defecto para artículos sin imagen
export const getDefaultArticleImage = (category: string): string => {
  const defaultImages: Record<string, string> = {
    'Civil': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
    'Penal': 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=250&fit=crop',
    'Comercial': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=250&fit=crop',
    'Laboral': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=250&fit=crop',
    'Administrativo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    'Tributario': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    'Constitucional': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop',
    'Familia': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=250&fit=crop',
    'Digital': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop'
  }

  return defaultImages[category] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop'
}