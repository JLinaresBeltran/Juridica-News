# Layout Guidelines: Multi-Agent Health Insight System

## Desktop Layouts (1200px+)

### Three-Panel Layout
The primary layout for desktop consists of three distinct panels:

```
┌─────────┬────────────────────────┬───────────┐
│ Sidebar │    Center (Chat)       │   Right   │
│  280px  │      Flexible          │   400px   │
│         │    (min 600px)         │ (flexible)│
└─────────┴────────────────────────┴───────────┘
```

#### Panel Specifications
- **Left Sidebar**: 280px fixed width
  - Collapsible to 60px (icon-only mode)
  - Contains: Conversation threads, search, navigation
  - Resizable: No

- **Center Panel**: Flexible width
  - Minimum: 600px
  - Maximum: Fills available space
  - Contains: Chat interface, query input
  - Resizable: Automatic

- **Right Panel**: 400px flexible
  - Minimum: 300px
  - Maximum: 600px
  - Contains: Medical team status OR visualizations
  - Resizable: Drag border to resize

#### Panel Behaviors
- All panels maintain consistent height (100vh - header height)
- Panels can be collapsed/expanded via toggle buttons
- Smooth transitions (300ms) for panel state changes
- Focus remains in center panel when side panels toggle

## Tablet Layouts (768px - 1199px)

### Adaptive Two-Panel Layout
```
┌────┬──────────────────────────┐
│ 60 │    Center + Right        │
│ px │     (Combined)           │
└────┴──────────────────────────┘
```

#### Tablet Adjustments
- Left sidebar auto-collapses to icon-only (60px)
- Right panel becomes a tabbed overlay
- Center panel expands to use available space
- Toggle button to show/hide right panel

## Mobile Layouts (<768px)

### Stack Order and Behavior
```
┌────────────────────┐
│      Header        │
├────────────────────┤
│    Chat View       │
│                    │
│                    │
├────────────────────┤
│  Bottom Navigation │
└────────────────────┘
```

#### Mobile-Specific Changes
1. **Navigation**: Bottom tab bar replaces sidebar
2. **Right Panel**: Full-screen modal when activated
3. **Chat**: Full width with reduced padding
4. **Medical Team**: Simplified card view
5. **Visualizations**: Optimized for touch and scroll

## Breakpoints

### Core Breakpoints
```css
/* Mobile First Approach */
--breakpoint-mobile: 320px;    /* Minimum supported */
--breakpoint-tablet: 768px;    /* iPad portrait */
--breakpoint-desktop: 1200px;  /* Standard desktop */
--breakpoint-large: 1920px;    /* Large monitors */
```

### Component-Specific Breakpoints
- **Navigation**: Switches at 768px
- **Medical Team**: Simplifies at 1024px
- **Visualizations**: Stacks at 768px
- **Typography**: Scales at each breakpoint

## Grid System

### 12-Column Grid
```css
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-lg);
  padding: 0 var(--space-lg);
  max-width: 1400px;
  margin: 0 auto;
}
```

### Column Spans by Breakpoint
| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Hidden | 1 col | 3 cols |
| Chat | 12 cols | 8 cols | 6 cols |
| Right Panel | Modal | 3 cols | 3 cols |

## Spacing Guidelines

### Responsive Padding
```css
/* Mobile */
--padding-mobile: 16px;

/* Tablet */
--padding-tablet: 24px;

/* Desktop */
--padding-desktop: 32px;
```

### Safe Areas
- Account for device notches and rounded corners
- Minimum 16px padding on all sides
- Extra padding for bottom navigation on mobile

## Component Layout Rules

### Chat Messages
- **Desktop**: Max-width 800px, centered in panel
- **Tablet**: Full panel width with 24px padding
- **Mobile**: Full width with 16px padding

### Medical Team Visualization
- **Desktop**: Fixed 250px height circular layout
- **Tablet**: 200px height, simplified connections
- **Mobile**: Linear list view, no visualization

### Specialist Cards
- **Desktop**: Horizontal layout with all details
- **Tablet**: Compressed horizontal layout
- **Mobile**: Vertical stack with expandable details

### Visualizations
- **Desktop**: Full panel width, 400px+ height
- **Tablet**: Responsive height, touch-optimized
- **Mobile**: Full screen with pan/zoom

## Scroll Behavior

### Panel Scroll Rules
1. **Sidebar**: Independent scroll for conversation list
2. **Chat**: Main scroll area, auto-scroll on new messages
3. **Right Panel**: Independent scroll for content
4. **Mobile**: Page-level scroll with sticky headers

### Scroll Indicators
- Show scroll shadows at top/bottom of scrollable areas
- Smooth scroll animations (300ms)
- Scroll-to-top button appears after 200px scroll

## Z-Index Hierarchy

```css
--z-header: 100;
--z-sidebar: 90;
--z-modal: 200;
--z-dropdown: 110;
--z-tooltip: 300;
--z-notification: 400;
```

## Touch Targets

### Minimum Sizes
- **Buttons**: 44x44px minimum
- **Links**: 44px height with adequate spacing
- **Form inputs**: 44px height minimum
- **Tab targets**: 48px height for bottom nav

### Touch Gestures
- **Swipe right**: Open sidebar (mobile)
- **Swipe left**: Close sidebar (mobile)
- **Pinch**: Zoom visualizations
- **Long press**: Show context menu

## Performance Considerations

### Layout Optimization
1. Use CSS Grid and Flexbox over absolute positioning
2. Minimize reflows with fixed dimensions where possible
3. Use `transform` for panel animations, not `width`
4. Implement virtual scrolling for long conversation lists

### Responsive Images
```html
<picture>
  <source media="(max-width: 768px)" srcset="image-mobile.jpg">
  <source media="(max-width: 1200px)" srcset="image-tablet.jpg">
  <img src="image-desktop.jpg" alt="Description">
</picture>
```

## Accessibility in Layouts

### Focus Management
- Trap focus in modals on mobile
- Skip links for keyboard navigation
- Logical tab order across panels
- Return focus after panel toggles

### Screen Reader Considerations
- Landmark regions for each panel
- Announce panel state changes
- Descriptive headings for sections
- Hidden but accessible panel toggle labels

## Print Layouts

### Print-Specific Rules
```css
@media print {
  /* Hide sidebars and navigation */
  .sidebar, .right-panel { display: none; }
  
  /* Full width for content */
  .center-panel { width: 100%; }
  
  /* Show all messages */
  .chat-messages { height: auto; }
  
  /* Print-friendly colors */
  * { background: white !important; }
}
```

## Framework Integration

### React Considerations
- Use React.memo for panel components
- Implement ResizeObserver for dynamic layouts
- Use CSS modules or styled-components for scoping
- Lazy load right panel content

### CSS Architecture
```css
/* Layout utilities */
.layout-three-panel { }
.layout-sidebar-collapsed { }
.layout-right-panel-hidden { }
.layout-mobile { }
.layout-tablet { }
.layout-desktop { }
```

## Testing Guidelines

### Devices to Test
1. **Mobile**: iPhone 12/13, Samsung Galaxy S21
2. **Tablet**: iPad Air, iPad Pro 11"
3. **Desktop**: 1366x768, 1920x1080, 2560x1440
4. **Accessibility**: Test with zoom 200%

### Key Test Scenarios
- Panel collapse/expand at each breakpoint
- Orientation changes on tablets
- Keyboard navigation across panels
- Long content in each panel
- RTL language support