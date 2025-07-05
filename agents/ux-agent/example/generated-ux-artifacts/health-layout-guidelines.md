# Health Insight System - Layout Guidelines

## Overview

This document provides comprehensive layout specifications for the Health Insight System's three-panel responsive design, ensuring consistent medical-grade UI across all devices and screen sizes.

## Three-Panel Desktop Layout (CRITICAL)

### Core Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Header (64px fixed)                          │
├────────────┬─────────────────────────────┬─────────────────────────┤
│            │                             │                         │
│  Thread    │      Chat Interface         │   Medical Team/         │
│  Sidebar   │    (Main Content Area)      │   Visualizations       │
│  (300px)   │        (flexible)           │      (400px)           │
│            │                             │                         │
│            │                             │                         │
│ Height:    │      Height: 100%           │    Height: 100%        │
│ 100%       │                             │                         │
│            │                             │                         │
└────────────┴─────────────────────────────┴─────────────────────────┘
```

### Left Panel - Thread Management

**Specifications:**
- Width: 300px (fixed)
- Min-width: 280px
- Max-width: 320px
- Resizable: No (fixed width for consistency)
- Collapsible: Yes (animated collapse to 0px)
- Background: Glass sidebar effect
- Border-right: 1px solid rgba(226, 232, 240, 0.8)
- Padding: 0 (sections have individual padding)
- Overflow: Hidden

**Content Structure:**
```
├─ Action Bar (72px)
│  └─ New Conversation Button (full width)
├─ Search Section (80px)
│  └─ Search Input with Icon
└─ Thread List (calc(100% - 152px))
   ├─ Date Categories
   └─ Thread Items
```

**Scroll Behavior:**
- Thread list: Independent vertical scroll
- Custom scrollbar styling
- Smooth scroll with momentum
- Scroll position persistence

### Center Panel - Main Interface

**Specifications:**
- Width: Flexible (100% of remaining space)
- Min-width: 600px
- Max-width: None (expands as needed)
- Padding: 0 (content areas have padding)
- Background: Transparent (shows gradient)
- Overflow: Hidden

**Content Structure:**
```
├─ Message Area (calc(100% - 120px))
│  ├─ Message List Container
│  └─ Scroll-to-bottom Button
└─ Input Area (120px)
   ├─ Quick Suggestions
   └─ Query Input Component
```

**Primary Functions:**
- Health query conversation display
- Real-time message streaming
- Tool call visualization
- Medical team status updates

**Scroll Behavior:**
- Message area only scrolls
- Auto-scroll on new messages
- Smooth scroll animations
- Maintain scroll position on resize

### Right Panel - Context Panel

**Specifications:**
- Width: 400px (default)
- Min-width: 350px
- Max-width: 600px
- Resizable: Yes (drag handle on left edge)
- Collapsible: Yes
- Background: Glass sidebar effect
- Border-left: 1px solid rgba(226, 232, 240, 0.8)

**Tab Structure:**
```
├─ Tab Bar (48px)
│  ├─ Medical Team Tab
│  └─ Visualizations Tab
├─ Query Selector (64px)
└─ Tab Content (calc(100% - 112px))
   ├─ Medical Team View
   │  ├─ Team Hierarchy (50%)
   │  └─ Analysis Results (50%)
   └─ Visualizations View
      └─ Dynamic Charts
```

**Resizable Sections:**
- Team Hierarchy and Analysis Results have draggable divider
- Default split: 50/50
- Min height: 200px each
- Drag handle: 4px with hover state

### Panel Collapse Behavior

**Left Panel Collapse:**
- Animation: 300ms ease-out
- Direction: Slide left
- Trigger: Collapse button or keyboard shortcut (Cmd/Ctrl + B)
- State persistence in localStorage

**Right Panel Collapse:**
- Animation: 300ms ease-out
- Direction: Slide right
- Trigger: Collapse button or keyboard shortcut (Cmd/Ctrl + I)
- State persistence in localStorage

**Collapsed State Layout:**
```
When left panel collapsed:
- Center panel starts at 0px
- Min-width still enforced (600px)

When right panel collapsed:
- Center panel extends to full width
- Better for focused conversation view
```

## Responsive Breakpoints

### Desktop (1280px+)
- Full three-panel layout
- All panels visible by default
- Drag-to-resize enabled
- Optimal viewing experience

### Large Tablet (1024px - 1279px)
- Three-panel layout maintained
- Right panel defaults to collapsed
- Toggle button to show/hide right panel
- Slightly reduced panel widths

### Tablet (768px - 1023px)
- Two-panel layout (sidebar + main)
- Right panel becomes overlay
- Medical team/viz access via floating button
- Touch-optimized interactions

### Mobile (0px - 767px)
- Single panel view
- Navigation via hamburger menu
- Full-screen panels with back navigation
- Bottom tab bar for quick access

## Mobile Layout Specifications

### Mobile Navigation Structure
```
┌─────────────────────────┐
│   Header (56px)         │
├─────────────────────────┤
│                         │
│   Active Panel          │
│   (100% - 112px)        │
│                         │
├─────────────────────────┤
│   Bottom Tabs (56px)    │
└─────────────────────────┘
```

### Mobile Panel States

**Threads View:**
- Full width
- Search bar sticky at top
- Pull-to-refresh enabled
- Smooth scroll with momentum

**Chat View:**
- Full screen conversation
- Floating medical team button
- Input area docked to bottom
- Virtual keyboard avoidance

**Medical Team View:**
- Full screen overlay
- Close button in header
- Simplified circular layout
- Swipe down to dismiss

**Visualizations View:**
- Full screen charts
- Pinch-to-zoom enabled
- Horizontal scroll for wide charts
- Export options in action bar

## Z-Index Hierarchy

```css
/* Z-index layer system */
--z-base: 0;           /* Default content */
--z-panel: 10;         /* Side panels */
--z-header: 20;        /* Fixed header */
--z-dropdown: 30;      /* Dropdowns, selects */
--z-overlay: 40;       /* Overlays, backdrops */
--z-modal: 50;         /* Modal dialogs */
--z-tooltip: 60;       /* Tooltips */
--z-notification: 70;  /* Toast notifications */
--z-critical: 100;     /* Emergency alerts */
```

## Spacing System

### Panel Spacing
```css
/* Consistent spacing within panels */
--panel-padding: 16px;
--section-gap: 24px;
--item-gap: 8px;
--card-padding: 20px;
```

### Content Spacing
```css
/* Message and content spacing */
--message-gap: 16px;
--bubble-padding: 12px 16px;
--input-padding: 12px;
--button-padding: 8px 16px;
```

## Animation Choreography

### Panel Transitions
1. **Collapse Animation Sequence:**
   - 0ms: Start collapse animation
   - 100ms: Begin content fade
   - 300ms: Complete panel slide
   - 350ms: Finish layout reflow

2. **Resize Animation:**
   - Real-time drag feedback
   - Smooth transition on release
   - Content reflow optimization

### Content Transitions
1. **Message Appearance:**
   - Slide up: 200ms
   - Fade in: 150ms
   - Stagger: 50ms between messages

2. **Tab Switching:**
   - Fade out: 100ms
   - Fade in: 100ms
   - Total: 200ms seamless transition

## Layout Best Practices

### Performance Optimization
1. Use CSS Grid for main layout
2. Flexbox for component layouts
3. CSS containment for panels
4. Will-change for animations
5. Transform over position changes

### Accessibility Considerations
1. Logical tab order across panels
2. Focus trap in modals
3. Keyboard navigation for panels
4. Announce panel state changes
5. Sufficient touch targets (44px min)

### Content Priority
1. **Primary:** Chat conversation
2. **Secondary:** Medical team status
3. **Tertiary:** Thread management
4. **Quaternary:** Visualizations

## Edge Cases

### Minimum Viewport Handling
- Below 320px: Show mobile warning
- 320px-767px: Full mobile layout
- Empty states for all panels
- Graceful degradation

### Maximum Content Handling
- Long thread lists: Virtual scroll
- Many messages: Pagination
- Large visualizations: Scroll + zoom
- Text truncation with ellipsis

## Implementation Notes

### CSS Grid Structure
```css
.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr 400px;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "header header header"
    "sidebar main context";
  height: 100vh;
  overflow: hidden;
}

/* Responsive adjustment */
@media (max-width: 1023px) {
  .main-layout {
    grid-template-columns: 300px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main";
  }
}
```

### Panel State Management
```javascript
// Example state structure
const layoutState = {
  leftPanel: {
    isOpen: true,
    width: 300
  },
  rightPanel: {
    isOpen: true,
    width: 400,
    activeTab: 'team',
    splitPosition: 50
  },
  viewport: {
    width: 1920,
    height: 1080
  }
};
```

## Quality Checklist

- [ ] All panels properly aligned
- [ ] Smooth resize interactions
- [ ] Clean collapse animations
- [ ] Responsive breakpoints working
- [ ] Touch targets adequate on mobile
- [ ] Scroll behaviors smooth
- [ ] Z-index conflicts resolved
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Edge cases handled