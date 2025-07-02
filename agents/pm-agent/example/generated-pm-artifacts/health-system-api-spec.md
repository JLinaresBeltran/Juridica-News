# API Specification: Multi-Agent Health Insight System

## Overview

This document defines the RESTful API and WebSocket interfaces for the Multi-Agent Health Insight System. All endpoints follow REST conventions and return JSON responses. Real-time updates are delivered via WebSocket connections.

## Base URL

```
Production: https://api.healthinsight.ai/v1
Staging: https://staging-api.healthinsight.ai/v1
Development: http://localhost:8000/v1
```

## Authentication

All API requests require authentication via JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_12345",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query format",
    "details": {
      // Additional error context
    }
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_12345"
  }
}
```

## REST API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Health Query Endpoints

#### POST /queries
Submit a new health query for analysis.

**Request Body:**
```json
{
  "query": "What's my cholesterol trend over the last 15 years?",
  "conversation_id": "conv_789",  // Optional
  "context": {
    "include_visualizations": true,
    "priority": "normal"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query_id": "qry_456",
    "conversation_id": "conv_789",
    "status": "processing",
    "complexity": "standard",
    "estimated_completion": "2025-01-15T10:35:00Z",
    "websocket_channel": "ws://api.healthinsight.ai/ws/queries/qry_456"
  }
}
```

#### GET /queries/:query_id
Get the current status and results of a query.

**Response:**
```json
{
  "success": true,
  "data": {
    "query_id": "qry_456",
    "query": "What's my cholesterol trend over the last 15 years?",
    "status": "completed",
    "complexity": "standard",
    "started_at": "2025-01-15T10:30:00Z",
    "completed_at": "2025-01-15T10:32:45Z",
    "medical_team": {
      "cmo": {
        "status": "completed",
        "confidence": 0.95
      },
      "specialists": [
        {
          "type": "cardiology",
          "name": "Dr. Heart",
          "status": "completed",
          "confidence": 0.92,
          "findings": "Cholesterol trends show improvement..."
        }
      ]
    },
    "synthesis": {
      "summary": "Your cholesterol has improved significantly...",
      "key_findings": [
        {
          "metric": "Total Cholesterol",
          "trend": "decreasing",
          "current_value": 185,
          "change_percentage": -15
        }
      ],
      "recommendations": [
        "Continue current medication regimen",
        "Maintain dietary modifications"
      ]
    },
    "visualization": {
      "type": "time_series",
      "component_id": "viz_123",
      "data_points": 156
    }
  }
}
```

### Conversation Endpoints

#### GET /conversations
List all conversations for the authenticated user.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `sort_by` (string): Sort field (date, title)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_789",
        "title": "Cholesterol Analysis",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:32:45Z",
        "query_count": 3,
        "last_query": "Analyze medication adherence patterns"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### POST /conversations
Create a new conversation.

**Request Body:**
```json
{
  "title": "Heart Health Analysis",  // Optional, auto-generated if not provided
  "first_query": "What are my cardiovascular risk factors?"
}
```

#### GET /conversations/:conversation_id
Get full conversation history with all queries and responses.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_789",
    "title": "Cholesterol Analysis",
    "created_at": "2025-01-15T10:00:00Z",
    "queries": [
      {
        "query_id": "qry_456",
        "query": "What's my cholesterol trend over the last 15 years?",
        "timestamp": "2025-01-15T10:30:00Z",
        "complexity": "standard",
        "medical_team": { /* ... */ },
        "synthesis": { /* ... */ }
      }
    ]
  }
}
```

### Health Data Endpoints

#### POST /health-data/import
Import health records from files.

**Request Body (multipart/form-data):**
```
file: lab_results_2024.json
file: medications_2024.json
file: vitals_2024.json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "import_id": "imp_789",
    "status": "processing",
    "files_received": 3,
    "estimated_completion": "2025-01-15T10:35:00Z"
  }
}
```

#### GET /health-data/import/:import_id
Check import status and results.

**Response:**
```json
{
  "success": true,
  "data": {
    "import_id": "imp_789",
    "status": "completed",
    "summary": {
      "total_records": 1234,
      "records_by_type": {
        "lab_results": 450,
        "medications": 234,
        "vitals": 550
      },
      "date_range": {
        "start": "2013-01-15",
        "end": "2024-12-30"
      },
      "import_duration_seconds": 4.2
    }
  }
}
```

### Visualization Endpoints

#### GET /visualizations/:visualization_id
Get visualization data and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "viz_123",
    "type": "time_series",
    "query_id": "qry_456",
    "component": {
      "type": "LineChart",
      "props": {
        "data": [
          {
            "date": "2010-01-15",
            "total_cholesterol": 220,
            "ldl": 140,
            "hdl": 45
          }
        ],
        "config": {
          "xAxis": "date",
          "yAxis": ["total_cholesterol", "ldl", "hdl"],
          "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"]
        }
      }
    },
    "interactive_features": ["zoom", "pan", "hover", "export"]
  }
}
```

### Medical Team Endpoints

#### GET /medical-team/specialists
Get available specialists and their capabilities.

**Response:**
```json
{
  "success": true,
  "data": {
    "specialists": [
      {
        "id": "cardiology",
        "name": "Dr. Heart",
        "specialty": "Cardiology",
        "capabilities": [
          "Cardiovascular risk assessment",
          "Blood pressure analysis",
          "Cholesterol management"
        ],
        "typical_queries": [
          "heart health",
          "blood pressure",
          "cardiovascular risk"
        ]
      }
    ]
  }
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.healthinsight.ai/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJ0eXAiOiJKV1QiLCJhbGc...'
  }));
};
```

### Message Types

#### Query Status Updates
```json
{
  "type": "query_status",
  "query_id": "qry_456",
  "data": {
    "status": "processing",
    "phase": "specialist_analysis",
    "progress": 0.45
  }
}
```

#### Specialist Updates
```json
{
  "type": "specialist_update",
  "query_id": "qry_456",
  "data": {
    "specialist": "cardiology",
    "name": "Dr. Heart",
    "status": "analyzing",
    "progress": 0.75,
    "current_task": "Analyzing cholesterol trends"
  }
}
```

#### Specialist Completion
```json
{
  "type": "specialist_complete",
  "query_id": "qry_456",
  "data": {
    "specialist": "cardiology",
    "name": "Dr. Heart",
    "confidence": 0.92,
    "summary": "Analysis complete with 85% confidence",
    "findings": {
      "key_points": [
        "Cholesterol improving over time",
        "HDL levels optimal"
      ]
    }
  }
}
```

#### CMO Synthesis Update
```json
{
  "type": "cmo_synthesis",
  "query_id": "qry_456",
  "data": {
    "phase": "synthesizing",
    "specialists_complete": 3,
    "specialists_total": 3
  }
}
```

#### Query Complete
```json
{
  "type": "query_complete",
  "query_id": "qry_456",
  "data": {
    "status": "completed",
    "summary": "Analysis complete",
    "has_visualization": true,
    "redirect_url": "/queries/qry_456"
  }
}
```

### Client Commands

#### Subscribe to Query
```json
{
  "type": "subscribe",
  "query_id": "qry_456"
}
```

#### Unsubscribe from Query
```json
{
  "type": "unsubscribe",
  "query_id": "qry_456"
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication required | 401 |
| `AUTH_INVALID` | Invalid authentication token | 401 |
| `AUTH_EXPIRED` | Authentication token expired | 401 |
| `PERMISSION_DENIED` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `QUERY_COMPLEXITY_EXCEEDED` | Query too complex | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## Rate Limiting

Rate limits are applied per user:

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| Health Queries | 20 requests | 1 hour |
| Data Import | 5 requests | 1 hour |
| General API | 100 requests | 1 minute |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642255200
```

## API Versioning

The API version is included in the URL path. When breaking changes are introduced:

1. New version is deployed at `/v2`
2. Previous version remains available at `/v1`
3. Deprecation notices sent via headers:
   ```http
   X-API-Deprecation-Date: 2025-12-31
   X-API-Deprecation-Info: https://docs.healthinsight.ai/api/v2/migration
   ```

## SDK Support

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- Go
- Ruby

Example usage (TypeScript):
```typescript
import { HealthInsightClient } from '@healthinsight/sdk';

const client = new HealthInsightClient({
  apiKey: process.env.HEALTH_INSIGHT_API_KEY
});

// Submit a query
const query = await client.queries.create({
  query: "What's my cholesterol trend?",
  includeVisualizations: true
});

// Listen for updates
client.ws.subscribe(query.id, (update) => {
  console.log('Update:', update);
});
```