# Tool Interface Documentation: Multi-Agent Health Insight System

## Overview

The Multi-Agent Health Insight System leverages pre-built tools that abstract all health data storage and querying capabilities. These tools provide a standardized interface for AI agents to interact with health data without requiring knowledge of the underlying database structure or query languages. All agents access data exclusively through these tool interfaces, ensuring consistency, security, and maintainability.

## Core Design Principles

### 1. Natural Language First
Agents interact with tools using natural language queries rather than structured query languages. The underlying Snowflake Cortex Analyst translates these queries into optimized SQL.

### 2. Tool Abstraction
No agent has direct database access. All data operations go through the tool layer, which handles:
- Query optimization
- Result caching
- Access control
- Audit logging
- Error handling

### 3. Consistent Interface
All tools follow Anthropic's tool-calling specification, ensuring compatibility with Claude agents and enabling seamless integration.

## Available Tools

### 1. Health Data Import Tool

**Tool Name**: `snowflake_import_analyze_health_records_v2`

**Purpose**: Import health data from extracted JSON files into the data warehouse and return comprehensive statistics about the imported data.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "file_directory": {
      "type": "string",
      "description": "Directory path containing extracted JSON health data files"
    }
  },
  "required": ["file_directory"]
}
```

**Expected File Formats**:
The tool expects JSON files with specific naming patterns:
- `lab_results_*.json` - Laboratory test results
- `medications_*.json` - Medication history and prescriptions  
- `vitals_*.json` - Vital signs (blood pressure, heart rate, etc.)
- `clinical_data_consolidated.json` - Consolidated clinical information

**File Structure Examples**:

Lab Results File:
```json
{
  "lab_results": [
    {
      "test_name": "Total Cholesterol",
      "value": 185,
      "unit": "mg/dL",
      "collection_date": "2024-06-15",
      "reference_range": {
        "min": 0,
        "max": 200
      },
      "status": "Normal",
      "provider": "Dr. Smith",
      "facility": "City Medical Lab"
    }
  ]
}
```

Medications File:
```json
{
  "medications": [
    {
      "name": "Atorvastatin",
      "generic_name": "Atorvastatin",
      "dosage": "20mg",
      "frequency": "Once daily",
      "start_date": "2023-01-15",
      "end_date": null,
      "prescriber": "Dr. Johnson",
      "indication": "High cholesterol",
      "adherence_data": [
        {
          "date": "2024-06-01",
          "taken": true
        }
      ]
    }
  ]
}
```

**Return Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether import was successful"
    },
    "message": {
      "type": "string",
      "description": "Human-readable status message"
    },
    "import_id": {
      "type": "string",
      "description": "Unique identifier for this import session"
    },
    "total_records": {
      "type": "integer",
      "description": "Total number of records imported"
    },
    "records_by_category": {
      "type": "object",
      "properties": {
        "lab_results": {"type": "integer"},
        "medications": {"type": "integer"},
        "vitals": {"type": "integer"}
      }
    },
    "date_range": {
      "type": "object",
      "properties": {
        "start": {"type": "string", "format": "date"},
        "end": {"type": "string", "format": "date"}
      }
    },
    "data_quality": {
      "type": "object",
      "properties": {
        "completeness": {"type": "number", "minimum": 0, "maximum": 100},
        "records_with_dates": {"type": "number"}
      }
    },
    "key_insights": {
      "type": "array",
      "items": {"type": "string"}
    }
  }
}
```

**Usage Example**:
```python
# CMO Agent importing health data
result = await tool_registry.execute_tool(
    "snowflake_import_analyze_health_records_v2",
    {
        "file_directory": "/data/user_123/health_records/"
    }
)

if result["success"]:
    print(f"Imported {result['total_records']} records")
    print(f"Date range: {result['date_range']['start']} to {result['date_range']['end']}")
```

### 2. Health Query Executor Tool

**Tool Name**: `execute_health_query_v2`

**Purpose**: Execute natural language queries about health data using Snowflake Cortex Analyst's advanced NLP capabilities.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Natural language query about health data",
      "minLength": 5,
      "maxLength": 500
    }
  },
  "required": ["query"]
}
```

**Query Categories and Examples**:

**Simple Queries** (Single data point retrieval):
- "What's my latest cholesterol level?"
- "Show my current medications"
- "What was my blood pressure yesterday?"
- "How much do I weigh?"

**Trend Queries** (Time-based analysis):
- "How has my cholesterol changed over the past year?"
- "Show my blood pressure trend for the last 6 months"
- "What's my weight trajectory since January?"
- "Display my HbA1c progression over time"

**Comparison Queries** (Multiple metrics):
- "Compare my cholesterol levels before and after starting statins"
- "Show my blood pressure readings morning vs evening"
- "How do my current labs compare to last year?"

**Complex Analytical Queries** (Multi-domain):
- "Analyze the correlation between my medication adherence and cholesterol levels"
- "What health metrics changed after I started exercising?"
- "Show all abnormal lab results with their trends"
- "How do my vitals correlate with my medication schedule?"

**Return Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The original query text"
    },
    "query_successful": {
      "type": "boolean",
      "description": "Whether the query executed successfully"
    },
    "result": {
      "type": "object",
      "properties": {
        "data": {
          "type": "array",
          "description": "Array of data records matching the query",
          "items": {
            "type": "object",
            "additionalProperties": true
          }
        },
        "summary": {
          "type": "string",
          "description": "Natural language summary of the results"
        },
        "visualization_hints": {
          "type": "object",
          "properties": {
            "chart_type": {
              "type": "string",
              "enum": ["line", "bar", "scatter", "heatmap", "gauge"]
            },
            "x_axis": {"type": "string"},
            "y_axis": {"type": "string"},
            "title": {"type": "string"},
            "series": {
              "type": "array",
              "items": {"type": "string"}
            }
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "query_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "data_sources": {
          "type": "array",
          "items": {"type": "string"}
        },
        "record_count": {"type": "integer"},
        "execution_time_ms": {"type": "integer"}
      }
    },
    "error": {
      "type": "object",
      "properties": {
        "code": {"type": "string"},
        "message": {"type": "string"}
      }
    }
  }
}
```

**Advanced Query Patterns**:

```python
# Cardiology Specialist querying comprehensive heart health data
result = await tool_registry.execute_tool(
    "execute_health_query_v2",
    {
        "query": """
        Analyze all cardiovascular health indicators including:
        - Blood pressure trends over the past 2 years
        - Cholesterol levels (Total, LDL, HDL, Triglycerides)
        - Heart rate patterns
        - Relevant medications and their adherence
        - Any cardiovascular risk factors
        Group by time periods and highlight any concerning trends
        """
    }
)

# Data Analysis Specialist performing correlation analysis
result = await tool_registry.execute_tool(
    "execute_health_query_v2",
    {
        "query": """
        Perform statistical correlation analysis between:
        1. Medication adherence rates for cholesterol medications
        2. Actual cholesterol lab values
        3. Time periods of consistent vs inconsistent medication use
        Include p-values and correlation coefficients where applicable
        """
    }
)
```

## Tool Registry Interface

The `ToolRegistry` class provides a unified interface for tool management and execution:

```python
class ToolRegistry:
    """Central registry for all health data tools"""
    
    def __init__(self):
        self._tools = {}
        self._initialize_tools()
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Returns tool definitions in Anthropic's tool format
        
        Returns:
            List of tool definitions with schemas
        """
        return [
            {
                "name": tool_name,
                "description": tool.description,
                "input_schema": tool.input_schema
            }
            for tool_name, tool in self._tools.items()
        ]
    
    async def execute_tool(
        self, 
        tool_name: str, 
        tool_input: Dict[str, Any],
        context: Optional[ExecutionContext] = None
    ) -> Dict[str, Any]:
        """
        Execute a tool by name with given input
        
        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool
            context: Optional execution context (user, session, etc.)
            
        Returns:
            Tool execution result
            
        Raises:
            ToolNotFoundError: If tool doesn't exist
            ToolExecutionError: If tool execution fails
            ValidationError: If input doesn't match schema
        """
        if tool_name not in self._tools:
            raise ToolNotFoundError(f"Tool '{tool_name}' not found")
        
        tool = self._tools[tool_name]
        
        # Validate input against schema
        tool.validate_input(tool_input)
        
        # Add context for audit logging
        if context:
            tool_input['_context'] = context
        
        try:
            # Execute with retry logic
            result = await self._execute_with_retry(
                tool.execute, 
                tool_input
            )
            
            # Log successful execution
            await self._audit_log(tool_name, tool_input, result, success=True)
            
            return result
            
        except Exception as e:
            # Log failed execution
            await self._audit_log(tool_name, tool_input, str(e), success=False)
            raise ToolExecutionError(f"Tool execution failed: {str(e)}")
    
    def get_tool_description(self, tool_name: str) -> str:
        """Get detailed description for a specific tool"""
        if tool_name not in self._tools:
            raise ToolNotFoundError(f"Tool '{tool_name}' not found")
        
        tool = self._tools[tool_name]
        return f"""
        Tool: {tool_name}
        Description: {tool.description}
        
        Input Parameters:
        {json.dumps(tool.input_schema, indent=2)}
        
        Example Usage:
        {tool.example_usage}
        
        Best Practices:
        {tool.best_practices}
        """
```

## Integration Patterns for AI Agents

### CMO Agent Integration

The Chief Medical Officer agent uses tools for initial assessment and coordination:

```python
class CMOAgent:
    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry
    
    async def initial_assessment(self, query: str) -> Dict[str, Any]:
        """Perform initial assessment of health query"""
        
        # First, get an overview of available data
        overview_result = await self.tools.execute_tool(
            "execute_health_query_v2",
            {
                "query": """
                Provide a comprehensive summary of all available health data including:
                - Date range of records
                - Types of data available (labs, meds, vitals)
                - Key health metrics with most recent values
                - Any notable patterns or concerns
                """
            }
        )
        
        # Analyze query complexity based on initial data
        complexity = self._assess_complexity(query, overview_result)
        
        # Determine which specialists are needed
        specialists_needed = self._determine_specialists(query, overview_result)
        
        return {
            "complexity": complexity,
            "initial_findings": overview_result["result"]["summary"],
            "specialists_needed": specialists_needed,
            "data_availability": overview_result["metadata"]
        }
```

### Specialist Agent Integration

Each specialist uses domain-specific query patterns:

```python
class CardiologySpecialist:
    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry
        self.specialty = "cardiology"
    
    async def analyze(self, task: SpecialistTask) -> SpecialistResult:
        """Perform cardiology-specific analysis"""
        
        # Query 1: Get cardiovascular metrics
        cardio_metrics = await self.tools.execute_tool(
            "execute_health_query_v2",
            {
                "query": """
                Retrieve all cardiovascular-related data:
                - Blood pressure readings (systolic, diastolic) with dates
                - Heart rate measurements
                - Cholesterol panels (Total, LDL, HDL, Triglycerides)
                - Cardiovascular medications
                - Any diagnosed heart conditions
                Order by date descending
                """
            }
        )
        
        # Query 2: Analyze trends
        trend_analysis = await self.tools.execute_tool(
            "execute_health_query_v2",
            {
                "query": """
                Analyze cardiovascular trends:
                - Calculate average blood pressure by month
                - Identify any upward or downward trends
                - Find periods of abnormal readings
                - Correlate with medication changes
                """
            }
        )
        
        # Query 3: Risk assessment
        risk_assessment = await self.tools.execute_tool(
            "execute_health_query_v2",
            {
                "query": """
                Calculate cardiovascular risk factors:
                - 10-year heart disease risk score if applicable
                - Identify modifiable risk factors
                - Compare current metrics to target goals
                """
            }
        )
        
        # Synthesize findings
        findings = self._synthesize_findings(
            cardio_metrics, 
            trend_analysis, 
            risk_assessment
        )
        
        return SpecialistResult(
            specialist=self.specialty,
            findings=findings,
            confidence=self._calculate_confidence(findings),
            recommendations=self._generate_recommendations(findings)
        )
```

### Visualization Agent Integration

The visualization agent uses query results to generate appropriate charts:

```python
class VisualizationAgent:
    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry
    
    async def create_visualization(
        self, 
        query: str, 
        findings: List[Finding]
    ) -> Visualization:
        """Create appropriate visualization based on data"""
        
        # Get data specifically formatted for visualization
        viz_data = await self.tools.execute_tool(
            "execute_health_query_v2",
            {
                "query": f"""
                {query}
                Format the results for visualization with:
                - Consistent date formatting (YYYY-MM-DD)
                - Numeric values only (no units in value field)
                - Include units as separate field
                - Group by appropriate time intervals
                """
            }
        )
        
        # Use visualization hints from the query result
        hints = viz_data["result"].get("visualization_hints", {})
        
        # Generate React component based on data and hints
        component = self._generate_chart_component(
            data=viz_data["result"]["data"],
            chart_type=hints.get("chart_type", "line"),
            config={
                "title": hints.get("title", "Health Metrics"),
                "xAxis": hints.get("x_axis", "date"),
                "yAxis": hints.get("y_axis", "value"),
                "series": hints.get("series", [])
            }
        )
        
        return component
```

## Best Practices

### 1. Query Specificity

More specific queries return better results and execute faster:

```python
# ❌ Too vague
"Show me my data"

# ✅ Specific and actionable
"Show my cholesterol levels from the past 6 months with trend analysis"

# ❌ Multiple unrelated queries
"What's my cholesterol and blood pressure and weight and medications?"

# ✅ Focused query with related metrics
"Analyze my cardiovascular health including blood pressure, cholesterol, and related medications"
```

### 2. Date Range Handling

Always include specific time periods for trend analysis:

```python
# Relative date ranges (preferred)
"... over the past year"
"... in the last 6 months"
"... since January 2024"

# Date comparisons
"... before and after starting medication"
"... compare Q1 2024 to Q4 2023"

# Specific periods
"... between March and June 2024"
"... from 2020 to present"
```

### 3. Metric Standardization

Use consistent medical terminology:

```python
# Cholesterol
- "Total Cholesterol" (not "total chol" or "TC")
- "LDL Cholesterol" or "LDL-C"
- "HDL Cholesterol" or "HDL-C"
- "Triglycerides" (not "trigs")

# Blood Pressure
- "Systolic Blood Pressure" or "systolic"
- "Diastolic Blood Pressure" or "diastolic"

# Diabetes Markers
- "HbA1c" or "Hemoglobin A1c" (not "A1c" alone)
- "Fasting Glucose" (specify fasting)
```

### 4. Error Handling

Always check success flags and handle errors gracefully:

```python
async def safe_query_execution(query: str) -> Optional[Dict]:
    try:
        result = await tool_registry.execute_tool(
            "execute_health_query_v2",
            {"query": query}
        )
        
        if not result.get("query_successful", False):
            # Handle query failure
            error = result.get("error", {})
            logger.warning(f"Query failed: {error.get('message', 'Unknown error')}")
            
            # Try simplified query
            simplified_query = simplify_query(query)
            result = await tool_registry.execute_tool(
                "execute_health_query_v2",
                {"query": simplified_query}
            )
        
        return result
        
    except ToolExecutionError as e:
        logger.error(f"Tool execution error: {e}")
        return None
```

### 5. Result Validation

Validate data quality before using results:

```python
def validate_query_result(result: Dict) -> bool:
    """Validate query result quality"""
    
    # Check if we have data
    if not result.get("result", {}).get("data"):
        return False
    
    # Check confidence score
    confidence = result.get("metadata", {}).get("query_confidence", 0)
    if confidence < 0.7:
        logger.warning(f"Low query confidence: {confidence}")
    
    # Check data completeness
    record_count = result.get("metadata", {}).get("record_count", 0)
    if record_count == 0:
        return False
    
    # Validate data types
    data = result["result"]["data"]
    for record in data:
        if not validate_record_schema(record):
            return False
    
    return True
```

## Performance Optimization

### 1. Query Caching

The tool layer implements intelligent caching:

```python
# Cache configuration
CACHE_CONFIG = {
    "simple_queries": {
        "ttl": 3600,  # 1 hour
        "max_size": 1000
    },
    "trend_queries": {
        "ttl": 900,   # 15 minutes
        "max_size": 500
    },
    "complex_queries": {
        "ttl": 300,   # 5 minutes
        "max_size": 100
    }
}
```

### 2. Batch Queries

When multiple related queries are needed:

```python
# Instead of multiple separate queries
results = []
for test in ["cholesterol", "glucose", "hba1c"]:
    result = await tool_registry.execute_tool(
        "execute_health_query_v2",
        {"query": f"What's my latest {test}?"}
    )
    results.append(result)

# Use a single comprehensive query
result = await tool_registry.execute_tool(
    "execute_health_query_v2",
    {
        "query": """
        Show my latest metabolic panel including:
        - Cholesterol (Total, LDL, HDL)
        - Glucose
        - HbA1c
        With dates and reference ranges
        """
    }
)
```

### 3. Progressive Loading

For complex analyses, use progressive queries:

```python
async def progressive_analysis(user_query: str):
    # Step 1: Quick overview
    overview = await get_quick_overview()
    yield {"status": "initial", "data": overview}
    
    # Step 2: Detailed analysis
    if needs_detailed_analysis(overview):
        detailed = await get_detailed_analysis()
        yield {"status": "detailed", "data": detailed}
    
    # Step 3: Correlations (if needed)
    if needs_correlation_analysis(user_query, detailed):
        correlations = await get_correlations()
        yield {"status": "complete", "data": correlations}
```

## Security & Privacy

### Data Access Control

Tools implement row-level security:

```python
# All queries automatically filtered by user context
{
    "query": "Show all lab results",
    "_context": {
        "user_id": "user_123",
        "session_id": "session_456",
        "ip_address": "192.168.1.1"
    }
}
# Returns only lab results for user_123
```

### Audit Logging

All tool executions are logged:

```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "tool": "execute_health_query_v2",
    "user_id": "user_123",
    "query_hash": "a3f5...",  // Query hashed for privacy
    "success": true,
    "execution_time_ms": 245,
    "records_accessed": 42,
    "data_categories": ["lab_results", "medications"]
}
```

## Extensibility

### Adding New Tools

New tools can be registered following the interface:

```python
class CustomHealthTool:
    def __init__(self):
        self.name = "custom_health_analysis"
        self.description = "Perform custom health analysis"
        self.input_schema = {
            "type": "object",
            "properties": {
                "analysis_type": {"type": "string"},
                "parameters": {"type": "object"}
            }
        }
    
    async def execute(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        # Implementation
        pass

# Register the tool
tool_registry.register_tool(CustomHealthTool())
```

### Tool Composition

Complex tools can compose simpler tools:

```python
class CompositeAnalysisTool:
    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry
    
    async def execute(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        # Use multiple tools in sequence
        health_data = await self.tools.execute_tool(
            "execute_health_query_v2",
            {"query": tool_input["data_query"]}
        )
        
        # Process and analyze
        analysis = self.analyze_data(health_data)
        
        # Generate visualization
        viz = await self.tools.execute_tool(
            "generate_visualization",
            {"data": analysis, "type": tool_input["viz_type"]}
        )
        
        return {
            "analysis": analysis,
            "visualization": viz
        }
```

## Testing & Validation

### Tool Testing Framework

```python
class ToolTestCase:
    async def test_health_query_tool(self):
        # Test successful query
        result = await tool_registry.execute_tool(
            "execute_health_query_v2",
            {"query": "Show my latest cholesterol"}
        )
        
        assert result["query_successful"] == True
        assert len(result["result"]["data"]) > 0
        assert "cholesterol" in result["query"].lower()
        
        # Test invalid query
        with pytest.raises(ValidationError):
            await tool_registry.execute_tool(
                "execute_health_query_v2",
                {"query": ""}  # Empty query
            )
        
        # Test error handling
        result = await tool_registry.execute_tool(
            "execute_health_query_v2",
            {"query": "Show data for user_999"}  # Unauthorized
        )
        
        assert result["query_successful"] == False
        assert "error" in result
```

This enhanced tool interface documentation provides comprehensive guidance for integrating with the health data tools while maintaining security, performance, and extensibility.