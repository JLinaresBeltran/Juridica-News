# CLAUDE.md

You are implementing [PROJECT_NAME] - [ONE_LINE_DESCRIPTION].

## 🎯 Production Quality Standards

This is a PRODUCTION-READY implementation. You must deliver:
- ✅ Complete feature parity with specifications
- ✅ Professional UI with glassmorphism and animations
- ✅ Comprehensive error handling and recovery
- ✅ Performance optimizations and lazy loading
- ✅ Full accessibility compliance (WCAG 2.1 AA)
- ✅ 25+ polished components as specified in UX docs

## 📋 Pre-Implementation Checklist

Before starting, ensure you understand ALL requirements:

### PM Outputs Review
□ PRD with thread management and visualization history requirements
□ System architecture with evaluation framework
□ API specifications including thread and visualization endpoints
□ Data models with UUID-based tracking
□ Component architecture document (20+ components)
□ User stories including thread management and query history
□ Testing and evaluation framework requirements

### UX Outputs Review
□ **CRITICAL**: Open and study ALL HTML prototypes
□ Design system with glassmorphism specifications
□ Component specs for 25+ components
□ Animation specifications with timing/easing
□ Layout guidelines for three-panel interface
□ Thread sidebar design specifications
□ Agent team visualization with SVG connections
□ Tab-based navigation patterns

### Technical Patterns Review
□ Implementation guide (MASTER DOCUMENT)
□ Multi-agent patterns with orchestrator-worker
□ Streaming patterns with SSE best practices
□ Dependency management guide (exact versions)
□ SSE implementation guide
□ Visualization agent pattern

### Pre-built Tools Understanding
□ Located ALL tools in `backend/tools/`
□ Understand import patterns
□ Know tool interfaces and usage
□ Will NOT reimplement any existing tools

## 🛠️ Technology Stack (STRICT REQUIREMENTS)

### Backend Stack
```txt
FastAPI==0.104.1        # Web framework (NOT Django/Flask)
anthropic==0.39.0       # AI integration
sse-starlette==1.8.2    # Server-sent events
uvicorn[standard]==0.25.0
python-dotenv==1.0.0
pydantic==2.5.3
httpx==0.25.2
python-multipart==0.0.6
```

### Frontend Stack
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-markdown": "^9.0.1",
    "tailwindcss": "^3.3.0",    // CRITICAL: NOT v4
    "recharts": "^2.10.0",
    "@babel/standalone": "^7.23.0",
    "lucide-react": "^0.294.0",
    "uuid": "^9.0.1",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.8"
  }
}
```

## 📁 Required Project Structure

### Backend Architecture
```
backend/
├── main.py                      # FastAPI app with CORS, SSE
├── requirements.txt             # Exact versions as specified
├── .env                         # Environment variables
├── api/
│   ├── __init__.py
│   ├── chat.py                  # SSE streaming endpoint
│   ├── threads.py               # Thread management endpoints
│   └── visualizations.py        # Visualization history endpoints
├── services/
│   ├── __init__.py
│   ├── orchestration_service.py # Main orchestrator
│   ├── thread_manager.py        # Thread persistence
│   ├── visualization_manager.py # Viz history tracking
│   ├── error_handler.py         # Retry logic, error recovery
│   └── agents/
│       ├── __init__.py
│       ├── orchestrator/        # Main orchestrator agent
│       │   ├── orchestrator_agent.py
│       │   └── prompts/         # Externalized prompts
│       │       ├── analyze_query.txt
│       │       ├── team_assembly.txt
│       │       └── synthesis.txt
│       ├── specialists/         # All specialist agents
│       │   ├── specialist_agent.py
│       │   └── prompts/         # One per specialist
│       └── visualization/       # Visualization generator
│           ├── visualization_agent.py
│           └── prompts/         # Chart type prompts
├── models/
│   ├── __init__.py
│   ├── thread_models.py         # Thread, Message, etc.
│   ├── visualization_models.py  # Visualization tracking
│   └── agent_models.py          # Agent states
├── utils/
│   ├── __init__.py
│   ├── streaming.py             # SSE utilities
│   └── retry.py                 # Retry patterns
└── tools/                       # PRE-BUILT (DO NOT MODIFY)
    ├── tool_registry.py
    └── [provided tools]
```

### Frontend Architecture
```
frontend/
├── package.json                 # Exact dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind v3 config
├── tsconfig.json               # TypeScript config
├── index.html                  # Entry point
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # Main app with routing
    ├── components/
    │   ├── layout/             # Layout components (4)
    │   │   ├── MainLayout.tsx
    │   │   ├── Header.tsx
    │   │   ├── ThreadSidebar.tsx
    │   │   └── ResizablePanel.tsx
    │   ├── chat/               # Chat components (6)
    │   │   ├── ChatInterface.tsx
    │   │   ├── MessageList.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── QueryInput.tsx
    │   │   ├── ToolCall.tsx
    │   │   └── ThinkingIndicator.tsx
    │   ├── agents/             # Agent components (5)
    │   │   ├── AgentTeamView.tsx
    │   │   ├── AgentCard.tsx
    │   │   ├── TeamConnections.tsx
    │   │   ├── ProgressIndicator.tsx
    │   │   └── StatusBadge.tsx
    │   ├── visualizations/     # Viz components (5)
    │   │   ├── VisualizationHistory.tsx
    │   │   ├── QuerySelector.tsx
    │   │   ├── CodeArtifact.tsx
    │   │   ├── VisualizationCard.tsx
    │   │   └── ExportButton.tsx
    │   └── common/             # Utility components (5)
    │       ├── ErrorBoundary.tsx
    │       ├── LoadingStates.tsx
    │       ├── EmptyStates.tsx
    │       ├── ConfirmDialog.tsx
    │       └── ToastNotifications.tsx
    ├── hooks/                  # Custom hooks
    │   ├── useThreads.ts       # Thread management
    │   ├── useVisualizations.ts # Viz history
    │   ├── useSSE.ts          # SSE connection
    │   └── useLocalStorage.ts # Persistence
    ├── services/               # API integration
    │   ├── api.ts             # Base API client
    │   ├── threadService.ts   # Thread operations
    │   └── sseService.ts      # SSE handling
    ├── types/                  # TypeScript types
    │   └── index.ts           # All type definitions
    └── styles/                 # Global styles
        └── globals.css        # Tailwind imports

```

## 🚀 Implementation Process

### Phase 1: Analysis & Planning (CRITICAL)

1. **Deep Dive into Requirements**
   - Read EVERY document in `requirements/` thoroughly
   - Open and study ALL HTML prototypes
   - Understand the complete system architecture
   - Note all 25+ components to implement
   - Identify thread management requirements
   - Review visualization history needs

2. **Understand Production Features**
   - Thread persistence with UUID tracking
   - Query-based visualization history
   - Error recovery with retry logic
   - Loading states for all async operations
   - Glassmorphism effects throughout
   - Smooth animations and transitions

3. **Study Pre-built Tools**
   ```python
   # Example of correct tool usage
   from tools.tool_registry import ToolRegistry
   from tools.[domain]_query_tool import execute_query_v2
   
   # In your agents
   result = await execute_query_v2({"query": "..."})
   ```

### Phase 2: Present Comprehensive Plan

After thorough analysis, present a DETAILED plan (as text, not todos) that includes:

1. **Backend Implementation**
   - FastAPI setup with all required endpoints
   - Thread management service with UUID tracking
   - Orchestrator agent with query complexity analysis
   - All specialist agents with proper prompts
   - Visualization agent generating React components
   - Error handling service with retry logic
   - SSE streaming with proper headers

2. **Frontend Implementation**
   - Three-panel layout matching UX prototypes
   - Thread sidebar with conversation management
   - Chat interface with real-time updates
   - Agent team visualization with SVG connections
   - Tab navigation for team/visualization views
   - All 25+ components as specified
   - Glassmorphism effects and animations

3. **Integration Points**
   - SSE connection with reconnection logic
   - LocalStorage for thread persistence
   - Dynamic visualization rendering
   - Error boundaries and recovery

4. **Ask for Approval**
   "I've thoroughly reviewed all requirements including PM outputs, UX prototypes, and technical patterns. My plan implements all production features including thread management, visualization history, and the complete component library. Should I proceed?"

### Phase 3: Execute with Excellence

Only after approval:

1. **Match UX Prototypes EXACTLY**
   - Implement every component shown
   - Apply glassmorphism effects
   - Include all animations
   - Match spacing and typography

2. **Implement Production Features**
   - UUID-based thread tracking
   - LocalStorage persistence
   - Query-based visualization history
   - Comprehensive error handling
   - Loading and empty states

3. **Follow Best Practices**
   - Absolute imports (no relative imports)
   - Externalized prompts in .txt files
   - Proper TypeScript types (no 'any')
   - Error boundaries on all components
   - Accessibility attributes

## 💡 Critical Implementation Patterns

### Thread Management Pattern
```typescript
// Thread persistence with UUID
interface Thread {
  id: string;  // UUID v4
  title: string;
  createdAt: number;
  messages: Message[];
  visualizations: VisualizationGroup[];
}

// LocalStorage key pattern
const STORAGE_KEY = '[domain]-threads-v1';

// Auto-save with debouncing
const saveThreads = debounce((threads: Thread[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}, 5000);
```

### SSE Streaming Pattern (CRITICAL)
```python
# Backend - GET endpoint with proper headers
@router.get("/api/chat/stream")
async def stream_chat(message: str = Query(...)):
    async def event_generator():
        # Initial connection event
        yield {
            "event": "connected",
            "data": json.dumps({"message": "Connected"})
        }
        await asyncio.sleep(0.001)  # Force flush
        
        # Process with orchestrator
        async for update in orchestrator.process(message):
            yield {
                "event": update["type"],
                "data": json.dumps(update["data"])
            }
            await asyncio.sleep(0.001)  # Force flush
    
    return EventSourceResponse(
        event_generator(),
        headers={
            'X-Accel-Buffering': 'no',    # CRITICAL
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    )
```

```typescript
// Frontend - EventSource with reconnection
const connectSSE = (message: string) => {
  const url = `/api/chat/stream?message=${encodeURIComponent(message)}`;
  const eventSource = new EventSource(url);
  
  eventSource.onopen = () => console.log('Connected');
  
  eventSource.addEventListener('agent_activated', (e) => {
    const data = JSON.parse(e.data);
    updateAgentStatus(data);
  });
  
  eventSource.onerror = () => {
    eventSource.close();
    // Implement reconnection logic
    setTimeout(() => reconnectSSE(message), 1000);
  };
  
  return eventSource;
};
```

### Glassmorphism Implementation
```css
/* globals.css - MUST IMPLEMENT */
@layer components {
  .glass-panel {
    @apply bg-white/70 backdrop-blur-[16px] border border-white/20 
           shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl;
  }
  
  .glass-card {
    @apply bg-white/80 backdrop-blur-[10px] border border-gray-200/50 
           shadow-lg rounded-xl transition-all duration-200;
  }
  
  .glass-card:hover {
    @apply transform -translate-y-0.5 shadow-xl;
  }
}
```

### Animation Patterns
```css
/* Agent status animations */
@keyframes thinking-pulse {
  0%, 100% { 
    opacity: 0.4; 
    transform: scale(0.95); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.05); 
  }
}

.agent-thinking {
  animation: thinking-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* Message animations */
@keyframes slide-up {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.message-enter {
  animation: slide-up 0.3s ease-out;
}
```

### Error Handling Pattern
```python
# Backend retry logic
async def with_retry(
    func: Callable, 
    max_attempts: int = 3,
    backoff_factor: float = 2.0
) -> Any:
    for attempt in range(max_attempts):
        try:
            return await func()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            wait_time = backoff_factor ** attempt
            await asyncio.sleep(wait_time)
            # Log retry attempt
```

## ✅ Quality Checklist

### Before Starting Implementation
- [ ] Read ALL PM outputs thoroughly
- [ ] Studied ALL UX prototypes in detail
- [ ] Understand thread management requirements
- [ ] Know visualization history specifications
- [ ] Identified all 25+ components to build
- [ ] Reviewed animation specifications
- [ ] Understood glassmorphism requirements
- [ ] Located all pre-built tools

### During Implementation
- [ ] Using exact dependency versions
- [ ] Following three-panel layout from UX
- [ ] Implementing thread sidebar with categories
- [ ] Building agent team visualization with SVG
- [ ] Adding tab navigation for views
- [ ] Including all loading states
- [ ] Implementing error boundaries
- [ ] Adding retry logic for failures

### Before Completion
- [ ] All 25+ components implemented
- [ ] Glassmorphism effects applied
- [ ] Animations smooth and performant
- [ ] Thread persistence working
- [ ] Visualization history functional
- [ ] SSE streaming without buffering
- [ ] Error handling comprehensive
- [ ] Accessibility compliance met

## 🚫 Common Pitfalls to Avoid

### TypeScript Issues
```typescript
// ❌ WRONG - Causes import errors
import { AgentStatus, COLORS } from './types';

// ✅ CORRECT - Use type imports
import type { AgentStatus } from './types';
import { COLORS } from './constants';
```

### Tailwind Version
```json
// ❌ WRONG - v4 has breaking changes
"tailwindcss": "^4.0.0"

// ✅ CORRECT - Use v3
"tailwindcss": "^3.3.0"
```

### SSE Implementation
```python
# ❌ WRONG - POST endpoint
@router.post("/api/chat/stream")

# ✅ CORRECT - GET endpoint
@router.get("/api/chat/stream")
```

### Tool Usage
```python
# ❌ WRONG - Reimplementing tools
class CustomQueryTool:
    def execute_query(self, query):
        # Custom implementation

# ✅ CORRECT - Import existing tools
from tools.query_tool import execute_query_v2
```

## 🎉 Definition of Done

Your implementation is complete when:

1. **Backend Running**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   # API available at http://localhost:8000
   ```

2. **Frontend Running**
   ```bash
   cd frontend
   npm install
   npm run dev
   # UI available at http://localhost:5173
   ```

3. **All Features Working**
   - Thread management with persistence
   - Agent visualization with animations
   - SSE streaming without buffering
   - Visualization history by query
   - Error handling with recovery
   - All 25+ components polished

4. **Production Quality**
   - Glassmorphism effects throughout
   - Smooth animations and transitions
   - Professional UI matching prototypes
   - Accessibility compliance
   - Performance optimized

Remember: You're building a PRODUCTION-READY system. Every detail matters. The final result should be indistinguishable from a manually crafted application.