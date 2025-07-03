# Product Owner Prompt for PM Agent - Health Insight System

## Prompt to Submit to PM Agent

I need you to create a comprehensive product specification for a production-ready Multi-Agent Health Insight System. This system should demonstrate enterprise-grade features including conversation persistence, visualization history, and comprehensive error handling.

### Core Requirements:

1. **Multi-Agent Architecture**
   - Design a Chief Medical Officer (CMO) as the orchestrator agent
   - Include 8 medical specialist agents (Cardiology, Endocrinology, Lab Medicine, Data Analytics, Preventive Medicine, Pharmacy, Nutrition, Primary Care)
   - Implement progressive disclosure of health analysis results
   - Include a visualization agent that generates health-specific React components

2. **Thread Management System**
   - UUID-based conversation tracking for health consultations
   - Full conversation history with persistence
   - Thread organization by date (Today, Yesterday, Past 7 Days, Past 30 Days)
   - Search and filtering for past health queries
   - Auto-generated thread titles from health questions
   - Export functionality for health records

3. **Query-Based Visualization History**
   - Each health query generates a unique ID for tracking
   - Multiple health visualizations per query (lab trends, vital signs, etc.)
   - Query selector UI for filtering health visualizations
   - Timestamp tracking for all health analyses
   - Visualization categorization by health metric type

4. **Production Features**
   - Comprehensive error handling with retry logic (3 attempts, exponential backoff)
   - Loading states for all async health data operations
   - Empty states with helpful health tips
   - Network reconnection handling for SSE
   - Performance optimization for large health datasets
   - Accessibility compliance (WCAG 2.1 AA) for health applications

5. **Technical Requirements**
   - FastAPI backend with Python 3.11+
   - React 18.2 frontend with Vite and TypeScript
   - Server-Sent Events for real-time health analysis streaming
   - LocalStorage for client-side health data persistence
   - Integration with pre-built Snowflake health tools

6. **UI/UX Requirements**
   - Three-panel desktop layout (thread sidebar, health chat, medical team/results panel)
   - Glassmorphism design language with medical theme
   - Smooth animations for health data transitions
   - Medical team visualization with status indicators
   - Tab-based navigation for team view and health visualizations
   - Mobile-responsive design for health monitoring on-the-go


Please create all standard PM artifacts with special attention to health domain requirements and HIPAA-compliant patterns. The system should feel as trustworthy and polished as a professional medical application.

### Attached Documents:
1. health-domain-requirements.md - Medical domain expertise and health data types
2. multi-agent-architecture-brief.md - Why we're using multi-agent for healthcare
3. tool-interface-document.md - Snowflake health tools documentation
4. User Stories User Flows Mocks.pdf - Visual references for health UI
5. health-insight-brand-guidelines.md - Medical visual identity
6. Anthropic-Blog-Building-Effective-Agents.txt - Reference for best practices

### Expected Outputs:
- PRD.md with health system production features
- user-stories.md including health consultation management
- system-architecture.md with medical team structure
- api-specification.md with health data endpoints
- data-models.md with health-specific entities
- component-architecture.md for medical UI components
- tool-interface.md for Snowflake health tools
- feature-priority.md with health feature prioritization

Remember: We're building a production health system that handles sensitive medical data. Every feature should be thoroughly specified with error handling, performance considerations, and medical user experience polish.