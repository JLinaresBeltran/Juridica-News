import { Menu, Search, Bell, User, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { Menu as HeadlessMenu } from '@headlessui/react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { logoutUser } from '@/services/authService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function Header() {
  const { user } = useAuthStore()
  const { toggleSidebar, uiPreferences, updateUIPreferences } = useAppStore()
  
  const toggleTheme = () => {
    const newTheme = uiPreferences.theme === 'light' ? 'dark' : 'light'
    updateUIPreferences({ theme: newTheme })
  }
  
  const isDark = uiPreferences.theme === 'dark' || 
    (uiPreferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-[#3ff3f2] hover:bg-[#04315a] transition-all duration-200 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <img 
            src={isDark ? "/images/logo-light.png" : "/images/logo-dark.png"}
            alt="Editorial Jurídico" 
            className="h-12 w-auto object-contain"
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">N E W S</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-400 hover:text-[#3ff3f2] hover:bg-[#04315a] transition-all duration-200"
          title={`Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-md text-gray-400 hover:text-[#3ff3f2] hover:bg-[#04315a] transition-all duration-200">
          <Bell className="w-5 h-5" />
        </button>

        {/* User menu */}
        <HeadlessMenu as="div" className="relative">
          <HeadlessMenu.Button className="flex items-center space-x-2 p-2 rounded-md hover:bg-[#04315a] hover:text-[#3ff3f2] transition-all duration-200">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.firstName} {user?.lastName}
            </span>
          </HeadlessMenu.Button>

          <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-50">
            <div className="py-1">
              <HeadlessMenu.Item>
                {({ active }) => (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    {user?.professionalTitle && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{user.professionalTitle}</p>
                    )}
                  </div>
                )}
              </HeadlessMenu.Item>

              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-[#04315a] text-[#3ff3f2]' : 'text-gray-700'
                    } flex w-full items-center px-4 py-2 text-sm hover:bg-[#04315a] hover:text-[#3ff3f2] transition-all duration-200 dark:text-gray-300`}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Configuración
                  </button>
                )}
              </HeadlessMenu.Item>

              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${
                      active ? 'bg-[#04315a] text-[#3ff3f2]' : 'text-gray-700'
                    } flex w-full items-center px-4 py-2 text-sm border-t border-gray-100 dark:border-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] transition-all duration-200 dark:text-gray-300`}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                )}
              </HeadlessMenu.Item>
            </div>
          </HeadlessMenu.Items>
        </HeadlessMenu>
      </div>
    </header>
  )
}