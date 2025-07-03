# Product Owner Prompt for UX Agent - Health Insight System

## Prompt to Submit to UX Agent

I need you to design a production-ready, modern UI/UX for a Multi-Agent Health Insight System that feels as polished as a manually crafted medical application. The design should emphasize glassmorphism, smooth animations, and sophisticated health information architecture.

### Critical Design Requirements:

1. **Component Library (25+ Components)**
   You MUST design and specify these health-focused components with variants:
   
   **Layout Components:**
   - MainLayout (three-panel responsive health dashboard)
   - Header (Health Insight branding, user profile, settings)
   - ThreadSidebar (health consultation history)
   - ResizablePanel (draggable dividers)
   
   **Health Chat Components:**
   - ChatInterface (health query interaction)
   - MessageList (animated health conversation flow)
   - MessageBubble (patient/Dr. Vitality messages)
   - QueryInput (health question input with suggestions)
   - ToolCall (medical tool execution displays)
   - ThinkingIndicator (medical analysis processing)
   
   **Medical Team Visualization:**
   - MedicalTeamView (CMO and specialist org chart)
   - AgentCard (individual doctor status cards)
   - TeamConnections (animated SVG medical team paths)
   - ProgressIndicator (health analysis progress)
   - StatusBadge (doctor availability indicators)
   
   **Health Results & History:**
   - HealthResultHistory (query-based health filtering)
   - QuerySelector (health question dropdown)
   - VisualizationRenderer (health charts - labs, vitals)
   - HealthMetricCard (individual health displays)
   - ExportButton (health record export)
   
   **Utility Components:**
   - ErrorBoundary (medical error handling)
   - LoadingStates (health data loading)
   - EmptyStates (health tips when no data)
   - ConfirmDialog (health action confirmations)
   - ToastNotifications (health alerts)

2. **Glassmorphism Effects (CRITICAL - MUST IMPLEMENT)**
   - Medical-grade clean aesthetic
   - Backdrop blur for depth (10-16px)
   - Semi-transparent health panels
   - Subtle medical blue accents
   - Professional healthcare layering

3. **Animation Specifications**
   - Doctor activation: Pulsing with specialty color
   - Health message appearance: Gentle slide-up
   - Medical team connections: Drawing animation
   - Health data loading: Smooth skeleton
   - Vital sign updates: Subtle transitions
   - Medical confidence: 200-300ms easing

4. **Three-Panel Health Layout**
   - **Left Panel (300px):** Health consultation threads
   - **Center Panel (flexible):** Health chat with Dr. Vitality
   - **Right Panel (400px):** Medical Team / Health Visualizations tabs
   - Responsive: Mobile health monitoring

5. **Health Thread Management UI**
   - Health consultations by date (Today, Yesterday, etc.)
   - Search past health questions
   - Auto-titles from health queries
   - Delete health conversations safely
   - Active consultation highlighting

6. **Medical Team Visualization**
   - CMO (Dr. Vitality) in center (larger)
   - 8 Medical specialists around:
     - Dr. Heart (Cardiology) - Red #EF4444
     - Dr. Hormone (Endocrinology) - Purple #8B5CF6
     - Dr. Lab (Laboratory) - Green #10B981
     - Dr. Analytics (Data) - Yellow #F59E0B
     - Dr. Prevention (Preventive) - Orange #F97316
     - Dr. Pharma (Pharmacy) - Orange #FB923C
     - Dr. Nutrition (Nutrition) - Lime #84CC16
     - Dr. Primary (General) - Cyan #06B6D4
   - Animated connections showing collaboration
   - Medical specialty status indicators

7. **Healthcare Visual Language**
   - Clean, trustworthy medical aesthetic
   - Calming blues and health-positive greens
   - Clear medical data hierarchy
   - HIPAA-appropriate privacy indicators
   - Accessible health information design

### Required Outputs:

1. **design-system.md**
   - Medical color palette with health meanings
   - Healthcare typography for readability
   - Medical glassmorphism specifications
   - Health animation guidelines
   - Medical spacing system

2. **component-specs.md**
   - All 25+ health components detailed
   - Medical states and interactions
   - Health-specific variants
   - Accessibility for medical users

3. **Two Interactive Prototypes (HTML):**
   - **welcome-prototype.html:** Health system intro with medical team
   - **main-app-prototype.html:** Full health consultation interface

4. **layout-guidelines.md**
   - Health dashboard three-panel specs
   - Medical responsive breakpoints
   - Health data panel behaviors

5. **animation-specs.md**
   - Medical team animations
   - Health data transitions
   - Vital sign update effects

6. **visualization-specs.md**
   - Health chart types (lab trends, vital signs)
   - Medical data best practices
   - Interactive health metrics

7. **accessibility-guidelines.md**
   - Healthcare WCAG compliance
   - Medical keyboard navigation
   - Health screen reader optimization

### Visual References:
[Attached: User Stories User Flows Mocks.pdf showing the exact health UI we want]

### I have attached the following documents:

1. **PRD.md** (from PM Agent)
2. **user-stories.md** (from PM Agent)
3. **system-architecture.md** (from PM Agent)
4. **api-specification.md** (from PM Agent)
5. **data-models.md** (from PM Agent)
6. **feature-priority.md** (from PM Agent)
7. **tool-interface.md** (from PM Agent)
8. **User Stories, User Flows, and Mockups** (User Stories User Flows Mocks.pdf)
   - Screenshots showing the exact health UI we want to achieve
   - 3-panel layout examples
   - Medical team visualization
   - Real-time progress indicators
   - Health data visualizations
9. **Technology Requirements** (technology-requirements.md)
   - Frontend stack: React 18.2.0 with Vite 5.0.8
   - Styling: Tailwind CSS 3.3.0 (NOT v4)
   - Icons: Lucide React 0.294.0
   - Visualizations: Recharts 2.10.0
   - Critical design constraints (3-panel layout, glassmorphism, no auth)
10. **Health Insight Brand Guidelines** (health-insight-brand-guidelines.md)
   - Complete medical visual identity system
   - Healthcare color palette
   - Typography and spacing system
   - Medical component specifications
   - Voice and tone guidelines
11. **Health UI Customization Guide** (health-ui-customization-guide.md) 
   - Medical specialist colors and icons
   - Health-specific UI components
   - Medical team visualization details
   - Trust-building elements for health data
   - Health-appropriate animations

### Key Success Criteria:
- Interface feels trustworthy for health data
- Medical animations are calming, not distracting
- Health information architecture is intuitive
- Complex medical team workflows are clear
- Design works for health monitoring on all devices
- Medical accessibility is exemplary
- Implementation guides medical UI perfectly

Please create designs that inspire confidence in handling sensitive health data. Every pixel should convey medical professionalism and care.