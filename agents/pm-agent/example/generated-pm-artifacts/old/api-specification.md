# API Specification: Multi-Agent Health Insight System

## Base Configuration

### Base URL
```
Development: http://localhost:8000
Production: https://api.health-insights.example.com
```

### Headers
```
Content-Type: application/json
Accept: application/json
```

### CORS Configuration
```python
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "https://health-insights.example.com"  # Production frontend
]
```

## Core Endpoints

### Health Check

#### Endpoint: System Health
- **Method**: GET
- **Path**: /api/health
- **Description**: Check if the system is operational and all agents are ready
- **Request Body**: None
- **Response**: 
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "agents": {
    "cmo": "ready",
    "specialists": "ready",
    "visualization": "ready"
  },
  "tools": {
    "health_query": "connected",
    "import_tool": "connected"
  }
}
```
- **Errors**: 
  - 503: Service unavailable if any component is down
- **Example**:
```bash
curl http://localhost:8000/api/health
```

### Chat Endpoints

#### Endpoint: Stream Analysis (SSE)
- **Method**: POST
- **Path**: /api/chat/message
- **Description**: Submit a health query and receive real-time analysis updates via Server-Sent Events
- **Request Body**:
```json
{
  "message": "What's my cholesterol trend over the last 15 years?",
  "conversation_id": "conv_123abc",  // Optional, for conversation context
  "user_id": "user_456def"           // Optional, for demo purposes
}
```
- **Response**: Server-Sent Events stream
- **Event Types**:

```typescript
// Initial acknowledgment
data: {"type": "start", "query_id": "q_789ghi", "timestamp": "2024-01-15T10:30:00Z"}

// CMO thinking process
data: {"type": "thinking", "agent": "cmo", "content": "Analyzing query complexity..."}

// Tool execution
data: {"type": "tool_call", "agent": "cmo", "tool": "execute_health_query_v2", "input": {"query": "summarize available health data"}}
data: {"type": "tool_result", "agent": "cmo", "tool": "execute_health_query_v2", "success": true, "result_summary": "Found 12 years of cholesterol data"}

// Complexity assessment
data: {"type": "complexity_assessment", "level": "STANDARD", "reasoning": "Query involves trend analysis over extended time period"}

// Team assembly
data: {"type": "team_assembled", "specialists": [
  {"name": "cardiology", "task": "Analyze cholesterol trends including LDL, HDL, and triglycerides"},
  {"name": "data_analysis", "task": "Create statistical analysis and visualization"}
]}

// Specialist progress
data: {"type": "specialist_start", "specialist": "cardiology", "task": "Analyzing cholesterol trends"}
data: {"type": "specialist_progress", "specialist": "cardiology", "progress": 25}
data: {"type": "specialist_progress", "specialist": "cardiology", "progress": 50}
data: {"type": "specialist_complete", "specialist": "cardiology", "confidence": 85, "summary": "Found concerning LDL trend"}

// Synthesis
data: {"type": "synthesis_start", "agent": "cmo"}
data: {"type": "text", "content": "## Your 15-Year Cholesterol Trend Analysis\n\nBased on comprehensive analysis..."}

// Visualization generation
data: {"type": "visualization_start", "description": "Generating interactive cholesterol trend chart"}
data: {"type": "visualization", "code": "const HealthVisualization = () => {\n  const data = [...]\n  return <LineChart>...</LineChart>\n}"}

// Completion
data: {"type": "complete", "query_id": "q_789ghi", "duration_ms": 8500, "tokens_used": 12500}
```

- **Errors**: 
  - 400: Invalid request format
  - 401: Unauthorized (if auth is enabled)
  - 429: Rate limit exceeded
  - 500: Internal server error
- **Example**:
```javascript
const eventSource = new EventSource('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "What's my cholesterol trend?" })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

#### Endpoint: Get Conversation History
- **Method**: GET
- **Path**: /api/chat/conversations/{conversation_id}
- **Description**: Retrieve all messages and analyses from a conversation
- **Request Body**: None
- **Response**:
```json
{
  "conversation_id": "conv_123abc",
  "created_at": "2024-01-15T10:00:00Z",
  "messages": [
    {
      "id": "msg_001",
      "type": "user",
      "content": "What's my cholesterol trend?",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "id": "msg_002",
      "type": "assistant",
      "content": "Your 15-Year Cholesterol Trend Analysis...",
      "timestamp": "2024-01-15T10:00:08Z",
      "metadata": {
        "complexity": "STANDARD",
        "specialists_used": ["cardiology", "data_analysis"],
        "has_visualization": true
      }
    }
  ],
  "analyses": [
    {
      "query_id": "q_789ghi",
      "specialists_results": {...},
      "visualization_code": "..."
    }
  ]
}
```
- **Errors**:
  - 404: Conversation not found
- **Example**:
```bash
curl http://localhost:8000/api/chat/conversations/conv_123abc
```

### Data Management Endpoints

#### Endpoint: Import Health Data
- **Method**: POST
- **Path**: /api/data/import
- **Description**: Trigger import of health data files
- **Request Body**:
```json
{
  "file_directory": "/path/to/health/data/files",
  "user_id": "user_456def"
}
```
- **Response**:
```json
{
  "import_id": "imp_789xyz",
  "status": "processing",
  "message": "Import started successfully"
}
```
- **Errors**:
  - 400: Invalid directory path
  - 500: Import tool error
- **Example**:
```bash
curl -X POST http://localhost:8000/api/data/import \
  -H "Content-Type: application/json" \
  -d '{"file_directory": "/uploads/user_456def"}'
```

#### Endpoint: Get Import Status
- **Method**: GET
- **Path**: /api/data/import/{import_id}/status
- **Description**: Check the status of a health data import
- **Request Body**: None
- **Response**:
```json
{
  "import_id": "imp_789xyz",
  "status": "completed",
  "summary": {
    "total_records": 1234,
    "records_by_category": {
      "lab_results": 450,
      "medications": 234,
      "vitals": 550
    },
    "date_range": {
      "start": "2013-01-15",
      "end": "2025-06-30"
    }
  }
}
```
- **Errors**:
  - 404: Import ID not found

### Analytics Endpoints

#### Endpoint: Get System Metrics
- **Method**: GET
- **Path**: /api/analytics/metrics
- **Description**: Retrieve system performance metrics (demo mode only)
- **Request Body**: None
- **Response**:
```json
{
  "period": "last_hour",
  "metrics": {
    "total_queries": 156,
    "complexity_distribution": {
      "SIMPLE": 45,
      "STANDARD": 78,
      "COMPLEX": 28,
      "CRITICAL": 5
    },
    "average_response_time_ms": {
      "SIMPLE": 2500,
      "STANDARD": 5200,
      "COMPLEX": 12000,
      "CRITICAL": 18500
    },
    "specialist_usage": {
      "cardiology": 89,
      "laboratory_medicine": 134,
      "data_analysis": 98,
      "pharmacy": 67,
      "endocrinology": 45,
      "preventive_medicine": 56,
      "nutrition": 34,
      "general_practice": 78
    },
    "token_usage": {
      "total": 1850000,
      "average_per_query": 11859
    }
  }
}
```

## WebSocket Alternative (Future Enhancement)

### Endpoint: WebSocket Connection
- **Path**: /ws/chat/{conversation_id}
- **Description**: Alternative to SSE for bidirectional communication
- **Message Format**:
```json
// Client to Server
{
  "type": "query",
  "content": "What's my cholesterol trend?",
  "id": "msg_client_001"
}

// Server to Client (same as SSE data format)
{
  "type": "specialist_progress",
  "specialist": "cardiology",
  "progress": 75
}
```

## Error Response Format

All error responses follow this structure:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is missing required fields",
    "details": {
      "missing_fields": ["message"]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Codes
- `INVALID_REQUEST`: Malformed request
- `RATE_LIMITED`: Too many requests
- `TOOL_ERROR`: Tool execution failed
- `AGENT_ERROR`: Agent processing failed
- `TIMEOUT`: Operation timed out
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting

### Limits
- 60 requests per minute per IP
- 10 concurrent SSE connections per user
- 100MB max request size for data imports

### Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705320000
```

## Demo Mode Features

When `ENABLE_DEMO_MODE=true`, additional endpoints are available:

### Endpoint: Reset Demo Data
- **Method**: POST
- **Path**: /api/demo/reset
- **Description**: Reset to initial demo state
- **Response**:
```json
{
  "status": "reset_complete",
  "message": "Demo environment reset to initial state"
}
```

### Endpoint: Load Sample Query
- **Method**: GET
- **Path**: /api/demo/sample-queries
- **Description**: Get predefined demo queries
- **Response**:
```json
{
  "queries": [
    {
      "id": "demo_001",
      "category": "simple",
      "query": "What's my latest cholesterol?",
      "expected_duration_ms": 2500
    },
    {
      "id": "demo_002", 
      "category": "complex",
      "query": "Analyze my cardiovascular risk based on all my health data",
      "expected_duration_ms": 15000
    }
  ]
}
```

## Client Implementation Guide

### JavaScript/TypeScript SSE Client
```typescript
class HealthInsightClient {
  private eventSource: EventSource | null = null;
  
  async streamQuery(query: string, onUpdate: (data: any) => void) {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onUpdate(data);
        }
      }
    }
  }
}
```

### Python Client Example
```python
import json
import requests
from sseclient import SSEClient

def stream_health_query(query: str):
    response = requests.post(
        'http://localhost:8000/api/chat/message',
        json={'message': query},
        stream=True
    )
    
    client = SSEClient(response)
    for event in client.events():
        data = json.loads(event.data)
        print(f"{data['type']}: {data}")
        
        if data['type'] == 'complete':
            break
```

## Testing Endpoints

### Endpoint: Validate Query
- **Method**: POST
- **Path**: /api/test/validate-query
- **Description**: Test query parsing without execution
- **Request Body**:
```json
{
  "query": "What's my cholesterol trend?"
}
```
- **Response**:
```json
{
  "valid": true,
  "detected_domains": ["laboratory", "cardiology"],
  "estimated_complexity": "STANDARD",
  "suggested_specialists": ["cardiology", "data_analysis"]
}
```