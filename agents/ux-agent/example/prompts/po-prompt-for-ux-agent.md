# Product Owner Initial Prompt for UX Designer Agent

## Prompt to Submit:

I need you to design the user interface for a Multi-Agent System. This is a sophisticated application that uses an AI team (orchestrator + specialist agents) to provide comprehensive insights.

I have attached the Product Manager's outputs (PRD, user stories, architecture) along with visual mockups showing the exact UI we want to achieve. The key UI/UX requirements are:

1. **3-Panel Layout**:
   - Left: Conversation threads sidebar
   - Center: Main interface with query input
   - Right: Context-sensitive panels (Agent Team status, Visualizations)

2. **Welcome Experience**: 
   - System overview and capabilities
   - Example queries to get started
   - Agent team architecture visualization

3. **Real-time Agent Team Display**:
   - Show orchestrator and active agents
   - Live progress indicators for each agent
   - Analysis results as they complete

4. **Dynamic Visualizations**:
   - Multiple chart types appropriate to the domain
   - Query selector to switch between visualizations
   - Interactive, responsive charts

5. **Design Theme**:
   - Domain-appropriate styling (details in attached docs)
   - Professional yet approachable
   - Use of relevant iconography
   - Glassmorphism and modern effects
   - Progressive disclosure of information

The design should feel premium and trustworthy. Users should immediately understand:
- How to interact with the system
- Which agents are working on their request
- The progress of the analysis
- How to interpret the results

The multi-agent architecture (orchestrator + specialists) should be visualized in an intuitive way that builds confidence in the system's capabilities.

Please create:
1. Complete Design System documentation (design-system.md)
2. Component specifications for all UI elements (component-specs.md)
3. Interactive HTML prototypes (welcome-prototype.html and main-app-prototype.html)
4. Responsive layout guidelines (layout-guidelines.md)
5. Accessibility considerations (accessibility-guidelines.md)
6. Animation and transition specifications (animation-specs.md)
7. Visualization specifications (visualization-specs.md)

Focus on creating a design that builds user trust while handling complex medical information in an approachable way.

**Technology Context**: 
- Frontend: React 18.2.0 with Vite 5.0.8
- Styling: Tailwind CSS 3.3.0 (CRITICAL: NOT v4) 
- Visualizations: Recharts 2.10.0
- Icons: Lucide React 0.294.0
- Design components that work well with React's component model
- Include glassmorphism effects (backdrop-blur, semi-transparent panels)
- No authentication screens are needed

**Critical Design Requirements**:
- 3-panel layout with collapsible thread sidebar (300px)
- Agent team visualization with animated status indicators
- Streaming UI patterns for real-time updates
- Tool call displays that are collapsible
- Real-time connection status indicator
- Gradient backgrounds for premium feel

## I have attached the following documents:

1. **PRD.md** (from PM Agent)
2. **user-stories.md** (from PM Agent)
3. **system-architecture.md** (from PM Agent)
4. **api-specification.md** (from PM Agent)
5. **data-models.md** (from PM Agent)
6. **feature-priority.md** (from PM Agent)
7. **tool-interface.md** (from PM Agent)
8. **User Stories, User Flows, and Mockups** (User Stories User Flows Mocks.pdf)
   - Screenshots showing the exact UI we want to achieve
   - 3-panel layout examples
   - Agent team visualization
   - Real-time progress indicators
   - Data visualizations
9. **Brand Guidelines** (health-insight-brand-guidelines.md)
   - Complete visual identity system
   - Domain-specific color palette
   - Typography and spacing system
   - Component specifications
   - Voice and tone guidelines
10. **Health UI Customization Guide** (health-ui-customization-guide.md) 
   - Medical specialist colors and icons
   - Health-specific UI components
   - Medical team visualization details
   - Trust-building elements for health data
   - Health-appropriate animations

