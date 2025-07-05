# Health Insight System - Accessibility Guidelines

## Overview

This document provides comprehensive accessibility guidelines for the Health Insight System, ensuring all users, regardless of ability, can effectively access and understand their health information. We follow WCAG 2.1 AA standards with additional healthcare-specific considerations.

## Core Accessibility Principles

### Healthcare Accessibility Requirements
- **Universal Access**: Health information is critical for all users
- **Clear Communication**: Medical terms explained in plain language
- **Multiple Modalities**: Information available in various formats
- **Error Prevention**: Critical for health data accuracy
- **Time Considerations**: No time limits on health decisions
- **Emergency Access**: Critical alerts always accessible

## WCAG 2.1 AA Compliance

### 1. Perceivable

#### 1.1 Text Alternatives
```html
<!-- Health Metric Icons -->
<span class="health-icon" role="img" aria-label="Heart rate indicator">❤️</span>

<!-- Medical Team Visualization -->
<div class="medical-team-viz" role="img" 
     aria-label="Medical team with Dr. Vitality as Chief Medical Officer coordinating 3 specialists: Dr. Heart for cardiology, Dr. Hormone for endocrinology, and Dr. Analytics for data analysis">
  <!-- Visual representation -->
</div>

<!-- Charts -->
<div class="health-chart" 
     role="img" 
     aria-label="Cholesterol trend chart showing 15 years of data from 2010 to 2025">
  <!-- Chart implementation -->
  <table class="sr-only">
    <caption>Cholesterol values by year</caption>
    <thead>
      <tr>
        <th>Date</th>
        <th>Total Cholesterol (mg/dL)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>January 2010</td>
        <td>170</td>
        <td>Normal</td>
      </tr>
      <!-- Additional rows -->
    </tbody>
  </table>
</div>
```

#### 1.2 Time-Based Media
```html
<!-- Medical Animation Descriptions -->
<div class="specialist-animation" 
     aria-live="polite" 
     aria-label="Dr. Heart is now analyzing your cardiovascular data">
  <!-- Animation -->
</div>

<!-- Progress Indicators -->
<div role="progressbar" 
     aria-valuenow="45" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Cardiology analysis 45% complete">
  <span class="progress-text">45% Complete</span>
</div>
```

#### 1.3 Adaptable Content
```css
/* Responsive and Flexible Layouts */
.health-layout {
  display: grid;
  grid-template-areas: 
    "header header header"
    "sidebar main context";
}

/* Reflow for mobile */
@media (max-width: 768px) {
  .health-layout {
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "context";
  }
}

/* Orientation Support */
@media (orientation: landscape) {
  .mobile-health-view {
    flex-direction: row;
  }
}
```

#### 1.4 Distinguishable

**Color Contrast Requirements**:
```css
/* Text Contrast Ratios */
.health-text {
  /* Normal text: 4.5:1 minimum */
  color: #374151;  /* on white: 7.8:1 ✓ */
  background: #FFFFFF;
}

.health-text-large {
  /* Large text (18px+): 3:1 minimum */
  color: #6B7280;  /* on white: 4.5:1 ✓ */
  font-size: 18px;
}

/* Health Status Colors with Patterns */
.status-normal {
  background-color: #10B981;
  background-image: url('data:image/svg+xml,<svg>...</svg>'); /* checkmark pattern */
}

.status-critical {
  background-color: #EF4444;
  background-image: url('data:image/svg+xml,<svg>...</svg>'); /* alert pattern */
}
```

**Audio Alerts**:
```javascript
// Health Alert Sound Configuration
const healthAlerts = {
  critical: {
    sound: 'alert-critical.mp3',
    volume: 0.8,
    repeat: 3,
    visualIndicator: 'pulse-red'
  },
  warning: {
    sound: 'alert-warning.mp3',
    volume: 0.6,
    repeat: 2,
    visualIndicator: 'pulse-yellow'
  }
};
```

### 2. Operable

#### 2.1 Keyboard Accessible
```javascript
// Keyboard Navigation Map
const keyboardShortcuts = {
  // Global Navigation
  'Alt+H': 'Go to Home',
  'Alt+C': 'New Conversation',
  'Alt+S': 'Search Health Records',
  'Alt+T': 'Toggle Medical Team View',
  'Alt+V': 'Toggle Visualizations',
  
  // Panel Navigation
  'F6': 'Next Panel',
  'Shift+F6': 'Previous Panel',
  'Ctrl+B': 'Toggle Sidebar',
  'Ctrl+I': 'Toggle Info Panel',
  
  // Data Navigation
  'ArrowLeft': 'Previous Data Point',
  'ArrowRight': 'Next Data Point',
  'ArrowUp': 'Increase Value',
  'ArrowDown': 'Decrease Value',
  'Enter': 'Select/Activate',
  'Space': 'Toggle Selection',
  'Escape': 'Close/Cancel'
};

// Implementation
class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.setupGlobalListeners();
  }
  
  registerShortcut(key, action, description) {
    this.shortcuts.set(key, { action, description });
  }
  
  handleKeyDown(event) {
    const key = this.getKeyCombo(event);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      this.announceAction(shortcut.description);
    }
  }
  
  announceAction(description) {
    const announcement = document.getElementById('aria-live');
    announcement.textContent = description;
  }
}
```

#### 2.2 Enough Time
```javascript
// No Time Limits for Health Decisions
const sessionConfig = {
  timeout: null, // No automatic timeout
  warningTime: null, // No warnings
  extendable: true, // Always extendable
  
  // Optional inactivity notification
  inactivityReminder: {
    enabled: true,
    time: 30 * 60 * 1000, // 30 minutes
    message: 'Still there? Your health data is secure.',
    dismissible: true
  }
};

// Auto-save for data protection
const autoSave = {
  interval: 5000, // 5 seconds
  debounce: 1000, // 1 second after last change
  indicator: 'Saving...',
  success: 'Saved'
};
```

#### 2.3 Seizures and Physical Reactions
```css
/* Safe Animation Defaults */
@media (prefers-reduced-motion: no-preference) {
  .health-animation {
    animation: gentle-pulse 3s ease-in-out infinite;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Maintain essential feedback */
  .health-status-indicator {
    transition: opacity 0.3s ease;
  }
}

/* No Flashing Content */
.health-alert {
  /* No flashing - use gentle fade instead */
  animation: fade-in-out 2s ease-in-out;
  animation-iteration-count: 1;
}

@keyframes fade-in-out {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

#### 2.4 Navigable

**Skip Links**:
```html
<div class="skip-links">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <a href="#health-query" class="skip-link">Skip to health query</a>
  <a href="#medical-team" class="skip-link">Skip to medical team</a>
  <a href="#results" class="skip-link">Skip to results</a>
</div>
```

**Focus Management**:
```css
/* Clear Focus Indicators */
:focus {
  outline: none;
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #3B82F6;
  border-radius: 4px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
}

/* Focus Within Panels */
.panel:focus-within {
  border-color: #3B82F6;
  background-color: rgba(59, 130, 246, 0.05);
}
```

**Page Structure**:
```html
<!-- Semantic HTML Structure -->
<header role="banner">
  <h1>Health Insight Assistant</h1>
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main" id="main-content">
  <section aria-labelledby="thread-heading">
    <h2 id="thread-heading">Health Conversations</h2>
    <!-- Thread list -->
  </section>
  
  <section aria-labelledby="chat-heading">
    <h2 id="chat-heading">Current Consultation</h2>
    <!-- Chat interface -->
  </section>
  
  <aside aria-labelledby="team-heading">
    <h2 id="team-heading">Medical Team Status</h2>
    <!-- Team visualization -->
  </aside>
</main>
```

#### 2.5 Input Modalities

**Multi-Modal Input**:
```javascript
// Voice Input Support
class VoiceInput {
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.setupRecognition();
  }
  
  setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    // Medical vocabulary
    this.recognition.grammars = this.createMedicalGrammar();
  }
  
  createMedicalGrammar() {
    const medical = ['cholesterol', 'blood pressure', 'glucose', 'medication'];
    const grammar = `#JSGF V1.0; grammar medical; public <medical> = ${medical.join(' | ')};`;
    const list = new webkitSpeechGrammarList();
    list.addFromString(grammar, 1);
    return list;
  }
}

// Gesture Support
const gestureConfig = {
  swipe: {
    left: 'nextPanel',
    right: 'previousPanel',
    up: 'scrollUp',
    down: 'scrollDown'
  },
  pinch: {
    in: 'zoomOut',
    out: 'zoomIn'
  },
  tap: {
    double: 'toggleFullscreen'
  }
};
```

### 3. Understandable

#### 3.1 Readable

**Language and Reading Level**:
```javascript
// Medical Term Glossary
const medicalGlossary = {
  'HDL': {
    term: 'HDL Cholesterol',
    definition: 'High-Density Lipoprotein - Often called "good" cholesterol because it helps remove other forms of cholesterol from your bloodstream.',
    pronunciation: 'H-D-L ko-LES-ter-ol',
    simpleTerms: 'Good cholesterol that protects your heart'
  },
  'Triglycerides': {
    term: 'Triglycerides',
    definition: 'A type of fat found in your blood that your body uses for energy.',
    pronunciation: 'try-GLIS-er-ides',
    simpleTerms: 'Blood fats from food'
  }
};

// Plain Language Toggle
class PlainLanguageMode {
  constructor() {
    this.enabled = localStorage.getItem('plainLanguage') === 'true';
  }
  
  translate(medicalText) {
    if (!this.enabled) return medicalText;
    
    // Replace medical terms with simple versions
    let simpleText = medicalText;
    for (const [term, glossary] of Object.entries(medicalGlossary)) {
      simpleText = simpleText.replace(
        new RegExp(term, 'gi'),
        `${glossary.simpleTerms} (${term})`
      );
    }
    return simpleText;
  }
}
```

**Multi-Language Support**:
```html
<!-- Language Selection -->
<select id="language-select" aria-label="Select language">
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="zh">中文</option>
  <option value="ar" dir="rtl">العربية</option>
</select>

<!-- RTL Support -->
<html lang="ar" dir="rtl">
  <style>
    [dir="rtl"] .health-layout {
      grid-template-areas: 
        "header header header"
        "context main sidebar";
    }
  </style>
</html>
```

#### 3.2 Predictable

**Consistent Navigation**:
```javascript
// Navigation State Management
class NavigationManager {
  constructor() {
    this.currentPanel = 'main';
    this.history = [];
    this.setupLandmarks();
  }
  
  setupLandmarks() {
    // Consistent landmarks across all views
    this.landmarks = {
      banner: document.querySelector('[role="banner"]'),
      navigation: document.querySelector('[role="navigation"]'),
      main: document.querySelector('[role="main"]'),
      complementary: document.querySelector('[role="complementary"]'),
      contentinfo: document.querySelector('[role="contentinfo"]')
    };
  }
  
  navigateTo(panel) {
    // Predictable focus management
    this.history.push(this.currentPanel);
    this.currentPanel = panel;
    this.focusPanel(panel);
    this.announceNavigation(panel);
  }
  
  announceNavigation(panel) {
    const announcement = `Navigated to ${panel}. ${this.getPanelDescription(panel)}`;
    this.announce(announcement);
  }
}
```

#### 3.3 Input Assistance

**Error Prevention and Correction**:
```javascript
// Health Data Validation
class HealthDataValidator {
  validateBloodPressure(systolic, diastolic) {
    const errors = [];
    
    // Range validation
    if (systolic < 70 || systolic > 200) {
      errors.push({
        field: 'systolic',
        message: 'Systolic pressure should be between 70 and 200 mmHg',
        severity: 'warning',
        suggestion: 'Please check if this value is correct'
      });
    }
    
    // Logical validation
    if (systolic <= diastolic) {
      errors.push({
        field: 'both',
        message: 'Systolic pressure must be higher than diastolic',
        severity: 'error',
        suggestion: 'Check if values are swapped'
      });
    }
    
    return errors;
  }
  
  // Smart suggestions
  getSuggestions(field, value) {
    const suggestions = {
      'cholesterol': this.getCholesterolSuggestions(value),
      'medication': this.getMedicationSuggestions(value),
      'symptoms': this.getSymptomSuggestions(value)
    };
    
    return suggestions[field] || [];
  }
}

// Inline Error Messages
class InlineErrorDisplay {
  showError(fieldId, error) {
    const field = document.getElementById(fieldId);
    const errorId = `${fieldId}-error`;
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'field-error';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.textContent = error.message;
    
    // Associate with field
    field.setAttribute('aria-describedby', errorId);
    field.setAttribute('aria-invalid', 'true');
    
    // Insert after field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
}
```

### 4. Robust

#### 4.1 Compatible

**Progressive Enhancement**:
```javascript
// Feature Detection
class FeatureSupport {
  static check() {
    return {
      webGL: this.checkWebGL(),
      speechRecognition: 'webkitSpeechRecognition' in window,
      vibration: 'vibrate' in navigator,
      bluetooth: 'bluetooth' in navigator,
      notifications: 'Notification' in window
    };
  }
  
  static checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }
  
  static getFallback(feature) {
    const fallbacks = {
      webGL: 'canvas2D',
      speechRecognition: 'textInput',
      vibration: 'visualAlert',
      bluetooth: 'manualEntry',
      notifications: 'inAppAlert'
    };
    
    return fallbacks[feature];
  }
}
```

**ARIA Implementation**:
```html
<!-- Medical Team Component -->
<div class="medical-team" role="region" aria-label="Medical team analysis status">
  <h2 id="team-heading">Your Medical Team</h2>
  
  <!-- Live Region for Updates -->
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="team-updates">
    <!-- Dynamic updates announced here -->
  </div>
  
  <!-- Specialist Cards -->
  <ul role="list" aria-labelledby="team-heading">
    <li role="listitem">
      <div class="specialist-card" 
           role="article"
           aria-label="Dr. Heart - Cardiology Specialist">
        <div class="specialist-status" 
             role="status"
             aria-label="Status: Analyzing">
          <span class="status-icon" aria-hidden="true">⏳</span>
          <span class="status-text">Analyzing</span>
        </div>
        <div class="progress" 
             role="progressbar" 
             aria-valuenow="75" 
             aria-valuemin="0" 
             aria-valuemax="100"
             aria-label="Analysis 75% complete">
          <div class="progress-bar" style="width: 75%"></div>
        </div>
      </div>
    </li>
  </ul>
</div>

<!-- Health Chat Interface -->
<div class="chat-interface" role="log" aria-label="Health consultation conversation">
  <div class="message" role="article" aria-label="Your message">
    <div class="message-content">
      What's my cholesterol trend over the last 15 years?
    </div>
    <time datetime="2024-06-28T14:56:00">2:56 PM</time>
  </div>
  
  <div class="message assistant" role="article" aria-label="Dr. Vitality's response">
    <img src="dr-vitality.png" alt="Dr. Vitality avatar" class="avatar">
    <div class="message-content">
      <p>I'll analyze your cholesterol trend over the past 15 years...</p>
    </div>
    <time datetime="2024-06-28T14:56:30">2:56 PM</time>
  </div>
</div>
```

## Healthcare-Specific Accessibility

### Emergency Alerts
```javascript
// Emergency Alert System
class EmergencyAlertSystem {
  constructor() {
    this.criticalKeywords = [
      'chest pain', 'can\'t breathe', 'severe bleeding',
      'stroke symptoms', 'unconscious', 'severe pain'
    ];
  }
  
  checkForEmergency(text) {
    const hasEmergency = this.criticalKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasEmergency) {
      this.triggerEmergencyAlert();
    }
  }
  
  triggerEmergencyAlert() {
    // Visual alert
    const alert = document.createElement('div');
    alert.className = 'emergency-alert';
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');
    alert.innerHTML = `
      <h2>⚠️ Medical Emergency Detected</h2>
      <p>Call 911 or go to the nearest emergency room immediately.</p>
      <a href="tel:911" class="emergency-button">Call 911</a>
    `;
    
    // Audio alert
    const audio = new Audio('emergency-alert.mp3');
    audio.play();
    
    // Vibration pattern (SOS)
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300, 300, 600, 300, 600]);
    }
    
    document.body.prepend(alert);
  }
}
```

### Medication Reminders
```javascript
// Accessible Medication Reminders
class MedicationReminderAccessible {
  createReminder(medication) {
    return {
      visual: this.createVisualReminder(medication),
      audio: this.createAudioReminder(medication),
      haptic: this.createHapticReminder(medication),
      notification: this.createNotification(medication)
    };
  }
  
  createVisualReminder(medication) {
    return {
      icon: '💊',
      color: medication.priority === 'critical' ? '#EF4444' : '#3B82F6',
      animation: 'pulse',
      size: 'large',
      contrast: 'high'
    };
  }
  
  createAudioReminder(medication) {
    const text = `Time to take ${medication.name}. ${medication.dosage}.`;
    return {
      speech: new SpeechSynthesisUtterance(text),
      chime: 'medication-chime.mp3',
      volume: 0.8,
      repeat: medication.priority === 'critical' ? 3 : 1
    };
  }
}
```

### Health Data Privacy
```javascript
// Accessible Privacy Controls
class PrivacyControls {
  constructor() {
    this.setupPrivacyUI();
  }
  
  setupPrivacyUI() {
    // Screen reader announcement for privacy features
    this.privacyRegion = document.createElement('div');
    this.privacyRegion.setAttribute('role', 'region');
    this.privacyRegion.setAttribute('aria-label', 'Privacy controls');
    
    // Privacy mode toggle
    const toggle = document.createElement('button');
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', 'false');
    toggle.setAttribute('aria-label', 'Privacy mode: hide sensitive health information');
    
    toggle.addEventListener('click', () => {
      const isPrivate = toggle.getAttribute('aria-checked') === 'true';
      toggle.setAttribute('aria-checked', !isPrivate);
      this.togglePrivacyMode(!isPrivate);
    });
  }
  
  togglePrivacyMode(enabled) {
    document.body.classList.toggle('privacy-mode', enabled);
    this.announce(enabled ? 
      'Privacy mode enabled. Sensitive information is hidden.' : 
      'Privacy mode disabled. All information is visible.'
    );
  }
}
```

## Testing Checklist

### Automated Testing
- [ ] aXe DevTools scan passes
- [ ] WAVE evaluation clear
- [ ] Lighthouse accessibility score > 95
- [ ] Color contrast analyzer passes
- [ ] Keyboard navigation test passes

### Manual Testing
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation complete
- [ ] Voice control functional
- [ ] Mobile accessibility verified
- [ ] Zoom to 200% maintains functionality
- [ ] High contrast mode verified

### User Testing
- [ ] Testing with users with disabilities
- [ ] Cognitive load assessment
- [ ] Emergency scenario testing
- [ ] Multi-language verification
- [ ] Assistive technology compatibility

## Resources

### Screen Reader Guides
```javascript
// Screen Reader Specific Instructions
const screenReaderGuides = {
  NVDA: {
    navigation: 'Use H to navigate by headings, R for regions',
    tables: 'Use T to jump to tables, Ctrl+Alt+Arrow keys to navigate cells',
    forms: 'Use F to navigate form fields, Enter to activate'
  },
  JAWS: {
    navigation: 'Use H for headings, R for regions, Q for main content',
    tables: 'Use T for tables, Ctrl+Alt+Arrow keys for cells',
    forms: 'Use F for form fields, Enter to activate'
  },
  VoiceOver: {
    navigation: 'Use VO+U for rotor, VO+Command+H for headings',
    tables: 'Use VO+Command+T for tables',
    forms: 'Use VO+Command+J for form controls'
  }
};
```

## Accessibility Statement

```html
<div class="accessibility-statement">
  <h2>Accessibility Commitment</h2>
  <p>
    Health Insight Assistant is committed to ensuring digital accessibility 
    for people with disabilities. We are continually improving the user 
    experience for everyone and applying the relevant accessibility standards.
  </p>
  
  <h3>Conformance Status</h3>
  <p>
    We aim to conform to WCAG 2.1 Level AA standards. Current conformance: 
    Partially conformant with ongoing improvements.
  </p>
  
  <h3>Feedback</h3>
  <p>
    We welcome your feedback on the accessibility of Health Insight Assistant. 
    Please contact us at:
  </p>
  <ul>
    <li>Email: <a href="mailto:accessibility@healthinsight.com">accessibility@healthinsight.com</a></li>
    <li>Phone: <a href="tel:+1234567890">1-234-567-890</a></li>
    <li>Form: <a href="/accessibility-feedback">Accessibility Feedback Form</a></li>
  </ul>
</div>
```

## Quality Assurance

- [ ] All images have appropriate alt text
- [ ] All form inputs have labels
- [ ] Error messages are clear and helpful
- [ ] Focus order is logical
- [ ] Page has proper heading structure
- [ ] Links have descriptive text
- [ ] Color is not sole indicator
- [ ] Content reflows at 400% zoom
- [ ] Animations respect preferences
- [ ] Time limits are adjustable