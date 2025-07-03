# Design System: Health Insight Assistant

## Brand Principles

### Core Design Values
- **Trust Through Transparency**: Show real-time progress and specialist involvement
- **Medical Professionalism**: Clinical accuracy with human warmth
- **Progressive Complexity**: Simple entry points leading to rich insights
- **Responsive Intelligence**: Adapt UI based on query complexity
- **Accessible Expertise**: Make medical data understandable

## Color Palette

### Primary Colors
- **Primary Blue**: `#3B82F6` - Main brand color, CTAs, active states
- **Primary Light**: `#60A5FA` - Hover states, highlights
- **Primary Dark**: `#2563EB` - Pressed states, emphasis
- **Pure White**: `#FFFFFF` - Primary backgrounds, cards

### Medical Specialist Colors
Each specialist has a unique, instantly recognizable color:

- **Cardiology (Dr. Heart)**: `#EF4444` - Vibrant red for heart health
- **Laboratory Medicine (Dr. Lab)**: `#10B981` - Fresh green for test results
- **Endocrinology (Dr. Hormone)**: `#8B5CF6` - Rich purple for hormones
- **Data Analysis (Dr. Analytics)**: `#F59E0B` - Bright yellow for insights
- **Preventive Medicine (Dr. Prevention)**: `#F97316` - Orange for prevention
- **Pharmacy (Dr. Pharma)**: `#FB923C` - Light orange for medications
- **Nutrition (Dr. Nutrition)**: `#84CC16` - Lime green for diet
- **General Practice (Dr. Vitality/CMO)**: `#06B6D4` - Cyan for coordination

### Semantic Colors
- **Success**: `#10B981` - Positive results, completed states
- **Warning**: `#F59E0B` - Attention needed, moderate risk
- **Error**: `#EF4444` - Critical values, errors
- **Info**: `#3B82F6` - General information, tips

### Neutral Palette
- **Gray 50**: `#F9FAFB` - Subtle backgrounds
- **Gray 100**: `#F3F4F6` - Light backgrounds
- **Gray 200**: `#E5E7EB` - Borders, dividers
- **Gray 300**: `#D1D5DB` - Disabled borders
- **Gray 400**: `#9CA3AF` - Placeholder text
- **Gray 500**: `#6B7280` - Secondary text
- **Gray 600**: `#4B5563` - Primary text alternative
- **Gray 700**: `#374151` - Strong text
- **Gray 800**: `#1F2937` - Headings
- **Gray 900**: `#111827` - Primary text

### Special Effects
- **Glass Background**: `rgba(255, 255, 255, 0.8)`
- **Glass Border**: `rgba(255, 255, 255, 0.3)`
- **Shadow Blue**: `rgba(59, 130, 246, 0.1)`
- **Overlay Dark**: `rgba(0, 0, 0, 0.5)`

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", 
             "Segoe UI Emoji", "Segoe UI Symbol";
```

### Type Scale
| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| Display | 32px | 40px | 700 | Welcome headers |
| H1 | 24px | 32px | 600 | Page titles |
| H2 | 20px | 28px | 600 | Section headers |
| H3 | 18px | 24px | 600 | Subsections |
| H4 | 16px | 24px | 600 | Card titles |
| Body Large | 16px | 24px | 400 | Introductions |
| Body | 14px | 20px | 400 | General content |
| Small | 12px | 16px | 400 | Captions, labels |
| Micro | 11px | 14px | 400 | Timestamps, meta |

### Medical Text Hierarchy
- **Query Text**: 16px, medium weight - User questions
- **CMO Messages**: 15px, regular - Chief Medical Officer
- **Specialist Updates**: 14px, regular - Progress messages
- **Analysis Results**: 14px with 16px for key findings
- **Metadata**: 12px, gray-500 - Timestamps, confidence

## Spacing System

### Base Grid: 8px
- `xs`: 4px - Tight grouping
- `sm`: 8px - Related elements
- `md`: 16px - Standard spacing
- `lg`: 24px - Section breaks
- `xl`: 32px - Major sections
- `2xl`: 48px - Panel gaps
- `3xl`: 64px - Page margins

### Component Spacing
- **Card Padding**: 16px (mobile) / 24px (desktop)
- **Panel Padding**: 24px
- **List Item Gap**: 12px
- **Button Padding**: 12px 24px
- **Input Padding**: 12px 16px
- **Icon Margin**: 8px

## Elevation & Shadows

### Shadow Scale
```css
/* Subtle - for cards and panels */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 
             0 1px 2px rgba(0, 0, 0, 0.06);

/* Medium - for dropdowns and modals */
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 
             0 2px 4px rgba(0, 0, 0, 0.06);

/* Strong - for popovers */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 
             0 4px 6px rgba(0, 0, 0, 0.05);

/* Glow - for active specialists */
--shadow-glow: 0 0 20px rgba(59, 130, 246, 0.3);
```

### Glassmorphism Effects
```css
/* Glass Panel */
.glass-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## Border Radius

### Radius Scale
- **Sm**: 6px - Buttons, inputs
- **Default**: 8px - Cards, dropdowns
- **Md**: 12px - Panels, modals
- **Lg**: 16px - Large cards
- **Full**: 9999px - Pills, badges
- **Circle**: 50% - Avatars, icons

### Component Radii
- **Buttons**: 8px
- **Cards**: 12px
- **Panels**: 16px
- **Inputs**: 8px
- **Specialist Badges**: 24px
- **Progress Bars**: 4px
- **Tooltips**: 6px

## Animation Principles

### Timing Functions
```css
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Scale
- **Instant**: 100ms - Hover color changes
- **Fast**: 150ms - Hover states, small transitions
- **Normal**: 300ms - Most animations
- **Slow**: 500ms - Panel slides, complex transitions
- **Slower**: 700ms - Page transitions

### Animation Types
1. **Micro-interactions**: Button hovers, input focus
2. **State Changes**: Progress updates, status indicators
3. **Panel Transitions**: Sliding panels, tab switches
4. **Loading States**: Skeleton screens, progress bars
5. **Data Visualizations**: Chart animations, data updates

## Layout System

### Container Widths
- **Max Width**: 1920px
- **Content Max**: 1440px
- **Reading Max**: 720px (for text-heavy content)

### Panel Dimensions
- **Left Sidebar**: 280px fixed (desktop), full-width (mobile)
- **Center Panel**: Flexible, min 600px (desktop)
- **Right Panel**: 400px flexible (desktop), full-width (mobile)

### Breakpoints
- **Mobile**: 0 - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large**: 1440px+

## Component Design Tokens

### Buttons
```css
--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 48px;
--button-padding-x: 24px;
--button-font-weight: 500;
--button-transition: all 150ms ease-out;
```

### Inputs
```css
--input-height: 40px;
--input-padding-x: 16px;
--input-border-width: 1px;
--input-border-radius: 8px;
--input-font-size: 14px;
```

### Cards
```css
--card-padding: 24px;
--card-border-radius: 12px;
--card-shadow: var(--shadow-sm);
--card-border: 1px solid var(--gray-200);
```

### Medical Team Components
```css
--specialist-avatar-size: 48px;
--specialist-badge-height: 24px;
--progress-bar-height: 4px;
--status-dot-size: 8px;
--confidence-badge-height: 20px;
```

## Iconography

### Icon Specifications
- **Size**: 16px, 20px, 24px (default), 32px
- **Stroke Width**: 2px
- **Style**: Outlined, rounded corners
- **Color**: Inherit from parent

### Medical Icon Set
- **CMO**: Stethoscope in circle
- **Cardiology**: Heart with pulse line
- **Laboratory**: Microscope
- **Endocrinology**: Pills/capsules
- **Data Analysis**: Line chart
- **Preventive**: Shield with checkmark
- **Pharmacy**: Medicine bottle
- **Nutrition**: Apple
- **General**: Stethoscope

### UI Icons
- **Send**: Arrow right
- **New Chat**: Plus in square
- **Settings**: Gear
- **Search**: Magnifying glass
- **Close**: X mark
- **Expand**: Arrows pointing out
- **Collapse**: Arrows pointing in
- **Info**: Information circle
- **Success**: Check circle
- **Warning**: Exclamation triangle
- **Error**: X circle

## Accessibility Standards

### Color Contrast
- **Normal Text**: 4.5:1 minimum (AA)
- **Large Text**: 3:1 minimum (AA)
- **Interactive**: 3:1 minimum
- **Focus Indicators**: 3:1 minimum

### Focus States
```css
--focus-ring: 0 0 0 2px var(--white), 
              0 0 0 4px var(--primary);
--focus-ring-offset: 2px;
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Dark Mode Considerations

### Dark Palette (Future)
```css
--dark-bg: #0F172A;
--dark-surface: #1E293B;
--dark-border: #334155;
--dark-text: #F1F5F9;
--dark-text-secondary: #CBD5E1;
```

## Usage Guidelines

### Color Application
1. **Primary Blue**: Main CTAs, active navigation, links
2. **Specialist Colors**: Only for specialist identification
3. **Semantic Colors**: Status and feedback only
4. **Neutrals**: UI structure and content

### Typography Rules
1. Maintain clear hierarchy
2. Limit to 2-3 font sizes per section
3. Use weight for emphasis, not size
4. Ensure adequate line spacing for readability

### Spacing Principles
1. Use consistent spacing multiples
2. Group related elements tightly
3. Create clear visual sections
4. Balance density with breathing room

### Animation Guidelines
1. Animate with purpose
2. Keep durations snappy
3. Use easing for natural motion
4. Respect reduced motion preferences
5. Ensure animations don't block interaction