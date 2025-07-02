# Generic Requirements Directory Structure for Any Use Case

## Proposed Structure

```
requirements/
├── technical/                    [Domain-agnostic technical guides]
│   ├── implementation-guide.md   # Generic CLAUDE.md content
│   ├── multi-agent-patterns.md  # Best practices for multi-agent systems
│   ├── streaming-patterns.md    # SSE and real-time update patterns
│   └── tool-integration.md      # How to integrate with provided tools
│
├── product/                     [Domain-specific from PM Agent]
│   ├── PRD.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   └── success-metrics.md
│
├── architecture/                [Domain-specific from PM Agent]
│   ├── system-architecture.md
│   ├── api-specification.md
│   ├── data-models.md
│   └── domain-tools.md         # Documentation of domain-specific tools
│
├── ux/                         [Domain-specific from UX Agent]
│   ├── design-system.md
│   ├── component-specs.md
│   ├── prototypes/
│   └── mockups/
│
└── reference/                  [Domain-specific from PO]
    ├── domain-guide.md         # Domain expertise (health, finance, etc.)
    ├── tool-interface.md       # If pre-built tools exist
    ├── mockups-screenshots/    # Visual examples of desired UI/UX
    ├── brand-guidelines.md     # Visual identity and design system
    ├── example-data.json       # Sample domain data
    └── external-references.md  # Links to research, patterns
```

## How This Enables Reusability

### 1. **Generic CLAUDE.md Becomes `technical/implementation-guide.md`**
```markdown
# At the top of the new workspace CLAUDE.md:

# CLAUDE.md - [Project Name] Implementation

This project implements a multi-agent system for [domain].

## Technical Implementation Guide
See `requirements/technical/implementation-guide.md` for detailed 
implementation patterns and best practices.

## Domain-Specific Requirements
- Product Requirements: `requirements/product/PRD.md`
- Architecture: `requirements/architecture/system-architecture.md`
- UX Specifications: `requirements/ux/design-system.md`

Start by reviewing all requirements before beginning implementation.
```

### 2. **Reusable Technical Documents**

**implementation-guide.md** (The detailed technical guide)
- Multi-agent patterns
- SSE streaming setup
- Error handling patterns
- Performance optimization
- No domain-specific references

**multi-agent-patterns.md**
```markdown
# Multi-Agent System Patterns

## Orchestrator Pattern
Applicable to any domain where tasks need coordination...

## Specialist Pattern
When domain expertise needs to be distributed...

## Parallel Execution Pattern
For independent task processing...
```

### 3. **Domain-Specific Sections**

All domain knowledge lives in:
- `product/` - What to build
- `architecture/` - How it connects
- `ux/` - How it looks
- `reference/` - Domain expertise

## Benefits of This Structure

1. **Reusability**: Technical guides work for any domain
2. **Clarity**: Clear separation of technical vs domain concerns
3. **Maintainability**: Update patterns without touching domain logic
4. **Scalability**: Easy to add new domains/use cases

## For Your Demo

### Initial Setup (One-time)
Create the generic technical documents that can be reused:
- Extract generic patterns from current CLAUDE.md
- Create modular technical guides
- Remove all health-specific references

### Per Use Case
The 3 AI Amigos create only domain-specific content:
- PM Agent: Creates product/ and architecture/ (after you attach domain docs)
- UX Agent: Creates ux/ (after you attach PM outputs)
- PO: Provides reference/

### Claude Code Gets
- Minimal CLAUDE.md pointing to requirements/
- All technical patterns in requirements/technical/
- All domain specifics in other requirements/ folders

This way, your demo can show how the same technical patterns enable different domains just by changing the domain-specific requirements!