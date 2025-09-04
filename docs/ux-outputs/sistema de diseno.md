# Sistema de Diseño - Editorial Jurídico Supervisado

## Principios de Diseño

### 1. Profesionalismo Jurídico
Transmitir confianza, autoridad y precisión a través del diseño visual. El sistema debe reflejar los más altos estándares del sector legal.

### 2. Claridad Funcional
Cada elemento de la interfaz debe tener un propósito claro. Los flujos de trabajo complejos se simplifican mediante jerarquía visual inteligente.

### 3. Eficiencia Editorial
Optimizar para productividad y velocidad en tareas editoriales repetitivas, minimizando clics y maximizando información contextual.

### 4. Supervisión Inteligente
La IA asiste, pero el control final siempre permanece con el abogado revisor. El diseño debe reforzar esta relación de supervisión.

## Paleta de Colores

### Colores Primarios
```css
:root {
  /* Azul Corporativo - Color principal de marca */
  --color-primary: #1e89a7;
  --color-primary-50: #f0f9fc;
  --color-primary-100: #ddf0f7;
  --color-primary-200: #bce1ee;
  --color-primary-300: #8fcae1;
  --color-primary-400: #5babce;
  --color-primary-500: #1e89a7;
  --color-primary-600: #1a758f;
  --color-primary-700: #175f74;
  --color-primary-800: #17505f;
  --color-primary-900: #184350;

  /* Acento Cian - Para elementos interactivos */
  --color-accent: #06b6d4;
  --color-accent-50: #ecfeff;
  --color-accent-100: #cffafe;
  --color-accent-200: #a5f3fc;
  --color-accent-300: #67e8f9;
  --color-accent-400: #22d3ee;
  --color-accent-500: #06b6d4;
  --color-accent-600: #0891b2;
  --color-accent-700: #0e7490;
  --color-accent-800: #155e75;
  --color-accent-900: #164e63;
}
```

### Colores Semánticos
```css
:root {
  /* Estados del Sistema */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;

  /* Estados de Documentos */
  --color-pending: #f59e0b;
  --color-approved: #10b981;
  --color-rejected: #ef4444;
  --color-processing: #3b82f6;
  --color-published: #059669;
  --color-draft: #6b7280;
}
```

### Colores Neutros
```css
:root {
  /* Escala de Grises */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;

  /* Colores de Superficie */
  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #64748b;
}
```

### Modo Oscuro
```css
[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-surface-tertiary: #334155;
  --color-border: #475569;
  --color-border-strong: #64748b;
  --color-text: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;

  /* Sombras adaptadas para modo oscuro */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
}
```

## Tipografía

### Fuente Principal: Inter
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
}
```

### Escala Tipográfica
```css
:root {
  /* Títulos */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */

  /* Pesos de Fuente */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Alturas de Línea */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### Clases Utilitarias de Texto
```css
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text);
}

.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text);
}

.body-base {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text);
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
```

## Sistema de Espaciado

### Cuadrícula de 4 Puntos
```css
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1-5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2-5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3-5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-32: 8rem;       /* 128px */
}
```

## Sistema de Sombras y Elevación

### Sombras Modernas
```css
:root {
  /* Sombras suaves para modo claro */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  
  /* Sombras de enfoque */
  --shadow-focus: 0 0 0 3px rgb(30 137 167 / 0.1);
  --shadow-focus-error: 0 0 0 3px rgb(239 68 68 / 0.1);
  
  /* Sombra interna */
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

### Niveles de Elevación
```css
.elevation-0 { box-shadow: none; }
.elevation-1 { box-shadow: var(--shadow-sm); }
.elevation-2 { box-shadow: var(--shadow-md); }
.elevation-3 { box-shadow: var(--shadow-lg); }
.elevation-4 { box-shadow: var(--shadow-xl); }
.elevation-5 { box-shadow: var(--shadow-2xl); }
```

## Sistema de Bordes y Radios

### Radios de Borde
```css
:root {
  --radius-none: 0px;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

## Animaciones y Transiciones

### Funciones de Tiempo
```css
:root {
  /* Easing personalizado para la marca */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Duraciones estándar */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
}
```

### Animaciones Clave
```css
/* Entrada suave de elementos */
@keyframes slide-up-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulso para estado de guardado */
@keyframes saving-pulse {
  0%, 100% { 
    opacity: 0.7; 
  }
  50% { 
    opacity: 1; 
  }
}

/* Shimmer para elementos de carga */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* Rotación para spinners */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

## Breakpoints Responsivos

### Sistema de Breakpoints
```css
:root {
  --breakpoint-sm: 640px;   /* Móviles grandes */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Escritorios */
  --breakpoint-2xl: 1536px; /* Pantallas grandes */
}

/* Media queries como mixins */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Iconografía

### Biblioteca de Iconos
Usar **Lucide Icons** como biblioteca principal por su estilo limpio y profesional.

```css
.icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: middle;
  color: currentColor;
  flex-shrink: 0;
}

.icon-xs { width: 0.75rem; height: 0.75rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-base { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
.icon-xl { width: 2rem; height: 2rem; }
```

### Iconos por Contexto
- **Documentos**: FileText, File, Download, Eye, Edit3
- **Estados**: Check, X, Clock, AlertTriangle, Info
- **Navegación**: ChevronLeft, ChevronRight, Menu, Search, Filter
- **Acciones**: Plus, Trash2, Save, Share, Settings
- **IA**: Zap, Cpu, Wand2, Sparkles, Bot

## Estados de Componentes

### Estados Base
```css
/* Estado por defecto */
.component {
  transition: all var(--duration-200) var(--ease-out);
}

/* Estado hover */
.component:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Estado focus */
.component:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* Estado active */
.component:active {
  transform: translateY(0);
}

/* Estado disabled */
.component:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Estados de Carga
```css
.loading-skeleton {
  background: linear-gradient(90deg, 
    var(--color-gray-200) 25%, 
    var(--color-gray-100) 50%, 
    var(--color-gray-200) 75%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  color: var(--color-primary-500);
}

.saving-indicator {
  animation: saving-pulse 1.2s ease-in-out infinite;
  color: var(--color-warning);
}
```

## Componentes de Layout

### Grid System
```css
.container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}
```

## Accesibilidad

### Consideraciones Clave
- **Contraste**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande
- **Focus**: Estados de foco claramente visibles
- **Keyboard**: Navegación completa por teclado
- **Screen Readers**: Etiquetas ARIA apropiadas
- **Motion**: Respeto a `prefers-reduced-motion`

### Utilidades de Accesibilidad
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Respetar preferencias de movimiento reducido */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Patrones de Feedback Visual

### Indicadores de Estado
```css
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.status-pending { background-color: var(--color-pending); }
.status-approved { background-color: var(--color-approved); }
.status-rejected { background-color: var(--color-rejected); }
.status-processing { background-color: var(--color-processing); }
.status-published { background-color: var(--color-published); }
.status-draft { background-color: var(--color-draft); }
```

### Progress Bars
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary-500);
  transition: width var(--duration-300) var(--ease-out);
}
```

Este sistema de diseño proporciona la base completa para todos los componentes del Sistema Editorial Jurídico Supervisado, manteniendo consistencia visual y funcional en toda la aplicación.