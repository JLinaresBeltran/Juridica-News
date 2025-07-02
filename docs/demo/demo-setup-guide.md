# Demo Setup Guide - Making 3 AI Amigos Reusable

## Objective
Set up the 3 AI Amigos demo to show how the pattern works for ANY use case, not just health systems.

## One-Time Setup (Reusable Assets)

### 1. Extract Generic Technical Patterns

Create these files once and reuse across all demos:

**requirements/technical-patterns/implementation-guide.md**
- The refactored, domain-agnostic implementation guide
- Multi-agent orchestration patterns
- SSE streaming implementation
- Error handling approaches
- No domain-specific references

**requirements/technical-patterns/multi-agent-patterns.md**
- Orchestrator-worker pattern details
- Specialist coordination strategies
- Parallel execution guidelines
- Based on Anthropic's blog

**requirements/technical-patterns/streaming-patterns.md**
- SSE implementation patterns
- Progress update structures
- Real-time UI synchronization

### 2. Generic Agent Instructions

Keep PM and UX Agent instructions domain-agnostic (already done in the artifacts above).

## Per-Demo Setup (Domain-Specific)

For each new use case demo:

### What the PO Provides:
1. **Domain Brief** (replaces health-domain-requirements.md)
2. **Tool Interface Doc** (if domain has pre-built tools)
3. **Visual Mockups/Screenshots** (shows desired UI/UX)
4. **Brand Guidelines** (visual identity based on mockups)
5. **Domain Examples** (sample queries, data)
6. **Minimal CLAUDE.md** (3-4 lines pointing to requirements)

### What Gets Created Fresh:
- PM Agent outputs (product/, architecture/)
- UX Agent outputs (ux/)
- All domain-specific content

## Demo Examples Showing Reusability

### Health System (Original Demo)
```
Input: Health domain requirements, health data tools
PM Creates: CMO + 8 medical specialists
UX Creates: Medical-themed UI, health visualizations
Result: Multi-agent health insight system
```

### Financial Advisory System
```
Input: Finance domain requirements, market data tools, dashboard mockups
PM Creates: Chief Investment Officer + specialists (Tax, Risk, Research)
UX Creates: Financial dashboards matching mockups, portfolio visualizations
Result: Multi-agent investment advisor
```

### Legal Document Analyzer
```
Input: Legal domain requirements, document parsing tools, interface mockups
PM Creates: Senior Counsel + specialists (Contract, Compliance, IP)
UX Creates: Document review UI matching mockups, clause highlighting
Result: Multi-agent legal assistant
```

## Key Demo Talking Points

1. **"Same Pattern, Different Domains"**
   - Show how technical/ folder remains unchanged
   - Only domain-specific requirements change

2. **"The AI Agents Adapt"**
   - PM creates appropriate specialists for the domain
   - UX designs domain-appropriate interfaces
   - Claude Code implements using same patterns

3. **"From Health to Finance in Minutes"**
   - Change domain requirements
   - Rerun through 3 AI Amigos
   - Get completely different system

## File Structure Comparison

```
health-system/
└── requirements/
    ├── technical-patterns/  # ← SAME FILES
    ├── pm-outputs/          # ← Health-specific
    │   └── architecture/   # ← Health technical specs
    ├── ux-outputs/         # ← Health-specific designs
    └── po-inputs/          # ← Health domain docs

finance-system/
└── requirements/
    ├── technical-patterns/  # ← SAME FILES (copied)
    ├── pm-outputs/          # ← Finance-specific
    │   └── architecture/   # ← Finance technical specs
    ├── ux-outputs/         # ← Finance-specific designs
    └── po-inputs/          # ← Finance domain docs
```

## Demo Script Enhancement

"What makes the 3 AI Amigos powerful isn't just building one system—it's the reusability. Watch as I take the exact same technical patterns and agent instructions, change only the domain requirements, and get a completely different multi-agent system. The technical implementation guide contains patterns proven by Anthropic that work across any domain."

[Show technical/ folder]
"These technical patterns stay the same..."

[Show domain change]
"We just change the domain from health to finance..."

[Run through agents]
"And the AI agents create a complete financial advisory system using the same underlying patterns."

This demonstrates true AI-powered development acceleration across any domain!