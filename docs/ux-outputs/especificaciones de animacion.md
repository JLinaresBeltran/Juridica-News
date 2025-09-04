# Especificaciones de Animación - Sistema Editorial Jurídico Supervisado

## Principios de Animación

### 1. Propósito Funcional
Toda animación debe cumplir un propósito específico: proporcionar feedback, guiar la atención, o comunicar cambios de estado.

### 2. Profesionalismo Sutil
Las animaciones deben ser refinadas y no distraer del trabajo legal crítico. Movimientos suaves y predecibles.

### 3. Performance First
Priorizar rendimiento sobre efectos visuales complejos. Usar transformaciones CSS3 y evitar propiedades que requieran repaint.

### 4. Accesibilidad
Respetar `prefers-reduced-motion` y proporcionar alternativas estáticas cuando sea necesario.

## Sistema de Timing y Easing

### Duraciones Estándar
```css
:root {
  /* Micro-interacciones (hover, focus) */
  --duration-instant: 75ms;
  --duration-fast: 150ms;
  --duration-quick: 200ms;
  
  /* Transiciones de componentes */
  --duration-medium: 300ms;
  --duration-slow: 500ms;
  
  /* Transiciones de layout */
  --duration-deliberate: 700ms;
  --duration-patient: 1000ms;
}
```

### Curvas de Easing Personalizadas
```css
:root {
  /* Easing profesional para la marca */
  --ease-editorial: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-anticipate: cubic-bezier(0.1, -0.6, 0.2, 0);
  --ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Easing estándar */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Animaciones de Navegación y Layout

### Transición de Sidebar

```css
.sidebar {
  width: 256px;
  transition: width var(--duration-medium) var(--ease-editorial);
  will-change: width;
}

.sidebar.collapsed {
  width: 64px;
}

/* Animación de contenido del sidebar */
.sidebar .nav-text,
.sidebar .nav-count,
.sidebar .sidebar-title {
  opacity: 1;
  transform: translateX(0);
  transition: 
    opacity var(--duration-fast) var(--ease-out) 100ms,
    transform var(--duration-fast) var(--ease-out) 100ms;
}

.sidebar.collapsed .nav-text,
.sidebar.collapsed .nav-count,
.sidebar.collapsed .sidebar-title {
  opacity: 0;
  transform: translateX(-8px);
  transition: 
    opacity var(--duration-fast) var(--ease-in),
    transform var(--duration-fast) var(--ease-in);
}
```

### Transición entre Vistas

```css
/* Fade cross entre vistas */
@keyframes view-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes view-fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

.view-transition-enter {
  animation: view-fade-in var(--duration-medium) var(--ease-out);
}

.view-transition-exit {
  animation: view-fade-out var(--duration-quick) var(--ease-in);
}
```

### Transición del Editor Workspace

```css
/* Entrada del editor desde curación */
@keyframes editor-slide-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.editor-workspace {
  animation: editor-slide-in var(--duration-medium) var(--ease-editorial);
}

/* Animación del resize handle */
.resize-handle {
  width: 4px;
  background: var(--color-border);
  transition: 
    width var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.resize-handle:hover {
  width: 6px;
  background: var(--color-primary-400);
}

.resize-handle:active {
  background: var(--color-primary-500);
}
```

## Animaciones de Componentes

### Hover y Estados Interactivos

```css
/* Document Card Hover */
.document-card {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
  transition: 
    transform var(--duration-quick) var(--ease-out),
    box-shadow var(--duration-quick) var(--ease-out);
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.document-card:active {
  transform: translateY(-1px);
  transition-duration: var(--duration-fast);
}

/* Button Interactions */
.btn {
  transform: scale(1);
  transition: 
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
  transition-duration: var(--duration-instant);
}
```

### Animaciones de Entrada de Lista

```css
/* Stagger animation para documento cards */
@keyframes slide-up-fade-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.document-card {
  animation: slide-up-fade-in var(--duration-medium) var(--ease-out);
}

/* Stagger delay usando CSS custom properties */
.document-card:nth-child(1) { animation-delay: 0ms; }
.document-card:nth-child(2) { animation-delay: 50ms; }
.document-card:nth-child(3) { animation-delay: 100ms; }
.document-card:nth-child(4) { animation-delay: 150ms; }
.document-card:nth-child(5) { animation-delay: 200ms; }
.document-card:nth-child(6) { animation-delay: 250ms; }

/* Para mayor cantidad, usar JavaScript para calcular delay */
.staggered-item {
  animation: slide-up-fade-in var(--duration-medium) var(--ease-out);
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
  animation-fill-mode: backwards;
}
```

### Progress Bar del Editor

```css
.progress-step {
  transform: scale(1);
  transition: 
    transform var(--duration-quick) var(--ease-out),
    background-color var(--duration-quick) var(--ease-out),
    border-color var(--duration-quick) var(--ease-out);
}

.progress-step.completed {
  animation: step-complete var(--duration-medium) var(--ease-overshoot);
}

@keyframes step-complete {
  0% {
    transform: scale(1);
    background-color: var(--color-gray-300);
  }
  50% {
    transform: scale(1.1);
    background-color: var(--color-success);
  }
  100% {
    transform: scale(1);
    background-color: var(--color-success);
  }
}

.progress-step.current {
  animation: step-pulse 2s ease-in-out infinite;
}

@keyframes step-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(30, 137, 167, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(30, 137, 167, 0);
  }
}
```

## Animaciones de Estado y Feedback

### Estados de Guardado

```css
/* Auto-save indicator pulse */
@keyframes saving-pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.status-dot.saving {
  animation: saving-pulse 1.2s ease-in-out infinite;
}

/* Success confirmation */
@keyframes save-success {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.status-dot.success {
  animation: save-success var(--duration-medium) var(--ease-out);
}
```

### Loading States y Skeletons

```css
/* Shimmer loading effect */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, 
    var(--color-gray-200) 25%, 
    var(--color-gray-100) 50%, 
    var(--color-gray-200) 75%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite linear;
}

/* Loading spinner */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* Pulse loading for buttons */
@keyframes button-loading {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.btn.loading {
  animation: button-loading 1s ease-in-out infinite;
  pointer-events: none;
}
```

### Confidence Bar Animation

```css
.confidence-fill {
  width: 0%;
  background: var(--color-success);
  transition: width var(--duration-slow) var(--ease-out);
  animation: confidence-reveal var(--duration-slow) var(--ease-out);
}

@keyframes confidence-reveal {
  0% {
    width: 0%;
    background: var(--color-gray-300);
  }
  70% {
    background: var(--color-warning);
  }
  100% {
    background: var(--color-success);
  }
}
```

## Animaciones de Notificaciones y Feedback

### Toast Notifications

```css
/* Toast slide-in animation */
@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-slide-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast-notification {
  animation: toast-slide-in var(--duration-medium) var(--ease-out);
}

.toast-notification.exiting {
  animation: toast-slide-out var(--duration-quick) var(--ease-in);
}

/* Stack de toasts */
.toast-notification:not(:last-child) {
  transform: translateY(0) scale(1);
  transition: 
    transform var(--duration-quick) var(--ease-out),
    opacity var(--duration-quick) var(--ease-out);
}

.toast-notification.stacked {
  transform: translateY(-4px) scale(0.98);
  opacity: 0.9;
}
```

### Modal y Overlays

```css
/* Modal backdrop fade */
@keyframes backdrop-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backdrop-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.modal-backdrop {
  animation: backdrop-fade-in var(--duration-quick) var(--ease-out);
}

.modal-backdrop.exiting {
  animation: backdrop-fade-out var(--duration-quick) var(--ease-in);
}

/* Modal content scale */
@keyframes modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content {
  animation: modal-scale-in var(--duration-medium) var(--ease-overshoot);
}
```

## Animaciones Específicas de IA

### Generación de Contenido

```css
/* AI typing effect simulation */
@keyframes ai-typing {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.ai-generating::after {
  content: '|';
  animation: ai-typing 1s ease-in-out infinite;
  color: var(--color-primary);
}

/* AI wand icon animation */
@keyframes wand-sparkle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.ai-wand-icon {
  animation: wand-sparkle 2s ease-in-out infinite;
}

/* AI suggestion highlight */
@keyframes ai-suggestion-highlight {
  0% {
    background: transparent;
  }
  50% {
    background: rgba(30, 137, 167, 0.1);
  }
  100% {
    background: transparent;
  }
}

.ai-suggestion {
  animation: ai-suggestion-highlight 1.5s ease-in-out 3;
}
```

### Progress de Generación de Imágenes

```css
/* Image generation preview */
@keyframes image-generating {
  0% {
    opacity: 0.3;
    filter: blur(4px);
  }
  50% {
    opacity: 0.6;
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
  }
}

.image-generating {
  animation: image-generating 3s ease-in-out infinite;
}

/* Image selection highlight */
@keyframes image-selection {
  0% {
    border-color: transparent;
    transform: scale(1);
  }
  50% {
    border-color: var(--color-primary);
    transform: scale(1.02);
  }
  100% {
    border-color: var(--color-primary);
    transform: scale(1);
  }
}

.image-option.selected {
  animation: image-selection var(--duration-medium) var(--ease-out);
}
```

## Micro-interacciones Avanzadas

### Form Focus y Validation

```css
/* Input focus ring animation */
.form-input {
  box-shadow: 0 0 0 0 transparent;
  transition: 
    border-color var(--duration-quick) var(--ease-out),
    box-shadow var(--duration-quick) var(--ease-out);
}

.form-input:focus {
  box-shadow: 0 0 0 3px rgba(30, 137, 167, 0.1);
}

/* Error state animation */
@keyframes error-shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

.form-input.error {
  animation: error-shake var(--duration-medium) var(--ease-out);
  border-color: var(--color-error);
}

/* Success validation */
@keyframes success-checkmark {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.form-input.success::after {
  content: '✓';
  animation: success-checkmark var(--duration-quick) var(--ease-overshoot);
}
```

### Search Box Interacciones

```css
.search-box {
  width: 100%;
  transition: 
    width var(--duration-medium) var(--ease-out),
    box-shadow var(--duration-quick) var(--ease-out);
}

.search-box:focus {
  box-shadow: 
    0 0 0 3px rgba(30, 137, 167, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Search suggestions slide down */
@keyframes suggestions-slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-suggestions {
  animation: suggestions-slide-down var(--duration-quick) var(--ease-out);
}
```

## Optimización de Performance

### Will-Change Management

```css
/* Solo aplicar durante animaciones */
.animating {
  will-change: transform, opacity;
}

.animating.animation-complete {
  will-change: auto;
}

/* Para elementos que se animan frecuentemente */
.frequent-animation {
  will-change: transform;
}

/* GPU acceleration para componentes críticos */
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Throttled Animations

```css
/* Reducir animaciones en dispositivos lentos */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Mantener transiciones críticas para UX */
  .critical-transition {
    transition-duration: var(--duration-quick) !important;
  }
}

/* Media query para detectar dispositivos de bajo rendimiento */
@media (update: slow) {
  .performance-sensitive-animation {
    animation: none;
  }
  
  .hover-effect {
    transition: none;
  }
}
```

## JavaScript Integration Patterns

### Intersection Observer para Performance

```javascript
// Animar elementos cuando entran al viewport
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observar elementos que necesitan animación de entrada
document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

### State-based Animation Classes

```javascript
// Sistema de clases para gestión de estados animados
const AnimationStates = {
  ENTERING: 'animation-entering',
  ACTIVE: 'animation-active',
  EXITING: 'animation-exiting',
  COMPLETE: 'animation-complete'
};

class AnimationManager {
  static async transitionElement(element, fromState, toState) {
    element.classList.remove(fromState);
    element.classList.add(toState);
    
    return new Promise(resolve => {
      const handleTransitionEnd = () => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        element.classList.add(AnimationStates.COMPLETE);
        resolve();
      };
      element.addEventListener('transitionend', handleTransitionEnd);
    });
  }
}
```

## Timing Charts y Referencias

### Animation Timeline para Workflow Típico

```
Document Card Hover:
0ms    : hover start
0-200ms: transform translateY + box-shadow
200ms  : hover complete

View Transition:
0ms    : trigger navigation
0-100ms: current view fade out
100ms  : view switch
100-400ms: new view fade in
400ms  : transition complete

Auto-save Sequence:
0ms    : content change detected
0-30s  : wait period
30000ms: start save animation (pulse)
31500ms: save complete animation
32000ms: return to normal state
```

### Performance Budgets

- **Total animation time per interaction**: <500ms
- **Concurrent animations**: Max 3 elementos
- **FPS target**: 60fps mínimo, 120fps ideal
- **Memory usage**: <5MB para todas las animaciones activas

Este sistema de animaciones proporciona una experiencia fluida y profesional que mejora la usabilidad sin comprometer el rendimiento, manteniendo la seriedad requerida para herramientas de trabajo jurídico.