# Health Insight System - Component Specifications

## Overview

This document provides detailed specifications for all 25+ components in the Health Insight System. Each component is designed with medical professionalism, accessibility, and user trust in mind.

## Layout Components

### 1. MainLayout

**Purpose**: Three-panel responsive layout container for the health dashboard.

**Visual Design**:
- Full viewport height with gradient background
- Glass panels with medical-grade clarity
- Smooth resize handles between panels

**Structure**:
```
┌─────────────────────────────────────────────────────────┐
│                    Header (64px)                         │
├──────────┬────────────────────────┬─────────────────────┤
│ Thread   │                        │ Medical Team/       │
│ Sidebar  │    Chat Interface      │ Visualizations      │
│ (300px)  │     (flexible)         │ (400px)            │
└──────────┴────────────────────────┴─────────────────────┘
```

**States**:
- Default: All panels visible
- Collapsed sidebar: More space for chat
- Mobile: Single column stack
- Loading: Skeleton layout

**Interactions**:
- Drag resize handles to adjust panel widths
- Click collapse buttons to hide panels
- Keyboard shortcuts: Cmd+B (sidebar), Cmd+I (info panel)

**Accessibility**:
- Semantic HTML structure
- ARIA landmarks for navigation
- Keyboard-navigable panels

### 2. Header

**Purpose**: Application header with branding, user info, and global controls.

**Visual Design**:
- Height: 64px
- Background: Glass panel with subtle shadow
- Padding: 16px horizontal
- Border-bottom: 1px solid rgba(226, 232, 240, 0.8)

**Structure**:
- Logo + App Name (left)
- Health Status Badge (center)
- User Menu + Settings (right)

**Components**:
- Logo: 32x32px medical briefcase icon
- Title: "Health Insight Assistant" (18px, font-weight: 600)
- Status Badge: "Normal Health Status" with green indicator
- User Avatar: 36x36px circular image
- Settings Icon: 24x24px gear icon

**States**:
- Default: Normal display
- Emergency: Red banner for critical alerts
- Notifications: Badge count on bell icon

**Interactions**:
- Click user avatar: Open profile menu
- Click settings: Open settings modal
- Click notifications: Show notification panel

### 3. ThreadSidebar

**Purpose**: Manage health consultation history and conversations.

**Visual Design**:
- Width: 300px (fixed)
- Background: Glass sidebar effect
- Padding: 16px
- Overflow-y: auto with custom scrollbar

**Structure**:
```
[+ New Health Conversation] (button)
[🔍 Search conversations...] (search input)

TODAY
├─ Cholesterol Analysis
│  What's my cholesterol trend over...
│  02:36 PM
│
└─ Medication Review
   Analyze medication adherence...
   10:15 AM

YESTERDAY
└─ Blood Pressure Check
   ...
```

**Components**:
- NewConversationButton: Blue gradient, 100% width
- SearchInput: Glass input with search icon
- DateSection: Gray uppercase label
- ThreadItem: Title, preview, timestamp, status

**States**:
- Active thread: Blue left border, slight background
- Unread: Bold title
- In progress: Animated indicator
- Completed: Check icon

**Interactions**:
- Click thread: Load conversation
- Hover: Light background change
- Long press: Show delete option
- Search: Real-time filtering

### 4. ResizablePanel

**Purpose**: Draggable dividers between panels.

**Visual Design**:
- Width: 4px (expands to 8px on hover)
- Background: Transparent (shows divider on hover)
- Cursor: col-resize
- Color: rgba(203, 213, 225, 0.5)

**States**:
- Default: Subtle divider line
- Hover: Wider with grab handle
- Dragging: Blue accent color
- Disabled: No hover state

**Interactions**:
- Hover: Show resize cursor
- Drag: Resize adjacent panels
- Double-click: Reset to default size

## Health Chat Components

### 5. ChatInterface

**Purpose**: Main health query interaction area.

**Visual Design**:
- Background: Transparent (shows gradient)
- Padding: 24px
- Display: Flex column
- Height: 100%

**Structure**:
```
[Message List - scrollable area]
[Quick Query Suggestions]
[Query Input Area]
```

**Components**:
- MessageList: Scrollable container
- QuickQueries: Horizontal pill buttons
- QueryInput: Multi-line expandable

**States**:
- Empty: Welcome message
- Loading: Thinking indicators
- Analyzing: Disabled input
- Error: Error message display

### 6. MessageList

**Purpose**: Scrollable container for health conversation.

**Visual Design**:
- Overflow-y: auto
- Padding: 0 8px
- Custom scrollbar styling
- Smooth scroll behavior

**Message Spacing**:
- Between messages: 16px
- System messages: 24px margins
- Grouped messages: 8px

**Animations**:
- New messages: Slide up + fade in (300ms)
- Scroll to bottom: Smooth animation
- Loading states: Pulsing dots

### 7. MessageBubble

**Purpose**: Individual message display with role-based styling.

**Visual Design**:
```
User Messages:
- Align: Right
- Background: var(--primary-blue)
- Color: White
- Border-radius: 16px 16px 4px 16px
- Max-width: 70%

Assistant Messages:
- Align: Left
- Background: Glass card
- Color: var(--gray-800)
- Border-radius: 16px 16px 16px 4px
- Avatar: Dr. Vitality icon

System Messages:
- Align: Center
- Background: None
- Color: var(--gray-600)
- Font-size: 12px
```

**Components**:
- Avatar: 32x32px specialist icon
- Message text: Markdown support
- Timestamp: Hover to show
- Copy button: Appears on hover

**States**:
- Sending: Opacity 0.7
- Sent: Full opacity
- Failed: Red indicator
- Thinking: Animated dots

### 8. QueryInput

**Purpose**: Health question input with enhancements.

**Visual Design**:
- Background: Glass panel
- Border: 1px solid rgba(203, 213, 225, 0.3)
- Border-radius: 12px
- Padding: 12px 16px
- Min-height: 56px
- Max-height: 160px

**Components**:
- Textarea: Auto-expanding
- Character count: "0/2000"
- Send button: Blue arrow icon
- Voice input: Microphone icon (future)

**States**:
- Empty: Placeholder text
- Typing: Active border color
- Disabled: During analysis
- Error: Red border

**Interactions**:
- Type: Auto-expand height
- Enter: Send (Shift+Enter for newline)
- Emergency keywords: Show warning

### 9. ToolCall

**Purpose**: Display medical tool executions.

**Visual Design**:
- Background: rgba(59, 130, 246, 0.05)
- Border: 1px solid rgba(59, 130, 246, 0.2)
- Border-radius: 8px
- Padding: 12px
- Font-family: Monospace

**Structure**:
```
🔧 Tool Call: execute_health_query_v2
├─ Query: "cholesterol trends last 15 years"
├─ Status: ● Executing...
└─ Duration: 1.2s
```

**States**:
- Running: Blue pulsing indicator
- Success: Green check
- Failed: Red X
- Collapsed: Show summary only

### 10. ThinkingIndicator

**Purpose**: Show medical analysis in progress.

**Visual Design**:
- Three dots with specialist color
- Animation: Sequential pulsing
- Size: 8px dots, 4px spacing

**Variations**:
- CMO Thinking: Cyan dots
- Specialist Thinking: Specialist color
- System Processing: Gray dots

## Medical Team Visualization Components

### 11. MedicalTeamView

**Purpose**: Visual hierarchy of medical team.

**Visual Design**:
- Container: 100% width/height
- Layout: CMO center, specialists in arc
- Background: Subtle grid pattern
- Padding: 32px

**Structure**:
```
         [Dr. Heart]   [Dr. Hormone]   [Dr. Lab]
               \          |           /
                \         |          /
                 \        |         /
                  [Dr. Vitality]
                 /        |         \
                /         |          \
               /          |           \
      [Dr. Analytics] [Dr. Pharma] [Dr. Prevention]
```

**Animations**:
- Team assembly: Staggered fade-in
- Activation: Connection lines draw
- Completion: Success pulse

### 12. AgentCard

**Purpose**: Individual medical specialist display.

**Visual Design**:
- Size: 80px (CMO), 60px (specialists)
- Shape: Circle with glass effect
- Border: 3px solid specialist color
- Shadow: 0 4px 12px rgba(color, 0.2)

**Components**:
- Icon: Specialist medical symbol
- Name: Below circle
- Progress: Circular progress bar
- Status: Icon overlay

**States**:
- Waiting: Gray, reduced opacity
- Thinking: Pulsing animation
- Active: Full color, progress bar
- Complete: Check mark overlay
- Failed: X mark overlay

**Interactions**:
- Hover: Show specialty tooltip
- Click: View specialist details

### 13. TeamConnections

**Purpose**: Animated SVG paths between specialists.

**Visual Design**:
- Stroke: 2px
- Style: Dashed when inactive
- Color: Specialist color when active
- Animation: Draw from CMO outward

**States**:
- Inactive: Dashed, low opacity
- Activating: Drawing animation
- Active: Solid, full opacity
- Complete: Fade to subtle

### 14. ProgressIndicator

**Purpose**: Show analysis progress.

**Visual Design**:
- Type: Circular or linear
- Height: 4px (linear), 48px (circular)
- Background: rgba(0, 0, 0, 0.1)
- Fill: Specialist color

**Variations**:
- Circular: Around agent avatar
- Linear: Below agent name
- Segmented: For multi-step processes

**Animations**:
- Smooth fill progression
- Pulse at milestones
- Success flash on complete

### 15. StatusBadge

**Purpose**: Agent availability indicators.

**Visual Design**:
- Size: 12px dot
- Position: Bottom-right of avatar
- Border: 2px white

**States**:
- Waiting: Gray
- Active: Green pulsing
- Busy: Orange
- Complete: Blue check
- Error: Red

## Health Results & History Components

### 16. HealthResultHistory

**Purpose**: Query-based filtering of health analyses.

**Visual Design**:
- Container: Glass panel
- Padding: 16px
- Layout: Vertical stack

**Components**:
- QuerySelector: Dropdown
- ResultsList: Scrollable
- FilterTabs: By type
- TimeRange: Date picker

### 17. QuerySelector

**Purpose**: Dropdown to select past queries.

**Visual Design**:
- Background: Glass input
- Border-radius: 8px
- Icon: Chevron down
- Max-height: 300px scroll

**Structure**:
```
Query 1: 02:36 PM - Cholesterol trend
├─ What's my cholesterol trend over the last 15 years?
└─ STANDARD - 3 specialists

Query 2: 10:15 AM - Medication analysis
├─ Analyze medication adherence patterns
└─ COMPLEX - 5 specialists
```

### 18. VisualizationRenderer

**Purpose**: Dynamic health chart rendering.

**Visual Design**:
- Container: 100% width
- Min-height: 400px
- Background: White with shadow
- Padding: 24px

**Chart Types**:
- Line: Trends over time
- Bar: Comparisons
- Gauge: Current vs normal
- Distribution: Patterns

**Features**:
- Interactive tooltips
- Legend toggles
- Export buttons
- Zoom controls

### 19. HealthMetricCard

**Purpose**: Individual health metric display.

**Visual Design**:
- Background: Glass card
- Padding: 16px
- Border-left: 4px solid status color

**Structure**:
```
Total Cholesterol          NORMAL
185 mg/dL                    ✓
├─ Reference: <200 mg/dL
├─ Trend: ↓ Decreasing
└─ Last Updated: 2 days ago
```

### 20. ExportButton

**Purpose**: Multi-format export options.

**Visual Design**:
- Style: Secondary button
- Icon: Download
- Dropdown: Format options

**Options**:
- PDF Report
- CSV Data
- PNG Image
- Print View

## Utility Components

### 21. ErrorBoundary

**Purpose**: Graceful error handling.

**Visual Design**:
- Background: Light red glass
- Icon: Alert triangle
- Padding: 24px
- Border-radius: 12px

**Content**:
- Error message
- Retry button
- Report issue link
- Fallback content

### 22. LoadingStates

**Purpose**: Consistent loading indicators.

**Variations**:
- Skeleton: Content placeholders
- Spinner: Rotating medical cross
- Progress: Linear bar
- Dots: Thinking animation

### 23. EmptyStates

**Purpose**: No-data displays with health tips.

**Visual Design**:
- Icon: Relevant medical symbol
- Heading: Clear message
- Description: Helpful context
- Action: Primary CTA

**Examples**:
- No conversations: "Start your health journey"
- No results: "No data for this period"
- No visualizations: "Complete an analysis first"

### 24. ConfirmDialog

**Purpose**: Medical action confirmations.

**Visual Design**:
- Overlay: Blurred background
- Modal: Glass panel
- Max-width: 400px
- Buttons: Cancel/Confirm

**Content Structure**:
```
Delete Health Consultation?
This will permanently remove this conversation
and all associated health insights.

[Cancel] [Delete]
```

### 25. ToastNotifications

**Purpose**: Temporary status messages.

**Visual Design**:
- Position: Top-right
- Background: Glass with color hint
- Enter: Slide in from right
- Exit: Fade out

**Types**:
- Success: Green accent
- Error: Red accent
- Info: Blue accent
- Warning: Amber accent

## Additional Medical Components

### 26. VitalSignsCard

**Purpose**: Display current vital signs.

**Structure**:
```
Blood Pressure    Heart Rate    Temperature
120/80 mmHg      72 bpm        98.6°F
   NORMAL         NORMAL        NORMAL
```

### 27. MedicationTimeline

**Purpose**: Medication history visualization.

**Features**:
- Timeline view
- Adherence indicators
- Interaction warnings
- Refill reminders

### 28. LabResultTable

**Purpose**: Structured lab result display.

**Features**:
- Sortable columns
- Trend indicators
- Reference ranges
- Abnormal highlighting

## Implementation Guidelines

### Component Structure
```jsx
const HealthComponent = ({
  data,
  status,
  onAction,
  className,
  ...props
}) => {
  // Component logic
  return (
    <div 
      className={`glass-panel ${className}`}
      role="region"
      aria-label="Health component"
      {...props}
    >
      {/* Component content */}
    </div>
  );
};
```

### Accessibility Requirements
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader announcements

### Performance Considerations
- Use React.memo for heavy components
- Implement virtual scrolling
- Lazy load visualizations
- Optimize re-renders
- Debounce user inputs