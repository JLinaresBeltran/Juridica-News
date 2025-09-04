import { useState } from 'react'
import { 
  Archive,
  Calendar,
  FileText,
  Building,
  Scale,
  Search,
  Download,
  ExternalLink,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import { useCurationStore } from '../../stores/curationStore'

// Ya no usamos mock data - utilizamos los documentos del store

// Ya no necesitamos esta definición local - usamos el sistema centralizado

export default function ArchivedArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set())
  
  // Usar documentos archivados del store
  const { archivedDocuments, restoreFromArchive } = useCurationStore()

  // Filtrar documentos
  const filteredDocuments = archivedDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.area.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const handleRestoreDocument = (e, docId) => {
    e.stopPropagation()
    if (window.confirm('¿Estás seguro de que quieres restaurar este documento a Aprobados?')) {
      restoreFromArchive(docId)
      console.log('Documento restaurado:', docId)
    }
  }

  const handleDeleteDocument = (e, docId) => {
    e.stopPropagation()
    if (window.confirm('¿Estás seguro de que quieres eliminar permanentemente este documento? Esta acción no se puede deshacer.')) {
      console.log('Eliminando documento:', docId)
      // TODO: Implementar lógica de eliminación permanente
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documentos Archivados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''} archivado{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Búsqueda */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar documentos archivados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="card dark:bg-gray-800">
          <div className="card-body p-0">
            <div className="space-y-0">
              {filteredDocuments.map((doc, index) => {
                const sourceInfo = getEntityColors(doc.source)
                const isExpanded = expandedDocuments.has(doc.id)

                return (
                  <div 
                    key={doc.id}
                    className={clsx(
                      'border-gray-200 dark:border-gray-700 transition-all duration-200',
                      index !== filteredDocuments.length - 1 ? 'border-b' : ''
                    )}
                  >
                    {/* Header clickeable (siempre visible) */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => toggleDocument(doc.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Información esencial siempre visible */}
                          <div className="flex items-center space-x-2 mb-3">
                            {/* Botón de expansión */}
                            <button 
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDocument(doc.id)
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            
                            <div className={clsx(
                              'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border opacity-75',
                              sourceInfo.bgColor,
                              sourceInfo.textColor,
                              sourceInfo.borderColor
                            )}>
                              <sourceInfo.icon className="w-4 h-4" />
                              <span>{sourceInfo.name}</span>
                            </div>
                            <span className={clsx(
                              'text-xs px-2 py-1 rounded opacity-75',
                              getAreaColors(doc.area).bgColor,
                              getAreaColors(doc.area).textColor
                            )}>
                              {getAreaColors(doc.area).name}
                            </span>
                            <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded">
                              ARCHIVADO
                            </span>
                          </div>

                          {/* Información básica siempre visible */}
                          <div className="ml-6">
                            <div className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">
                              {doc.type} No. {doc.identifier}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Archivado:</span> {new Date(doc.archivedAt).toLocaleDateString('es-ES', {
                                year: '2-digit',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })} por {doc.archivedBy}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Motivo:</span> <span className="italic">{doc.reason}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions siempre visibles */}
                        <div className="flex items-center space-x-2 ml-6">
                          <button
                            onClick={(e) => handleRestoreDocument(e, doc.id)}
                            className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-[#04315a] hover:text-[#3ff3f2] dark:hover:bg-[#04315a] dark:hover:text-[#3ff3f2] rounded-lg transition-all duration-200 font-medium"
                            title="Restaurar a Aprobados"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(e, doc.id)}
                            className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-[#04315a] hover:text-[#3ff3f2] dark:hover:bg-[#04315a] dark:hover:text-[#3ff3f2] rounded-lg transition-all duration-200 font-medium"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        {/* Sección principal con fondo gris más oscuro para archivados */}
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-2 border-gray-400 dark:border-gray-500 opacity-90">
                          
                          {/* Información adicional expandida */}
                          <div className="space-y-2 mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Fuente:</span> {sourceInfo.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Archivado:</span> {new Date(doc.archivedAt).toLocaleDateString('es-ES', {
                                year: '2-digit',
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>

                          {/* Tema incluido en el fondo gris */}
                          {doc.title && (
                            <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                              <span className="font-medium text-gray-800 dark:text-gray-200">Tema:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{doc.title}</p>
                            </div>
                          )}

                          {/* Resumen incluido en el fondo gris */}
                          {doc.summary && (
                            <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                              <span className="font-medium text-gray-800 dark:text-gray-200">Resumen:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{doc.summary}</p>
                            </div>
                          )}

                          {/* Estado incluido en el fondo gris */}
                          <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                            <span className="font-medium text-gray-800 dark:text-gray-200">Estado:</span>
                            <span className="text-sm text-red-600 dark:text-red-400 ml-2">Documento archivado</span>
                          </div>
                        </div>

                        {/* Información adicional con opacidad reducida */}
                        <div className="flex space-x-4 text-xs text-gray-400 dark:text-gray-500 opacity-75 mt-4">
                          <div>
                            <span><strong>Web Oficial:</strong> {new Date(doc.publicationDate).toLocaleDateString('es-ES', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}</span>
                          </div>
                          <div>
                            <span><strong>Extracción:</strong> {new Date(doc.extractionDate).toLocaleDateString('es-ES', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No hay documentos archivados
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No se encontraron documentos que coincidan con tu búsqueda' : 'Los documentos archivados aparecerán aquí'}
          </p>
        </div>
      )}
    </div>
  )
}