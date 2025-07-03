# Component Specifications: Health Insight Assistant

## Navigation Components

### Component: Header Bar

#### Purpose
Global navigation and user account access across all pages.

#### Anatomy
```
[Logo + Title] ........................... [Notifications] [User Avatar] [Settings]
```

#### States
- Default: White background with subtle shadow
- Scrolled: Glassmorphism effect activated
- Mobile: Condensed with hamburger menu

#### Props/Configuration
- `showNotifications`: boolean (default: true)
- `userName`: string
- `unreadCount`: number

#### Interaction Behavior
- Logo click → Home/Welcome page
- Notifications → Dropdown panel
- Avatar → User menu dropdown
- Settings → Settings panel

#### Accessibility
- ARIA label: "Main navigation"
- Keyboard: Tab navigation
- Focus indicators on all interactive elements

#### Implementation Notes
- Sticky positioning
- Z-index: 1000
- Height: 64px desktop, 56px mobile

---

### Component: Conversation Sidebar

#### Purpose
Manage and navigate between health conversation threads.

#### Anatomy
```
[+ New Health Conversation]
[Search conversations...]
---
Lab Results
  └─ [Icon] Cholesterol Analysis
      "What's my cholesterol trend..."
      02:58 PM
```

#### States
- Default: Collapsed on mobile, expanded on desktop
- Active conversation: Blue background
- Hover: Light gray background
- Loading: Skeleton state

#### Variants
- Full width (mobile)
- Fixed 280px (desktop)
- Collapsed icon-only mode

#### Props/Configuration
- `conversations`: Array<Conversation>
- `activeConversationId`: string
- `onNewConversation`: function
- `searchEnabled`: boolean

#### Interaction Behavior
- Click conversation → Load in center panel
- New conversation → Clear chat, show welcome
- Search → Filter conversations in real-time
- Long press (mobile) → Show options menu

#### Accessibility
- Role: "navigation"
- Current conversation: aria-current="page"
- Keyboard: Arrow keys for navigation

---

## Medical Team Components

### Component: Medical Team Status Panel

#### Purpose
Display real-time status of AI medical team members analyzing the query.

#### Anatomy
```
TEAM HIERARCHY & STATUS                    [Query Selector ▼]

    [Dr. Vitality (CMO)]
         100%
           |
    ┌------┴------┐
[Dr. Heart]  [Dr. Hormone]  [Dr. Analytics]
   85%           10%            Waiting

[Status Legend: ● Waiting ● Active ● Complete]

ANALYSIS RESULTS
[Results appear here as specialists complete]
```

#### States
- Waiting: Gray badge, no progress
- Active: Animated progress bar, percentage
- Complete: Green check, confidence score
- Failed: Red X, error state

#### Props/Configuration
- `specialists`: Array<Specialist>
- `queryComplexity`: 'simple' | 'standard' | 'complex'
- `showProgress`: boolean
- `animated`: boolean

#### Interaction Behavior
- Hover specialist → Show task details
- Click specialist → Expand findings
- Progress updates → Smooth animation
- Query selector → Switch between queries

#### Accessibility
- Live region for progress updates
- Status announced to screen readers
- Descriptive labels for each state

---

### Component: Specialist Card

#### Purpose
Represent individual medical specialist with status and progress.

#### Anatomy
```
[●] [Icon] Dr. Heart - Cardiology          [85%]
    Current task: Analyzing cardiovascular data...
    [████████████░░░░░░░░] 85%
```

#### States
- Waiting: Grayed out, no activity
- Active: Pulsing icon, progress bar animating
- Complete: Confidence score displayed
- Expanded: Show detailed findings

#### Props/Configuration
- `specialist`: SpecialistData
- `showTask`: boolean
- `expandable`: boolean
- `animateProgress`: boolean

#### Interaction Behavior
- Status dot pulses when active
- Progress bar fills smoothly
- Click to expand findings
- Hover for task tooltip

#### Accessibility
- Progress percentage in aria-valuenow
- Status changes announced
- Expandable state indicated

---

## Chat Interface Components

### Component: Chat Message

#### Purpose
Display health queries and AI responses in conversation format.

#### Anatomy
```
[Avatar] [Name] · [Timestamp]
[Message content with rich formatting]
[Tool Call indicator if applicable]
```

#### Variants
- User message: Right-aligned, blue background
- CMO message: Left-aligned, white background
- Tool call: Collapsible code view
- Status update: Centered, subtle styling

#### Props/Configuration
- `message`: MessageData
- `showAvatar`: boolean
- `showTimestamp`: boolean
- `collapsible`: boolean (for tool calls)

#### Interaction Behavior
- Tool calls collapse/expand
- Copy message on long press
- Hover shows full timestamp
- Links open in new tab

#### Accessibility
- Semantic HTML structure
- Screen reader friendly timestamps
- Clear message attribution

---

### Component: Query Input

#### Purpose
Primary interface for users to ask health questions.

#### Anatomy
```
[Text input area... (placeholder: "Ask about labs, medications, correlations, or health")]
[Mic] [Attachment] [Send →]
```

#### States
- Empty: Placeholder visible, send disabled
- Typing: Character count, send enabled
- Submitting: Loading state, input disabled
- Error: Red border, error message

#### Props/Configuration
- `placeholder`: string
- `maxLength`: number (default: 1000)
- `showVoiceInput`: boolean
- `showAttachments`: boolean

#### Interaction Behavior
- Auto-resize up to 4 lines
- Enter to send (Shift+Enter for newline)
- Voice input → Speech to text
- Paste → Handle rich text

#### Accessibility
- Label: "Health question input"
- Announce character limit
- Error messages in live region

---

## Visualization Components

### Component: Interactive Chart Container

#### Purpose
Display health data visualizations with interactive features.

#### Anatomy
```
[Chart Title]                    [⋮] [↗] [⊡]
[Chart Area with data visualization]
[Legend] [Time range selector]
```

#### Variants
- Line chart: Trends over time
- Bar chart: Comparisons
- Scatter plot: Correlations
- Combined: Multiple visualizations

#### Props/Configuration
- `data`: ChartData
- `type`: ChartType
- `interactive`: boolean
- `showLegend`: boolean
- `timeRange`: DateRange

#### Interaction Behavior
- Hover → Detailed tooltip
- Click and drag → Zoom
- Double click → Reset zoom
- Legend items → Toggle series
- Fullscreen → Expand view

#### Accessibility
- Keyboard navigation for data points
- Screen reader descriptions
- High contrast mode support
- Data table alternative view

---

### Component: Health Metric Card

#### Purpose
Display individual health metrics with visual indicators.

#### Anatomy
```
HDL Cholesterol          Triglycerides
[33] mg/dL              [153] mg/dL
Target: ≥40 (men)       Target: <150
[● Good Cholesterol]    [● Extreme Volatility]
```

#### States
- Normal: Green indicator
- Warning: Yellow indicator
- Critical: Red indicator
- Improving: Up arrow
- Declining: Down arrow

#### Props/Configuration
- `metric`: HealthMetric
- `showTarget`: boolean
- `showTrend`: boolean
- `compact`: boolean

#### Interaction Behavior
- Click → Detailed history
- Hover → Tooltip with context
- Tap (mobile) → Expand details

#### Accessibility
- Status clearly labeled
- Color not sole indicator
- Trend direction announced

---

## Welcome Page Components

### Component: Example Query Card

#### Purpose
Provide one-click access to common health queries.

#### Anatomy
```
[Icon] Query Title
       "Full query text that will be submitted..."
       [Complexity: Standard]
```

#### States
- Default: White background
- Hover: Raised shadow, blue border
- Active: Pressed appearance
- Selected: Blue background

#### Props/Configuration
- `icon`: IconType
- `title`: string
- `query`: string
- `complexity`: QueryComplexity

#### Interaction Behavior
- Click → Submit query immediately
- Hover → Show full query
- Focus → Keyboard accessible

#### Accessibility
- Role: button
- Full query in aria-label
- Keyboard activatable

---

### Component: Medical Team Architecture Diagram

#### Purpose
Visualize the AI medical team hierarchy and specialties.

#### Anatomy
```
        [Dr. Vitality (CMO)]
        Chief Medical Officer
               |
    ┌----------┼----------┐
[Heart]   [Lab]   [Hormone]
Ready    Ready     Ready

[Legend showing specialist colors and roles]
```

#### States
- Static: Welcome page display
- Interactive: Hover for details
- Animated: Gentle floating animation

#### Props/Configuration
- `showLabels`: boolean
- `animated`: boolean
- `interactive`: boolean

#### Interaction Behavior
- Hover specialist → Tooltip with role
- Click → Learn more (if enabled)
- Smooth entrance animation

#### Accessibility
- Alt text describing hierarchy
- Focusable elements if interactive
- Motion respects preferences

---

## Feedback Components

### Component: Progress Indicator

#### Purpose
Show real-time progress of analysis or operations.

#### Anatomy
```
[█████████░░░░░░░] 75%
Analyzing cardiovascular data...
```

#### Variants
- Linear: Standard progress bar
- Circular: For compact spaces
- Indeterminate: Unknown duration
- Segmented: Multi-step process

#### Props/Configuration
- `value`: number (0-100)
- `showPercentage`: boolean
- `showLabel`: boolean
- `variant`: 'linear' | 'circular'

#### Interaction Behavior
- Smooth value transitions
- Pause on hover (if applicable)
- Click for details (optional)

#### Accessibility
- role="progressbar"
- aria-valuenow updates
- Status announced at intervals

---

### Component: Confidence Badge

#### Purpose
Display confidence scores for AI analysis results.

#### Anatomy
```
[85% confidence]
```

#### States
- High (>80%): Green
- Medium (60-80%): Yellow
- Low (<60%): Orange
- Calculating: Animated dots

#### Props/Configuration
- `value`: number
- `showLabel`: boolean
- `size`: 'sm' | 'md' | 'lg'

#### Interaction Behavior
- Hover → Explanation tooltip
- Click → Confidence details
- Smooth number animation

#### Accessibility
- Confidence level announced
- Color not sole indicator
- Descriptive tooltips

---

## Form Components

### Component: Query Selector Dropdown

#### Purpose
Switch between different queries in a conversation.

#### Anatomy
```
[▼ Query 2 of 2: Analyze cholesterol relevant medication...]
```

#### States
- Closed: Shows current selection
- Open: Dropdown with all options
- Loading: Disabled during switch
- Empty: No queries message

#### Props/Configuration
- `queries`: Array<Query>
- `currentQueryId`: string
- `onChange`: function

#### Interaction Behavior
- Click → Open dropdown
- Select → Load query results
- Keyboard → Arrow navigation
- Escape → Close dropdown

#### Accessibility
- role="combobox"
- Current selection announced
- Keyboard navigable

---

## Layout Components

### Component: Three-Panel Layout

#### Purpose
Primary application layout with sidebar, main content, and context panel.

#### Anatomy
```
[Sidebar | Main Content | Context Panel]
[280px  | Flexible     | 400px       ]
```

#### States
- Desktop: All panels visible
- Tablet: Sidebar collapsed
- Mobile: Stack panels
- Focus mode: Hide side panels

#### Props/Configuration
- `leftPanel`: ReactNode
- `centerPanel`: ReactNode
- `rightPanel`: ReactNode
- `collapsible`: boolean

#### Interaction Behavior
- Drag to resize (desktop)
- Swipe to show/hide (mobile)
- Keyboard shortcuts for panels
- Remember user preferences

#### Accessibility
- Landmark regions
- Skip links
- Focus management
- Announce panel changes

---

## Status Components

### Component: Real-time Status Message

#### Purpose
Show live updates during analysis.

#### Anatomy
```
[●] CMO is analyzing your query...
[●] Dr. Heart is analyzing cardiovascular data... [45%]
```

#### States
- Analyzing: Pulsing dot
- Complete: Static dot
- Error: Red dot
- Queued: Gray dot

#### Props/Configuration
- `status`: Status
- `message`: string
- `progress`: number
- `showDot`: boolean

#### Interaction Behavior
- Auto-dismiss when complete
- Click to dismiss (if error)
- Stack multiple messages

#### Accessibility
- Live region updates
- Status announced
- Polite or assertive based on type