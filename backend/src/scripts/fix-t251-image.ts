/**
 * Script para arreglar la imagen base64 del artículo T-251
 *
 * Ejecutar: npx tsx src/scripts/fix-t251-image.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function fixBase64Image() {
  try {
    // 1. Obtener el artículo con la imagen base64
    const article = await prisma.article.findUnique({
      where: { id: 'cmjrd1jzd0001nrt3ue7oo0mv' }
    })

    if (!article || !article.imageUrl) {
      console.log('No se encontró el artículo o no tiene imagen')
      return
    }

    console.log('Artículo encontrado:', article.title)
    console.log('Longitud de imagen:', article.imageUrl.length, 'caracteres')

    // 2. Verificar si es base64
    if (!article.imageUrl.startsWith('data:image/')) {
      console.log('La imagen ya no es base64, saltando...')
      return
    }

    // 3. Decodificar y guardar como archivo
    const base64Data = article.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const timestamp = Date.now()
    const filename = `fixed-t251-${timestamp}.png`
    const imagesDir = path.join(process.cwd(), 'storage', 'images')

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const filePath = path.join(imagesDir, filename)
    fs.writeFileSync(filePath, imageBuffer)

    console.log('✅ Imagen guardada en:', filePath)
    console.log('   Tamaño:', (imageBuffer.length / 1024 / 1024).toFixed(2), 'MB')

    // 4. Actualizar el artículo con la nueva URL
    const newImageUrl = `/api/storage/images/${filename}`
    await prisma.article.update({
      where: { id: 'cmjrd1jzd0001nrt3ue7oo0mv' },
      data: { imageUrl: newImageUrl }
    })

    console.log('✅ Artículo actualizado con nueva URL:', newImageUrl)

  } finally {
    await prisma.$disconnect()
  }
}

fixBase64Image().catch(console.error)
