import { 
  Scale, 
  Building, 
  FileText, 
  Gavel,
  Users,
  Briefcase,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCheck,
  FileX,
  BookOpen
} from 'lucide-react'

// Definición de colores para cada entidad jurídica
export const ENTITY_COLORS = {
  // Cortes
  'corte-constitucional': {
    name: 'Corte Constitucional',
    icon: Scale,
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-50',
    darkTextColor: 'dark:text-green-400',
    darkBgColor: 'dark:bg-green-900',
    darkBorderColor: 'dark:border-green-700'
  },
  'corte-suprema-civil': {
    name: 'Corte Suprema - Sala Civil',
    icon: Building,
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-50',
    darkTextColor: 'dark:text-blue-400',
    darkBgColor: 'dark:bg-blue-900',
    darkBorderColor: 'dark:border-blue-700'
  },
  'corte-suprema-penal': {
    name: 'Corte Suprema - Sala Penal',
    icon: Building,
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-50',
    darkTextColor: 'dark:text-amber-400',
    darkBgColor: 'dark:bg-amber-900',
    darkBorderColor: 'dark:border-amber-700'
  },
  'corte-suprema-laboral': {
    name: 'Corte Suprema - Sala Laboral',
    icon: Building,
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-50',
    darkTextColor: 'dark:text-purple-400',
    darkBgColor: 'dark:bg-purple-900',
    darkBorderColor: 'dark:border-purple-700'
  },
  'consejo-estado': {
    name: 'Consejo de Estado',
    icon: Gavel,
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-50',
    darkTextColor: 'dark:text-orange-400',
    darkBgColor: 'dark:bg-orange-900',
    darkBorderColor: 'dark:border-orange-700'
  },
  
  // Superintendencias
  'dian': {
    name: 'DIAN',
    icon: FileText,
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    hoverBg: 'hover:bg-yellow-50',
    darkTextColor: 'dark:text-yellow-400',
    darkBgColor: 'dark:bg-yellow-900',
    darkBorderColor: 'dark:border-yellow-700'
  },
  'super-servicios': {
    name: 'Superintendencia de Servicios',
    icon: FileText,
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
    hoverBg: 'hover:bg-indigo-50',
    darkTextColor: 'dark:text-indigo-400',
    darkBgColor: 'dark:bg-indigo-900',
    darkBorderColor: 'dark:border-indigo-700'
  },
  'super-financiera': {
    name: 'Superintendencia Financiera',
    icon: Briefcase,
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-50',
    darkTextColor: 'dark:text-cyan-400',
    darkBgColor: 'dark:bg-cyan-900',
    darkBorderColor: 'dark:border-cyan-700'
  },
  'super-sociedades': {
    name: 'Superintendencia de Sociedades',
    icon: Users,
    textColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-200',
    hoverBg: 'hover:bg-teal-50',
    darkTextColor: 'dark:text-teal-400',
    darkBgColor: 'dark:bg-teal-900',
    darkBorderColor: 'dark:border-teal-700'
  },
  'super-industria': {
    name: 'Superintendencia de Industria y Comercio',
    icon: Shield,
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-50',
    darkTextColor: 'dark:text-pink-400',
    darkBgColor: 'dark:bg-pink-900',
    darkBorderColor: 'dark:border-pink-700'
  }
} as const

// Estados de documentos
export const STATUS_COLORS = {
  'PENDING': {
    name: 'Pendiente',
    icon: Clock,
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    darkTextColor: 'dark:text-yellow-400',
    darkBgColor: 'dark:bg-yellow-900'
  },
  'APPROVED': {
    name: 'Aprobado',
    icon: CheckCircle,
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    darkTextColor: 'dark:text-green-400',
    darkBgColor: 'dark:bg-green-900'
  },
  'REJECTED': {
    name: 'Rechazado',
    icon: XCircle,
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    darkTextColor: 'dark:text-red-400',
    darkBgColor: 'dark:bg-red-900'
  },
  'PROCESSING': {
    name: 'Procesando',
    icon: AlertCircle,
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    darkTextColor: 'dark:text-blue-400',
    darkBgColor: 'dark:bg-blue-900'
  },
  'PUBLISHED': {
    name: 'Publicado',
    icon: FileCheck,
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    darkTextColor: 'dark:text-emerald-400',
    darkBgColor: 'dark:bg-emerald-900'
  },
  'DRAFT': {
    name: 'Borrador',
    icon: FileX,
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    darkTextColor: 'dark:text-gray-400',
    darkBgColor: 'dark:bg-gray-700'
  },
  'available': {
    name: 'Disponible',
    icon: FileCheck,
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    darkTextColor: 'dark:text-green-400',
    darkBgColor: 'dark:bg-green-900'
  },
  'unavailable': {
    name: 'No Disponible',
    icon: FileX,
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    darkTextColor: 'dark:text-red-400',
    darkBgColor: 'dark:bg-red-900'
  }
} as const

// Áreas jurídicas
export const AREA_COLORS = {
  'CONSTITUCIONAL': {
    name: 'Constitucional',
    icon: Scale,
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    darkTextColor: 'dark:text-green-400',
    darkBgColor: 'dark:bg-green-900'
  },
  'CIVIL': {
    name: 'Civil',
    icon: FileText,
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    darkTextColor: 'dark:text-blue-400',
    darkBgColor: 'dark:bg-blue-900'
  },
  'PENAL': {
    name: 'Penal',
    icon: Shield,
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    darkTextColor: 'dark:text-amber-400',
    darkBgColor: 'dark:bg-amber-900'
  },
  'LABORAL': {
    name: 'Laboral',
    icon: Users,
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    darkTextColor: 'dark:text-purple-400',
    darkBgColor: 'dark:bg-purple-900'
  },
  'TRIBUTARIO': {
    name: 'Tributario',
    icon: FileText,
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    darkTextColor: 'dark:text-yellow-400',
    darkBgColor: 'dark:bg-yellow-900'
  },
  'ADMINISTRATIVO': {
    name: 'Administrativo',
    icon: Building,
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    darkTextColor: 'dark:text-orange-400',
    darkBgColor: 'dark:bg-orange-900'
  },
  'COMERCIAL': {
    name: 'Comercial',
    icon: Briefcase,
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
    darkTextColor: 'dark:text-cyan-400',
    darkBgColor: 'dark:bg-cyan-900'
  },
  'FINANCIERO': {
    name: 'Financiero',
    icon: Briefcase,
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    darkTextColor: 'dark:text-emerald-400',
    darkBgColor: 'dark:bg-emerald-900'
  },
  'PROPIEDAD_INTELECTUAL': {
    name: 'Propiedad Intelectual',
    icon: BookOpen,
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-200',
    darkTextColor: 'dark:text-pink-400',
    darkBgColor: 'dark:bg-pink-900'
  }
} as const

// Función helper para obtener colores por ID de entidad
export const getEntityColors = (entityId: string) => {
  return ENTITY_COLORS[entityId as keyof typeof ENTITY_COLORS] || {
    name: 'Desconocido',
    icon: FileText,
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    hoverBg: 'hover:bg-gray-50',
    darkTextColor: 'dark:text-gray-400',
    darkBgColor: 'dark:bg-gray-700',
    darkBorderColor: 'dark:border-gray-600'
  }
}

// Función helper para obtener colores por estado
export const getStatusColors = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['PENDING']
}

// Función helper para obtener colores por área
export const getAreaColors = (area: string) => {
  return AREA_COLORS[area as keyof typeof AREA_COLORS] || {
    name: area,
    icon: FileText,
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    darkTextColor: 'dark:text-gray-400',
    darkBgColor: 'dark:bg-gray-700'
  }
}

export type EntityId = keyof typeof ENTITY_COLORS
export type StatusId = keyof typeof STATUS_COLORS  
export type AreaId = keyof typeof AREA_COLORS