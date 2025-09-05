"""
Base extractor class - Implementación para el sistema de scraping jurídico
"""

import logging
from abc import ABC, abstractmethod
from typing import List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class DocumentMetadata:
    """Metadata básica del documento jurídico."""
    source: str
    document_id: str
    title: str
    date: datetime
    court: str
    document_type: str = ""
    magistrate: str = ""
    pdf_url: str = ""
    html_url: str = ""
    extraction_date: datetime = None

    def __post_init__(self):
        if self.extraction_date is None:
            self.extraction_date = datetime.now()

class BaseExtractor(ABC):
    """Base class para extractores jurídicos."""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"scraper.{name}")
        self.logger.setLevel(logging.INFO)
        
        # Configurar handler si no existe
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    @abstractmethod
    def extract_documents(self, source: str, **kwargs) -> List[DocumentMetadata]:
        """Método abstracto para extraer documentos."""
        pass