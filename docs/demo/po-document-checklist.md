# Product Owner Document Checklist for Demo

## Documents You Need to Prepare

### For PM Agent Message (6 documents)
✅ **1. health-system-architecture-guide.md**
- Comprehensive architecture document combining:
  - Multi-agent orchestrator-worker pattern
  - Technology stack (FastAPI + React/Vite)
  - Health-specific configurations and data models
  - Implementation patterns and code examples

✅ **2. multi-agent-implementation-architecture.md** (from technical-patterns/)
- Shows the exact backend service structure needed
- Explains single SpecialistAgent class with multiple specialties
- Details prompt organization and externalization
- Provides concrete code patterns for initialization

✅ **3. health-domain-requirements.md**  
- Health data types (labs, vitals, medications)
- Medical specialties needed
- Example health queries

✅ **4. health-mcp-tool-interface.md**
- Documents the health-specific MCP tools
- `execute_health_query_v2` specifications
- `snowflake_import_analyze_health_records_v2` specifications

✅ **5. health-user-stories.pdf**
- Screenshots of the working system
- Shows exact UI/UX to achieve
- Medical team visualization examples
- Real-time progress indicators

✅ **6. Anthropic Blog Link/Text**
- https://www.anthropic.com/engineering/built-multi-agent-research-system
- Can be a link or downloaded text

### For Claude Code Workspace (8 additional documents)

✅ **9. technology-requirements.md** → Goes in `requirements/technical-patterns/`
- Same file as #8, place in technical patterns folder
- Claude Code needs this for implementation

✅ **10. implementation-guide.md** → Goes in `requirements/technical-patterns/`
- Generic multi-agent implementation patterns
- 500+ lines of technical guidance
- References the single SpecialistAgent pattern

✅ **11. multi-agent-patterns.md** → Goes in `requirements/technical-patterns/`
- Orchestrator-worker pattern details
- Based on Anthropic's approach
- Clarifies single specialist class approach

✅ **12. streaming-patterns.md** → Goes in `requirements/technical-patterns/`
- SSE implementation guide
- Real-time update patterns
- Frontend/backend streaming code

✅ **13. visualization-agent-pattern.md** → Goes in `requirements/technical-patterns/`
- How to implement visualization agent
- Code artifact streaming pattern
- React component generation

✅ **14. dependency-management-guide.md** → Goes in `requirements/technical-patterns/`
- CRITICAL: Exact versions to prevent conflicts
- Solutions for common dependency issues
- Required for consistent builds

✅ **15. sse-implementation-guide.md** → Goes in `requirements/technical-patterns/`
- CRITICAL: Correct SSE patterns
- GET vs POST endpoints
- Headers and delay requirements

✅ **16. CLAUDE.md** → Goes in workspace root
- Updated with common issues & solutions
- Points to requirements folder
- First thing Claude Code sees

## Document Flow in Demo

```
Step 1: Attach to PM Agent message
├── simplified-architecture-brief.md
├── multi-agent-implementation-architecture.md
├── multi-agent-architecture-brief.md
├── health-domain-requirements.md
├── tool-interface-document.md
├── User Stories User Flows Mocks.pdf
├── anthropic-blog-link.txt
└── technology-requirements.md

Step 2: PM Agent Creates
├── PRD.md
├── user-stories.md
├── api-specification.md
└── [other PM outputs]

Step 3: Attach to UX Agent message
├── PRD.md (from PM)
├── user-stories.md (from PM)
├── system-architecture.md (from PM)
├── api-specification.md (from PM)
├── data-models.md (from PM)
├── User Stories User Flows Mocks.pdf
└── health-insight-brand-guidelines.md

Step 4: UX Agent Creates
├── design-system.md
├── component-specs.md
├── prototypes/
└── [other UX outputs]

Step 5: Prepare Claude Code Workspace
workspace/
├── CLAUDE.md (updated with common issues)
├── backend/
│   └── tools/ (4 provided tool files)
├── frontend/ (empty)
└── requirements/
    ├── technical-patterns/
    │   ├── implementation-guide.md
    │   ├── multi-agent-patterns.md
    │   ├── streaming-patterns.md
    │   ├── visualization-agent-pattern.md
    │   ├── technology-requirements.md      # NEW
    │   ├── dependency-management-guide.md  # NEW
    │   └── sse-implementation-guide.md     # NEW
    ├── pm-outputs/
    │   ├── PRD.md
    │   ├── user-stories.md
    │   ├── feature-priority.md
    │   └── architecture/
    │       ├── system-architecture.md
    │       ├── api-specification.md
    │       ├── data-models.md
    │       └── tool-interface.md
    ├── ux-outputs/
    │   ├── design-system.md
    │   ├── component-specs.md
    │   ├── layout-guidelines.md
    │   ├── animation-specs.md
    │   └── prototypes/
    └── po-inputs/
        ├── multi-agent-architecture-brief.md
        ├── health-domain-requirements.md
        ├── tool-interface-document.md
        ├── User Stories User Flows Mocks.pdf
        └── anthropic-blog.txt
```

## Key Points for Demo

1. **Technical docs are reusable** - Same files work for finance, legal, etc.
2. **Domain docs are specific** - Change these for different use cases
3. **New guides prevent common issues** - Dependency versions, SSE patterns
4. **CLAUDE.md includes troubleshooting** - Common issues & solutions
5. **Tools are pre-built** - Already in backend/tools/, don't recreate

## Demo Script Note

"As the Product Owner, I've prepared domain-specific requirements for our health system, visual mockups of what we want to build, along with reusable technical patterns that work for any multi-agent system. Watch how the AI agents take these documents and create a complete, production-ready system..."