import { useEffect } from 'react'

interface SEOHeadProps {
  title: string
  description: string
  keywords?: string[]
  author?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  publishedDate?: string
  modifiedDate?: string
  section?: string
  tags?: string[]
  articleData?: {
    author: string
    publishedTime: string
    modifiedTime?: string
    section: string
    tags: string[]
  }
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  author = 'Línea Judicial',
  canonicalUrl,
  ogImage,
  ogType = 'website',
  publishedDate,
  modifiedDate,
  section,
  tags = [],
  articleData
}: SEOHeadProps) {

  const fullTitle = title.includes('Línea Judicial') ? title : `${title} | Línea Judicial`
  const currentUrl = typeof window !== 'undefined' ? window.location.href : canonicalUrl
  const defaultOgImage = ogImage || '/images/og-default.jpg'

  // Schema.org JSON-LD para artículos
  const articleSchema = articleData ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": articleData.author || author,
      "url": "https://linea-judicial.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Línea Judicial",
      "logo": {
        "@type": "ImageObject",
        "url": "https://linea-judicial.com/images/logo.png",
        "width": 60,
        "height": 60
      }
    },
    "datePublished": articleData.publishedTime,
    "dateModified": articleData.modifiedTime || articleData.publishedTime,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    },
    "image": {
      "@type": "ImageObject",
      "url": defaultOgImage,
      "width": 1200,
      "height": 630
    },
    "articleSection": articleData.section,
    "keywords": [...keywords, ...articleData.tags].join(', '),
    "inLanguage": "es-CO",
    "isAccessibleForFree": true
  } : null

  // Website Schema para páginas generales
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Línea Judicial",
    "description": "Portal jurídico especializado en análisis legal y jurisprudencia colombiana",
    "url": "https://linea-judicial.com",
    "publisher": {
      "@type": "Organization",
      "name": "Línea Judicial",
      "logo": {
        "@type": "ImageObject",
        "url": "https://linea-judicial.com/images/logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://linea-judicial.com/buscar?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  useEffect(() => {
    // Actualizar title dinámicamente
    document.title = fullTitle

    // Función para actualizar o crear meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`
      let metaTag = document.querySelector(selector) as HTMLMetaElement

      if (!metaTag) {
        metaTag = document.createElement('meta')
        if (isProperty) {
          metaTag.setAttribute('property', property)
        } else {
          metaTag.setAttribute('name', property)
        }
        document.head.appendChild(metaTag)
      }
      metaTag.content = content
    }

    // Meta tags básicos
    updateMetaTag('description', description)
    updateMetaTag('author', author)
    updateMetaTag('robots', 'index, follow')
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0')

    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '))
    }

    // Open Graph
    updateMetaTag('og:title', title, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:type', ogType, true)
    updateMetaTag('og:url', currentUrl || '', true)
    updateMetaTag('og:image', defaultOgImage, true)
    updateMetaTag('og:image:width', '1200', true)
    updateMetaTag('og:image:height', '630', true)
    updateMetaTag('og:site_name', 'Línea Judicial', true)
    updateMetaTag('og:locale', 'es_CO', true)

    // Twitter Cards
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', defaultOgImage)
    updateMetaTag('twitter:site', '@LineaJudicial')

    // Article específicos
    if (articleData) {
      updateMetaTag('article:author', articleData.author, true)
      updateMetaTag('article:published_time', articleData.publishedTime, true)
      if (articleData.modifiedTime) {
        updateMetaTag('article:modified_time', articleData.modifiedTime, true)
      }
      updateMetaTag('article:section', articleData.section, true)

      articleData.tags.forEach(tag => {
        const tagMeta = document.createElement('meta')
        tagMeta.setAttribute('property', 'article:tag')
        tagMeta.content = tag
        document.head.appendChild(tagMeta)
      })
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.rel = 'canonical'
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.href = canonicalUrl
    }

    // Schema.org JSON-LD
    const schemaData = articleSchema || websiteSchema
    let schemaScript = document.querySelector('script[type="application/ld+json"]')

    if (!schemaScript) {
      schemaScript = document.createElement('script')
      schemaScript.type = 'application/ld+json'
      document.head.appendChild(schemaScript)
    }

    schemaScript.textContent = JSON.stringify(schemaData, null, 2)

    // Cleanup function para remover tags específicos del artículo
    return () => {
      // Remover tags de article específicos al cambiar de página
      const articleTags = document.querySelectorAll('meta[property^="article:tag"]')
      articleTags.forEach(tag => tag.remove())
    }
  }, [fullTitle, description, keywords, author, canonicalUrl, defaultOgImage, ogType, currentUrl, articleData])

  return null // Este componente no renderiza nada visible
}

// Hook personalizado para usar SEO
export const useSEO = (seoData: SEOHeadProps) => {
  return <SEOHead {...seoData} />
}