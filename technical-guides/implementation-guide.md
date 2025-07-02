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
    ├── product/               # Product specifications
    ├── architecture/          # Technical architecture
    ├── ux/                   # Design specifications
    └── reference/            # Reference materials
```

## Implementation Phases

### Phase 1: Understand Domain Requirements

Before writing any code:
1. Review ALL files in `requirements/` directory thoroughly
2. Understand the domain model from `requirements/architecture/data-models.md`
3. Study the API contracts in `requirements/architecture/api-specification.md`
4. Review UX prototypes in `requirements/ux/prototypes/`
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

Implement endpoints defined in `requirements/architecture/api-specification.md`:

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
- [ ] Test each component thoroughly
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Ensure type safety

Before completion:
- [ ] All APIs match specifications
- [ ] UI matches UX designs exactly
- [ ] Real-time updates work smoothly
- [ ] Error scenarios handled gracefully
- [ ] Performance meets requirements

## Common Pitfalls to Avoid

1. **Don't hardcode domain logic** - Use configuration and prompts
2. **Don't skip streaming updates** - Users need feedback
3. **Don't ignore error cases** - Every external call can fail
4. **Don't recreate provided tools** - Use what's given
5. **Don't deviate from specifications** - Follow requirements exactly

## Success Criteria

Your implementation succeeds when:
- ✅ All requirements from PM are met
- ✅ UI matches UX specifications exactly
- ✅ Multi-agent orchestration works smoothly
- ✅ Real-time updates provide good UX
- ✅ System handles errors gracefully
- ✅ Performance meets defined SLAs

## Getting Started

1. Start by reading `requirements/product/PRD.md`
2. Review `requirements/architecture/system-architecture.md`
3. Examine `requirements/ux/prototypes/`
4. Check for any provided tools in `backend/tools/`
5. Begin with Phase 1 and progress systematically

Remember: The domain-specific details are in the requirements directory. This guide provides the technical patterns that work across all domains.