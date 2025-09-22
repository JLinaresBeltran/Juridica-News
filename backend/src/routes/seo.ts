import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Función para generar slug SEO-friendly
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Función para generar URL de artículo
const generateArticleUrl = (title: string, section: string, id: string): string => {
  const titleSlug = generateSlug(title)
  const sectionSlug = generateSlug(section)
  const shortTitleSlug = titleSlug.length > 60
    ? titleSlug.substring(0, 60).replace(/-[^-]*$/, '')
    : titleSlug

  return `/${sectionSlug}/${shortTitleSlug}-${id}`
}

// GET /api/seo/sitemap.xml - Generar sitemap dinámico
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://linea-judicial.com'

    // URLs estáticas
    const staticUrls = [
      {
        loc: `${baseUrl}/portal`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: `${baseUrl}/portal/constitucional`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/administrativo`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/fiscal`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/societario`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/penal`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/civil`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/digital`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/laboral`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/regulatorio`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: `${baseUrl}/portal/opinion`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      }
    ]

    // Obtener artículos publicados
    const publishedArticles = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        section: true,
        createdAt: true,
        updatedAt: true,
        slug: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // URLs de artículos
    const articleUrls = publishedArticles.map(article => {
      const url = article.slug
        ? `${baseUrl}${article.slug}`
        : `${baseUrl}${generateArticleUrl(article.title, article.section, article.id)}`

      return {
        loc: url,
        lastmod: article.updatedAt.toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.8'
      }
    })

    // Combinar todas las URLs
    const allUrls = [...staticUrls, ...articleUrls]

    // Generar XML del sitemap
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.status(200).send(sitemapXml)

  } catch (error) {
    console.error('Error generando sitemap:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/seo/robots.txt - Generar robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://linea-judicial.com'

  const robotsTxt = `User-agent: *
Allow: /portal/
Allow: /constitucional/
Allow: /administrativo/
Allow: /fiscal/
Allow: /societario/
Allow: /penal/
Allow: /civil/
Allow: /digital/
Allow: /laboral/
Allow: /regulatorio/
Allow: /opinion/

Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /login
Disallow: /register
Disallow: /_next/
Disallow: /static/

# Sitemap
Sitemap: ${baseUrl}/api/seo/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Google specific
User-agent: Googlebot
Allow: /

# Bing specific
User-agent: Bingbot
Allow: /

# Block bad bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`

  res.set('Content-Type', 'text/plain')
  res.status(200).send(robotsTxt)
})

// GET /api/seo/health - Health check para SEO
router.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`

    // Contar artículos publicados
    const publishedCount = await prisma.article.count({
      where: { status: 'published' }
    })

    // Contar documentos procesados
    const documentsCount = await prisma.document.count()

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        publishedArticles: publishedCount,
        totalDocuments: documentsCount,
        sitemapUrl: `${process.env.BASE_URL || 'https://linea-judicial.com'}/api/seo/sitemap.xml`,
        robotsUrl: `${process.env.BASE_URL || 'https://linea-judicial.com'}/api/seo/robots.txt`
      }
    })
  } catch (error) {
    console.error('SEO Health check failed:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    })
  }
})

// GET /api/seo/meta/:articleId - Obtener metadata de artículo específico
router.get('/meta/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        description: true,
        section: true,
        keywords: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        imageUrl: true,
        content: true
      }
    })

    if (!article) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    // Generar URL canónica
    const baseUrl = process.env.BASE_URL || 'https://linea-judicial.com'
    const canonicalUrl = article.slug
      ? `${baseUrl}${article.slug}`
      : `${baseUrl}${generateArticleUrl(article.title, article.section, article.id)}`

    // Calcular tiempo de lectura
    const wordsPerMinute = 200
    const words = article.content?.split(/\s+/).length || 0
    const readingTime = Math.max(1, Math.ceil(words / wordsPerMinute))

    const metadata = {
      title: article.title,
      description: article.description,
      keywords: article.keywords || [],
      section: article.section,
      canonicalUrl,
      imageUrl: article.imageUrl,
      publishedDate: article.createdAt.toISOString(),
      modifiedDate: article.updatedAt.toISOString(),
      readingTime,
      wordCount: words
    }

    res.json(metadata)

  } catch (error) {
    console.error('Error obteniendo metadata:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router