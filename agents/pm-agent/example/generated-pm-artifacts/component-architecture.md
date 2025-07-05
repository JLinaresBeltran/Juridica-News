# Component Architecture - Multi-Agent Health Insight System

## Overview

This document defines the component architecture for the Multi-Agent Health Insight System's React frontend. Components are organized by feature domain and designed for reusability, performance, and accessibility.

## Component Hierarchy

```
App
├── MainLayout
│   ├── Header
│   ├── ThreadSidebar
│   ├── HealthChatInterface
│   └── MedicalTeamPanel
└── Providers
    ├── HealthDataProvider
    ├── SSEProvider
    └── ErrorBoundary
```

## Core Layout Components

### MainLayout
Three-panel responsive layout container.

```typescript
interface MainLayoutProps {
  children: React.ReactNode;
  defaultPanelSizes?: {
    left: number;   // 280-320px
    right: number;  // 400px
  };
}

// Features:
// - Resizable panels with drag handles
// - Responsive breakpoints (collapses on mobile)
// - Panel state persistence in localStorage
// - Keyboard shortcuts for panel toggle
```

### Header
Application header with branding and user controls.

```typescript
interface HeaderProps {
  userName?: string;
  onSettingsClick: () => void;
  onHelpClick: () => void;
  notifications: Notification[];
}

// Components:
// - Logo and branding
// - User menu dropdown
// - Notification bell with badge
// - Settings and help icons
// - Emergency banner when detected
```

### ThreadSidebar
Health consultation thread management.

```typescript
interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onSearch: (query: string) => void;
}

// Sub-components:
// - NewThreadButton
// - SearchInput
// - ThreadList
// - ThreadItem
// - DateCategorySection
```

### ResizablePanel
Draggable panel dividers.

```typescript
interface ResizablePanelProps {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  onResize: (width: number) => void;
  position: 'left' | 'right';
}
```

## Conversation Components

### HealthChatInterface
Main health query interaction area.

```typescript
interface HealthChatInterfaceProps {
  threadId: string;
  messages: Message[];
  onQuerySubmit: (query: string) => void;
  isAnalyzing: boolean;
}

// Sub-components:
// - MessageList
// - MessageBubble
// - QueryInput
// - QuickQuerySuggestions
// - TypingIndicator
```

### MessageBubble
Individual message display with role-based styling.

```typescript
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  timestamp: number;
  specialistResults?: AnalysisResult[];
}

// Features:
// - User/assistant message styling
// - Timestamp display
// - Copy message functionality
// - Embedded specialist results
// - Markdown rendering support
```

### QueryInput
Enhanced input area for health queries.

```typescript
interface QueryInputProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  isDisabled?: boolean;
  maxLength?: number;
}

// Features:
// - Auto-expanding textarea
// - Character count
// - Submit on Enter (Shift+Enter for newline)
// - Voice input support (future)
// - Emergency keyword detection
```

### ToolCallVisualization
Display tool/API calls in chat.

```typescript
interface ToolCallVisualizationProps {
  toolName: string;
  parameters: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  duration?: number;
}
```

## Medical Team Components

### MedicalTeamView
Orchestrator and specialist visualization.

```typescript
interface MedicalTeamViewProps {
  team: MedicalTeam;
  activeSpecialist?: MedicalSpecialty;
  onSpecialistClick: (specialty: MedicalSpecialty) => void;
}

// Sub-components:
// - CMOCard (center position)
// - SpecialistCard (arc arrangement)
// - ConnectionLines (SVG)
// - TeamLegend
```

### SpecialistCard
Individual medical specialist display.

```typescript
interface SpecialistCardProps {
  specialist: SpecialistAgent;
  isActive: boolean;
  onClick: () => void;
  position: { x: number; y: number };
}

// Features:
// - Status-based styling (waiting/active/complete)
// - Progress indicator
// - Pulsing animation when active
// - Specialty icon and color
// - Confidence percentage display
```

### CMOCard
Chief Medical Officer central display.

```typescript
interface CMOCardProps {
  status: 'idle' | 'analyzing' | 'coordinating' | 'synthesizing';
  queryComplexity?: QueryComplexity;
  teamSize: number;
}

// Features:
// - Larger size than specialists
// - Primary color gradient
// - Status message display
// - Team coordination visualization
```

### ConnectionDisplay
SVG lines between CMO and specialists.

```typescript
interface ConnectionDisplayProps {
  connections: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    isActive: boolean;
    color: string;
  }>;
}

// Features:
// - Curved SVG paths
// - Animated dashes when active
// - Specialist color coding
// - Smooth transitions
```

## Result Components

### ResultHistory
Query-based result filtering.

```typescript
interface ResultHistoryProps {
  results: ResultGroup[];
  selectedQueryId?: string;
  onQuerySelect: (queryId: string) => void;
}

// Sub-components:
// - QuerySelector (dropdown)
// - ResultList
// - ResultCard
// - ConfidenceIndicator
```

### AnalysisResultCard
Display specialist findings.

```typescript
interface AnalysisResultCardProps {
  result: AnalysisResult;
  isExpanded: boolean;
  onToggle: () => void;
}

// Features:
// - Specialist badge with color
// - Confidence percentage
// - Expandable details
// - Key metrics display
// - Timestamp and duration
```

### VisualizationRenderer
Dynamic chart rendering.

```typescript
interface VisualizationRendererProps {
  visualization: VisualizationComponent;
  onExport: (format: 'png' | 'svg') => void;
  onFullscreen: () => void;
}

// Features:
// - Dynamic component execution
// - Error boundary protection
// - Export functionality
// - Fullscreen mode
// - Interactive controls
```

### ExportButton
Multi-format export options.

```typescript
interface ExportButtonProps {
  threadId: string;
  queryIds?: string[];
  formats: ExportFormat[];
  onExport: (format: ExportFormat) => void;
}
```

## Health-Specific Components

### HealthMetricDisplay
Formatted health value display.

```typescript
interface HealthMetricDisplayProps {
  metric: HealthMetric;
  showTrend?: boolean;
  showReference?: boolean;
  compact?: boolean;
}

// Features:
// - Color-coded status (normal/borderline/critical)
// - Reference range visualization
// - Trend arrows
// - Unit formatting
// - Hover for details
```

### MedicationCard
Medication information display.

```typescript
interface MedicationCardProps {
  medication: Medication;
  showAdherence?: boolean;
  showInteractions?: boolean;
}

// Features:
// - Medication icon
// - Dosage and frequency
// - Adherence percentage
// - Interaction warnings
// - Refill reminders
```

### LabResultTable
Structured lab results display.

```typescript
interface LabResultTableProps {
  results: HealthMetric[];
  groupBy?: 'date' | 'category' | 'status';
  sortable?: boolean;
}

// Features:
// - Sortable columns
// - Status indicators
// - Reference range columns
// - Export to CSV
// - Print-friendly layout
```

### RiskGauge
Visual risk score display.

```typescript
interface RiskGaugeProps {
  score: number; // 0-100
  label: string;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

// Features:
// - Animated gauge fill
// - Color-coded zones
// - Needle indicator
// - Percentage display
// - Hover for details
```

## Utility Components

### ErrorBoundary
Component-level error catching.

```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}

// Features:
// - Graceful error display
// - Error reporting
// - Recovery actions
// - Development vs production modes
```

### LoadingStates
Consistent loading indicators.

```typescript
interface LoadingStateProps {
  type: 'spinner' | 'skeleton' | 'progress';
  message?: string;
  progress?: number;
}

// Components:
// - SpinnerLoader
// - SkeletonLoader
// - ProgressBar
// - PulsingDot
```

### EmptyStates
No-data displays with actions.

```typescript
interface EmptyStateProps {
  type: 'no-threads' | 'no-results' | 'no-visualizations';
  onAction?: () => void;
  healthTip?: string;
}

// Features:
// - Contextual illustrations
// - Helpful messages
// - Action buttons
// - Health tips
```

### ConfirmDialog
User confirmation modals.

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}
```

### ToastNotification
Temporary status messages.

```typescript
interface ToastNotificationProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Tooltip
Medical term explanations.

```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}
```

## Form Components

### SearchInput
Enhanced search with filters.

```typescript
interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: string[];
  filters?: SearchFilter[];
}

interface SearchFilter {
  type: 'date' | 'specialist' | 'metric';
  options: string[];
}
```

### DateRangePicker
Health data date filtering.

```typescript
interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{
    label: string;
    getValue: () => { start: Date; end: Date };
  }>;
}
```

## Accessibility Components

### SkipLinks
Keyboard navigation shortcuts.

```typescript
interface SkipLinksProps {
  links: Array<{
    label: string;
    target: string;
  }>;
}
```

### AnnouncementRegion
Screen reader announcements.

```typescript
interface AnnouncementRegionProps {
  message: string;
  priority: 'polite' | 'assertive';
}
```

## Provider Components

### HealthDataProvider
Global health data context.

```typescript
interface HealthDataProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

// Provides:
// - Thread management
// - Query/result caching
// - Preference persistence
// - Data synchronization
```

### SSEProvider
Server-Sent Events management.

```typescript
interface SSEProviderProps {
  children: React.ReactNode;
  onMessage: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
}

// Features:
// - Auto-reconnection
// - Event type handling
// - Connection state
// - Error recovery
```

## Performance Optimizations

### Component Memoization
```typescript
// Heavy components use React.memo
export const MedicalTeamView = React.memo(MedicalTeamViewComponent);
export const VisualizationRenderer = React.memo(VisualizationRendererComponent);
```

### Code Splitting
```typescript
// Lazy load heavy components
const VisualizationPanel = React.lazy(() => import('./VisualizationPanel'));
const ExportDialog = React.lazy(() => import('./ExportDialog'));
```

### Virtual Scrolling
```typescript
// For long lists (threads, results)
import { FixedSizeList } from 'react-window';
```

## Style System

### Theme Variables
```css
:root {
  /* Health-specific colors */
  --color-normal: #10B981;
  --color-borderline: #F59E0B;
  --color-critical: #EF4444;
  
  /* Specialist colors */
  --color-cardiology: #EF4444;
  --color-laboratory: #10B981;
  --color-endocrinology: #8B5CF6;
  
  /* Layout */
  --panel-left-width: 300px;
  --panel-right-width: 400px;
  --header-height: 64px;
}
```

### Animation Constants
```typescript
const ANIMATION = {
  TRANSITION_FAST: 150,
  TRANSITION_NORMAL: 300,
  TRANSITION_SLOW: 500,
  SPECIALIST_PULSE: 2000,
  CONNECTION_DASH: 1000
};
```

## Testing Considerations

Each component should have:
- Unit tests for logic
- Integration tests for interactions
- Accessibility tests (axe-core)
- Visual regression tests
- Performance benchmarks

## Component Count Summary

**Total Components: 45+**
- Layout Components: 4
- Conversation Components: 6
- Medical Team Components: 5
- Result Components: 5
- Health-Specific Components: 4
- Utility Components: 10
- Form Components: 3
- Accessibility Components: 2
- Provider Components: 2