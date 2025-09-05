#!/usr/bin/env python3
"""
Script para descargar un documento individual
"""

import sys
import argparse
import logging
import requests
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s'
)

def download_document(url, document_id):
    """Descargar un documento individual."""
    logger = logging.getLogger("download_single")
    
    try:
        # Crear directorio de documentos
        docs_dir = Path("../../../documents/scraping/downloads")
        docs_dir.mkdir(parents=True, exist_ok=True)
        
        # Determinar extensión
        if url.endswith('.rtf'):
            extension = '.rtf'
        elif url.endswith('.docx'):
            extension = '.docx'
        else:
            extension = '.rtf'  # Por defecto
        
        # Nombre del archivo
        safe_id = document_id.replace('/', '-')
        filename = f"{safe_id}{extension}"
        local_path = docs_dir / filename
        
        logger.info(f"📥 Descargando: {url}")
        logger.info(f"📁 Guardando en: {local_path}")
        
        # Headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Realizar descarga
        response = requests.get(url, headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        # Verificar que no sea HTML
        content_type = response.headers.get('content-type', '').lower()
        if 'text/html' in content_type:
            logger.warning("❌ URL devuelve HTML, no es documento válido")
            return None
        
        # Guardar archivo
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        file_size = local_path.stat().st_size
        
        # Verificar tamaño
        if file_size < 100:
            logger.warning("❌ Archivo demasiado pequeño, eliminando")
            local_path.unlink()
            return None
        
        logger.info(f"✅ Descarga exitosa: {file_size:,} bytes")
        print(f"LOCAL_PATH:{local_path}")
        
        return str(local_path)
        
    except Exception as e:
        logger.error(f"❌ Error descargando: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Descargar documento individual')
    parser.add_argument('--url', required=True, help='URL del documento')
    parser.add_argument('--id', required=True, help='ID del documento')
    
    args = parser.parse_args()
    
    result = download_document(args.url, args.id)
    
    if not result:
        sys.exit(1)

if __name__ == "__main__":
    main()