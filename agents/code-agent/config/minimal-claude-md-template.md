# CLAUDE.md

You are implementing [PROJECT_NAME] - [ONE_LINE_DESCRIPTION].

## Pre-Implementation Checklist

Before starting, ensure you understand:
□ All PM outputs (PRD, architecture, APIs, data models)
□ UX prototypes (open the HTML files!)
□ Pre-built tools (what's provided, how to use them)
□ Technical patterns (implementation guide is the master doc)
□ Visualization agent requirement (generates React components)
□ No Redis, no Next.js, no databases
□ FastAPI + React/Vite only

## Technology Stack (REQUIRED)

**Backend**: FastAPI (Python) - NOT Next.js, NOT Django, NOT Flask
**Frontend**: React with Vite - NOT Next.js, NOT Create React App
**Streaming**: Direct SSE from FastAPI - NO Redis, NO queues
**Data Access**: Import pre-built tools from `backend/tools/` - DO NOT reimplement

## Implementation Process

### Phase 1: Analysis & Planning

**IMPORTANT**: Thoroughly review ALL documents in the `requirements/` directory:

1. **PM-Generated Outputs** (`requirements/pm-outputs/`)
   - Read PRD.md for overall vision and requirements
   - Study system-architecture.md for technical design
   - Review api-specification.md for endpoint details
   - Examine data-models.md for entity structures
   - Check tool-interface.md for pre-built tool usage
   - Review user-stories.md for feature requirements

2. **UX-Generated Outputs** (`requirements/ux-outputs/`)
   - **CRITICAL**: Review `prototypes/` folder for HTML mockups
   - Study design-system.md for styling guidelines
   - Check component-specs.md for UI components
   - Review visualization-specs.md for chart requirements

3. **PO-Provided Inputs** (`requirements/po-inputs/`)
   - Review domain-specific requirements
   - Check brand guidelines if provided
   - Study any mockups or wireframes

4. **Technical Patterns** (`requirements/technical-patterns/`)
   - **MASTER GUIDE**: `implementation-guide.md` - Follow this exactly
   - Review `visualization-agent-pattern.md` for visualization requirements
   - Check `multi-agent-patterns.md` for orchestration patterns
   - Study `streaming-patterns.md` for SSE implementation

5. **Pre-built Tools** (`backend/tools/`)
   - Identify ALL provided tools
   - Understand their interfaces
   - Plan to IMPORT and use them directly

### Phase 2: Create Implementation Plan

After thoroughly reviewing ALL documents:

1. Create a comprehensive todo list that includes:
   - Backend setup with FastAPI
   - All agents from architecture (CMO, specialists, visualization)
   - Frontend setup with React + Vite
   - CodeArtifact component for visualizations
   - SSE streaming implementation
   - Integration of pre-built tools

2. Your plan MUST match the architecture in PM outputs:
   - Orchestrator agent (CMO)
   - All specialist agents listed
   - Visualization agent (generates React components)
   - Exact API endpoints specified
   - UI components from UX prototypes

3. **IMPORTANT**: Present the complete implementation plan showing:
   - All phases in order
   - Which agents you'll implement
   - How you'll use the pre-built tools
   - Frontend components matching UX prototypes

4. Ask: "I've reviewed all requirements including PM outputs, UX prototypes, and technical patterns. Here's my implementation plan based on the architecture. Should I proceed with Phase 1, or would you like to adjust anything?"

5. Wait for user confirmation before starting

### Phase 3: Execute Plan

Only after user approval:

1. **Match UX Prototypes Exactly**
   - Open and study the HTML files in `requirements/ux-outputs/prototypes/`
   - Implement the EXACT layout and components shown
   - Use the same class names and styling patterns
   - Include all interactive elements demonstrated

2. **Follow Implementation Order**
   - Backend setup first (FastAPI, agents, tools)
   - Frontend setup next (React + Vite)
   - Integration last (SSE connection, visualization rendering)

3. **Update Todo Status**
   - Mark each task as you complete it
   - Complete each phase before moving to next
   - Test as you go

## Quick Links
- PM Outputs: `requirements/pm-outputs/` (PRD, architecture, APIs)
- UX Prototypes: `requirements/ux-outputs/prototypes/` (HTML mockups)
- Implementation Guide: `requirements/technical-patterns/implementation-guide.md`
- Visualization Pattern: `requirements/technical-patterns/visualization-agent-pattern.md`
- Pre-built Tools: `backend/tools/` (DO NOT MODIFY)

## Expected Project Structure

```
backend/
├── main.py              # FastAPI app with CORS and SSE endpoints
├── requirements.txt     # anthropic, fastapi, uvicorn, etc.
├── api/                 # API route handlers
│   └── chat.py         # SSE endpoint for streaming
├── services/           
│   ├── agents/         # Agent implementations
│   │   ├── cmo/        # Orchestrator with prompts/
│   │   ├── specialists/ # Each specialist with prompts/
│   │   └── visualization/ # Visualization agent (REQUIRED)
│   └── streaming/      # SSE utilities
└── tools/              # PRE-BUILT tools (DO NOT MODIFY)
    ├── tool_registry.py
    └── [other provided tools]

frontend/
├── package.json         # React, Vite, Tailwind, Recharts, @babel/standalone
├── vite.config.ts      
├── src/
│   ├── App.tsx         # Main app component
│   ├── components/     # React components
│   │   ├── ChatInterface.tsx    # Main chat UI with SSE
│   │   ├── CodeArtifact.tsx     # Renders visualization code
│   │   ├── MedicalTeamDisplay.tsx # Shows agent status
│   │   └── [other UX components]
│   ├── services/       # API client with SSE
│   └── types/          # TypeScript types
└── index.html
```

## Critical Implementation Rules

### ALWAYS:
- Use FastAPI for backend (with `uvicorn main:app --reload`)
- Use React + Vite for frontend (with `npm run dev`)
- Import tools from `backend/tools/` using:
  ```python
  from tools.tool_registry import ToolRegistry
  from tools.health_query_tool import execute_health_query_v2
  ```
- Implement direct SSE streaming without queues
- Keep agents simple - thin wrappers around Anthropic calls
- Use externalized prompts in `.txt` files
- **Include Visualization Agent** that:
  - Generates self-contained React components
  - Embeds data directly in the component
  - Streams as ```javascript code blocks
  - Is called AFTER synthesis is complete

### NEVER:
- Use Next.js (backend or frontend)
- Add Redis, databases, or message queues  
- Reimplement tools that exist in `backend/tools/`
- Create complex agent inheritance hierarchies
- Add authentication systems
- Use state management libraries (Redux, Zustand)

## Key Implementation Patterns

### Agent Implementation Pattern
```python
# Every agent follows this pattern
class SpecialistAgent:
    def __init__(self, name, specialty):
        self.client = Anthropic()
        self.tools = ToolRegistry()  # Import pre-built tools
        self.prompts = self._load_prompts()  # From .txt files
```

### Visualization Flow
1. CMO completes synthesis
2. Visualization agent generates React component
3. Component streamed as ```javascript code block
4. Frontend CodeArtifact renders it dynamically

### SSE Streaming Pattern
```python
@router.post("/api/chat/message")
async def chat_message(request):
    async def generate():
        async for update in orchestrator.process(request):
            yield f"data: {json.dumps(update)}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## Important Notes
- Create ONE comprehensive todo list
- Get user approval before implementing
- Tools are PRE-BUILT - import and use them directly
- Match UI components to UX prototypes exactly
- Final deliverable must include:
  ```bash
  # Backend
  cd backend && pip install -r requirements.txt && python main.py
  
  # Frontend
  cd frontend && npm install && npm run dev
  ```