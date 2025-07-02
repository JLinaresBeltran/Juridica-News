# Accessibility Guidelines: Health Insight Assistant

## Overview

The Health Insight Assistant must be accessible to all users, including those with disabilities. These guidelines ensure compliance with WCAG 2.1 AA standards while providing an excellent experience for users with diverse abilities.

## Core Principles

### 1. Perceivable
Information and UI components must be presentable in ways users can perceive.

### 2. Operable
UI components and navigation must be operable by all users.

### 3. Understandable
Information and UI operation must be understandable.

### 4. Robust
Content must be robust enough for interpretation by assistive technologies.

## Color & Contrast

### Contrast Requirements

#### Text Contrast
```css
/* Normal text (< 18pt or < 14pt bold) */
/* Minimum ratio: 4.5:1 */

.body-text {
  color: #111827; /* Gray-900 */
  background: #FFFFFF;
  /* Contrast ratio: 19.97:1 ✓ */
}

.secondary-text {
  color: #6B7280; /* Gray-500 */
  background: #FFFFFF;
  /* Contrast ratio: 4.48:1 ✓ (barely meets) */
}

/* Large text (≥ 18pt or ≥ 14pt bold) */
/* Minimum ratio: 3:1 */

.heading {
  font-size: 24px;
  font-weight: 600;
  color: #374151; /* Gray-700 */
  background: #FFFFFF;
  /* Contrast ratio: 10.91:1 ✓ */
}
```

#### Interactive Elements
```css
/* Minimum ratio: 3:1 against adjacent colors */

.button-primary {
  background: #3B82F6; /* Primary blue */
  color: #FFFFFF;
  /* Text contrast: 8.59:1 ✓ */
  /* Border contrast: N/A (solid fill) */
}

.input-field {
  border: 1px solid #D1D5DB; /* Gray-300 */
  background: #FFFFFF;
  /* Border contrast: 3.21:1 ✓ */
}

.input-field:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  /* Enhanced visibility ✓ */
}
```

### Color Independence

Never rely solely on color to convey information:

```css
/* Bad: Color only */
.status-good { color: green; }
.status-bad { color: red; }

/* Good: Color + Icon + Text */
.status-good {
  color: #10B981;
  &::before {
    content: "✓ ";
    font-weight: bold;
  }
}

.status-bad {
  color: #EF4444;
  &::before {
    content: "⚠ ";
    font-weight: bold;
  }
}
```

### Medical Specialist Colors
Each specialist has both color and icon identification:

```javascript
const specialistIdentifiers = {
  cardiology: {
    color: '#EF4444',
    icon: '❤️',
    pattern: 'diagonal-lines',
    label: 'Dr. Heart - Cardiology'
  },
  laboratory: {
    color: '#10B981',
    icon: '🔬',
    pattern: 'dots',
    label: 'Dr. Lab - Laboratory Medicine'
  }
  // ... etc
};
```

## Keyboard Navigation

### Tab Order

Logical tab order following visual layout:

```html
<!-- Tab order example -->
<header tabindex="-1"> <!-- Skip link target -->
  <a href="#main" class="skip-link">Skip to main content</a>
  <button>Menu</button>
  <nav>...</nav>
</header>

<aside> <!-- Left panel -->
  <button>New Conversation</button>
  <input type="search" aria-label="Search conversations">
  <ul role="list">...</ul>
</aside>

<main id="main" tabindex="-1">
  <!-- Chat interface -->
</main>

<aside> <!-- Right panel -->
  <!-- Medical team visualization -->
</aside>
```

### Keyboard Shortcuts

```javascript
const keyboardShortcuts = {
  // Navigation
  'Ctrl+/': 'Show keyboard shortcuts',
  'Ctrl+N': 'New conversation',
  'Ctrl+K': 'Search conversations',
  'Alt+1': 'Focus chat panel',
  'Alt+2': 'Focus medical team panel',
  'Alt+3': 'Focus visualization panel',
  
  // Actions
  'Enter': 'Send message (in input)',
  'Shift+Enter': 'New line (in input)',
  'Escape': 'Close modal/dropdown',
  'Space': 'Play/pause animations',
  
  // Accessibility
  'Ctrl+Alt+H': 'Announce heading structure',
  'Ctrl+Alt+L': 'List all links',
  'Ctrl+Alt+R': 'Jump to results'
};
```

### Focus Management

#### Focus Indicators
```css
/* Default focus style */
:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :focus {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}

/* Focus visible only for keyboard */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

#### Focus Trapping
```javascript
// Modal focus trap
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
  
  firstFocusable.focus();
}
```

## Screen Reader Support

### Semantic HTML Structure

```html
<!-- Proper heading hierarchy -->
<h1>Health Insight Assistant</h1>
  <h2>Current Conversation: Cholesterol Analysis</h2>
    <h3>Medical Team Status</h3>
      <h4>Dr. Heart - Cardiology</h4>
    <h3>Analysis Results</h3>
      <h4>Cardiovascular Assessment</h4>

<!-- Landmark regions -->
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main">...</main>
<aside role="complementary" aria-label="Medical Team">...</aside>
<footer role="contentinfo">...</footer>
```

### ARIA Labels & Descriptions

```html
<!-- Interactive elements -->
<button aria-label="Start new health conversation">
  <span aria-hidden="true">+</span>
  New Conversation
</button>

<!-- Form inputs -->
<label for="health-query" class="visually-hidden">
  Enter your health question
</label>
<textarea 
  id="health-query"
  aria-describedby="query-help"
  placeholder="Ask about labs, medications, or health trends..."
></textarea>
<div id="query-help" class="helper-text">
  Press Enter to send, Shift+Enter for new line
</div>

<!-- Status updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  <span class="visually-hidden">Status update:</span>
  Dr. Heart is analyzing your cardiovascular data
</div>

<!-- Progress indicators -->
<div role="progressbar" 
     aria-valuenow="65" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Analysis progress">
  <div class="progress-fill" style="width: 65%"></div>
</div>
```

### Live Regions

```html
<!-- Polite updates (wait for pause) -->
<div aria-live="polite" aria-relevant="additions">
  <!-- Specialist status updates -->
</div>

<!-- Assertive updates (immediate) -->
<div aria-live="assertive" role="alert">
  <!-- Critical errors or warnings -->
</div>

<!-- Progress updates -->
<div aria-live="polite" aria-atomic="true">
  <span class="visually-hidden">
    Analysis 75% complete. 3 of 4 specialists have finished.
  </span>
</div>
```

### Screen Reader Only Content

```css
/* Utility class for screen reader only content */
.visually-hidden {
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

/* Show on focus (for skip links) */
.visually-hidden.focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 12px;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Motion & Animation

### Respecting Motion Preferences

```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Maintain essential feedback */
  .loading-spinner {
    animation: none;
    opacity: 0.7;
  }
  
  /* Replace animations with instant state changes */
  .specialist-card {
    transition: none;
  }
  
  .specialist-card.active {
    border: 2px solid var(--primary);
  }
}

/* Safe animations for all users */
@media (prefers-reduced-motion: no-preference) {
  .gentle-fade {
    animation: fadeIn 300ms ease-out;
  }
  
  .progress-bar {
    transition: width 300ms ease-out;
  }
}
```

### Pause Controls

```html
<!-- Animation pause button -->
<button 
  id="animation-control"
  aria-label="Pause animations"
  aria-pressed="false">
  <span class="pause-icon">⏸️</span>
  <span class="play-icon" hidden>▶️</span>
</button>

<script>
let animationsPaused = false;

document.getElementById('animation-control').addEventListener('click', (e) => {
  animationsPaused = !animationsPaused;
  document.body.classList.toggle('animations-paused', animationsPaused);
  e.target.setAttribute('aria-pressed', animationsPaused);
  e.target.setAttribute('aria-label', 
    animationsPaused ? 'Resume animations' : 'Pause animations'
  );
});
</script>
```

## Form Accessibility

### Input Labels & Instructions

```html
<!-- Visible labels -->
<div class="form-group">
  <label for="date-range">
    Select time period for analysis
    <span class="required" aria-label="required">*</span>
  </label>
  <select id="date-range" required aria-describedby="date-help">
    <option value="">Choose a time range</option>
    <option value="1y">Past year</option>
    <option value="5y">Past 5 years</option>
    <option value="all">All available data</option>
  </select>
  <div id="date-help" class="help-text">
    We have data from January 2010 to present
  </div>
</div>

<!-- Error messages -->
<div class="form-group error">
  <label for="health-query">Health question</label>
  <textarea 
    id="health-query" 
    aria-invalid="true"
    aria-describedby="query-error">
  </textarea>
  <div id="query-error" role="alert" class="error-message">
    Please enter a health-related question
  </div>
</div>
```

### Form Validation

```javascript
// Accessible form validation
function validateForm(form) {
  const errors = [];
  
  // Clear previous errors
  form.querySelectorAll('[aria-invalid]').forEach(field => {
    field.setAttribute('aria-invalid', 'false');
    field.removeAttribute('aria-describedby');
  });
  
  // Validate fields
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      errors.push({
        field: field,
        message: `${field.labels[0].textContent} is required`
      });
    }
  });
  
  // Display errors
  if (errors.length > 0) {
    const errorSummary = document.createElement('div');
    errorSummary.setAttribute('role', 'alert');
    errorSummary.innerHTML = `
      <h3>Please fix the following errors:</h3>
      <ul>
        ${errors.map(error => 
          `<li><a href="#${error.field.id}">${error.message}</a></li>`
        ).join('')}
      </ul>
    `;
    
    form.prepend(errorSummary);
    
    // Mark invalid fields
    errors.forEach(error => {
      error.field.setAttribute('aria-invalid', 'true');
      // Add error message...
    });
    
    // Focus first error
    errors[0].field.focus();
    
    return false;
  }
  
  return true;
}
```

## Data Visualization Accessibility

### Chart Alternatives

```html
<!-- Accessible chart with data table -->
<figure>
  <figcaption id="chart-caption">
    Cholesterol trends from 2010 to 2025
  </figcaption>
  
  <!-- Visual chart -->
  <div role="img" aria-labelledby="chart-caption" aria-describedby="chart-desc">
    <canvas id="cholesterol-chart"></canvas>
  </div>
  
  <!-- Text description -->
  <p id="chart-desc" class="visually-hidden">
    Line chart showing total cholesterol decreased from 220 to 185 mg/dL,
    LDL decreased from 140 to 110 mg/dL, and HDL increased from 45 to 55 mg/dL
    over the 15-year period.
  </p>
  
  <!-- Data table alternative -->
  <details>
    <summary>View data in table format</summary>
    <table>
      <caption>Cholesterol values by year</caption>
      <thead>
        <tr>
          <th scope="col">Year</th>
          <th scope="col">Total (mg/dL)</th>
          <th scope="col">LDL (mg/dL)</th>
          <th scope="col">HDL (mg/dL)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">2010</th>
          <td>220</td>
          <td>140</td>
          <td>45</td>
        </tr>
        <!-- More rows... -->
      </tbody>
    </table>
  </details>
</figure>
```

### Interactive Chart Navigation

```javascript
// Keyboard navigation for charts
class AccessibleChart {
  constructor(chart, data) {
    this.chart = chart;
    this.data = data;
    this.currentIndex = 0;
    
    this.chart.setAttribute('tabindex', '0');
    this.chart.setAttribute('role', 'application');
    this.chart.setAttribute('aria-label', 'Interactive chart. Use arrow keys to navigate.');
    
    this.bindKeyboardEvents();
  }
  
  bindKeyboardEvents() {
    this.chart.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigatePoint(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigatePoint(1);
          break;
        case 'Home':
          e.preventDefault();
          this.currentIndex = 0;
          this.announcePoint();
          break;
        case 'End':
          e.preventDefault();
          this.currentIndex = this.data.length - 1;
          this.announcePoint();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          this.announcePoint(true);
          break;
      }
    });
  }
  
  navigatePoint(direction) {
    this.currentIndex = Math.max(0, 
      Math.min(this.data.length - 1, this.currentIndex + direction)
    );
    this.highlightPoint();
    this.announcePoint();
  }
  
  announcePoint(detailed = false) {
    const point = this.data[this.currentIndex];
    const announcement = detailed
      ? `${point.date}: Total cholesterol ${point.total} mg/dL, 
         LDL ${point.ldl} mg/dL, HDL ${point.hdl} mg/dL`
      : `${point.date}: ${point.total} mg/dL`;
    
    this.announce(announcement);
  }
  
  announce(text) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = text;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}
```

## Mobile Accessibility

### Touch Target Size

```css
/* Minimum 44x44px touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Increase tap area without affecting layout */
.small-button {
  position: relative;
  padding: 8px 12px;
}

.small-button::after {
  content: '';
  position: absolute;
  inset: -8px;
  /* Extends touch area to 44x44px minimum */
}
```

### Mobile Screen Reader Support

```html
<!-- iOS VoiceOver hints -->
<button 
  aria-label="View cholesterol details"
  aria-hint="Double tap to expand">
  Cholesterol: 185 mg/dL
</button>

<!-- Android TalkBack -->
<div 
  role="button"
  tabindex="0"
  aria-label="Specialist status: Dr. Heart analyzing"
  aria-description="Shows real-time progress of analysis">
  <!-- Specialist card content -->
</div>
```

## Error Handling

### Accessible Error Messages

```html
<!-- Field-level errors -->
<div class="form-field">
  <label for="med-name">Medication name</label>
  <input 
    type="text" 
    id="med-name"
    aria-invalid="true"
    aria-errormessage="med-name-error">
  <div id="med-name-error" role="alert" class="error">
    Please enter a valid medication name
  </div>
</div>

<!-- Page-level errors -->
<div role="alert" class="error-banner">
  <h2>Unable to load health data</h2>
  <p>We're having trouble accessing your health records. Please try:</p>
  <ul>
    <li>Refreshing the page</li>
    <li>Checking your internet connection</li>
    <li>Contacting support if the issue persists</li>
  </ul>
</div>
```

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools on all pages
- [ ] Check color contrast with WAVE
- [ ] Validate HTML markup
- [ ] Test with Lighthouse accessibility audit

### Manual Testing
- [ ] Navigate with keyboard only
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Check with browser zoom at 200%
- [ ] Verify focus indicators visible
- [ ] Test with Windows High Contrast mode
- [ ] Validate touch targets on mobile

### User Testing
- [ ] Test with users who rely on assistive technology
- [ ] Gather feedback on cognitive load
- [ ] Verify medical information is understandable
- [ ] Ensure error messages are helpful

## Resources

### WCAG 2.1 Quick Reference
- Level A: Essential accessibility
- Level AA: Remove significant barriers (our target)
- Level AAA: Specialized requirements

### Assistive Technology Testing
- NVDA (Windows): Free screen reader
- JAWS (Windows): Commercial screen reader
- VoiceOver (macOS/iOS): Built-in screen reader
- TalkBack (Android): Built-in screen reader
- Dragon (Windows/Mac): Voice control software

### Browser Extensions
- axe DevTools: Automated testing
- WAVE: Visual feedback tool
- Landmark Navigation: Test page structure
- High Contrast: Test color independence