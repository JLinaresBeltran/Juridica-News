# Accessibility Guidelines: Multi-Agent Health Insight System

## Overview
The Health Insight Assistant must be accessible to all users, including those with disabilities. These guidelines ensure WCAG 2.1 AA compliance while providing an excellent experience for users with diverse abilities.

## Color & Contrast

### Contrast Requirements
All text and interactive elements must meet WCAG contrast ratios:

#### Text Contrast
- **Normal text**: 4.5:1 minimum against background
- **Large text** (18pt+): 3:1 minimum
- **Body text on white**: #111827 (15.3:1) ✓
- **Secondary text on white**: #6B7280 (5.74:1) ✓

#### Interactive Elements
- **Buttons**: 3:1 minimum for boundaries
- **Form inputs**: 3:1 minimum for borders
- **Focus indicators**: 3:1 minimum against adjacent colors

#### Medical Specialist Colors
All specialist colors tested against white backgrounds:
```
Cardiology Red (#EF4444):    3.96:1 - Use only for icons/borders
Laboratory Green (#10B981):  2.95:1 - Needs darker shade for text
Endocrinology Purple (#8B5CF6): 3.52:1 - Borderline, use sparingly
Data Analysis Yellow (#F59E0B): 2.81:1 - Icons only, never text
```

### Color Independence
Never rely on color alone to convey information:

```css
/* Bad - Color only */
.error { color: red; }

/* Good - Color + Icon + Text */
.error {
  color: #DC2626;
  &::before {
    content: "⚠️ Error: ";
  }
}
```

### Dark Mode Considerations
- Maintain contrast ratios in dark mode
- Adjust transparency values for overlays
- Test medical visualizations in both modes

## Keyboard Navigation

### Focus Management
```javascript
// Focus order must be logical
tabindex="0"   // In tab order
tabindex="-1"  // Programmatically focusable
// Never use positive tabindex

// Skip links
<a href="#main" class="skip-link">Skip to main content</a>
<a href="#medical-team" class="skip-link">Skip to medical team</a>
```

### Keyboard Shortcuts
```javascript
const keyboardShortcuts = {
  'Alt+N': 'New conversation',
  'Alt+M': 'Toggle medical team panel',
  'Alt+V': 'Toggle visualization panel',
  'Ctrl+Enter': 'Submit query',
  'Escape': 'Close modal/dropdown',
  '/': 'Focus search',
  '?': 'Show keyboard shortcuts'
};
```

### Focus Indicators
```css
/* Custom focus styles */
:focus {
  outline: none;
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #3B82F6;
  border-radius: 4px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
}
```

### Component-Specific Navigation

#### Three-Panel Layout
- F6: Cycle between panels
- Ctrl+[: Collapse left panel
- Ctrl+]: Collapse right panel

#### Medical Team Visualization
- Tab: Navigate between specialists
- Enter: View specialist details
- Arrow keys: Navigate team hierarchy

#### Chat Interface
- Up/Down: Navigate message history
- Page Up/Down: Scroll messages
- Home/End: Jump to first/last message

## Screen Reader Support

### Semantic HTML
```html
<!-- Proper heading hierarchy -->
<h1>Health Insight Assistant</h1>
  <h2>Your Medical Team</h2>
    <h3>Dr. Heart - Cardiology</h3>

<!-- Landmark regions -->
<nav role="navigation" aria-label="Conversations">
<main role="main" aria-label="Chat">
<aside role="complementary" aria-label="Medical Team Status">

<!-- Lists for related items -->
<ul role="list" aria-label="Active specialists">
  <li>Dr. Heart - Analyzing...</li>
</ul>
```

### ARIA Labels & Descriptions
```html
<!-- Descriptive labels -->
<button aria-label="Start new health conversation">
  <span aria-hidden="true">➕</span>
  New Conversation
</button>

<!-- Live regions for updates -->
<div aria-live="polite" aria-atomic="true">
  <p>Dr. Heart has completed analysis with 85% confidence</p>
</div>

<!-- Progress indicators -->
<div role="progressbar" 
     aria-valuenow="45" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Dr. Heart analysis progress">
  45%
</div>
```

### Dynamic Content Announcements
```javascript
// Announce status changes
function announceStatus(message) {
  const liveRegion = document.getElementById('status-announcer');
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 3000);
}

// Example usage
announceStatus('Medical team assembled. 3 specialists are analyzing your query.');
```

### Screen Reader Optimizations
```html
<!-- Hide decorative elements -->
<span aria-hidden="true">🏥</span>

<!-- Provide text alternatives -->
<img src="specialist-network.png" 
     alt="Medical team network showing CMO connected to 6 specialists">

<!-- Describe complex visualizations -->
<div role="img" 
     aria-label="Cholesterol trend chart showing decrease from 250 to 180 over 5 years">
  <!-- Chart SVG -->
</div>
```

## Form Accessibility

### Input Labels & Instructions
```html
<!-- Associated labels -->
<label for="health-query">
  What health question can we help you with today?
  <span class="optional">(optional)</span>
</label>
<textarea id="health-query" 
          aria-describedby="query-help"
          placeholder="Ask about labs, medications, or health trends...">
</textarea>
<p id="query-help" class="help-text">
  You can ask complex questions involving multiple health topics
</p>

<!-- Error messages -->
<input aria-invalid="true" 
       aria-describedby="email-error">
<p id="email-error" role="alert" class="error">
  Please enter a valid email address
</p>
```

### Fieldset Grouping
```html
<fieldset>
  <legend>Select time range for analysis</legend>
  <label>
    <input type="radio" name="timerange" value="1y">
    Last year
  </label>
  <label>
    <input type="radio" name="timerange" value="5y" checked>
    Last 5 years
  </label>
</fieldset>
```

## Motion & Animation

### Respecting User Preferences
```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential animations */
  .loading-spinner {
    animation-duration: 1.5s !important;
  }
}
```

### Pause Controls
```html
<!-- Pauseable animations -->
<div class="specialist-status">
  <div class="analysis-animation" id="anim-1">
    <!-- Animation content -->
  </div>
  <button onclick="toggleAnimation('anim-1')" 
          aria-label="Pause animation">
    ⏸️
  </button>
</div>
```

### Safe Animation Patterns
- No flashing more than 3 times per second
- Smooth transitions under 5 seconds
- User-initiated animations preferred
- Progress indicators always visible

## Text & Readability

### Font Sizing
```css
/* Base font size 16px minimum */
html {
  font-size: 100%; /* Respects user preferences */
}

/* Scalable units */
body {
  font-size: 1rem;    /* 16px */
  line-height: 1.5;   /* 24px */
}

h1 { font-size: 1.5rem; }   /* 24px */
h2 { font-size: 1.25rem; }  /* 20px */
h3 { font-size: 1.125rem; } /* 18px */

/* Allow zooming */
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Content Structure
- Use proper heading hierarchy
- Keep paragraphs short (3-4 sentences)
- Use lists for related items
- Provide summaries for long content

### Language & Clarity
```html
<!-- Specify language -->
<html lang="en">

<!-- Define abbreviations -->
<abbr title="Low-Density Lipoprotein">LDL</abbr>

<!-- Simple language for complex terms -->
<span class="definition" 
      data-tooltip="A blood test that measures your average blood sugar over 3 months">
  HbA1c
</span>
```

## Error Handling

### Accessible Error Messages
```javascript
function showError(field, message) {
  const errorId = `${field}-error`;
  const errorEl = document.getElementById(errorId);
  const fieldEl = document.getElementById(field);
  
  // Update error message
  errorEl.textContent = message;
  errorEl.setAttribute('role', 'alert');
  
  // Update field state
  fieldEl.setAttribute('aria-invalid', 'true');
  fieldEl.setAttribute('aria-describedby', errorId);
  
  // Announce to screen readers
  announceStatus(`Error: ${message}`);
  
  // Focus management
  fieldEl.focus();
}
```

### Error Recovery
- Clear instructions for fixing errors
- Preserve user input during errors
- Multiple ways to recover
- Friendly, non-technical language

## Touch & Mobile Accessibility

### Touch Targets
```css
/* Minimum touch target size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Spacing between targets */
.button-group > * + * {
  margin-left: 8px; /* Prevents accidental taps */
}
```

### Mobile Screen Reader Support
- Test with TalkBack (Android) and VoiceOver (iOS)
- Ensure gestures don't conflict
- Provide alternative interactions
- Label all interactive elements

## Testing Checklist

### Automated Testing
- [ ] axe DevTools scan passes
- [ ] WAVE evaluation clear
- [ ] Lighthouse accessibility score > 95
- [ ] Color contrast analyzer passes

### Manual Testing
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] 200% zoom maintains usability
- [ ] Focus indicators always visible
- [ ] Error messages are accessible
- [ ] Time-based content has controls

### User Testing
- [ ] Test with users with disabilities
- [ ] Various assistive technologies
- [ ] Different disability types
- [ ] Real health data scenarios

## Implementation Examples

### Accessible Medical Team Card
```jsx
const SpecialistCard = ({ specialist, status, progress }) => {
  const statusLabel = {
    waiting: 'Waiting to begin analysis',
    active: `Analyzing - ${progress}% complete`,
    complete: 'Analysis complete'
  };

  return (
    <article 
      className="specialist-card"
      role="article"
      aria-label={`${specialist.name} - ${specialist.role}`}
    >
      <div className="specialist-icon" aria-hidden="true">
        {specialist.icon}
      </div>
      
      <div className="specialist-info">
        <h3 id={`specialist-${specialist.id}`}>
          {specialist.name}
        </h3>
        <p className="specialist-role">
          {specialist.role}
        </p>
        
        <div 
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Analysis progress for ${specialist.name}`}
        >
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="sr-only">
            {statusLabel[status]}
          </span>
        </div>
      </div>
      
      <div className="specialist-status" aria-live="polite">
        <span className={`status-badge ${status}`}>
          {status}
        </span>
      </div>
    </article>
  );
};
```

### Accessible Chart Component
```jsx
const AccessibleChart = ({ data, title, description }) => {
  return (
    <figure role="img" aria-labelledby="chart-title" aria-describedby="chart-desc">
      <figcaption>
        <h3 id="chart-title">{title}</h3>
        <p id="chart-desc" className="sr-only">{description}</p>
      </figcaption>
      
      <div className="chart-container">
        {/* Visual chart */}
        <LineChart data={data} />
        
        {/* Data table alternative */}
        <details className="data-table-toggle">
          <summary>View data as table</summary>
          <table>
            <caption className="sr-only">{title} data</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map(point => (
                <tr key={point.date}>
                  <th scope="row">{point.date}</th>
                  <td>{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </figure>
  );
};
```

## Resources & Tools

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [Healthcare Accessibility](https://www.hhs.gov/web/section-508)

### Design Resources
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Style Guide](https://a11y-style-guide.com/style-guide/)
- [Stark (Figma Plugin)](https://www.getstark.co/)