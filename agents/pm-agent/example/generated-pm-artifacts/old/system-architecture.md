# Technical Architecture Document: Multi-Agent Health Insight System

## System Overview

The Multi-Agent Health Insight System implements Anthropic's orchestrator-worker pattern for medical data analysis. The architecture prioritizes simplicity, real-time streaming, and extensibility while avoiding unnecessary complexity.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Chat Panel │  │ Medical Team │  │  Visualizations    │     │
│  │             │  │   Status     │  │  (Dynamic React)   │     │
│  └─────────────┘  └──────────────┘  └────────────────────┘     │
│                                                                  │
│                    EventSource (SSE Client)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/SSE
┌────────────────────────────┴────────────────────────────────────┐
│                    Backend (FastAPI)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 API Routes (SSE Endpoints)               │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┴─────────────────────────────────┐   │
│  │              Health Analyst Service                       │   │
│  │                  (Orchestrator)                          │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┴─────────────────────────────────┐   │
│  │                    Agent Layer                            │   │
│  │  ┌─────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │   CMO   │  │  Specialist  │  │  Visualization  │   │   │
│  │  │  Agent  │  │    Agent     │  │     Agent       │   │   │
│  │  └─────────┘  └──────────────┘  └──────────────────┘   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┴─────────────────────────────────┐   │
│  │                Pre-built Tools (Imported)                 │   │
│  │  • execute_health_query_v2                               │   │
│  │  • snowflake_import_analyze_health_records_v2           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
frontend/src/
├── App.tsx                          # Main application component
├── components/
│   ├── ChatPanel/
│   │   ├── ChatPanel.tsx           # Main chat interface
│   │   ├── MessageList.tsx         # Message display
│   │   ├── QueryInput.tsx          # User input handling
│   │   └── QuickQueries.tsx        # Example query selector
│   ├── MedicalTeam/
│   │   ├── TeamHierarchy.tsx       # Visual team display
│   │   ├── SpecialistCard.tsx      # Individual specialist status
│   │   ├── AnalysisResults.tsx     # Completed analysis display
│   │   └── QuerySelector.tsx       # Navigate between queries
│   ├── Visualization/
│   │   ├── VisualizationPanel.tsx  # Container for charts
│   │   ├── CodeArtifact.tsx        # Streaming code display
│   │   └── DynamicChart.tsx        # Rendered visualizations
│   └── common/
│       ├── Layout.tsx              # 3-panel layout
│       └── StreamingIndicator.tsx  # Connection status
├── services/
│   ├── api.ts                      # API client with SSE support
│   └── messageParser.ts            # SSE message handling
└── types/
    ├── messages.ts                 # Message type definitions
    └── medical.ts                  # Medical domain types
```

### Backend Service Architecture

```
backend/
├── main.py                         # FastAPI application entry
├── api/
│   ├── chat.py                    # SSE chat endpoints
│   └── health.py                  # Health check endpoints
├── services/
│   ├── health_analyst_service.py  # Main orchestration service
│   ├── agents/
│   │   ├── cmo/
│   │   │   ├── cmo_agent.py      # Chief Medical Officer
│   │   │   └── prompts/          # CMO prompt templates
│   │   │       ├── 1_initial_analysis.txt
│   │   │       ├── 2_initial_analysis_summarize.txt
│   │   │       ├── 3_task_creation.txt
│   │   │       └── 4_synthesis.txt
│   │   ├── specialist/
│   │   │   ├── specialist_agent.py  # Single specialist class
│   │   │   └── prompts/            # All specialist prompts
│   │   │       ├── system_cardiology.txt
│   │   │       ├── system_endocrinology.txt
│   │   │       ├── system_general_practice.txt
│   │   │       ├── system_laboratory_medicine.txt
│   │   │       ├── system_nutrition.txt
│   │   │       ├── system_pharmacy.txt
│   │   │       ├── system_preventive_medicine.txt
│   │   │       ├── system_data_analysis.txt
│   │   │       ├── 1_task_execution.txt
│   │   │       └── 2_final_analysis.txt
│   │   └── visualization/
│   │       ├── visualization_agent_v2.py
│   │       └── prompts/
│   │           └── examples/       # Chart generation examples
│   └── streaming/
│       └── sse_handler.py         # SSE utilities
├── models/
│   ├── agents.py                  # Agent data models
│   └── health.py                  # Health domain models
└── tools/                         # Pre-built (DO NOT MODIFY)
    ├── tool_registry.py
    ├── health_query_tool.py
    └── import_tool.py
```

## Key Design Patterns

### 1. Orchestrator-Worker Pattern

The CMO (Chief Medical Officer) agent acts as the orchestrator:

```python
class CMOAgent:
    async def analyze_query_with_tools(self, query: str):
        # 1. Assess query complexity
        # 2. Perform initial data gathering
        # 3. Determine specialist needs
        return ComplexityAssessment(
            level="STANDARD",  # or SIMPLE, COMPLEX, CRITICAL
            approach=["cardiology", "data_analysis"],
            initial_findings={...}
        )
    
    async def create_specialist_tasks(self, query, complexity):
        # Create specific tasks for each specialist
        return [
            SpecialistTask(
                specialist="cardiology",
                task="Analyze 15-year cholesterol trends"
            ),
            SpecialistTask(
                specialist="data_analysis",
                task="Create statistical analysis and visualizations"
            )
        ]
    
    async def synthesize_findings(self, specialist_results):
        # Combine all specialist insights
        return ComprehensiveSynthesis(...)
```

### 2. Single Specialist Implementation

All medical specialties use one class with different prompts:

```python
class SpecialistAgent:
    def __init__(self, anthropic_client, tool_registry, model):
        self.client = anthropic_client
        self.tool_registry = tool_registry
        self.prompts = SpecialistPrompts()
    
    async def execute_task_with_tools(self, task: SpecialistTask):
        # Get specialty-specific system prompt
        system_prompt = self._get_specialist_system_prompt(
            task.specialist
        )
        
        # Execute with Anthropic API and tools
        response = await self.client.messages.create(
            model=self.model,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": task.prompt
            }],
            tools=self.tool_registry.get_tool_definitions(),
            max_tokens=4000
        )
        
        return SpecialistResult(...)
```

### 3. Streaming Architecture

Real-time updates via Server-Sent Events:

```python
@router.post("/api/chat/message")
async def chat_message(request: ChatRequest):
    async def generate():
        # Initial acknowledgment
        yield f"data: {json.dumps({'type': 'start'})}\n\n"
        
        # Stream specialist updates
        async for update in health_analyst_service.process_query(
            request.message
        ):
            yield f"data: {json.dumps(update)}\n\n"
        
        # Completion signal
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### 4. Message Types for Streaming

```typescript
type StreamMessage = 
  | { type: 'thinking'; agent: string; content: string }
  | { type: 'tool_call'; agent: string; tool: string; input: any }
  | { type: 'specialist_start'; specialist: string; task: string }
  | { type: 'specialist_progress'; specialist: string; progress: number }
  | { type: 'specialist_complete'; specialist: string; confidence: number }
  | { type: 'text'; content: string }
  | { type: 'visualization'; code: string }
  | { type: 'error'; message: string }
  | { type: 'complete' };
```

## Process Flow

### 1. Simple Query Flow
```
User Query → CMO Assessment → Single Specialist → Direct Response
    "What's my cholesterol?"     (SIMPLE)         (Lab Medicine)
```

### 2. Standard Query Flow
```
User Query → CMO Assessment → 2-3 Specialists → Synthesis → Visualization
    "Cholesterol trend?"        (STANDARD)      (Cardio + Data)
```

### 3. Complex Query Flow
```
User Query → CMO Assessment → 4-6 Specialists → Deep Synthesis → Rich Viz
    "Medication impact?"        (COMPLEX)       (Multiple domains)
```

## Data Flow

### Tool Integration Pattern
```python
# Tools are pre-built and imported
from tools.tool_registry import ToolRegistry
from tools.health_query_tool import execute_health_query_v2

# Agents use tools through registry
tools = ToolRegistry()
result = await tools.execute_tool(
    "execute_health_query_v2",
    {"query": "Show cholesterol levels over time"}
)
```

### No Database Access
- All data operations go through tools
- Tools handle Snowflake integration internally
- Agents work with tool responses only
- No direct SQL or database connections

## Configuration

### Environment Variables
```bash
# API Keys
ANTHROPIC_API_KEY=your-key

# Model Configuration
CMO_MODEL=claude-3-sonnet-20240229
SPECIALIST_MODEL=claude-3-sonnet-20240229
VISUALIZATION_MODEL=claude-3-sonnet-20240229

# Performance Settings
MAX_TOOL_CALLS_PER_SPECIALIST=5
SPECIALIST_TIMEOUT_SECONDS=30
MAX_CONCURRENT_SPECIALISTS=4

# Feature Flags
ENABLE_DEMO_MODE=true
SHOW_TOKEN_USAGE=true
```

### Prompt Management
- All agent logic externalized to .txt files
- Hot-reloadable in development
- Version controlled separately
- Domain-agnostic patterns

## Security Architecture

### API Security
- CORS configuration for frontend origin
- Rate limiting per IP
- Request size limits
- No authentication required (demo)

### Data Security
- No PII stored in application
- Tools handle data security
- Logs sanitized of health data
- Encrypted transport (HTTPS)

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Load balancer compatible
- Session affinity not required
- Tool calls are idempotent

### Performance Optimization
- Parallel specialist execution
- Streaming responses (no buffering)
- Efficient prompt templates
- Token usage monitoring

## Monitoring & Observability

### Metrics to Track
- Query complexity distribution
- Specialist execution times
- Token usage per query type
- Tool call success rates
- SSE connection stability

### Logging Strategy
- Structured JSON logs
- Correlation IDs for request tracking
- Error aggregation
- Performance profiling

## Extension Points

### Adding New Specialists
1. Create new system prompt in `prompts/`
2. Add to `MedicalSpecialty` enum
3. Update CMO task creation logic
4. No code changes to SpecialistAgent

### Supporting New Domains
1. Replace medical prompts with domain prompts
2. Update visualization examples
3. Modify tool interfaces if needed
4. Frontend theming changes

### Integration Opportunities
- Webhook notifications
- Export APIs
- Third-party health apps
- Provider portals

## Development Workflow

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

### Testing Strategy
- Unit tests for individual agents
- Integration tests for orchestration
- E2E tests for critical user flows
- Performance benchmarks

## Deployment Architecture

### Simple Cloud Deployment
```
┌─────────────────┐
│   CloudFlare    │
│      CDN        │
└────────┬────────┘
         │
┌────────┴────────┐
│   Application   │
│  Load Balancer  │
└────────┬────────┘
         │
┌────────┴────────┐
│  FastAPI Apps   │
│   (n instances) │
└─────────────────┘
```

### No Additional Infrastructure
- No Redis needed
- No message queues
- No databases
- Simple and maintainable