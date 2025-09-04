import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@editorialjuridico.com' },
    update: {},
    create: {
      email: 'admin@editorialjuridico.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date()
    }
  })

  // Create editor user  
  const editorPassword = await bcrypt.hash('editor123', 12)
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@editorialjuridico.com' },
    update: {},
    create: {
      email: 'editor@editorialjuridico.com',
      password: editorPassword,
      firstName: 'Editor',
      lastName: 'User',
      role: 'EDITOR',
      status: 'ACTIVE',
      department: 'Editorial',
      emailVerified: new Date()
    }
  })

  // Create sample documents
  const documents = [
    {
      title: 'Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales',
      url: 'https://www.boe.es/eli/es/lo/2018/12/05/3',
      content: 'Contenido de la ley de protección de datos...',
      summary: 'Nueva regulación española de protección de datos personales',
      source: 'BOE',
      legalArea: 'ADMINISTRATIVO',
      documentType: 'LEY',
      status: 'APPROVED',
      priority: 'HIGH',
      publicationDate: new Date('2018-12-05'),
      curatorId: adminUser.id,
      keywords: 'protección datos,RGPD,privacidad',
      relevanceTags: 'empresas,ciudadanos,derechos digitales'
    },
    {
      title: 'Sentencia del Tribunal Supremo sobre contratos de alquiler',
      url: 'https://example.com/sentencia-ts-2024',
      content: 'Texto completo de la sentencia...',
      summary: 'El TS establece criterios sobre cláusulas abusivas en contratos de alquiler',
      source: 'TRIBUNAL_SUPREMO',
      legalArea: 'CIVIL',
      documentType: 'SENTENCIA',
      status: 'APPROVED',
      priority: 'NORMAL',
      publicationDate: new Date('2024-01-15'),
      curatorId: editorUser.id,
      keywords: 'alquiler,cláusulas abusivas,contratos',
      relevanceTags: 'inmobiliario,inquilinos,propietarios'
    }
  ]

  for (const doc of documents) {
    await prisma.document.upsert({
      where: { url: doc.url },
      update: {},
      create: doc
    })
  }

  // Create sample articles
  const sampleArticle = await prisma.article.upsert({
    where: { slug: 'nueva-ley-proteccion-datos-2024' },
    update: {},
    create: {
      title: 'Análisis de la nueva Ley de Protección de Datos',
      slug: 'nueva-ley-proteccion-datos-2024',
      content: `
## Introducción

La nueva regulación de protección de datos representa un cambio significativo...

## Principales novedades

1. **Derechos reforzados**: Los ciudadanos tienen mayor control...
2. **Obligaciones empresariales**: Las empresas deben cumplir...
3. **Sanciones**: Se establecen multas más severas...

## Conclusiones

Esta nueva normativa requiere una adaptación urgente por parte de las organizaciones...
      `,
      summary: 'Análisis detallado de las principales novedades en protección de datos y su impacto en empresas y ciudadanos.',
      metaTitle: 'Nueva Ley Protección Datos 2024 - Análisis Completo',
      metaDescription: 'Todo lo que necesitas saber sobre la nueva ley de protección de datos: novedades, obligaciones y sanciones.',
      keywords: 'protección datos,ley 2024,RGPD,empresas,privacidad',
      status: 'PUBLISHED',
      publicationSection: 'ACTUALIZACIONES_NORMATIVAS',
      tags: 'normativa,empresas,ciudadanos',
      publishedAt: new Date(),
      wordCount: 850,
      readingTime: 4,
      authorId: adminUser.id
    }
  })

  // Create system config
  const configs = [
    { key: 'site_name', value: 'Editorial Jurídico', description: 'Nombre del sitio web' },
    { key: 'site_description', value: 'Sistema Editorial Jurídico Supervisado', description: 'Descripción del sitio' },
    { key: 'articles_per_page', value: '10', description: 'Artículos por página' },
    { key: 'auto_save_interval', value: '30000', description: 'Intervalo de auto-guardado en ms' },
    { key: 'max_upload_size', value: '10485760', description: 'Tamaño máximo de archivo en bytes' }
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user: admin@editorialjuridico.com / admin123')
  console.log('👤 Editor user: editor@editorialjuridico.com / editor123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })