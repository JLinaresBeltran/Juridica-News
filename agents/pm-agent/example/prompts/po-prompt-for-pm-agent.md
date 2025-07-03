# Product Owner Initial Prompt for Product Management Agent

## Prompt to Submit:

I need to build a Multi-Agent System that uses Anthropic's orchestrator-worker pattern (as described in their blog post: https://www.anthropic.com/engineering/built-multi-agent-research-system). The system should have an orchestrator agent that coordinates multiple specialist agents, each with deep domain expertise.

I have attached comprehensive documentation that includes our architecture approach, domain requirements, available tools, and visual examples of the desired system.

Key requirements:
1. Implement real-time streaming updates showing agent progress
2. Create a beautiful, professional UI with 3-panel layout
3. Generate dynamic visualizations from data
4. Support simple to complex queries with appropriate agent activation
5. Use the provided data access tools (no direct database integration needed)

The system will showcase best practices for multi-agent AI systems, including:
- Parallel agent execution for complex queries
- Graceful degradation when agents fail
- Clear coordination and synthesis of multiple perspectives
- Production-ready error handling and monitoring

The system uses pre-built tools that abstract data storage and querying. All agents will access data through the provided domain-specific tools documented in the attached files.

The target users and specific domain requirements are detailed in the attached documentation.

Please create:
1. A comprehensive Product Requirements Document (PRD.md)
2. Detailed user stories with acceptance criteria (user-stories.md)
3. Technical architecture documentation (system-architecture.md)
4. API specifications for frontend-backend communication (api-specification.md)
5. Data model definitions (data-models.md)
6. Tool interface documentation (tool-interface.md)
7. Feature prioritization matrix (feature-priority.md)

Focus on making this system extensible so the pattern can be applied to other multi-agent use cases beyond healthcare.

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

### 4. **Domain Requirements** (health-domain-requirements.md)
- Details all domain-specific data types 
- Lists the specialist agents needed for this domain
- Provides example queries from simple to complex
- Defines visualization requirements for the domain

### 5. **Tool Interface Documentation** (tool-interface.md)
- Documents the pre-built data access tools
- Shows input/output schemas for each tool
- Provides usage examples for domain queries
- Explains how agents should integrate with these tools

### 6. **User Stories, User Flows, and Mockups** (User Stories User Flows Mocks.pdf)
- Screenshots of the actual working system showing:
  - 3-panel layout with interaction interface
  - Agent team visualization with real-time status
  - Dynamic data visualizations
  - User flow from welcome screen through analysis
- These mockups show the exact UI/UX we want to achieve

### 7. **Anthropic's Multi-Agent Blog Post** 
- Link: https://www.anthropic.com/engineering/built-multi-agent-research-system
- This is the reference architecture pattern we're following

### 8. **Technology Requirements** (technology-requirements.md)
- Exact technology stack and versions (FastAPI, React, Vite, Tailwind CSS)
- What NOT to use (no Next.js, no Redis, no databases)
- Critical implementation rules
- SSE streaming requirements
- Pre-built tool usage guidelines

### 9. **Health Technical Customization Guide** (health-technical-customization-guide.md)
- Health-specific agent configurations (CMO + 8 specialists)
- Medical data models and schemas
- Health query complexity rules
- Health-specific API endpoints
- Compliance and security considerations
