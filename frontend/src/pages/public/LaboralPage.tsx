import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionPage } from '@/components/public/SectionPage'

export default function LaboralPage() {
  const handleSearch = (query: string) => {
    console.log('Búsqueda en Laboral:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <>
      <PublicHeader onSearch={handleSearch} />
      <SectionPage sectionKey="laboral" />
      <PublicFooter />
    </>
  )
}