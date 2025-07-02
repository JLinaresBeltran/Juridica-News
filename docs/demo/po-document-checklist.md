# Product Owner Document Checklist for Demo

## Documents You Need to Prepare

### For PM Agent Upload (4 documents)
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

✅ **4. Anthropic Blog Link/Text**
- https://www.anthropic.com/engineering/built-multi-agent-research-system
- Can be a link or downloaded text

### For Claude Code Workspace (4 additional documents)

✅ **5. implementation-guide.md** → Goes in `requirements/technical/`
- Generic multi-agent implementation patterns
- 500+ lines of technical guidance
- NO health-specific content

✅ **6. multi-agent-patterns.md** → Goes in `requirements/technical/`
- Orchestrator-worker pattern details
- Based on Anthropic's approach
- Domain-agnostic patterns

✅ **7. streaming-patterns.md** → Goes in `requirements/technical/`
- SSE implementation guide
- Real-time update patterns
- Frontend/backend streaming code

✅ **8. CLAUDE.md** → Goes in workspace root
- The minimal 10-line file
- Points to requirements folder
- First thing Claude Code sees

## Document Flow in Demo

```
Step 1: Upload to PM Agent
├── multi-agent-architecture-brief.md
├── health-domain-requirements.md
├── tool-interface-document.md
└── anthropic-blog-link.txt

Step 2: PM Agent Creates
├── PRD.md
├── user-stories.md
├── api-specification.md
└── [other PM outputs]

Step 3: Upload to UX Agent
└── [All PM outputs + mockups]

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
    ├── technical/
    │   ├── implementation-guide.md
    │   ├── multi-agent-patterns.md
    │   └── streaming-patterns.md
    ├── product/ (PM outputs)
    ├── architecture/ (PM outputs)
    ├── ux/ (UX outputs)
    └── reference/
        ├── multi-agent-architecture-brief.md
        ├── health-domain-requirements.md
        ├── tool-interface-document.md
        └── anthropic-blog.md
```

## Key Points for Demo

1. **Technical docs (5-7) are reusable** - Same files work for finance, legal, etc.
2. **Domain docs (1-3) are specific** - Change these for different use cases
3. **CLAUDE.md is minimal** - Just points to the real documentation
4. **Tools are pre-built** - Already in backend/tools/, don't recreate

## Demo Script Note

"As the Product Owner, I've prepared domain-specific requirements for our health system, along with reusable technical patterns that work for any multi-agent system. Watch how the AI agents take these documents and create a complete, production-ready system..."