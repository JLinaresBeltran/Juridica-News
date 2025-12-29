import React, { useState, useEffect } from 'react'
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import ArticleGenerator from '../generator/ArticleGenerator'
import ImageGenerator from '../generator/ImageGenerator'
import MetadataEditor from '../generator/MetadataEditor'
import PublishingPreview from '../generator/PublishingPreview'
import documentsService from '../../services/documentsService'

interface Document {
  id: string
  source: string
  title: string
  type: string
  publicationDate: string
  identifier: string
  status: 'available' | 'unavailable'
  area: string
  summary?: string
  url?: string
  documentPath?: string // Ruta al archivo local descargado (DOCX/RTF)
  extractionDate: string
  // Campos del análisis IA
  magistradoPonente?: string
  salaRevision?: string
  expediente?: string
  numeroSentencia?: string
  temaPrincipal?: string
  resumenIA?: string
  decision?: string
}

interface GeneratedArticle {
  title: string
  subtitle?: string
  titleStyle?: string
  content: string
  image?: string
  imagePrompt?: string
  imageId?: string // 🔥 NUEVO: ID de la imagen en la biblioteca
  imageMetaDescription?: string | null // Nueva propiedad para metadescripción de imagen
  // Campos para persistir títulos generados - NUEVOS
  generatedTitleSets?: Array<{
    metaTitle: string
    realTitle: string
    realSubtitle?: string
  }>
  // Campos legacy para compatibilidad
  generatedTitles?: string[]
  generatedSubtitles?: string[]
  titlesStyle?: string
  titlesModel?: string
  metadata: {
    description: string
    keywords: string[]
    section: string
    customTags: string[]
    seoTitle: string
    seoSubtitle?: string
    // Nuevos campos SEO
    metaTitle?: string
    realTitle?: string
    realSubtitle?: string
    readingTime: number
  }
}

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  onApprove?: (docId: string) => void
  onReject?: (docId: string) => void
  showActions?: boolean
  currentStep?: number
  onStepChange?: (step: number) => void
  mode?: 'preview' | 'generation' // 'preview' para pendientes, 'generation' para aprobados
}

// 🎯 Skeleton Loader Component
function DocumentSkeleton() {
  return (
    <div className="h-full bg-white dark:bg-gray-800 p-8 animate-pulse">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Content skeleton */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente mejorado para vista previa de documentos
interface DocumentViewerProps {
  url: string;
  title: string;
  documentType: string;
}

function DocumentViewer({ url, title, documentType }: DocumentViewerProps) {
  const [viewerError, setViewerError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0);
  const [showTextView, setShowTextView] = useState(false);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [documentStats, setDocumentStats] = useState<{ wordCount: number; charCount: number } | null>(null);

  // Detectar si es una URL local (documento descargado)
  const isLocalDocument = url.startsWith('/api/storage/documents/');

  // Extraer el nombre del archivo de la URL local
  const getFilenameFromUrl = (localUrl: string): string => {
    const parts = localUrl.split('/');
    return parts[parts.length - 1];
  };

  // ⚡ OPTIMIZACIÓN: Reducción de timeouts 12s→5s, 8s→3s
  const viewers = [
    // Google Docs como primera opción (funciona excelente en iframe)
    {
      name: 'Google Docs',
      url: url.includes('https://') ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` : null,
      supportedTypes: ['pdf', 'rtf', 'docx', 'doc'],
      timeout: 5000, // ⚡ OPTIMIZADO: 12000 → 5000ms
      allowIframe: true
    },
    // LibreOffice Online como segunda opción (abre en ventana nueva)
    {
      name: 'LibreOffice Online',
      url: url.includes('https://') ? `https://www.viewdocs.com/viewer?url=${encodeURIComponent(url)}` : null,
      supportedTypes: ['rtf', 'docx', 'doc', 'odt'],
      timeout: 3000, // ⚡ OPTIMIZADO: 8000 → 3000ms
      allowIframe: false,
      openInNewWindow: true
    }
  ].filter(viewer => viewer.url); // Filtrar viewers sin URL válida

  // Determinar el viewer más adecuado
  const getPreferredViewer = () => {
    const docType = documentType.toLowerCase();
    const availableViewers = viewers.filter(viewer => 
      viewer.supportedTypes.some(type => 
        docType.includes(type) || url.toLowerCase().includes(`.${type}`)
      )
    );
    return availableViewers.length > 0 ? availableViewers : viewers;
  };

  const availableViewers = getPreferredViewer();
  const currentViewer = availableViewers[currentViewerIndex] || availableViewers[0];

  const handleViewerLoad = () => {
    setIsLoading(false);
    setViewerError(false);
  };

  const handleViewerError = () => {
    console.log(`❌ Error with ${currentViewer?.name}, trying next viewer...`);
    console.log(`📊 Estado actual: ViewerIndex=${currentViewerIndex}, TotalViewers=${availableViewers.length}`);
    
    // Intentar siguiente viewer si hay más opciones
    if (currentViewerIndex < availableViewers.length - 1) {
      console.log(`➡️ Cambiando a viewer ${currentViewerIndex + 1}: ${availableViewers[currentViewerIndex + 1]?.name}`);
      setCurrentViewerIndex(prev => prev + 1);
      setIsLoading(true);
    } else {
      console.log(`🚫 No hay más viewers disponibles, mostrando error`);
      setIsLoading(false);
      setViewerError(true);
    }
  };

  // Detectar viewers que requieren ventana nueva
  React.useEffect(() => {
    if (currentViewer) {
      console.log(`🎯 Viewer activo: ${currentViewer.name}`, {
        url: currentViewer.url,
        allowIframe: currentViewer.allowIframe,
        openInNewWindow: currentViewer.openInNewWindow,
        timeout: currentViewer.timeout
      });
    }
    
    if (currentViewer?.openInNewWindow && !currentViewer.allowIframe) {
      setIsLoading(false);
      setViewerError(false);
    }
  }, [currentViewerIndex, currentViewer]);

  // Timeout automático para evitar carga infinita
  React.useEffect(() => {
    if (!isLoading) return;
    if (currentViewer?.openInNewWindow && !currentViewer.allowIframe) return;

    const timeout = setTimeout(() => {
      console.log(`⏰ Timeout for ${currentViewer?.name}, trying next viewer...`);
      handleViewerError();
    }, currentViewer?.timeout || 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, currentViewerIndex]);

  // Función para obtener el contenido como texto de documento local
  const fetchLocalDocumentText = async () => {
    try {
      setIsLoading(true);
      const filename = getFilenameFromUrl(url);
      const response = await fetch(`/api/storage/documents/${filename}/text`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.text) {
          setDocumentText(data.data.text);
          setDocumentStats({
            wordCount: data.data.wordCount,
            charCount: data.data.charCount
          });
          setShowTextView(true);
          setViewerError(false);
        } else {
          throw new Error('No se pudo extraer el texto');
        }
      } else {
        throw new Error('Failed to fetch document text');
      }
    } catch (error) {
      console.error('Error fetching local document text:', error);
      setDocumentText('Error al obtener el contenido del documento.');
      setShowTextView(true);
      setViewerError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener el contenido como texto (URL externa)
  const fetchDocumentText = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/public/preview?url=${encodeURIComponent(url)}`);

      if (response.ok) {
        const text = await response.text();
        setDocumentText(text);
        setShowTextView(true);
      } else {
        throw new Error('Failed to fetch document text');
      }
    } catch (error) {
      console.error('Error fetching document text:', error);
      setDocumentText('Error al obtener el contenido del documento.');
      setShowTextView(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset cuando cambia el documento y cargar automáticamente si es local
  React.useEffect(() => {
    setCurrentViewerIndex(0);
    setViewerError(false);
    setIsLoading(true);
    setShowTextView(false);
    setDocumentText(null);
    setDocumentStats(null);

    // Si es documento local, cargar texto automáticamente
    if (isLocalDocument) {
      fetchLocalDocumentText();
    }
  }, [url, isLocalDocument]);

  if (viewerError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
        <FileText className="w-16 h-16 mb-4" />
        <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
          Vista previa no disponible
        </h4>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          No se puede mostrar la vista previa del documento en este momento.<br/>
          Intentamos {availableViewers.length} método{availableViewers.length > 1 ? 's' : ''} diferente{availableViewers.length > 1 ? 's' : ''}.
        </p>
        
        {/* Mostrar información de debugging */}
        <div className="mb-4 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 p-3 rounded">
          <p><strong>URL:</strong> {url}</p>
          <p><strong>Tipo:</strong> {documentType}</p>
          <p><strong>Último intento:</strong> {currentViewer?.name || 'N/A'}</p>
        </div>
        
        <div className="flex flex-col space-y-2 w-full max-w-sm">
          <button 
            onClick={() => window.open(url, '_blank')}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir en Nueva Pestaña
          </button>
          <a 
            href={url}
            download
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Archivo
          </a>
          <button
            onClick={() => {
              setViewerError(false);
              setIsLoading(true);
              setCurrentViewerIndex(0);
            }}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Reintentar Vista Previa
          </button>
          <button
            onClick={fetchDocumentText}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Como Texto
          </button>
        </div>
      </div>
    );
  }

  // Visor de texto alternativo
  if (showTextView) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {isLocalDocument ? 'Documento Local' : 'Vista de Texto'} - {title}
            </h4>
            {documentStats && (
              <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                {documentStats.wordCount.toLocaleString()} palabras | {documentStats.charCount.toLocaleString()} caracteres
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLocalDocument && (
              <a
                href={url}
                download
                className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="w-3 h-3 mr-1" />
                Descargar
              </a>
            )}
            {!isLocalDocument && (
              <button
                onClick={() => setShowTextView(false)}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Volver a Vista Previa
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
          {documentText ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
              {documentText}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cargando contenido de texto...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* ⚡ OPTIMIZACIÓN: Skeleton loader en lugar de spinner genérico */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <DocumentSkeleton />
        </div>
      )}
      {currentViewer && currentViewer.allowIframe !== false && currentViewer.url && (
        <iframe
          key={`${currentViewer.name}-${currentViewerIndex}`}
          src={currentViewer.url}
          className="w-full h-full"
          title={`Vista previa de ${title}`}
          onLoad={handleViewerLoad}
          onError={handleViewerError}
          style={{ border: 'none' }}
        />
      )}
      
      {currentViewer && currentViewer.openInNewWindow && !currentViewer.allowIframe && (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
          <div className="text-center p-8">
            <ExternalLink className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Vista Previa con {currentViewer.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              Este documento debe abrirse en una ventana nueva para visualizarse correctamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => currentViewer.url && window.open(currentViewer.url, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir en {currentViewer.name}
              </button>
              <button
                onClick={handleViewerError}
                className="inline-flex items-center justify-center px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Probar Siguiente Viewer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && currentViewer && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-2">
          <span>{currentViewer.name}</span>
          {currentViewerIndex > 0 && (
            <span className="text-yellow-300">
              (Intento #{currentViewerIndex + 1})
            </span>
          )}
        </div>
      )}
      
      {isLoading && currentViewerIndex > 0 && (
        <div className="absolute top-2 left-2 bg-blue-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          Probando {currentViewer?.name}...
        </div>
      )}
    </div>
  );
}

export function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  document: selectedDoc, 
  onApprove, 
  onReject,
  showActions = true,
  currentStep = 0,
  onStepChange,
  mode = 'generation'
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle>({
    title: '',
    titleStyle: '',
    content: '',
    image: '',
    imagePrompt: '',
    imageId: '',
    metadata: {
      description: '',
      keywords: [],
      section: 'Constitucional',
      customTags: [],
      seoTitle: '',
      readingTime: 3
    }
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Función helper para guardar el estado completo
  const saveCurrentState = (stepOverride?: number) => {
    if (!selectedDoc) return
    
    const storageKey = `article-draft-${selectedDoc.id}`
    
    // Crear una copia de los datos optimizada para localStorage
    const articleDataForStorage = {
      ...generatedArticle,
      // Permitir imágenes más grandes ahora que tenemos compresión (hasta 500KB)
      image: generatedArticle.image && generatedArticle.image.length > 500000 ? '[IMAGE_TOO_LARGE_FOR_STORAGE]' : generatedArticle.image,
      currentStep: stepOverride !== undefined ? stepOverride : currentStep,
      lastModified: new Date().toISOString()
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(articleDataForStorage))
      setLastSaved(new Date())
      console.log(`Estado completo guardado (paso ${articleDataForStorage.currentStep})`)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ LocalStorage quota exceeded, limpiando y reintentando')
        
        // Limpiar localStorage y reintentar
        cleanupLocalStorage()
        
        // Intentar guardar sin ninguna imagen
        const minimalData = {
          ...articleDataForStorage,
          image: undefined
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(minimalData))
          setLastSaved(new Date())
          console.log(`Estado mínimo guardado después de limpiar (paso ${minimalData.currentStep})`)
        } catch (secondError) {
          console.error('❌ No se pudo guardar ni el estado mínimo después de limpiar:', secondError)
        }
      } else {
        console.error('❌ Error guardando estado:', error)
      }
    }
  }

  // Función para limpiar localStorage si está lleno
  const cleanupLocalStorage = () => {
    try {
      // Obtener todas las claves relacionadas con drafts
      const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('article-draft-'))
      console.log(`🧹 Limpiando ${draftKeys.length} drafts del localStorage`)
      
      // Eliminar todos los drafts viejos
      draftKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('✅ LocalStorage limpiado')
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!isOpen || !selectedDoc) return

    // Auto-save every 30 seconds if there's content
    const hasContent = generatedArticle.title || generatedArticle.content || 
                      generatedArticle.metadata.keywords.length > 0
    
    if (!hasContent) return

    const interval = setInterval(() => {
      saveCurrentState()
    }, 30000)

    return () => clearInterval(interval)
  }, [generatedArticle, currentStep, isOpen, selectedDoc])

  // Update metadata section when document changes
  useEffect(() => {
    if (selectedDoc?.area) {
      setGeneratedArticle(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          section: selectedDoc.area
        }
      }))
    }
  }, [selectedDoc?.area])

  // Auto-save metadata changes immediately
  useEffect(() => {
    if (!isOpen || !selectedDoc) return

    // Only save if we have some metadata content
    const hasMetadata = generatedArticle.metadata && (
      generatedArticle.metadata.seoTitle ||
      generatedArticle.metadata.seoTitleOptimized ||
      generatedArticle.metadata.description ||
      generatedArticle.metadata.keywords.length > 0
    )

    if (hasMetadata) {
      const timeoutId = setTimeout(() => {
        saveCurrentState()
        console.log('💾 Auto-guardado inmediato por cambio en metadata')
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [generatedArticle.metadata, isOpen, selectedDoc])

  // Load saved draft on open (only once when modal opens, not on step changes)
  useEffect(() => {
    if (!isOpen || !selectedDoc) return

    const storageKey = `article-draft-${selectedDoc.id}`
    const savedData = localStorage.getItem(storageKey)
    
    if (savedData) {
      try {
        const parsedDraft = JSON.parse(savedData)
        setGeneratedArticle(parsedDraft)
        // Solo restaurar el paso si el currentStep actual es 0 (inicio)
        if (onStepChange && parsedDraft.currentStep !== undefined && currentStep === 0) {
          onStepChange(parsedDraft.currentStep)
        }
        setLastSaved(new Date(parsedDraft.lastModified))
        console.log('✅ Borrador cargado desde localStorage')
      } catch (error) {
        console.error('Error parsing saved draft:', error)
      }
    }
  }, [isOpen, selectedDoc]) // Removido currentStep de las dependencias

  // Save state when stepping
  useEffect(() => {
    if (selectedDoc && isOpen) {
      saveCurrentState()
    }
  }, [currentStep])

  // Event handlers for each step
  const handleArticleGenerated = (article: string, style: string = '') => {
    setGeneratedArticle(prev => ({
      ...prev,
      content: article,
      titleStyle: style
    }))
  }

  // Nuevo handler actualizado para manejar 4 parámetros (metaTitle, title, subtitle, style)
  const handleTitleSelected = (metaTitle: string, title: string, subtitle: string, style: string) => {
    console.log('📝 DocumentPreviewModal: Título seleccionado recibido:', { metaTitle, title, subtitle, style })
    setGeneratedArticle(prev => ({
      ...prev,
      title,
      subtitle,
      titleStyle: style,
      metadata: {
        ...prev.metadata,
        metaTitle: metaTitle,        // Meta title para <title> tag
        realTitle: title,            // H1 title
        realSubtitle: subtitle,      // H2 subtitle
        seoTitle: title,             // Mantener compatibilidad
        seoSubtitle: subtitle        // Mantener compatibilidad
      }
    }))
  }

  // Nuevo handler actualizado para manejar titleSets formato
  const handleTitlesGenerated = (titleSets: any[], style: string, model: string) => {
    console.log('📝 DocumentPreviewModal: TitleSets generados recibidos:', { titleSets, style, model })

    // Extraer arrays para compatibilidad con formato legacy
    const titles = titleSets?.map(set => set.realTitle || set.title) || []
    const subtitles = titleSets?.map(set => set.realSubtitle || set.subtitle) || []

    setGeneratedArticle(prev => ({
      ...prev,
      // Nuevo formato con titleSets
      generatedTitleSets: titleSets,
      // Formato legacy para compatibilidad
      generatedTitles: titles,
      generatedSubtitles: subtitles,
      titlesStyle: style,
      titlesModel: model
    }))
  }

  const handleImageGenerated = (imageUrl: string, prompt: string, metaDescription?: string | null, imageId?: string) => {
    console.log('📸 DEBUG: handleImageGenerated called', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      prompt: prompt.substring(0, 100) + '...',
      metaDescription,
      hasMetaDescription: !!metaDescription,
      imageId
    })

    setGeneratedArticle(prev => ({
      ...prev,
      image: imageUrl,
      imagePrompt: prompt,
      imageMetaDescription: metaDescription || null,
      imageId: imageId || ''
    }))
  }

  const handleMetadataChange = (metadata: GeneratedArticle['metadata']) => {
    setGeneratedArticle(prev => ({
      ...prev,
      metadata
    }))
  }

  const handlePublish = async (articleData: GeneratedArticle) => {
    if (!selectedDoc) return

    try {
      setIsGenerating(true)
      
      // Here you would typically call an API to publish the article
      console.log('Publishing article:', articleData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear the draft after successful publish
      const storageKey = `article-draft-${selectedDoc.id}`
      localStorage.removeItem(storageKey)
      
      // Close modal
      onClose()
      
    } catch (error) {
      console.error('Error publishing article:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'hidden'
      }
      window.addEventListener('keydown', handleEscape)
    } else {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'unset'
      }
    }

    return () => {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'unset'
      }
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleApprove = async () => {
    if (!selectedDoc || !onApprove) return
    
    setIsLoading(true)
    try {
      // Verificar si hay un artículo generado completo
      const hasGeneratedArticle = generatedArticle.title && generatedArticle.content;
      
      console.log('🎯 Aprobando documento:', {
        id: selectedDoc.id,
        hasGeneratedArticle,
        articleTitle: generatedArticle.title?.substring(0, 50),
        contentLength: generatedArticle.content?.length || 0
      });

      // Si hay artículo generado, pasar los datos junto con la aprobación
      if (hasGeneratedArticle) {
        await onApprove(selectedDoc.id, {
          title: generatedArticle.title,
          content: generatedArticle.content,
          image: generatedArticle.image,
          imageId: generatedArticle.imageId,
          keywords: generatedArticle.metadata.keywords.join(', '),
          metaTitle: generatedArticle.metadata.metaTitle,
          publicationSection: generatedArticle.metadata.publicationSection
        });
      } else {
        await onApprove(selectedDoc.id);
      }
      
      // No cerramos aquí, dejamos que CurationPage maneje el cierre
    } catch (error) {
      console.error('Error approving document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc || !onReject) return
    
    setIsLoading(true)
    try {
      await onReject(selectedDoc.id)
      // No cerramos aquí, dejamos que CurationPage maneje el cierre
    } catch (error) {
      console.error('Error rejecting document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !selectedDoc) return null

  const sourceInfo = getEntityColors(selectedDoc.source)
  const SourceIcon = sourceInfo.icon


  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="flex items-center justify-center min-h-full p-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[98vw] h-[98vh] flex flex-col">

            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Article Generation Progress Bar - Solo mostrar en modo generation */}
            {mode === 'generation' && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                {[
                  { id: 'article', name: 'Artículo', description: '' },
                  { id: 'image', name: 'Imagen', description: 'Generar imagen principal' },
                  { id: 'metadata', name: 'Metadata', description: 'Configurar SEO y etiquetas' },
                  { id: 'publish', name: 'Aprobar', description: 'Revisión final y aprobación' }
                ].map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => onStepChange && onStepChange(index)}
                        className={clsx(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors hover:scale-105',
                          index < currentStep 
                            ? 'bg-green-500 border-green-500 text-white' // Completado
                            : index === currentStep 
                            ? 'bg-[#04315a] border-[#04315a] text-white' // Actual
                            : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400' // Pendiente
                        )}
                        title={step.description}
                        disabled={!onStepChange}
                      >
                        {index < currentStep ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </button>
                      <div className={clsx(
                        'mt-1 text-xs font-medium',
                        index < currentStep 
                          ? 'text-green-600 dark:text-green-400' // Completado
                          : index === currentStep 
                          ? 'text-[#04315a] dark:text-[#3ff3f2]' // Actual
                          : 'text-gray-400 dark:text-gray-500' // Pendiente
                      )}>
                        {step.name}
                      </div>
                    </div>
                    {index < 3 && (
                      <div className={clsx(
                        'w-8 h-0.5 mx-2 mt-[-16px]',
                        index < currentStep 
                          ? 'bg-green-500' // Línea completada
                          : 'bg-gray-300 dark:bg-gray-600' // Línea pendiente
                      )} />
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Buttons - pegados a la barra de progreso */}
              <div className="flex items-center justify-between mt-4">
                {/* Botón Atrás */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (onStepChange && currentStep > 0) {
                        const previousStep = currentStep - 1
                        console.log('🎯 BOTÓN ATRÁS:', { currentStep, previousStep })
                        saveCurrentState()
                        onStepChange(previousStep)
                        setTimeout(() => saveCurrentState(previousStep), 100)
                        console.log(`⬅️ Retrocedido a paso ${previousStep}`)
                      }
                    }}
                    disabled={currentStep === 0 || !onStepChange}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                      currentStep === 0 || !onStepChange
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-600 dark:bg-gray-600 text-white hover:bg-gray-700 dark:hover:bg-gray-500'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  {/* Indicador de guardado */}
                  {lastSaved && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Guardado: {lastSaved.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>

                {/* Botón Siguiente */}
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (onStepChange && currentStep < 3) {
                        const nextStep = currentStep + 1
                        console.log('🎯 BOTÓN SIGUIENTE:', { currentStep, nextStep })
                        saveCurrentState()
                        onStepChange(nextStep)
                        setTimeout(() => saveCurrentState(nextStep), 100)
                        console.log(`✅ Avanzado a paso ${nextStep}`)
                      }
                    }}
                    disabled={currentStep === 3 || !onStepChange}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                      currentStep === 3 || !onStepChange
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847] shadow-sm hover:shadow-md'
                    )}
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Content - Changes based on current step */}
            <div className="flex-1 flex overflow-auto">

              {/* Modo Preview: Solo previsualización para Pendientes */}
              {mode === 'preview' && (
                <>
                  {/* Document Preview - 65% width */}
                  <div className="w-[65%] bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                      {selectedDoc.url ? (
                        <div className="h-full">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 h-full flex flex-col">
                            {/* PDF Viewer Header - Solo título */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-750 rounded-t-lg">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vista Previa del Documento</h4>
                            </div>
                            
                            {/* PDF Content - MEJORADO */}
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800">
                              <DocumentViewer
                                url={selectedDoc.documentPath
                                  ? `/api/storage/documents/${selectedDoc.documentPath}`
                                  : selectedDoc.url || ''}
                                title={selectedDoc.title}
                                documentType={selectedDoc.type}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <FileText className="w-16 h-16 mb-4" />
                          <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Documento no disponible</h4>
                          <p className="text-center text-gray-600 dark:text-gray-300">
                            El documento no está disponible para vista previa en este momento.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Panel - 35% width */}
                  <div className="w-[35%] bg-white dark:bg-gray-800 flex flex-col">
                    <div className="flex-1 overflow-auto p-4">
                      <div className="space-y-4">
                        {/* All the metadata sections */}
                        <div className="flex items-center space-x-2">
                          <div className={clsx(
                            'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium',
                            getStatusColors(selectedDoc.status).bgColor,
                            getStatusColors(selectedDoc.status).textColor
                          )}>
                            {(() => {
                              const StatusIcon = getStatusColors(selectedDoc.status).icon
                              return <StatusIcon className="w-3 h-3" />
                            })()}
                            <span>{getStatusColors(selectedDoc.status).name}</span>
                          </div>
                          <span className={clsx(
                            'text-xs px-2 py-1 rounded',
                            getAreaColors(selectedDoc.area).bgColor,
                            getAreaColors(selectedDoc.area).textColor
                          )}>
                            {getAreaColors(selectedDoc.area).name}
                          </span>
                        </div>

                        {/* Main Document Info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                              {selectedDoc.numeroSentencia || `${selectedDoc.type} No. ${selectedDoc.identifier}`}
                            </h4>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            {selectedDoc.magistradoPonente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 break-words">
                                <span className="font-medium">Magistrado P.:</span> {selectedDoc.magistradoPonente}
                              </div>
                            )}
                            {selectedDoc.salaRevision && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 break-words">
                                <span className="font-medium">Sala de Revisión:</span> {selectedDoc.salaRevision}
                              </div>
                            )}
                            {selectedDoc.expediente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium block mb-0.5">No. de expediente:</span>
                                <span className="block break-all">{selectedDoc.expediente}</span>
                              </div>
                            )}
                          </div>
                          {selectedDoc.temaPrincipal && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Tema Principal:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{selectedDoc.temaPrincipal}</p>
                            </div>
                          )}
                          {(selectedDoc.resumenIA || selectedDoc.summary) && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Resumen:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                                {selectedDoc.resumenIA || selectedDoc.summary}
                              </p>
                            </div>
                          )}
                          {selectedDoc.decision && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Decisión:</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 ml-2">{selectedDoc.decision}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons para modo preview */}
                        {showActions && (
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col space-y-2">
                              {selectedDoc.status === 'available' && (
                                <button
                                  onClick={handleApprove}
                                  disabled={isLoading}
                                  className={clsx(
                                    'px-4 py-2 text-sm text-primary-700 border border-primary-300 rounded-full transition-all duration-200',
                                    'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                                    'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                                  )}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{isLoading ? 'Procesando...' : 'Aprobar'}</span>
                                </button>
                              )}
                              
                              <button
                                onClick={handleReject}
                                disabled={isLoading}
                                className={clsx(
                                  'px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full transition-all duration-200',
                                  'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                                )}
                              >
                                <XCircle className="w-4 h-4" />
                                <span>{isLoading ? 'Procesando...' : 'Rechazar'}</span>
                              </button>
                              
                              <button
                                onClick={onClose}
                                disabled={isLoading}
                                className={clsx(
                                  'px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-full transition-all duration-200',
                                  'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                                  'disabled:opacity-50 disabled:cursor-not-allowed'
                                )}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* Paso 0: Generación de artículo con previsualización */}
              {mode === 'generation' && currentStep === 0 && selectedDoc && (
                <div className="w-full bg-white dark:bg-gray-800">
                  <div className="p-6 w-full">
                    <ArticleGenerator
                      document={selectedDoc}
                      onArticleGenerated={handleArticleGenerated}
                      onTitleSelected={handleTitleSelected}
                      onTitlesGenerated={handleTitlesGenerated}
                      generatedArticle={generatedArticle.content}
                      selectedTitle={generatedArticle.title}
                      selectedSubtitle={generatedArticle.subtitle}
                      selectedMetaTitle={generatedArticle.metadata.metaTitle}
                      persistedTitleSets={generatedArticle.generatedTitleSets}
                      persistedTitles={generatedArticle.generatedTitles}
                      persistedSubtitles={generatedArticle.generatedSubtitles}
                      persistedTitlesStyle={generatedArticle.titlesStyle}
                      persistedTitlesModel={generatedArticle.titlesModel}
                    />
                  </div>
                </div>
              )}

              {/* Paso 1: Generación de imagen */}
              {mode === 'generation' && currentStep === 1 && selectedDoc && (
                <div className="w-full bg-white dark:bg-gray-800">
                  <div className="p-6 w-full">
                    <ImageGenerator
                      document={selectedDoc}
                      onImageGenerated={handleImageGenerated}
                      generatedImage={generatedArticle.image}
                      articleContent={generatedArticle.content}
                    />
                  </div>
                </div>
              )}

              {/* Paso 2: Editor de metadata */}
              {mode === 'generation' && currentStep === 2 && selectedDoc && (
                <div className="bg-white dark:bg-gray-800">
                  <div className="p-6">
                    <MetadataEditor
                      document={selectedDoc}
                      articleTitle={generatedArticle.title}
                      articleContent={generatedArticle.content}
                      onMetadataChange={handleMetadataChange}
                      initialMetadata={generatedArticle.metadata}
                      imageMetaDescription={generatedArticle.imageMetaDescription || undefined}
                    />
                  </div>
                </div>
              )}

              {/* Paso 3: Vista previa y publicación */}
              {mode === 'generation' && currentStep === 3 && selectedDoc && (
                <div className="bg-white dark:bg-gray-800">
                  <div className="p-6">
                    <PublishingPreview
                      document={selectedDoc}
                      generatedArticle={generatedArticle}
                      onPublish={handlePublish}
                      isPublishing={isGenerating}
                    />
                  </div>
                </div>
              )}

              {/* Fallback para pasos sin documento o casos inesperados */}
              {(mode === 'generation' && currentStep > 0 && !selectedDoc) && (
                <div className="h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Documento no disponible</h4>
                    <p className="text-gray-500 dark:text-gray-400">No se puede procesar el paso sin un documento seleccionado</p>
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons - Solo mostrar si showActions es true y en modo generation */}
            {showActions && mode === 'generation' && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col space-y-2">
                  {selectedDoc.status === 'available' && (
                    <button
                      onClick={handleApprove}
                      disabled={isLoading}
                      className={clsx(
                        'px-4 py-2 text-sm text-primary-700 border border-primary-300 rounded-full transition-all duration-200',
                        'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                        'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isLoading ? 'Procesando...' : 'Aprobar'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleReject}
                    disabled={isLoading}
                    className={clsx(
                      'px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full transition-all duration-200',
                      'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                      'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isLoading ? 'Procesando...' : 'Rechazar'}</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className={clsx(
                      'px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-full transition-all duration-200',
                      'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}