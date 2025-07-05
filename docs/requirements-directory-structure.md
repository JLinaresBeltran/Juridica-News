# Requirements Directory Structure & Contents

## Overview
This document describes the complete requirements directory structure that needs to be prepared before Claude Code begins implementation. Each file listed should be created by either the PM Agent, UX Designer Agent, or provided by the Product Owner.

## Complete Directory Structure

```
requirements/
├── technical/                 [Reusable technical patterns - can be provided by PO]
│   ├── implementation-guide.md # Generic multi-agent implementation patterns
│   ├── multi-agent-patterns.md # Orchestrator-worker patterns
│   └── streaming-patterns.md   # SSE and real-time updates
│
├── product/                    [Created by PM Agent]
│   ├── PRD.md                 # Product Requirements Document
│   ├── user-stories.md        # All user stories with acceptance criteria
│   ├── feature-priority.md    # Feature prioritization matrix
│   └── architecture/          [Technical documents from PM Agent]
│       ├── system-architecture.md # Overall system design
│       ├── api-specification.md   # Complete API documentation
│       ├── data-models.md        # All data entities and relationships
│       └── tool-interface.md     # Documentation of provided tools
│
├── ux/                       [Created by UX Designer Agent]
│   ├── design-system.md      # Colors, typography, spacing
│   ├── component-specs.md    # All UI component specifications
│   ├── layout-guidelines.md  # Responsive layout rules
│   ├── visualization-specs.md # Chart and graph specifications
│   ├── accessibility.md      # A11y requirements
│   ├── animation-guide.md    # Transitions and animations
│   ├── prototypes/
│   │   ├── welcome-prototype.html      # Welcome screen
│   │   ├── main-app-prototype.html     # Main application
│   │   ├── [domain]-prototype.html     # Domain-specific screens
│   │   └── assets/
│   │       ├── styles.css             # Prototype styles
│   │       └── interactions.js        # Prototype behaviors
│   └── mockups/
│       ├── welcome-screen.png
│       ├── main-interface.png
│       └── [domain-specific-screens].png
│
├── po-inputs/                [Provided by Product Owner]
│   ├── anthropic-multi-agent-blog.txt  # Copy of Anthropic's blog post
│   ├── [domain]-requirements.md        # Domain expertise (health, finance, etc.)
│   ├── [domain]-mcp-tool-interface.md  # Documentation of pre-built MCP tools
│   ├── [domain]-user-stories.pdf       # Visual examples of desired UI/UX
│   ├── [domain]-design-requirements.md # Design requirements from PO
│   └── [domain]-system-architecture-guide.md # Combined architecture doc
│
└── examples/                 [Created by PM & UX Agents]
    ├── user-flows/
    │   ├── simple-query-flow.md
    │   ├── complex-query-flow.md
    │   └── error-handling-flow.md
    └── sample-data/
        └── [domain-samples].json
```

## File Contents Guide

### Product Directory Files

#### PRD.md
Should contain:
- Executive summary
- Problem statement
- Target users and personas
- Solution overview
- Detailed feature descriptions
- Success metrics
- Risk analysis
- Timeline and milestones

#### user-stories.md
Format:
```markdown
## Epic: Health Query Processing

### Story 1: Simple Health Query
**As a** health-conscious user
**I want** to ask simple questions about my health data
**So that** I can quickly access specific information

**Acceptance Criteria:**
- [ ] User can type natural language query
- [ ] System responds within 5 seconds
- [ ] Response includes relevant data visualization
- [ ] Previous queries are saved in conversation

**Technical Notes:**
- Single specialist activation
- Direct tool call to Snowflake
- Simple visualization (single metric)
```

### Product Architecture Directory Files

#### system-architecture.md
Must include:
- Multi-agent orchestration diagram
- Component interaction flows
- Technology stack decisions
- Scalability considerations
- Security architecture
- Error handling strategies

#### api-specification.md
Complete OpenAPI-style documentation:
```markdown
## Health Query Endpoint
**POST** `/api/v1/chat`

**Request:**
```json
{
  "query": "string",
  "thread_id": "string (optional)",
  "context": "object (optional)"
}
```

**Response:** Server-Sent Events stream
```

### UX Directory Files

#### design-system.md
Comprehensive design language including:
- Color palette with hex values and use cases
- Typography scale and font families
- Spacing system (8-point grid)
- Component states (default, hover, active, disabled)
- Elevation and shadow system
- Animation timings and easings

#### prototypes/welcome-prototype.html
Fully functional HTML prototype showing:
- Welcome screen layout
- Example query cards
- Medical team introduction
- Interactive elements
- Responsive behavior

### Product Owner Input Files

These should be provided by the Product Owner in po-inputs/:

#### anthropic-multi-agent-blog.txt
Copy of Anthropic's blog post ["How we built our multi-agent research system"](https://www.anthropic.com/engineering/built-multi-agent-research-system)

#### tool-interface.md
Complete documentation of the pre-built tools including:
- Tool function signatures
- Input/output schemas
- Usage examples
- Query best practices

## Preparation Checklist for Product Owner

Before starting Claude Code, ensure:

### ✅ Technical Patterns (Reusable):
- [ ] Implementation guide covers multi-agent patterns
- [ ] Streaming patterns documented
- [ ] No domain-specific content in technical guides

### ✅ From PM Agent:
- [ ] PRD is complete with all sections
- [ ] All user stories have acceptance criteria
- [ ] API specifications cover all endpoints
- [ ] Data models are fully defined
- [ ] Architecture diagrams use Mermaid syntax

### ✅ From UX Designer Agent:
- [ ] Design system is comprehensive
- [ ] All components are specified
- [ ] HTML prototypes are functional
- [ ] Mockups cover all major screens
- [ ] Accessibility guidelines are included

### ✅ From Product Owner:
- [ ] Technical patterns are in requirements/technical-patterns/
- [ ] Domain-specific references are gathered
- [ ] Tool interface documentation is prepared
- [ ] Example data is available
- [ ] Brand guidelines (if any) are documented
- [ ] All files are in correct directories

### ✅ Additional Setup:
- [ ] Backend tools are in `backend/tools/` (if any)
- [ ] Minimal CLAUDE.md points to requirements
- [ ] VSCode workspace is configured
- [ ] Environment variables are documented

## Important Notes

1. **File Formats**: All documentation should be in Markdown format for easy parsing
2. **Images**: Mockups should be PNG format with descriptive names
3. **Code Examples**: Include working code snippets where relevant
4. **Cross-References**: Documents should link to related files
5. **Completeness**: Each file should be self-contained but reference others as needed

## Validation

Before starting implementation, verify:
1. All required files exist
2. No placeholders or TODOs remain
3. Technical specifications align with UX designs
4. API contracts match frontend needs
5. Data models support all features

This structure ensures Claude Code has all necessary information to build the complete multi-agent health insight system without needing clarification or missing requirements.