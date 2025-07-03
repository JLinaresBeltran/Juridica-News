# Design System: Multi-Agent Health Insight System

## Brand Principles
- **Trustworthy**: Medical-grade accuracy with transparent processes
- **Intelligent**: Showcase AI orchestration without overwhelming users
- **Accessible**: Complex insights made simple and actionable
- **Professional**: Clinical expertise with a human touch
- **Responsive**: Real-time analysis with adaptive interactions

## Color Palette

### Primary Colors
- Primary: `#3B82F6` - Trust, stability, medical professionalism
- Primary Light: `#60A5FA` - Hover states, highlights
- Primary Dark: `#2563EB` - Active states, emphasis
- Pure White: `#FFFFFF` - Primary backgrounds, cards

### Medical Specialist Colors
Each specialist has a unique color for instant recognition:
- **Cardiology (Dr. Heart)**: `#EF4444` - Heart health
- **Laboratory (Dr. Lab)**: `#10B981` - Test results  
- **Endocrinology (Dr. Hormone)**: `#8B5CF6` - Hormones
- **Data Analysis (Dr. Analytics)**: `#F59E0B` - Analytics
- **Preventive (Dr. Prevention)**: `#F97316` - Prevention
- **Pharmacy (Dr. Pharma)**: `#FB923C` - Medications
- **Nutrition (Dr. Nutrition)**: `#84CC16` - Diet
- **General Practice (Dr. Vitality/CMO)**: `#06B6D4` - Overall care

### Semantic Colors
- Success Green: `#10B981` - Normal ranges, positive outcomes
- Warning Amber: `#F59E0B` - Attention needed, borderline values
- Error Red: `#EF4444` - Critical values, urgent attention
- Info Blue: `#3B82F6` - General information, tips

### Neutral Colors
- Background Gray: `#F9FAFB` - Page background
- Surface Gray: `#F3F4F6` - Section backgrounds
- Border Gray: `#E5E7EB` - Dividers, borders
- Text Primary: `#111827` - Main content
- Text Secondary: `#6B7280` - Supporting text
- Text Muted: `#9CA3AF` - Timestamps, metadata

## Typography

### Font Families
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### Type Scale
- **Display**: 32px / 40px line-height / 600 weight - Page titles
- **Heading 1**: 24px / 32px line-height / 600 weight - Section headers
- **Heading 2**: 20px / 28px line-height / 600 weight - Subsections
- **Heading 3**: 18px / 24px line-height / 600 weight - Card titles
- **Body Large**: 16px / 24px line-height / 400 weight - Emphasis text
- **Body**: 14px / 20px line-height / 400 weight - Main content
- **Small**: 12px / 16px line-height / 400 weight - Supporting info
- **Micro**: 11px / 14px line-height / 400 weight - Timestamps

## Spacing System
8-point grid system for consistent spacing:
- **xs**: 4px - Inline elements
- **sm**: 8px - Tight spacing
- **md**: 16px - Default spacing
- **lg**: 24px - Section spacing
- **xl**: 32px - Major sections
- **2xl**: 48px - Page sections
- **3xl**: 64px - Hero spacing

## Elevation & Shadows
```css
/* Elevation levels */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Border Radius
- **Small**: 4px - Buttons, inputs
- **Default**: 8px - Cards, containers
- **Large**: 12px - Modal dialogs
- **Full**: 9999px - Pills, badges
- **Circle**: 50% - Avatar, status dots

## Glassmorphism Effects
For modern, premium feel:
```css
/* Glass card effect */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.18);
```

## Animation Principles
- **Duration values**:
  - Fast: 150ms - Micro-interactions
  - Normal: 300ms - Most transitions
  - Slow: 500ms - Complex animations
  - Very Slow: 1000ms - Page transitions

- **Easing functions**:
  - Default: `cubic-bezier(0.4, 0, 0.2, 1)` - ease-out feel
  - Smooth: `cubic-bezier(0.25, 0.1, 0.25, 1)` - natural motion
  - Spring: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - playful bounce

## Medical Team Visual Hierarchy
1. **CMO (Dr. Vitality)** - Central position, larger size
2. **Active Specialists** - Connected with animated lines
3. **Waiting Specialists** - Grayed out, dashed connections
4. **Completed Specialists** - Check mark, solid color

## Component Design Tokens
```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-primary-light: #60A5FA;
  --color-primary-dark: #2563EB;
  
  /* Specialist Colors */
  --color-cardiology: #EF4444;
  --color-laboratory: #10B981;
  --color-endocrinology: #8B5CF6;
  --color-data-analysis: #F59E0B;
  --color-preventive: #F97316;
  --color-pharmacy: #FB923C;
  --color-nutrition: #84CC16;
  --color-general-practice: #06B6D4;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Iconography Guidelines
- Use medical-appropriate icons from Lucide React
- 24px base size for navigation and actions
- 16px for inline icons
- 48px for specialist avatars
- Consistent 2px stroke weight

## Loading States
- **Skeleton screens** for initial content load
- **Pulse animations** on specialist cards during analysis
- **Progress bars** with percentage for transparency
- **Shimmer effects** for data placeholders

## Dark Mode Considerations (Future)
While not in MVP, design with dark mode in mind:
- Use CSS variables for all colors
- Ensure sufficient contrast ratios
- Consider reduced transparency in dark mode
- Adjust shadows for dark backgrounds