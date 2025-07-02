# Product Owner Initial Prompt for UX Designer Agent

## Prompt to Submit:

I need you to design the user interface for a Multi-Agent Health Insight System. This is a sophisticated health analysis application that uses an AI medical team (CMO + specialists) to provide comprehensive health insights.

I have attached the Product Manager's outputs (PRD, user stories, architecture) along with visual mockups showing the exact UI we want to achieve. The key UI/UX requirements are:

1. **3-Panel Layout**:
   - Left: Conversation threads sidebar
   - Center: Chat interface with health query input
   - Right: Context-sensitive panels (Medical Team status, Visualizations)

2. **Welcome Experience**: 
   - Health command center overview
   - Example queries to get started
   - Medical team architecture visualization

3. **Real-time Medical Team Display**:
   - Show CMO and active specialists
   - Live progress indicators for each specialist
   - Analysis results as they complete

4. **Dynamic Visualizations**:
   - Multiple chart types (time series, comparisons, correlations)
   - Query selector to switch between visualizations
   - Interactive, responsive charts

5. **Design Theme**:
   - Medical/healthcare appropriate
   - Professional yet approachable
   - Use of medical iconography
   - Glassmorphism and modern effects
   - Progressive disclosure of information

The design should feel premium and trustworthy, appropriate for health data. Users should immediately understand:
- How to ask health questions
- Which specialists are analyzing their data
- The progress of their analysis
- How to interpret the results

The multi-agent architecture (CMO + specialists) should be visualized in an intuitive way that builds confidence in the system's comprehensiveness.

Please create:
1. Complete Design System documentation (design-system.md)
2. Component specifications for all UI elements (component-specs.md)
3. Interactive HTML prototypes (welcome-prototype.html and main-app-prototype.html)
4. Responsive layout guidelines (layout-guidelines.md)
5. Accessibility considerations (accessibility-guidelines.md)
6. Animation and transition specifications (animation-specs.md)
7. Visualization specifications (visualization-specs.md)

Focus on creating a design that builds user trust while handling complex medical information in an approachable way.

**Technology Context**: The implementation will use React with Vite for the frontend, so design components that work well with React's component model. No authentication screens are needed.

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
   - Medical team visualization
   - Real-time progress indicators
   - Health data visualizations
9.  **Brand Guidelines** (health-insight-brand-guidelines.md)
   - Complete visual identity system
   - Color palette with medical specialist colors
   - Typography and spacing system
   - Component specifications
   - Voice and tone guidelines

