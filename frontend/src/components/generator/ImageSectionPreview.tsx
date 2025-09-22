import React from 'react'
import { useOptimizedImage, IMAGE_SPECS } from '@/utils/imageProcessor'
import { Smartphone, Layout } from 'lucide-react'

interface ImageSectionPreviewProps {
  imageUrl: string
  imagePrompt: string
}

export function ImageSectionPreview({ imageUrl, imagePrompt }: ImageSectionPreviewProps) {
  const heroImage = useOptimizedImage(imageUrl, 'HERO')
  const compactImage = useOptimizedImage(imageUrl, 'COMPACT')

  // Debug: log para verificar que se está ejecutando
  console.log('🖼️ ImageSectionPreview renderizando:', { imageUrl, imagePrompt })

  return (
    <div className="w-full">
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-300 dark:border-blue-500 shadow-sm">

        {/* Las dos vistas lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Artículo Principal (Hero) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Layout className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                📰 Artículo Principal (Portada) - 16:9
              </span>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-blue-200 dark:border-blue-600">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={heroImage.url}
                  alt={imagePrompt}
                  className="w-full h-auto object-cover"
                  style={{ aspectRatio: heroImage.aspectRatio }}
                />
              </div>
              <div className="pt-2 text-center">
                <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  Ejemplo: Corte Constitucional ordena...
                </h5>
                <p className="text-xs text-gray-500 mt-1">
                  {heroImage.width}×{heroImage.height}px • {heroImage.aspectRatio}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta Compacta (Horizontal) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                📱 Tarjeta Compacta (Lateral) - 3:2
              </span>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-blue-200 dark:border-blue-600">
              <div className="flex space-x-2">
                <div className="flex-shrink-0 w-16 h-11 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={compactImage.url}
                    alt={imagePrompt}
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: compactImage.aspectRatio }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    Sentencia sobre derechos...
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {compactImage.width}×{compactImage.height}px • {compactImage.aspectRatio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información técnica compacta */}
        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-700 dark:text-blue-300 text-center">
            <span className="font-medium">📐 Imagen base:</span> 1792×1024px •
            <span className="font-medium"> Optimización:</span> Recorte inteligente automático
          </div>
        </div>
      </div>
    </div>
  )
}