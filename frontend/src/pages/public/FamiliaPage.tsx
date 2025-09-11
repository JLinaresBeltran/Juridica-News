import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionPage } from '@/components/public/SectionPage'

export default function FamiliaPage() {
  const handleSearch = (query: string) => {
    console.log('Búsqueda en Familia:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <>
      <PublicHeader onSearch={handleSearch} />
      <SectionPage sectionKey="familia" />
      <PublicFooter />
    </>
  )
}