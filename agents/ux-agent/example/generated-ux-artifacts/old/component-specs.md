# Component Specifications: Multi-Agent Health Insight System

## Navigation Components

### Component: App Header
#### Purpose
Global navigation bar with branding, user info, and settings access

#### Anatomy
- Logo + Brand Name (left)
- Medical Team Status indicator (center)
- User info + Last checkup timestamp (right)
- Settings gear icon

#### States
- Default: White background
- Scrolled: Subtle shadow appears

#### Props/Configuration
- `userName`: string
- `lastCheckup`: date
- `systemStatus`: 'ready' | 'analyzing' | 'error'

#### Interaction Behavior
- Logo click returns to home
- Settings opens preferences modal
- Status indicator shows real-time system health

#### Accessibility
- Skip to main content link
- aria-label for all icon buttons
- Role="banner" for header

---

## Layout Components

### Component: Three-Panel Layout
#### Purpose
Main application structure with collapsible sidebars

#### Anatomy
- Left sidebar: 280px fixed (collapsible to 60px)
- Center panel: Flexible (min 600px)
- Right panel: 400px flexible (collapsible)

#### States
- Default: All panels visible
- Collapsed sidebar: Icon-only mode
- Mobile: Stacked layout

#### Props/Configuration
- `leftPanelOpen`: boolean
- `rightPanelOpen`: boolean
- `rightPanelContent`: 'medical-team' | 'visualization'

#### Interaction Behavior
- Drag borders to resize (desktop)
- Click collapse buttons to toggle panels
- Swipe gestures on mobile

#### Accessibility
- Landmark regions for each panel
- Keyboard shortcuts for panel toggle
- Focus management on collapse/expand

---

## Conversation Components

### Component: Conversation Thread List
#### Purpose
Display all health conversations in the sidebar

#### Anatomy
- Search bar at top
- Thread items with:
  - Conversation title (auto-generated)
  - Timestamp
  - Query preview
  - Complexity badge

#### States
- Default: Chronological list
- Active: Highlighted current thread
- Hover: Subtle background change
- Loading: Skeleton items

#### Props/Configuration
- `conversations`: Array<Conversation>
- `activeId`: string
- `onSelect`: (id: string) => void

#### Interaction Behavior
- Click to switch conversations
- Search filters in real-time
- Auto-scroll to active thread

#### Accessibility
- Role="navigation"
- aria-current for active thread
- Keyboard navigation with arrow keys

---

## Chat Components

### Component: Chat Message
#### Purpose
Display user queries and AI responses with rich formatting

#### Anatomy
- Avatar (user photo or AI icon)
- Message bubble with:
  - Content (markdown support)
  - Timestamp
  - Tool calls (collapsible)
  - Confidence indicators

#### States
- User message: Right-aligned, primary color
- AI message: Left-aligned, white background
- Streaming: Typing indicator
- Error: Red border with retry button

#### Props/Configuration
- `role`: 'user' | 'assistant' | 'system'
- `content`: string (markdown)
- `timestamp`: date
- `toolCalls`: Array<ToolCall>
- `confidence`: number (0-100)

#### Interaction Behavior
- Expand/collapse tool calls
- Copy message content
- Hover shows exact timestamp

#### Accessibility
- Screen reader announces role
- Live region for streaming content
- Semantic HTML for message structure

---

## Medical Team Components

### Component: Medical Team Hierarchy
#### Purpose
Visualize the CMO and specialist relationships

#### Anatomy
- CMO at center (larger node)
- Specialists in orbit around CMO
- Connection lines showing relationships
- Status indicators on each node

#### States
- Waiting: Gray, dashed connection
- Active: Colored, animated connection
- Complete: Colored, solid connection
- Error: Red highlight

#### Props/Configuration
- `specialists`: Array<Specialist>
- `activeSpecialists`: Array<string>
- `completedSpecialists`: Array<string>

#### Interaction Behavior
- Hover shows specialist details
- Click to see specialist's analysis
- Animated transitions between states

#### Accessibility
- Alt text describing team structure
- Keyboard navigation between nodes
- Status announced to screen readers

### Component: Specialist Card
#### Purpose
Show individual specialist status and progress

#### Anatomy
- Specialist icon (48px colored circle)
- Name and specialty
- Current task description
- Progress bar (0-100%)
- Agent/Overall confidence badges

#### States
- Waiting: Grayed out
- Active: Pulsing animation
- Complete: Check mark overlay
- Error: Warning icon

#### Props/Configuration
- `specialist`: MedicalSpecialty
- `status`: 'waiting' | 'active' | 'complete' | 'error'
- `progress`: number (0-100)
- `task`: string
- `confidence`: number

#### Interaction Behavior
- Real-time progress updates
- Smooth progress bar animations
- Click to expand full analysis

#### Accessibility
- aria-valuenow for progress
- Live region for status updates
- Descriptive labels for icons

---

## Query Components

### Component: Query Input
#### Purpose
Primary interface for entering health questions

#### Anatomy
- Text input with placeholder
- Microphone icon (future: voice input)
- Send button
- Character counter
- Example query chips below

#### States
- Default: Empty with placeholder
- Typing: Active border, send button enabled
- Submitting: Loading spinner
- Error: Red border with message

#### Props/Configuration
- `placeholder`: string
- `maxLength`: number (default: 1000)
- `exampleQueries`: Array<string>
- `onSubmit`: (query: string) => void

#### Interaction Behavior
- Enter key submits
- Click example to auto-fill
- Auto-resize for multiline
- Disable during analysis

#### Accessibility
- Clear label association
- Error messages linked to input
- Keyboard shortcuts documented

### Component: Query Selector
#### Purpose
Navigate between multiple queries in a conversation

#### Anatomy
- Dropdown with query previews
- Query number indicator
- Complexity badge
- Timestamp

#### States
- Default: Shows current query
- Open: Dropdown list visible
- Hover: Highlight option

#### Props/Configuration
- `queries`: Array<Query>
- `activeQuery`: string
- `onChange`: (queryId: string) => void

#### Interaction Behavior
- Click to open dropdown
- Select to switch context
- Updates all panels simultaneously

#### Accessibility
- Combobox pattern
- Keyboard navigation
- Announces selection changes

---

## Visualization Components

### Component: Dynamic Chart Container
#### Purpose
Render AI-generated visualizations with consistent styling

#### Anatomy
- Chart title and description
- Interactive chart area
- Legend (when applicable)
- Zoom/pan controls
- Export button

#### States
- Loading: Skeleton chart
- Rendered: Full interactivity
- Error: Fallback message

#### Props/Configuration
- `code`: string (React component)
- `data`: any (chart data)
- `type`: ChartType
- `config`: VisualizationConfig

#### Interaction Behavior
- Hover for tooltips
- Click and drag to zoom
- Pan with arrow keys
- Export as image/PDF

#### Accessibility
- Descriptive title required
- Data table alternative
- Keyboard navigation
- High contrast mode

### Component: Code Artifact Viewer
#### Purpose
Display streaming visualization code with syntax highlighting

#### Anatomy
- Header with title and language
- Code area with line numbers
- Copy button
- Collapse/expand toggle
- Streaming indicator

#### States
- Streaming: Progressive reveal
- Complete: Full code visible
- Collapsed: Show preview only

#### Props/Configuration
- `code`: string
- `language`: string
- `streaming`: boolean
- `initialCollapsed`: boolean

#### Interaction Behavior
- Syntax highlighting
- Line number clicking
- Copy to clipboard
- Smooth scroll during stream

#### Accessibility
- Code announced as preformatted
- Copy button feedback
- Keyboard navigation

---

## Feedback Components

### Component: Progress Indicator
#### Purpose
Show real-time analysis progress with context

#### Anatomy
- Progress bar (4px height)
- Percentage text
- Status message
- Estimated time remaining

#### States
- Idle: 0% gray
- Active: Animated fill
- Complete: 100% green
- Error: Red with retry

#### Props/Configuration
- `value`: number (0-100)
- `status`: string
- `showPercentage`: boolean
- `estimatedTime`: number

#### Interaction Behavior
- Smooth animations
- Hover for detailed status
- Click to view activity log

#### Accessibility
- progressbar role
- aria-valuenow updates
- Live region for status

### Component: Confidence Badge
#### Purpose
Display analysis confidence levels clearly

#### Anatomy
- Percentage value
- Color-coded background
- Optional icon

#### States
- High (>80%): Green
- Medium (50-80%): Yellow
- Low (<50%): Orange

#### Props/Configuration
- `value`: number (0-100)
- `size`: 'sm' | 'md' | 'lg'
- `showIcon`: boolean

#### Interaction Behavior
- Hover for explanation
- Click for methodology

#### Accessibility
- Clear color alternatives
- Text always visible
- Descriptive tooltips

---

## Welcome Page Components

### Component: Hero Section
#### Purpose
Introduce the system and its capabilities

#### Anatomy
- Large title with subtitle
- Medical team visualization
- Key feature highlights
- CTA button to start

#### States
- Initial: Fade-in animation
- Interactive: Hover effects

#### Props/Configuration
- `userName`: string (optional)
- `isReturningUser`: boolean

#### Interaction Behavior
- Animated entrance
- Interactive team visualization
- Smooth scroll to examples

#### Accessibility
- Proper heading hierarchy
- Alt text for visualizations
- Focus management

### Component: Example Query Cards
#### Purpose
Provide quick-start options for new users

#### Anatomy
- Icon representing query type
- Query text
- Complexity indicator
- Expected duration

#### States
- Default: Subtle shadow
- Hover: Elevated, colored border
- Clicked: Loading state

#### Props/Configuration
- `icon`: IconType
- `query`: string
- `complexity`: ComplexityLevel
- `estimatedTime`: string

#### Interaction Behavior
- Click to instantly submit
- Hover for more details
- Keyboard selectable

#### Accessibility
- Descriptive labels
- Keyboard navigation
- Clear focus indicators