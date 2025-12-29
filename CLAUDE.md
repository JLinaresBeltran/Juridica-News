# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema Editorial Jurídico Supervisado** - A specialized digital workstation combining intelligent automation with professional oversight for high-quality legal content production. The system scrapes legal documents from Colombian courts, uses AI for analysis and content generation, and publishes through a public portal with 9 legal categories.

**Tech Stack**: React 18 + TypeScript (frontend), Node.js + Express + Prisma (backend), SQLite (dev DB), Python + Selenium (web scraping), Server-Sent Events (real-time)

**Project Status**: 82% complete - fully functional core system with mock AI services ready for real integration.

## Essential Commands

### Full Stack Development
```bash
# Run both backend + frontend simultaneously (recommended)
npm run dev:all

# Or run separately:
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:5173
```

### Backend Commands
```bash
cd backend/

# Database operations (Prisma)
npm run db:generate    # Generate Prisma client after schema changes
npm run db:migrate     # Create and apply migrations
npm run db:seed        # Seed database with initial data
npm run db:reset       # Reset DB and re-seed (destructive)
npm run db:studio      # Open Prisma Studio GUI

# Development
npm run dev            # Hot-reload development server
npm run build          # TypeScript compilation + alias resolution
npm run type-check     # Type checking without build

# Scripts
npm run reprocess-documents    # Re-run AI analysis on existing documents
```

### Frontend Commands
```bash
cd frontend/

npm run dev            # Vite dev server with HMR
npm run build          # Production build
npm run preview        # Preview production build
npm run type-check     # TypeScript verification
npm run lint:fix       # Auto-fix ESLint issues
```

### Python Web Scraping
```bash
# Run Corte Constitucional scraper (from project root)
backend/services/scraping/venv/bin/python backend/services/scraping/run_extractor.py \
  --source corte_constitucional \
  --limit 5 \
  --download  # Optional: download RTF/DOCX files
```

## Critical Architecture Patterns

### 1. Hybrid Document Storage System (Key Innovation)

The system uses **three levels of document storage** to optimize AI analysis while preserving legal integrity:

```typescript
// Document model in Prisma
model Document {
  content         String   // ≤10K chars - Intelligent summary for AI analysis
  fullTextContent String?  // Complete extracted text for search
  documentPath    String?  // Path to original RTF/DOCX file
}
```

**Processing Pipeline**:
1. `CorteConstitucionalScraper` extracts RTF/DOCX documents
2. `ScrapingOrchestrator.generateIntelligentSummary()` creates optimized summary using `DocumentTextExtractor.extractStructuredSections()`
3. `ScrapingOrchestrator.saveDocumentFile()` stores original file in `backend/storage/documents/`
4. Database receives all three content levels
5. `AiAnalysisService` analyzes only the `content` field (5x faster, 80% cost reduction)

**Location**: [backend/src/services/ScrapingOrchestrator.ts](backend/src/services/ScrapingOrchestrator.ts)

### 2. Authentication Flow (JWT + Refresh Tokens)

- **Access Token**: Short-lived JWT (15-30 min) for API requests
- **Refresh Token**: Long-lived token stored in DB, used to get new access tokens
- **Storage**: Frontend stores both in Zustand `AuthStore` with localStorage persistence

**Middleware**: `authMiddleware` in [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) validates JWT on protected routes

**Frontend Auth**: [frontend/src/stores/authStore.ts](frontend/src/stores/authStore.ts) with axios interceptors in [frontend/src/services/api.ts](frontend/src/services/api.ts)

### 3. State Management Architecture (Frontend)

Uses **Zustand** with three main stores:

```typescript
// frontend/src/stores/
authStore.ts        // Authentication state + persistence
appStore.ts         // Global UI state (sidebar, notifications)
curationStore.ts    // Document curation workflow state
```

**Pattern**: Stores use `persist` middleware for localStorage sync. Access via hooks: `useAuthStore()`, `useAppStore()`, `useCurationStore()`

### 4. Backend Service Layer Pattern

Controllers delegate business logic to specialized services:

```
controllers/        → Handle HTTP requests/responses
services/          → Business logic (ScrapingOrchestrator, AiAnalysisService, etc.)
scrapers/          → Web scraping implementations (CorteConstitucionalScraper)
adapters/          → External API integrations (future: real AI services)
```

**Key Services**:
- `ScrapingOrchestrator`: Coordinates scraping → extraction → AI analysis pipeline
- `AiAnalysisService`: AI content analysis (currently mock, ready for OpenAI/Anthropic/Gemini)
- `ArticlePositioningService`: Manages article publication positions in portal sections
- `CacheService`: In-memory caching with TTL, pattern invalidation (25-50x faster for cached data)
- `ScheduledTasksService`: Automated cron jobs (backups 2 AM, cache invalidation, orphan cleanup)

### 5. Real-Time Updates (Server-Sent Events)

SSE endpoint: `GET /api/events/stream` - Long-lived connection for server → client notifications

**Usage**: Frontend subscribes via `useScrapingProgress` hook in [frontend/src/hooks/useScrapingProgress.ts](frontend/src/hooks/useScrapingProgress.ts)

**Events**: `scraping:progress`, `scraping:complete`, `scraping:error`, `document:new`

### 6. API Structure

All routes follow pattern: `/api/{resource}/{action}`

**Main Endpoints**:
- `/api/auth/*` - Authentication (login, register, refresh, profile)
- `/api/documents/*` - Document CRUD + curation actions
- `/api/articles/*` - Article CRUD + publication management
- `/api/public/*` - Public portal (articles by section, search)
- `/api/scraping/*` - Trigger scraping, check status
- `/api/events/stream` - SSE real-time notifications
- `/api/health/*` - System health checks

**Documentation**: http://localhost:3001/api-docs (Swagger UI when running)

## Important Implementation Details

### Database Schema (Prisma)

9 main models: User, RefreshToken, Document, Article, Media, AuditLog, ExtractionHistory, Section, PublicationPosition

**Key relationships**:
- Document → Article (1:1, documents are curated into articles)
- Article → Section (N:1, each article belongs to one legal category)
- Article → PublicationPosition (1:1, controls display order in portal)

**Migration workflow**: After editing `backend/prisma/schema.prisma`:
1. `npm run db:generate` - Update Prisma client types
2. `npm run db:migrate` - Create and apply migration
3. TypeScript types auto-update via `@prisma/client`

### Environment Variables

**Backend** requires `.env` in `backend/`:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
CORS_ORIGIN="http://localhost:5173"
# Optional AI service keys (currently mocked)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

### Path Aliases

Backend uses TypeScript path aliases: `@/` maps to `src/`

**Config**: `backend/tsconfig.json` + `tsc-alias` for build output transformation

### Known Issues

1. **Redis Connection Error**: Redis not required for core functionality (used for optional caching). Error is non-blocking.
2. **AI Services**: Currently mocked. Real integration requires adding API keys and uncommenting service calls in `AiAnalysisService`.
3. **SQLite vs PostgreSQL**: Dev uses SQLite, production should use PostgreSQL (update `DATABASE_URL`).

## Utility Scripts

**Database Integrity Verification**:
```bash
# Verify integrity of all documents with SHA-256 checksums
npx tsx backend/src/scripts/verify-document-integrity.ts

# Verify only first 50 documents
npx tsx backend/src/scripts/verify-document-integrity.ts 50
```

**Database Backups**:
```bash
# Create manual backup (automatic daily at 2 AM)
npx tsx backend/src/scripts/backup-database.ts

# List all available backups
npx tsx backend/src/scripts/backup-database.ts list
```

## Testing

**Status**: Test configuration ready (Vitest + React Testing Library), test suites pending implementation.

```bash
npm run test           # Run all tests
npm run test:backend   # Backend tests only
npm run test:frontend  # Frontend tests only
```

## Portal Structure (Public Frontend)

9 legal sections (managed via Section model):
- Derecho Administrativo
- Derecho Civil
- Derecho Comercial
- Derecho Digital
- Derecho de Familia
- Derecho Laboral
- Opinión
- Derecho Penal
- Derecho Tributario

**Routes**: `/portal/:section` displays articles for each section with automatic positioning via `PublicationPositionService`

## Documentation Reference

Detailed PM/UX specifications in `docs/` directory:
- `docs/requirements/` - Domain knowledge and initial prompts
- `docs/pm-outputs/` - Product requirements, API specs, data models
- `docs/ux-outputs/` - Design system, component specs, prototypes

### Architecture Documentation

Technical architecture specifications in `docs/architecture/`:
- `docs/architecture/BLACK_BOX_REFACTORING_SPEC.md` - Adapter pattern and black box architecture
- `docs/architecture/EVENT_SYNCHRONIZATION_SYSTEM.md` - Event-driven synchronization between components

## Development Workflow Tips

1. **Starting fresh**: `npm run db:reset && npm run dev:all`
2. **After Prisma schema changes**: `npm run db:generate && npm run db:migrate`
3. **Testing scrapers**: Use Python venv directly (see Python Web Scraping section)
4. **API exploration**: Use Swagger UI at http://localhost:3001/api-docs
5. **Real-time debugging**: Check SSE connection in browser DevTools → Network tab
6. **Database inspection**: `npm run db:studio` opens Prisma Studio GUI
