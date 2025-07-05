# Multi-Agent Implementation Architecture

This document bridges the conceptual multi-agent pattern with concrete implementation details. While we use a health system as our primary example, these patterns apply to any domain.

## Service Architecture Overview

```
backend/services/
├── health_analyst_service.py    # Main orchestration service (health example)
├── agents/
│   ├── cmo/                    # Chief Medical Officer (Orchestrator example)
│   │   ├── cmo_agent.py
│   │   └── prompts/           # Externalized prompts
│   ├── specialist/            # Single specialist implementation
│   │   ├── specialist_agent.py
│   │   └── prompts/           # All specialist system prompts
│   └── visualization/         # Visualization generator
│       ├── visualization_agent_v2.py
│       └── prompts/           # Visualization examples
└── streaming/                 # SSE utilities
    └── sse_handler.py
```

**Domain Adaptation**: Replace "health_analyst_service" and "cmo" with your domain-specific names (e.g., "financial_analyst_service" and "cfo" for finance).

## Key Implementation Patterns

### 1. Service Initialization Pattern

The main orchestration service initializes all agents (health example):

```python
class HealthAnalystService:
    def __init__(self):
        # Initialize Anthropic client
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        # Initialize tool registry (pre-built tools)
        self.tool_registry = ToolRegistry()
        
        # Initialize agents with tool registry
        self.cmo_agent = CMOAgent(
            self.client, 
            self.tool_registry,
            model="claude-3-sonnet-20240229"
        )
        
        self.specialist_agent = SpecialistAgent(
            self.client,
            self.tool_registry,
            model="claude-3-sonnet-20240229"
        )
        
        self.visualization_agent = MedicalVisualizationAgentV2(
            self.client,
            model="claude-3-sonnet-20240229"
        )
```

### 2. Orchestrator Agent Pattern

The CMO (Chief Medical Officer) acts as the orchestrator in our health example:

```python
class CMOAgent:
    def __init__(self, anthropic_client, tool_registry, model):
        self.client = anthropic_client
        self.tool_registry = tool_registry
        self.prompts = CMOPrompts()  # Loads from prompts/
        
    async def analyze_query_with_tools(self, query):
        # 1. Assess query complexity
        # 2. Use tools for initial data gathering
        # 3. Return complexity and initial insights
        
    async def create_specialist_tasks(self, query, complexity):
        # Create tasks for relevant specialists based on query
        # Returns list of SpecialistTask objects
```

**Pattern Explanation**: The orchestrator (CMO in health, CFO in finance, etc.) coordinates specialist agents based on domain-specific logic.

### 3. Specialist Agent Pattern

**IMPORTANT**: There's only ONE SpecialistAgent class that handles ALL specialties:

```python
class SpecialistAgent:
    def __init__(self, anthropic_client, tool_registry, model):
        self.client = anthropic_client
        self.tool_registry = tool_registry
        self.prompts = SpecialistPrompts()
        
    async def execute_task_with_tools(self, task: SpecialistTask):
        # Get specialty-specific system prompt
        system_prompt = self._get_specialist_system_prompt(task.specialist)
        
        # Execute with tools
        # Return SpecialistResult
```

The specialties are defined as an enum (health example):
```python
class MedicalSpecialty(Enum):
    GENERAL_PRACTICE = "general_practice"
    ENDOCRINOLOGY = "endocrinology" 
    CARDIOLOGY = "cardiology"
    NUTRITION = "nutrition"
    PREVENTIVE_MEDICINE = "preventive_medicine"
    LABORATORY_MEDICINE = "laboratory_medicine"
    PHARMACY = "pharmacy"
    DATA_ANALYSIS = "data_analysis"
```

**Other Domain Examples**:
- Finance: `RISK_ANALYSIS`, `PORTFOLIO_MANAGEMENT`, `TAX_PLANNING`
- Legal: `CONTRACT_REVIEW`, `COMPLIANCE`, `LITIGATION_SUPPORT`
- Engineering: `SYSTEMS_DESIGN`, `SECURITY_REVIEW`, `PERFORMANCE_OPTIMIZATION`

### 4. Prompt Organization

Health system example:
```
prompts/
├── cmo/prompts/
│   ├── 1_initial_analysis.txt
│   ├── 2_initial_analysis_summarize.txt
│   ├── 3_task_creation.txt
│   └── 4_synthesis.txt
└── specialist/prompts/
    ├── system_cardiology.txt      # System prompt for cardiology
    ├── system_endocrinology.txt   # System prompt for endocrinology
    ├── system_general_practice.txt
    ├── system_laboratory_medicine.txt
    ├── system_nutrition.txt
    ├── system_pharmacy.txt
    ├── system_preventive_medicine.txt
    ├── system_data_analysis.txt
    ├── 1_task_execution.txt       # Common task template
    └── 2_final_analysis.txt       # Common analysis template
```

### 5. Process Flow

```python
async def process_query(self, query):
    # 1. CMO analyzes query
    complexity, approach, initial_data = await self.cmo_agent.analyze_query_with_tools(query)
    
    # 2. CMO creates specialist tasks
    tasks = await self.cmo_agent.create_specialist_tasks(query, complexity, approach)
    
    # 3. Execute specialists
    specialist_results = []
    for task in tasks:
        result = await self.specialist_agent.execute_task_with_tools(task)
        specialist_results.append(result)
        
    # 4. CMO synthesizes results
    synthesis = await self.cmo_agent.synthesize_findings(specialist_results)
    
    # 5. Generate visualization
    async for chunk in self.visualization_agent.stream_visualization(
        query, specialist_results, synthesis
    ):
        yield chunk
```

### 6. Tool Integration

All agents receive the ToolRegistry but use different tools:
- **CMO**: Uses `execute_health_query_v2` for initial assessment
- **Specialists**: Use `execute_health_query_v2` for detailed analysis
- **Visualization**: No tools, generates React components from synthesis

**Domain Adaptation**: Your domain will have different tools (e.g., `execute_financial_query` for finance).

### 7. Streaming Architecture

```python
# SSE endpoint in api/chat.py
@router.post("/api/chat/message")
async def chat_message(request: ChatRequest):
    async def generate():
        async for update in health_analyst_service.process_query(request.message):
            yield f"data: {json.dumps(update)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## Key Design Decisions

1. **Single Specialist Class**: Instead of creating separate classes for each specialty, use one SpecialistAgent with different prompts
2. **Externalized Prompts**: All agent logic is in prompt files, not code
3. **Tool Registry Pattern**: Centralized tool management, agents don't know implementation
4. **Streaming First**: Everything streams through SSE for real-time updates
5. **No Databases**: Tools handle all data persistence

## Configuration

Environment variables control behavior:
```bash
ANTHROPIC_API_KEY=your-key
CMO_MODEL=claude-3-sonnet-20240229              # Or ORCHESTRATOR_MODEL for generic
SPECIALIST_MODEL=claude-3-sonnet-20240229
VISUALIZATION_MODEL=claude-3-sonnet-20240229
MAX_TOOL_CALLS_PER_SPECIALIST=5
```

## Adapting to Your Domain

### 1. Define Your Orchestrator
- **Health Example**: CMO (Chief Medical Officer)
- **Your Domain**: Choose an appropriate orchestrator name
- Define complexity assessment rules for your domain
- Create task delegation logic

### 2. Define Your Specialists
- **Health Example**: 8 medical specialties (cardiology, endocrinology, etc.)
- **Your Domain**: Define specialties relevant to your field
- Write system prompts for each specialty
- Define what data/tools each specialist needs

### 3. Adapt Visualization
- **Health Example**: Medical charts (vital signs, lab trends, risk scores)
- **Your Domain**: Define chart types relevant to your data
- Create component templates for your data types
- Ensure proper data embedding in generated components

### 4. Configure Tools
- **Health Example**: `execute_health_query_v2`, `snowflake_import_analyze_health_records_v2`
- **Your Domain**: Map your pre-built tools to the ToolRegistry
- Define which agents can use which tools
- Handle tool-specific error cases

## Summary

This architecture achieves multi-agent orchestration through:
- **Orchestrator as coordinator** creating and managing tasks (CMO in health example)
- **Single specialist implementation** with prompt-based specialization
- **Visualization agent** for dynamic UI generation
- **Tool abstraction** hiding data complexity
- **Streaming updates** for real-time feedback

The key insight is that "multi-agent" doesn't mean multiple agent classes - it means multiple agent instances with different prompts and roles, coordinated by an orchestrator.