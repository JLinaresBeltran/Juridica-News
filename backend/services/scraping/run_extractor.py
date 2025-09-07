#!/Users/jhonathan/Desktop/Juridica-News/backend/services/scraping/venv/bin/python
"""
Script de entrada para ejecutar el extractor de la Corte Constitucional
desde Node.js
"""

import sys
import json
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Agregar directorio actual al path de Python
sys.path.insert(0, Path(__file__).parent.absolute())

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s'
)

def main():
    parser = argparse.ArgumentParser(description='Ejecutar extractor de documentos jurídicos')
    parser.add_argument('--source', required=True, choices=['corte_constitucional'], 
                       help='Fuente de extracción')
    parser.add_argument('--limit', type=int, default=10, 
                       help='Límite de documentos a extraer')
    parser.add_argument('--download', action='store_true',
                       help='Descargar documentos localmente')
    
    args = parser.parse_args()
    
    logger = logging.getLogger("run_extractor")
    
    try:
        logger.info(f"🚀 Iniciando extracción - Fuente: {args.source}, Límite: {args.limit}, Descarga: {'✅ SÍ' if args.download else '❌ NO'}")
        
        if args.source == 'corte_constitucional':
            from corte_constitucional_extractor import CorteConstitucionalExtractor
            
            # Crear directorio de documentos si no existe
            download_dir = Path("test_documents") if args.download else None
            if download_dir:
                download_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"📁 Directorio de descarga: {download_dir.absolute()}")
            
            # Crear extractor
            extractor = CorteConstitucionalExtractor(str(download_dir) if download_dir else None)
            
            # Extraer documentos
            start_time = datetime.now()
            documents = extractor.extract_latest_sentences(args.limit)
            end_time = datetime.now()
            
            # Contar descargas si se solicitaron
            downloaded_count = 0
            if args.download and documents:
                logger.info(f"📥 Descargando {len(documents)} documentos...")
                for doc in documents:
                    try:
                        local_path = extractor.download_document(doc.pdf_url, doc.document_id)
                        if local_path:
                            downloaded_count += 1
                    except Exception as e:
                        logger.warning(f"❌ Error descargando {doc.document_id}: {e}")
            
            # Convertir documentos a formato serializable
            serializable_docs = []
            for doc in documents:
                serializable_docs.append({
                    'document_id': doc.document_id,
                    'title': doc.title,
                    'source': doc.source,
                    'court': doc.court,
                    'document_type': doc.document_type,
                    'pdf_url': doc.pdf_url,
                    'html_url': doc.html_url,
                    'date': doc.date.isoformat() if hasattr(doc.date, 'isoformat') else str(doc.date),
                    'extraction_date': doc.extraction_date.isoformat() if hasattr(doc.extraction_date, 'isoformat') else str(doc.extraction_date),
                    'magistrate': getattr(doc, 'magistrate', ''),
                })
            
            # Preparar resultado
            result = {
                'success': True,
                'documents': serializable_docs,
                'downloadedCount': downloaded_count,
                'extractionTime': (end_time - start_time).total_seconds(),
                'totalFound': len(documents)
            }
            
            # Imprimir resultado como JSON para Node.js
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            logger.info(f"✅ Extracción completada - {len(documents)} documentos, {downloaded_count} descargados")
            
        else:
            raise ValueError(f"Fuente no soportada: {args.source}")
            
    except Exception as e:
        logger.error(f"❌ Error en extracción: {e}")
        error_result = {
            'success': False,
            'error': str(e),
            'documents': [],
            'downloadedCount': 0,
            'extractionTime': 0
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)
    
    # Cleanup
    try:
        if 'extractor' in locals() and hasattr(extractor, 'driver') and extractor.driver:
            extractor.driver.quit()
    except:
        pass

if __name__ == "__main__":
    main()