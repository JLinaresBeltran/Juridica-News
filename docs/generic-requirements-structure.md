# Generic Requirements Directory Structure for Any Use Case

## Proposed Structure

```
requirements/
├── technical-patterns/         [Domain-agnostic technical guides from this repo]
│   ├── implementation-guide.md   # Generic multi-agent patterns
│   ├── multi-agent-patterns.md  # Best practices for multi-agent systems
│   └── streaming-patterns.md    # SSE and real-time update patterns
│
├── pm-outputs/                  [Created by PM Agent]
│   ├── PRD.md
│   ├── user-stories.md
│   ├── feature-priority.md
│   └── architecture/           [Technical specs from PM Agent]
│       ├── system-architecture.md
│       ├── api-specification.md
│       ├── data-models.md
│       └── tool-interface.md
│
├── ux-outputs/                  [Created by UX Designer Agent]
│   ├── design-system.md
│   ├── component-specs.md
│   ├── prototypes/
│   ├── layout-guidelines.md
│   ├── visualization-specs.md
│   ├── accessibility-guidelines.md
│   └── animation-specs.md
│
└── po-inputs/                   [Provided by Product Owner]
    ├── domain-requirements.md   # Domain expertise (health, finance, etc.)
    ├── tool-interface.md       # If pre-built tools exist
    ├── visual-references/       # Screenshots/PDFs of desired UI
    ├── brand-guidelines.md     # Visual identity and design system
    ├── architecture-brief.md    # Multi-agent approach rationale
    └── external-references.md  # Links to research, patterns
```

## How This Enables Reusability

### 1. **Generic CLAUDE.md Becomes `technical-patterns/implementation-guide.md`**
```markdown
# At the top of the new workspace CLAUDE.md:

# CLAUDE.md - [Project Name] Implementation

This project implements a multi-agent system for [domain].

## Technical Implementation Guide
See `requirements/technical-patterns/implementation-guide.md` for detailed 
implementation patterns and best practices.

## Domain-Specific Requirements
- Product Requirements: `requirements/pm-outputs/PRD.md`
- Architecture: `requirements/pm-outputs/architecture/system-architecture.md`
- UX Specifications: `requirements/ux-outputs/design-system.md`

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
- `pm-outputs/` - What to build (including architecture/)
- `pm-outputs/architecture/` - How it connects
- `ux-outputs/` - How it looks
- `po-inputs/` - Domain expertise and background

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
- PM Agent: Creates pm-outputs/ (including architecture subfolder) after you attach domain docs
- UX Agent: Creates ux-outputs/ (after you attach PM outputs)
- PO: Provides po-inputs/

### Claude Code Gets
- Minimal CLAUDE.md pointing to requirements/
- All technical patterns in requirements/technical-patterns/
- All domain specifics in other requirements/ folders

This way, your demo can show how the same technical patterns enable different domains just by changing the domain-specific requirements!