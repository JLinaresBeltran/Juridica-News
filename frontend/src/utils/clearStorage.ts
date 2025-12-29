/**
 * Utilidad para limpiar localStorage cuando QuotaExceeded
 * Ejecutar en consola del navegador: clearCurationStorage()
 */

export function clearCurationStorage() {
  try {
    // Obtener tamaño actual
    const currentData = localStorage.getItem('curation-storage')
    if (currentData) {
      const sizeKB = (currentData.length / 1024).toFixed(2)
      console.log(`📊 Tamaño actual: ${sizeKB} KB`)
    }

    // Limpiar completamente
    localStorage.removeItem('curation-storage')

    console.log('✅ curation-storage eliminado exitosamente')
    console.log('🔄 Refresca la página para que el store se reinicie')

    return true
  } catch (error) {
    console.error('❌ Error limpiando storage:', error)
    return false
  }
}

export function getCurationStorageSize() {
  try {
    const currentData = localStorage.getItem('curation-storage')
    if (!currentData) {
      console.log('ℹ️ No hay datos en curation-storage')
      return 0
    }

    const sizeBytes = currentData.length
    const sizeKB = (sizeBytes / 1024).toFixed(2)
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2)

    console.log(`📊 Tamaño de curation-storage:`)
    console.log(`   ${sizeBytes} bytes`)
    console.log(`   ${sizeKB} KB`)
    console.log(`   ${sizeMB} MB`)

    // Mostrar límite de localStorage (generalmente 5-10MB)
    const maxSize = 5 * 1024 * 1024 // 5MB típico
    const percentUsed = ((sizeBytes / maxSize) * 100).toFixed(2)
    console.log(`   ${percentUsed}% del límite típico (5MB)`)

    return sizeBytes
  } catch (error) {
    console.error('❌ Error obteniendo tamaño:', error)
    return 0
  }
}
