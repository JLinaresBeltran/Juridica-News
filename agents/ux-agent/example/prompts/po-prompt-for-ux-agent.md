# Enhanced Product Owner Prompt for UX Agent

## Prompt to Submit to UX Agent

I need you to design a production-ready, modern UI/UX for a [YOUR DOMAIN] multi-agent system that feels as polished as a manually crafted application. The design should emphasize glassmorphism, smooth animations, and sophisticated information architecture.

### Critical Design Requirements:

1. **Component Library (25+ Components)**
   You MUST design and specify these components with variants:
   
   **Layout Components:**
   - MainLayout (three-panel responsive)
   - Header (branding, user info, settings)
   - ThreadSidebar (conversation management)
   - ResizablePanel (draggable dividers)
   
   **Conversation Components:**
   - ChatInterface (main interaction area)
   - MessageList (animated message flow)
   - MessageBubble (user/assistant with avatars)
   - QueryInput (enhanced with character count)
   - ToolCall (collapsible execution displays)
   - ThinkingIndicator (animated processing dots)
   
   **Agent Visualization:**
   - AgentTeamView (full org chart)
   - AgentCard (individual status cards)
   - TeamConnections (animated SVG paths)
   - ProgressIndicator (multiple types)
   - StatusBadge (state indicators)
   
   **Results & History:**
   - ResultHistory (query-based filtering)
   - QuerySelector (dropdown/list)
   - VisualizationRenderer (dynamic charts)
   - VisualizationCard (individual displays)
   - ExportButton (format options)
   
   **Utility Components:**
   - ErrorBoundary (error display with retry)
   - LoadingStates (skeleton loaders)
   - EmptyStates (helpful CTAs)
   - ConfirmDialog (modal confirmations)
   - ToastNotifications (success/error feedback)

2. **Glassmorphism Effects (CRITICAL - MUST IMPLEMENT)**
   - Primary design language throughout
   - Backdrop blur effects (10-16px)
   - Semi-transparent backgrounds
   - Subtle borders and shadows
   - Modern depth and layering

3. **Animation Specifications**
   - Agent activation: Pulsing animations with color
   - Message appearance: Slide-up with fade
   - Connection lines: Animated SVG drawing
   - Hover states: Subtle lift and shadow
   - Loading: Smooth skeleton and progress
   - Transitions: 200-300ms with cubic-bezier easing

4. **Three-Panel Layout**
   - **Left Panel (300px):** Thread sidebar with conversation history
   - **Center Panel (flexible):** Main chat interface
   - **Right Panel (400px):** Tabbed view for team/visualizations
   - Responsive: Collapses to mobile-friendly single column

5. **Thread Management UI**
   - Conversations grouped by date (Today, Yesterday, etc.)
   - Search bar with real-time filtering
   - Auto-generated thread titles
   - Delete confirmations
   - Active thread highlighting

6. **Agent Team Visualization**
   - Orchestrator in center (larger)
   - Specialists arranged around orchestrator
   - Animated SVG connections between agents
   - Status indicators: waiting, thinking, active, complete
   - Color coding per agent specialty

7. **Modern Visual Language**
   - Clean, professional aesthetic appropriate for [YOUR DOMAIN]
   - Color psychology aligned with domain
   - Typography hierarchy with excellent readability
   - Accessible color contrast (4.5:1 minimum)
   - Mobile-first responsive design

### Required Outputs:

1. **design-system.md**
   - Complete color palette with semantic meanings
   - Typography scale and usage guidelines
   - Glassmorphism CSS specifications
   - Animation timing functions
   - Spacing system (8-point grid)

2. **component-specs.md**
   - All 25+ components with detailed specifications
   - States: default, hover, active, disabled, loading
   - Variants for different contexts
   - Interaction patterns

3. **Two Interactive Prototypes (HTML):**
   - **welcome-prototype.html:** Landing experience with team preview
   - **main-app-prototype.html:** Complete working interface demo

4. **layout-guidelines.md**
   - Three-panel layout specifications
   - Responsive breakpoints and behavior
   - Panel resizing and collapsing

5. **animation-specs.md**
   - Timing, easing, and keyframe definitions
   - Micro-interactions and hover effects
   - Loading and transition animations

6. **visualization-specs.md**
   - Chart types and styling
   - Interactive elements
   - Data visualization best practices

7. **accessibility-guidelines.md**
   - WCAG 2.1 AA compliance
   - Keyboard navigation patterns
   - Screen reader optimizations

### Visual References:
[Attach any screenshots, mockups, or visual references that show the desired look and feel]

### Attached Documents:
1. PM Agent outputs (PRD, architecture, component list)
2. [Optional: Screenshots of target UI]
3. [Optional: Brand guidelines]
4. [Optional: Competitor analysis]

### Key Success Criteria:
- Interface feels modern and professional
- Animations enhance rather than distract
- Information architecture is intuitive
- Complex multi-agent workflows are visualized clearly
- Design scales from mobile to desktop
- Accessibility is built-in, not added on
- Code implementation guidance is clear

Please create designs that would make a manually crafted application proud. Every pixel should feel intentional and polished.