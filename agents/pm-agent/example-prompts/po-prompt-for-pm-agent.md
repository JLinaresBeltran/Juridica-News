# Product Owner Initial Prompt for Product Management Agent

## Prompt to Submit:

"I need to build a Multi-Agent Health Insight System that uses Anthropic's orchestrator-worker pattern (as described in their blog post: https://www.anthropic.com/engineering/built-multi-agent-research-system) to analyze health data and provide comprehensive medical insights. The system should have a Chief Medical Officer (CMO) agent that coordinates multiple medical specialist agents, each with deep domain expertise.

Key requirements:
1. Implement real-time streaming updates showing specialist progress
2. Create a beautiful, medical-themed UI with 3-panel layout
3. Generate dynamic visualizations from health data
4. Support simple to complex health queries with appropriate specialist activation
5. Use the provided data access tools (no direct database integration needed)

Please create:
1. A comprehensive Product Requirements Document (PRD)
2. Detailed user stories with acceptance criteria
3. Technical architecture documentation
4. API specifications for frontend-backend communication
5. Data model definitions
6. Success metrics and KPIs

Focus on making this system extensible so the pattern can be applied to other multi-agent use cases beyond healthcare."

## Documents to Upload:

1. **Multi-Agent Architecture Brief** (multi-agent-architecture-brief.md)
2. **Health Domain Requirements** (health-domain-requirements.md)
3. **Tool Interface Documentation** (tool-interface.md) - Describes the pre-built data access tools
4. **Anthropic's Multi-Agent Blog Post** - [Link](https://www.anthropic.com/engineering/built-multi-agent-research-system) or PDF
5. **Screenshots/Examples** of similar multi-agent systems (optional)

## Additional Context to Provide:

"This system will showcase best practices for multi-agent AI systems, including:
- Parallel specialist execution for complex queries
- Graceful degradation when specialists fail
- Clear coordination and synthesis of multiple perspectives
- Production-ready error handling and monitoring

The system uses pre-built tools that abstract data storage and querying. All agents will access health data through two main tools:
- `snowflake_import_analyze_health_records_v2` - for importing health data
- `execute_health_query_v2` - for natural language queries

The target users are health-conscious individuals who want to understand their health data through natural language queries, getting insights that would typically require consulting multiple medical specialists."