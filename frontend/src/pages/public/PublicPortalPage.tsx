export default function PublicPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">EJ</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Editorial Jurídico</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-primary-600">Inicio</a>
              <a href="#" className="text-gray-600 hover:text-primary-600">Jurisprudencia</a>
              <a href="#" className="text-gray-600 hover:text-primary-600">Análisis</a>
              <a href="#" className="text-gray-600 hover:text-primary-600">Doctrina</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Portal Público Jurídico
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accede a análisis jurídicos especializados, actualizaciones normativas y contenido 
            profesional generado por expertos con supervisión de IA.
          </p>
        </div>

        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-6">
            Portal público con 5 secciones jurídicas disponible próximamente
          </p>
          <div className="max-w-2xl mx-auto bg-indigo-50 p-6 rounded-lg">
            <p className="text-indigo-800 text-sm">
              El portal público incluirá:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4 text-indigo-700 text-sm">
              <ul className="space-y-1 text-left">
                <li>• Actualizaciones Normativas</li>
                <li>• Jurisprudencia Relevante</li>
                <li>• Análisis Práctico</li>
              </ul>
              <ul className="space-y-1 text-left">
                <li>• Doctrina Especializada</li>
                <li>• Búsqueda Avanzada</li>
                <li>• Descarga de Documentos</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}