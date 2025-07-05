# Health Insight System - Animation Specifications

## Overview

This document defines all animation specifications for the Health Insight System, ensuring smooth, medical-appropriate motion that enhances user experience while maintaining professional healthcare aesthetics.

## Core Animation Principles

### Medical-Appropriate Motion
- **Calm and Reassuring**: No jarring or sudden movements
- **Purposeful**: Every animation has a clear function
- **Smooth Timing**: Ease-in-out for natural feel
- **Subtle**: Enhance, don't distract from health data
- **Performance**: 60fps target for all animations

### Timing Constants
```css
:root {
  /* Duration Scale */
  --duration-instant: 100ms;    /* Micro-interactions */
  --duration-fast: 200ms;       /* Quick state changes */
  --duration-normal: 300ms;     /* Standard transitions */
  --duration-slow: 500ms;       /* Complex animations */
  --duration-xslow: 800ms;      /* Page transitions */
  --duration-pulse: 2000ms;     /* Continuous animations */
  
  /* Easing Functions */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* Default */
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);         /* Exit */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);            /* Enter */
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce */
  --ease-smooth: cubic-bezier(0.45, 0, 0.55, 1);    /* Gentle */
}
```

## Medical Team Animations

### Agent Activation Sequence
```css
/* Specialist activation pulse */
@keyframes specialist-activate {
  0% { 
    transform: scale(1);
    opacity: 0.5;
    box-shadow: 0 0 0 0 var(--specialist-color);
  }
  50% { 
    transform: scale(1.05);
    opacity: 1;
    box-shadow: 0 0 0 12px rgba(var(--specialist-color-rgb), 0.1);
  }
  100% { 
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(var(--specialist-color-rgb), 0);
  }
}

/* Implementation */
.specialist-card.active {
  animation: specialist-activate 2s ease-out infinite;
}
```

### Connection Line Animation
```css
/* SVG path drawing */
@keyframes draw-connection {
  from {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
  }
  to {
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
  }
}

/* Active data flow */
@keyframes data-flow {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -200;
  }
}

/* Implementation */
.connection-line {
  stroke: var(--specialist-color);
  stroke-width: 2;
  fill: none;
  opacity: 0;
  animation: 
    draw-connection 0.6s ease-out forwards,
    data-flow 3s linear infinite;
  animation-delay: var(--connection-delay);
}
```

### Progress Indicators
```css
/* Circular progress */
@keyframes progress-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes progress-fill {
  from {
    stroke-dasharray: 0 100;
  }
  to {
    stroke-dasharray: var(--progress) 100;
  }
}

/* Linear progress */
@keyframes progress-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.progress-bar-fill {
  transition: width var(--duration-normal) var(--ease-out);
  background: linear-gradient(
    90deg, 
    var(--specialist-color) 0%, 
    var(--specialist-color-light) 100%
  );
}
```

### Team Assembly Animation
```javascript
// Staggered entrance for medical team
const assembleTeam = {
  // CMO appears first
  cmo: {
    delay: 0,
    duration: 500,
    animation: 'fadeIn + scale(0.8 -> 1)'
  },
  // Specialists appear in sequence
  specialists: {
    stagger: 100, // ms between each
    duration: 400,
    animation: 'fadeIn + slideInFromCenter'
  },
  // Connection lines draw last
  connections: {
    delay: 800,
    stagger: 50,
    duration: 600,
    animation: 'drawPath'
  }
};
```

## Message Animations

### Message Appearance
```css
/* User message (slides from right) */
@keyframes message-user-enter {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Assistant message (slides from left) */
@keyframes message-assistant-enter {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* System message (fades in center) */
@keyframes message-system-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Implementation */
.message-enter {
  animation: message-user-enter var(--duration-normal) var(--ease-out);
  animation-fill-mode: both;
}
```

### Thinking Indicator
```css
/* Three dots with wave effect */
@keyframes thinking-dot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.thinking-dot {
  animation: thinking-dot 1.4s ease-in-out infinite;
}

.thinking-dot:nth-child(1) { animation-delay: 0s; }
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }
```

### Tool Call Animation
```css
/* Tool execution visualization */
@keyframes tool-execute {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}

.tool-call.executing {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(59, 130, 246, 0.2) 50%,
    rgba(59, 130, 246, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: tool-execute 2s linear infinite;
}
```

## Health Data Visualizations

### Chart Entry Animations
```css
/* Line chart draw */
@keyframes draw-line {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

/* Bar chart grow */
@keyframes grow-bar {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
  }
}

/* Data point pulse */
@keyframes data-point-pulse {
  0% {
    r: 4;
    opacity: 1;
  }
  50% {
    r: 8;
    opacity: 0.5;
  }
  100% {
    r: 4;
    opacity: 1;
  }
}
```

### Value Updates
```css
/* Metric value change */
@keyframes value-update {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(59, 130, 246, 0.2);
    transform: scale(1.05);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
  }
}

/* Trend arrow */
@keyframes trend-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
```

## Loading States

### Skeleton Loading
```css
/* Shimmer effect */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```

### Spinner Variations
```css
/* Medical cross spinner */
@keyframes medical-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse ring */
@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.loading-medical {
  animation: medical-spin 1s linear infinite;
}

.loading-pulse::after {
  animation: pulse-ring 1.5s ease-out infinite;
}
```

## Interactive Feedback

### Button Interactions
```css
/* Press effect */
@keyframes button-press {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

/* Hover lift */
.button-medical {
  transition: all var(--duration-fast) var(--ease-out);
}

.button-medical:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-medical:active {
  animation: button-press 0.2s ease-out;
}
```

### Card Interactions
```css
/* Card hover */
.health-card {
  transition: all var(--duration-normal) var(--ease-out);
}

.health-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Card selection */
@keyframes card-select {
  0% {
    border-color: transparent;
  }
  50% {
    border-color: var(--primary-blue);
    transform: scale(1.02);
  }
  100% {
    border-color: var(--primary-blue);
    transform: scale(1);
  }
}
```

## Panel Transitions

### Collapse/Expand
```css
/* Panel collapse */
@keyframes panel-collapse {
  from {
    width: var(--panel-width);
    opacity: 1;
  }
  to {
    width: 0;
    opacity: 0;
  }
}

/* Content fade during collapse */
@keyframes content-fade-out {
  0% { opacity: 1; }
  60% { opacity: 0; }
  100% { opacity: 0; }
}

.panel-collapsing {
  animation: panel-collapse var(--duration-normal) var(--ease-in-out);
}

.panel-collapsing .panel-content {
  animation: content-fade-out calc(var(--duration-normal) * 0.6) var(--ease-in);
}
```

### Tab Switching
```css
/* Tab content transition */
.tab-content {
  opacity: 0;
  transform: translateY(10px);
  transition: 
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
}

/* Tab indicator slide */
.tab-indicator {
  transition: transform var(--duration-fast) var(--ease-out);
}
```

## Notification Animations

### Toast Notifications
```css
/* Slide in from right */
@keyframes toast-enter {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide out */
@keyframes toast-exit {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast {
  animation: toast-enter var(--duration-normal) var(--ease-out);
}

.toast.exiting {
  animation: toast-exit var(--duration-fast) var(--ease-in);
}
```

## Emergency Animations

### Critical Alert
```css
/* Emergency pulse */
@keyframes emergency-pulse {
  0%, 100% {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
  }
  50% {
    background-color: rgba(239, 68, 68, 0.2);
    border-color: #DC2626;
    transform: scale(1.01);
  }
}

.emergency-alert {
  animation: emergency-pulse 1s ease-in-out infinite;
}
```

## Performance Guidelines

### Animation Optimization
1. **Use CSS transforms** over position changes
2. **Animate opacity** and transform only when possible
3. **Use will-change** sparingly on animated elements
4. **GPU acceleration** with transform3d when needed
5. **Reduce paint operations** with careful layering

### Frame Rate Targets
- 60fps for all UI animations
- 30fps acceptable for background animations
- No animations below 24fps
- Monitor with Chrome DevTools

### Accessibility Considerations
```css
/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Examples

### JavaScript Animation Helpers
```javascript
// Stagger utility
const staggerElements = (elements, delay = 50) => {
  elements.forEach((el, index) => {
    el.style.animationDelay = `${index * delay}ms`;
  });
};

// Smooth number transitions
const animateNumber = (element, start, end, duration = 1000) => {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = start + (end - start) * easeOutQuad(progress);
    element.textContent = Math.round(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
};

// Easing function
const easeOutQuad = (t) => t * (2 - t);
```

### Animation Sequence Controller
```javascript
class AnimationSequence {
  constructor() {
    this.queue = [];
  }
  
  add(element, animation, duration, delay = 0) {
    this.queue.push({ element, animation, duration, delay });
    return this;
  }
  
  play() {
    let totalDelay = 0;
    this.queue.forEach(({ element, animation, duration, delay }) => {
      setTimeout(() => {
        element.style.animation = `${animation} ${duration}ms ease-out`;
      }, totalDelay + delay);
      totalDelay += delay;
    });
  }
}
```

## Quality Checklist

- [ ] All animations run at 60fps
- [ ] Easing functions feel natural
- [ ] No jarring transitions
- [ ] Loading states are smooth
- [ ] Reduced motion respected
- [ ] Mobile performance optimized
- [ ] Animation timing consistent
- [ ] Medical theme maintained
- [ ] Accessibility compliant
- [ ] User feedback clear