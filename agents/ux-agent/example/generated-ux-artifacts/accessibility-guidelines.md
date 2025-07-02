# Accessibility Guidelines: Health Insight Assistant

## Overview

The Health Insight Assistant is committed to providing an inclusive experience for all users, including those with disabilities. These guidelines ensure our application meets WCAG 2.1 AA standards while exceeding expectations for usability in healthcare contexts.

## Color & Contrast

### Contrast Requirements

#### Text Contrast
- **Normal Text** (< 18pt): Minimum 4.5:1 contrast ratio
- **Large Text** (≥ 18pt or ≥ 14pt bold): Minimum 3:1 contrast ratio
- **Body Text on White**: #374151 (Gray-700) = 8.3:1 ✓
- **Secondary Text on White**: #6B7280 (Gray-500) = 4.5:1 ✓

#### UI Component Contrast
- **Interactive Elements**: Minimum 3:1 against background
- **Focus Indicators**: Minimum 3:1 against all backgrounds
- **Borders & Dividers**: Minimum 3:1 for essential boundaries

#### Medical Status Colors
All status colors maintain proper contrast:
- **Success** (#10B981 on white): 3.5:1 ✓
- **Warning** (#F59E0B on white): 3:1 ✓
- **Error** (#EF4444 on white): 3.9:1 ✓

### Color Independence

Never rely on color alone to convey information:
```html
<!-- Bad -->
<div class="status-red">Critical</div>

<!-- Good -->
<div class="status-critical">
  <span class="icon">⚠️</span>
  <span class="text">Critical</span>
</div>
```

### Specialist Color Accessibility
Each medical specialist has both color and icon identification:
- Cardiology: Red + ❤️ icon
- Laboratory: Green + 🔬 icon
- Endocrinology: Purple + 💊 icon

## Keyboard Navigation

### Tab Order
Logical flow through the interface:
1. Header navigation
2. Left panel (conversations)
3. Center panel (chat)
4. Right panel (medical team/visualizations)

### Keyboard Shortcuts
```
Ctrl/Cmd + K: Quick search
Ctrl/Cmd + N: New conversation
Ctrl/Cmd + Enter: Send message
Escape: Close modal/panel
Arrow Keys: Navigate lists
Tab/Shift+Tab: Move focus
Enter/Space: Activate buttons
```

### Focus Management
```css
/* Clear focus indicators */
:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* High contrast focus for Windows High Contrast Mode */
@media (prefers-contrast: high) {
  :focus {
    outline: 3px solid;
    outline-offset: 3px;
  }
}
```

### Skip Links
```html
<div class="skip-links">
  <a href="#main-content">Skip to main content</a>
  <a href="#conversations">Skip to conversations</a>
  <a href="#chat">Skip to chat</a>
  <a href="#medical-team">Skip to medical team</a>
</div>
```

## Screen Reader Support

### Semantic HTML Structure
```html
<header role="banner">
  <nav role="navigation" aria-label="Main">...</nav>
</header>

<main role="main" id="main-content">
  <section aria-labelledby="chat-heading">
    <h1 id="chat-heading" class="sr-only">Health Consultation Chat</h1>
    ...
  </section>
</main>

<aside role="complementary" aria-label="Medical Team Status">
  ...
</aside>
```

### ARIA Labels & Descriptions
```html
<!-- Specialist Status -->
<div role="status" 
     aria-label="Dr. Heart - Cardiology" 
     aria-describedby="heart-status">
  <span id="heart-status" class="sr-only">
    Currently analyzing cardiovascular data, 45% complete
  </span>
</div>

<!-- Progress Bar -->
<div role="progressbar" 
     aria-valuenow="45" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Analysis progress">
  <div class="progress-fill" style="width: 45%"></div>
</div>
```

### Live Regions
```html
<!-- Chat messages -->
<div role="log" aria-live="polite" aria-label="Conversation">
  <!-- New messages announced automatically -->
</div>

<!-- Status updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- Important updates announced -->
</div>

<!-- Urgent alerts -->
<div role="alert" aria-live="assertive">
  <!-- Critical health alerts announced immediately -->
</div>
```

### Screen Reader Only Content
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Form Accessibility

### Label Association
```html
<!-- Explicit labeling -->
<label for="health-query">Ask a health question</label>
<input type="text" id="health-query" name="query">

<!-- Grouped inputs -->
<fieldset>
  <legend>Select time range for analysis</legend>
  <input type="radio" id="range-1year" name="range" value="1year">
  <label for="range-1year">Past year</label>
  <!-- More options -->
</fieldset>
```

### Error Handling
```html
<div class="form-field">
  <label for="query">Health Question</label>
  <input type="text" 
         id="query" 
         aria-invalid="true"
         aria-describedby="query-error">
  <div id="query-error" role="alert" class="error-message">
    Please enter a health question
  </div>
</div>
```

### Required Fields
```html
<label for="health-query">
  Health Question <span aria-label="required">*</span>
</label>
<input type="text" 
       id="health-query" 
       required 
       aria-required="true">
```

## Motion & Animation

### Respecting User Preferences
```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential motion indicators */
  .loading-spinner {
    animation: spin 2s linear infinite;
  }
}

/* Safe animations that don't trigger vestibular issues */
.fade-in {
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Pause Controls
```html
<!-- Animated content with pause control -->
<div class="animated-chart">
  <button aria-label="Pause animation" 
          onClick="toggleAnimation()">
    <span class="pause-icon">⏸️</span>
  </button>
  <!-- Chart content -->
</div>
```

## Responsive Text

### Scalable Font Sizes
```css
/* Base font size respects user preferences */
html {
  font-size: 100%; /* 16px default, scales with user settings */
}

/* Use rem units for scalability */
body {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
}

h1 { font-size: 1.5rem; }  /* 24px */
h2 { font-size: 1.25rem; } /* 20px */
h3 { font-size: 1.125rem; } /* 18px */

/* Minimum font sizes */
small { font-size: max(0.75rem, 12px); }
```

### Readable Line Lengths
```css
.content {
  max-width: 70ch; /* Optimal reading length */
  margin: 0 auto;
}

.chat-message {
  max-width: 45ch; /* Shorter for chat bubbles */
}
```

## Interactive Elements

### Touch Targets
```css
/* Minimum 44x44px touch targets */
button,
a,
input[type="checkbox"],
input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Spacing between targets */
.button-group > * + * {
  margin-left: 8px;
}
```

### Hover and Focus States
```css
/* Clear interaction states */
.interactive-element {
  transition: all 150ms ease-out;
}

.interactive-element:hover {
  background-color: var(--gray-100);
  transform: translateY(-1px);
}

.interactive-element:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.interactive-element:active {
  transform: translateY(0);
}
```

## Data Visualization Accessibility

### Chart Alternatives
```html
<!-- Visual chart with data table alternative -->
<div class="chart-container">
  <div class="chart" role="img" aria-labelledby="chart-title chart-desc">
    <h3 id="chart-title">Cholesterol Trend Over 15 Years</h3>
    <p id="chart-desc" class="sr-only">
      Line chart showing cholesterol levels from 2010 to 2025,
      with values ranging from 140 to 220 mg/dL
    </p>
    <!-- Chart visualization -->
  </div>
  
  <details>
    <summary>View data table</summary>
    <table>
      <caption>Cholesterol values by year</caption>
      <thead>
        <tr>
          <th>Year</th>
          <th>Total Cholesterol (mg/dL)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>2010</td>
          <td>185</td>
          <td>Normal</td>
        </tr>
        <!-- More rows -->
      </tbody>
    </table>
  </details>
</div>
```

### Color-Blind Safe Palettes
```css
/* Use patterns in addition to colors */
.chart-series-1 { stroke: #2563EB; stroke-dasharray: 0; }
.chart-series-2 { stroke: #DC2626; stroke-dasharray: 5,5; }
.chart-series-3 { stroke: #059669; stroke-dasharray: 10,5; }
.chart-series-4 { stroke: #7C3AED; stroke-dasharray: 2,2; }
```

## Error Prevention & Recovery

### Clear Instructions
```html
<div class="help-text" id="query-help">
  <p>Ask questions like:</p>
  <ul>
    <li>"What's my cholesterol trend?"</li>
    <li>"Show my medication history"</li>
    <li>"Analyze my blood pressure patterns"</li>
  </ul>
</div>
<input type="text" 
       aria-describedby="query-help"
       placeholder="Ask about your health...">
```

### Confirmation Dialogs
```html
<div role="dialog" 
     aria-labelledby="dialog-title" 
     aria-describedby="dialog-desc">
  <h2 id="dialog-title">Delete Conversation?</h2>
  <p id="dialog-desc">
    This will permanently delete all messages in this conversation.
  </p>
  <button onClick="confirmDelete()">Delete</button>
  <button onClick="closeDialog()" aria-label="Cancel deletion">Cancel</button>
</div>
```

## Mobile Accessibility

### Viewport Settings
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

### Touch Gestures
- Provide alternatives to complex gestures
- Support both tap and swipe navigation
- Ensure gesture areas are large enough

### Orientation Support
```css
/* Support both orientations */
@media (orientation: portrait) {
  .layout { flex-direction: column; }
}

@media (orientation: landscape) {
  .layout { flex-direction: row; }
}
```

## Testing Checklist

### Automated Testing
- [ ] Axe DevTools scan passes
- [ ] WAVE evaluation complete
- [ ] Lighthouse accessibility score > 95
- [ ] Color contrast analyzer passed

### Manual Testing
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Voice control testing
- [ ] Mobile screen reader testing
- [ ] Browser zoom to 200% maintains usability
- [ ] Windows High Contrast Mode supported

### User Testing
- [ ] Test with users who have disabilities
- [ ] Gather feedback on pain points
- [ ] Iterate based on real usage
- [ ] Document accessibility features

## Implementation Priority

### Phase 1: Critical (Launch Required)
- Color contrast compliance
- Keyboard navigation
- Screen reader basic support
- Focus indicators
- Form accessibility

### Phase 2: Important (Post-Launch)
- Enhanced screen reader experience
- Keyboard shortcuts
- Animation controls
- Advanced ARIA patterns
- Mobile accessibility optimizations

### Phase 3: Enhancement
- Voice control optimization
- Alternative input methods
- Cognitive accessibility features
- Internationalization support
- User preference persistence

## Resources

### Tools
- [Axe DevTools](https://www.deque.com/axe/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)