# Health System Architecture Guide

## Executive Summary

We need to build a sophisticated health insight system that can analyze complex health data and provide comprehensive medical insights. Based on Anthropic's research (documented in ["How we built our multi-agent research system"](https://www.anthropic.com/engineering/built-multi-agent-research-system)) showing 90.2% performance improvement with multi-agent systems over single agents, we will implement an orchestrator-worker pattern with specialized medical agents.

## Core Architecture Pattern

### Orchestrator Agent (Chief Medical Officer - CMO)
- Analyzes query complexity
- Delegates to appropriate specialists
- Synthesizes findings from multiple specialists
- Ensures comprehensive coverage of health concerns
- Assesses medical query complexity
- Coordinates specialist responses

### Specialist Agents (Medical Team)
1. **Cardiology Specialist** 
   - Heart health, blood pressure, cardiovascular risk
   - Interprets blood pressure, cholesterol, heart rate
   - Identifies cardiovascular risk factors

2. **Laboratory Medicine Specialist** 
   - Lab results interpretation, reference ranges
   - Identifies abnormal values and trends
   - Correlates multiple test results

3. **Endocrinology Specialist** 
   - Hormones, diabetes, metabolic health
   - Analyzes glucose, HbA1c, thyroid markers
   - Hormonal balance assessment

4. **Data Analysis Specialist** 
   - Statistical trends, correlations, predictions
   - Pattern recognition in health data
   - Predictive health modeling

5. **Preventive Medicine Specialist** 
   - Risk assessment, screening recommendations
   - Calculates health risk scores
   - Focuses on disease prevention

6. **Pharmacy Specialist** 
   - Medications, interactions, adherence
   - Reviews medications and interactions
   - Assesses medication effectiveness
   - Identifies potential side effects

7. **Nutrition Specialist** 
   - Diet analysis, weight management
   - Analyzes dietary impacts on health
   - Provides nutritional recommendations
   - Assesses vitamin/mineral levels

8. **General Practice Specialist** 
   - Overall health coordination
   - Provides holistic health view
   - Integrates findings from other specialists
   - Primary care perspective

### Visualization Agent
- Generates interactive React components
- Creates data visualizations (time series, comparisons, distributions)
- Produces self-contained, executable chart components

## Technology Stack & Implementation Approach

### Required Technology Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React with Vite
- **AI**: Anthropic Claude API
- **Streaming**: Server-Sent Events (SSE)
- **Data Access**: Pre-built tools (provided)

### What We're NOT Using
- ❌ Next.js (neither for backend nor frontend)
- ❌ Redis or any caching layer
- ❌ Databases (tools handle data)
- ❌ Message queues or task workers
- ❌ Authentication systems
- ❌ Complex state management (Redux, Zustand)

### Implementation Principles
This system follows a **simple, direct implementation** approach:

1. **Simplicity**: Easy to understand, modify, and debug
2. **Direct**: No unnecessary abstraction layers
3. **Fast Development**: Can be built quickly
4. **Clear Boundaries**: Each component has one job
5. **Tool-Focused**: Leverages pre-built capabilities

## Health Data Tools & Integration

### Pre-built Tool: execute_health_query_v2
**Purpose**: Natural language querying of health data
**Input Schema**:
```json
{
  "query": "string - natural language health question",
  "time_range": "optional - specific time period",
  "data_types": "optional - specific health metrics"
}
```
**Returns**: Structured health data based on query

### Pre-built Tool: snowflake_import_analyze_health_records_v2  
**Purpose**: Import and analyze comprehensive health records
**Input Schema**:
```json
{
  "patient_id": "string - patient identifier",
  "record_types": "array - types of records to import",
  "analysis_depth": "string - basic|comprehensive"
}
```
**Returns**: Imported health data with initial analysis

### Direct Tool Integration Pattern
```python
# Tools are pre-built and provided
from tools.tool_registry import ToolRegistry

# Simply use them in agents
tools = ToolRegistry()
result = await tools.execute_tool("execute_health_query_v2", {"query": "..."})
```

### Data Sources (via tools)
- Electronic Health Records (EHR)
- Lab information systems
- Pharmacy records
- Wearable device data
- Patient-reported outcomes

## Health-Specific Data Models

### HealthMetric
```json
{
  "metric_type": "lab_result|vital_sign|medication",
  "name": "string",
  "value": "number",
  "unit": "string",
  "reference_range": {
    "min": "number",
    "max": "number"
  },
  "status": "normal|borderline|critical",
  "date": "ISO 8601 timestamp"
}
```

### MedicalSpecialistTask
```json
{
  "specialist": "cardiology|endocrinology|etc",
  "task_description": "string",
  "priority": "high|medium|low",
  "data_required": ["array of data types"],
  "expected_duration": "seconds"
}
```

### HealthInsight
```json
{
  "specialist": "string",
  "finding": "string",
  "confidence": "number 0-1",
  "severity": "info|warning|critical",
  "recommendations": ["array of strings"],
  "supporting_data": ["array of metrics"]
}
```

## Implementation Patterns

### Simple Agent Pattern
```python
class SpecialistAgent:
    def __init__(self, name, specialty):
        self.client = Anthropic()
        self.tools = ToolRegistry()
        self.prompts = self._load_prompts()  # From .txt files
    
    async def analyze(self, task):
        # Direct API call with tools
        return await self.client.messages.create(...)
```

### Direct SSE Streaming
```python
# FastAPI endpoint
@router.post("/api/chat/message")
async def chat_message(request):
    async def generate():
        async for update in orchestrator.process(request):
            yield f"data: {json.dumps(update)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### React Frontend Setup
```bash
# Setup
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install

# Simple component structure
src/
├── App.tsx
├── components/
├── services/api.ts
└── types/
```

## Health Query Complexity Rules

### Simple (1 specialist, <5 seconds)
- Single metric lookup ("What's my blood pressure?")
- Recent test results
- Current medications

### Standard (2-3 specialists, <15 seconds)
- Condition-specific analysis ("How's my diabetes?")
- Medication effectiveness
- Trend analysis

### Complex (4-6 specialists, <30 seconds)
- Comprehensive health assessment
- Multi-condition interactions
- Predictive health analysis

### Critical (All relevant specialists, priority processing)
- Urgent health concerns
- Multiple abnormal values
- Drug interaction warnings

## Performance Requirements

### Response Times
- Critical health queries: <2 seconds to start
- Simple lookups: <5 seconds total
- Complex analysis: <30 seconds total
- Emergency alerts: Immediate
- Query response time < 5 seconds for simple queries
- Comprehensive analysis for complex queries

### Data Processing
- Support 10+ years of health history
- Handle 50+ different lab test types
- Process medication interactions in real-time
- Correlate multiple health conditions

### System Performance
- Parallel execution of specialist agents
- Real-time streaming updates via SSE
- Token Usage: Multi-agent systems use ~15x more tokens but provide significantly better results

## User Experience

### Progressive Disclosure
- Progressive disclosure of specialist activities
- Live status updates showing which specialists are working
- Clear synthesis of multiple specialist opinions
- Interactive visualizations for data exploration

### Health Visualization Requirements

#### Required Chart Types
1. **Time Series**
   - Lab results over time
   - Vital sign trends
   - Medication timelines

2. **Comparison Charts**
   - Before/after medication changes
   - Multiple metric correlations
   - Reference range comparisons

3. **Risk Assessment**
   - Cardiovascular risk gauges
   - Diabetes risk indicators
   - Overall health scores

4. **Distribution Charts**
   - Blood pressure distributions
   - Glucose pattern analysis
   - Sleep quality patterns

## API Endpoints

### Health Analysis Stream
```
GET /api/health/analyze/stream?query={encoded_query}
```
- Streams real-time analysis from medical team
- Shows specialist activation and progress
- Returns synthesized health insights

### Health Data Import
```
POST /api/health/import
```
- Triggers health record import
- Processes various health data formats
- Returns import status and summary

### Health Metrics
```
GET /api/health/metrics?type={metric_type}&range={time_range}
```
- Retrieves specific health metrics
- Supports filtering and time ranges
- Returns structured metric data

## Compliance and Security

### HIPAA Considerations
- No PII in logs or error messages
- Encrypted data transmission
- Audit trails for data access
- Secure API endpoints

### Medical Disclaimers
- Not a replacement for medical advice
- Always consult healthcare providers
- Emergency situations require immediate medical attention

## Export Capabilities
- PDF reports for physicians
- Structured data for EHR import
- Shareable visualizations
- Printable summaries

## Data Flow
```
User Query → React UI → FastAPI → CMO Agent → Specialist Agents
                ↓                      ↓              ↓
              SSE Updates         Tool Calls     Tool Calls
                ↓                      ↓              ↓
            Real-time UI          Health Data    Health Data
```

## Key Implementation Notes

1. **Agents are thin orchestrators** - Most logic is in prompts
2. **Tools handle all data access** - No database code needed
3. **SSE provides real-time updates** - No polling or WebSockets
4. **React state is sufficient** - No complex state management
5. **FastAPI handles everything** - Simple, fast, async
6. **Coordination Complexity**: CMO must effectively orchestrate specialists
7. **Error Handling**: System must gracefully handle individual specialist failures
8. **Context Management**: Each specialist receives focused context, not entire history

## Success Metrics

- 90%+ improvement in diagnostic completeness
- Zero critical health insights missed
- User satisfaction score > 4.5/5
- Ability to identify complex health patterns across multiple domains

## Getting Started

1. Backend: `cd backend && python main.py`
2. Frontend: `cd frontend && npm run dev`
3. That's it - no complex setup required

## Reference Implementation

See Anthropic's blog post ["How we built our multi-agent research system"](https://www.anthropic.com/engineering/built-multi-agent-research-system) for detailed patterns and best practices that we'll follow in this implementation.

This customization guide should be provided to the PM Agent along with the generic multi-agent requirements to create health-specific technical specifications while maintaining the flexibility of the core agent system.