# Layout Guidelines: Health Insight Assistant

## Desktop Layouts (1200px+)

### Three-Panel Layout
The primary interface uses a sophisticated three-panel layout optimized for comprehensive health analysis.

#### Panel Dimensions
- **Left Sidebar**: 280px fixed width
  - Min-width: 240px (when resizable)
  - Max-width: 360px (when resizable)
- **Center Panel**: Flexible (min 600px)
  - Ideal: 720px - 960px
  - Takes remaining space after sidebars
- **Right Panel**: 400px flexible
  - Min-width: 360px
  - Max-width: 480px
  - Can expand to 600px for complex visualizations

#### Panel Hierarchy
1. **Left Panel (Navigation)**
   - Always visible on desktop
   - Houses conversation threads
   - Quick access to health topics

2. **Center Panel (Primary Content)**
   - Main interaction area
   - Chat interface
   - Query responses

3. **Right Panel (Context)**
   - Dynamic content based on query
   - Medical team status
   - Visualizations
   - Analysis results

### Header Layout
- **Height**: 64px fixed
- **Z-index**: 100 (above panels)
- **Position**: Sticky top
- **Content**: Logo | Title | Status | User Info

### Welcome Page Layout
- **Single Column**: Max-width 1200px, centered
- **Three Columns**: For feature cards (400px each)
- **Hero Section**: 480px height with CMO introduction
- **Example Queries**: 2-column grid on sides

## Tablet Layouts (768px - 1199px)

### Adaptive Three-Panel
- **Left Panel**: Collapsed to icon-only mode (64px)
- **Center Panel**: Dominant, takes most space
- **Right Panel**: Overlay/modal when activated

### Alternative Two-Panel Mode
- **Left Panel**: Hidden, accessible via hamburger
- **Main Area**: Combined center + right as tabs

### Touch Optimizations
- **Minimum Touch Target**: 44x44px
- **Swipe Gestures**: 
  - Left edge: Open navigation
  - Right edge: Open context panel
- **Panel Transitions**: Slide animations

## Mobile Layouts (<768px)

### Stack Order (Top to Bottom)
1. **Header**: Condensed to 56px
2. **Active Panel**: Full width
3. **Bottom Navigation**: Tab bar for panel switching

### Mobile-Specific Changes
- **Panels**: Full-screen with transitions
- **Navigation**: Bottom tab bar
- **Chat Input**: Fixed bottom position
- **Visualizations**: Scroll horizontally

### Panel States
- **Default**: Show center panel (chat)
- **Navigation**: Slide in from left
- **Context**: Slide in from right
- **Transitions**: 300ms ease-out

## Breakpoints

### Mobile First Approach
```css
/* Base (Mobile) */
@media (min-width: 0px) {
  /* Stack all panels */
  /* Bottom navigation */
  /* Condensed header */
}

/* Tablet */
@media (min-width: 768px) {
  /* Two-panel layout */
  /* Collapsible sidebar */
  /* Modal overlays */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Three-panel layout */
  /* Fixed sidebars */
  /* Full header */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* Wider panels */
  /* Additional breathing room */
  /* Enhanced visualizations */
}

/* Extra Large */
@media (min-width: 1920px) {
  /* Maximum content width */
  /* Centered with margins */
  /* Luxury spacing */
}
```

## Grid Systems

### 12-Column Grid
- **Mobile**: 1 column
- **Tablet**: 6 columns
- **Desktop**: 12 columns
- **Gutter**: 16px (mobile), 24px (desktop)

### Component Grids
- **Specialist Cards**: 2x2 grid (desktop), 2x1 (tablet), 1x1 (mobile)
- **Example Queries**: 2 columns (desktop), 1 column (mobile)
- **Metric Cards**: 4 columns (desktop), 2 columns (tablet/mobile)
- **Feature Cards**: 3 columns (desktop), 1 column (mobile)

## Flexible Components

### Responsive Tables
- **Desktop**: Full table display
- **Tablet**: Reduce columns, horizontal scroll
- **Mobile**: Card-based layout

### Charts and Visualizations
- **Desktop**: Full interactive features
- **Tablet**: Touch-optimized, slightly condensed
- **Mobile**: Simplified, swipeable

### Form Elements
- **Desktop**: Inline labels, multi-column
- **Mobile**: Stacked labels, full-width inputs

## Layout Patterns

### Progressive Disclosure
1. **Mobile**: Essential information only
2. **Tablet**: Add secondary details
3. **Desktop**: Full information hierarchy

### Content Priority
1. **Primary**: Always visible
2. **Secondary**: Visible on tablet+
3. **Tertiary**: Desktop only

### Navigation Patterns
- **Mobile**: Bottom tabs + hamburger
- **Tablet**: Collapsed sidebar + icons
- **Desktop**: Full sidebar + labels

## Panel Behaviors

### Resizing
- **Desktop Only**: Drag borders to resize
- **Constraints**: Respect min/max widths
- **Persistence**: Remember user preferences

### Collapsing
- **Left Panel**: Collapse to icons (64px)
- **Right Panel**: Hide completely or minimize
- **Keyboard**: Shortcuts for panel toggling

### Focus Management
- **Tab Order**: Left → Center → Right
- **Panel Switch**: Maintain focus position
- **Escape Key**: Return to main content

## Special Layouts

### Full-Screen Mode
- **Visualizations**: Expand to viewport
- **Hide Panels**: Temporary full-screen
- **Exit**: Escape key or close button

### Comparison View
- **Split Center**: Two columns for before/after
- **Synced Scroll**: Coordinate scrolling
- **Mobile**: Stack vertically with tabs

### Print Layout
- **Hide Navigation**: Remove interactive elements
- **Single Column**: Optimize for paper
- **Page Breaks**: Logical content sections

## Performance Considerations

### Lazy Loading
- **Off-screen Panels**: Don't render until needed
- **Virtualization**: Long conversation lists
- **Progressive Enhancement**: Core functionality first

### Responsive Images
```html
<img srcset="chart-mobile.png 320w,
             chart-tablet.png 768w,
             chart-desktop.png 1200w"
     sizes="(max-width: 767px) 100vw,
            (max-width: 1199px) 50vw,
            400px"
     src="chart-desktop.png"
     alt="Health trend chart">
```

### CSS Grid vs Flexbox
- **Grid**: Complex layouts, panel systems
- **Flexbox**: Component layouts, alignment
- **Combination**: Best of both approaches

## Accessibility in Layouts

### Landmark Regions
```html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
```

### Skip Links
```html
<a href="#main" class="skip-link">Skip to main content</a>
<a href="#nav" class="skip-link">Skip to navigation</a>
```

### Responsive Text
```css
/* Fluid typography */
font-size: clamp(14px, 2vw, 18px);
line-height: clamp(1.4, 1.5, 1.6);
```

## Implementation Examples

### Three-Panel CSS Grid
```css
.app-layout {
  display: grid;
  grid-template-columns: 280px 1fr 400px;
  height: calc(100vh - 64px);
  gap: 0;
}

@media (max-width: 1199px) {
  .app-layout {
    grid-template-columns: 64px 1fr;
  }
  
  .right-panel {
    position: fixed;
    right: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
  }
  
  .right-panel.open {
    transform: translateX(0);
  }
}

@media (max-width: 767px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
  
  .panel {
    position: fixed;
    width: 100%;
    height: 100%;
  }
}
```

### Responsive Padding
```css
.panel {
  padding: 24px;
}

@media (max-width: 767px) {
  .panel {
    padding: 16px;
  }
}

.card {
  padding: clamp(16px, 3vw, 24px);
}
```

## Testing Guidelines

### Device Testing
1. **Mobile**: iPhone SE (375px) to Pro Max (430px)
2. **Tablet**: iPad Mini (768px) to Pro (1024px)
3. **Desktop**: 1280px, 1440px, 1920px monitors

### Orientation Testing
- Portrait and landscape modes
- Orientation change handling
- Maintain state during rotation

### Browser Testing
- Chrome, Safari, Firefox, Edge
- Mobile browsers
- PWA considerations