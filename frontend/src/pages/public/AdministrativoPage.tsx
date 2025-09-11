import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionPage } from '@/components/public/SectionPage'

export default function AdministrativoPage() {
  const handleSearch = (query: string) => {
    console.log('Búsqueda en Administrativo:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <>
      <PublicHeader onSearch={handleSearch} />
      <SectionPage sectionKey="administrativo" />
      <PublicFooter />
    </>
  )
}