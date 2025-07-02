# Product Owner Document Checklist for Demo

## Documents You Need to Prepare

### For PM Agent Message (5 documents)
✅ **1. multi-agent-architecture-brief.md**
- Explains orchestrator-worker pattern
- Core requirements for multi-agent system
- Why multi-agent vs single agent

✅ **2. health-domain-requirements.md**  
- Health data types (labs, vitals, medications)
- Medical specialties needed
- Example health queries

✅ **3. tool-interface-document.md**
- Documents the two pre-built tools
- `execute_health_query_v2` specifications
- `snowflake_import_analyze_health_records_v2` specifications

✅ **4. User Stories User Flows Mocks.pdf**
- Screenshots of the working system
- Shows exact UI/UX to achieve
- Medical team visualization examples
- Real-time progress indicators

✅ **5. Anthropic Blog Link/Text**
- https://www.anthropic.com/engineering/built-multi-agent-research-system
- Can be a link or downloaded text

### For Claude Code Workspace (3 additional documents)

✅ **6. implementation-guide.md** → Goes in `requirements/technical-patterns/`
- Generic multi-agent implementation patterns
- 500+ lines of technical guidance
- NO health-specific content

✅ **7. multi-agent-patterns.md** → Goes in `requirements/technical-patterns/`
- Orchestrator-worker pattern details
- Based on Anthropic's approach
- Domain-agnostic patterns

✅ **8. streaming-patterns.md** → Goes in `requirements/technical-patterns/`
- SSE implementation guide
- Real-time update patterns
- Frontend/backend streaming code

✅ **9. CLAUDE.md** → Goes in workspace root
- The minimal 10-line file
- Points to requirements folder
- First thing Claude Code sees

## Document Flow in Demo

```
Step 1: Attach to PM Agent message
├── multi-agent-architecture-brief.md
├── health-domain-requirements.md
├── tool-interface-document.md
├── User Stories User Flows Mocks.pdf
└── anthropic-blog-link.txt

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
├── CLAUDE.md (minimal pointer file)
├── backend/
│   └── tools/ (4 provided tool files)
├── frontend/ (empty)
└── requirements/
    ├── technical-patterns/
    │   ├── implementation-guide.md
    │   ├── multi-agent-patterns.md
    │   └── streaming-patterns.md
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
    │   └── prototypes/
    └── po-inputs/
        ├── multi-agent-architecture-brief.md
        ├── health-domain-requirements.md
        ├── tool-interface-document.md
        ├── User Stories User Flows Mocks.pdf
        └── anthropic-blog.txt
```

## Key Points for Demo

1. **Technical docs (6-8) are reusable** - Same files work for finance, legal, etc.
2. **Domain docs (1-5) are specific** - Change these for different use cases
3. **CLAUDE.md (9) is minimal** - Just points to the real documentation
4. **Tools are pre-built** - Already in backend/tools/, don't recreate

## Demo Script Note

"As the Product Owner, I've prepared domain-specific requirements for our health system, visual mockups of what we want to build, along with reusable technical patterns that work for any multi-agent system. Watch how the AI agents take these documents and create a complete, production-ready system..."