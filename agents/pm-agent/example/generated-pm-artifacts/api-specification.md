# API Specification: Multi-Agent Health Insight System

## Overview

This document defines the RESTful API and real-time communication protocols for the Multi-Agent Health Insight System. All endpoints follow REST conventions with JSON payloads and include proper error handling, authentication, and rate limiting.

## Base Configuration

### Base URL
```
Production: https://api.healthinsight.ai/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All endpoints require authentication via JWT tokens:
```
Authorization: Bearer <jwt_token>
```

### Common Headers
```
Content-Type: application/json
Accept: application/json
X-Request-ID: <unique-request-id>
X-Client-Version: 1.0.0
```

### Rate Limiting
- 100 requests per minute for standard endpoints
- 10 requests per minute for analysis endpoints
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Core Endpoints

### Health Analysis

#### Endpoint: Submit Health Query
- **Method**: POST
- **Path**: /api/v1/analysis/query
- **Description**: Submit a health query for multi-agent analysis
- **Request Body**:
```json
{
  "query": "string - Natural language health query",
  "context": {
    "conversationId": "string (optional) - Existing conversation ID",
    "previousQueryId": "string (optional) - ID of previous query for context",
    "urgency": "low|normal|high (optional, default: normal)"
  },
  "preferences": {
    "visualizations": "boolean (optional, default: true)",
    "detailLevel": "summary|standard|comprehensive (optional, default: standard)",
    "language": "string (optional, default: en)"
  }
}
```
- **Response**: 
```json
{
  "queryId": "uuid",
  "conversationId": "uuid",
  "status": "queued|processing|completed|failed",
  "complexity": "simple|standard|complex|critical",
  "estimatedCompletionTime": "ISO8601 duration",
  "streamUrl": "/api/v1/analysis/stream/{queryId}",
  "createdAt": "ISO8601 timestamp"
}
```
- **Errors**: 
  - 400: Invalid query format
  - 401: Unauthorized
  - 429: Rate limit exceeded
  - 503: Service temporarily unavailable
- **Example**:
```bash
curl -X POST https://api.healthinsight.ai/v1/analysis/query \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is my cholesterol trend over the last 15 years?",
    "preferences": {
      "visualizations": true,
      "detailLevel": "comprehensive"
    }
  }'
```

#### Endpoint: Get Analysis Status
- **Method**: GET
- **Path**: /api/v1/analysis/status/{queryId}
- **Description**: Check the status of an ongoing analysis
- **Response**:
```json
{
  "queryId": "uuid",
  "status": "queued|processing|completed|failed",
  "progress": {
    "overall": 75,
    "specialists": [
      {
        "name": "Cardiology",
        "status": "completed",
        "confidence": 95,
        "completedAt": "ISO8601 timestamp"
      },
      {
        "name": "Data Analysis",
        "status": "processing",
        "progress": 60
      }
    ]
  },
  "currentPhase": "initialization|analysis|synthesis|visualization",
  "messages": ["string array of status messages"]
}
```

#### Endpoint: Get Analysis Results
- **Method**: GET
- **Path**: /api/v1/analysis/results/{queryId}
- **Description**: Retrieve completed analysis results
- **Response**:
```json
{
  "queryId": "uuid",
  "query": "original query text",
  "complexity": "simple|standard|complex|critical",
  "results": {
    "summary": "Executive summary of findings",
    "keyFindings": [
      {
        "finding": "string",
        "importance": "low|medium|high|critical",
        "confidence": 0.95,
        "specialist": "Cardiology"
      }
    ],
    "specialistReports": [
      {
        "specialist": "Cardiology",
        "findings": ["array of findings"],
        "recommendations": ["array of recommendations"],
        "confidence": 0.92,
        "dataPoints": 156,
        "completedAt": "ISO8601 timestamp"
      }
    ],
    "visualizations": [
      {
        "id": "uuid",
        "type": "line|bar|scatter|heatmap",
        "title": "string",
        "component": "base64 encoded React component",
        "data": {}
      }
    ],
    "recommendations": [
      {
        "category": "lifestyle|medical|monitoring",
        "recommendation": "string",
        "priority": "low|medium|high",
        "rationale": "string"
      }
    ]
  },
  "metadata": {
    "analysisTime": "PT5M23S",
    "specialistsUsed": 5,
    "dataPointsAnalyzed": 1543,
    "confidenceScore": 0.94
  }
}
```

### Real-time Streaming

#### Endpoint: Analysis Stream
- **Method**: GET (Server-Sent Events)
- **Path**: /api/v1/analysis/stream/{queryId}
- **Description**: Real-time stream of analysis progress and results
- **Event Types**:
```typescript
// Connection established
event: connected
data: {"queryId": "uuid", "timestamp": "ISO8601"}

// Specialist status update
event: specialist-update
data: {
  "specialist": "Cardiology",
  "status": "started|processing|completed",
  "progress": 45,
  "message": "Analyzing cardiovascular metrics..."
}

// Partial result available
event: partial-result
data: {
  "specialist": "Laboratory Medicine",
  "finding": "Cholesterol levels show improving trend",
  "confidence": 0.89
}

// Visualization ready
event: visualization-ready
data: {
  "visualizationId": "uuid",
  "type": "line",
  "title": "Cholesterol Trend Analysis"
}

// Analysis complete
event: analysis-complete
data: {
  "queryId": "uuid",
  "resultUrl": "/api/v1/analysis/results/{queryId}"
}

// Error occurred
event: error
data: {
  "code": "SPECIALIST_FAILURE",
  "message": "Cardiology specialist temporarily unavailable",
  "recoverable": true
}
```

### Conversation Management

#### Endpoint: List Conversations
- **Method**: GET
- **Path**: /api/v1/conversations
- **Description**: Retrieve user's conversation history
- **Query Parameters**:
  - `limit`: number (default: 20, max: 100)
  - `offset`: number (default: 0)
  - `sortBy`: created|updated|queryCount (default: updated)
  - `order`: asc|desc (default: desc)
- **Response**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Cholesterol Analysis",
      "lastQuery": "What's my cholesterol trend?",
      "queryCount": 3,
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601",
      "tags": ["cholesterol", "cardiology"]
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Endpoint: Get Conversation Details
- **Method**: GET
- **Path**: /api/v1/conversations/{conversationId}
- **Description**: Retrieve full conversation with all queries
- **Response**:
```json
{
  "id": "uuid",
  "title": "Cholesterol Analysis",
  "queries": [
    {
      "id": "uuid",
      "query": "What's my cholesterol trend?",
      "complexity": "standard",
      "timestamp": "ISO8601",
      "summary": "Brief summary of results",
      "hasVisualizations": true
    }
  ],
  "metadata": {
    "totalQueries": 3,
    "specialistsInvolved": ["Cardiology", "Laboratory Medicine"],
    "primaryHealthTopics": ["cholesterol", "cardiovascular"]
  }
}
```

#### Endpoint: Update Conversation
- **Method**: PATCH
- **Path**: /api/v1/conversations/{conversationId}
- **Description**: Update conversation metadata
- **Request Body**:
```json
{
  "title": "string (optional)",
  "tags": ["string array (optional)"],
  "archived": "boolean (optional)"
}
```

### Health Data Management

#### Endpoint: Import Health Records
- **Method**: POST
- **Path**: /api/v1/health-data/import
- **Description**: Import health records from files
- **Request Body**: multipart/form-data
```
file: health_records.json
source: "epic|cerner|allscripts|manual"
importOptions: {
  "validateData": true,
  "mergeStrategy": "append|replace|smart-merge",
  "dateFormat": "ISO8601|MM-DD-YYYY"
}
```
- **Response**:
```json
{
  "importId": "uuid",
  "status": "processing|completed|failed",
  "summary": {
    "totalRecords": 1234,
    "recordsByType": {
      "labResults": 456,
      "medications": 234,
      "vitals": 544
    },
    "dateRange": {
      "start": "2010-01-15",
      "end": "2024-12-30"
    },
    "dataQuality": {
      "completeness": 0.95,
      "validationErrors": 12
    }
  },
  "processingTime": "PT2M34S"
}
```

#### Endpoint: Get Health Data Summary
- **Method**: GET
- **Path**: /api/v1/health-data/summary
- **Description**: Get overview of available health data
- **Response**:
```json
{
  "summary": {
    "totalRecords": 5678,
    "dateRange": {
      "earliest": "2010-01-15",
      "latest": "2024-12-30"
    },
    "categories": [
      {
        "name": "Laboratory Results",
        "count": 1234,
        "lastUpdated": "2024-12-15",
        "subcategories": [
          {"name": "Blood Chemistry", "count": 456},
          {"name": "Hematology", "count": 234}
        ]
      }
    ],
    "dataCompleteness": {
      "overall": 0.89,
      "byCategory": {
        "labResults": 0.95,
        "medications": 0.87,
        "vitals": 0.82
      }
    }
  }
}
```

### Visualization Endpoints

#### Endpoint: Get Visualization Component
- **Method**: GET
- **Path**: /api/v1/visualizations/{visualizationId}
- **Description**: Retrieve a specific visualization component
- **Response**:
```json
{
  "id": "uuid",
  "type": "line|bar|scatter|heatmap|combined",
  "title": "Cholesterol Trend Over Time",
  "component": {
    "code": "base64 encoded React component",
    "props": {
      "data": [],
      "config": {}
    }
  },
  "interactiveFeatures": [
    "zoom",
    "pan",
    "export",
    "fullscreen"
  ],
  "metadata": {
    "createdAt": "ISO8601",
    "dataPoints": 156,
    "timeRange": {
      "start": "2010-01-15",
      "end": "2024-12-30"
    }
  }
}
```

#### Endpoint: Export Visualization
- **Method**: POST
- **Path**: /api/v1/visualizations/{visualizationId}/export
- **Description**: Export visualization in various formats
- **Request Body**:
```json
{
  "format": "png|svg|pdf",
  "resolution": "72|150|300",
  "includeData": true
}
```
- **Response**: Binary data with appropriate content-type

### User Preferences

#### Endpoint: Get User Preferences
- **Method**: GET
- **Path**: /api/v1/user/preferences
- **Description**: Retrieve user's system preferences
- **Response**:
```json
{
  "display": {
    "theme": "light|dark|auto",
    "chartColorScheme": "default|colorblind-safe",
    "fontSize": "small|medium|large",
    "animations": true
  },
  "analysis": {
    "defaultDetailLevel": "summary|standard|comprehensive",
    "autoGenerateVisualizations": true,
    "preferredSpecialists": ["Cardiology", "Preventive Medicine"]
  },
  "notifications": {
    "emailUpdates": true,
    "analysisComplete": true,
    "healthInsights": true
  },
  "privacy": {
    "shareAnonymousUsage": false,
    "retentionPeriod": "1year|2years|forever"
  }
}
```

#### Endpoint: Update User Preferences
- **Method**: PATCH
- **Path**: /api/v1/user/preferences
- **Description**: Update user preferences
- **Request Body**: Partial preference object

### System Health

#### Endpoint: Health Check
- **Method**: GET
- **Path**: /api/v1/health
- **Description**: System health status
- **Response**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "ISO8601",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "cache": "healthy",
    "queue": "healthy",
    "specialists": {
      "available": 8,
      "healthy": 8,
      "degraded": 0
    }
  },
  "version": "1.0.0",
  "uptime": "PT148H32M"
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('wss://api.healthinsight.ai/v1/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'jwt_token'
  }));
};
```

### Message Types

#### Subscribe to Query Updates
```json
{
  "type": "subscribe",
  "channel": "query-updates",
  "queryId": "uuid"
}
```

#### Specialist Status Update
```json
{
  "type": "specialist-status",
  "data": {
    "queryId": "uuid",
    "specialist": "Cardiology",
    "status": "processing",
    "progress": 65
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query format",
    "details": {
      "field": "query",
      "reason": "Query cannot be empty"
    },
    "timestamp": "ISO8601",
    "requestId": "uuid"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: 401 - Missing or invalid auth token
- `PERMISSION_DENIED`: 403 - Insufficient permissions
- `RESOURCE_NOT_FOUND`: 404 - Requested resource doesn't exist
- `VALIDATION_ERROR`: 400 - Request validation failed
- `RATE_LIMIT_EXCEEDED`: 429 - Too many requests
- `SPECIALIST_UNAVAILABLE`: 503 - One or more specialists offline
- `ANALYSIS_TIMEOUT`: 504 - Analysis took too long
- `INTERNAL_ERROR`: 500 - Unexpected server error

## SDK Examples

### JavaScript/TypeScript
```typescript
import { HealthInsightClient } from '@healthinsight/sdk';

const client = new HealthInsightClient({
  apiKey: process.env.HEALTH_INSIGHT_API_KEY,
  baseUrl: 'https://api.healthinsight.ai/v1'
});

// Submit a query
const analysis = await client.analyze({
  query: "What's my cholesterol trend?",
  preferences: {
    visualizations: true,
    detailLevel: 'comprehensive'
  }
});

// Stream results
const stream = client.streamAnalysis(analysis.queryId);
stream.on('specialist-update', (data) => {
  console.log(`${data.specialist}: ${data.progress}%`);
});
stream.on('complete', (results) => {
  console.log('Analysis complete:', results);
});
```

### Python
```python
from healthinsight import Client

client = Client(
    api_key=os.environ['HEALTH_INSIGHT_API_KEY'],
    base_url='https://api.healthinsight.ai/v1'
)

# Submit analysis
analysis = client.analyze(
    query="What's my cholesterol trend?",
    preferences={
        'visualizations': True,
        'detail_level': 'comprehensive'
    }
)

# Stream results
for event in client.stream_analysis(analysis.query_id):
    if event.type == 'specialist-update':
        print(f"{event.data.specialist}: {event.data.progress}%")
    elif event.type == 'complete':
        print('Analysis complete')
```

## Rate Limiting

### Limits by Endpoint Category
- Analysis endpoints: 10 requests/minute
- Data retrieval: 100 requests/minute
- Conversation management: 50 requests/minute
- Preferences: 20 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1672531200
X-RateLimit-Retry-After: 45
```

## Pagination

Standard pagination for list endpoints:
```json
{
  "data": [...],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 40,
    "hasNext": true,
    "hasPrev": true,
    "links": {
      "first": "/api/v1/resource?limit=20&offset=0",
      "prev": "/api/v1/resource?limit=20&offset=20",
      "next": "/api/v1/resource?limit=20&offset=60",
      "last": "/api/v1/resource?limit=20&offset=140"
    }
  }
}
```

## Versioning

API versioning is handled via URL path:
- Current: `/api/v1/`
- Previous: `/api/v0/` (deprecated)
- Beta: `/api/v2-beta/`

Breaking changes will result in a new major version. Minor versions for backwards-compatible changes are tracked via headers.