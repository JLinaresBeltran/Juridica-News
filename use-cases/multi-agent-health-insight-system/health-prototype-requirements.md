# Health Insight System - HTML Prototype Requirements

## Overview
This document specifies the exact requirements for the three HTML prototypes needed for the Health Insight System. These prototypes should demonstrate the complete user journey through the multi-agent health analysis system with production-quality interactions and visual polish.

## Technical Requirements for All Prototypes

### 1. Self-Contained HTML Structure
Each prototype must be a single, complete HTML file with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Title]</title>
    <!-- CDN Dependencies -->
    <script src="https://cdn.tailwindcss.com/3.3.0"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/recharts@2.10.0/dist/Recharts.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        /* All custom styles inline */
    </style>
</head>
<body>
    <!-- Complete HTML content -->
    <script type="text/babel">
        // Any React components or JavaScript
    </script>
</body>
</html>
```

### 2. Required CSS Patterns
Include these exact style patterns for consistency:

```css
/* Glassmorphism effects */
.glass-panel {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

/* Gradient background */
.gradient-bg {
    background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ddd6fe 100%);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;
}

/* Key animations */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-soft {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.fade-in-up {
    animation: fadeInUp 0.3s ease-out;
}

.pulse-soft {
    animation: pulse-soft 2s ease-in-out infinite;
}
```

## Prototype 1: Welcome/Landing Page (health-welcome-prototype.html)

### Purpose
Introduce users to the multi-agent health analysis system and demonstrate capabilities.

### Required Elements

1. **Header Section**
   - Health Insight System branding with medical icon
   - "Powered by Anthropic Claude" subtitle
   - User profile area (if logged in)

2. **Hero Section**
   - Welcome message: "Your Personal Medical Team Awaits"
   - Subtitle explaining the multi-agent system
   - Large "Start Health Analysis" CTA button

3. **Medical Team Preview**
   - Visual representation of the 8-specialist team
   - Dr. Vitality (CMO) in center, larger
   - Specialists arranged around with their colors:
     - Dr. Heart (Cardiology) - #EF4444
     - Dr. Hormone (Endocrinology) - #8B5CF6
     - Dr. Lab (Laboratory) - #10B981
     - Dr. Analytics (Data) - #F59E0B
     - Dr. Prevention (Preventive) - #F97316
     - Dr. Pharma (Pharmacy) - #FB923C
     - Dr. Nutrition (Nutrition) - #84CC16
     - Dr. Primary (General) - #06B6D4

4. **Example Query Cards**
   - At least 3 example health queries with complexity badges:
     - "What's my cholesterol trend?" (STANDARD)
     - "Review my medications" (SIMPLE)
     - "Comprehensive health assessment" (COMPLEX)
   - Hover effects showing potential insights

5. **Features Section**
   - Real-time Analysis with Medical Team
   - Interactive Health Visualizations
   - Comprehensive Health History
   - Evidence-based Recommendations

## Prototype 2: Main Application (health-main-app-prototype.html)

### Purpose
Demonstrate the full multi-agent health analysis interface in action.

### Required Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         Header (73px)                        │
├────────────┬─────────────────────────┬──────────────────────┤
│            │                         │                      │
│  Thread    │     Chat Interface      │   Medical Team/     │
│  Sidebar   │                         │   Visualizations    │
│  (320px)   │      (flex-1)          │     (45%)          │
│            │                         │                      │
└────────────┴─────────────────────────┴──────────────────────┘
```

### Required Components

1. **Header**
   - Logo and app name
   - Patient name: "George Vetticaden"
   - Health status badge: "Normal Health Status" (green)
   - Settings icon

2. **Left Sidebar - Thread Management**
   - "New Conversation" button (blue gradient)
   - Search bar with icon
   - Filter buttons: All, Labs, Medications, Vitals
   - Thread list grouped by date:
     - Today
     - Yesterday
     - Past 7 Days
   - Active thread highlighted with blue border
   - Each thread shows:
     - Title
     - Preview text
     - Timestamp
     - Status badge (In Progress/Complete)

3. **Center Panel - Chat Interface**
   - Messages area with:
     - User message (blue bubble, right-aligned)
     - System status ("Medical team consultation starting")
     - Assistant thinking state with animated dots
     - Tool call envelopes (execute_health_query_v2)
     - Medical team assembly message with specialists
     - Analysis in progress indicators
   - Input area (disabled during analysis)
   - Character count (0/2000)

4. **Right Panel - Tabbed Interface**
   - Two tabs: "Medical Team" (active) and "Visualizations (0)"
   - Query selector showing current analysis
   
   **Medical Team Tab Content:**
   - Section 1: Team Hierarchy (50% height)
     - Dr. Vitality (CMO) in center
     - Active specialists with progress bars
     - SVG connection lines (animated)
     - Active agent status card
   - Resizable divider
   - Section 2: Analysis Results (50% height)
     - "Completed Analyses" section (empty state)
     - "Live Streaming" terminal showing real-time updates

5. **State Demonstrations**
   - Show cholesterol analysis in progress
   - Dr. Heart at 75% progress
   - Dr. Hormone at 40% progress
   - Dr. Analytics waiting
   - Live terminal showing data access

### Simulated Interactions
Include JavaScript to simulate:
- Progress bar animations
- Thinking dots animation
- Message appearance animations
- Tab switching (show static visualization tab content if clicked)

## Prototype 3: Synthesis & Visualization View (health-synthesis-visualization-prototype.html)

### Purpose
Demonstrate the completed analysis state with synthesis results and dynamic visualizations.

### Required Elements

This prototype shows the system after analysis completion and must include:

1. **Same Layout Structure as Prototype 2**
   - Three-panel layout maintained
   - Header unchanged
   - Thread sidebar showing completed status

2. **Center Panel - Completed Analysis**
   - User's original query
   - Full synthesis message from Dr. Vitality including:
     - Key Findings with checkmarks/warnings
     - Trend Analysis summary
     - Current Management status
     - Actionable Recommendations
   - Visualization Agent streaming message
   - Code artifact display showing generated React component

3. **Right Panel - Visualizations Tab Active**
   - Tab switched to "Visualizations (1)" with badge
   - Visualization controls (download, copy)
   - Rendered cholesterol trends chart using Recharts:
     - 15-year timeline
     - 4 metrics (Total, LDL, HDL, Triglycerides)
     - Interactive hover states
     - Legend for toggling metrics
   - Preview/Code toggle functionality
   - Metadata showing generation details

4. **Key State Changes from Prototype 2**
   - Thread marked as "Complete" (green)
   - Input area enabled for follow-up questions
   - Medical Team tab shows all specialists at 100%
   - Analysis Results section populated
   - Visualization successfully rendered

5. **Interactive Elements**
   - Working tab switching
   - Hoverable chart with tooltips
   - Code/Preview toggle
   - Simulated chart interactions

## Visual Consistency Requirements

1. **Colors**
   - Primary blue: #3B82F6
   - Success green: #10B981
   - Warning amber: #F59E0B
   - Error red: #EF4444
   - Glass effects with white/transparent overlays

2. **Typography**
   - Headers: font-semibold
   - Body: text-sm
   - Metadata: text-xs text-gray-500

3. **Spacing**
   - Consistent padding: p-4 (16px)
   - Card spacing: space-y-4
   - Component margins following 8px grid

4. **Animations**
   - All transitions: 200-300ms ease-out
   - Loading states: smooth infinite loops
   - Hover effects: subtle transforms

## Deliverables Checklist

- [ ] health-welcome-prototype.html - Complete landing experience
- [ ] health-main-app-prototype.html - Full application interface with analysis in progress
- [ ] health-synthesis-visualization-prototype.html - Completed analysis with visualizations
- [ ] All files are self-contained with no external dependencies
- [ ] All glassmorphism effects implemented
- [ ] Animations are smooth and purposeful
- [ ] Medical team visualization is clear and engaging
- [ ] Thread management UI is fully demonstrated
- [ ] Progress indicators and loading states work
- [ ] Synthesis results are comprehensive and well-formatted
- [ ] Visualization rendering with Recharts is functional
- [ ] Color scheme matches brand guidelines
- [ ] All three prototypes demonstrate the complete user journey