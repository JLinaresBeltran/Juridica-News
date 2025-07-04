# System Architecture - Health Insight Assistant

## Architecture Overview

The Health Insight Assistant implements a multi-agent architecture pattern with a Chief Medical Officer (CMO) orchestrating specialized medical agents. The system uses Server-Sent Events (SSE) for real-time streaming, pre-built Snowflake tools for data access, and React for dynamic visualizations.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   React Frontend    │────▶│   FastAPI Backend   │────▶│  Anthropic Claude   │
│   (Vite + TS)       │◀────│   (Python 3.11+)    │◀────│      API           │
└─────────────────────┘ SSE └─────────────────────┘     └─────────────────────┘
         │                            │                            
         │                            │                            
         ▼                            ▼                            
┌─────────────────────┐     ┌─────────────────────┐              
│   LocalStorage      │     │  Pre-built Tools    │              
│  (Conversations)    │     │ (Snowflake Access)  │              
└─────────────────────┘     └─────────────────────┘              
```

## Multi-Agent Architecture

### Agent Hierarchy

```
                           ┌─────────────────┐
                           │  User Query     │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   CMO Agent     │ (Orchestrator)
                           │  (Dr. Vitality)  │
                           └────────┬────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 │          Specialist Tasks           │
                 └─────────────────┬───────────────────┘
                                   │
        ┌──────────┬───────────┬───┴───┬──────────┬──────────┬───────────┬──────────┐
        ▼          ▼           ▼       ▼          ▼          ▼           ▼          ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│Cardiology│ │Endocrine │ │Lab Med │ │Data    │ │Prevent │ │Pharmacy │ │Nutrition│ │General │
│Dr. Heart │ │Dr.Hormone│ │Dr. Lab │ │Analysis│ │Medicine│ │Dr.Pharma│ │Dr. Diet │ │Practice│
└──────────┘ └──────────┘ └────────┘ └────────┘ └────────┘ └─────────┘ └────────┘ └────────┘
        │          │           │       │          │          │           │          │
        └──────────┴───────────┴───────┴──────────┴──────────┴───────────┴──────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  Synthesis by CMO  │
                                    └─────────┬─────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │ Visualization Agent│
                                    └───────────────────┘
```

### Agent Responsibilities

#### CMO (Chief Medical Officer)
- Analyzes query complexity (Simple/Standard/Complex/Critical)
- Performs initial data gathering via tools
- Creates specialist task assignments
- Coordinates parallel specialist execution
- Synthesizes findings from all specialists
- Provides comprehensive health assessment

#### Specialist Agents
Each specialist has domain expertise:
- **Cardiology**: Cardiovascular metrics, risk assessment
- **Endocrinology**: Hormonal balance, diabetes management
- **Laboratory Medicine**: Lab result interpretation
- **Data Analytics**: Statistical analysis, trend identification
- **Preventive Medicine**: Risk scoring, screening recommendations
- **Pharmacy**: Medication analysis, interactions
- **Nutrition**: Dietary impact on health metrics
- **General Practice**: Holistic health coordination

#### Visualization Agent
- Generates self-contained React components
- Creates health-specific chart types
- Embeds data within visualizations
- Supports interactivity and responsiveness

## Backend Architecture

### Service Structure

```
backend/
├── main.py                          # FastAPI application entry
├── services/
│   ├── health_analyst_service.py    # Main orchestration service
│   ├── agents/
│   │   ├── cmo/
│   │   │   ├── cmo_agent.py       # CMO orchestrator
│   │   │   └── prompts/           # CMO prompt templates
│   │   ├── specialist/
│   │   │   ├── specialist_agent.py # Single specialist class
│   │   │   └── prompts/           # Specialist prompts by type
│   │   └── visualization/
│   │       ├── visualization_agent_v2.py
│   │       └── prompts/           # Visualization examples
│   └── streaming/
│       └── sse_handler.py         # SSE utilities
├── api/
│   ├── chat.py                    # Chat endpoints
│   └── health.py                  # Health-specific endpoints
├── tools/                         # Pre-built tools (provided)
│   └── tool_registry.py          
└── types/
    └── health_types.py           # Type definitions
```

### Key Components

#### HealthAnalystService
```python
class HealthAnalystService:
    def __init__(self):
        self.cmo_agent = CMOAgent(...)
        self.specialist_agent = SpecialistAgent(...)
        self.visualization_agent = VisualizationAgent(...)
        
    async def process_query(self, query: str, thread_id: str):
        # 1. CMO analyzes query
        # 2. Creates specialist tasks
        # 3. Executes specialists in parallel
        # 4. CMO synthesizes results
        # 5. Generates visualization
```

#### Streaming Architecture
- SSE endpoint: `GET /api/chat/stream`
- Event types:
  - `connected`: Initial connection
  - `message`: Text updates
  - `agent_activated`: Specialist starts
  - `agent_progress`: Progress updates
  - `agent_complete`: Specialist finishes
  - `visualization_ready`: Chart component ready
  - `error`: Error occurred
  - `done`: Analysis complete

## Frontend Architecture

### Component Structure

```
frontend/src/
├── App.tsx                        # Main application
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx        # 3-panel layout
│   │   ├── Header.tsx           
│   │   └── ResizablePanel.tsx   
│   ├── conversation/
│   │   ├── ChatInterface.tsx     # Main chat area
│   │   ├── MessageList.tsx      
│   │   ├── ThreadSidebar.tsx    # Conversation threads
│   │   └── QueryInput.tsx       
│   ├── agents/
│   │   ├── MedicalTeam.tsx      # Team visualization
│   │   ├── SpecialistCard.tsx   
│   │   └── TeamHierarchy.tsx    
│   ├── results/
│   │   ├── AnalysisResults.tsx  # Result display
│   │   ├── QuerySelector.tsx    
│   │   └── VisualizationTab.tsx 
│   └── common/
│       ├── ErrorBoundary.tsx    
│       ├── LoadingStates.tsx    
│       └── ToastNotifications.tsx
├── hooks/
│   ├── useHealthQuery.ts         # Query management
│   ├── useSSE.ts                # SSE connection
│   └── useLocalStorage.ts       # Persistence
├── services/
│   ├── api.ts                   # API client
│   └── conversationManager.ts   # Thread management
└── types/
    └── health.types.ts          # TypeScript types
```

### State Management

```typescript
// Thread Management
interface Thread {
  id: string;           // UUID v4
  title: string;        // Auto-generated
  createdAt: number;    // Timestamp
  messages: Message[];
  results: QueryResult[];
}

// Query Results  
interface QueryResult {
  queryId: string;
  query: string;
  specialists: SpecialistResult[];
  synthesis: string;
  visualizations: Visualization[];
  timestamp: number;
}

// LocalStorage Schema
interface StorageSchema {
  version: number;
  threads: Thread[];
  activeThreadId: string | null;
}
```

## Data Flow

### Query Processing Flow

```
1. User Input
   └─> ChatInterface captures query
   
2. API Request
   └─> POST /api/chat/message with threadId
   
3. SSE Connection
   └─> GET /api/chat/stream?message={query}&thread_id={id}
   
4. CMO Processing
   ├─> Tool: execute_health_query_v2 (initial analysis)
   └─> Complexity assessment
   
5. Specialist Dispatch
   ├─> Parallel task creation
   └─> Each specialist queries health data
   
6. Progressive Updates
   ├─> SSE: agent_activated events
   ├─> SSE: agent_progress events
   └─> SSE: agent_complete events
   
7. Synthesis
   └─> CMO aggregates findings
   
8. Visualization
   ├─> Generate React component code
   └─> SSE: visualization_ready event
   
9. Persistence
   └─> Save to localStorage
```

## Tool Integration

### Pre-built Health Tools

```python
# Tool Registry Usage
tool_registry = ToolRegistry()

# Available Tools
tools = [
    {
        "name": "execute_health_query_v2",
        "description": "Natural language health data queries",
        "parameters": {
            "query": "string"
        }
    },
    {
        "name": "snowflake_import_analyze_health_records_v2",
        "description": "Import health data from JSON files",
        "parameters": {
            "file_directory": "string"
        }
    }
]

# Agent Integration
response = await anthropic_client.messages.create(
    model="claude-3-sonnet-20240229",
    messages=messages,
    tools=tool_registry.get_tool_definitions(),
    max_tokens=4000
)
```

## Performance Optimizations

### Caching Strategy
- Query results cached in memory during session
- Visualization components cached by queryId
- Tool responses cached for identical queries

### Parallel Processing
- Specialists execute concurrently
- Maximum 5 specialists active simultaneously
- Tool calls within specialists also parallelized

### Resource Management
- SSE connections timeout after 5 minutes
- Maximum 3 concurrent conversations per user
- LocalStorage limited to 10MB (approx 100 conversations)

## Error Handling

### Retry Logic
```python
async def retry_with_backoff(
    func,
    max_attempts=3,
    initial_delay=1,
    backoff_factor=2
):
    for attempt in range(max_attempts):
        try:
            return await func()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            await asyncio.sleep(initial_delay * (backoff_factor ** attempt))
```

### Error Recovery Patterns
- Network failures: Automatic SSE reconnection
- Tool failures: Fallback to partial results
- Agent failures: Skip specialist, note in synthesis
- Visualization failures: Show raw data table

## Security Architecture

### API Security
- CORS configured for frontend origin only
- Rate limiting: 100 requests/minute per IP
- Request size limit: 10KB
- No authentication (per requirements)

### Data Security
- All health data accessed via secure tools
- No server-side storage of health information
- Client-side encryption for localStorage
- Audit logging for all tool calls

## Deployment Architecture

### Development
```bash
# Backend
cd backend
python -m venv venv
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

### Production
- Backend: FastAPI with Uvicorn workers
- Frontend: Static build served via CDN
- No external dependencies (Redis, databases)
- Horizontal scaling via load balancer

## Monitoring & Observability

### Metrics
- Query response times by complexity
- Specialist execution times
- Tool call success rates
- SSE connection stability
- Error rates by type

### Logging
- Structured JSON logging
- Log levels: INFO for normal operations, ERROR for failures
- No PHI in logs
- Request correlation IDs

This architecture provides a scalable, maintainable foundation for the Health Insight Assistant while maintaining simplicity and focusing on core functionality.