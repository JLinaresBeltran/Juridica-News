# Enhanced Tool Interface Documentation: Multi-Agent Health Insight System

## Overview

The Multi-Agent Health Insight System leverages pre-built tools that abstract all health data operations. These tools provide a unified interface for AI agents to interact with health data without requiring knowledge of the underlying database schema or query languages. This document extends the original tool interface documentation with implementation patterns and best practices for the multi-agent architecture.

## Core Design Principles

1. **Natural Language First**: All data queries use natural language, eliminating the need for SQL or structured queries
2. **Agent Abstraction**: Agents never interact directly with databases; all data access goes through tools
3. **Semantic Understanding**: Tools leverage Snowflake Cortex for intelligent query interpretation
4. **Type Safety**: All tool inputs and outputs follow strict schemas for reliability
5. **Error Resilience**: Tools handle edge cases gracefully and provide meaningful error messages

## Available Tools

### 1. Health Data Import Tool

**Tool Name**: `snowflake_import_analyze_health_records_v2`

**Purpose**: Import health data from extracted JSON files into the data warehouse and return comprehensive statistics.

**Enhanced Usage Pattern for Agents**:
```python
class HealthDataImporter:
    async def import_health_records(self, file_directory: str) -> ImportResult:
        """CMO uses this during initial system setup or data refresh"""
        try:
            result = await self.tool_registry.execute_tool(
                "snowflake_import_analyze_health_records_v2",
                {"file_directory": file_directory}
            )
            
            # Validate import success
            if result.get("success") and result.get("data_quality", {}).get("completeness", 0) > 90:
                return ImportResult(
                    success=True,
                    total_records=result["total_records"],
                    key_insights=result["key_insights"]
                )
            else:
                # Handle partial imports
                self.handle_incomplete_import(result)
                
        except ToolExecutionError as e:
            self.logger.error(f"Import failed: {e}")
            raise
```

**Advanced Input Patterns**:
```json
{
  "file_directory": "/imports/user_123/2025-01-15/",
  "options": {
    "validate_only": false,          // Preview without importing
    "update_strategy": "merge",      // merge|replace|append
    "date_format": "ISO8601",        // Handle different date formats
    "timezone": "America/Chicago"    // User's timezone for conversion
  }
}
```

### 2. Health Query Executor Tool

**Tool Name**: `execute_health_query_v2`

**Purpose**: Execute natural language queries about health data using advanced NLP capabilities.

**Query Patterns by Agent Type**:

#### CMO Agent Queries
```python
# Initial assessment query
initial_assessment = await tool.execute({
    "query": "Provide a comprehensive summary of all available health data including date ranges, data types, and completeness"
})

# Complexity assessment query
complexity_check = await tool.execute({
    "query": f"Analyze the medical complexity of this question: '{user_query}'. Consider required specialties, data availability, and analysis depth needed."
})
```

#### Cardiology Specialist Queries
```python
# Comprehensive cardiovascular assessment
cardio_data = await tool.execute({
    "query": """
    Retrieve all cardiovascular health indicators including:
    - Blood pressure readings (systolic/diastolic) with timestamps
    - Cholesterol levels (Total, LDL, HDL, Triglycerides) over time
    - Heart rate patterns and variability
    - Cardiac medications and their adherence
    - Any cardiac procedures or diagnoses
    Group by time periods and calculate trends
    """
})

# Risk factor analysis
risk_analysis = await tool.execute({
    "query": "Calculate 10-year cardiovascular risk based on latest cholesterol, blood pressure, age, and other risk factors"
})
```

#### Laboratory Medicine Specialist Queries
```python
# Comprehensive lab analysis
lab_overview = await tool.execute({
    "query": """
    Analyze all laboratory results:
    - Identify values outside reference ranges
    - Group by test categories (metabolic, hematology, hormones)
    - Calculate percentage of abnormal results
    - Highlight critical values requiring immediate attention
    - Show trends for frequently tested parameters
    """
})

# Reference range comparison
reference_check = await tool.execute({
    "query": "Compare all recent lab results to age and gender-appropriate reference ranges, flagging significant deviations"
})
```

#### Data Analysis Specialist Queries
```python
# Correlation analysis
correlations = await tool.execute({
    "query": """
    Identify statistical correlations between:
    - Medication changes and lab value improvements
    - Lifestyle factors and vital sign trends
    - Seasonal patterns in health metrics
    Return correlation coefficients and significance levels
    """
})

# Predictive trend analysis
predictions = await tool.execute({
    "query": "Based on historical trends, project likely values for key health metrics over the next 6 months"
})
```

## Tool Registry Enhanced Implementation

```python
class EnhancedToolRegistry:
    def __init__(self):
        self.tools = self._initialize_tools()
        self.usage_tracker = UsageTracker()
        self.cache = ToolCache()
        
    async def execute_tool(
        self, 
        tool_name: str, 
        parameters: Dict[str, Any],
        agent_context: AgentContext
    ) -> ToolResult:
        """Execute tool with enhanced context and caching"""
        
        # Check cache for identical queries
        cache_key = self._generate_cache_key(tool_name, parameters)
        if cached_result := await self.cache.get(cache_key):
            return cached_result
            
        # Track usage for optimization
        self.usage_tracker.track(agent_context.agent_id, tool_name)
        
        # Execute with retry logic
        result = await self._execute_with_retry(
            tool_name, 
            parameters,
            max_retries=3,
            backoff_factor=2
        )
        
        # Cache successful results
        if result.success:
            await self.cache.set(cache_key, result, ttl=300)  # 5 min cache
            
        return result
    
    def get_optimized_tool_description(self, agent_type: str) -> Dict[str, Any]:
        """Return tool descriptions optimized for specific agent types"""
        base_tools = self.get_tool_definitions()
        
        # Add agent-specific examples and patterns
        for tool in base_tools:
            tool['examples'] = self._get_agent_examples(agent_type, tool['name'])
            tool['best_practices'] = self._get_best_practices(agent_type)
            
        return base_tools
```

## Query Construction Best Practices

### 1. Temporal Queries
```python
# ❌ Avoid vague time references
"Show my recent cholesterol"

# ✅ Use specific time frames
"Show my cholesterol levels from the past 2 years, grouped by quarter"

# ✅ Use relative time intelligently
"Compare my average blood pressure from the last 3 months to the previous 3 months"
```

### 2. Metric Specificity
```python
# ❌ Avoid ambiguous metric names
"Show my sugar levels"

# ✅ Use precise medical terminology
"Show my fasting glucose and HbA1c values with dates and reference ranges"

# ✅ Include all relevant variants
"Retrieve all cholesterol measurements including Total, LDL, HDL, and Triglycerides"
```

### 3. Complex Aggregations
```python
# Pattern for multi-level analysis
query = """
For each year from 2020 to 2024:
1. Calculate average values for key metabolic markers
2. Count the number of abnormal results
3. Identify the most frequently abnormal tests
4. Show improvement or deterioration trends
Group results by year and test category
"""
```

### 4. Correlation Queries
```python
# Pattern for finding relationships
query = """
Analyze the relationship between:
- Statin medication adherence (% of days covered)
- LDL cholesterol levels
- Time periods before and after medication changes
Include correlation coefficient and statistical significance
"""
```

## Response Processing Patterns

### 1. Handling Structured Results
```python
class ResultProcessor:
    def process_lab_results(self, tool_response: Dict) -> LabAnalysis:
        """Convert tool response to domain-specific analysis"""
        if not tool_response.get("query_successful"):
            raise QueryFailedException(tool_response.get("error"))
            
        data = tool_response["result"]["data"]
        
        # Extract and categorize results
        abnormal_results = [
            d for d in data 
            if d.get("status") in ["abnormal", "critical"]
        ]
        
        # Calculate trends
        trends = self._calculate_trends(data)
        
        # Generate insights
        insights = self._generate_insights(abnormal_results, trends)
        
        return LabAnalysis(
            total_tests=len(data),
            abnormal_count=len(abnormal_results),
            trends=trends,
            insights=insights,
            confidence=tool_response["metadata"]["query_confidence"]
        )
```

### 2. Confidence-Based Processing
```python
def process_with_confidence(self, response: Dict) -> AnalysisResult:
    """Adjust processing based on query confidence"""
    confidence = response["metadata"]["query_confidence"]
    
    if confidence > 0.9:
        # High confidence - provide detailed analysis
        return self.detailed_analysis(response)
    elif confidence > 0.7:
        # Medium confidence - include caveats
        return self.cautious_analysis(response)
    else:
        # Low confidence - request clarification
        return self.request_clarification(response)
```

## Visualization Hint Processing

The tool provides visualization hints that agents should use to generate appropriate charts:

```python
class VisualizationGenerator:
    def generate_from_hints(self, tool_response: Dict) -> VisualizationConfig:
        """Generate visualization config from tool hints"""
        hints = tool_response["result"].get("visualization_hints", {})
        
        viz_config = {
            "type": self._map_chart_type(hints.get("chart_type")),
            "data": tool_response["result"]["data"],
            "config": {
                "xAxis": hints.get("x_axis", "date"),
                "yAxis": hints.get("y_axis", "value"),
                "title": hints.get("title", "Health Data Visualization"),
                "groupBy": hints.get("group_by"),
                "aggregation": hints.get("aggregation", "none")
            }
        }
        
        # Add interactivity based on data volume
        if len(tool_response["result"]["data"]) > 50:
            viz_config["config"]["interactive"] = True
            viz_config["config"]["features"] = ["zoom", "pan", "filter"]
            
        return viz_config
```

## Error Handling Patterns

### 1. Graceful Degradation
```python
async def query_with_fallback(self, primary_query: str, fallback_query: str):
    """Try specific query first, fall back to general if needed"""
    try:
        result = await self.tool.execute({"query": primary_query})
        if result["query_successful"] and result["result"]["data"]:
            return result
    except Exception as e:
        self.logger.warning(f"Primary query failed: {e}")
    
    # Fallback to simpler query
    return await self.tool.execute({"query": fallback_query})
```

### 2. Data Quality Handling
```python
def handle_incomplete_data(self, response: Dict) -> QualityAssessment:
    """Assess and communicate data quality issues"""
    metadata = response.get("metadata", {})
    
    quality_issues = []
    if metadata.get("record_count", 0) < 10:
        quality_issues.append("Limited data available for comprehensive analysis")
        
    if metadata.get("data_sources", []) == ["lab_results"]:
        quality_issues.append("Analysis limited to laboratory data only")
        
    completeness = response["result"].get("data_quality", {}).get("completeness", 100)
    if completeness < 80:
        quality_issues.append(f"Data completeness is {completeness}%")
        
    return QualityAssessment(
        issues=quality_issues,
        confidence_adjustment=0.8 if quality_issues else 1.0,
        recommendations=self._suggest_data_improvements(quality_issues)
    )
```

## Performance Optimization

### 1. Query Batching
```python
class BatchedQueryExecutor:
    async def execute_analysis_batch(self, queries: List[str]) -> List[Dict]:
        """Execute multiple related queries efficiently"""
        # Group similar queries
        grouped = self._group_by_similarity(queries)
        
        # Execute in parallel where possible
        tasks = []
        for group in grouped:
            if self._can_parallelize(group):
                tasks.extend([
                    self.tool.execute({"query": q}) 
                    for q in group
                ])
            else:
                # Sequential execution for dependent queries
                for q in group:
                    result = await self.tool.execute({"query": q})
                    tasks.append(asyncio.create_task(
                        asyncio.coroutine(lambda: result)()
                    ))
                    
        return await asyncio.gather(*tasks)
```

### 2. Semantic Caching
```python
class SemanticCache:
    def __init__(self):
        self.embeddings = EmbeddingGenerator()
        self.cache = {}
        self.similarity_threshold = 0.95
        
    async def get_similar(self, query: str) -> Optional[Dict]:
        """Find semantically similar cached queries"""
        query_embedding = await self.embeddings.generate(query)
        
        for cached_query, (cached_embedding, result) in self.cache.items():
            similarity = self._cosine_similarity(query_embedding, cached_embedding)
            if similarity > self.similarity_threshold:
                return result
                
        return None
```

## Integration with Agent Architecture

### 1. Agent-Specific Tool Wrappers
```python
class CardiologyToolWrapper:
    """Cardiology-specific tool interface"""
    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry
        self.specialty = "cardiology"
        
    async def get_cardiovascular_metrics(self, time_range: str = "all") -> CardioMetrics:
        """Get all relevant cardiovascular metrics"""
        query = self._build_cardio_query(time_range)
        result = await self.tools.execute_tool(
            "execute_health_query_v2",
            {"query": query},
            AgentContext(agent_id="cardiology", specialty=self.specialty)
        )
        return self._parse_cardio_metrics(result)
        
    def _build_cardio_query(self, time_range: str) -> str:
        """Build optimized cardiology query"""
        base_query = """
        Retrieve cardiovascular health data including:
        - Blood pressure (systolic/diastolic) with measurement positions
        - All cholesterol components (Total, LDL, HDL, Triglycerides, ratios)
        - Heart rate and rhythm data
        - Cardiac medications with adherence
        - Cardiovascular diagnoses and procedures
        """
        
        if time_range != "all":
            base_query += f"\nLimit to data from the {time_range}"
            
        return base_query
```

### 2. Cross-Agent Data Sharing
```python
class AgentDataBus:
    """Facilitate data sharing between agents"""
    def __init__(self):
        self.shared_context = {}
        
    async def share_findings(self, agent_id: str, findings: Dict):
        """Share relevant findings with other agents"""
        self.shared_context[agent_id] = findings
        
        # Notify relevant agents
        if agent_id == "cardiology" and "cholesterol" in str(findings):
            await self.notify_agent("pharmacy", {
                "topic": "cholesterol_medication_review",
                "data": findings
            })
```

## Monitoring and Metrics

### Tool Usage Metrics
```python
class ToolMetricsCollector:
    def track_tool_usage(self, agent_id: str, tool_name: str, response: Dict):
        """Collect metrics for optimization"""
        metrics = {
            "agent_id": agent_id,
            "tool_name": tool_name,
            "query_confidence": response["metadata"]["query_confidence"],
            "record_count": response["metadata"]["record_count"],
            "response_time_ms": response["metadata"].get("query_time_ms"),
            "success": response["query_successful"]
        }
        
        # Track for performance optimization
        if metrics["response_time_ms"] > 1000:
            self.flag_slow_query(agent_id, tool_name, response["query"])
```

## Security Considerations

### 1. Query Sanitization
- Natural language queries are automatically sanitized by the tool
- No SQL injection risk as queries never touch SQL directly
- PII is automatically redacted in logs

### 2. Access Control
- Tools enforce user-level data isolation
- Agents can only access data for the authenticated user
- Audit trails maintained for all data access

### 3. Rate Limiting
- Tools implement rate limiting to prevent abuse
- Agents should implement exponential backoff on rate limit errors
- Cache frequently accessed data to reduce tool calls