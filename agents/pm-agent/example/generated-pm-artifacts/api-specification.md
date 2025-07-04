# API Specification - Health Insight Assistant

## Base URL
- Development: `http://localhost:8000`
- Production: `https://api.healthinsight.app`

## API Conventions

### Headers
```http
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}  # Optional request tracking
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Endpoints

### Health Analysis Endpoints

#### Start Health Analysis (Streaming)
```http
GET /api/chat/stream?message={message}&thread_id={thread_id}
```

Initiates a streaming health analysis using Server-Sent Events.

**Query Parameters:**
- `message` (string, required): URL-encoded health query
- `thread_id` (string, optional): UUID of existing thread or 'new'

**Response:** Server-Sent Events stream
```
event: connected
data: {"status": "connected", "thread_id": "550e8400-e29b-41d4-a716-446655440000"}

event: message
data: {"content": "I'll analyze your health query about cholesterol trends..."}

event: agent_activated
data: {"agent": "cardiology", "name": "Dr. Heart", "status": "active"}

event: agent_progress
data: {"agent": "cardiology", "progress": 50, "message": "Analyzing cardiovascular metrics..."}

event: agent_complete
data: {"agent": "cardiology", "confidence": 85, "duration": 2.3}

event: visualization_ready
data: {"type": "line_chart", "id": "viz_123", "title": "Cholesterol Trend Analysis"}

event: error
data: {"code": "TOOL_ERROR", "message": "Unable to retrieve some lab data"}

event: done
data: {"summary": "Analysis complete", "total_duration": 8.5}
```

**Headers Required:**
```http
X-Accel-Buffering: no
Cache-Control: no-cache
Connection: keep-alive
```

#### Submit Health Query (Non-streaming)
```http
POST /api/chat/message
```

Submits a health query for analysis (non-streaming alternative).

**Request Body:**
```json
{
  "message": "What's my cholesterol trend over the past year?",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "options": {
    "include_visualizations": true,
    "specialists": ["cardiology", "laboratory_medicine"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query_id": "q_789",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000",
    "complexity": "standard",
    "specialists_assigned": [
      {
        "type": "cardiology",
        "name": "Dr. Heart",
        "status": "pending"
      },
      {
        "type": "laboratory_medicine", 
        "name": "Dr. Lab",
        "status": "pending"
      }
    ],
    "estimated_time": 15
  }
}
```

### Thread Management Endpoints

#### List Conversation Threads
```http
GET /api/threads?limit={limit}&offset={offset}&search={search}
```

Retrieves all conversation threads with pagination.

**Query Parameters:**
- `limit` (int, default: 20): Number of threads to return
- `offset` (int, default: 0): Pagination offset
- `search` (string, optional): Search query for thread content

**Response:**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Cholesterol Analysis",
        "created_at": 1736942400,
        "updated_at": 1736946000,
        "message_count": 8,
        "preview": "What's my cholesterol trend over the past year?",
        "category": "today"
      }
    ],
    "total": 42,
    "has_more": true
  }
}
```

#### Get Thread Details
```http
GET /api/threads/{thread_id}
```

Retrieves complete thread with all messages and results.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Cholesterol Analysis",
    "created_at": 1736942400,
    "messages": [
      {
        "id": "msg_123",
        "role": "user",
        "content": "What's my cholesterol trend?",
        "timestamp": 1736942400
      },
      {
        "id": "msg_124",
        "role": "assistant",
        "content": "I'll analyze your cholesterol trends...",
        "timestamp": 1736942405,
        "metadata": {
          "complexity": "standard",
          "specialists": ["cardiology", "laboratory_medicine"]
        }
      }
    ],
    "results": [
      {
        "query_id": "q_789",
        "query": "What's my cholesterol trend?",
        "timestamp": 1736942400,
        "specialists": [...],
        "synthesis": "...",
        "visualizations": [...]
      }
    ]
  }
}
```

#### Create New Thread
```http
POST /api/threads
```

Creates a new conversation thread.

**Request Body:**
```json
{
  "title": "Custom Title (optional)",
  "initial_message": "What are my cardiovascular risk factors?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thread_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Cardiovascular Risk Assessment",
    "created_at": 1736942400
  }
}
```

#### Delete Thread
```http
DELETE /api/threads/{thread_id}
```

Soft deletes a conversation thread.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Thread deleted successfully"
  }
}
```

### Health Data Endpoints

#### Get Analysis Results
```http
GET /api/threads/{thread_id}/results?query_id={query_id}
```

Retrieves analysis results for a thread, optionally filtered by query.

**Query Parameters:**
- `query_id` (string, optional): Filter results by specific query

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "query_id": "q_789",
        "query": "What's my cholesterol trend?",
        "timestamp": 1736942400,
        "complexity": "standard",
        "specialists": [
          {
            "type": "cardiology",
            "name": "Dr. Heart",
            "findings": "Your cholesterol shows improvement...",
            "confidence": 85,
            "duration": 2.3
          }
        ],
        "synthesis": "Based on comprehensive analysis...",
        "recommendations": [
          "Continue current medication",
          "Schedule follow-up in 3 months"
        ],
        "visualizations": [
          {
            "id": "viz_123",
            "type": "line_chart",
            "title": "Cholesterol Trends",
            "component": "const CholesterolChart = () => {...}"
          }
        ]
      }
    ]
  }
}
```

#### Export Health Report
```http
POST /api/threads/{thread_id}/export
```

Generates a PDF report of health analyses.

**Request Body:**
```json
{
  "format": "pdf",
  "include_queries": ["q_789", "q_790"],
  "options": {
    "include_visualizations": true,
    "include_raw_data": false,
    "provider_format": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_url": "/api/exports/exp_456.pdf",
    "expires_at": 1736950000,
    "size_bytes": 245760
  }
}
```

### Visualization Endpoints

#### Get Visualization Component
```http
GET /api/visualizations/{visualization_id}
```

Retrieves a specific visualization component.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "viz_123",
    "type": "line_chart",
    "title": "Cholesterol Trends Over Time",
    "query_id": "q_789",
    "component": "const HealthVisualization = () => { ... }",
    "created_at": 1736942400
  }
}
```

#### List Visualizations by Query
```http
GET /api/visualizations?query_id={query_id}
```

Lists all visualizations for a specific query.

**Response:**
```json
{
  "success": true,
  "data": {
    "visualizations": [
      {
        "id": "viz_123",
        "type": "line_chart",
        "title": "Cholesterol Trends",
        "query_id": "q_789"
      },
      {
        "id": "viz_124",
        "type": "comparison_chart",
        "title": "Before/After Medication",
        "query_id": "q_789"
      }
    ]
  }
}
```

### Health Metrics Endpoints

#### Get Health Metrics
```http
GET /api/health/metrics?type={type}&start_date={start}&end_date={end}
```

Retrieves specific health metrics (direct tool wrapper).

**Query Parameters:**
- `type` (string, required): Metric type (lab_result, vital_sign, medication)
- `start_date` (string, optional): ISO date
- `end_date` (string, optional): ISO date

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "type": "lab_result",
        "name": "Total Cholesterol",
        "value": 185,
        "unit": "mg/dL",
        "reference_range": {
          "min": 0,
          "max": 200
        },
        "status": "normal",
        "date": "2024-06-15T08:30:00Z"
      }
    ],
    "total": 24
  }
}
```

### System Endpoints

#### Health Check
```http
GET /api/health
```

System health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "services": {
      "anthropic_api": "connected",
      "tools": "available",
      "sse": "active"
    }
  }
}
```

#### Get System Configuration
```http
GET /api/config
```

Returns public system configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "specialists": [
      {
        "type": "cardiology",
        "name": "Dr. Heart",
        "color": "#EF4444",
        "icon": "heart"
      }
    ],
    "complexity_levels": ["simple", "standard", "complex", "critical"],
    "max_file_size": 10485760,
    "supported_formats": ["json", "csv", "pdf"]
  }
}
```

## WebSocket Alternative (Future)

### Health Analysis WebSocket
```
ws://localhost:8000/ws/health-analysis
```

For future real-time bidirectional communication.

**Message Format:**
```json
{
  "type": "query",
  "data": {
    "message": "Analyze my blood pressure",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Streaming**: 10 concurrent SSE connections per IP
- **Export**: 5 exports per hour per IP

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736943000
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_REQUEST` | Malformed request data | 400 |
| `THREAD_NOT_FOUND` | Thread ID doesn't exist | 404 |
| `QUERY_TOO_LONG` | Query exceeds 1000 characters | 400 |
| `TOOL_ERROR` | Health data tool failed | 503 |
| `AGENT_ERROR` | AI agent processing failed | 500 |
| `RATE_LIMITED` | Too many requests | 429 |
| `STREAM_TIMEOUT` | SSE connection timed out | 408 |
| `EXPORT_FAILED` | PDF generation failed | 500 |

## CORS Configuration

```python
cors_config = {
    "allow_origins": ["http://localhost:5173", "https://app.healthinsight.app"],
    "allow_methods": ["GET", "POST", "DELETE"],
    "allow_headers": ["Content-Type", "X-Request-ID"],
    "expose_headers": ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    "allow_credentials": False
}
```

## Example Integration

### JavaScript/TypeScript Client
```typescript
// Starting a health analysis
const eventSource = new EventSource(
  `/api/chat/stream?message=${encodeURIComponent(query)}&thread_id=new`
);

eventSource.addEventListener('agent_activated', (event) => {
  const data = JSON.parse(event.data);
  console.log(`${data.name} is now analyzing your health data...`);
});

eventSource.addEventListener('visualization_ready', (event) => {
  const data = JSON.parse(event.data);
  renderVisualization(data.component);
});

eventSource.addEventListener('done', (event) => {
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

This API specification provides a complete interface for the Health Insight Assistant, supporting real-time streaming analysis, conversation management, and comprehensive health data visualization.