import React, { useState } from 'react'
import { Search, Twitter, Instagram, Facebook } from 'lucide-react'

// CSS personalizado para animaciones
const customStyles = `
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .slide-in-animation {
    animation: slideInFromTop 0.3s ease-out forwards;
  }
`

interface PublicHeaderProps {
  onSearch?: (query: string) => void
  className?: string
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onSearch, className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    { label: 'Digital', href: '/portal/digital' },
    { label: 'Civil', href: '/portal/civil' },
    { label: 'Penal', href: '/portal/penal' },
    { label: 'Familia', href: '/portal/familia' },
    { label: 'Laboral', href: '/portal/laboral' },
    { label: 'Tributario', href: '/portal/tributario' },
    { label: 'Comercial', href: '/portal/comercial' },
    { label: 'Administrativo', href: '/portal/administrativo' },
    { label: 'Opinión', href: '/portal/opinion' },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      {/* Inyectar estilos personalizados */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header principal - Desktop y Tablet */}
          <div className="hidden md:flex items-center justify-between py-6">
            {/* Redes sociales en la parte superior izquierda */}
            <div className="flex items-center space-x-3">
              <a href="#" className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            
            {/* Logo y título centrados */}
            <div className="flex items-center gap-4">
              <img 
                src="/images/logo.png" 
                alt="Logo Jurídico" 
                className="h-12 w-auto"
              />
              <h1 className="text-lg font-bold text-gray-800 tracking-wide">Línea Judicial</h1>
            </div>
            
            {/* Búsqueda en la esquina superior derecha */}
            <div className="flex items-center">
              <button 
                type="button" 
                className="p-3 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => onSearch && onSearch('')}
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Header móvil - mantiene el diseño original */}
          <div className="md:hidden flex items-center justify-between h-16">
            {/* Logo */}
            <a 
              href="/portal" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/images/logo.png" 
                alt="Logo Jurídico" 
                className="h-10 w-auto"
              />
              <p className="text-xs text-gray-600 font-medium tracking-widest">Línea Judicial</p>
            </a>
            
            {/* Botones mobile */}
            <div className="flex items-center space-x-2">
              {/* Botón búsqueda mobile */}
              <button 
                type="button" 
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => onSearch && onSearch('')}
              >
                <Search className="h-5 w-5" />
              </button>
              
              {/* Botón menú hamburger */}
              <button
                type="button"
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all duration-300 relative"
              >
                <div className="w-5 h-5 relative flex items-center justify-center">
                  {/* Hamburger Icon */}
                  <div className="relative w-full">
                    <span 
                      className={`absolute left-0 w-full h-0.5 bg-current transform transition-all duration-300 origin-center ${
                        isMenuOpen ? 'rotate-45 translate-y-0 top-2' : 'rotate-0 translate-y-0 top-0'
                      }`}
                    />
                    <span 
                      className={`absolute left-0 w-full h-0.5 bg-current transition-all duration-300 top-2 ${
                        isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                      }`}
                    />
                    <span 
                      className={`absolute left-0 w-full h-0.5 bg-current transform transition-all duration-300 origin-center ${
                        isMenuOpen ? '-rotate-45 translate-y-0 top-2' : 'rotate-0 translate-y-0 top-4'
                      }`}
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Navegación de secciones - Desktop y Tablet */}
        <div className="hidden md:block bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              {/* Navegación por secciones centrada */}
              <nav className="flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Menú mobile desplegable */}
        <div 
          className={`md:hidden absolute left-0 right-0 top-full bg-transparent transition-all duration-300 ease-in-out z-[60] ${
            isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="mx-4 mt-4 mb-6 bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-transform duration-300 ease-in-out" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 transform hover:scale-[0.98] ${
                    isMenuOpen ? 'slide-in-animation' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay para cerrar menú al hacer click fuera */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-[55] bg-black bg-opacity-25 md:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </header>
    </>
  )
}