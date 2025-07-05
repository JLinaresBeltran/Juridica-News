# Health Insight System - Visualization Specifications

## Overview

This document defines comprehensive specifications for health data visualizations in the Health Insight System, ensuring medical accuracy, visual clarity, and interactive excellence in presenting complex health information.

## Core Visualization Principles

### Medical Data Best Practices
- **Clinical Accuracy**: Always show reference ranges
- **Visual Hierarchy**: Critical values most prominent
- **Color Consistency**: Semantic health status colors
- **Accessibility**: Data available in multiple formats
- **Interactivity**: Progressive disclosure of details
- **Context**: Always provide temporal and comparative context

### Health Color Semantics
```css
:root {
  /* Health Status Colors */
  --viz-normal: #10B981;        /* Within healthy range */
  --viz-borderline: #F59E0B;    /* Attention needed */
  --viz-abnormal: #EF4444;      /* Outside normal range */
  --viz-critical: #991B1B;      /* Immediate attention */
  --viz-improving: #3B82F6;     /* Positive trend */
  --viz-declining: #DC2626;     /* Negative trend */
  
  /* Neutral Colors */
  --viz-reference: #E5E7EB;     /* Reference ranges */
  --viz-grid: #F3F4F6;          /* Grid lines */
  --viz-text: #374151;          /* Labels and text */
  --viz-muted: #9CA3AF;         /* Secondary information */
}
```

## Chart Types and Use Cases

### 1. Time Series Charts (Lab Trends)

**Purpose**: Display health metrics over time with reference ranges

**Required Elements**:
```javascript
const timeSeriesConfig = {
  // Visual Components
  chart: {
    type: 'line',
    height: 400,
    margins: { top: 20, right: 30, bottom: 40, left: 60 }
  },
  
  // Data Lines
  series: [
    {
      name: 'Total Cholesterol',
      color: '#3B82F6',
      strokeWidth: 2,
      showPoints: true,
      pointRadius: 4
    }
  ],
  
  // Reference Ranges
  referenceAreas: [
    {
      y1: 0,
      y2: 200,
      fill: 'rgba(16, 185, 129, 0.1)',
      label: 'Normal Range'
    },
    {
      y1: 200,
      y2: 240,
      fill: 'rgba(245, 158, 11, 0.1)',
      label: 'Borderline'
    },
    {
      y1: 240,
      y2: null,
      fill: 'rgba(239, 68, 68, 0.1)',
      label: 'High Risk'
    }
  ],
  
  // Axes
  xAxis: {
    type: 'time',
    format: 'MMM YYYY',
    gridLines: false
  },
  yAxis: {
    label: 'mg/dL',
    gridLines: true,
    includeZero: false
  },
  
  // Interactions
  tooltip: {
    showValue: true,
    showDate: true,
    showReference: true,
    showStatus: true
  },
  
  // Annotations
  annotations: [
    {
      type: 'line',
      value: 200,
      label: 'Target',
      style: 'dashed'
    }
  ]
};
```

**Implementation Example**:
```jsx
<LineChart width={800} height={400} data={healthData}>
  {/* Reference Areas */}
  <ReferenceArea y1={0} y2={200} fill="#10B981" fillOpacity={0.1} />
  <ReferenceArea y1={200} y2={240} fill="#F59E0B" fillOpacity={0.1} />
  
  {/* Grid */}
  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
  
  {/* Axes */}
  <XAxis 
    dataKey="date" 
    tickFormatter={(date) => format(date, 'MMM yy')}
    stroke="#9CA3AF"
  />
  <YAxis 
    label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
    domain={['dataMin - 10', 'dataMax + 10']}
    stroke="#9CA3AF"
  />
  
  {/* Data Lines */}
  <Line 
    type="monotone" 
    dataKey="totalCholesterol" 
    stroke="#3B82F6"
    strokeWidth={2}
    dot={{ fill: '#3B82F6', r: 4 }}
    activeDot={{ r: 6 }}
  />
  
  {/* Tooltip */}
  <Tooltip content={<HealthTooltip />} />
  
  {/* Legend */}
  <Legend />
</LineChart>
```

### 2. Gauge Charts (Current Values)

**Purpose**: Show current value against normal ranges

**Visual Structure**:
```javascript
const gaugeConfig = {
  // Arc Configuration
  arc: {
    startAngle: -120,
    endAngle: 120,
    innerRadius: '60%',
    outerRadius: '80%'
  },
  
  // Segments
  segments: [
    { range: [0, 120], color: '#10B981', label: 'Normal' },
    { range: [120, 140], color: '#F59E0B', label: 'Borderline' },
    { range: [140, 180], color: '#EF4444', label: 'High' }
  ],
  
  // Current Value
  needle: {
    value: 128,
    color: '#374151',
    width: 4,
    length: '90%'
  },
  
  // Center Display
  center: {
    value: '128/82',
    unit: 'mmHg',
    label: 'Blood Pressure',
    status: 'Borderline High'
  }
};
```

### 3. Distribution Charts (Lab Result Patterns)

**Purpose**: Show distribution of values over time

**Configuration**:
```javascript
const distributionConfig = {
  chart: {
    type: 'boxplot' | 'violin' | 'histogram'
  },
  
  // Box Plot Elements
  boxplot: {
    whiskers: { stroke: '#9CA3AF', strokeWidth: 1 },
    box: { fill: '#E0E7FF', stroke: '#6366F1' },
    median: { stroke: '#4F46E5', strokeWidth: 2 },
    outliers: { fill: '#EF4444', r: 3 }
  },
  
  // Statistical Lines
  referenceLine: [
    { y: 'mean', label: 'Average', stroke: '#10B981' },
    { y: 'target', label: 'Target', stroke: '#3B82F6' }
  ]
};
```

### 4. Correlation Charts (Medication vs. Outcomes)

**Purpose**: Show relationships between treatments and health metrics

**Structure**:
```javascript
const correlationConfig = {
  // Dual Y-Axis
  leftAxis: {
    dataKey: 'cholesterol',
    label: 'Cholesterol (mg/dL)',
    color: '#3B82F6'
  },
  rightAxis: {
    dataKey: 'medicationAdherence',
    label: 'Adherence (%)',
    color: '#10B981'
  },
  
  // Correlation Indicators
  correlation: {
    showCoefficient: true,
    showTrendLine: true,
    confidenceInterval: true
  },
  
  // Annotations
  events: [
    {
      date: '2023-03-15',
      label: 'Started Statins',
      line: 'vertical',
      style: 'dashed'
    }
  ]
};
```

### 5. Medication Timeline

**Purpose**: Visualize medication history with adherence

**Visual Elements**:
```javascript
const medicationTimelineConfig = {
  // Timeline Tracks
  tracks: [
    {
      medication: 'Rosuvastatin',
      periods: [
        { start: '2021-01', end: '2022-05', adherence: 92 },
        { start: '2022-11', end: '2024-04', adherence: 88 }
      ],
      color: '#8B5CF6'
    }
  ],
  
  // Adherence Visualization
  adherence: {
    good: { threshold: 80, color: '#10B981' },
    moderate: { threshold: 60, color: '#F59E0B' },
    poor: { threshold: 0, color: '#EF4444' }
  },
  
  // Gap Indicators
  gaps: {
    showDuration: true,
    highlightColor: '#FEE2E2',
    minDays: 30
  }
};
```

## Interactive Features

### Tooltip Specifications
```javascript
const tooltipConfig = {
  // Content Structure
  content: {
    title: 'Metric Name',
    value: 'Current Value with Unit',
    date: 'Measurement Date',
    status: 'Normal | Borderline | Abnormal',
    reference: 'Reference Range',
    trend: 'Change from Previous',
    notes: 'Clinical Notes if Available'
  },
  
  // Styling
  style: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  
  // Behavior
  behavior: {
    followCursor: true,
    delay: 200,
    hideDelay: 0,
    interactive: true
  }
};
```

### Zoom and Pan
```javascript
const zoomConfig = {
  // Zoom Controls
  zoom: {
    enabled: true,
    type: 'x' | 'y' | 'xy',
    minZoom: 0.5,
    maxZoom: 10,
    wheelZoom: true,
    pinchZoom: true
  },
  
  // Pan Controls
  pan: {
    enabled: true,
    modifierKey: 'shift',
    boundaries: 'data'
  },
  
  // Reset Button
  reset: {
    show: true,
    position: 'top-right',
    label: 'Reset View'
  }
};
```

### Legend Configuration
```javascript
const legendConfig = {
  // Position and Layout
  position: 'bottom' | 'right',
  layout: 'horizontal' | 'vertical',
  align: 'center',
  
  // Interactive Features
  interactive: {
    clickable: true,      // Toggle series
    hoverable: true,      // Highlight series
    focusable: true       // Keyboard navigation
  },
  
  // Item Structure
  item: {
    marker: 'line' | 'square' | 'circle',
    spacing: 24,
    fontSize: 12,
    showValue: true       // Current value in legend
  }
};
```

## Responsive Design

### Mobile Adaptations
```javascript
const mobileConfig = {
  // Simplified Charts
  mobile: {
    maxDataPoints: 50,        // Reduce data density
    simplifiedTooltip: true,  // Basic tooltip only
    stackedLayout: true,      // Vertical stacking
    touchOptimized: true      // Larger touch targets
  },
  
  // Breakpoints
  breakpoints: {
    small: { maxWidth: 640, columns: 1 },
    medium: { maxWidth: 1024, columns: 2 },
    large: { minWidth: 1025, columns: 3 }
  }
};
```

## Data Formatting

### Number Formatting
```javascript
const formatters = {
  // Health Metrics
  cholesterol: (value) => `${value} mg/dL`,
  bloodPressure: (sys, dia) => `${sys}/${dia} mmHg`,
  glucose: (value) => `${value} mg/dL`,
  weight: (value) => `${value.toFixed(1)} lbs`,
  
  // Percentages
  adherence: (value) => `${Math.round(value)}%`,
  change: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
  
  // Dates
  shortDate: (date) => format(date, 'MMM d'),
  longDate: (date) => format(date, 'MMM d, yyyy'),
  relative: (date) => formatDistance(date, new Date())
};
```

### Status Indicators
```javascript
const statusConfig = {
  // Visual Indicators
  indicators: {
    normal: { icon: '✓', color: '#10B981', bg: '#D1FAE5' },
    borderline: { icon: '!', color: '#F59E0B', bg: '#FEF3C7' },
    abnormal: { icon: '⚠', color: '#EF4444', bg: '#FEE2E2' },
    critical: { icon: '⚡', color: '#991B1B', bg: '#FCA5A5' }
  },
  
  // Trend Arrows
  trends: {
    improving: { arrow: '↑', color: '#3B82F6' },
    stable: { arrow: '→', color: '#6B7280' },
    declining: { arrow: '↓', color: '#EF4444' }
  }
};
```

## Accessibility Features

### Chart Accessibility
```javascript
const a11yConfig = {
  // Screen Reader Support
  aria: {
    label: 'Cholesterol trend chart showing 15 years of data',
    description: 'Line chart with reference ranges and current values',
    live: 'polite'
  },
  
  // Keyboard Navigation
  keyboard: {
    enabled: true,
    dataPointNav: true,
    shortcuts: {
      'ArrowLeft': 'Previous data point',
      'ArrowRight': 'Next data point',
      'Enter': 'Show details',
      'Escape': 'Close details'
    }
  },
  
  // Alternative Formats
  alternatives: {
    dataTable: true,          // Show as table option
    textSummary: true,        // Written description
    downloadCSV: true         // Export raw data
  },
  
  // High Contrast Mode
  highContrast: {
    enabled: true,
    patterns: true,           // Use patterns not just colors
    boldLines: true,          // Thicker lines
    largerPoints: true        // Bigger data points
  }
};
```

### Color Blind Friendly Palettes
```javascript
const colorBlindPalettes = {
  // Deuteranopia (Red-Green)
  deuteranopia: [
    '#1E40AF', // Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#10B981', // Teal
    '#EC4899'  // Pink
  ],
  
  // Protanopia (Red-Green)
  protanopia: [
    '#2563EB', // Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#14B8A6', // Teal
    '#F43F5E'  // Rose
  ],
  
  // Tritanopia (Blue-Yellow)
  tritanopia: [
    '#DC2626', // Red
    '#059669', // Green
    '#7C3AED', // Purple
    '#DB2777', // Pink
    '#0891B2'  // Cyan
  ]
};
```

## Performance Optimization

### Data Sampling
```javascript
const performanceConfig = {
  // Data Reduction
  sampling: {
    enabled: true,
    maxPoints: 500,
    algorithm: 'lttb',        // Largest Triangle Three Buckets
    preservePeaks: true       // Keep min/max values
  },
  
  // Rendering Optimization
  rendering: {
    webGL: true,              // Use WebGL for large datasets
    progressive: true,        // Progressive rendering
    virtualization: true,     // Viewport-based rendering
    throttleRedraw: 16        // Max 60fps
  },
  
  // Memory Management
  memory: {
    maxDatasets: 10,
    cacheTimeout: 300000,     // 5 minutes
    lazyLoad: true
  }
};
```

## Export Options

### Export Configurations
```javascript
const exportConfig = {
  // Image Export
  image: {
    formats: ['png', 'svg', 'jpeg'],
    quality: 0.92,
    scale: 2,                 // 2x for retina
    background: '#FFFFFF'
  },
  
  // Data Export
  data: {
    formats: ['csv', 'json', 'xlsx'],
    includeMetadata: true,
    dateFormat: 'ISO',
    nullValue: 'N/A'
  },
  
  // PDF Export
  pdf: {
    pageSize: 'letter',
    orientation: 'landscape',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    includeTitle: true,
    includeTimestamp: true,
    includeDisclaimer: true
  }
};
```

## Implementation Examples

### Complete Time Series Component
```jsx
const HealthTimeSeriesChart = ({ data, metric, referenceRanges }) => {
  return (
    <div className="chart-container" role="img" aria-label={`${metric} trend chart`}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
          {/* Reference Areas */}
          {referenceRanges.map((range, idx) => (
            <ReferenceArea
              key={idx}
              y1={range.min}
              y2={range.max}
              fill={range.color}
              fillOpacity={0.1}
              label={range.label}
            />
          ))}
          
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#F3F4F6" 
            horizontalPoints={[100, 150, 200, 250]}
          />
          
          {/* Axes */}
          <XAxis 
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM yy')}
            stroke="#9CA3AF"
          />
          <YAxis
            label={{ 
              value: `${metric} (${unit})`, 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6B7280' }
            }}
            stroke="#9CA3AF"
            domain={[
              (dataMin) => Math.floor(dataMin * 0.9),
              (dataMax) => Math.ceil(dataMax * 1.1)
            ]}
          />
          
          {/* Data Line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={(props) => <HealthDataPoint {...props} />}
            activeDot={{ r: 6, strokeWidth: 2 }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          
          {/* Custom Tooltip */}
          <Tooltip 
            content={<HealthTooltip metric={metric} referenceRanges={referenceRanges} />}
            animationDuration={200}
          />
          
          {/* Legend */}
          <Legend 
            content={<HealthLegend />}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Accessibility Table */}
      <details className="sr-only">
        <summary>View data as table</summary>
        <HealthDataTable data={data} metric={metric} />
      </details>
    </div>
  );
};
```

## Quality Checklist

- [ ] Reference ranges always visible
- [ ] Status colors consistent
- [ ] Tooltips informative
- [ ] Mobile responsive
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Export options available
- [ ] Performance optimized
- [ ] Error states handled
- [ ] Loading states smooth