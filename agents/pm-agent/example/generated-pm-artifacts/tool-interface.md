# Tool Interface Documentation - Multi-Agent Health Insight System

## Overview

The Multi-Agent Health Insight System leverages pre-built Snowflake Cortex tools for all health data access. These tools are provided in the `backend/tools/` directory and should be used directly by all agents. This document explains how to integrate and use these tools effectively.

## ⚠️ CRITICAL: Tools are PRE-BUILT

**DO NOT REIMPLEMENT THESE TOOLS**. They are already implemented and tested. Simply import and use them:

```python
from tools.tool_registry import ToolRegistry
from tools.health_query_tool import execute_health_query_v2
from tools.health_import_tool import snowflake_import_analyze_health_records_v2
```

## Available Health Tools

### 1. Health Query Executor Tool

**Tool Name**: `execute_health_query_v2`

**Purpose**: Execute natural language queries about health data using Snowflake Cortex's advanced NLP capabilities.

**Function Signature**:
```python
async def execute_health_query_v2(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute health data queries using natural language.
    
    Args:
        params: Dictionary with 'query' key containing natural language question
        
    Returns:
        Dictionary with query results, metadata, and visualization hints
    """
```

**Input Schema**:
```json
{
  "query": "string - Natural language health question",
  "time_range": "optional - Specific time period (e.g., 'last 6 months')",
  "data_types": "optional - Specific health metrics to focus on"
}
```

**Example Queries**:
```python
# Simple metric lookup
result = await execute_health_query_v2({
    "query": "What's my latest blood pressure?"
})

# Trend analysis
result = await execute_health_query_v2({
    "query": "Show my cholesterol trend over the past 5 years"
})

# Complex correlation
result = await execute_health_query_v2({
    "query": "How does my HbA1c correlate with medication adherence?",
    "time_range": "2020-2024"
})

# Comparative analysis
result = await execute_health_query_v2({
    "query": "Compare my liver enzymes before and after starting medication"
})
```

**Return Value Structure**:
```json
{
  "query": "original query text",
  "query_successful": true,
  "result": {
    "data": [
      {
        "date": "2024-06-15",
        "metric_name": "Systolic Blood Pressure", 
        "value": 128,
        "unit": "mmHg",
        "reference_range": {
          "min": 90,
          "max": 120,
          "optimal_max": 115
        },
        "status": "borderline",
        "data_source": "vitals"
      }
    ],
    "summary": "Your blood pressure is slightly elevated at 128/82",
    "statistics": {
      "mean": 125,
      "trend": "stable",
      "data_points": 45
    },
    "visualization_hints": {
      "chart_type": "gauge",
      "current_value": 128,
      "ranges": {
        "normal": [90, 120],
        "borderline": [120, 140],
        "high": [140, 180]
      }
    }
  },
  "metadata": {
    "query_confidence": 0.95,
    "data_sources": ["vitals", "clinical_notes"],
    "record_count": 45,
    "time_range": {
      "start": "2024-01-01",
      "end": "2024-06-28"
    },
    "execution_time_ms": 145
  }
}
```

### 2. Health Records Import Tool

**Tool Name**: `snowflake_import_analyze_health_records_v2`

**Purpose**: Import and analyze comprehensive health records from various formats into Snowflake, with automatic data quality assessment.

**Function Signature**:
```python
async def snowflake_import_analyze_health_records_v2(
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Import health records and perform initial analysis.
    
    Args:
        params: Dictionary with file_directory path
        
    Returns:
        Import statistics and initial insights
    """
```

**Input Schema**:
```json
{
  "file_directory": "string - Path to directory containing health data files",
  "analysis_depth": "optional - 'basic' or 'comprehensive' (default: 'comprehensive')",
  "patient_id": "optional - Patient identifier for data association"
}
```

**Expected File Formats**:
The tool automatically detects and processes these file patterns:
- `lab_results_*.json` - Laboratory test results
- `medications_*.json` - Medication history  
- `vitals_*.json` - Vital signs measurements
- `clinical_notes_*.json` - Clinical documentation
- `immunizations_*.json` - Vaccination records
- `allergies_*.json` - Allergy information
- `procedures_*.json` - Medical procedures
- `clinical_data_consolidated.json` - Unified health records

**Return Value Structure**:
```json
{
  "success": true,
  "message": "Successfully imported and analyzed health data",
  "import_id": "imp_20240628_143052",
  "import_statistics": {
    "total_records": 3456,
    "records_by_category": {
      "lab_results": 1250,
      "medications": 234,
      "vitals": 1872,
      "clinical_notes": 100
    },
    "files_processed": 8,
    "processing_time_seconds": 2.4
  },
  "data_quality": {
    "completeness_score": 94.5,
    "records_with_dates": 98.2,
    "duplicate_records_removed": 12,
    "validation_warnings": 3
  },
  "date_range": {
    "earliest_record": "2010-03-15",
    "latest_record": "2024-06-28",
    "total_days": 5218
  },
  "key_insights": [
    "14 years of comprehensive health data available",
    "Regular monitoring patterns detected (monthly labs)",
    "Complete medication history with 95% adherence data",
    "Consistent vital signs tracking since 2015"
  ],
  "health_metrics_summary": {
    "unique_lab_tests": 45,
    "unique_medications": 12,
    "vital_sign_types": ["blood_pressure", "heart_rate", "weight", "temperature"],
    "chronic_conditions_detected": ["hypertension", "type_2_diabetes"]
  }
}
```

## Tool Registry Interface

The `ToolRegistry` class provides centralized tool management:

```python
class ToolRegistry:
    """Manages all available health data tools."""
    
    def __init__(self):
        """Initialize with all pre-built tools."""
        
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Get tool definitions in Anthropic's format.
        
        Returns:
            List of tool definitions for Claude API
        """
        
    async def execute_tool(
        self, 
        tool_name: str, 
        tool_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a tool by name.
        
        Args:
            tool_name: Name of tool to execute
            tool_input: Input parameters for tool
            
        Returns:
            Tool execution results
        """
        
    def get_tool_description(self, tool_name: str) -> str:
        """Get detailed description for a specific tool."""
```

## Integration Patterns

### For the CMO Agent

```python
class CMOAgent:
    def __init__(self, anthropic_client, tool_registry, model):
        self.client = anthropic_client
        self.tools = tool_registry
        self.model = model
    
    async def analyze_query_with_tools(self, query: str):
        # Initial assessment using health query tool
        initial_data = await self.tools.execute_tool(
            "execute_health_query_v2",
            {"query": f"Summarize available health data relevant to: {query}"}
        )
        
        # Use Claude with tools for deeper analysis
        response = await self.client.messages.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this health query: {query}\n"
                              f"Initial data: {json.dumps(initial_data)}"
                }
            ],
            tools=self.tools.get_tool_definitions(),
            max_tokens=4000
        )
        
        # Process tool calls if any
        return self._process_response(response)
```

### For Specialist Agents

```python
class SpecialistAgent:
    def __init__(self, anthropic_client, tool_registry, model):
        self.client = anthropic_client
        self.tools = tool_registry
        self.model = model
    
    async def execute_task_with_tools(self, task: SpecialistTask):
        # Specialty-specific prompts guide tool usage
        system_prompt = self._get_specialist_system_prompt(task.specialist)
        
        # Execute with tools available
        response = await self.client.messages.create(
            model=self.model,
            system=system_prompt,
            messages=[
                {
                    "role": "user", 
                    "content": task.description
                }
            ],
            tools=self.tools.get_tool_definitions(),
            max_tokens=4000
        )
        
        return self._extract_findings(response)
```

### Direct Tool Usage

For simple data retrieval without AI interpretation:

```python
# Direct import and usage
from tools.health_query_tool import execute_health_query_v2

async def get_latest_labs():
    result = await execute_health_query_v2({
        "query": "Get all lab results from the past month"
    })
    return result["result"]["data"]
```

## Query Best Practices

### 1. Be Specific with Queries
```python
# ❌ Too vague
"Show me my data"

# ✅ Specific and actionable  
"Show my cholesterol and triglyceride levels from the past 2 years"
```

### 2. Include Time Ranges
```python
# ❌ No time context
"What's my blood pressure?"

# ✅ Clear time range
"What's my average blood pressure over the past 3 months?"
```

### 3. Use Medical Terminology
```python
# ❌ Informal terms
"Show my blood sugar"

# ✅ Precise medical terms
"Show my fasting glucose and HbA1c levels"
```

### 4. Specify Comparisons
```python
# ✅ Clear comparison request
"Compare my lipid panel results before and after starting statins in March 2023"
```

## Error Handling

Tools implement robust error handling:

```python
try:
    result = await execute_health_query_v2({"query": query})
    if not result.get("query_successful"):
        # Handle query failure
        logger.error(f"Query failed: {result.get('error')}")
        return fallback_response
except Exception as e:
    # Handle tool execution errors
    logger.error(f"Tool execution failed: {str(e)}")
    return error_response
```

**Common Error Scenarios**:
- No data available for requested time range
- Ambiguous query requiring clarification
- Data quality issues (missing required fields)
- Tool timeout (default 30 seconds)

## Data Schema Handled by Tools

### Lab Results
```json
{
  "test_name": "Total Cholesterol",
  "value": 185,
  "unit": "mg/dL", 
  "reference_range": {
    "min": 0,
    "max": 200
  },
  "collection_date": "2024-06-15",
  "status": "normal",
  "lab_name": "Quest Diagnostics"
}
```

### Medications
```json
{
  "drug_name": "Metformin",
  "generic_name": "metformin hydrochloride",
  "dosage": "500mg",
  "frequency": "twice daily",
  "start_date": "2023-01-15",
  "prescriber": "Dr. Smith",
  "indication": "Type 2 Diabetes",
  "adherence_percentage": 92
}
```

### Vitals
```json
{
  "vital_type": "blood_pressure",
  "systolic": 128,
  "diastolic": 82,
  "unit": "mmHg",
  "measurement_date": "2024-06-28",
  "measurement_time": "08:30",
  "position": "sitting"
}
```

## Performance Optimization

### Query Caching
Tools implement intelligent caching:
- Identical queries within 5 minutes return cached results
- Cache invalidates on new data import
- Complex queries may bypass cache

### Batch Operations
```python
# Process multiple queries efficiently
queries = [
    "Latest cholesterol",
    "Latest blood pressure",
    "Latest HbA1c"
]

results = await asyncio.gather(*[
    execute_health_query_v2({"query": q}) for q in queries
])
```

## Security & Privacy

### Data Protection
- Tools never log PHI
- All queries are sanitized
- Results are filtered based on session context
- No data persistence outside Snowflake

### Audit Trail
```python
# Tools automatically log access patterns
{
    "tool": "execute_health_query_v2",
    "timestamp": "2024-06-28T14:30:00Z",
    "session_id": "sess_abc123",
    "query_type": "lab_results",
    "success": true,
    "execution_time_ms": 145
}
```

## Testing Tools

### Development Mode
```python
# Tools support test mode with synthetic data
os.environ["HEALTH_TOOLS_TEST_MODE"] = "true"

# Returns consistent test data
result = await execute_health_query_v2({
    "query": "test cholesterol data"
})
```

### Tool Monitoring
```python
# Get tool performance metrics
metrics = tool_registry.get_metrics()
print(f"Average query time: {metrics['avg_execution_time_ms']}ms")
print(f"Success rate: {metrics['success_rate']}%")
```

## Migration and Updates

Tools handle schema evolution automatically:
- New health data fields are detected
- Backward compatibility maintained
- Version info in tool responses

## DO NOT Create These

**Never implement**:
- Database connections
- SQL query builders  
- Data parsing logic
- Snowflake authentication
- Schema definitions
- Migration scripts

All data complexity is abstracted by the tools. Focus on using them effectively to serve health insights.