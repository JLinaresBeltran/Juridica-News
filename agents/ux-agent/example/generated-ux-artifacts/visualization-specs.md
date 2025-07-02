# Visualization Specifications: Health Insight Assistant

## Overview

Visualizations in the Health Insight Assistant transform complex medical data into intuitive, actionable insights. Each visualization type is carefully designed to communicate specific health patterns while maintaining medical accuracy and accessibility.

## Design Principles

### Medical Context First
- **Clinical Accuracy**: Always show reference ranges and units
- **Temporal Context**: Emphasize time-based changes
- **Multi-Parameter**: Enable correlation discovery
- **Confidence Display**: Show data quality/completeness

### Visual Hierarchy
1. **Primary Insight**: The main health trend or value
2. **Context**: Reference ranges, targets, historical comparison
3. **Details**: Specific values, dates, annotations
4. **Actions**: Zoom, filter, export options

### Accessibility
- **Color Independence**: Use shapes, patterns, and labels
- **High Contrast**: Ensure 3:1 minimum contrast ratios
- **Alternative Views**: Provide data tables for all charts
- **Keyboard Navigation**: Full chart interaction via keyboard

## Chart Types

### 1. Time Series Line Chart

**Purpose**: Display health metrics over time, showing trends and patterns.

**Visual Specifications**:
```css
.time-series-chart {
  /* Grid */
  --grid-color: #E5E7EB;
  --grid-opacity: 0.5;
  --grid-stroke-width: 1px;
  
  /* Lines */
  --line-stroke-width: 2px;
  --line-hover-width: 3px;
  
  /* Points */
  --point-radius: 4px;
  --point-hover-radius: 6px;
  --point-stroke-width: 2px;
  
  /* Reference ranges */
  --range-fill-opacity: 0.1;
  --range-stroke-opacity: 0.3;
}
```

**Data Structure**:
```typescript
interface TimeSeriesData {
  series: Array<{
    name: string;
    color: string;
    data: Array<{
      date: Date;
      value: number;
      status?: 'normal' | 'warning' | 'critical';
      confidence?: number;
    }>;
  }>;
  referenceRanges?: Array<{
    name: string;
    min: number;
    max: number;
    fill: string;
  }>;
  annotations?: Array<{
    date: Date;
    label: string;
    type: 'medication' | 'event' | 'note';
  }>;
}
```

**Interactions**:
- **Hover**: Show tooltip with exact value, date, and status
- **Click & Drag**: Zoom to selected time range
- **Double Click**: Reset zoom
- **Legend Click**: Toggle series visibility
- **Keyboard**: Arrow keys to navigate points

**Example Implementation**:
```jsx
<TimeSeriesChart
  data={cholesterolData}
  xAxis={{
    type: 'time',
    label: 'Date',
    format: 'MMM YYYY'
  }}
  yAxis={{
    label: 'Cholesterol (mg/dL)',
    domain: [0, 300]
  }}
  series={[
    { key: 'total', name: 'Total Cholesterol', color: '#3B82F6' },
    { key: 'ldl', name: 'LDL', color: '#EF4444' },
    { key: 'hdl', name: 'HDL', color: '#10B981' }
  ]}
  referenceRanges={[
    { name: 'Normal Total', min: 0, max: 200, color: '#10B981' },
    { name: 'Borderline', min: 200, max: 239, color: '#F59E0B' }
  ]}
/>
```

### 2. Comparison Bar Chart

**Purpose**: Compare values across categories or time periods.

**Visual Specifications**:
```css
.comparison-chart {
  /* Bars */
  --bar-border-radius: 4px;
  --bar-spacing: 8px;
  --bar-group-spacing: 16px;
  
  /* Colors by status */
  --bar-normal: #10B981;
  --bar-warning: #F59E0B;
  --bar-critical: #EF4444;
  
  /* Patterns for accessibility */
  --pattern-warning: url(#diagonal-stripes);
  --pattern-critical: url(#dots);
}
```

**Variations**:
- **Grouped**: Multiple metrics side by side
- **Stacked**: Total with breakdown
- **Horizontal**: For long labels
- **Diverging**: Positive/negative from baseline

**Data Structure**:
```typescript
interface BarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: Array<{
      category: string;
      value: number;
      status?: 'normal' | 'warning' | 'critical';
      target?: number;
    }>;
  }>;
  baseline?: number;
}
```

### 3. Scatter Plot with Correlation

**Purpose**: Show relationships between two health metrics.

**Visual Specifications**:
```css
.scatter-plot {
  /* Points */
  --point-size: 6px;
  --point-opacity: 0.7;
  --point-hover-size: 10px;
  
  /* Trend line */
  --trend-stroke-width: 2px;
  --trend-stroke-dasharray: 5,5;
  --confidence-band-opacity: 0.1;
  
  /* Quadrant shading */
  --quadrant-fill-opacity: 0.05;
}
```

**Statistical Overlays**:
- **Trend Line**: Linear regression with R²
- **Confidence Bands**: 95% confidence interval
- **Correlation Coefficient**: Displayed with significance
- **Quadrant Analysis**: Risk/benefit zones

### 4. Heatmap Calendar

**Purpose**: Show daily patterns over months/years.

**Visual Specifications**:
```css
.heatmap-calendar {
  /* Cells */
  --cell-size: 20px;
  --cell-spacing: 2px;
  --cell-border-radius: 3px;
  
  /* Color scale */
  --color-scale-steps: 5;
  --color-min: #F3F4F6;
  --color-max: #3B82F6;
  
  /* Missing data */
  --missing-pattern: url(#diagonal-lines);
  --missing-color: #E5E7EB;
}
```

**Use Cases**:
- Medication adherence tracking
- Symptom frequency
- Exercise consistency
- Sleep patterns

### 5. Gauge Chart

**Purpose**: Show single metric against target ranges.

**Visual Specifications**:
```css
.gauge-chart {
  /* Arc */
  --arc-width: 20px;
  --arc-background: #E5E7EB;
  
  /* Segments */
  --segment-gap: 2px;
  --segment-critical: #EF4444;
  --segment-warning: #F59E0B;
  --segment-normal: #10B981;
  
  /* Needle */
  --needle-width: 4px;
  --needle-length: 80%;
  --needle-color: #374151;
}
```

**Display Elements**:
- Current value (large, centered)
- Units and metric name
- Target range indicators
- Trend arrow (if applicable)

### 6. Distribution Chart

**Purpose**: Show value distribution and outliers.

**Visual Specifications**:
```css
.distribution-chart {
  /* Box plot */
  --box-fill: #E0E7FF;
  --box-stroke: #6366F1;
  --whisker-stroke: #9CA3AF;
  --outlier-fill: #EF4444;
  
  /* Violin plot */
  --violin-fill-opacity: 0.3;
  --violin-stroke-width: 2px;
  
  /* Histogram */
  --bin-spacing: 1px;
  --bin-radius: 2px;
}
```

### 7. Multi-Metric Dashboard

**Purpose**: Comprehensive view of related health metrics.

**Layout Grid**:
```css
.metric-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  /* Visual hierarchy */
  --value-font-size: 32px;
  --label-font-size: 12px;
  --trend-font-size: 14px;
  
  /* Status indicators */
  --status-bar-height: 4px;
  --status-icon-size: 16px;
}
```

**Card Components**:
- Primary value with unit
- Metric label
- Change indicator (↑↓ with percentage)
- Mini sparkline
- Status color bar
- Last updated timestamp

## Interactive Features

### Tooltips

**Design Specifications**:
```css
.chart-tooltip {
  /* Positioning */
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  
  /* Styling */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  font-size: 12px;
  line-height: 1.4;
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--gray-900);
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.tooltip-label {
  color: var(--gray-600);
}

.tooltip-value {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
```

**Content Structure**:
```html
<div class="chart-tooltip">
  <div class="tooltip-header">March 15, 2024</div>
  <div class="tooltip-row">
    <span class="tooltip-label">Total Cholesterol:</span>
    <span class="tooltip-value">185 mg/dL</span>
  </div>
  <div class="tooltip-row">
    <span class="tooltip-label">Status:</span>
    <span class="tooltip-value status-normal">Normal</span>
  </div>
  <div class="tooltip-row">
    <span class="tooltip-label">Change:</span>
    <span class="tooltip-value trend-down">↓ 5.2%</span>
  </div>
</div>
```

### Zoom & Pan

**Implementation**:
```javascript
const zoomBehavior = {
  // Mouse interactions
  wheel: 'zoom',      // Scroll to zoom
  drag: 'pan',        // Click and drag to pan
  pinch: 'zoom',      // Touch pinch to zoom
  
  // Constraints
  minZoom: 0.5,
  maxZoom: 10,
  
  // Reset
  doubleClick: 'reset',
  
  // Keyboard
  '+': 'zoomIn',
  '-': 'zoomOut',
  arrows: 'pan'
};
```

### Legend Interactions

**Features**:
- Click to toggle series
- Hover to highlight
- Drag to reorder
- Double-click to isolate

**Visual States**:
```css
.legend-item {
  cursor: pointer;
  transition: all 150ms ease-out;
}

.legend-item:hover {
  background: var(--gray-50);
}

.legend-item.disabled {
  opacity: 0.4;
}

.legend-item.isolated {
  font-weight: 600;
  background: var(--primary-50);
}
```

## Responsive Design

### Mobile Adaptations

**Time Series**:
- Reduce data points (sampling)
- Larger touch targets
- Swipe to pan
- Pinch to zoom

**Bar Charts**:
- Horizontal orientation
- Scrollable with fixed headers
- Tap for details

**Heatmaps**:
- Reduce cell size
- Month view instead of year
- Swipe between months

### Breakpoint Behaviors
```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  .chart-container {
    height: 300px;
    margin: -16px; /* Full bleed */
  }
  
  .chart-legend {
    position: static;
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding: 12px 0;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .chart-container {
    height: 400px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .chart-container {
    height: 500px;
  }
}
```

## Color Palettes

### Health Status Colors
```css
:root {
  /* Primary health metrics */
  --health-cholesterol: #3B82F6;  /* Blue */
  --health-blood-pressure: #EF4444; /* Red */
  --health-glucose: #F59E0B;      /* Amber */
  --health-weight: #8B5CF6;       /* Purple */
  
  /* Status colors */
  --status-optimal: #059669;      /* Emerald-600 */
  --status-normal: #10B981;       /* Emerald-500 */
  --status-borderline: #F59E0B;   /* Amber-500 */
  --status-high: #F97316;         /* Orange-500 */
  --status-critical: #DC2626;     /* Red-600 */
  
  /* Trend colors */
  --trend-improving: #10B981;
  --trend-stable: #6B7280;
  --trend-worsening: #EF4444;
}
```

### Accessible Patterns
```svg
<!-- Diagonal stripes for warning -->
<pattern id="diagonal-stripes" patternUnits="userSpaceOnUse" width="4" height="4">
  <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="#000" stroke-width="0.5" opacity="0.2"/>
</pattern>

<!-- Dots for critical -->
<pattern id="dots" patternUnits="userSpaceOnUse" width="4" height="4">
  <circle cx="2" cy="2" r="0.5" fill="#000" opacity="0.2"/>
</pattern>
```

## Animation Guidelines

### Chart Entry Animations
```css
/* Fade and scale in */
.chart-enter {
  animation: chartEnter 600ms ease-out both;
}

@keyframes chartEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Stagger data points */
.data-point {
  animation: pointEnter 300ms ease-out both;
  animation-delay: calc(var(--index) * 20ms);
}

/* Draw line paths */
.line-path {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: drawPath 1500ms ease-out forwards;
}
```

### Transition Timing
- **Data updates**: 300ms ease-out
- **Hover effects**: 150ms ease-out
- **Layout changes**: 500ms ease-in-out
- **Loading states**: Continuous

## Export Options

### Formats
1. **PNG**: High-resolution chart image
2. **SVG**: Vector format for printing
3. **CSV**: Raw data table
4. **PDF**: Full report with context

### Export UI
```html
<div class="export-menu">
  <button class="export-btn">
    <svg><!-- Download icon --></svg>
    Export
  </button>
  <div class="export-options">
    <button data-format="png">Download as Image</button>
    <button data-format="svg">Download as Vector</button>
    <button data-format="csv">Download Data</button>
    <button data-format="pdf">Generate Report</button>
  </div>
</div>
```

## Performance Guidelines

### Data Optimization
- **Sampling**: Reduce points for large datasets
- **Aggregation**: Show averages for dense data
- **Viewport Culling**: Only render visible data
- **Progressive Loading**: Load details on demand

### Rendering Performance
```javascript
// Use canvas for large datasets
if (dataPoints > 1000) {
  return <CanvasChart {...props} />;
}

// Use SVG for smaller, interactive charts
return <SVGChart {...props} />;
```

### Memory Management
- Cleanup event listeners
- Cancel animation frames
- Clear timers on unmount
- Limit undo/redo history

## Implementation Examples

### React Component Structure
```jsx
<ChartContainer
  title="15-Year Cholesterol Trend"
  subtitle="Tracking your cardiovascular health"
  controls={<ChartControls />}
>
  <TimeSeriesChart
    data={data}
    config={config}
    onDataHover={handleHover}
    onRangeSelect={handleZoom}
  />
  <ChartLegend
    series={series}
    onToggle={handleSeriesToggle}
  />
</ChartContainer>
```

### Configuration Object
```javascript
const chartConfig = {
  type: 'time-series',
  dimensions: {
    width: 'auto',
    height: 400,
    margin: { top: 20, right: 80, bottom: 40, left: 60 }
  },
  scales: {
    x: {
      type: 'time',
      domain: 'auto',
      nice: true
    },
    y: {
      type: 'linear',
      domain: [0, 'auto'],
      nice: true
    }
  },
  interaction: {
    zoom: true,
    pan: true,
    tooltip: true,
    crosshair: true
  },
  animation: {
    enter: true,
    update: true,
    duration: 300
  }
};
```

## Testing Checklist

### Visual Testing
- [ ] All colors meet contrast requirements
- [ ] Patterns visible in grayscale
- [ ] Labels readable at all sizes
- [ ] Interactions have visual feedback

### Functional Testing
- [ ] Data updates correctly
- [ ] Interactions work on all devices
- [ ] Export functions properly
- [ ] Performance with large datasets

### Accessibility Testing
- [ ] Keyboard navigation complete
- [ ] Screen reader announces data
- [ ] Alternative text descriptions
- [ ] Data table fallbacks available