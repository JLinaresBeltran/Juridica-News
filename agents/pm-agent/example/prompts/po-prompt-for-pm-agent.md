# Enhanced Product Owner Prompt for PM Agent

## Prompt to Submit to PM Agent

I need you to create a comprehensive product specification for a production-ready [YOUR DOMAIN] multi-agent system. This system should demonstrate enterprise-grade features including conversation persistence, visualization history, and comprehensive error handling.

### Core Requirements:

1. **Multi-Agent Architecture**
   - Design an orchestrator-worker pattern with one main orchestrator and multiple specialist agents
   - Each agent should have clear responsibilities and expertise areas
   - Implement progressive disclosure of analysis results
   - Include a visualization agent that generates self-contained React components

2. **Thread Management System**
   - UUID-based conversation tracking
   - Full conversation history with persistence
   - Thread organization by date (Today, Yesterday, Past 7 Days, Past 30 Days)
   - Search and filtering capabilities
   - Auto-generated thread titles
   - Export functionality

3. **Query-Based Visualization History**
   - Each query generates a unique ID for tracking
   - Multiple visualizations per query supported
   - Query selector UI for filtering visualizations
   - Timestamp tracking for all visualizations
   - Visualization categorization by type

4. **Production Features**
   - Comprehensive error handling with retry logic (3 attempts, exponential backoff)
   - Loading states for all async operations
   - Empty states with helpful CTAs
   - Network reconnection handling for SSE
   - Performance optimization (lazy loading, debouncing)
   - Accessibility compliance (WCAG 2.1 AA)

5. **Technical Requirements**
   - FastAPI backend with Python 3.11+
   - React 18.2 frontend with Vite and TypeScript
   - Server-Sent Events for real-time streaming
   - LocalStorage for client-side persistence
   - No external databases or Redis (tools handle data)

6. **UI/UX Requirements**
   - Three-panel desktop layout (thread sidebar, main chat, context panel)
   - Glassmorphism design language throughout
   - Smooth animations and transitions
   - Agent visualization with status indicators
   - Tab-based navigation for different views
   - Mobile-responsive design

7. **Testing & Evaluation**
   - Include automated testing framework
   - Performance benchmarks for each agent
   - Token usage optimization strategies
   - Success metrics and KPIs
   - Quality assurance checklist

Please create all standard PM artifacts (PRD, user stories, architecture, API specs, data models, etc.) with special attention to the production features. The system should feel as polished as a manually crafted application.

### Attached Documents:
1. [domain]-requirements.md - Domain expertise and specific requirements
2. multi-agent-architecture-brief.md - Why we're using multi-agent approach
3. tool-interface-document.md - Pre-built tools documentation
4. [Optional: UI mockups/screenshots] - Visual references for desired look
5. [Optional: brand-guidelines.md] - If you have specific visual requirements
6. Anthropic-Blog-Building-Effective-Agents.txt - Reference for best practices

### Expected Outputs:
- PRD.md with production feature requirements
- user-stories.md including thread and visualization management
- system-architecture.md with evaluation framework
- api-specification.md with all endpoints (threads, visualizations, SSE)
- data-models.md with UUID-based entities
- component-architecture.md listing 20+ required components
- evaluation-framework.md with testing specifications
- tool-interface.md showing how to use pre-built tools
- feature-priority.md with P0/P1/P2 categorization

Remember: We're building a production system, not a prototype. Every feature should be thoroughly specified with error handling, performance considerations, and user experience polish.