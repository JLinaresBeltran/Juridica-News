# Tool Interface Documentation: Multi-Agent Health Insight System

## Overview

The Multi-Agent Health Insight System comes with **pre-built tools** that abstract all health data storage and querying capabilities. These tools are already implemented in the `backend/tools/` directory and provide a standardized interface for AI agents to interact with health data without needing to know implementation details.

**CRITICAL**: These tools are PROVIDED and should NOT be reimplemented. Simply import and use them.

## Available Tools

### 1. Health Data Import Tool

**Tool Name**: `snowflake_import_analyze_health_records_v2`

**Purpose**: Import health data from extracted JSON files into the data warehouse and return comprehensive statistics.

**Location**: `backend/tools/import_tool.py` (PRE-BUILT)

#### Input Parameters
```json
{
  "file_directory": "string - Directory path containing extracted JSON health data files"
}
```

#### Expected File Formats
The tool expects these standardized JSON files in the directory:
- `lab_results_*.json` - Laboratory test results
- `medications_*.json` - Medication history and prescriptions  
- `vitals_*.json` - Vital signs (blood pressure, heart rate, etc.)
- `clinical_data_consolidated.json` - Consolidated clinical information

#### Return Value Structure
```json
{
  "success": true,
  "message": "Successfully imported health data",
  "import_id": "imp_20240115_abc123",
  "total_records": 1234,
  "records_by_category": {
    "lab_results": 450,
    "medications": 234,
    "vitals": 550
  },
  "date_range": {
    "start": "2013-01-15",
    "end": "2025-06-30"
  },
  "data_quality": {
    "completeness": 95.2,
    "records_with_dates": 98.5,
    "valid_reference_ranges": 89.1
  },
  "key_insights": [
    "12 years of comprehensive health data available",
    "Regular monitoring patterns detected (quarterly labs)",
    "Complete medication history with good adherence data"
  ],
  "warnings": [
    "3 lab results missing reference ranges",
    "Some vital signs lack time of day"
  ]
}
```

#### Error Handling
```json
{
  "success": false,
  "error": "DIRECTORY_NOT_FOUND",
  "message": "The specified directory does not exist",
  "details": {
    "directory": "/path/to/files",
    "suggestion": "Verify the directory path and permissions"
  }
}
```

### 2. Health Query Executor Tool

**Tool Name**: `execute_health_query_v2`

**Purpose**: Execute natural language queries about health data using Snowflake Cortex's advanced NLP capabilities.

**Location**: `backend/tools/health_query_tool.py` (PRE-BUILT)

#### Input Parameters
```json
{
  "query": "string - Natural language query about health data"
}
```

#### Query Examples and Expected Results

##### Simple Queries
```json
// Input
{"query": "What's my latest cholesterol?"}

// Output
{
  "query": "What's my latest cholesterol?",
  "query_successful": true,
  "result": {
    "data": [
      {
        "date": "2024-06-15",
        "test_name": "Total Cholesterol",
        "value": 185,
        "unit": "mg/dL",
        "reference_range": "< 200",
        "status": "Normal"
      },
      {
        "date": "2024-06-15",
        "test_name": "LDL Cholesterol",
        "value": 115,
        "unit": "mg/dL",
        "reference_range": "< 100",
        "status": "Borderline High"
      }
    ],
    "summary": "Your most recent cholesterol test from June 15, 2024 shows total cholesterol at 185 mg/dL (normal) and LDL at 115 mg/dL (borderline high)",
    "visualization_hints": {
      "chart_type": "bar",
      "x_axis": "test_name",
      "y_axis": "value",
      "title": "Latest Cholesterol Panel"
    }
  },
  "metadata": {
    "query_confidence": 0.98,
    "data_sources": ["lab_results"],
    "record_count": 2,
    "execution_time_ms": 145
  }
}
```

##### Trend Queries
```json
// Input  
{"query": "Show my cholesterol trend over the past 5 years"}

// Output
{
  "query": "Show my cholesterol trend over the past 5 years",
  "query_successful": true,
  "result": {
    "data": [
      {"date": "2020-01-15", "total": 165, "ldl": 95, "hdl": 55},
      {"date": "2020-07-20", "total": 170, "ldl": 98, "hdl": 57},
      // ... more data points
      {"date": "2024-06-15", "total": 185, "ldl": 115, "hdl": 52}
    ],
    "summary": "Your cholesterol has gradually increased over the past 5 years, with total cholesterol rising from 165 to 185 mg/dL and LDL from 95 to 115 mg/dL",
    "trend_analysis": {
      "total_change_percent": 12.1,
      "ldl_change_percent": 21.1,
      "hdl_change_percent": -5.5,
      "trend_direction": "increasing",
      "clinical_significance": "moderate"
    },
    "visualization_hints": {
      "chart_type": "line",
      "x_axis": "date",
      "y_axis": ["total", "ldl", "hdl"],
      "title": "5-Year Cholesterol Trend",
      "show_reference_lines": true
    }
  },
  "metadata": {
    "query_confidence": 0.95,
    "data_sources": ["lab_results"],
    "record_count": 20,
    "date_range_analyzed": {
      "start": "2020-01-15",
      "end": "2024-06-15"
    }
  }
}
```

##### Complex Correlation Queries
```json
// Input
{"query": "How do my cholesterol levels correlate with my statin medication?"}

// Output
{
  "query": "How do my cholesterol levels correlate with my statin medication?",
  "query_successful": true,
  "result": {
    "data": {
      "medication_periods": [
        {
          "medication": "Atorvastatin 20mg",
          "start_date": "2022-03-15",
          "end_date": "2023-06-30",
          "avg_cholesterol_during": 175,
          "avg_ldl_during": 105
        },
        {
          "medication": "Rosuvastatin 10mg",
          "start_date": "2023-07-01",
          "end_date": null,
          "avg_cholesterol_during": 180,
          "avg_ldl_during": 110
        }
      ],
      "pre_medication_baseline": {
        "avg_cholesterol": 195,
        "avg_ldl": 125
      },
      "correlation_metrics": {
        "cholesterol_reduction_percent": -10.3,
        "ldl_reduction_percent": -16.0,
        "time_to_effect_days": 45
      }
    },
    "summary": "Your statin medications have correlated with a 10.3% reduction in total cholesterol and 16% reduction in LDL",
    "visualization_hints": {
      "chart_type": "timeline",
      "overlay_data": ["cholesterol_values", "medication_periods"],
      "highlight_changes": true
    }
  },
  "metadata": {
    "query_confidence": 0.92,
    "data_sources": ["lab_results", "medications"],
    "correlation_method": "temporal_analysis",
    "statistical_significance": 0.89
  }
}
```

#### Query Capabilities

The tool understands various query patterns:

1. **Point-in-time queries**: "What's my current...", "Latest...", "Most recent..."
2. **Trend queries**: "Show trend...", "How has X changed...", "X over time"
3. **Comparison queries**: "Compare X to Y", "X versus reference range"
4. **Correlation queries**: "How does X affect Y", "Relationship between..."
5. **Aggregation queries**: "Average X", "Highest/Lowest X", "X statistics"
6. **Risk assessment**: "Am I at risk for...", "Evaluate my X risk"

## Tool Registry Interface

The `ToolRegistry` class provides a unified interface for tool management:

**Location**: `backend/tools/tool_registry.py` (PRE-BUILT)

### Class Interface
```python
class ToolRegistry:
    def __init__(self):
        """Initialize with all available tools"""
        
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Returns tool definitions in Anthropic's expected format
        for use with the Claude API
        """
        
    async def execute_tool(
        self, 
        tool_name: str, 
        tool_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a tool by name with given input
        Returns the tool's response
        """
        
    def get_tool_description(self, tool_name: str) -> str:
        """
        Returns human-readable description for a specific tool
        """
        
    def list_available_tools(self) -> List[str]:
        """
        Returns list of all available tool names
        """
```

### Usage Example
```python
# DO NOT REIMPLEMENT - Just import and use!
from tools.tool_registry import ToolRegistry

# Initialize registry (happens once in service)
tool_registry = ToolRegistry()

# Get tool definitions for Claude API
tools = tool_registry.get_tool_definitions()

# Execute a tool
result = await tool_registry.execute_tool(
    "execute_health_query_v2",
    {"query": "What's my cholesterol trend?"}
)
```

## Integration Patterns

### For CMO Agent
```python
# In cmo_agent.py
async def analyze_query_with_tools(self, query: str):
    # Use tools for initial assessment
    initial_data = await self.tool_registry.execute_tool(
        "execute_health_query_v2",
        {"query": f"Summarize available health data categories for: {query}"}
    )
    
    # Process tool results
    if initial_data["query_successful"]:
        available_data = initial_data["result"]["data"]
        # Determine complexity based on available data
```

### For Specialist Agents
```python
# In specialist_agent.py
async def execute_cardiology_analysis(self, task: SpecialistTask):
    # Query specific cardiology data
    cardiac_data = await self.tool_registry.execute_tool(
        "execute_health_query_v2",
        {
            "query": "Get all cardiovascular metrics including cholesterol, "
                    "blood pressure, heart rate, and cardiac medications"
        }
    )
    
    # Analyze the results
    if cardiac_data["query_successful"]:
        # Process cardiac-specific insights
```

### For Visualization Agent
```python
# In visualization_agent.py
async def prepare_visualization_data(self, query: str, synthesis: str):
    # Get data optimized for visualization
    viz_data = await self.tool_registry.execute_tool(
        "execute_health_query_v2",
        {
            "query": f"Get time-series data for visualization: {query}"
        }
    )
    
    # Use visualization_hints to generate appropriate chart
    if viz_data["query_successful"]:
        hints = viz_data["result"]["visualization_hints"]
        # Generate React component based on hints
```

## Best Practices

### 1. Query Construction
- **Be Specific**: More specific queries return better results
  ```python
  # ❌ Too vague
  {"query": "Show me my data"}
  
  # ✅ Specific
  {"query": "Show my cholesterol levels from the past 6 months"}
  ```

### 2. Time Period Specification
- Include explicit time periods for trends
  ```python
  {"query": "Blood pressure trend over the past year"}
  {"query": "Medications taken between January and June 2024"}
  {"query": "Lab results from the last 3 months"}
  ```

### 3. Medical Terminology
- Use standard medical terms for best results
  - Cholesterol: "Total", "LDL", "HDL", "Triglycerides"
  - Blood Pressure: "Systolic", "Diastolic"
  - Diabetes: "HbA1c", "Glucose", "Fasting glucose"
  - Kidney: "Creatinine", "eGFR", "BUN"

### 4. Error Handling
```python
# Always check success status
result = await tool_registry.execute_tool("execute_health_query_v2", input)

if result.get("query_successful", False):
    # Process successful result
    data = result["result"]["data"]
else:
    # Handle error gracefully
    error_msg = result.get("error", "Unknown error")
    # Fallback behavior
```

### 5. Performance Optimization
- Cache frequently used reference queries
- Batch related queries when possible
- Use query confidence scores to determine if refinement needed

## Data Schema Reference

### Lab Results Schema
```json
{
  "test_name": "string",
  "value": "number|string",
  "unit": "string",
  "reference_range": "string|object",
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS",
  "provider": "string",
  "lab_name": "string",
  "status": "normal|high|low|critical"
}
```

### Medication Schema
```json
{
  "name": "string",
  "generic_name": "string",
  "dosage": "string",
  "frequency": "string",
  "route": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD|null",
  "prescriber": "string",
  "indication": "string",
  "adherence_data": {}
}
```

### Vital Signs Schema
```json
{
  "type": "blood_pressure|heart_rate|temperature|weight|bmi",
  "value": "number",
  "systolic": "number",  // for BP
  "diastolic": "number", // for BP
  "unit": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS"
}
```

## Security & Privacy

- All data operations are logged for audit trails
- Patient identifiers are handled securely within tools
- No raw PHI is exposed outside the tool interface
- Tools implement appropriate access controls
- Query logs are sanitized of sensitive information

## Extending Tool Capabilities

While these tools are pre-built, the system supports extension through:

1. **Query Pattern Library**: Add new query templates
2. **Visualization Hints**: Enhance chart recommendations  
3. **Clinical Rules**: Update reference ranges and thresholds
4. **Data Enrichment**: Add calculated metrics

**Note**: Extensions should be done through configuration, not by modifying tool code.

## Common Integration Mistakes to Avoid

### ❌ DON'T: Reimplement Tools
```python
# WRONG - Don't create your own data access
class MyHealthDataAccess:
    def query_snowflake(self, sql):
        # Don't do this!
```

### ❌ DON'T: Access Data Directly
```python
# WRONG - Don't bypass tools
import snowflake.connector
conn = snowflake.connector.connect(...)
```

### ❌ DON'T: Modify Tool Files
```python
# WRONG - Don't edit tool implementations
# tools/health_query_tool.py should never be modified
```

### ✅ DO: Use Tools As Provided
```python
# CORRECT - Import and use
from tools.tool_registry import ToolRegistry
tools = ToolRegistry()
result = await tools.execute_tool(...)
```

## Troubleshooting

### Common Issues

1. **Tool Not Found**
   - Ensure correct tool name (case-sensitive)
   - Verify tools directory is in Python path

2. **Query Returns No Data**
   - Check query specificity
   - Verify data exists for time period
   - Review query confidence score

3. **Slow Query Performance**
   - Complex queries may take 1-5 seconds
   - Consider breaking into simpler queries
   - Check for overly broad time ranges

4. **Unexpected Results**
   - Review visualization_hints for context
   - Check metadata for data sources used
   - Verify query understood correctly

## Summary

Remember these key points:
1. Tools are **PRE-BUILT** - just import and use them
2. Two main tools: import and query execution
3. Natural language queries are powerful - be specific
4. Always check success status before using results
5. Use visualization hints for chart generation
6. Never bypass tools or access data directly

These tools abstract all the complexity of health data management, allowing agents to focus on providing intelligent analysis and insights.