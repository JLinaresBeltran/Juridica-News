import React from 'react'
import { Twitter, Instagram, Facebook } from 'lucide-react'

interface PublicFooterProps {
  className?: string
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`border-t border-gray-200 mt-16 ${className}`} style={{ backgroundColor: '#04315a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Grid responsivo para las secciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Sección 1: Áreas del Derecho */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#40f3f2' }}>
              Áreas del Derecho
            </h3>
            <nav className="space-y-2 sm:space-y-3">
              <a href="/portal/civil" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho Civil
              </a>
              <a href="/portal/penal" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho Penal
              </a>
              <a href="/portal/laboral" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho Laboral
              </a>
              <a href="/portal/tributario" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho Tributario
              </a>
              <a href="/portal/administrativo" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho Administrativo
              </a>
              <a href="/portal/familia" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Derecho de Familia
              </a>
            </nav>
          </div>
          
          {/* Sección 2: Secciones del Periódico */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#40f3f2' }}>
              Secciones del Periódico
            </h3>
            <nav className="space-y-2 sm:space-y-3">
              <a href="/portal/digital" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Digital
              </a>
              <a href="/portal/actualidad" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Actualidad Jurídica
              </a>
              <a href="/portal/jurisprudencia" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Jurisprudencia
              </a>
              <a href="/portal/opinion" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Opinión
              </a>
              <a href="/portal/analisis" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Análisis Legal
              </a>
              <a href="/portal/entrevistas" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Entrevistas
              </a>
            </nav>
          </div>
          
          {/* Sección 3: Políticas y Legal */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#40f3f2' }}>
              Políticas y Legal
            </h3>
            <nav className="space-y-2 sm:space-y-3">
              <a href="/politicas/privacidad" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Política de Privacidad
              </a>
              <a href="/politicas/cookies" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Política de Cookies
              </a>
              <a href="/politicas/terminos" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Términos y Condiciones
              </a>
              <a href="/acerca-de" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Acerca de Nosotros
              </a>
              <a href="/contacto" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Contacto
              </a>
              <a href="/suscripciones" className="block text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                Suscripciones
              </a>
            </nav>
          </div>
          
        </div>
        
        {/* Línea separadora */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-600">
          
          {/* Redes sociales - móvil y tablet */}
          <div className="flex justify-center mb-6 sm:mb-8 lg:hidden">
            <div className="flex items-center space-x-6">
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>
          
          {/* Copyright y redes sociales - layout responsivo */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-sm sm:text-base text-gray-300">
                © 2024 Línea Judicial. Todos los derechos reservados.
              </p>
            </div>
            
            {/* Redes sociales - desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            
            {/* Powered by */}
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end space-x-1">
                <span className="text-sm sm:text-base text-gray-300">Powered by</span>
                <span className="text-sm sm:text-base font-semibold" style={{ color: '#40f3f2' }}>
                  Línea Judicial
                </span>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </footer>
  )
}