# Product Owner Initial Prompt for Product Management Agent

## Prompt to Submit:

I need to build a Multi-Agent Health Insight System that uses Anthropic's orchestrator-worker pattern (as described in their blog post: https://www.anthropic.com/engineering/built-multi-agent-research-system) to analyze health data and provide comprehensive medical insights. The system should have a Chief Medical Officer (CMO) agent that coordinates multiple medical specialist agents, each with deep domain expertise.

I have attached comprehensive documentation that includes our architecture approach, domain requirements, available tools, and visual examples of the desired system.

Key requirements:
1. Implement real-time streaming updates showing specialist progress
2. Create a beautiful, medical-themed UI with 3-panel layout
3. Generate dynamic visualizations from health data
4. Support simple to complex health queries with appropriate specialist activation
5. Use the provided data access tools (no direct database integration needed)

The system will showcase best practices for multi-agent AI systems, including:
- Parallel specialist execution for complex queries
- Graceful degradation when specialists fail
- Clear coordination and synthesis of multiple perspectives
- Production-ready error handling and monitoring

The system uses pre-built tools that abstract data storage and querying. All agents will access health data through two main tools:
- `snowflake_import_analyze_health_records_v2` - for importing health data
- `execute_health_query_v2` - for natural language queries

The target users are health-conscious individuals who want to understand their health data through natural language queries, getting insights that would typically require consulting multiple medical specialists.

**Technology Requirements**: Use FastAPI for backend and React with Vite for frontend. The pre-built data access tools will be provided - do not design database schemas or data persistence.

Please create:
1. A comprehensive Product Requirements Document (PRD.md)
2. Detailed user stories with acceptance criteria (user-stories.md)
3. Technical architecture documentation (system-architecture.md)
4. API specifications for frontend-backend communication (api-specification.md)
5. Data model definitions (data-models.md)
6. Tool interface documentation (tool-interface.md)
7. Feature prioritization matrix (feature-priority.md)

Focus on making this system extensible so the pattern can be applied to other multi-agent use cases beyond healthcare.

**Architecture Guidelines**:
- Backend: FastAPI with direct SSE streaming
- Frontend: React with Vite (not Next.js)
- No external services (Redis, databases, message queues)
- Pre-built tools handle all data access
- Simple, direct implementation patterns

## I have attached the following documents:

### 1. **Simplified Architecture Brief** (simplified-architecture-brief.md)
- Defines the exact technology stack: FastAPI + React/Vite
- Explains the simple, direct implementation approach
- Shows what NOT to use (no Redis, no databases, no Next.js)
- Provides clear code patterns to follow

### 2. **Multi-Agent Implementation Architecture** (multi-agent-implementation-architecture.md)
- Shows the exact backend service structure needed
- Explains single SpecialistAgent class with multiple specialties
- Details prompt organization and externalization
- Provides concrete code patterns for initialization

### 3. **Multi-Agent Architecture Brief** (multi-agent-architecture-brief.md)
- Explains the orchestrator-worker pattern conceptually
- Shows expected 90.2% performance improvement over single agents
- Defines the CMO + specialist pattern we want to implement

### 4. **Health Domain Requirements** (health-domain-requirements.md)
- Details all health data types (lab results, medications, vitals)
- Lists the 8 medical specialties needed (Cardiology, Endocrinology, etc.)
- Provides example health queries from simple to complex
- Defines visualization requirements for health data

### 5. **Tool Interface Documentation** (tool-interface.md)
- Documents the two pre-built data access tools
- Shows input/output schemas for each tool
- Provides usage examples for health data queries
- Explains how agents should integrate with these tools

### 6. **User Stories, User Flows, and Mockups** (User Stories User Flows Mocks.pdf)
- Screenshots of the actual working system showing:
  - 3-panel layout with chat interface
  - Medical team visualization with real-time status
  - Dynamic health visualizations
  - User flow from welcome screen through analysis
- These mockups show the exact UI/UX we want to achieve

### 7. **Anthropic's Multi-Agent Blog Post** 
- Link: https://www.anthropic.com/engineering/built-multi-agent-research-system
- Or provide as PDF/text file
- This is the reference architecture pattern we're following
