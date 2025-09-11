export interface JudicialEntity {
  id: string
  name: string
  acronym: string
  description: string
  articleCount: number
  lastUpdate: string
  type: 'corte' | 'tribunal' | 'superintendencia' | 'procuraduria' | 'fiscalia' | 'otros'
  color: string
  articles: Array<{
    id: string
    title: string
    date: string
    excerpt: string
    priority: 'alta' | 'media' | 'baja'
  }>
}

export const judicialEntities: JudicialEntity[] = [
  {
    id: '1',
    name: 'Corte Constitucional',
    acronym: 'CC',
    description: 'Máximo tribunal constitucional del país',
    articleCount: 8,
    lastUpdate: '2024-01-15',
    type: 'corte',
    color: 'blue',
    articles: [
      {
        id: 'cc-1',
        title: 'Sentencia T-085 protección a víctimas del conflicto armado',
        date: '2024-01-15',
        excerpt: 'Nueva jurisprudencia establece criterios para reparación integral',
        priority: 'alta'
      },
      {
        id: 'cc-2',
        title: 'Auto 547 sobre seguimiento a política carcelaria',
        date: '2024-01-14',
        excerpt: 'Revisión del estado de hacinamiento en centros penitenciarios',
        priority: 'media'
      },
      {
        id: 'cc-3',
        title: 'Sentencia C-012 exequibilidad de reforma tributaria',
        date: '2024-01-13',
        excerpt: 'Análisis constitucional de nuevos impuestos empresariales',
        priority: 'alta'
      }
    ]
  },
  {
    id: '2',
    name: 'Corte Suprema de Justicia',
    acronym: 'CSJ',
    description: 'Máximo tribunal de la jurisdicción ordinaria',
    articleCount: 6,
    lastUpdate: '2024-01-14',
    type: 'corte',
    color: 'red',
    articles: [
      {
        id: 'csj-1',
        title: 'Sala Penal unifica criterios sobre feminicidio agravado',
        date: '2024-01-13',
        excerpt: 'Precedente vinculante sobre elementos configurativos del delito',
        priority: 'alta'
      },
      {
        id: 'csj-2',
        title: 'Sala Civil sobre responsabilidad médica',
        date: '2024-01-12',
        excerpt: 'Nuevos lineamientos para malpractice en instituciones de salud',
        priority: 'media'
      }
    ]
  },
  {
    id: '3',
    name: 'Consejo de Estado',
    acronym: 'CE',
    description: 'Máximo tribunal contencioso administrativo',
    articleCount: 5,
    lastUpdate: '2024-01-12',
    type: 'corte',
    color: 'green',
    articles: [
      {
        id: 'ce-1',
        title: 'Revisión de política laboral en teletrabajo',
        date: '2024-01-12',
        excerpt: 'Orden al MinTrabajo de actualizar regulación sobre trabajo remoto',
        priority: 'alta'
      },
      {
        id: 'ce-2',
        title: 'Nulidad de licitación por irregularidades',
        date: '2024-01-11',
        excerpt: 'Anulación de proceso millonario de infraestructura vial',
        priority: 'media'
      }
    ]
  },
  {
    id: '4',
    name: 'Procuraduría General',
    acronym: 'PGN',
    description: 'Ministerio Público y control disciplinario',
    articleCount: 4,
    lastUpdate: '2024-01-11',
    type: 'procuraduria',
    color: 'purple',
    articles: [
      {
        id: 'pgn-1',
        title: 'Investigación por irregularidades en procesos disciplinarios',
        date: '2024-01-05',
        excerpt: 'Hallazgos de fallas sistemáticas en tramitación contra servidores',
        priority: 'media'
      }
    ]
  },
  {
    id: '5',
    name: 'Fiscalía General',
    acronym: 'FGN',
    description: 'Investigación penal y acusación',
    articleCount: 7,
    lastUpdate: '2024-01-10',
    type: 'fiscalia',
    color: 'orange',
    articles: [
      {
        id: 'fgn-1',
        title: 'Macro-caso de corrupción en contratación estatal',
        date: '2024-01-07',
        excerpt: 'Proceso penal contra exfuncionarios por irregularidades en salud',
        priority: 'alta'
      },
      {
        id: 'fgn-2',
        title: 'Imputaciones por delitos ambientales en Amazonía',
        date: '2024-01-06',
        excerpt: 'Cargos contra responsables de deforestación ilegal',
        priority: 'media'
      }
    ]
  },
  {
    id: '6',
    name: 'Superintendencia Financiera',
    acronym: 'SFC',
    description: 'Control y vigilancia del sector financiero',
    articleCount: 3,
    lastUpdate: '2024-01-09',
    type: 'superintendencia',
    color: 'indigo',
    articles: [
      {
        id: 'sfc-1',
        title: 'Actualización circular sobre lavado de activos',
        date: '2024-01-09',
        excerpt: 'Nuevas medidas de prevención para entidades financieras',
        priority: 'media'
      }
    ]
  },
  {
    id: '7',
    name: 'Superintendencia de Sociedades',
    acronym: 'SS',
    description: 'Control societario y empresarial',
    articleCount: 2,
    lastUpdate: '2024-01-08',
    type: 'superintendencia',
    color: 'teal',
    articles: [
      {
        id: 'ss-1',
        title: 'Circular sobre reorganización empresarial',
        date: '2024-01-08',
        excerpt: 'Nuevos procedimientos para reestructuración de empresas',
        priority: 'baja'
      }
    ]
  },
  {
    id: '8',
    name: 'Tribunal Superior de Bogotá',
    acronym: 'TSB',
    description: 'Segunda instancia jurisdicción ordinaria',
    articleCount: 3,
    lastUpdate: '2024-01-07',
    type: 'tribunal',
    color: 'pink',
    articles: [
      {
        id: 'tsb-1',
        title: 'Sentencia sobre régimen de custodia y alimentos',
        date: '2024-01-08',
        excerpt: 'Criterios para custodia compartida y obligaciones alimentarias',
        priority: 'media'
      }
    ]
  }
]

export const getEntitiesByType = (type: JudicialEntity['type']) => {
  return judicialEntities.filter(entity => entity.type === type)
}

export const getEntityById = (id: string) => {
  return judicialEntities.find(entity => entity.id === id)
}

export const getTopEntitiesByActivity = (limit: number = 5) => {
  return judicialEntities
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, limit)
}