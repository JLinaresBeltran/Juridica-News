# Animation & Transition Specifications: Health Insight Assistant

## Animation Principles

### Core Philosophy
Animations in the Health Insight Assistant serve to:
1. **Guide Attention**: Direct users to important changes
2. **Show Relationships**: Connect UI elements and actions
3. **Provide Feedback**: Confirm user interactions
4. **Enhance Personality**: Make the medical team feel alive
5. **Reduce Cognitive Load**: Smooth transitions between states

### Performance Guidelines
- **60 FPS Target**: All animations must maintain smooth framerates
- **GPU Acceleration**: Use transform and opacity when possible
- **Will-Change**: Declare animated properties in advance
- **Reduced Motion**: Respect user preferences

## Timing & Easing

### Duration Scale
```css
:root {
  --duration-instant: 100ms;   /* Micro-interactions */
  --duration-fast: 150ms;      /* Hover states */
  --duration-normal: 300ms;    /* Most transitions */
  --duration-moderate: 500ms;  /* Panel slides */
  --duration-slow: 700ms;      /* Complex animations */
  --duration-slower: 1000ms;   /* Page transitions */
}
```

### Easing Functions
```css
:root {
  /* Standard easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Special easings */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Component Animations

### Button Interactions
```css
.button {
  transition: all var(--duration-fast) var(--ease-out);
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
  transition-duration: var(--duration-instant);
}

/* Ripple effect on click */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.button::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -50px;
  animation: ripple 600ms ease-out;
}
```

### Card Hover Effects
```css
.card {
  transition: all var(--duration-normal) var(--ease-out);
  transform: translateY(0);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* Stagger animation for card lists */
.card-list .card {
  animation: fadeInUp var(--duration-normal) var(--ease-out) both;
}

.card-list .card:nth-child(1) { animation-delay: 0ms; }
.card-list .card:nth-child(2) { animation-delay: 50ms; }
.card-list .card:nth-child(3) { animation-delay: 100ms; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Input Focus Transitions
```css
.input-field {
  border: 1px solid var(--gray-300);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.input-field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Floating label animation */
.input-group label {
  transition: all var(--duration-normal) var(--ease-out);
  transform-origin: left center;
}

.input-group.focused label,
.input-group.filled label {
  transform: translateY(-20px) scale(0.8);
  color: var(--primary);
}
```

## Medical Team Animations

### Specialist Status Indicators
```css
/* Waiting state - subtle pulse */
.specialist-status.waiting {
  animation: pulse-subtle 3s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* Active state - energetic pulse */
.specialist-status.active {
  animation: pulse-active 1.5s ease-in-out infinite;
}

@keyframes pulse-active {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
    transform: scale(1.1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}

/* Complete state - check animation */
.specialist-status.complete {
  animation: complete-bounce var(--duration-normal) var(--ease-bounce);
}

@keyframes complete-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### Progress Bar Animations
```css
.progress-bar {
  background: var(--gray-200);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  background: var(--primary);
  height: 100%;
  transition: width var(--duration-normal) var(--ease-out);
}

/* Animated stripes for active progress */
.progress-fill.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}
```

### CMO Avatar Animation
```css
.cmo-avatar {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Thinking animation */
.cmo-avatar.thinking {
  animation: thinking 2s ease-in-out infinite;
}

@keyframes thinking {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.05) rotate(-5deg); }
  75% { transform: scale(1.05) rotate(5deg); }
}
```

## Panel Transitions

### Sliding Panels
```css
/* Left panel slide */
.left-panel {
  transform: translateX(0);
  transition: transform var(--duration-moderate) var(--ease-out);
}

.left-panel.collapsed {
  transform: translateX(-100%);
}

/* Right panel overlay on mobile */
@media (max-width: 1023px) {
  .right-panel {
    position: fixed;
    right: 0;
    transform: translateX(100%);
    transition: transform var(--duration-moderate) var(--ease-out);
  }
  
  .right-panel.open {
    transform: translateX(0);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  }
}

/* Panel resize animation */
.panel-resizable {
  transition: width var(--duration-fast) ease-out;
}
```

### Tab Switching
```css
.tab-content {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide and fade for tab content */
.tab-content.slide-in {
  animation: slideIn var(--duration-normal) var(--ease-out);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Tab indicator animation */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--primary);
  transition: all var(--duration-normal) var(--ease-out);
}
```

## Chat Animations

### Message Appearance
```css
.message {
  animation: messageIn var(--duration-normal) var(--ease-out);
  transform-origin: bottom;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--gray-400);
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.3);
    opacity: 1;
  }
}
```

### Tool Call Animations
```css
.tool-call {
  overflow: hidden;
  max-height: 60px;
  transition: max-height var(--duration-normal) var(--ease-out);
}

.tool-call.expanded {
  max-height: 500px;
}

/* Code streaming effect */
.code-stream {
  animation: stream-in var(--duration-slow) ease-out;
}

@keyframes stream-in {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}
```

## Loading States

### Skeleton Screens
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Spinner Animations
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Medical cross spinner */
.medical-spinner {
  position: relative;
  width: 40px;
  height: 40px;
}

.medical-spinner::before,
.medical-spinner::after {
  content: '';
  position: absolute;
  background: var(--primary);
  animation: medical-spin 2s ease-in-out infinite;
}

.medical-spinner::before {
  width: 100%;
  height: 4px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

.medical-spinner::after {
  width: 4px;
  height: 100%;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

@keyframes medical-spin {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
}
```

## Visualization Animations

### Chart Entry Animations
```css
/* Line chart draw-in effect */
.chart-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-line 2s ease-out forwards;
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}

/* Bar chart grow effect */
.chart-bar {
  transform-origin: bottom;
  animation: grow-bar 1s var(--ease-out) both;
}

@keyframes grow-bar {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

/* Stagger bars */
.chart-bar:nth-child(1) { animation-delay: 0ms; }
.chart-bar:nth-child(2) { animation-delay: 100ms; }
.chart-bar:nth-child(3) { animation-delay: 200ms; }
```

### Data Point Interactions
```css
.data-point {
  transition: all var(--duration-fast) var(--ease-out);
  transform: scale(1);
}

.data-point:hover {
  transform: scale(1.5);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Tooltip animation */
.tooltip {
  opacity: 0;
  transform: translateY(5px);
  transition: all var(--duration-fast) var(--ease-out);
  pointer-events: none;
}

.data-point:hover .tooltip {
  opacity: 1;
  transform: translateY(0);
}
```

## Page Transitions

### Route Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all var(--duration-normal) var(--ease-out);
}

.page-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: all var(--duration-normal) var(--ease-out);
}
```

### Modal Animations
```css
/* Backdrop fade */
.modal-backdrop {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

/* Modal scale and fade */
.modal-content {
  animation: modalIn var(--duration-normal) var(--ease-spring);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content.closing {
  animation: modalOut var(--duration-fast) var(--ease-in);
}

@keyframes modalOut {
  to {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}
```

## Micro-interactions

### Success Animations
```css
.success-checkmark {
  width: 56px;
  height: 56px;
  animation: checkmark-circle 0.6s ease-in-out;
}

@keyframes checkmark-circle {
  0% {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(45deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(45deg);
    opacity: 1;
  }
}

.success-checkmark path {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-stroke 0.3s 0.3s ease-out forwards;
}

@keyframes checkmark-stroke {
  to { stroke-dashoffset: 0; }
}
```

### Error Shake
```css
.error-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

## Performance Optimization

### GPU Acceleration
```css
/* Force GPU acceleration for smooth animations */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Create new layer */
  backface-visibility: hidden; /* Prevent flicker */
}

/* Remove after animation */
.animated-element.animation-done {
  will-change: auto;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential feedback */
  .loading-spinner {
    animation-duration: 2s !important;
  }
  
  /* Replace motion with opacity */
  .message {
    animation: fadeIn 0.01ms;
  }
}
```

## Implementation Guidelines

### Animation Debugging
```css
/* Debug mode to slow down animations */
.debug-animations * {
  animation-duration: 3s !important;
  transition-duration: 3s !important;
}
```

### JavaScript Animation Hooks
```javascript
// Animation end detection
element.addEventListener('animationend', () => {
  element.classList.add('animation-done');
  element.style.willChange = 'auto';
});

// Stagger animations programmatically
items.forEach((item, index) => {
  item.style.animationDelay = `${index * 50}ms`;
});

// Respect reduced motion in JS
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  enableAnimations();
}
```

### Animation Utilities
```css
/* Utility classes */
.animate-fade-in { animation: fadeIn var(--duration-normal) var(--ease-out); }
.animate-slide-up { animation: slideUp var(--duration-normal) var(--ease-out); }
.animate-scale-in { animation: scaleIn var(--duration-normal) var(--ease-spring); }
.animate-delay-1 { animation-delay: 100ms; }
.animate-delay-2 { animation-delay: 200ms; }
.animate-delay-3 { animation-delay: 300ms; }
```