# Component Specifications: Health Insight Assistant

## Navigation Components

### Component: App Header
**Purpose**: Primary navigation and branding container

**Anatomy**:
- Logo + Product name (left)
- User avatar + name (right)
- Settings icon
- Notification indicator

**States**:
- Default: White background, subtle shadow
- Scrolled: Enhanced shadow, possible blur effect

**Props/Configuration**:
- userName: string
- userAvatar: string/URL
- notificationCount: number
- onSettingsClick: function

**Interaction Behavior**:
- Logo click returns to home
- Avatar reveals user menu on click
- Settings opens preferences panel

**Accessibility**:
- Role: banner
- Aria-label: "Main navigation"
- Keyboard: Tab through interactive elements

## Panel Components

### Component: Conversation Sidebar (Left Panel)
**Purpose**: Manage and navigate between health conversations

**Anatomy**:
- New Conversation button (top)
- Search input
- Conversation list
- Each item: Title, timestamp, preview

**States**:
- Default: Light background
- Active conversation: Blue highlight
- Hover: Subtle background change

**Variants**:
- Collapsed (mobile): Hidden or overlay
- Expanded: Full 280px width

**Props/Configuration**:
- conversations: Array<Conversation>
- activeConversationId: string
- onNewConversation: function
- onSelectConversation: function

**Interaction Behavior**:
- Click conversation to switch
- Search filters in real-time
- Swipe to delete (mobile)

**Accessibility**:
- Role: navigation
- Aria-label: "Conversation history"
- Keyboard: Arrow keys to navigate

### Component: Chat Interface (Center Panel)
**Purpose**: Primary interaction area for health queries

**Anatomy**:
- Message history area
- User messages (right-aligned)
- System messages (left-aligned)
- Input area with send button
- "Medical Team Status" indicator

**States**:
- Idle: Ready for input
- Processing: Show typing indicator
- Streaming: Progressive text display

**Props/Configuration**:
- messages: Array<Message>
- onSendMessage: function
- isProcessing: boolean
- streamingText: string

**Interaction Behavior**:
- Auto-scroll to newest message
- Preserve scroll position when reviewing
- Enter key sends message
- Shift+Enter for new line

**Accessibility**:
- Live region for new messages
- Aria-label for input: "Type your health question"
- Screen reader announces status changes

### Component: Medical Team Panel (Right Panel)
**Purpose**: Visualize AI agent orchestration and results

**Anatomy**:
- Tab navigation (Medical Team, Visualization)
- Query selector dropdown
- Team Hierarchy section
- Analysis Results section

**States**:
- Loading: Skeleton state
- Active: Real-time updates
- Complete: All agents finished

**Variants**:
- Collapsed: Hidden on mobile
- Overlay: Slide-over on tablet

**Props/Configuration**:
- activeQuery: Query
- specialists: Array<Specialist>
- results: Array<AnalysisResult>
- onQuerySelect: function

**Interaction Behavior**:
- Tab switching animates content
- Query selector updates all panels
- Specialist cards show live progress
- Results appear as completed

**Accessibility**:
- Tabpanel structure
- Live region for status updates
- Keyboard navigation between tabs

## Agent Status Components

### Component: CMO Status Card
**Purpose**: Show Chief Medical Officer orchestration status

**Anatomy**:
- Blue stethoscope icon (48px)
- "Dr. Vitality" name
- Status indicator
- Progress percentage
- Current task description

**States**:
- Idle: Gray, waiting
- Active: Blue, pulsing
- Complete: Green check

**Props/Configuration**:
- status: 'idle' | 'active' | 'complete'
- progress: number (0-100)
- currentTask: string

**Interaction Behavior**:
- No direct interaction
- Updates in real-time
- Smooth progress transitions

**Accessibility**:
- Aria-live: polite
- Status announced to screen readers

### Component: Specialist Card
**Purpose**: Display individual specialist agent status

**Anatomy**:
- Colored icon (specialty-specific)
- Specialist name (e.g., "Dr. Heart")
- Specialty label
- Progress bar
- Status text
- Confidence percentage (when complete)

**States**:
- Waiting: Grayed out, queued
- Active: Colored, animated progress
- Complete: Check mark, confidence shown
- Failed: Error state with retry

**Props/Configuration**:
- specialist: SpecialistType
- status: AgentStatus
- progress: number
- confidence: number
- task: string

**Interaction Behavior**:
- Hover shows detailed task
- Click expands full findings (complete)
- Progress animates smoothly

**Accessibility**:
- Role: status
- Aria-label includes specialist and status
- Color not sole indicator

### Component: Analysis Result Card
**Purpose**: Display completed specialist findings

**Anatomy**:
- Specialist icon and name
- Confidence badge (colored by level)
- Summary text (1-2 sentences)
- "X queries executed" metadata
- Timestamp

**States**:
- Default: White background
- Expanded: Show full analysis
- High confidence: Green accent
- Low confidence: Yellow accent

**Props/Configuration**:
- specialist: Specialist
- confidence: number
- summary: string
- queryCount: number
- fullAnalysis: string

**Interaction Behavior**:
- Click to expand/collapse
- Copy button for sharing
- Hover shows timestamp

**Accessibility**:
- Expandable region pattern
- Confidence announced
- Semantic heading structure

## Data Input Components

### Component: Health Query Input
**Purpose**: Primary input for health questions

**Anatomy**:
- Large text input area
- Placeholder with examples
- Send button (arrow icon)
- Character count (optional)
- Voice input button (future)

**States**:
- Empty: Show placeholder
- Typing: Active border
- Sending: Disabled, loading
- Error: Red border, message

**Props/Configuration**:
- value: string
- placeholder: string
- onSubmit: function
- maxLength: number
- isLoading: boolean

**Interaction Behavior**:
- Auto-resize up to 3 lines
- Enter sends (Shift+Enter for line break)
- Maintain focus after send
- Clear after successful send

**Accessibility**:
- Label: "Ask about your health"
- Error messages announced
- Submit on Enter configurable

### Component: Query Selector Dropdown
**Purpose**: Navigate between queries in a conversation

**Anatomy**:
- Dropdown trigger with current query
- Query count indicator
- Dropdown menu with all queries
- Each item: truncated query + timestamp

**States**:
- Closed: Show current selection
- Open: Display all options
- Hover: Highlight option

**Props/Configuration**:
- queries: Array<Query>
- currentQueryId: string
- onChange: function

**Interaction Behavior**:
- Click to open menu
- Select changes all related panels
- Escape closes menu
- Auto-scrolls chat to query

**Accessibility**:
- Role: combobox
- Aria-expanded state
- Keyboard navigation

## Visualization Components

### Component: Interactive Chart Container
**Purpose**: Display dynamic health data visualizations

**Anatomy**:
- Chart title and metrics
- Legend (interactive)
- Chart area (responsive)
- Axis labels
- Tooltip on hover
- Export button

**States**:
- Loading: Skeleton chart
- Rendered: Full interactivity
- Error: Fallback message
- Empty: No data message

**Variants**:
- Time series line chart
- Comparison bar chart
- Correlation scatter plot
- Distribution histogram

**Props/Configuration**:
- type: ChartType
- data: ChartData
- config: ChartConfig
- onDataPointClick: function

**Interaction Behavior**:
- Hover shows detailed tooltip
- Click legend to toggle series
- Drag to zoom (desktop)
- Pinch to zoom (mobile)
- Double-click to reset

**Accessibility**:
- Alternative text description
- Keyboard navigation to data points
- Screen reader data table option
- High contrast mode support

## Feedback Components

### Component: Welcome Screen Hero
**Purpose**: First-time user orientation

**Anatomy**:
- Medical team status indicator
- Welcome message
- 3-point value proposition
- Example queries section
- CTA button

**States**:
- Initial: Fade in animation
- Loaded: Ready state
- Dismissed: Transition to chat

**Props/Configuration**:
- userName: string
- onGetStarted: function
- exampleQueries: Array<string>

**Interaction Behavior**:
- Example queries are clickable
- CTA prominent and centered
- Smooth transition to chat view

**Accessibility**:
- Focus management on load
- Clear heading hierarchy
- Descriptive button text

### Component: Loading Skeleton
**Purpose**: Placeholder during data fetching

**Anatomy**:
- Animated gradient bars
- Layout matches final content
- Subtle pulse animation

**States**:
- Active: Pulsing animation
- Transitioning: Fade to content

**Variants**:
- Text lines (messages)
- Cards (specialists)
- Charts (visualizations)

**Props/Configuration**:
- variant: SkeletonType
- count: number (for lists)
- animate: boolean

**Interaction Behavior**:
- No interaction
- Smooth transition to real content

**Accessibility**:
- Aria-busy: true
- Hidden from screen readers
- Appropriate loading message

## Animation Specifications

### Specialist Activation Sequence
```
1. CMO card highlights (0ms)
2. Specialist cards appear staggered (100ms each)
3. Progress bars animate (300ms ease-out)
4. Status text updates (immediate)
5. Completion celebration (scale + fade)
```

### Panel Transitions
```
- Tab switch: 300ms slide + fade
- Query change: 200ms fade
- Sidebar toggle: 250ms slide
- Modal open: 200ms scale + fade
```

### Micro-interactions
```
- Button hover: 150ms color/shadow
- Card hover: 200ms elevation
- Progress update: 300ms width
- Confidence badge: 400ms scale in
```

## Implementation Notes

### Performance Considerations
- Virtualize long conversation lists
- Lazy load visualization libraries
- Debounce search inputs (300ms)
- Memoize expensive chart renders
- Progressive message rendering

### State Management
- Global: User session, conversations
- Local: UI state, form inputs
- Real-time: WebSocket for agent updates
- Cached: Query results, visualizations

### Responsive Behavior
- Mobile: Stack panels, bottom sheet pattern
- Tablet: Hide sidebar, overlay right panel
- Desktop: Full 3-panel layout
- Large: Increase center panel max-width

### Error Handling
- Network errors: Retry with exponential backoff
- Agent failures: Show partial results
- Invalid input: Inline validation messages
- Session timeout: Graceful re-authentication