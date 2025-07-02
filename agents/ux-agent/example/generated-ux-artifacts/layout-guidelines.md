# Layout Guidelines: Health Insight Assistant

## Desktop Layouts (1200px+)

### Three-Panel Layout
The primary desktop experience uses a fixed three-panel layout optimized for comprehensive health analysis.

#### Panel Dimensions
- **Left Sidebar**: 280px fixed width
  - Min-width: 240px
  - Max-width: 320px (if resizable)
  - Height: 100vh - header height
  
- **Center Panel**: Flexible width
  - Min-width: 600px
  - Max-width: 1200px (content max-width: 800px)
  - Flex-grow: 1
  
- **Right Panel**: 400px flexible width
  - Min-width: 360px
  - Max-width: 480px
  - Collapsible on demand

#### Spacing Rules
```css
/* Global spacing variables */
--panel-padding: 24px;
--section-gap: 24px;
--card-padding: 16px;
--inline-gap: 12px;
```

### Header Layout
- **Height**: 60px fixed
- **Padding**: 0 24px
- **Z-index**: 1000 (always on top)
- **Position**: Sticky top

### Content Areas

#### Left Panel Structure
```
┌─────────────────────────┐
│ New Conversation Button │ 16px margin
├─────────────────────────┤
│ Search Input            │ 16px margin
├─────────────────────────┤
│ Conversation Tabs       │ No margin
├─────────────────────────┤
│ Conversation List       │ 8px padding
│ ├─ Item 1              │ 4px gap
│ ├─ Item 2              │
│ └─ Item 3              │
└─────────────────────────┘
```

#### Center Panel Structure
```
┌─────────────────────────┐
│ Chat Messages Area      │ 24px padding
│ ├─ Message 1           │ 24px gap
│ ├─ Message 2           │
│ └─ Message 3           │
├─────────────────────────┤
│ Input Section          │ 16px padding
└─────────────────────────┘
```

#### Right Panel Structure
```
┌─────────────────────────┐
│ Tab Navigation         │ No padding
├─────────────────────────┤
│ Panel Content          │ 20px padding
│ ├─ Query Selector      │ 20px margin-bottom
│ ├─ Team Section        │ 24px margin-bottom
│ └─ Results Section     │
└─────────────────────────┘
```

## Tablet Layouts (768px - 1199px)

### Two-Panel Layout
On tablets, hide the left sidebar to maximize content space.

#### Layout Changes
- **Left Panel**: Hidden (accessible via hamburger menu)
- **Center Panel**: Flexible width (min: 480px)
- **Right Panel**: 360px fixed or overlay

#### Adaptive Behaviors
```css
@media (max-width: 1199px) and (min-width: 768px) {
  .main-container {
    grid-template-columns: 1fr 360px;
  }
  
  .left-panel {
    position: fixed;
    left: -280px;
    transition: left 0.3s ease;
    z-index: 999;
  }
  
  .left-panel.open {
    left: 0;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    padding: 0 16px;
  }
}
```

### Touch Optimizations
- **Minimum touch target**: 44x44px
- **Increased padding**: +4px on interactive elements
- **Swipe gestures**: 
  - Swipe right: Open left panel
  - Swipe left: Close panels
  - Swipe up/down: Scroll

## Mobile Layouts (<768px)

### Single Panel Layout
Mobile displays one panel at a time with navigation between panels.

#### Panel States
1. **Chat View** (default)
   - Full screen chat interface
   - Floating action button for new conversation
   - Bottom input bar

2. **Conversations View**
   - Full screen conversation list
   - Search at top
   - Tab navigation below search

3. **Medical Team View**
   - Slide-up panel or full screen
   - Dismissible with swipe down
   - Tab navigation for sections

#### Mobile-Specific Components
```css
/* Bottom Navigation */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-around;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 72px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Stack Order (Mobile)
```
┌─────────────────────────┐
│ Header (56px)          │
├─────────────────────────┤
│                        │
│ Active Panel           │
│ (Full height - header  │
│  - bottom nav)         │
│                        │
├─────────────────────────┤
│ Bottom Nav (56px)      │
└─────────────────────────┘
```

## Breakpoints

### Core Breakpoints
```scss
$mobile: 320px;      // Minimum supported
$mobile-lg: 480px;   // Larger phones
$tablet: 768px;      // Tablets
$desktop: 1024px;    // Small desktop
$desktop-lg: 1200px; // Standard desktop
$desktop-xl: 1440px; // Large desktop
$desktop-2xl: 1920px; // Extra large
```

### Breakpoint Behaviors

#### 320px - 479px (Mobile)
- Single column layout
- Stacked components
- 16px side margins
- Simplified navigation

#### 480px - 767px (Mobile Large)
- Slightly larger touch targets
- 20px side margins
- Two-column grid for specialist cards

#### 768px - 1023px (Tablet)
- Two-panel layout possible
- Overlay patterns for third panel
- Grid layouts for cards

#### 1024px - 1199px (Desktop Small)
- Full three-panel layout
- Reduced panel widths
- Compact mode for some components

#### 1200px - 1439px (Desktop Standard)
- Optimal three-panel layout
- Full-featured interface
- Standard spacing

#### 1440px+ (Desktop Large)
- Increased center panel max-width
- More spacious layout
- Enhanced visualizations

## Responsive Grid System

### Grid Structure
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1200px) {
  .container { 
    max-width: 1440px;
    padding: 0 32px;
  }
}

/* Flexible Grid */
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

### Column System
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns
- **Gap**: 16px (mobile), 24px (desktop)

## Z-Index Scale

Maintain consistent layering across the application:

```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-notification: 600;
  --z-tooltip: 700;
}
```

### Layer Assignment
1. **Base Content**: 0-99
2. **Dropdowns/Menus**: 100-199
3. **Sticky Elements**: 200-299
4. **Fixed Panels**: 300-399
5. **Modal Backdrop**: 400-499
6. **Modals**: 500-599
7. **Notifications**: 600-699
8. **Tooltips**: 700+

## Scrolling Behavior

### Panel-Specific Scrolling
```css
/* Independent scroll containers */
.left-panel,
.chat-messages,
.panel-content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Prevent body scroll when panels open */
body.panel-open {
  overflow: hidden;
}
```

### Scroll Persistence
- Maintain scroll position when switching conversations
- Auto-scroll to new messages in chat
- Preserve panel scroll state during navigation

## Performance Considerations

### Layout Optimization
1. **Use CSS Grid** for main layout (better performance than flexbox for complex layouts)
2. **Avoid layout thrashing** by batching DOM updates
3. **Use `transform` and `opacity`** for animations (GPU accelerated)
4. **Implement virtual scrolling** for long lists
5. **Lazy load** heavy components

### Critical CSS
```css
/* Inline critical layout CSS */
.main-container {
  display: grid;
  grid-template-columns: 280px 1fr 400px;
  height: calc(100vh - 60px);
}

@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 1fr 360px;
  }
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
  }
}
```

## Accessibility Layout Considerations

### Focus Management
- **Skip Links**: Hidden but accessible navigation
- **Focus Trap**: Keep focus within modals/panels
- **Focus Indicators**: 2px solid outline with 2px offset

### Landmark Regions
```html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
```

### Responsive Text
```css
/* Fluid typography */
:root {
  --text-scale: clamp(0.875rem, 2vw, 1rem);
}

body {
  font-size: var(--text-scale);
}
```

## Print Layout

### Print-Specific Rules
```css
@media print {
  .header,
  .left-panel,
  .right-panel,
  .input-section {
    display: none;
  }
  
  .center-panel {
    width: 100%;
    max-width: none;
  }
  
  .message {
    break-inside: avoid;
  }
}
```

## Implementation Checklist

### Desktop Implementation
- [ ] Three-panel grid layout
- [ ] Flexible center panel
- [ ] Collapsible right panel
- [ ] Resizable panels (optional)
- [ ] Proper spacing and padding

### Tablet Implementation
- [ ] Two-panel layout
- [ ] Hamburger menu for left panel
- [ ] Slide-over animations
- [ ] Touch-optimized targets
- [ ] Responsive typography

### Mobile Implementation
- [ ] Single panel views
- [ ] Bottom navigation
- [ ] Swipe gestures
- [ ] Floating action button
- [ ] Full-screen modals

### Cross-Device
- [ ] Smooth transitions between breakpoints
- [ ] Consistent spacing scale
- [ ] Preserved functionality
- [ ] Optimized performance
- [ ] Accessibility maintained