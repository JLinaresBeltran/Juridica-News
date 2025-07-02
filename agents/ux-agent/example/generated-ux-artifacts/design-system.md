# Design System: Health Insight Assistant

## Brand Principles

### Core Values
- **Trustworthy**: Medical-grade precision with transparent processes
- **Intelligent**: AI-powered insights made accessible
- **Human-Centered**: Complex data simplified for understanding
- **Responsive**: Real-time analysis with progressive updates
- **Professional**: Clinical expertise with approachable design

## Color Palette

### Primary Colors
- **Primary Blue**: `#3B82F6` - Main brand color, CTAs, active states
- **Primary Light**: `#60A5FA` - Hover states, highlights
- **Primary Dark**: `#2563EB` - Pressed states, emphasis
- **Pure White**: `#FFFFFF` - Primary backgrounds, cards
- **Background Gray**: `#F9FAFB` - Secondary backgrounds

### Medical Specialist Colors
Each specialist has a unique, vibrant color for instant recognition:
- **Cardiology Red**: `#EF4444` - Dr. Heart
- **Laboratory Green**: `#10B981` - Dr. Lab
- **Endocrinology Purple**: `#8B5CF6` - Dr. Hormone
- **Data Analysis Yellow**: `#F59E0B` - Dr. Analytics
- **Preventive Orange**: `#F97316` - Dr. Prevention
- **Pharmacy Orange**: `#FB923C` - Dr. Pharma
- **Nutrition Lime**: `#84CC16` - Dr. Nutrition
- **General Practice Cyan**: `#06B6D4` - Dr. Primary

### Semantic Colors
- **Success Green**: `#10B981` - Positive outcomes, normal ranges
- **Warning Amber**: `#F59E0B` - Caution states, attention needed
- **Error Red**: `#EF4444` - Critical values, errors
- **Info Blue**: `#3B82F6` - Informational messages

### Neutral Colors
- **Gray-900**: `#111827` - Primary text
- **Gray-700**: `#374151` - Secondary text
- **Gray-500**: `#6B7280` - Muted text
- **Gray-300**: `#D1D5DB` - Borders
- **Gray-100**: `#F3F4F6` - Subtle backgrounds

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### Type Scale
- **Heading 1**: 28px / 36px / 600 - Page titles
- **Heading 2**: 24px / 32px / 600 - Section headers
- **Heading 3**: 20px / 28px / 600 - Subsections
- **Heading 4**: 18px / 24px / 600 - Card titles
- **Body Large**: 16px / 24px / 400 - Primary content
- **Body**: 14px / 20px / 400 - Standard text
- **Small**: 13px / 18px / 400 - Supporting text
- **Micro**: 12px / 16px / 400 - Labels, metadata

## Spacing System

8-point grid system for consistent spacing:
- **xs**: 4px - Tight spacing
- **sm**: 8px - Compact elements
- **md**: 16px - Standard spacing
- **lg**: 24px - Section spacing
- **xl**: 32px - Major sections
- **2xl**: 48px - Page sections
- **3xl**: 64px - Hero spacing

## Elevation & Shadows

### Shadow Scale
```css
/* Subtle elevation */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Cards and dropdowns */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Modals and popovers */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Floating elements */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Border Radius

### Radius Values
- **Radius-sm**: 6px - Buttons, inputs
- **Radius-md**: 8px - Cards, panels
- **Radius-lg**: 12px - Modals, large cards
- **Radius-xl**: 16px - Hero sections
- **Radius-full**: 9999px - Pills, avatars

## Component Design Patterns

### Glass Morphism Effect
```css
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

### Gradient Overlays
```css
.gradient-overlay {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(139, 92, 246, 0.1) 100%);
}
```

## Animation Principles

### Timing Functions
```css
/* Smooth entrances */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* State changes */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Bouncy feedback */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
- **Fast**: 150ms - Micro-interactions, hovers
- **Normal**: 300ms - State transitions
- **Slow**: 500ms - Page transitions, complex animations
- **Slower**: 700ms - Orchestrated sequences

### Animation Patterns

#### Specialist Status Transitions
```css
@keyframes specialist-activate {
  0% { 
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% { 
    transform: scale(1.02);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}
```

#### Progress Bar Fill
```css
@keyframes progress-fill {
  from { 
    width: 0%;
    opacity: 0.8;
  }
  to { 
    width: var(--progress);
    opacity: 1;
  }
}
```

#### Pulse Animation for Active States
```css
@keyframes pulse {
  0%, 100% { 
    opacity: 1;
  }
  50% { 
    opacity: 0.6;
  }
}
```

## Interactive States

### Button States
- **Default**: Base colors, subtle shadow
- **Hover**: 10% darker, elevated shadow, cursor pointer
- **Active**: 20% darker, compressed shadow, scale(0.98)
- **Disabled**: 50% opacity, no shadow, cursor not-allowed
- **Loading**: Pulsing animation, spinner icon

### Input States
- **Default**: Gray border, white background
- **Focus**: Blue border, blue glow, elevated
- **Error**: Red border, red glow, error icon
- **Success**: Green border, green accent, check icon
- **Disabled**: Gray background, 50% opacity

## Iconography

### Medical Icon Set
- **Size**: 24px default, 16px small, 32px large
- **Style**: 2px stroke, rounded caps
- **Colors**: Inherit from parent or specialist colors

### Icon Usage
- **Cardiology**: Heart icon
- **Laboratory**: Microscope icon
- **Endocrinology**: Pills icon
- **Data Analysis**: Chart icon
- **Preventive**: Shield icon
- **Pharmacy**: Syringe icon
- **Nutrition**: Apple icon
- **General Practice**: Stethoscope icon

## Layout Principles

### 3-Panel Responsive Grid
```css
.app-layout {
  display: grid;
  grid-template-columns: 280px 1fr 400px;
  gap: 0;
  height: 100vh;
}

/* Tablet */
@media (max-width: 1024px) {
  .app-layout {
    grid-template-columns: 1fr 400px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
```

### Content Hierarchy
1. **Primary Actions**: Blue CTAs, prominent placement
2. **Secondary Actions**: Ghost buttons, supporting position
3. **Tertiary Actions**: Text links, minimal emphasis

## Motion Design

### Page Transitions
- **Slide**: Panels slide in from edges
- **Fade**: Content cross-fades
- **Scale**: Modals scale in from center
- **Reveal**: Progressive content disclosure

### Micro-interactions
- **Hover Effects**: Subtle elevation and color shift
- **Click Feedback**: Scale and ripple effects
- **Loading States**: Skeleton screens and progress indicators
- **Success States**: Check mark animations

## Accessibility Guidelines

### Color Contrast
- **Normal Text**: 4.5:1 minimum (WCAG AA)
- **Large Text**: 3:1 minimum
- **Interactive Elements**: 3:1 minimum
- **Focus Indicators**: 3:1 against adjacent colors

### Keyboard Navigation
- **Tab Order**: Logical left-to-right, top-to-bottom
- **Focus States**: Visible blue outline, 2px offset
- **Skip Links**: Hidden but accessible
- **Keyboard Shortcuts**: Documented and customizable

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Real-time updates announced
- **Alt Text**: Meaningful descriptions for all images

### Motion Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Dark Mode Considerations

### Dark Palette
```css
:root[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --border: #334155;
}
```

### Specialist Colors (Dark Mode)
- Reduce saturation by 20%
- Increase lightness by 10%
- Maintain recognizability

## Design Tokens

### CSS Custom Properties
```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-border: #E5E7EB;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-out;
}