import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionPage } from '@/components/public/SectionPage'

export default function ConstitucionalPage() {
  const handleSearch = (query: string) => {
    console.log('Búsqueda en Constitucional:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <>
      <PublicHeader onSearch={handleSearch} />
      <SectionPage sectionKey="constitucional" />
      <PublicFooter />
    </>
  )
}
