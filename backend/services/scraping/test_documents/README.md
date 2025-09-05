# 📁 Documentos de Prueba

## 📍 Ubicación
Coloca aquí los documentos RTF de la Corte Constitucional para pruebas del análisis de IA.

## 📋 Formatos Soportados
- `.rtf` - Rich Text Format (preferido)
- `.txt` - Texto plano
- `.html` - HTML 
- `.pdf` - PDF (se extraerá el texto)

## 🏷️ Convención de Nombres
Usa nombres descriptivos que incluyan el número de la sentencia:
- `T-353-25.rtf` 
- `C-223-25.rtf`
- `SU-456-25.rtf`

## 🚀 Carga en Base de Datos
Después de colocar los archivos aquí, ejecuta:
```bash
npm run load-test-docs
```

## ℹ️ Información Adicional
Los documentos se cargarán automáticamente en la base de datos con:
- Título extraído del contenido
- Contenido completo almacenado
- Status: PENDING (listo para curación y análisis IA)
- Fecha de extracción: fecha actual