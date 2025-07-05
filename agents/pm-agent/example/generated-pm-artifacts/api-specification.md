# API Specification - Multi-Agent Health Insight System

## Overview

This document defines the RESTful API and Server-Sent Events (SSE) endpoints for the Multi-Agent Health Insight System. All endpoints follow REST conventions and use JSON for request/response bodies.

## Base Configuration

```
Base URL: https://api.healthinsight.ai
API Version: v1
Content-Type: application/json
Authorization: Bearer {session_token}
```

## Thread Management Endpoints

### GET /api/threads
Retrieve all health consultation threads for the current session.

**Query Parameters:**
- `page` (integer): Page number for pagination (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search query for thread content
- `category` (string): Filter by date category (today|yesterday|week|month)

**Response:**
```json
{
  "threads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Cholesterol Analysis",
      "created_at": 1719532800000,
      "updated_at": 1719536400000,
      "message_count": 12,
      "last_message": "Your cholesterol has improved...",
      "category": "today",
      "has_visualizations": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### POST /api/threads
Create a new health consultation thread.

**Request Body:**
```json
{
  "title": "Auto-generated from first query",
  "metadata": {
    "source": "web_app",
    "session_id": "current_session"
  }
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "New Health Consultation",
  "created_at": 1719532800000,
  "messages": [],
  "results": []
}
```

### GET /api/threads/{thread_id}
Retrieve complete thread with messages and results.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Cholesterol Analysis",
  "created_at": 1719532800000,
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "What's my cholesterol trend over the last 15 years?",
      "timestamp": 1719532800000,
      "query_id": "qry_001"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "I'll analyze your cholesterol trend...",
      "timestamp": 1719532805000,
      "specialist_results": ["res_001", "res_002"]
    }
  ],
  "results": [
    {
      "query_id": "qry_001",
      "query": "What's my cholesterol trend over the last 15 years?",
      "timestamp": 1719532800000,
      "results": [
        {
          "id": "res_001",
          "specialist": "cardiology",
          "confidence": 0.92,
          "findings": "Cholesterol shows improving trend..."
        }
      ],
      "visualizations": ["viz_001", "viz_002"]
    }
  ]
}
```

### PUT /api/threads/{thread_id}
Update thread metadata (title, tags).

**Request Body:**
```json
{
  "title": "Updated Thread Title",
  "tags": ["cholesterol", "cardiology"]
}
```

### DELETE /api/threads/{thread_id}
Soft delete a thread (moves to trash).

**Response:**
```json
{
  "success": true,
  "message": "Thread moved to trash",
  "deleted_at": 1719536400000,
  "recovery_expires": 1722128400000
}
```

### POST /api/threads/{thread_id}/restore
Restore a deleted thread from trash.

**Response:**
```json
{
  "success": true,
  "message": "Thread restored successfully",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Health Analysis Endpoints

### GET /api/chat/stream
Main SSE endpoint for health query streaming.

**Query Parameters:**
- `message` (string, required): URL-encoded health query
- `thread_id` (string, required): Thread UUID for conversation
- `complexity_hint` (string): simple|standard|complex|critical

**Response:** Server-Sent Events stream
```
event: connected
data: {"status": "connected", "thread_id": "550e8400-e29b-41d4-a716-446655440000"}

event: message
data: {"type": "message", "content": "I'll analyze your cholesterol trend..."}

event: specialist_assigned
data: {
  "type": "specialist_assigned",
  "specialists": [
    {"name": "Dr. Heart", "specialty": "cardiology", "tasks": ["Analyze cholesterol trends"]},
    {"name": "Dr. Analytics", "specialty": "data_analysis", "tasks": ["Statistical analysis"]}
  ]
}

event: agent_activated
data: {"type": "agent_activated", "agent": "cardiology", "status": "thinking"}

event: agent_progress
data: {"type": "agent_progress", "agent": "cardiology", "progress": 45}

event: agent_complete
data: {
  "type": "agent_complete",
  "agent": "cardiology",
  "confidence": 0.92,
  "summary": "Cholesterol showing improvement"
}

event: result_generated
data: {
  "type": "result_generated",
  "query_id": "qry_001",
  "specialist": "cardiology",
  "findings": "Detailed findings..."
}

event: visualization_ready
data: {
  "type": "visualization_ready",
  "viz_id": "viz_001",
  "title": "15-Year Cholesterol Trend",
  "component": "const HealthVisualization = () => { ... }"
}

event: synthesis_complete
data: {
  "type": "synthesis_complete",
  "summary": "Comprehensive health analysis...",
  "recommendations": ["Continue medication", "Schedule follow-up"]
}

event: error
data: {"type": "error", "code": "SPECIALIST_TIMEOUT", "message": "Cardiology analysis timed out", "retry_available": true}

event: done
data: {"type": "done", "query_id": "qry_001", "duration_ms": 8500}
```

### POST /api/chat/message
Alternative non-streaming endpoint for health queries.

**Request Body:**
```json
{
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Analyze my blood pressure trends",
  "include_visualizations": true,
  "timeout_seconds": 30
}
```

**Response:**
```json
{
  "query_id": "qry_002",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "specialists_used": ["cardiology", "data_analysis"],
  "results": [
    {
      "specialist": "cardiology",
      "confidence": 0.88,
      "findings": "Blood pressure analysis...",
      "data_points_analyzed": 156
    }
  ],
  "synthesis": "Overall blood pressure shows...",
  "visualizations": [
    {
      "id": "viz_003",
      "type": "time_series",
      "title": "Blood Pressure Trends"
    }
  ],
  "duration_ms": 4200
}
```

## Query & Results Endpoints

### GET /api/threads/{thread_id}/queries
Get all queries for a specific thread.

**Response:**
```json
{
  "queries": [
    {
      "id": "qry_001",
      "query": "What's my cholesterol trend?",
      "timestamp": 1719532800000,
      "complexity": "standard",
      "specialist_count": 3,
      "has_visualizations": true
    }
  ]
}
```

### GET /api/threads/{thread_id}/results
Get all analysis results for a thread.

**Query Parameters:**
- `query_id` (string): Filter by specific query
- `specialist` (string): Filter by specialist type

**Response:**
```json
{
  "results": [
    {
      "id": "res_001",
      "query_id": "qry_001",
      "specialist": "cardiology",
      "timestamp": 1719532810000,
      "confidence": 0.92,
      "findings": {
        "summary": "Cholesterol improving",
        "details": "Detailed analysis...",
        "metrics_analyzed": ["Total Cholesterol", "LDL", "HDL"],
        "data_sources": ["lab_results"]
      },
      "visualizations": ["viz_001"]
    }
  ]
}
```

## Visualization Endpoints

### GET /api/visualizations/{viz_id}
Retrieve a specific visualization component.

**Response:**
```json
{
  "id": "viz_001",
  "title": "15-Year Cholesterol Trend",
  "type": "time_series",
  "query_id": "qry_001",
  "created_at": 1719532820000,
  "component_code": "const HealthVisualization = () => { /* React component */ }",
  "metadata": {
    "chart_type": "line",
    "data_points": 180,
    "metrics": ["Total Cholesterol", "LDL", "HDL"]
  }
}
```

### GET /api/threads/{thread_id}/visualizations
Get all visualizations for a thread.

**Query Parameters:**
- `type` (string): Filter by visualization type
- `query_id` (string): Filter by query

**Response:**
```json
{
  "visualizations": [
    {
      "id": "viz_001",
      "title": "Cholesterol Trends",
      "type": "time_series",
      "query_id": "qry_001",
      "thumbnail": "data:image/png;base64,..."
    }
  ]
}
```

## Export Endpoints

### POST /api/export/pdf
Generate PDF report for health consultation.

**Request Body:**
```json
{
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "query_ids": ["qry_001", "qry_002"],
  "include_visualizations": true,
  "include_raw_data": false,
  "physician_format": true
}
```

**Response:**
```json
{
  "export_id": "exp_001",
  "status": "processing",
  "estimated_time_seconds": 5
}
```

### GET /api/export/{export_id}/status
Check export generation status.

**Response:**
```json
{
  "export_id": "exp_001",
  "status": "completed",
  "download_url": "/api/export/exp_001/download",
  "expires_at": 1719540000000,
  "file_size_bytes": 1048576
}
```

### GET /api/export/{export_id}/download
Download generated export file.

**Response:** Binary PDF file with appropriate headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="HealthInsight_2024-06-28_Cholesterol-Analysis.pdf"
```

## Health Metrics Endpoints

### GET /api/health/metrics
Retrieve available health metrics for analysis.

**Response:**
```json
{
  "categories": {
    "laboratory": {
      "lipids": ["Total Cholesterol", "LDL", "HDL", "Triglycerides"],
      "diabetes": ["Glucose", "HbA1c", "Insulin"],
      "liver": ["ALT", "AST", "Bilirubin"]
    },
    "vitals": ["Blood Pressure", "Heart Rate", "Weight", "Temperature"],
    "medications": {
      "count": 15,
      "categories": ["Cardiovascular", "Diabetes", "Supplements"]
    }
  },
  "date_range": {
    "earliest": "2010-01-15",
    "latest": "2024-06-28"
  }
}
```

### GET /api/health/emergency-check
Quick endpoint to check if query contains emergency keywords.

**Request Body:**
```json
{
  "query": "I have severe chest pain and shortness of breath"
}
```

**Response:**
```json
{
  "is_emergency": true,
  "severity": "critical",
  "keywords_detected": ["severe chest pain", "shortness of breath"],
  "recommended_action": "seek_immediate_care",
  "emergency_resources": {
    "phone": "911",
    "nearest_er": "City Medical Center - 2.3 miles"
  }
}
```

## Error Responses

All endpoints use consistent error formatting:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid thread ID format",
    "details": {
      "field": "thread_id",
      "provided": "invalid-uuid"
    },
    "timestamp": 1719532800000,
    "request_id": "req_abc123"
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `SPECIALIST_TIMEOUT`: Agent failed to respond in time
- `RATE_LIMIT`: Too many requests
- `INTERNAL_ERROR`: Server error (no PHI exposed)
- `NETWORK_ERROR`: Connection issues
- `TOOL_ERROR`: Health data tool failure

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1719536400
```

- Standard users: 100 requests per hour
- Health queries: 20 per hour
- PDF exports: 10 per day

## Webhook Events (Future)

For integration with external systems:

```json
{
  "event": "analysis.completed",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "query_id": "qry_001",
  "timestamp": 1719532850000,
  "summary": {
    "specialists_used": 3,
    "findings_count": 5,
    "high_priority_findings": 1
  }
}
```

## Performance SLAs

- Simple queries: < 5 seconds
- Standard queries: < 15 seconds  
- Complex queries: < 30 seconds
- PDF export: < 10 seconds
- API response time (non-streaming): < 200ms P95

## Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## Versioning

API versions in URL path: `/api/v1/...`
Breaking changes require new version.
Deprecation notices via `X-API-Deprecation` header.