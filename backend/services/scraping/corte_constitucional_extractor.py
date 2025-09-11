"""
Extractor completo para la Corte Constitucional usando Selenium.
Integrado al Sistema Editorial Jurídico Supervisado.
"""

import time
import logging
import re
import os
import requests
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from base import BaseExtractor, DocumentMetadata

@dataclass
class CorteConstitucionalDocument(DocumentMetadata):
    """Documento específico de la Corte Constitucional."""
    sentence_type: str = "C"  # C, T, SU, A
    magistrate: str = ""
    expediente: str = ""
    resumen: str = ""
    texto_resuelve: str = ""
    full_content: str = ""
    local_document_path: Optional[str] = None
    fecha_publicacion: Optional[datetime] = None

class CorteConstitucionalExtractor(BaseExtractor):
    """Extractor completo para la Corte Constitucional integrado al sistema."""
    
    def __init__(self, download_dir: Optional[str] = None):
        super().__init__("corte_constitucional")
        self.base_url = "https://www.corteconstitucional.gov.co"
        self.buscador_url = f"{self.base_url}/relatoria/buscador-jurisprudencia"
        self.driver = None
        
        # Directorio de descarga configurable
        self.download_dir = Path(download_dir) if download_dir else Path("documents/scraping")
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache de URLs verificadas con timestamp
        self._url_cache = {}
        self._cache_ttl = 3600  # 1 hora en segundos
        
        # Configurar logging específico para el sistema
        logging.getLogger('selenium').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    def __del__(self):
        """Cleanup del driver al destruir la instancia."""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
    
    def extract_documents(self, source: str, **kwargs) -> List[DocumentMetadata]:
        """Implementar método abstracto del BaseExtractor."""
        limit = kwargs.get('limit', 10)
        return self.extract_latest_sentences(limit)
    
    def _setup_driver(self) -> webdriver.Chrome:
        """Configurar el driver de Chrome optimizado para el sistema."""
        self.logger.info("🚗 Configurando driver de Chrome para el sistema")
        
        chrome_options = Options()
        
        # Configuración básica optimizada
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Optimizaciones de velocidad
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-extensions")
        
        # User agent del sistema
        chrome_options.add_argument("--user-agent=SistemaEditorialJuridico/1.0")
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            driver.set_page_load_timeout(30)
            driver.implicitly_wait(5)
            
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            driver.get("about:blank")
            
            self.logger.info("✅ Driver configurado exitosamente para el sistema")
            return driver
            
        except Exception as e:
            self.logger.error(f"Error configurando driver: {e}")
            # Configuración alternativa
            try:
                chrome_options_simple = Options()
                chrome_options_simple.add_argument("--headless=new")
                chrome_options_simple.add_argument("--no-sandbox")
                chrome_options_simple.add_argument("--disable-dev-shm-usage")
                
                driver = webdriver.Chrome(options=chrome_options_simple)
                driver.set_page_load_timeout(20)
                self.logger.info("✅ Driver configurado con opciones simplificadas")
                return driver
                
            except Exception as e2:
                self.logger.error(f"Error con configuración alternativa: {e2}")
                raise Exception(f"No se pudo configurar ChromeDriver: {e}")
    
    def _wait_for_angular_load(self, timeout: int = 15):
        """Esperar a que Angular termine de cargar."""
        try:
            self.logger.debug("⏳ Esperando carga completa de Angular...")
            
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script(
                    "return typeof window.ng !== 'undefined' || document.querySelector('app-root') !== null || document.querySelector('[ng-app]') !== null"
                )
            )
            
            # Espera inteligente basada en contenido
            start_time = time.time()
            max_content_wait = 8
            
            while time.time() - start_time < max_content_wait:
                content_loaded = self.driver.execute_script("""
                    return document.querySelector('table') !== null || 
                           document.querySelector('.results') !== null ||
                           document.querySelectorAll('tr').length > 5;
                """)
                
                if content_loaded:
                    self.logger.debug("✅ Contenido dinámico detectado")
                    return
                
                time.sleep(1)
            
        except TimeoutException:
            self.logger.warning("⚠️ Timeout esperando carga de Angular, continuando...")
    
    def extract_latest_sentences(self, limit: int = 10, check_database_empty: bool = True) -> List[DocumentMetadata]:
        """
        Extraer las últimas sentencias PUBLICADAS con filtrado por fechas.
        
        Args:
            limit: Número máximo de sentencias a extraer
            check_database_empty: Si es True, verifica si la BD está vacía para usar búsqueda extendida
            
        Returns:
            List[DocumentMetadata]: Lista de sentencias publicadas
        """
        self.logger.info(f"Iniciando extracción de sentencias (límite: {limit})")
        
        documents = []
        use_extended_search = False
        
        try:
            # Verificar si la base de datos está vacía (si se solicita)
            if check_database_empty:
                use_extended_search = self._check_if_database_empty()
                if use_extended_search:
                    self.logger.info("🗃️ Base de datos vacía detectada - usando búsqueda extendida")
            
            documents = self._extract_with_date_filtering(limit, use_extended_search=use_extended_search)
            
            # Si no encontramos documentos con búsqueda normal, intentar extendida
            if not documents and not use_extended_search:
                self.logger.info("🔍 Sin resultados con búsqueda normal, intentando búsqueda extendida...")
                documents = self._extract_with_date_filtering(limit, use_extended_search=True)
            
            if documents:
                self.logger.info(f"✅ Extraídas {len(documents)} sentencias")
                
                # Validar URLs
                valid_documents = []
                for doc in documents:
                    if doc.pdf_url and self._verify_document_url_cached(doc.pdf_url):
                        valid_documents.append(doc)
                        self.logger.debug(f"✅ URL verificada: {doc.document_id}")
                    else:
                        self.logger.warning(f"❌ URL inválida: {doc.document_id}")
                
                documents = valid_documents
            
            self.logger.info(f"🎯 Extracción completada: {len(documents)} sentencias válidas")
            
        except Exception as e:
            self.logger.error(f"❌ Error en extracción: {e}")
            return []
        
        return documents
    
    def _check_if_database_empty(self) -> bool:
        """
        Verificar si la base de datos está vacía consultando vía API local.
        
        Returns:
            bool: True si la BD está vacía o casi vacía
        """
        try:
            import requests
            
            # URL de la API local para verificar documentos existentes
            api_url = "http://localhost:3001/api/documents/stats"
            
            # Intentar consultar la API
            response = requests.get(api_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                total_documents = data.get('data', {}).get('total', 0)
                self.logger.info(f"📊 Documentos en BD: {total_documents}")
                return total_documents < 5  # Consideramos vacía si tiene menos de 5 documentos
            else:
                self.logger.warning(f"⚠️ No se pudo consultar API (status: {response.status_code})")
                return False
                
        except Exception as e:
            self.logger.warning(f"⚠️ Error consultando BD: {e}")
            # Si no podemos consultar, asumimos búsqueda normal
            return False
    
    def _extract_with_date_filtering(self, limit: int, use_extended_search: bool = False) -> List[DocumentMetadata]:
        """Extraer sentencias con filtrado por fechas específicas."""
        results = []
        
        try:
            if not self.driver:
                self.logger.info("Inicializando driver de Selenium...")
                self.driver = self._setup_driver()
            
            # Obtener fechas de extracción (usar búsqueda extendida si se especifica)
            extraction_dates = self._get_extraction_dates(extended_search=use_extended_search)
            self.logger.info(f"🔍 Buscando en {len(extraction_dates)} fechas hábiles")
            
            # Navegar a la sección de jurisprudencia
            success = self._navigate_to_jurisprudencia()
            if not success:
                return []
            
            # Extraer sentencias para cada fecha
            for date_obj, date_str, date_short, date_alt in extraction_dates:
                if len(results) >= limit:
                    break
                    
                self.logger.info(f"📅 Buscando sentencias del {date_str}")
                date_results = self._extract_sentences_by_date(date_str, date_short, date_alt, limit - len(results))
                
                if date_results:
                    self.logger.info(f"✅ {len(date_results)} sentencias encontradas para {date_str}")
                    results.extend(date_results)
                else:
                    self.logger.info(f"⚠️ Sin sentencias para {date_str}")
            
            return results[:limit]
            
        except Exception as e:
            self.logger.error(f"Error en extracción con filtrado: {e}")
            return []
    
    def _get_extraction_dates(self, extended_search: bool = False) -> List[tuple]:
        """
        Obtiene las fechas de extracción.
        
        Args:
            extended_search: Si es True, busca en más días (para base de datos limpia)
        """
        months_spanish = {
            1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
            7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
        }
        
        dates_to_extract = []
        today = datetime.now()
        
        # Determinar número de días a buscar - Aumentamos para modo normal
        days_to_search = 15 if extended_search else 7
        self.logger.info(f"🗓️ Modo de búsqueda: {'extendida' if extended_search else 'normal'} ({days_to_search} días)")
        
        current_date = today
        days_added = 0
        
        while days_added < days_to_search:
            # Solo incluir días hábiles (lunes-viernes)
            if current_date.weekday() < 5:
                day = current_date.day
                month_name = months_spanish[current_date.month]
                year = current_date.year
                
                target_date_str = f"{day} de {month_name} de {year}"
                target_date_short = current_date.strftime("%d/%m/%Y")
                target_date_alt = f"{day:02d}-{current_date.month:02d}-{year}"
                
                dates_to_extract.append((current_date, target_date_str, target_date_short, target_date_alt))
                days_added += 1
                self.logger.debug(f"📅 Agregada fecha: {target_date_str}")
            
            current_date -= timedelta(days=1)
        
        self.logger.info(f"✅ Total de fechas para extracción: {len(dates_to_extract)}")
        return dates_to_extract
    
    def _navigate_to_jurisprudencia(self) -> bool:
        """Navegar a la sección de jurisprudencia."""
        jurisprudencia_urls = [
            "https://www.corteconstitucional.gov.co/jurisprudencia/",
            "https://www.corteconstitucional.gov.co/relatoria/",
            "https://www.corteconstitucional.gov.co/"
        ]
        
        for base_url in jurisprudencia_urls:
            try:
                self.logger.info(f"🌐 Navegando a: {base_url}")
                self.driver.get(base_url)
                time.sleep(3)
                self._wait_for_angular_load()
                
                # Buscar botón "Ver últimas sentencias"
                if self._click_ver_ultimas_sentencias():
                    return True
                    
            except Exception as e:
                self.logger.debug(f"Error en {base_url}: {e}")
                continue
        
        return False
    
    def _click_ver_ultimas_sentencias(self) -> bool:
        """Buscar y hacer clic en botón 'Ver últimas sentencias'."""
        button_patterns = [
            "Ver últimas sentencias",
            "últimas sentencias", 
            "Últimas sentencias",
            "Ver sentencias recientes"
        ]
        
        for pattern in button_patterns:
            selectors = [
                f"//button[contains(text(), '{pattern}')]",
                f"//a[contains(text(), '{pattern}')]",
                f"//span[contains(text(), '{pattern}')]/parent::button",
                f"//span[contains(text(), '{pattern}')]/parent::a"
            ]
            
            for selector in selectors:
                try:
                    buttons = self.driver.find_elements(By.XPATH, selector)
                    for button in buttons:
                        if button.is_displayed() and button.is_enabled():
                            self.logger.info(f"✅ Encontrado botón: '{button.text.strip()}'")
                            
                            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button)
                            time.sleep(1)
                            
                            try:
                                button.click()
                            except:
                                self.driver.execute_script("arguments[0].click();", button)
                            
                            time.sleep(3)
                            self._wait_for_angular_load()
                            return True
                            
                except Exception as e:
                    continue
        
        return False
    
    def _extract_sentences_by_date(self, target_date_str: str, target_date_short: str, target_date_alt: str, limit: int) -> List[DocumentMetadata]:
        """Extraer sentencias filtradas por fecha específica."""
        results = []
        
        try:
            # Crear patrones de fecha para búsqueda
            date_patterns = [
                target_date_str,  # "4 de septiembre de 2025"
                target_date_short,  # "04/09/2025"
                target_date_alt,  # "04-09-2025"
                target_date_str.replace(" de ", "/"),
            ]
            
            # Agregar formato ISO
            date_parts = target_date_short.split("/")
            if len(date_parts) == 3:
                day, month, year = date_parts
                iso_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                date_patterns.append(iso_date)
            
            # Buscar en tabla
            table_selectors = ["//table//tr", "//tbody//tr"]
            
            for selector in table_selectors:
                try:
                    rows = self.driver.find_elements(By.XPATH, selector)
                    if len(rows) <= 2:
                        continue
                        
                    for i, row in enumerate(rows[:50]):
                        try:
                            row_text = row.text.strip()
                            if not row_text or len(row_text) < 10:
                                continue
                            
                            # Verificar si la fila contiene la fecha objetivo
                            date_found = False
                            for date_pattern in date_patterns:
                                if date_pattern.lower() in row_text.lower():
                                    date_found = True
                                    break
                            
                            if not date_found:
                                continue
                            
                            # Buscar número de sentencia - Patrones mejorados
                            sentence_patterns = [
                                r'([TCG]-\d{1,4}[/-]\d{2,4})',  # T-343/25, C-123/25, etc.
                                r'(SU\.\d{1,4}[/-]\d{2,4})',
                                r'(SU-\d{1,4}[/-]\d{2,4})', 
                                r'([A]-\d{1,4}[/-]\d{2,4})',
                                r'([TCG]\d{1,4}[/-]\d{2,4})',   # Sin guión
                                r'(SU\d{1,4}[/-]\d{2,4})'      # SU sin punto ni guión
                            ]
                            
                            sentence_number = None
                            for pattern in sentence_patterns:
                                matches = re.findall(pattern, row_text, re.IGNORECASE)
                                if matches:
                                    sentence_number = matches[0].upper()
                                    break
                            
                            if not sentence_number:
                                continue
                            
                            # Generar URLs
                            pdf_url = self._generate_document_url(sentence_number)
                            html_url = self._generate_html_url(sentence_number)
                            
                            # Crear DocumentMetadata
                            doc = DocumentMetadata(
                                source='corte_constitucional',
                                document_id=sentence_number,
                                title=f"Sentencia {sentence_number} de la Corte Constitucional ({target_date_str})",
                                date=datetime.now(),
                                court="Corte Constitucional",
                                document_type=sentence_number.split('-')[0] if '-' in sentence_number else sentence_number.split('.')[0],
                                pdf_url=pdf_url,
                                html_url=html_url
                            )
                            
                            results.append(doc)
                            self.logger.debug(f"✅ Sentencia encontrada: {sentence_number}")
                            
                            if len(results) >= limit:
                                return results
                                
                        except Exception as e:
                            self.logger.debug(f"Error procesando fila {i}: {e}")
                            continue
                    
                    if results:
                        break
                        
                except Exception as e:
                    self.logger.debug(f"Error con selector {selector}: {e}")
                    continue
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error extrayendo por fecha: {e}")
            return []
    
    def _generate_document_url(self, sentence_number: str) -> str:
        """Generar URL del documento RTF/DOCX."""
        try:
            # Limpiar número de sentencia
            clean_number = sentence_number.strip().upper()
            
            # Casos especiales para SU
            if clean_number.startswith('SU.'):
                normalized_id = clean_number.replace('SU.', 'su').replace('/', '-').lower()
            elif clean_number.startswith('SU'):
                normalized_id = clean_number.replace('SU', 'su').replace('/', '-').lower()
            else:
                # Para T, C, A, etc. mantener formato estándar
                normalized_id = clean_number.lower().replace('/', '-')
            
            current_year = datetime.now().year
            base_url = f"https://www.corteconstitucional.gov.co/sentencias/{current_year}/{normalized_id}.rtf"
            
            self.logger.debug(f"URL generada: {sentence_number} -> {base_url}")
            return base_url
            
        except Exception as e:
            self.logger.error(f"Error generando URL para {sentence_number}: {e}")
            return ""
    
    def _generate_html_url(self, sentence_number: str) -> str:
        """Generar URL de la página HTML de la sentencia."""
        current_year = datetime.now().year
        return f"https://www.corteconstitucional.gov.co/relatoria/{current_year}/{sentence_number.replace('/', '-')}.htm"
    
    def _verify_document_url_cached(self, url: str) -> bool:
        """Verificar URL con cache."""
        import time
        
        current_time = time.time()
        if url in self._url_cache:
            cached_data = self._url_cache[url]
            if current_time - cached_data['timestamp'] < self._cache_ttl:
                return cached_data['valid']
        
        is_valid = self._verify_document_url(url)
        
        self._url_cache[url] = {
            'valid': is_valid,
            'timestamp': current_time
        }
        
        return is_valid
    
    def _verify_document_url(self, url: str) -> bool:
        """Verificar que una URL de documento sea válida."""
        if not url:
            return False
            
        try:
            # Intentar HEAD request primero
            response = requests.head(url, timeout=10, allow_redirects=True)
            
            # Si HEAD no funciona, intentar GET con rango limitado
            if response.status_code != 200:
                try:
                    headers = {'Range': 'bytes=0-1024'}
                    response = requests.get(url, timeout=10, headers=headers, allow_redirects=True)
                except:
                    pass
            
            # Aceptar códigos 200-299
            if not (200 <= response.status_code < 300):
                self.logger.debug(f"URL retorna status {response.status_code}: {url}")
                return False
            
            content_type = response.headers.get('content-type', '').lower()
            
            # Válido si NO es HTML - Ser más permisivo
            is_valid_document = (
                'text/html' not in content_type or  # No es HTML, O
                'application/rtf' in content_type or
                'application/vnd.openxmlformats' in content_type or
                'application/msword' in content_type or
                'application/pdf' in content_type or
                'application/octet-stream' in content_type or
                content_type == '' or
                'text/plain' in content_type  # RTF a veces se reporta como text/plain
            )
            
            self.logger.debug(f"URL válida: {url} (Content-Type: {content_type})")
            return is_valid_document
            
        except Exception as e:
            self.logger.debug(f"Error verificando URL {url}: {e}")
            # En caso de error, asumir que es válida para no perder documentos
            return True
    
    def download_document(self, document_url: str, sentence_number: str) -> Optional[str]:
        """Descargar y guardar documento localmente."""
        if not document_url:
            return None
            
        try:
            # Crear subdirectorios
            rtf_dir = self.download_dir / "rtf"
            docx_dir = self.download_dir / "docx"
            rtf_dir.mkdir(exist_ok=True)
            docx_dir.mkdir(exist_ok=True)
            
            # Determinar nombre de archivo
            safe_name = sentence_number.replace("/", "-")
            extension = '.rtf' if document_url.endswith('.rtf') else '.docx'
            filename = f"{safe_name}{extension}"
            local_path = rtf_dir / filename
            
            # Headers para solicitud
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            # Descargar archivo
            response = requests.get(document_url, headers=headers, timeout=30, stream=True)
            response.raise_for_status()
            
            # Verificar tipo de contenido
            content_type = response.headers.get('content-type', '').lower()
            
            # Detectar HTML
            content_preview = response.content[:500].decode('utf-8', errors='ignore').lower()
            is_html = (
                'text/html' in content_type or
                '<!doctype html' in content_preview or
                '<html' in content_preview
            )
            
            if is_html:
                self.logger.warning(f"URL devuelve HTML: {document_url}")
                return None
            
            # Detectar tipo real por firma
            first_bytes = response.content[:10]
            if first_bytes.startswith(b'PK'):
                actual_extension = '.docx'
                local_path = docx_dir / f"{safe_name}.docx"
            elif first_bytes.startswith(b'{\\rtf'):
                actual_extension = '.rtf'
                local_path = rtf_dir / f"{safe_name}.rtf"
            else:
                # Mantener extensión original
                pass
            
            # Guardar archivo
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = local_path.stat().st_size
            
            # Verificar tamaño mínimo
            if file_size < 100:
                local_path.unlink()
                return None
            
            self.logger.info(f"✅ Documento descargado: {local_path} ({file_size:,} bytes)")
            return str(local_path)
            
        except Exception as e:
            self.logger.error(f"Error descargando {document_url}: {e}")
            return None