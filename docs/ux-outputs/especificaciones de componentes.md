# Especificaciones de Componentes - Editorial Jurídico Supervisado

## Componentes de Layout Principal

### MainLayout
**Archivo**: `components/layout/MainLayout.tsx`

#### Diseño Visual
- **Estructura**: Header fijo + Sidebar + Área principal
- **Dimensiones**: 
  - Header: 64px de altura
  - Sidebar: 256px ancho (expandido) / 64px (colapsado)
  - Área principal: Flex-fill restante
- **Fondo**: `var(--color-surface)`
- **Separadores**: Border de `var(--color-border)` entre secciones

#### Estructura
```tsx
interface MainLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

<MainLayout>
  <Header />
  <div className="layout-body">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
</MainLayout>
```

#### Estados
- **Sidebar Expandido**: Navegación completa visible
- **Sidebar Colapsado**: Solo iconos visibles
- **Responsive**: En móvil, sidebar se convierte en overlay

#### Comportamiento Responsivo
- **Desktop (>1024px)**: Layout de 3 columnas fijo
- **Tablet (768-1024px)**: Sidebar colapsado por defecto
- **Mobile (<768px)**: Sidebar como drawer overlay

---

### Header
**Archivo**: `components/layout/Header.tsx`

#### Diseño Visual
- **Altura**: 64px fijo
- **Fondo**: `var(--color-surface)` con `var(--shadow-sm)`
- **Padding**: `0 var(--space-6)`
- **Border-bottom**: `1px solid var(--color-border)`

#### Estructura
```tsx
<Header>
  <div className="header-left">
    <Logo />
    <button onClick={onSidebarToggle}>
      <MenuIcon />
    </button>
  </div>
  
  <div className="header-center">
    <SearchBox placeholder="Buscar documentos y artículos..." />
  </div>
  
  <div className="header-right">
    <AutoSaveStatus />
    <ConnectionStatus />
    <ThemeToggle />
    <UserMenu />
  </div>
</Header>
```

#### Estados
- **AutoSaveStatus**:
  - Saved: Checkmark verde con "Guardado"
  - Saving: Spinner con "Guardando..."
  - Error: X roja con "Error al guardar"

#### Interacciones
- **Logo**: Navegación a dashboard principal
- **Menu Toggle**: Colapsa/expande sidebar con animación
- **Search**: Focus activa búsqueda global
- **User Menu**: Dropdown con perfil, configuración, logout

---

### Sidebar
**Archivo**: `components/layout/Sidebar.tsx`

#### Diseño Visual
- **Ancho**: 256px expandido / 64px colapsado
- **Fondo**: `var(--color-surface-secondary)`
- **Border-right**: `1px solid var(--color-border)`
- **Padding**: `var(--space-4)`

#### Estructura
```tsx
<Sidebar collapsed={collapsed}>
  <div className="sidebar-header">
    <h2 className="sidebar-title">Editorial Jurídico</h2>
  </div>
  
  <nav className="sidebar-nav">
    <SidebarSection 
      title="Curación"
      items={[
        { id: 'pending', label: 'Por Revisar', count: 42, icon: ClockIcon },
        { id: 'approved', label: 'Aprobados', count: 18, icon: CheckIcon }
      ]}
    />
    
    <SidebarSection 
      title="Editorial"
      items={[
        { id: 'drafts', label: 'Borradores', count: 8, icon: EditIcon },
        { id: 'review', label: 'En Revisión', count: 3, icon: EyeIcon },
        { id: 'ready', label: 'Listos', count: 5, icon: SendIcon }
      ]}
    />
    
    <SidebarSection 
      title="Publicado"
      items={[
        { id: 'published', label: 'Artículos', count: 156, icon: FileTextIcon },
        { id: 'analytics', label: 'Análisis', icon: BarChartIcon }
      ]}
    />
  </nav>
  
  <div className="sidebar-footer">
    <button className="collapse-toggle">
      <ChevronLeftIcon />
    </button>
  </div>
</Sidebar>
```

#### Estados
- **Item Normal**: Color de texto secundario, sin fondo
- **Item Hover**: Fondo `var(--color-primary-50)`, texto `var(--color-primary-700)`
- **Item Activo**: Borde izquierdo `var(--color-primary-500)`, fondo `var(--color-primary-100)`
- **Colapsado**: Solo iconos visibles, tooltips en hover

#### Animaciones
- **Expansión/Colapso**: `width` transición de 300ms `ease-in-out`
- **Hover Items**: `background-color` transición de 150ms `ease-out`

---

## Componentes de Curación

### DocumentCard
**Archivo**: `components/curation/DocumentCard.tsx`

#### Diseño Visual
- **Fondo**: `var(--color-surface)` con `var(--shadow-sm)`
- **Border**: `1px solid var(--color-border)`
- **Border-radius**: `var(--radius-lg)`
- **Padding**: `var(--space-6)`
- **Min-height**: 180px

#### Estructura
```tsx
interface DocumentCardProps {
  document: Document;
  selected: boolean;
  onSelect: (id: string) => void;
  onCurate: (id: string, action: 'approve' | 'reject') => void;
  onPreview: (id: string) => void;
}

<DocumentCard>
  <div className="card-header">
    <StatusIndicator status={document.status} />
    <PriorityBadge priority={document.priority} />
    <Checkbox 
      checked={selected} 
      onChange={() => onSelect(document.id)}
    />
  </div>
  
  <div className="card-content">
    <h3 className="document-title">{document.title}</h3>
    <div className="document-meta">
      <SourceBadge source={document.source} />
      <LegalAreaTag area={document.legal_area} />
      <DateText date={document.publication_date} />
    </div>
    <p className="document-summary">{document.ai_summary}</p>
    <ConfidenceBar score={document.confidence_score} />
  </div>
  
  <div className="card-actions">
    <button 
      className="btn btn-outline" 
      onClick={() => onPreview(document.id)}
    >
      <EyeIcon /> Vista Previa
    </button>
    <div className="action-group">
      <button 
        className="btn btn-success"
        onClick={() => onCurate(document.id, 'approve')}
      >
        <CheckIcon /> Aprobar
      </button>
      <button 
        className="btn btn-danger"
        onClick={() => onCurate(document.id, 'reject')}
      >
        <XIcon /> Rechazar
      </button>
    </div>
  </div>
</DocumentCard>
```

#### Estados
- **Normal**: Sin hover, sombra ligera
- **Hover**: Elevación aumentada con `var(--shadow-md)`, `translateY(-2px)`
- **Selected**: Border `var(--color-primary-500)`, fondo `var(--color-primary-50)`
- **Loading**: Skeleton shimmer durante operaciones de curación

#### Animaciones
- **Hover**: Transform + box-shadow transición 200ms `ease-out`
- **Selection**: Border-color transición 150ms `ease-out`

---

### CurationDashboard
**Archivo**: `components/curation/CurationDashboard.tsx`

#### Diseño Visual
- **Layout**: Header + Filtros + Grid de tarjetas
- **Padding**: `var(--space-6)`
- **Gap**: `var(--space-4)` entre elementos

#### Estructura
```tsx
<CurationDashboard>
  <div className="dashboard-header">
    <h1>Documentos por Revisar</h1>
    <div className="header-actions">
      <BatchActions selectedCount={selectedCount} />
      <RefreshButton onClick={onRefresh} />
    </div>
  </div>
  
  <div className="filters-bar">
    <FilterGroup 
      title="Estado"
      options={statusOptions}
      selected={filters.status}
      onChange={handleStatusFilter}
    />
    <FilterGroup 
      title="Fuente"
      options={sourceOptions}
      selected={filters.source}
      onChange={handleSourceFilter}
    />
    <FilterGroup 
      title="Área Legal"
      options={legalAreaOptions}
      selected={filters.legal_area}
      onChange={handleLegalAreaFilter}
    />
    <SortSelector 
      value={sortBy}
      onChange={setSortBy}
      options={sortOptions}
    />
  </div>
  
  <div className="documents-grid">
    {documents.map(doc => (
      <DocumentCard 
        key={doc.id}
        document={doc}
        selected={selectedIds.includes(doc.id)}
        onSelect={handleSelect}
        onCurate={handleCurate}
        onPreview={handlePreview}
      />
    ))}
  </div>
  
  <Pagination 
    currentPage={page}
    totalPages={totalPages}
    onPageChange={setPage}
  />
</CurationDashboard>
```

#### Estados
- **Loading**: Skeleton grid de 12 tarjetas
- **Empty**: Estado vacío con ilustración y CTA
- **Error**: Mensaje de error con opción de reintentar

---

## Componentes del Editor

### EditorWorkspace
**Archivo**: `components/editorial/EditorWorkspace.tsx`

#### Diseño Visual
- **Layout**: Vista dividida 50/50 (ajustable)
- **Separador**: Handle arrastrable de 4px `var(--color-border)`
- **Min-width**: 300px por panel

#### Estructura
```tsx
<EditorWorkspace>
  <div className="editor-header">
    <ArticleTabs />
    <WorkflowStatus />
  </div>
  
  <ResizablePanel>
    <div className="left-panel">
      <DocumentViewer 
        document={sourceDocument}
        syncScroll={syncScroll}
        onPageChange={handlePageChange}
      />
    </div>
    
    <div className="resize-handle" />
    
    <div className="right-panel">
      <EditorTabs activeTab={activeTab}>
        <TabPanel id="content" title="Contenido">
          <ArticleEditor 
            content={article.content}
            onChange={handleContentChange}
            aiSuggestions={aiSuggestions}
          />
        </TabPanel>
        <TabPanel id="metadata" title="Metadatos">
          <MetadataEditor 
            article={article}
            onChange={handleMetadataChange}
          />
        </TabPanel>
        <TabPanel id="media" title="Multimedia">
          <MediaSelector 
            selectedImages={article.images}
            onImagesChange={handleImagesChange}
          />
        </TabPanel>
      </EditorTabs>
    </div>
  </ResizablePanel>
  
  <div className="editor-footer">
    <AutoSaveIndicator />
    <WordCount count={wordCount} />
    <div className="action-buttons">
      <button className="btn btn-outline">Guardar Borrador</button>
      <button className="btn btn-primary">Enviar a Revisión</button>
    </div>
  </div>
</EditorWorkspace>
```

#### Características
- **Auto-save**: Cada 30 segundos con indicador visual
- **Sync Scroll**: Scroll sincronizado opcional entre paneles
- **Resize**: Panel redimensionable con persistencia de tamaño

---

### ArticleEditor
**Archivo**: `components/editorial/ArticleEditor.tsx`

#### Diseño Visual
- **Editor**: Rich text editor con toolbar flotante
- **Min-height**: 500px
- **Padding**: `var(--space-4)`
- **Font**: `var(--font-primary)`, `var(--text-base)`

#### Estructura
```tsx
<ArticleEditor>
  <div className="editor-toolbar">
    <ToolbarGroup title="Formato">
      <ToolbarButton action="bold" icon={BoldIcon} />
      <ToolbarButton action="italic" icon={ItalicIcon} />
      <ToolbarButton action="underline" icon={UnderlineIcon} />
    </ToolbarGroup>
    
    <ToolbarGroup title="Estructura">
      <ToolbarButton action="heading1" text="H1" />
      <ToolbarButton action="heading2" text="H2" />
      <ToolbarButton action="heading3" text="H3" />
    </ToolbarGroup>
    
    <ToolbarGroup title="IA">
      <AIAssistantButton onClick={openAIPanel} />
      <RegenerateButton onRegenerate={handleRegenerate} />
    </ToolbarGroup>
  </div>
  
  <div className="editor-content" contentEditable>
    {/* Rich text content */}
  </div>
  
  <AISuggestionsPanel 
    suggestions={aiSuggestions}
    onAccept={acceptSuggestion}
    onReject={rejectSuggestion}
  />
</ArticleEditor>
```

#### Estados IA
- **AI Generating**: Overlay con spinner y "Generando contenido..."
- **AI Suggestions**: Panel lateral con sugerencias de IA
- **AI Confidence**: Indicadores de confianza en texto generado

---

## Componentes de Multimedia

### ImageGeneratorUI
**Archivo**: `components/multimedia/ImageGeneratorUI.tsx`

#### Diseño Visual
- **Layout**: Panel con configuración + galería de resultados
- **Fondo**: `var(--color-surface)`
- **Padding**: `var(--space-6)`

#### Estructura
```tsx
<ImageGeneratorUI>
  <div className="generator-config">
    <div className="prompt-section">
      <label className="form-label">Descripción de la imagen</label>
      <textarea 
        className="form-textarea"
        placeholder="Describe la imagen que necesitas para tu artículo..."
        value={prompt}
        onChange={setPrompt}
      />
    </div>
    
    <div className="style-section">
      <label className="form-label">Estilo</label>
      <StyleSelector 
        options={['professional', 'academic', 'modern']}
        selected={style}
        onChange={setStyle}
      />
    </div>
    
    <div className="specs-section">
      <AspectRatioSelector ratio={aspectRatio} onChange={setAspectRatio} />
      <QualitySelector quality={quality} onChange={setQuality} />
    </div>
    
    <button 
      className="btn btn-primary"
      onClick={generateImages}
      disabled={generating}
    >
      {generating ? <Spinner /> : <WandIcon />}
      Generar Imágenes
    </button>
  </div>
  
  <div className="generated-images">
    <h3>Opciones Generadas</h3>
    <div className="images-grid">
      {generatedImages.map(image => (
        <ImageOption
          key={image.id}
          image={image}
          selected={selectedImage?.id === image.id}
          onSelect={setSelectedImage}
          onEdit={() => openImageEditor(image)}
        />
      ))}
    </div>
  </div>
  
  {selectedImage && (
    <ImagePreview 
      image={selectedImage}
      onUse={handleUseImage}
      onRegenerate={regenerateImage}
    />
  )}
</ImageGeneratorUI>
```

#### Estados de Generación
- **Idle**: Formulario listo para generar
- **Generating**: Progress bar con tiempo estimado
- **Complete**: Grid de resultados disponible
- **Error**: Mensaje de error con opción de reintentar

---

## Componentes de UI Reutilizables

### ModernButton
**Archivo**: `components/ui/ModernButton.tsx`

#### Variantes
```tsx
interface ModernButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

#### Estilos por Variante
```css
/* Primary - Acción principal */
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  border: 1px solid var(--color-primary-500);
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary - Acción secundaria */
.btn-secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

/* Outline - Alternativa ligera */
.btn-outline {
  background: transparent;
  color: var(--color-primary-600);
  border: 1px solid var(--color-primary-300);
}

/* Success - Confirmación positiva */
.btn-success {
  background: var(--color-success);
  color: white;
  border: 1px solid var(--color-success);
}

/* Danger - Acción destructiva */
.btn-danger {
  background: var(--color-error);
  color: white;
  border: 1px solid var(--color-error);
}
```

---

### StatusIndicator
**Archivo**: `components/ui/StatusIndicator.tsx`

#### Diseño Visual
- **Tamaño**: 8px círculo + texto opcional
- **Posicionamiento**: Inline con contenido

#### Variantes de Estado
```tsx
const statusConfig = {
  pending: {
    color: 'var(--color-warning)',
    label: 'Pendiente',
    icon: ClockIcon
  },
  approved: {
    color: 'var(--color-success)',
    label: 'Aprobado',
    icon: CheckIcon
  },
  rejected: {
    color: 'var(--color-error)',
    label: 'Rechazado',
    icon: XIcon
  },
  processing: {
    color: 'var(--color-info)',
    label: 'Procesando',
    icon: LoaderIcon,
    animated: true
  }
};
```

---

### LoadingStates
**Archivo**: `components/ui/LoadingStates.tsx`

#### Skeleton Components
```tsx
// Para tarjetas de documento
<SkeletonCard>
  <div className="skeleton-header">
    <SkeletonLine width="60%" />
    <SkeletonCircle size="24px" />
  </div>
  <SkeletonLine width="100%" />
  <SkeletonLine width="80%" />
  <SkeletonLine width="90%" />
  <div className="skeleton-footer">
    <SkeletonButton />
    <SkeletonButton />
  </div>
</SkeletonCard>

// Para listas
<SkeletonList items={5}>
  <SkeletonListItem>
    <SkeletonLine width="70%" />
    <SkeletonLine width="40%" />
  </SkeletonListItem>
</SkeletonList>
```

#### Configuración del Shimmer
```css
.skeleton {
  background: linear-gradient(90deg, 
    var(--color-gray-200) 25%, 
    var(--color-gray-100) 50%, 
    var(--color-gray-200) 75%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

---

### ToastNotifications
**Archivo**: `components/ui/ToastNotifications.tsx`

#### Diseño Visual
- **Posición**: Fixed top-right con z-index alto
- **Ancho**: 400px max
- **Animación**: Slide-in desde la derecha

#### Tipos de Toast
```tsx
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // 5000ms por defecto
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

#### Estados Visuales
```css
.toast-success {
  background: var(--color-success-light);
  border-left: 4px solid var(--color-success);
}

.toast-error {
  background: var(--color-error-light);
  border-left: 4px solid var(--color-error);
}

.toast-warning {
  background: var(--color-warning-light);
  border-left: 4px solid var(--color-warning);
}

.toast-info {
  background: var(--color-info-light);
  border-left: 4px solid var(--color-info);
}
```

## Patrones de Implementación

### Gestión de Estado
Usar React Query para datos de servidor y Zustand para estado de aplicación:

```tsx
// Hook para documentos
const useDocuments = (filters: DocumentFilters) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentService.getDocuments(filters),
    staleTime: 30000, // 30 segundos
  });
};

// Store para estado del editor
const useEditorStore = create((set) => ({
  activeArticleId: null,
  autoSaveEnabled: true,
  splitRatio: 0.5,
  setActiveArticle: (id: string) => set({ activeArticleId: id }),
}));
```

### Error Boundaries
Implementar error boundaries para componentes críticos:

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <EditorWorkspace />
</ErrorBoundary>
```

### Lazy Loading
Cargar componentes pesados de forma diferida:

```tsx
const ImageGeneratorUI = lazy(() => import('./ImageGeneratorUI'));
const DocumentPreview = lazy(() => import('./DocumentPreview'));
```

Estos componentes forman el núcleo del sistema de diseño, proporcionando una base sólida y consistente para toda la aplicación del Sistema Editorial Jurídico Supervisado.