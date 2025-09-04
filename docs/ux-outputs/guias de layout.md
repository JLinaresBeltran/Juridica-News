# Guías de Layout - Sistema Editorial Jurídico Supervisado

## Arquitectura de Layout Principal

### Estructura de Aplicación de Escritorio

```
┌─────────────────────────────────────────────────────────────┐
│                        Header (64px)                        │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│   Sidebar   │              Main Content                     │
│  (256px)    │              (Flex-fill)                     │
│             │                                               │
│   • Curación │  ┌─────────────────────────────────────────┐  │
│   • Editorial│  │         Dashboard View                  │  │
│   • Público │  │         OR                              │  │
│             │  │         Editor Workspace               │  │
│             │  └─────────────────────────────────────────┘  │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### Dimensiones y Comportamiento

#### Header Global
- **Altura**: 64px (fijo)
- **Posición**: Sticky top
- **Z-index**: 50
- **Contenido**: Logo + Navigation Toggle + Search + Status + User Menu
- **Responsive**: 
  - Desktop: Todos los elementos visibles
  - Tablet: Search oculto
  - Mobile: Solo logo, toggle y user menu

#### Sidebar de Navegación
- **Ancho Expandido**: 256px
- **Ancho Colapsado**: 64px
- **Altura**: 100vh menos header (64px)
- **Posición**: Fixed en desktop, drawer en mobile
- **Colapsable**: Sí, con animación de 300ms
- **Contenido**: Navegación por secciones con contadores
- **Scroll**: Independiente del contenido principal

#### Área de Contenido Principal
- **Ancho**: Flexible (100% - sidebar width)
- **Altura**: 100vh menos header
- **Overflow**: Scroll vertical independiente
- **Contextos**: Dashboard views o Editor workspace

## Layout del Dashboard de Curación

### Estructura Jerárquica
```css
.dashboard {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-bar {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}
```

### Grid Responsivo de Documentos

#### Desktop (>1280px)
- **Columnas**: 3 columnas de tarjetas
- **Min-width por tarjeta**: 400px
- **Gap**: 16px entre tarjetas
- **Padding lateral**: 24px

#### Laptop (1024px - 1280px) 
- **Columnas**: 2 columnas de tarjetas
- **Min-width por tarjeta**: 380px
- **Gap**: 16px entre tarjetas
- **Padding lateral**: 20px

#### Tablet (768px - 1024px)
- **Columnas**: 1-2 columnas según espacio
- **Min-width por tarjeta**: 300px
- **Gap**: 16px entre tarjetas
- **Padding lateral**: 16px

#### Mobile (<768px)
- **Columnas**: 1 columna
- **Width por tarjeta**: 100%
- **Gap**: 12px entre tarjetas
- **Padding lateral**: 12px

## Layout del Editor Workspace

### Estructura de Doble Panel

```css
.editor-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-header {
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
}

.left-panel {
  flex: 1; /* 50% inicial */
  min-width: 300px;
  max-width: 70%;
}

.right-panel {
  flex: 1; /* 50% inicial */
  min-width: 400px;
  max-width: 70%;
}

.resize-handle {
  width: 4px;
  background: var(--color-border);
  cursor: col-resize;
  user-select: none;
}
```

### Redimensionamiento de Paneles

#### Restricciones de Tamaño
- **Panel mínimo**: 300px (documento) / 400px (editor)
- **Panel máximo**: 70% del ancho total
- **Handle de resize**: 4px de ancho, hover aumenta a 6px
- **Persistencia**: Ratio guardado en localStorage

#### Estados del Editor
```css
/* Estado normal - 50/50 */
.left-panel { flex: 1; }
.right-panel { flex: 1; }

/* Enfoque en documento - 60/40 */
.document-focused .left-panel { flex: 1.5; }
.document-focused .right-panel { flex: 1; }

/* Enfoque en editor - 40/60 */
.editor-focused .left-panel { flex: 1; }
.editor-focused .right-panel { flex: 1.5; }
```

## Layout de Componentes Individuales

### DocumentCard Layout

```css
.document-card {
  display: flex;
  flex-direction: column;
  min-height: 280px;
  max-height: 400px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
```

#### Distribución Interna
- **Header**: 20% del espacio
- **Content**: 60% del espacio (flexible)
- **Actions**: 20% del espacio (fijo al fondo)

### Progress Bar Layout (Editor)

```css
.progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-step::after {
  content: '';
  position: absolute;
  left: 100%;
  width: 8px;
  height: 2px;
  background: var(--color-gray-300);
}

.progress-step:last-child::after {
  display: none;
}
```

## Patrones de Layout Responsivo

### Breakpoints del Sistema

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;   /* Móviles grandes */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Escritorios */
  --breakpoint-2xl: 1536px; /* Pantallas grandes */
}
```

### Estrategias de Adaptación

#### Mobile (<768px)
```css
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 64px;
    width: 100%;
    height: calc(100vh - 64px);
    background: var(--color-surface);
    transform: translateX(-100%);
    transition: transform 300ms ease-out;
    z-index: 40;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    width: 100%;
  }
  
  .editor-body {
    flex-direction: column;
  }
  
  .resize-handle {
    display: none;
  }
}
```

#### Tablet (768px - 1024px)
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 64px; /* Colapsado por defecto */
  }
  
  .documents-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
  
  .editor-body .left-panel {
    min-width: 250px;
  }
  
  .editor-body .right-panel {
    min-width: 300px;
  }
}
```

#### Desktop (>1024px)
```css
@media (min-width: 1024px) {
  .sidebar {
    position: static;
    transform: none;
  }
  
  .documents-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
  
  .editor-body {
    flex-direction: row;
  }
}
```

## Layout del Portal Público

### Estructura de Página Pública

```css
.public-layout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.public-header {
  grid-area: header;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
}

.public-sidebar {
  grid-area: sidebar;
  padding: 24px;
  border-right: 1px solid var(--color-border);
}

.public-main {
  grid-area: main;
  padding: 32px;
}

.public-footer {
  grid-area: footer;
  padding: 24px 32px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-secondary);
}
```

### Responsive del Portal Público

```css
@media (max-width: 1024px) {
  .public-layout {
    grid-template-areas: 
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
  
  .public-sidebar {
    display: none; /* Se convierte en drawer o menú colapsable */
  }
}
```

## Sistemas de Espaciado y Alineación

### Container System

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
.container-2xl { max-width: 1536px; }

@media (min-width: 640px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 32px; }
}
```

### Grid Helper Classes

```css
.grid {
  display: grid;
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

.col-span-1 { grid-column: span 1 / span 1; }
.col-span-2 { grid-column: span 2 / span 2; }
.col-span-3 { grid-column: span 3 / span 3; }
.col-span-4 { grid-column: span 4 / span 4; }
.col-span-6 { grid-column: span 6 / span 6; }
.col-span-12 { grid-column: span 12 / span 12; }

.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.gap-8 { gap: 32px; }
```

### Flexbox Helper Classes

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
.flex-shrink-0 { flex-shrink: 0; }
```

## Patrones de Layout Complejos

### Sticky Elements

```css
/* Header siempre visible */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Sidebar fijo en desktop */
@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 64px; /* altura del header */
    height: calc(100vh - 64px);
  }
}

/* Progress bar pegado arriba en editor */
.progress-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
```

### Z-Index Hierarchy

```css
:root {
  --z-behind: -1;
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
  --z-maximum: 9999;
}
```

### Layout para Estados Especiales

#### Empty States
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 48px;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  color: var(--color-gray-400);
}
```

#### Loading States
```css
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}
```

## Consideraciones de Implementación

### Performance Layout
- **will-change**: Aplicar solo durante animaciones
- **contain**: Usar layout containment para componentes independientes
- **content-visibility**: Para elementos fuera del viewport

### Accesibilidad Layout
- **Skip Links**: Para navegación por teclado
- **Landmark Roles**: Definir regiones principales
- **Focus Management**: Orden lógico de tabulación

### Testing Responsivo
- **Breakpoints críticos**: 320px, 768px, 1024px, 1280px
- **Orientación**: Portrait y landscape en tablets
- **Zoom**: Hasta 200% sin pérdida de funcionalidad

Este sistema de layout proporciona una base sólida y flexible para todas las interfaces del Sistema Editorial Jurídico Supervisado, garantizando una experiencia consistente en todos los dispositivos y contextos de uso.