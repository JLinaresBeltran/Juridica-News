# Health Insight System - Design System

## Brand Foundation

### Core Values
- **Trustworthy**: Medical-grade accuracy with transparent AI processes
- **Intelligent**: Sophisticated multi-agent orchestration made accessible
- **Compassionate**: Healthcare with a human touch
- **Responsive**: Real-time health insights when patients need them
- **Professional**: Clinical expertise meets modern technology

### Visual Identity
- **Logo**: Blue medical briefcase with integrated stethoscope element
- **Application Name**: Health Insight Assistant
- **Tagline**: "Powered by Multi-Agent AI • Snowflake Cortex"
- **Voice**: Professional yet approachable, authoritative but empathetic

## Color System

### Primary Palette
```css
:root {
  /* Core Brand Colors */
  --primary-blue: #3B82F6;      /* Primary actions, links, focus states */
  --primary-white: #FFFFFF;     /* Primary backgrounds, clean surfaces */
  --background-gradient: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ddd6fe 100%);
  
  /* Medical Status Colors */
  --status-normal: #10B981;     /* Healthy ranges, positive indicators */
  --status-borderline: #F59E0B; /* Attention needed, warnings */
  --status-critical: #EF4444;   /* Urgent attention, critical values */
  --status-improving: #3B82F6;  /* Positive trends, improvements */
}
```

### Medical Specialist Colors (CRITICAL - USE EXACT VALUES)
```css
:root {
  /* Specialist Colors - Each medical professional has a designated color */
  --dr-heart: #EF4444;        /* Cardiology - Red */
  --dr-lab: #10B981;          /* Laboratory Medicine - Green */
  --dr-hormone: #8B5CF6;      /* Endocrinology - Purple */
  --dr-analytics: #F59E0B;    /* Data Analysis - Amber */
  --dr-prevention: #F97316;   /* Preventive Medicine - Orange */
  --dr-pharma: #FB923C;       /* Pharmacy - Light Orange */
  --dr-nutrition: #84CC16;    /* Nutrition - Lime */
  --dr-vitality: #06B6D4;     /* General Practice/CMO - Cyan */
}
```

### Neutral Palette
```css
:root {
  /* Grays for UI Elements */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
```

## Typography System

### Font Stack
```css
:root {
  --font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                  "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, Consolas, "Liberation Mono", 
               "Courier New", monospace;
}
```

### Type Scale
```css
/* Headings */
.h1 { font-size: 24px; line-height: 32px; font-weight: 600; }
.h2 { font-size: 20px; line-height: 28px; font-weight: 600; }
.h3 { font-size: 18px; line-height: 24px; font-weight: 600; }

/* Body Text */
.body-large { font-size: 16px; line-height: 24px; font-weight: 400; }
.body { font-size: 14px; line-height: 20px; font-weight: 400; }
.small { font-size: 12px; line-height: 16px; font-weight: 400; }
.micro { font-size: 11px; line-height: 14px; font-weight: 400; }

/* Medical-Specific */
.metric-value { font-size: 20px; line-height: 24px; font-weight: 600; }
.metric-label { font-size: 12px; line-height: 16px; font-weight: 500; }
.confidence { font-size: 14px; line-height: 20px; font-weight: 500; }
```

## Glassmorphism Specifications (CRITICAL)

### Base Glass Effect
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
}

/* Variations */
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.glass-modal {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
}

.glass-sidebar {
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(226, 232, 240, 0.8);
}
```

### Medical Glass Variants
```css
/* Health Status Glass */
.glass-health-normal {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.glass-health-warning {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.glass-health-critical {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
```

## Spacing System (8-Point Grid)

```css
:root {
  /* Base Unit: 8px */
  --space-0: 0px;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-10: 80px;
  
  /* Medical-Specific Spacing */
  --panel-padding: 16px;
  --card-padding: 20px;
  --metric-gap: 12px;
  --team-spacing: 24px;
}
```

## Animation System

### Timing Functions
```css
:root {
  /* Medical-Appropriate Easing */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-gentle: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Durations */
  --duration-instant: 150ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-pulse: 2000ms;
}
```

### Medical Animation Patterns
```css
/* Specialist Activation Pulse */
@keyframes specialist-pulse {
  0%, 100% { 
    opacity: 0.7; 
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--specialist-color);
  }
  50% { 
    opacity: 1; 
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(var(--specialist-color-rgb), 0.1);
  }
}

/* Health Metric Update */
@keyframes metric-update {
  0% { background-color: rgba(59, 130, 246, 0.1); }
  50% { background-color: rgba(59, 130, 246, 0.3); }
  100% { background-color: transparent; }
}

/* Message Appearance */
@keyframes message-slide-up {
  from { 
    opacity: 0; 
    transform: translateY(16px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

/* Connection Line Draw */
@keyframes draw-connection {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}

/* Loading Skeleton */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## Shadow System

```css
:root {
  /* Medical UI Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
  
  /* Glass Shadows */
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.08);
  --shadow-glass-hover: 0 12px 40px rgba(0, 0, 0, 0.12);
}
```

## Border Radius System

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* Component-Specific */
  --radius-button: 8px;
  --radius-card: 12px;
  --radius-panel: 16px;
  --radius-badge: 9999px;
}
```

## Medical Icon System

### Icon Guidelines
- Consistent 2px stroke weight
- 24x24px base size with 20x20px and 16x16px variants
- Rounded line caps and joins
- Medical-appropriate symbolism

### Core Medical Icons
```
Heart: ❤️ (Cardiology)
Test Tube: 🧪 (Laboratory)
DNA: 🧬 (Endocrinology)
Chart: 📊 (Data Analysis)
Shield: 🛡️ (Preventive)
Pills: 💊 (Pharmacy)
Apple: 🍎 (Nutrition)
Stethoscope: 🩺 (General Practice)
```

## Interactive States

### Hover States
```css
.interactive-medical {
  transition: all var(--duration-fast) var(--ease-smooth);
}

.interactive-medical:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: rgba(255, 255, 255, 0.95);
}
```

### Focus States
```css
.focusable-medical:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-white),
              0 0 0 4px var(--primary-blue);
}
```

### Active States
```css
.clickable-medical:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

## Medical UI Patterns

### Health Status Indicators
- Green (#10B981): Normal/Healthy
- Amber (#F59E0B): Borderline/Attention
- Red (#EF4444): Critical/Urgent
- Blue (#3B82F6): Improving/Positive Trend

### Confidence Levels
- High (90-100%): Solid color, bold text
- Medium (70-89%): Slightly transparent, normal text
- Low (<70%): More transparent, italicized text

### Medical Data Hierarchy
1. Critical alerts (red, prominent)
2. Current values (large, bold)
3. Reference ranges (medium, muted)
4. Historical data (small, subtle)
5. Metadata (micro, very subtle)

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Mobile: 0-767px (default) */
/* Tablet: 768px-1023px */
@media (min-width: 768px) { }

/* Desktop: 1024px-1279px */
@media (min-width: 1024px) { }

/* Large Desktop: 1280px+ */
@media (min-width: 1280px) { }
```

## Accessibility Guidelines

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Always test with medical content

### Focus Management
- Visible focus indicators
- Logical tab order
- Skip links for navigation
- ARIA labels for medical terms

### Medical Accessibility
- Tooltips for medical abbreviations
- Alternative text for health visualizations
- High contrast mode support
- Screen reader optimization

## Implementation Notes

### Performance
- Use CSS containment for complex components
- Implement virtual scrolling for long lists
- Lazy load heavy visualizations
- Optimize glassmorphism for older devices

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback for backdrop-filter
- Progressive enhancement approach
- Mobile-first responsive design