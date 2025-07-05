# System Architecture - Multi-Agent Health Insight System

## Executive Summary

The Multi-Agent Health Insight System implements an orchestrator-worker pattern following Anthropic's proven architecture (90.2% performance improvement). The system uses a Chief Medical Officer (CMO) agent to coordinate 8 specialized medical agents, providing comprehensive health analysis through parallel processing and progressive result disclosure.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Server-Sent Events (SSE)                       │
├─────────────────────────────────────────────────────────────────┤
│                         FastAPI Backend                           │
├─────────────────────────────────────────────────────────────────┤
│                    Multi-Agent Orchestration                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │     CMO     │  │ Specialists  │  │ Visualization Agent │    │
│  │   (Chief    │  │   (8 types)  │  │  (React Generator)  │    │
│  │  Medical    │  │              │  │                     │    │
│  │  Officer)   │  │              │  │                     │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      Tool Registry Layer                          │
│         ┌────────────────────┐  ┌────────────────────┐          │
│         │ Health Query Tool  │  │  Health Import Tool │          │
│         └────────────────────┘  └────────────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                   Snowflake Cortex (Data Layer)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Architecture Patterns

### 1. Orchestrator-Worker Pattern

**Chief Medical Officer (CMO)**:
- Analyzes query complexity (Simple/Standard/Complex/Critical)
- Creates specialist task assignments
- Coordinates parallel execution
- Synthesizes findings from all specialists
- Provides unified health insights

**Medical Specialists** (Single SpecialistAgent class with 8 specialties):
1. **Cardiology**: Heart health, blood pressure, cardiovascular risk
2. **Laboratory Medicine**: Lab result interpretation, reference ranges
3. **Endocrinology**: Hormones, diabetes, metabolic health
4. **Data Analysis**: Statistical trends, correlations, predictions
5. **Preventive Medicine**: Risk assessment, screening recommendations
6. **Pharmacy**: Medications, interactions, adherence
7. **Nutrition**: Diet impact on health metrics
8. **General Practice**: Holistic health coordination

### 2. Streaming Architecture

**Server-Sent Events (SSE)**:
```python
# GET endpoint for streaming (NOT POST)
@router.get("/api/chat/stream")
async def stream_health_analysis(message: str, thread_id: str):
    async def generate():
        # Stream events as analysis progresses
        yield "event: connected\ndata: {\"status\": \"connected\"}\n\n"
        
        async for update in health_analyst_service.process_query(message):
            yield f"data: {json.dumps(update)}\n\n"
            await asyncio.sleep(0.001)  # Flush buffer
            
        yield "event: done\ndata: {\"status\": \"complete\"}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"}
    )
```

**Event Types**:
- `connected`: Initial connection established
- `message`: Text updates from CMO
- `specialist_assigned`: Medical team assembled
- `agent_activated`: Specialist begins analysis
- `agent_progress`: Progress updates (0-100%)
- `agent_complete`: Specialist findings ready
- `result_generated`: Analysis result available
- `visualization_ready`: Chart component ready
- `synthesis_complete`: Final summary ready
- `error`: Recoverable error occurred
- `done`: Analysis complete

### 3. Progressive Disclosure Pattern

```
User Query → CMO Analysis → Specialist Activation → Progressive Results → Synthesis → Visualization
     ↓            ↓               ↓                      ↓                ↓            ↓
  (0-2s)       (2-5s)         (5-10s)               (10-20s)         (20-25s)     (25-30s)
```

## Backend Architecture

### Service Layer Structure

```python
backend/
├── main.py                          # FastAPI application entry
├── services/
│   ├── health_analyst_service.py    # Main orchestration service
│   ├── agents/
│   │   ├── cmo/
│   │   │   ├── cmo_agent.py       # Chief Medical Officer
│   │   │   └── prompts/           # CMO prompt templates
│   │   ├── specialist/
│   │   │   ├── specialist_agent.py # Single specialist implementation
│   │   │   └── prompts/           # All 8 specialist prompts
│   │   └── visualization/
│   │       ├── visualization_agent_v2.py
│   │       └── prompts/           # Visualization examples
│   └── streaming/
│       └── sse_handler.py          # SSE utilities
├── api/
│   ├── chat.py                     # Chat/streaming endpoints
│   ├── threads.py                  # Thread management
│   └── export.py                   # Export endpoints
├── models/                         # Pydantic models
├── tools/                          # Pre-built tools (DO NOT MODIFY)
└── utils/                          # Helpers
```

### Agent Implementation Pattern

**CMO Agent**:
```python
class CMOAgent:
    def __init__(self, anthropic_client, tool_registry, model="claude-3-sonnet-20240229"):
        self.client = anthropic_client
        self.tools = tool_registry
        self.prompts = CMOPrompts()  # Loads from prompts/*.txt
        
    async def analyze_query_with_tools(self, query: str) -> Tuple[QueryComplexity, str, dict]:
        # 1. Use tools for initial data gathering
        initial_data = await self.tools.execute_tool(
            "execute_health_query_v2",
            {"query": f"Summarize health data for: {query}"}
        )
        
        # 2. Assess complexity with Claude
        response = await self.client.messages.create(
            model=self.model,
            system=self.prompts.get("initial_analysis"),
            messages=[{"role": "user", "content": query}],
            tools=self.tools.get_tool_definitions()
        )
        
        # 3. Return complexity, approach, and initial insights
        return self._parse_complexity(response)
```

**Specialist Agent** (Single class, multiple prompts):
```python
class SpecialistAgent:
    def __init__(self, anthropic_client, tool_registry, model="claude-3-sonnet-20240229"):
        self.client = anthropic_client
        self.tools = tool_registry
        self.prompts = SpecialistPrompts()
        
    async def execute_task_with_tools(self, task: SpecialistTask) -> SpecialistResult:
        # Get specialty-specific system prompt
        system_prompt = self.prompts.get_system_prompt(task.specialist)
        
        # Execute with tools
        response = await self.client.messages.create(
            model=self.model,
            system=system_prompt,
            messages=[{"role": "user", "content": task.description}],
            tools=self.tools.get_tool_definitions(),
            max_tokens=4000
        )
        
        return self._extract_findings(response, task.specialist)
```

### Process Flow

```python
async def process_health_query(query: str, thread_id: str):
    # 1. CMO analyzes query complexity
    complexity, approach, initial_data = await cmo.analyze_query_with_tools(query)
    yield {"type": "message", "content": f"Analyzing your health query..."}
    
    # 2. CMO creates specialist tasks
    tasks = await cmo.create_specialist_tasks(query, complexity, initial_data)
    yield {"type": "specialist_assigned", "specialists": [t.specialist for t in tasks]}
    
    # 3. Execute specialists in parallel
    specialist_results = []
    for task in tasks:
        yield {"type": "agent_activated", "agent": task.specialist}
        
        # Progress updates during execution
        async for progress in specialist.execute_task_with_progress(task):
            yield {"type": "agent_progress", "agent": task.specialist, "progress": progress}
            
        result = await specialist.get_result()
        specialist_results.append(result)
        yield {"type": "agent_complete", "agent": task.specialist, "summary": result.summary}
    
    # 4. CMO synthesizes all findings
    synthesis = await cmo.synthesize_findings(query, specialist_results)
    yield {"type": "synthesis_complete", "summary": synthesis}
    
    # 5. Generate visualization
    async for chunk in visualization_agent.stream_visualization(query, specialist_results):
        yield {"type": "visualization_ready", "component": chunk}
```

## Frontend Architecture

### Component Structure

```typescript
src/
├── App.tsx                         # Main application
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx         # 3-panel layout
│   │   ├── Header.tsx             # App header
│   │   └── ResizablePanel.tsx    # Draggable panels
│   ├── conversation/
│   │   ├── ThreadSidebar.tsx     # Thread list
│   │   ├── ChatInterface.tsx     # Main chat
│   │   └── MessageBubble.tsx     # Messages
│   ├── medical-team/
│   │   ├── MedicalTeamView.tsx   # Team visualization
│   │   ├── CMOCard.tsx           # Central orchestrator
│   │   └── SpecialistCard.tsx    # Individual specialists
│   ├── results/
│   │   ├── ResultHistory.tsx     # Query-based history
│   │   └── VisualizationPanel.tsx # Dynamic charts
│   └── common/
│       ├── ErrorBoundary.tsx     # Error handling
│       └── LoadingStates.tsx     # Loading UI
├── services/
│   ├── api.ts                    # API client
│   └── sse.ts                    # SSE handling
├── hooks/
│   ├── useSSE.ts                 # SSE connection
│   ├── useHealthQuery.ts         # Query management
│   └── useThreads.ts             # Thread state
└── types/                        # TypeScript definitions
```

### State Management

**Local State Pattern** (No Redux/Zustand):
```typescript
// Thread management with React hooks
function useThreadManagement() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string>();
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('health-threads');
    if (saved) {
      setThreads(JSON.parse(saved));
    }
  }, []);
  
  // Persist on change
  useEffect(() => {
    localStorage.setItem('health-threads', JSON.stringify(threads));
  }, [threads]);
  
  return { threads, activeThread, setActiveThread, /* ... */ };
}
```

### SSE Integration

```typescript
function useHealthAnalysis(threadId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistStatus[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  
  const submitQuery = useCallback((query: string) => {
    const eventSource = new EventSource(
      `/api/chat/stream?message=${encodeURIComponent(query)}&thread_id=${threadId}`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data]);
          break;
        case 'specialist_assigned':
          setSpecialists(data.specialists);
          break;
        case 'agent_progress':
          updateSpecialistProgress(data.agent, data.progress);
          break;
        case 'visualization_ready':
          addVisualization(data);
          break;
      }
    };
    
    eventSource.onerror = () => {
      // Implement reconnection logic
    };
    
    return () => eventSource.close();
  }, [threadId]);
  
  return { messages, specialists, visualizations, submitQuery };
}
```

## Data Flow Architecture

### Query Processing Pipeline

```
1. User Input (Frontend)
   ↓
2. SSE Connection Established
   ↓
3. CMO Agent Activation
   ├── Query Complexity Assessment
   ├── Initial Data Gathering (via tools)
   └── Specialist Task Creation
   ↓
4. Parallel Specialist Execution
   ├── Cardiology Analysis
   ├── Lab Analysis
   ├── Endocrinology Analysis
   └── ... (other specialists)
   ↓
5. Progressive Result Streaming
   ↓
6. CMO Synthesis
   ↓
7. Visualization Generation
   ↓
8. Complete Response
```

### Data Persistence Strategy

**Client-Side (localStorage)**:
```typescript
interface PersistedHealthData {
  version: number;           // Schema version
  threads: Thread[];         // All conversations
  currentThreadId?: string;  // Active thread
  preferences: UserPrefs;    // User settings
  cache: {
    visualizations: Map<string, VisualizationComponent>;
    queryResults: Map<string, ResultGroup>;
  };
}
```

**Server-Side**:
- No direct database access
- All data via Snowflake tools
- Session-based isolation
- Audit logging only (no PHI)

## Performance Architecture

### Optimization Strategies

1. **Parallel Agent Execution**:
   ```python
   # Execute specialists concurrently
   results = await asyncio.gather(*[
       specialist.execute_task_with_tools(task)
       for task in specialist_tasks
   ])
   ```

2. **Streaming Response**:
   - First byte < 500ms
   - Progressive updates every 1-2 seconds
   - Total time based on complexity

3. **Frontend Optimization**:
   - Code splitting for visualizations
   - Virtual scrolling for long threads
   - Memoized components
   - Debounced search

4. **Caching Strategy**:
   - Tool results cached 5 minutes
   - Visualization components cached
   - Thread list cached with invalidation

### Performance Metrics

| Operation | Target Time | P95 Latency |
|-----------|------------|-------------|
| Initial Response | < 2s | 1.8s |
| Simple Query | < 5s | 4.5s |
| Standard Query | < 15s | 12s |
| Complex Query | < 30s | 25s |
| Visualization | < 2s | 1.5s |

## Security Architecture

### Data Protection

1. **No PHI in Logs**:
   ```python
   # Sanitize before logging
   def sanitize_for_logging(data: dict) -> dict:
       return {k: v for k, v in data.items() 
               if k not in PHI_FIELDS}
   ```

2. **Session Isolation**:
   - Thread access by session only
   - No cross-session data leakage
   - Temporary session storage

3. **API Security**:
   - HTTPS only
   - Rate limiting per session
   - Input validation
   - SQL injection prevention (via tools)

### Compliance Considerations

- HIPAA-aligned practices
- Audit trail for access
- Encryption in transit
- No permanent storage of PHI
- Clear data retention policies

## Error Handling Architecture

### Multi-Level Error Handling

1. **Agent Level**:
   ```python
   try:
       result = await specialist.analyze()
   except SpecialistTimeout:
       # Continue with partial results
       yield {"type": "error", "code": "SPECIALIST_TIMEOUT"}
   ```

2. **Service Level**:
   - Retry with exponential backoff
   - Circuit breaker for tool failures
   - Graceful degradation

3. **Frontend Level**:
   - Error boundaries per component
   - User-friendly error messages
   - Retry mechanisms
   - Fallback UI states

## Scalability Architecture

### Horizontal Scaling

```
                    Load Balancer
                         ↓
        ┌─────────┬─────────┬─────────┐
        │ FastAPI │ FastAPI │ FastAPI │
        │ Worker 1│ Worker 2│ Worker 3│
        └─────────┴─────────┴─────────┘
                         ↓
                  Shared Tool Layer
                         ↓
                Snowflake Cortex
```

### Resource Management

- Agent pooling for reuse
- Connection pooling for tools
- Memory limits per request
- Timeout management

## Deployment Architecture

### Container Structure

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend  
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Environment Configuration

```yaml
# Backend
ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
CMO_MODEL: claude-3-sonnet-20240229
SPECIALIST_MODEL: claude-3-sonnet-20240229
VISUALIZATION_MODEL: claude-3-sonnet-20240229
MAX_SPECIALISTS_PER_QUERY: 8
SSE_TIMEOUT_SECONDS: 120

# Frontend
VITE_API_URL: https://api.healthinsight.ai
VITE_SSE_RECONNECT_DELAY: 5000
VITE_MAX_THREAD_AGE_DAYS: 90
```

## Monitoring & Observability

### Key Metrics

1. **Application Metrics**:
   - Query completion rate
   - Average response time by complexity
   - Agent success/failure rates
   - Token usage per query

2. **Infrastructure Metrics**:
   - API response times
   - SSE connection stability
   - Memory/CPU usage
   - Error rates by type

3. **Business Metrics**:
   - Queries per user
   - Feature adoption
   - User satisfaction scores
   - Health insight accuracy

### Logging Strategy

```python
# Structured logging
logger.info("health_query_processed", {
    "query_id": query_id,
    "complexity": complexity,
    "specialists_used": len(specialists),
    "total_time_ms": duration,
    "token_count": tokens,
    "success": True
})
```

## Future Architecture Considerations

### Phase 2 Enhancements
- WebSocket upgrade for bi-directional communication
- Multi-language support architecture
- Federated learning for personalization
- Edge deployment for offline capability

### Phase 3 Scaling
- Microservices for specialist agents
- Event-driven architecture
- Real-time collaboration features
- API marketplace for third-party tools