# CLAUDE.md

You are implementing [PROJECT_NAME] - [ONE_LINE_DESCRIPTION].

## Implementation Process

### Phase 1: Analysis & Planning
1. Read the PRD: `requirements/pm-outputs/PRD.md`
   - **Check if this is a demo**: Look for "demo", "proof of concept", or "Optional - Skip for demo" in security requirements
   - If demo: Exclude authentication/security from your implementation plan
2. Review technical patterns: `requirements/technical-patterns/implementation-guide.md`
3. Check for provided tools: `backend/tools/` (if any exist, DO NOT modify them)
4. Review all architecture and UX specifications

### Phase 2: Create Implementation Plan
After reviewing all requirements:
1. Create a comprehensive todo list with all implementation phases
2. **IMPORTANT**: Present the complete implementation plan to the user for review
3. Ask: "I've reviewed all requirements and created this implementation plan. Should I proceed with Phase 1, or would you like to adjust anything?"
4. Wait for user confirmation before starting implementation

### Phase 3: Execute Plan
Only after user approval:
1. Follow the implementation phases from your approved plan
2. Update todo status as you progress
3. Complete each phase before moving to the next

## Quick Links
- Architecture: `requirements/pm-outputs/architecture/`
- UX Designs: `requirements/ux-outputs/`
- Domain Info: `requirements/po-inputs/`

## Important Notes
- Always create ONE comprehensive todo list (not duplicates)
- Always get user approval before implementing
- Never modify files in `backend/tools/` if they exist
- **For demos**: 
  - Skip authentication/security unless specifically requested
  - Skip automated testing (unit tests, integration tests, etc.)
  - Focus on manual testing and getting the demo running
- **Tool Integration**: When pre-built tools exist in `backend/tools/`, import and use them in your services instead of creating new implementations
- **Final Deliverable**: Must include clear startup instructions:
  - How to install dependencies
  - How to start backend server (with exact commands)
  - How to start frontend server (with exact commands)
  - The URL to access the application