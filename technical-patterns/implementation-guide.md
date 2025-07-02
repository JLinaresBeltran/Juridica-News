# Multi-Agent System Implementation Guide

## Overview

You are implementing a production-grade Multi-Agent System following Anthropic's orchestrator-worker pattern as described in ["How we built our multi-agent research system"](https://www.anthropic.com/engineering/built-multi-agent-research-system). This guide provides technical best practices and implementation patterns that apply to any multi-agent system.

## Project Structure

Your workspace should follow this structure:

```
workspace/
├── CLAUDE.md                    # This implementation guide
├── backend/
│   ├── tools/                   # Pre-built tool integrations (if provided)
│   │   └── [domain-specific tools provided by PO]
│   └── [you will create all other backend files]
├── frontend/
│   └── [you will create all frontend files]
└── requirements/               # Domain-specific requirements
    ├── technical-patterns/    # Reusable technical patterns
    ├── pm-outputs/            # Product Manager outputs
    │   └── architecture/      # Technical architecture
    ├── ux-outputs/           # UX Designer outputs
    └── po-inputs/            # Product Owner inputs
```

## Implementation Phases

### Phase 1: Understand Domain Requirements

Before writing any code:
1. Review ALL files in `requirements/` directory thoroughly
2. Understand the domain model from `requirements/pm-outputs/architecture/data-models.md`
3. Study the API contracts in `requirements/pm-outputs/architecture/api-specification.md`
4. Review UX prototypes in `requirements/ux-outputs/prototypes/`
5. Identify any pre-built tools in `backend/tools/`

### Phase 2: Backend Foundation

#### Step 1: Core Setup
```
backend/
├── main.py                     # FastAPI application
├── models/                     # Pydantic models
├── services/                   # Business logic
└── api/                       # API endpoints
```

Create foundational files:
- FastAPI application with CORS
- Health check endpoints
- Logging configuration
- Error handling middleware

#### Step 2: Multi-Agent Architecture

Follow this pattern for ANY domain:

```
services/
├── orchestration/
│   └── orchestrator_agent.py   # Main coordinator
├── agents/
│   ├── base_agent.py          # Base class for all agents
│   └── specialists/           # Domain-specific agents
└── streaming/
    └── sse_handler.py         # Real-time updates
```

**Generic Orchestrator Pattern**:
```python
class OrchestratorAgent:
    async def process_request(self, request: Any) -> AsyncGenerator:
        # 1. Analyze request complexity
        complexity = await self.assess_complexity(request)
        
        # 2. Create specialist tasks based on domain logic
        tasks = await self.create_tasks(request, complexity)
        
        # 3. Execute specialists (parallel when possible)
        results = await self.execute_specialists(tasks)
        
        # 4. Synthesize results
        synthesis = await self.synthesize(results)
        
        # 5. Generate visualizations if needed
        visualizations = await self.create_visualizations(synthesis)
```

#### Step 3: Specialist Implementation

Create specialists based on your domain (defined in requirements):
```python
class SpecialistAgent(BaseAgent):
    def __init__(self, specialty: str, tools: List[Any]):
        self.specialty = specialty
        self.tools = tools
    
    async def analyze(self, task: Task) -> SpecialistResult:
        # Domain-specific analysis
        pass
```

### Phase 3: API Implementation

Implement endpoints defined in `requirements/pm-outputs/architecture/api-specification.md`:

1. **Main Processing Endpoint** (usually with SSE)
2. **Resource Management Endpoints** (CRUD operations)
3. **Configuration Endpoints** (if needed)

### Phase 4: Frontend Implementation

#### Core Components Structure
```
frontend/src/
├── components/
│   ├── layout/              # Layout components
│   ├── chat/               # If conversational UI
│   ├── visualization/      # Data visualizations
│   └── domain/            # Domain-specific components
├── services/              # API integration
├── types/                # TypeScript definitions
└── utils/               # Utilities
```

#### Key Patterns

1. **State Management**: Use React Context or component state
2. **Real-time Updates**: SSE integration for streaming
3. **Error Boundaries**: Graceful error handling
4. **Responsive Design**: Mobile-first approach

### Phase 5: Integration

1. Connect frontend to backend APIs
2. Implement proper error handling
3. Add loading states
4. Test edge cases

## Universal Best Practices

### 1. Multi-Agent Patterns

**Orchestration**:
- Orchestrator should understand domain complexity
- Create focused tasks for specialists
- Handle parallel vs sequential execution
- Gracefully handle specialist failures

**Communication**:
- Use structured formats for inter-agent communication
- Maintain clear task boundaries
- Include confidence scores when relevant

**Tool Usage**:
- If tools are provided, understand their interfaces first
- Use Anthropic's native tool calling
- Handle tool failures gracefully
- Respect rate limits

### 2. Streaming & Real-time Updates

**SSE Pattern**:
```python
async def stream_updates():
    yield {"type": "status", "message": "Processing..."}
    yield {"type": "specialist_update", "specialist": "name", "progress": 50}
    yield {"type": "result", "data": {...}}
```

**Frontend Handling**:
```typescript
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);
};
```

### 3. Error Handling

- Implement retry logic with exponential backoff
- Provide meaningful error messages
- Log errors appropriately
- Degrade gracefully

### 4. Performance Considerations

- Use parallel processing where possible
- Implement appropriate caching
- Monitor token usage
- Optimize for user-perceived performance

## Implementation Checklist

Before starting, ensure you have:
- [ ] Read all files in requirements/
- [ ] Understood the domain model
- [ ] Reviewed API specifications
- [ ] Examined UX prototypes
- [ ] Identified pre-built tools

During implementation:
- [ ] Follow the phased approach
- [ ] Manually verify each component works
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Ensure type safety

Before completion:
- [ ] All APIs match specifications
- [ ] UI matches UX designs exactly
- [ ] Real-time updates work smoothly
- [ ] Error scenarios handled gracefully
- [ ] Performance meets requirements

## Authentication & Security (Optional)

**For Demos**: Skip authentication unless explicitly required in the PRD.
**For Production**: Implement JWT-based authentication with:
- User registration/login
- Protected API endpoints
- Session management
- Audit logging

## Working with Pre-built Tools

When `backend/tools/` contains pre-built tools:
1. **Import them** in your services, don't recreate functionality
2. **Use their interfaces** as documented in tool-interface.md
3. **Example**:
   ```python
   from tools.health_query_tool import execute_health_query_v2
   from tools.snowflake_tool import snowflake_import_analyze_health_records_v2
   
   # In your specialist agent:
   result = await execute_health_query_v2(query_params)
   ```

## Common Pitfalls to Avoid

1. **Don't hardcode domain logic** - Use configuration and prompts
2. **Don't skip streaming updates** - Users need feedback
3. **Don't ignore error cases** - Every external call can fail
4. **Don't recreate provided tools** - Use what's given
5. **Don't deviate from specifications** - Follow requirements exactly
6. **Don't add auth for demos** - Unless specifically requested

## Demo Setup & Running Instructions

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration** (if needed):
   ```bash
   cp .env.example .env
   # Edit .env with any required API keys
   ```

3. **Start Backend Server**:
   ```bash
   python main.py
   # Or if using uvicorn directly:
   uvicorn main:app --reload --port 8000
   ```
   
   Backend will be available at: `http://localhost:8000`
   
   API documentation available at: `http://localhost:8000/docs`

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   # or: yarn install
   ```

2. **Start Frontend Development Server**:
   ```bash
   npm run dev
   # or: yarn dev
   ```
   
   Frontend will be available at: `http://localhost:5173` (Vite default)
   
   Or if using Create React App: `http://localhost:3000`

### Verifying the Demo

1. **Check Backend Health**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Open Frontend**:
   - Navigate to `http://localhost:5173` in your browser
   - You should see the welcome screen as designed in UX prototypes

3. **Test Core Functionality**:
   - Try the example queries provided on the welcome screen
   - Verify real-time updates are streaming
   - Check that visualizations render correctly

### Common Demo Issues

- **CORS Errors**: Ensure backend has proper CORS configuration for frontend URL
- **Port Conflicts**: Change ports in startup commands if defaults are in use
- **Missing Environment Variables**: Check console for any missing API keys
- **Connection Refused**: Verify both backend and frontend are running

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend connects to backend successfully
- [ ] Main user flow works end-to-end
- [ ] Real-time updates display properly
- [ ] Error states show user-friendly messages
- [ ] UI matches the UX prototypes

## Success Criteria

Your implementation succeeds when:
- ✅ All requirements from PM are met
- ✅ UI matches UX specifications exactly
- ✅ Multi-agent orchestration works smoothly
- ✅ Real-time updates provide good UX
- ✅ System handles errors gracefully
- ✅ Performance meets defined SLAs

## Getting Started

1. Start by reading `requirements/pm-outputs/PRD.md`
2. Review `requirements/pm-outputs/architecture/system-architecture.md`
3. Examine `requirements/ux-outputs/prototypes/`
4. Check for any provided tools in `backend/tools/`
5. Begin with Phase 1 and progress systematically

Remember: The domain-specific details are in the requirements directory. This guide provides the technical patterns that work across all domains.