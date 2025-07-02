# Visualization Specifications: Health Insight Assistant

## Overview

Health data visualizations must balance clinical accuracy with user comprehension. Each chart type is optimized for specific health insights while maintaining consistency with the overall design system.

## Core Visualization Types

### 1. Time Series Charts

**Purpose**: Display health metrics over time, showing trends and patterns.

#### Visual Design
```css
/* Line properties */
--line-weight: 2.5px;
--line-tension: 0.4; /* Smooth curves */
--point-radius: 4px;
--point-hover-radius: 6px;
--point-border-width: 2px;

/* Grid and axes */
--grid-color: rgba(229, 231, 235, 0.5);
--axis-color: #6B7280;
--axis-font-size: 12px;
```

#### Color Usage
```javascript
const metricColors = {
  totalCholesterol: '#EF4444',    // Red
  ldl: '#F59E0B',                 // Amber  
  hdl: '#10B981',                 // Green
  triglycerides: '#3B82F6',       // Blue
  bloodPressureSystolic: '#8B5CF6', // Purple
  bloodPressureDiastolic: '#EC4899', // Pink
  glucose: '#F97316',             // Orange
  hba1c: '#06B6D4'               // Cyan
};
```

#### Reference Ranges
```css
/* Normal range band */
.reference-range {
  fill: rgba(16, 185, 129, 0.1);
  stroke: #10B981;
  stroke-width: 1px;
  stroke-dasharray: 4, 4;
}

/* Critical thresholds */
.threshold-line {
  stroke: #EF4444;
  stroke-width: 1.5px;
  stroke-dasharray: 8, 4;
}
```

#### Interactions
- **Hover**: Show tooltip with exact value, date, and reference range
- **Click**: Toggle metric visibility in multi-line charts
- **Drag**: Create zoom selection (desktop)
- **Pinch**: Zoom on mobile
- **Double-click**: Reset zoom

#### Implementation Example
```javascript
const timeSeriesConfig = {
  chart: {
    type: 'line',
    height: 400,
    animations: {
      enabled: true,
      duration: 750,
      easing: 'easeOutQuart'
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2.5
  },
  markers: {
    size: 4,
    strokeWidth: 2,
    hover: {
      size: 6,
      sizeOffset: 2
    }
  },
  grid: {
    borderColor: '#E5E7EB',
    strokeDashArray: 0,
    xaxis: {
      lines: { show: false }
    },
    yaxis: {
      lines: { show: true }
    }
  },
  tooltip: {
    shared: true,
    intersect: false,
    theme: 'light',
    y: {
      formatter: (value, { seriesIndex, dataPointIndex, w }) => {
        const unit = w.config.series[seriesIndex].unit;
        return `${value} ${unit}`;
      }
    }
  }
};
```

### 2. Comparison Charts

**Purpose**: Compare health metrics across categories or time periods.

#### Visual Design
- **Bar width**: Dynamic based on data points
- **Bar spacing**: 0.2 * bar width
- **Corner radius**: 4px top corners
- **Group spacing**: 0.5 * bar width

#### Color Patterns
```javascript
// Positive/Negative comparison
const comparisonColors = {
  improvement: '#10B981',    // Green
  neutral: '#6B7280',       // Gray
  decline: '#EF4444',       // Red
  target: '#3B82F6'         // Blue
};

// Sequential data
const sequentialPalette = [
  '#3B82F6', // Darkest
  '#60A5FA',
  '#93C5FD',
  '#BFDBFE',
  '#DBEAFE'  // Lightest
];
```

#### Annotations
```css
.value-label {
  font-size: 11px;
  font-weight: 600;
  fill: var(--gray-700);
  text-anchor: middle;
}

.change-indicator {
  font-size: 10px;
  font-weight: 500;
}

.change-positive { color: #10B981; }
.change-negative { color: #EF4444; }
```

### 3. Distribution Charts

**Purpose**: Show the distribution and range of health values.

#### Box Plot Design
```javascript
const boxPlotStyle = {
  box: {
    fill: 'rgba(59, 130, 246, 0.2)',
    stroke: '#3B82F6',
    strokeWidth: 2
  },
  median: {
    stroke: '#1E40AF',
    strokeWidth: 3
  },
  whiskers: {
    stroke: '#3B82F6',
    strokeWidth: 1.5,
    strokeDasharray: '2,2'
  },
  outliers: {
    fill: '#EF4444',
    radius: 4,
    stroke: '#FFFFFF',
    strokeWidth: 2
  }
};
```

#### Histogram Design
```css
.histogram-bar {
  fill: var(--primary);
  opacity: 0.8;
  transition: opacity 0.2s;
}

.histogram-bar:hover {
  opacity: 1;
}

.distribution-curve {
  fill: none;
  stroke: var(--primary-dark);
  stroke-width: 2;
}
```

### 4. Correlation Matrix

**Purpose**: Display relationships between multiple health metrics.

#### Visual Design
```javascript
const correlationColors = {
  strong_positive: '#0F766E',  // Dark teal
  positive: '#10B981',         // Green
  weak_positive: '#86EFAC',   // Light green
  neutral: '#F3F4F6',          // Gray
  weak_negative: '#FCA5A5',    // Light red
  negative: '#EF4444',         // Red
  strong_negative: '#991B1B'   // Dark red
};

// Cell size based on correlation strength
const cellScale = (correlation) => {
  const base = 40;
  return base * (0.6 + Math.abs(correlation) * 0.4);
};
```

#### Matrix Layout
```css
.correlation-matrix {
  display: grid;
  gap: 2px;
  padding: 20px;
  background: var(--gray-100);
}

.correlation-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.correlation-cell:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}
```

### 5. Dashboard Layouts

**Purpose**: Combine multiple visualizations for comprehensive health overview.

#### Grid System
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.card-full-width {
  grid-column: 1 / -1;
}

.card-half-width {
  grid-column: span 2;
}
```

#### Metric Cards
```javascript
const MetricCard = {
  layout: {
    icon: { size: 48, position: 'left' },
    value: { fontSize: 32, fontWeight: 700 },
    label: { fontSize: 14, color: 'gray-600' },
    trend: { position: 'bottom-right' }
  },
  colors: {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280'
  },
  animations: {
    valueChange: 'countUp',
    trendArrow: 'slideIn'
  }
};
```

## Animation Specifications

### Chart Entry Animations
```javascript
const animationTimings = {
  // Stagger data points
  delayPerPoint: 50,
  
  // Line drawing
  lineDraw: {
    duration: 1500,
    easing: 'easeOutQuart'
  },
  
  // Bar growth
  barGrow: {
    duration: 800,
    easing: 'easeOutBack'
  },
  
  // Fade in
  fadeIn: {
    duration: 400,
    easing: 'easeOut'
  }
};
```

### Transition Animations
```css
/* Data update transitions */
@keyframes valueUpdate {
  0% { opacity: 0.5; transform: scale(0.95); }
  50% { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

/* Loading skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.chart-skeleton {
  background: linear-gradient(90deg,
    #F3F4F6 25%,
    #E5E7EB 50%,
    #F3F4F6 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Responsive Behavior

### Mobile Adaptations
```javascript
const mobileChartConfig = {
  // Reduce data points for performance
  maxDataPoints: 50,
  
  // Larger touch targets
  markers: { size: 6 },
  
  // Simplified tooltips
  tooltip: { 
    followCursor: false,
    fixed: { enabled: true }
  },
  
  // Hide grid lines for clarity
  grid: { show: false },
  
  // Rotate labels if needed
  xaxis: {
    labels: { 
      rotate: -45,
      rotateAlways: true 
    }
  }
};
```

### Breakpoint Adjustments
```css
/* Tablet and below */
@media (max-width: 768px) {
  .chart-container {
    height: 300px; /* Reduced from 400px */
    margin: 0 -16px; /* Full width */
    padding: 0 16px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

## Accessibility Features

### Chart Accessibility
```javascript
const accessibilityConfig = {
  // Screen reader descriptions
  description: 'Line chart showing cholesterol trends over 15 years',
  
  // Keyboard navigation
  keyboard: {
    enabled: true,
    navigation: {
      nextDataPoint: 'ArrowRight',
      prevDataPoint: 'ArrowLeft',
      announceValue: 'Space'
    }
  },
  
  // High contrast mode
  highContrast: {
    enabled: window.matchMedia('(prefers-contrast: high)').matches,
    colors: ['#000000', '#FFFFFF', '#0000FF', '#FF0000']
  },
  
  // Data table alternative
  showDataTable: true,
  dataTablePosition: 'below'
};
```

### ARIA Labels
```html
<div role="img" 
     aria-label="Chart showing cholesterol trends from 2010 to 2025">
  <svg>
    <title>Cholesterol Trends Analysis</title>
    <desc>
      Total cholesterol decreased from 220 to 185 mg/dL over 15 years.
      LDL decreased from 140 to 110 mg/dL.
      HDL increased from 45 to 55 mg/dL.
    </desc>
    <!-- Chart elements -->
  </svg>
</div>
```

## Performance Optimization

### Data Sampling
```javascript
// Reduce data points for large datasets
function sampleData(data, maxPoints = 100) {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// Progressive rendering for large datasets
function progressiveRender(data, chunkSize = 50) {
  let index = 0;
  
  function renderChunk() {
    const chunk = data.slice(index, index + chunkSize);
    // Render chunk
    index += chunkSize;
    
    if (index < data.length) {
      requestAnimationFrame(renderChunk);
    }
  }
  
  renderChunk();
}
```

### Canvas vs SVG
```javascript
// Use Canvas for > 1000 data points
const renderMethod = dataPoints.length > 1000 ? 'canvas' : 'svg';

// Canvas optimization
const canvasConfig = {
  pixelRatio: window.devicePixelRatio || 1,
  willReadFrequently: false,
  imageSmoothingEnabled: true
};
```

## Export Functionality

### Export Options
```javascript
const exportFormats = {
  png: {
    quality: 1,
    backgroundColor: '#FFFFFF',
    scale: 2 // For retina displays
  },
  svg: {
    preserveAspectRatio: true,
    embedCSS: true
  },
  csv: {
    headers: true,
    separator: ',',
    dateFormat: 'YYYY-MM-DD'
  },
  pdf: {
    orientation: 'landscape',
    format: 'letter',
    margins: { top: 20, bottom: 20, left: 20, right: 20 }
  }
};
```

## Error States

### No Data Display
```html
<div class="empty-chart">
  <svg class="empty-icon" width="64" height="64">
    <!-- Chart icon -->
  </svg>
  <h3 class="empty-title">No Data Available</h3>
  <p class="empty-message">
    No cholesterol data found for the selected time period.
  </p>
  <button class="empty-action">
    Adjust Time Range
  </button>
</div>
```

### Error Display
```css
.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  color: var(--gray-600);
}

.error-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  color: var(--error);
}
```

## Implementation Checklist

### Core Features
- [ ] Time series with multiple metrics
- [ ] Reference range visualization
- [ ] Interactive tooltips
- [ ] Zoom and pan controls
- [ ] Responsive sizing
- [ ] Export functionality

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Data table alternative
- [ ] ARIA labels and descriptions

### Performance
- [ ] Data sampling for large datasets
- [ ] Progressive rendering
- [ ] Efficient redraws
- [ ] Memory management
- [ ] Loading states

### Mobile
- [ ] Touch-optimized interactions
- [ ] Simplified visualizations
- [ ] Gesture support
- [ ] Appropriate data density