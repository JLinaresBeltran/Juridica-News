# Animation and Transition Specifications: Health Insight Assistant

## Animation Philosophy

Animations in the Health Insight Assistant serve to:
- **Guide attention** to important status changes
- **Provide feedback** that the system is working
- **Create hierarchy** through orchestrated sequences
- **Build trust** through smooth, professional motion
- **Reduce cognitive load** by showing relationships

## Core Animation Principles

### Timing & Easing

```css
:root {
  /* Duration Scale */
  --duration-instant: 100ms;   /* Micro feedback */
  --duration-fast: 200ms;      /* Quick state changes */
  --duration-normal: 300ms;    /* Standard transitions */
  --duration-slow: 500ms;      /* Complex animations */
  --duration-slower: 700ms;    /* Orchestrated sequences */
  
  /* Easing Functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Motion Tokens

```javascript
const motionTokens = {
  // Micro-interactions
  hover: {
    duration: 150,
    easing: 'ease-out',
    properties: ['background-color', 'border-color', 'box-shadow']
  },
  
  // State changes
  active: {
    duration: 200,
    easing: 'ease-out',
    properties: ['transform', 'background-color']
  },
  
  // Layout shifts
  layout: {
    duration: 300,
    easing: 'ease-in-out',
    properties: ['width', 'height', 'margin', 'padding']
  },
  
  // Entrances
  enter: {
    duration: 400,
    easing: 'ease-out',
    properties: ['opacity', 'transform']
  },
  
  // Exits
  exit: {
    duration: 200,
    easing: 'ease-in',
    properties: ['opacity', 'transform']
  }
};
```

## Specialist Animation Sequences

### Medical Team Assembly

The most important animation sequence showing the AI orchestration:

```css
/* CMO Activation */
@keyframes cmo-activate {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Specialist Card Entrance */
@keyframes specialist-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

/* Stagger Timing */
.specialist-card:nth-child(1) { animation-delay: 100ms; }
.specialist-card:nth-child(2) { animation-delay: 200ms; }
.specialist-card:nth-child(3) { animation-delay: 300ms; }
.specialist-card:nth-child(4) { animation-delay: 400ms; }
.specialist-card:nth-child(5) { animation-delay: 500ms; }
```

### Specialist Status Transitions

```javascript
// State machine for specialist animations
const specialistStates = {
  waiting: {
    enter: {
      opacity: [0, 0.6],
      scale: [0.95, 1],
      duration: 300
    },
    idle: {
      opacity: 0.6,
      animation: 'pulse 3s infinite'
    }
  },
  
  active: {
    enter: {
      opacity: [0.6, 1],
      scale: [1, 1.05, 1],
      borderColor: ['#E5E7EB', 'var(--specialist-color)'],
      duration: 400,
      easing: 'ease-out'
    },
    idle: {
      animation: 'specialist-working 2s infinite'
    }
  },
  
  complete: {
    enter: {
      scale: [1, 1.1, 1],
      duration: 600,
      easing: 'ease-bounce'
    },
    idle: {
      opacity: 1,
      borderColor: '#10B981'
    }
  }
};
```

### Progress Animations

```css
/* Progress Bar Fill */
@keyframes progress-fill {
  from {
    width: var(--progress-start, 0%);
    opacity: 0.8;
  }
  to {
    width: var(--progress-end, 100%);
    opacity: 1;
  }
}

/* Shimmer Effect */
@keyframes progress-shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.progress-bar {
  position: relative;
  overflow: hidden;
}

.progress-fill {
  animation: progress-fill 300ms ease-out forwards;
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary-light) 50%,
    var(--primary) 100%
  );
  background-size: 200% 100%;
  animation: 
    progress-fill 300ms ease-out forwards,
    progress-shimmer 1.5s linear infinite;
}
```

## Message & Chat Animations

### Message Appearance

```css
/* New message entrance */
@keyframes message-enter {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing indicator */
@keyframes typing-dot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.typing-indicator .dot {
  animation: typing-dot 1.4s infinite;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

### Streaming Text Effect

```javascript
// Simulate streaming response
class StreamingText {
  constructor(element, text, speed = 30) {
    this.element = element;
    this.text = text;
    this.speed = speed;
    this.currentIndex = 0;
  }
  
  start() {
    // Add cursor
    this.cursor = document.createElement('span');
    this.cursor.className = 'streaming-cursor';
    this.cursor.textContent = '▋';
    
    const animate = () => {
      if (this.currentIndex < this.text.length) {
        // Add next character
        const char = this.text[this.currentIndex];
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.style.animationDelay = `${this.currentIndex * 20}ms`;
        charSpan.className = 'char-enter';
        
        this.element.insertBefore(charSpan, this.cursor);
        this.currentIndex++;
        
        setTimeout(animate, this.speed);
      } else {
        // Remove cursor
        this.cursor.remove();
      }
    };
    
    this.element.appendChild(this.cursor);
    animate();
  }
}
```

## Panel Transitions

### Tab Switching

```css
/* Tab content transitions */
.tab-content {
  position: relative;
  overflow: hidden;
}

.tab-panel {
  position: absolute;
  width: 100%;
  opacity: 0;
  transform: translateX(100%);
  transition: all 300ms var(--ease-out);
}

.tab-panel.active {
  position: relative;
  opacity: 1;
  transform: translateX(0);
}

.tab-panel.exit-left {
  transform: translateX(-100%);
}

.tab-panel.enter-left {
  transform: translateX(-100%);
}
```

### Panel Sliding (Mobile)

```javascript
// Swipeable panels
class SwipeablePanel {
  constructor(element) {
    this.element = element;
    this.startX = 0;
    this.currentX = 0;
    this.threshold = 50;
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.element.addEventListener('touchstart', this.onStart.bind(this));
    this.element.addEventListener('touchmove', this.onMove.bind(this));
    this.element.addEventListener('touchend', this.onEnd.bind(this));
  }
  
  onMove(e) {
    const deltaX = e.touches[0].clientX - this.startX;
    this.currentX = deltaX;
    
    // Apply transform with resistance
    const resistance = Math.abs(deltaX) / window.innerWidth;
    const transform = deltaX * (1 - resistance * 0.3);
    
    this.element.style.transform = `translateX(${transform}px)`;
    this.element.style.transition = 'none';
  }
  
  onEnd() {
    const threshold = window.innerWidth * 0.3;
    
    if (Math.abs(this.currentX) > threshold) {
      // Complete swipe
      this.element.style.transform = 
        `translateX(${this.currentX > 0 ? '100%' : '-100%'})`;
      this.element.style.opacity = '0';
    } else {
      // Snap back
      this.element.style.transform = 'translateX(0)';
    }
    
    this.element.style.transition = 'all 300ms ease-out';
  }
}
```

## Loading & Skeleton Animations

### Skeleton Screens

```css
/* Base skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 25%,
    #E5E7EB 50%,
    #F3F4F6 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Skeleton variants */
.skeleton-text {
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-card {
  height: 120px;
  border-radius: 12px;
}
```

### Loading States

```css
/* Spinner */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Pulse loading */
@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  80%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.pulse-loader {
  position: relative;
}

.pulse-loader::before {
  content: '';
  position: absolute;
  inset: -10px;
  border: 3px solid var(--primary);
  border-radius: 50%;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
```

## Micro-interactions

### Button Interactions

```css
/* Button press effect */
.button {
  transition: all 150ms var(--ease-out);
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 50ms var(--ease-out);
}

/* Ripple effect */
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

.button.ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.5);
  animation: ripple 600ms ease-out;
}
```

### Input Focus

```css
/* Input focus animation */
.input-field {
  position: relative;
  transition: all 200ms var(--ease-out);
}

.input-field::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: all 300ms var(--ease-out);
  transform: translateX(-50%);
}

.input-field:focus-within::after {
  width: 100%;
}

/* Label animation */
.floating-label {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  transition: all 200ms var(--ease-out);
  pointer-events: none;
}

.input-field:focus-within .floating-label,
.input-field.has-value .floating-label {
  top: -8px;
  left: 12px;
  font-size: 12px;
  background: white;
  padding: 0 4px;
  color: var(--primary);
}
```

## Notification Animations

### Toast Notifications

```css
/* Toast entrance */
@keyframes toast-enter {
  0% {
    opacity: 0;
    transform: translateY(100%) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Toast exit */
@keyframes toast-exit {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast {
  animation: toast-enter 300ms var(--ease-bounce) forwards;
}

.toast.exiting {
  animation: toast-exit 200ms var(--ease-in) forwards;
}
```

### Alert Banners

```css
/* Alert slide down */
@keyframes alert-slide-down {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-banner {
  animation: alert-slide-down 400ms var(--ease-out) forwards;
}

/* Attention pulse */
@keyframes attention-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.alert-critical {
  animation: attention-pulse 2s infinite;
}
```

## Chart Animations

### Data Point Animations

```javascript
// Staggered data point entrance
const animateDataPoints = (points, delay = 50) => {
  points.forEach((point, index) => {
    point.style.opacity = '0';
    point.style.transform = 'scale(0) translateY(10px)';
    
    setTimeout(() => {
      point.style.transition = 'all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      point.style.opacity = '1';
      point.style.transform = 'scale(1) translateY(0)';
    }, index * delay);
  });
};

// Line drawing animation
const animateLine = (path) => {
  const length = path.getTotalLength();
  
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  
  path.animate([
    { strokeDashoffset: length },
    { strokeDashoffset: 0 }
  ], {
    duration: 1500,
    easing: 'ease-out',
    fill: 'forwards'
  });
};
```

### Chart Transitions

```css
/* Bar chart growth */
@keyframes bar-grow {
  0% {
    transform: scaleY(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scaleY(1);
  }
}

.chart-bar {
  transform-origin: bottom;
  animation: bar-grow 800ms var(--ease-bounce) forwards;
  animation-delay: calc(var(--index) * 100ms);
}

/* Pie chart reveal */
@keyframes pie-reveal {
  0% {
    stroke-dasharray: 0 100;
  }
  100% {
    stroke-dasharray: var(--value) 100;
  }
}

.pie-segment {
  animation: pie-reveal 1000ms var(--ease-out) forwards;
  animation-delay: calc(var(--index) * 200ms);
}
```

## Performance Optimization

### Animation Performance

```javascript
// Use transform instead of position
// Bad
element.style.left = x + 'px';
element.style.top = y + 'px';

// Good
element.style.transform = `translate(${x}px, ${y}px)`;

// Use will-change sparingly
.will-animate {
  will-change: transform, opacity;
}

// Remove after animation
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});

// Batch DOM updates
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const element = createelement(item);
  fragment.appendChild(element);
});
container.appendChild(fragment);
```

### GPU Acceleration

```css
/* Force GPU acceleration */
.gpu-accelerated {
  transform: translateZ(0);
  /* or */
  will-change: transform;
  /* or */
  transform: translate3d(0, 0, 0);
}

/* Optimize animations */
.smooth-animation {
  /* Only animate GPU-accelerated properties */
  transition: transform 300ms, opacity 300ms;
  /* Avoid: width, height, padding, margin */
}
```

## Accessibility Considerations

### Motion Preferences

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Maintain essential feedback */
  .progress-fill {
    transition: width 300ms ease-out !important;
  }
  
  /* Replace motion with opacity */
  .message-enter {
    animation: none;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }
  
  .message-enter.visible {
    opacity: 1;
  }
}
```

### Animation Controls

```html
<!-- Pause control -->
<button 
  id="pause-animations"
  aria-label="Pause all animations"
  aria-pressed="false">
  ⏸️ Pause Animations
</button>

<script>
const pauseBtn = document.getElementById('pause-animations');
pauseBtn.addEventListener('click', () => {
  const isPaused = document.body.classList.toggle('animations-paused');
  pauseBtn.setAttribute('aria-pressed', isPaused);
});
</script>

<style>
.animations-paused * {
  animation-play-state: paused !important;
}
</style>
```

## Implementation Checklist

### Core Animations
- [ ] Specialist card entrance sequence
- [ ] Status transitions (waiting → active → complete)
- [ ] Progress bar animations
- [ ] Message streaming effect
- [ ] Panel transitions
- [ ] Loading states

### Micro-interactions
- [ ] Button hover/press effects
- [ ] Input focus animations
- [ ] Tooltip appearances
- [ ] Dropdown animations
- [ ] Toggle switches
- [ ] Checkbox/radio animations

### Performance
- [ ] GPU-accelerated transforms
- [ ] Debounced scroll handlers
- [ ] RequestAnimationFrame usage
- [ ] Will-change optimization
- [ ] Reduced motion support

### Polish
- [ ] Consistent timing functions
- [ ] Smooth state transitions
- [ ] No jarring movements
- [ ] Natural physics
- [ ] Delightful details