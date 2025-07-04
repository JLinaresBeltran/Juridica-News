# Component Architecture - Health Insight Assistant

## Overview

The Health Insight Assistant follows a modular component architecture using React 18.2 with TypeScript. Components are organized by feature and responsibility, with clear separation between presentation and business logic.

## Component Hierarchy

```
App
├── MainLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── UserMenu
│   │   └── NotificationBell
│   ├── ThreadSidebar (Left Panel)
│   │   ├── NewConversationButton
│   │   ├── SearchBar
│   │   ├── ThreadList
│   │   │   └── ThreadItem[]
│   │   └── ThreadCategories
│   ├── ChatInterface (Center Panel)
│   │   ├── MessageList
│   │   │   ├── MessageBubble[]
│   │   │   ├── AgentStatus[]
│   │   │   └── ToolCallDisplay[]
│   │   ├── QueryInput
│   │   │   ├── TextArea
│   │   │   ├── SendButton
│   │   │   └── SuggestedQueries
│   │   └── WelcomeScreen
│   └── ContextPanel (Right Panel)
│       ├── TabNavigation
│       ├── MedicalTeamTab
│       │   ├── QuerySelector
│       │   ├── TeamHierarchy
│       │   │   └── SpecialistCard[]
│       │   └── AnalysisResults
│       └── VisualizationTab
│           ├── VisualizationRenderer
│           └── VisualizationControls
```

## Core Layout Components

### MainLayout
```typescript
interface MainLayoutProps {
  children?: React.ReactNode;
}

// Manages 3-panel responsive layout with resizable panels
// Handles panel state persistence to localStorage
// Provides layout context to child components
```

**Key Features:**
- Resizable panel dividers with drag handles
- Collapsible panels for mobile/focus mode
- Panel size persistence across sessions
- Responsive breakpoint handling

### Header
```typescript
interface HeaderProps {
  user?: User;
  onSettingsClick: () => void;
}

// Global header with branding and user controls
// Fixed position with glassmorphism effect
```

**Key Features:**
- Health Insight Assistant branding
- User profile dropdown
- Settings access
- Notification center

### ResizablePanel
```typescript
interface ResizablePanelProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth: number;
  onResize?: (width: number) => void;
  children: React.ReactNode;
}

// Reusable resizable panel component
// Used for sidebar and context panel
```

## Conversation Components

### ThreadSidebar
```typescript
interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onThreadDelete: (threadId: string) => void;
}

// Left panel managing conversation threads
// Implements search, filtering, and organization
```

**Key Features:**
- Real-time search across conversations
- Automatic date categorization
- Thread management actions
- Keyboard navigation support

### ThreadItem
```typescript
interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

// Individual thread display with preview
// Shows title, date, and last message
```

### ChatInterface
```typescript
interface ChatInterfaceProps {
  thread: Thread | null;
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

// Main conversation area
// Handles message display and input
```

**Key Features:**
- Auto-scrolling message list
- Real-time status updates
- Tool call visualizations
- Welcome screen for new users

### MessageBubble
```typescript
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  showStatus?: boolean;
}

// Individual message display
// Supports markdown and formatting
```

**Styling:**
- User messages: Right-aligned with primary color
- Assistant messages: Left-aligned with neutral color
- Smooth animations for appearance

## Medical Team Components

### MedicalTeamTab
```typescript
interface MedicalTeamTabProps {
  currentQuery: HealthQuery | null;
  specialists: SpecialistResult[];
  onQuerySelect: (queryId: string) => void;
}

// Right panel tab for medical team visualization
// Shows real-time specialist progress
```

### TeamHierarchy
```typescript
interface TeamHierarchyProps {
  cmo: SpecialistInfo;
  specialists: SpecialistTask[];
  connections: Connection[];
}

// Visual representation of medical team structure
// Animated connections between specialists
```

**Visual Design:**
- CMO at top center
- Specialists arranged in arc below
- Animated connection lines
- Progress indicators on each specialist

### SpecialistCard
```typescript
interface SpecialistCardProps {
  specialist: SpecialistTask;
  result?: SpecialistResult;
  isActive: boolean;
  progress?: number;
}

// Individual specialist status display
// Shows real-time progress and results
```

**States:**
- Waiting: Grayed out with dotted border
- Active: Pulsing animation with progress bar
- Complete: Solid border with confidence score
- Failed: Red border with error indicator

### AnalysisResults
```typescript
interface AnalysisResultsProps {
  results: SpecialistResult[];
  groupBySpecialist?: boolean;
}

// Displays completed analysis findings
// Organized by specialist with confidence scores
```

## Visualization Components

### VisualizationTab
```typescript
interface VisualizationTabProps {
  visualizations: Visualization[];
  activeVisualizationId?: string;
}

// Container for health data visualizations
// Manages visualization selection and display
```

### VisualizationRenderer
```typescript
interface VisualizationRendererProps {
  component: string; // React component code
  data?: any;
  onError?: (error: Error) => void;
}

// Dynamically renders visualization components
// Uses @babel/standalone for runtime compilation
```

**Key Features:**
- Safe component execution
- Error boundaries
- Interactive chart features
- Export functionality

### QuerySelector
```typescript
interface QuerySelectorProps {
  queries: HealthQuery[];
  selectedQueryId?: string;
  onChange: (queryId: string) => void;
}

// Dropdown for filtering results by query
// Updates visualization and team display
```

## Common/Utility Components

### ErrorBoundary
```typescript
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}

// Catches component errors and prevents app crashes
// Provides graceful error display
```

### LoadingStates
```typescript
interface LoadingStateProps {
  type: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

// Consistent loading indicators across the app
// Context-appropriate loading states
```

**Variants:**
- Message skeleton
- Specialist card pulse
- Chart placeholder
- Inline spinners

### EmptyState
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Helpful empty states with guidance
// Used for no data scenarios
```

### ToastNotification
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Non-blocking notifications
// Auto-dismiss with manual close option
```

### ConfirmDialog
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

// Modal confirmation dialogs
// Used for destructive actions
```

## Hooks Architecture

### useHealthQuery
```typescript
function useHealthQuery() {
  const submit: (query: string) => Promise<void>;
  const isProcessing: boolean;
  const error: Error | null;
  const currentQuery: HealthQuery | null;
  
  return { submit, isProcessing, error, currentQuery };
}

// Manages health query submission and state
// Handles SSE connection lifecycle
```

### useSSE
```typescript
function useSSE(url: string) {
  const data: any;
  const error: Error | null;
  const readyState: number;
  const close: () => void;
  
  return { data, error, readyState, close };
}

// Generic SSE connection hook
// Handles reconnection and error recovery
```

### useLocalStorage
```typescript
function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions
) {
  const [value, setValue] = useState<T>();
  const remove: () => void;
  
  return [value, setValue, remove] as const;
}

// Type-safe localStorage with automatic serialization
// Handles storage quota and errors
```

### useThreadManager
```typescript
function useThreadManager() {
  const threads: Thread[];
  const activeThread: Thread | null;
  const createThread: (title?: string) => Thread;
  const deleteThread: (id: string) => void;
  const selectThread: (id: string) => void;
  
  return { threads, activeThread, createThread, deleteThread, selectThread };
}

// Complete thread management logic
// Persists to localStorage automatically
```

## Component Guidelines

### Performance Optimization
- Use React.memo for expensive renders
- Implement virtualization for long lists
- Lazy load visualization components
- Debounce search inputs
- Throttle resize events

### Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader announcements

### Styling Approach
```typescript
// Tailwind CSS utility classes
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

// Glassmorphism effects
<div className="backdrop-blur-md bg-white/80 border border-white/20">

// Medical specialty colors via CSS variables
<div className="bg-[var(--cardiology-color)]">
```

### Error Handling
- Component-level error boundaries
- Graceful degradation
- User-friendly error messages
- Retry mechanisms where appropriate
- Fallback UI states

### Testing Strategy
- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for user flows
- Accessibility tests with aXe
- Visual regression tests

## File Organization

```
src/components/
├── layout/
│   ├── MainLayout.tsx
│   ├── Header.tsx
│   └── ResizablePanel.tsx
├── conversation/
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── QueryInput.tsx
│   └── ThreadSidebar.tsx
├── agents/
│   ├── MedicalTeamTab.tsx
│   ├── TeamHierarchy.tsx
│   ├── SpecialistCard.tsx
│   └── AnalysisResults.tsx
├── visualization/
│   ├── VisualizationTab.tsx
│   ├── VisualizationRenderer.tsx
│   └── QuerySelector.tsx
├── common/
│   ├── ErrorBoundary.tsx
│   ├── LoadingStates.tsx
│   ├── EmptyState.tsx
│   ├── ToastNotification.tsx
│   └── ConfirmDialog.tsx
└── index.ts  // Barrel exports
```

This component architecture provides a scalable, maintainable structure for the Health Insight Assistant while ensuring excellent user experience and accessibility.