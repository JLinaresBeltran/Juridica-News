# Health Insight System - Design Requirements

## Overview

This document provides design requirements from the Product Owner to guide the UX Designer Agent in creating a comprehensive design system for the Multi-Agent Health Insight System. These requirements ensure the interface conveys trust, medical professionalism, and makes complex health analysis accessible.

## Brand Foundation

### Required Brand Values
- **Trustworthy**: Medical-grade accuracy with transparent processes
- **Intelligent**: Powered by cutting-edge AI orchestration
- **Accessible**: Complex insights made simple
- **Professional**: Clinical expertise with a human touch
- **Responsive**: Real-time analysis and adaptive interactions

### Visual Identity Requirements
- **Primary Logo**: Blue medical briefcase icon with stethoscope element
- **Application Name**: "Health Insight Assistant"
- **Tagline**: "Powered by Multi-Agent AI • Snowflake Cortex"
- **Logo Usage**: Always maintain clear space equal to the height of the icon

## Required Color System

### Primary Colors
- **Primary Blue**: `#3B82F6` (RGB: 59, 130, 246)
  - Used for: Primary buttons, logo, active states, links
  - Represents: Trust, stability, medical professionalism

- **Pure White**: `#FFFFFF` (RGB: 255, 255, 255)
  - Used for: Primary backgrounds, cards
  - Represents: Cleanliness, clarity

### Medical Specialist Colors (MUST USE THESE EXACT COLORS)
Each medical specialist must have their designated color for instant recognition:

| Specialist | Name | Color | Hex Code | Purpose |
|------------|------|-------|----------|---------|
| Cardiology | Dr. Heart | Red | `#EF4444` | Heart health |
| Laboratory | Dr. Lab | Green | `#10B981` | Test results |
| Endocrinology | Dr. Hormone | Purple | `#8B5CF6` | Hormones |
| Data Analysis | Dr. Analytics | Amber | `#F59E0B` | Analytics |
| Preventive | Dr. Prevention | Orange | `#F97316` | Prevention |
| Pharmacy | Dr. Pharma | Light Orange | `#FB923C` | Medications |
| Nutrition | Dr. Nutrition | Lime | `#84CC16` | Diet |
| General Practice | Dr. Vitality (CMO) | Cyan | `#06B6D4` | Overall care |

### Required Semantic Colors
- **Normal Range**: `#10B981` (green) - Healthy values
- **Borderline**: `#F59E0B` (amber) - Attention needed
- **Critical**: `#EF4444` (red) - Immediate attention
- **Improving**: `#3B82F6` (blue) - Positive trends

## Typography Requirements

### Font Family
- **Primary Font**: System UI stack for optimal performance
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
               "Helvetica Neue", Arial, sans-serif;
  ```

### Required Type Scale
- **Heading 1**: 24px / 32px line-height / 600 weight
- **Heading 2**: 20px / 28px line-height / 600 weight
- **Heading 3**: 18px / 24px line-height / 600 weight
- **Body Large**: 16px / 24px line-height / 400 weight
- **Body**: 14px / 20px line-height / 400 weight
- **Small**: 12px / 16px line-height / 400 weight
- **Micro**: 11px / 14px line-height / 400 weight

## Layout Requirements

### 3-Panel Layout (CRITICAL)
- **Left Panel** (Thread Sidebar): 280-320px fixed width
- **Center Panel** (Chat): Flexible, min 600px
- **Right Panel** (Medical Team/Results): 400px flexible

### Spacing System
Must use 8-point grid system for consistent spacing.

## Medical Team Visualization Requirements

### CMO (Chief Medical Officer) Design
- Center position with larger size (80px circle)
- Title: "Dr. Vitality - CMO"
- Must be visually prominent as the orchestrator
- Use primary gradient or solid primary color

### Specialist Layout Requirements
- Arrange in arc/circle around CMO
- 60px circles for each specialist
- Connect to CMO with animated SVG lines
- Display specialty icon + name
- Show real-time status

### Required Status States
- **Waiting**: Gray border, reduced opacity
- **Thinking**: Pulsing animation (2s cycle)
- **Active**: Solid color, animated border, progress indicator
- **Complete**: Check mark overlay, full opacity

### Connection Line Requirements
- SVG paths between specialists and CMO
- Dashed when inactive
- Solid and animated when active
- Use specialist's color when activated

## Health-Specific UI Components Required

### Lab Result Display
Must show:
- Test name and value
- Reference range
- Normal/borderline/critical status
- Trend indicator (up/down/stable)
- Historical comparison

### Medication Card
Must include:
- Medication name with icon
- Dosage and frequency
- Duration/start date
- Relevant warnings

### Medical Team Status Card
Must display:
- Specialist icon and name
- Current task description
- Progress indicator
- Confidence level

## Health Data Visualization Requirements

### Time Series Charts
- Show reference ranges as shaded areas
- Highlight abnormal values
- Use semantic colors consistently
- Include hover tooltips
- Support multiple metrics on same chart

### Required Chart Types
1. Line charts for trends over time
2. Gauge/meter for current values vs. ranges
3. Bar charts for comparisons
4. Distribution charts for patterns

## Animation Requirements

### Medical-Appropriate Animations
- **Heartbeat pulse**: For cardiology analysis
- **Flowing particles**: For blood/circulation
- **DNA helix**: For genetic/endocrine
- **Gentle waves**: For breathing/vitals
- **Progress fills**: For analysis completion

### Timing Standards
- Hover states: 150ms
- UI transitions: 300ms
- Complex animations: 500ms
- Use ease-out for natural feel

## Voice & Tone Requirements

### Medical Professional Voice
- Authoritative but approachable
- Use medical terms with lay explanations
- Empathetic to health concerns
- Educational without condescension

### Required UI Copy Patterns
- Actions: Verb + Noun ("Start Analysis")
- Status: Present progressive ("Dr. Heart is analyzing...")
- Completion: Past tense + metric ("Complete • 92% confidence")
- Errors: Helpful + actionable

## Trust-Building Elements (REQUIRED)

### Medical Credibility Features
- Display specialist expertise areas
- Show confidence levels for insights
- Include data source references
- Add appropriate disclaimers
- Provide export for physician visits

### Transparency Requirements
- Show which data was analyzed
- Display number of data points
- Indicate time ranges
- Highlight limitations

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Text contrast: 4.5:1 minimum
- Interactive elements: 3:1 minimum
- Focus indicators visible
- Keyboard navigation complete

### Health-Specific Accessibility
- High contrast option
- Large text mode
- Tooltips for medical terms
- Audio alerts for critical values
- Print-friendly reports

## Mobile Requirements

### Essential Mobile Features
- Critical values easily accessible
- Simplified navigation
- Touch-friendly targets (44x44px min)
- Offline access to recent data
- Emergency contact integration

## Icons & Imagery Requirements

### Medical Specialist Icons
```
Cardiology: ❤️ (heart)
Laboratory: 🧪 (test tube)
Endocrinology: 🧬 (DNA)
Data Analysis: 📊 (chart)
Preventive: 🛡️ (shield)
Pharmacy: 💊 (pills)
Nutrition: 🥗 (food/apple)
General Practice: 🩺 (stethoscope)
```

### Icon Style Requirements
- Consistent 2px stroke weight
- Medical-appropriate imagery
- Clear at small sizes
- Rounded, friendly style

## Implementation Priorities

### Must Have
1. All specialist colors exactly as specified
2. Medical team visualization with animations
3. Three-panel responsive layout
4. Glassmorphism effects
5. Health data visualizations
6. Loading and error states
7. Accessibility compliance

### Nice to Have
1. Dark mode support
2. Additional animation refinements
3. Extended icon library
4. Advanced data visualizations

## Success Criteria

The design system succeeds when:
- Medical professionals trust the interface
- Patients understand their health data
- The AI assistance feels seamless
- Complex data appears simple
- The system feels responsive and alive
- Accessibility needs are fully met

---

*These requirements ensure the UX Designer Agent creates a design system that makes AI-powered health analysis trustworthy, professional, and accessible to all users.*