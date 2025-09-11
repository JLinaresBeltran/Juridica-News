import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionPage } from '@/components/public/SectionPage'

export default function TributarioPage() {
  const handleSearch = (query: string) => {
    console.log('Búsqueda en Tributario:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <>
      <PublicHeader onSearch={handleSearch} />
      <SectionPage sectionKey="tributario" />
      <PublicFooter />
    </>
  )
}