# Animation and Transition Specifications: Multi-Agent Health Insight System

## Animation Principles

### Core Philosophy
Animations in the Health Insight System serve to:
1. **Guide Attention**: Direct focus to important changes
2. **Show Relationships**: Connect medical team interactions
3. **Indicate Progress**: Real-time analysis feedback
4. **Smooth Transitions**: Reduce cognitive load
5. **Build Trust**: Professional, medical-grade feel

### Timing Guidelines
```css
:root {
  /* Duration scales */
  --duration-instant: 100ms;   /* Hover states */
  --duration-fast: 150ms;      /* Micro-interactions */
  --duration-normal: 300ms;    /* Most transitions */
  --duration-slow: 500ms;      /* Complex animations */
  --duration-slower: 800ms;    /* Page transitions */
  --duration-slowest: 1200ms;  /* Initial load sequences */
  
  /* Easing functions */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

## Component Animations

### 1. Page Load Sequence
Initial application load with staggered reveal:

```css
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

/* Staggered load sequence */
.header {
  animation: fadeInUp var(--duration-normal) var(--ease-out);
}

.left-sidebar {
  animation: fadeInUp var(--duration-normal) var(--ease-out) 100ms;
}

.center-panel {
  animation: fadeInUp var(--duration-normal) var(--ease-out) 200ms;
}

.right-panel {
  animation: fadeInUp var(--duration-normal) var(--ease-out) 300ms;
}
```

### 2. Medical Team Animations

#### Specialist Activation
```css
/* Idle to Active state */
@keyframes specialistActivate {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.specialist-node {
  transition: all var(--duration-normal) var(--ease-out);
}

.specialist-node.activating {
  animation: specialistActivate var(--duration-slow) var(--ease-spring);
}

/* Pulsing while active */
@keyframes specialistPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

.specialist-node.active {
  animation: specialistPulse 2s var(--ease-in-out) infinite;
}
```

#### Connection Lines
```css
/* Data flow animation */
@keyframes dataFlow {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

.connection-line {
  stroke-dasharray: 5 5;
  animation: dataFlow 2s linear infinite;
}

/* Gradient flow effect */
.connection-gradient {
  animation: gradientFlow 3s ease-in-out infinite;
}

@keyframes gradientFlow {
  0% {
    stop-color: var(--color-primary);
    stop-opacity: 0;
  }
  50% {
    stop-color: var(--color-primary);
    stop-opacity: 1;
  }
  100% {
    stop-color: var(--color-primary);
    stop-opacity: 0;
  }
}
```

### 3. Progress Indicators

#### Linear Progress Bar
```css
/* Smooth progress fill */
.progress-fill {
  transition: width var(--duration-slow) var(--ease-out);
  position: relative;
  overflow: hidden;
}

/* Shimmer effect */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}
```

#### Circular Progress
```javascript
// SVG circle progress animation
const CircularProgress = ({ progress }) => {
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg className="circular-progress">
      <circle
        className="progress-track"
        cx="50" cy="50" r="45"
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="4"
      />
      <circle
        className="progress-fill"
        cx="50" cy="50" r="45"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.5s ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%'
        }}
      />
    </svg>
  );
};
```

### 4. Message Animations

#### New Message Arrival
```css
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  animation: messageSlideIn var(--duration-normal) var(--ease-out);
}

/* Typing indicator */
@keyframes typingDot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.typing-dot {
  animation: typingDot 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

#### Tool Call Animation
```css
@keyframes toolCallExpand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 100px;
    opacity: 1;
  }
}

.tool-call {
  animation: toolCallExpand var(--duration-normal) var(--ease-out);
}

/* Loading state for tool execution */
@keyframes toolExecuting {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.tool-call.executing {
  background: linear-gradient(
    90deg,
    #F3F4F6 25%,
    #E5E7EB 50%,
    #F3F4F6 75%
  );
  background-size: 200% 100%;
  animation: toolExecuting 1.5s linear infinite;
}
```

### 5. Panel Transitions

#### Collapse/Expand Panels
```css
/* Smooth width transitions */
.left-sidebar {
  transition: width var(--duration-normal) var(--ease-out);
  overflow: hidden;
}

.left-sidebar.collapsed {
  width: 60px;
}

/* Content fade during collapse */
.sidebar-content {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.left-sidebar.collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}

/* Icon rotation for collapse button */
.collapse-icon {
  transition: transform var(--duration-fast) var(--ease-out);
}

.collapsed .collapse-icon {
  transform: rotate(180deg);
}
```

#### Tab Switching
```css
/* Tab indicator slide */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-primary);
  transition: all var(--duration-normal) var(--ease-out);
}

/* Content fade and slide */
.tab-content {
  animation: tabContentIn var(--duration-normal) var(--ease-out);
}

@keyframes tabContentIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 6. Visualization Animations

#### Chart Entry Animations
```javascript
// React component with Recharts
const AnimatedLineChart = ({ data }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  return (
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="value"
        stroke="#3B82F6"
        strokeWidth={2}
        dot={false}
        animationDuration={1200}
        animationEasing="ease-out"
        onAnimationEnd={() => setAnimationComplete(true)}
      />
      {animationComplete && (
        <Line
          type="monotone"
          dataKey="reference"
          stroke="#10B981"
          strokeWidth={1}
          strokeDasharray="5 5"
          animationDuration={600}
        />
      )}
    </LineChart>
  );
};
```

#### Code Streaming Effect
```css
/* Simulated typing effect */
@keyframes codeLine {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 100%;
    opacity: 1;
  }
}

.code-line {
  overflow: hidden;
  white-space: nowrap;
  animation: codeLine var(--duration-normal) var(--ease-out) forwards;
  animation-delay: calc(var(--line-index) * 50ms);
}

/* Cursor blink */
@keyframes cursorBlink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

.code-cursor {
  animation: cursorBlink 1s infinite;
}
```

### 7. Hover & Interaction States

#### Button Hover
```css
.button {
  transition: all var(--duration-instant) var(--ease-out);
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.button:active {
  transform: translateY(0);
  transition-duration: 50ms;
}
```

#### Card Hover Effects
```css
.specialist-card {
  transition: all var(--duration-fast) var(--ease-out);
  transform: translateY(0);
}

.specialist-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* Reveal additional info on hover */
.specialist-card .details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

.specialist-card:hover .details {
  max-height: 100px;
  opacity: 1;
}
```

### 8. Loading States

#### Skeleton Loading
```css
@keyframes skeletonWave {
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
    #F3F4F6 25%,
    #E5E7EB 50%,
    #F3F4F6 75%
  );
  background-size: 200% 100%;
  animation: skeletonWave 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

#### Spinner Variations
```css
/* Medical cross spinner */
@keyframes medicalSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.medical-spinner {
  animation: medicalSpin 1.5s linear infinite;
}

/* DNA helix loader */
@keyframes helixRotate {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.helix-loader {
  animation: helixRotate 2s linear infinite;
}
```

## Mobile-Specific Animations

### Touch Feedback
```css
/* Ripple effect on tap */
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.touch-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.3);
  transform: scale(0);
  animation: ripple var(--duration-slow) var(--ease-out);
}
```

### Swipe Gestures
```javascript
// Panel swipe animation
const swipeAnimation = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  swipeLeft: {
    transform: ['translateX(0)', 'translateX(-100%)'],
    opacity: [1, 0]
  },
  
  swipeRight: {
    transform: ['translateX(0)', 'translateX(100%)'],
    opacity: [1, 0]
  }
};
```

## Performance Optimization

### Animation Best Practices
```css
/* Use transform and opacity only */
.optimized-animation {
  will-change: transform, opacity;
  transform: translateZ(0); /* Hardware acceleration */
}

/* Avoid animating expensive properties */
/* Bad */
.bad { transition: width 300ms; }

/* Good */
.good { transition: transform 300ms; }
```

### Conditional Animations
```javascript
// Check user preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Apply appropriate duration
const animationDuration = prefersReducedMotion ? 0 : 300;

// Disable complex animations
if (prefersReducedMotion) {
  document.body.classList.add('reduce-motion');
}
```

### Frame Rate Management
```javascript
// Use requestAnimationFrame for smooth animations
function animateProgress(element, targetValue) {
  let currentValue = 0;
  const increment = targetValue / 60; // 60fps
  
  function update() {
    currentValue = Math.min(currentValue + increment, targetValue);
    element.style.width = `${currentValue}%`;
    
    if (currentValue < targetValue) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

## Animation Sequences

### Complex Orchestration
```javascript
// Medical team assembly sequence
async function assembleTeam(specialists) {
  // 1. CMO appears
  await animate('.cmo-node', 'fadeIn', 300);
  
  // 2. Connection lines draw
  await animate('.connections', 'drawLines', 500);
  
  // 3. Specialists appear in sequence
  for (const [index, specialist] of specialists.entries()) {
    await animate(
      `.specialist-${specialist.id}`,
      'specialistAppear',
      200,
      index * 100 // stagger delay
    );
  }
  
  // 4. Activate first specialist
  await animate('.specialist-1', 'activate', 300);
}
```

### State Machine Animations
```javascript
const specialistStates = {
  idle: {
    opacity: 0.6,
    scale: 1,
    animation: 'none'
  },
  
  activating: {
    opacity: 1,
    scale: 1.1,
    animation: 'pulse 0.5s ease-out'
  },
  
  active: {
    opacity: 1,
    scale: 1,
    animation: 'working 2s ease-in-out infinite'
  },
  
  completing: {
    opacity: 1,
    scale: 1.05,
    animation: 'complete 0.3s ease-out'
  },
  
  complete: {
    opacity: 0.8,
    scale: 1,
    animation: 'none'
  }
};
```

## CSS Variables for Theming

```css
/* Animation theming */
:root {
  --animation-primary: var(--color-primary);
  --animation-success: var(--color-success);
  --animation-warning: var(--color-warning);
  --animation-error: var(--color-error);
  
  /* Speed multiplier for accessibility */
  --animation-speed: 1;
}

/* Slow animations preference */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-speed: 0.01;
  }
}

/* Usage */
.animated-element {
  animation-duration: calc(300ms * var(--animation-speed));
}
```

## Implementation Guidelines

1. **Always use CSS animations when possible** - Better performance than JS
2. **Limit simultaneous animations** - Max 3-4 concurrent animations
3. **Test on low-end devices** - Ensure 60fps on all targets
4. **Provide fallbacks** - Static states for no-JS scenarios
5. **Document animation intent** - Comment complex sequences
6. **Use animation libraries sparingly** - Prefer native solutions
7. **Monitor performance** - Use Chrome DevTools Performance tab