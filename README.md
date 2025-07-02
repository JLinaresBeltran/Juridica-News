# 🤖 3 AI Amigos: Multi-Agent Product Development Team

> Transform your development workflow with AI-powered Product Manager, UX Designer, and Claude Code working in perfect harmony. Build production-ready multi-agent systems in hours, not months.

## 📖 Table of Contents

- [Overview](#-overview)
- [Repository Structure](#-repository-structure)
- [Quick Start](#-quick-start)
- [Complete Setup Guide](#-complete-setup-guide)
- [Health Insight System Demo](#-health-insight-system-demo)
- [Creating Your Own Use Case](#-creating-your-own-use-case)
- [Technical Architecture](#-technical-architecture)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [Resources](#-resources)

## 🌟 Overview

The **3 AI Amigos** revolutionizes how we build multi-agent systems by orchestrating three specialized AI agents that mirror traditional software development roles:

1. **Product Manager Agent** - Creates PRDs, user stories, and technical architecture
2. **UX Designer Agent** - Designs interfaces, creates prototypes, and defines experiences
3. **Claude Code Agent** - Implements the complete system following specifications

This pattern is based on Anthropic's research showing **90.2% performance improvement** with multi-agent systems over single agents.

<p align="center">
  <img src="docs/images/ai-amigos-diagram.png" alt="3 AI Amigos Team Diagram" width="100%" />
</p>

The 3 AI Amigos orchestrates these specialized AI agents in a continuous development cycle:

1. **Define & Plan** - Product Owner collaborates with PM Agent to create requirements and architecture
2. **Design & Iterate** - Requirements flow to UX Designer Agent for mockups and prototypes  
3. **Build & Test** - UX artifacts guide Claude Code to implement the complete system

This creates a seamless flow where human vision is amplified by AI expertise at every stage.

### 🎯 Key Benefits

- ⚡ **10x Faster Development** - From idea to working system in hours
- 🔄 **Reusable Patterns** - Technical guides work for any domain
- 🎨 **Professional UX** - AI-designed interfaces that users love
- 🏗️ **Production Ready** - Following Anthropic's best practices
- 🔧 **Domain Agnostic** - Works for health, finance, legal, education, etc.

## 📁 Repository Structure

```
3-AMIGO-AGENTS/
│
├── 🤖 agents/                    # Reusable agent configurations
│   ├── pm-agent/                 # Product Manager Agent
│   │   ├── config/               # Agent instructions & description
│   │   └── example-prompts/      # What to submit to PM
│   ├── ux-agent/                 # UX Designer Agent
│   │   ├── config/               # Agent instructions & description
│   │   └── example-prompts/      # What to submit to UX
│   └── code-agent/               # Claude Code configuration
│       └── config/               # CLAUDE.md template
│
├── 📚 technical-guides/          # Domain-agnostic patterns
│   ├── implementation-guide.md   # Multi-agent implementation
│   ├── multi-agent-patterns.md   # Orchestrator-worker patterns
│   └── streaming-patterns.md     # Real-time SSE updates
│
├── 🏥 use-cases/                 # Domain-specific examples
│   └── multi-agent-health-insight-system/
│       ├── health-domain-requirements.md
│       ├── multi-agent-architecture-brief.md
│       ├── tool-interface-document.md
│       └── Anthropic-Blog-[...].txt
│
├── 📖 docs/                      # Setup guides
│   ├── demo-setup-guide.md
│   ├── po-document-checklist.md
│   ├── requirements-directory-structure.md
│   └── images/
│       └── ai-amigos-diagram.png
│
└── README.md                     # You are here!
```

## 🚀 Quick Start

### Prerequisites

- **Claude Desktop** or **Claude.ai** account (for PM and UX agents)
- **Claude Code** installed ([Get it here](https://claude.ai/code))
- **VSCode** or preferred editor
- Basic understanding of multi-agent systems ([Read Anthropic's blog](https://www.anthropic.com/engineering/built-multi-agent-research-system))

### 30-Second Overview

1. **Create Agents** → Set up PM and UX agents in Claude Desktop
2. **Run PM Agent** → Upload domain requirements, get product specs
3. **Run UX Agent** → Upload PM outputs, get designs
4. **Setup Workspace** → Organize all outputs for Claude Code
5. **Run Claude Code** → Get working system!

## 📋 Complete Setup Guide

### Phase 1: Create Your AI Agents

#### 1.1 Create Product Manager Agent

**In Claude Desktop:**
1. Click "Create New Project"
2. Name: "Product Manager Agent"
3. Description: Copy from `agents/pm-agent/config/pm-agent-description.md`
4. Copy instructions from: `agents/pm-agent/config/pm-agent-instructions.md`
5. Paste into project instructions
6. Save project

#### 1.2 Create UX Designer Agent

**In Claude Desktop:**
1. Click "Create New Project"
2. Name: "UX Designer Agent"
3. Description: Copy from `agents/ux-agent/config/ux-agent-description.md`
4. Copy instructions from: `agents/ux-agent/config/ux-designer-agent-instructions.md`
5. Paste into project instructions
6. Save project

### Phase 2: Prepare Your Documents

#### For Health Insight System Demo:
Use provided documents in `use-cases/multi-agent-health-insight-system/`:
- ✅ All documents ready to use
- ✅ Skip to Phase 3

#### For Custom Use Case:
Create these documents (use health examples as templates):

1. **[domain]-requirements.md** - Your domain expertise
2. **multi-agent-architecture-brief.md** - Why multi-agent
3. **tool-interface-document.md** - If you have pre-built tools
4. **Anthropic blog** - [Link](https://www.anthropic.com/engineering/built-multi-agent-research-system)

### Phase 3: Run the AI Amigos

#### 3.1 Product Manager Agent

1. Open PM Agent project in Claude Desktop
2. Start new conversation
3. Copy prompt from: `agents/pm-agent/example-prompts/po-prompt-for-pm-agent.md`
4. Customize for your domain
5. Upload your 4 documents
6. Submit and wait for outputs

**PM Agent will create:**
- 📄 PRD.md
- 📝 user-stories.md
- 🏗️ system-architecture.md
- 🔌 api-specification.md
- 📊 data-models.md

#### 3.2 UX Designer Agent

1. Open UX Agent project
2. Start new conversation  
3. Copy prompt from: `agents/ux-agent/example-prompts/po-prompt-for-ux-agent.md`
4. Upload all PM outputs
5. Submit and wait for designs

**UX Agent will create:**
- 🎨 design-system.md
- 🧩 component-specs.md
- 📱 prototypes/
- 🖼️ mockups/

### Phase 4: Prepare Claude Code Workspace

#### 4.1 Create Workspace Structure

```bash
mkdir my-awesome-system
cd my-awesome-system

# Create directory structure
mkdir -p backend/tools
mkdir -p frontend
mkdir -p requirements/{technical,product,architecture,ux,reference}
```

#### 4.2 Copy Technical Guides (Reusable)

```bash
# Copy from this repo's technical-guides/
cp path/to/3-AMIGO-AGENTS/technical-guides/* requirements/technical/
```

#### 4.3 Add PM Outputs

Place in `requirements/`:
- product/ → PM's product documents
- architecture/ → PM's technical documents

#### 4.4 Add UX Outputs

Place in `requirements/ux/`:
- All design documents
- prototypes/ folder
- mockups/ folder

#### 4.5 Add Reference Documents

Place in `requirements/reference/`:
- Your original domain requirements
- Tool documentation (if any)
- Anthropic blog

#### 4.6 Create Minimal CLAUDE.md

Create `CLAUDE.md` in workspace root:

```markdown
# CLAUDE.md

You are implementing [Your System Name] - [Brief Description].

## Start Here
1. Read the PRD: `requirements/product/PRD.md`
2. Review technical patterns: `requirements/technical/implementation-guide.md`
3. Check for provided tools: `backend/tools/` (if any exist, DO NOT modify them)
4. Follow the implementation phases in the technical guide

## Quick Links
- Architecture: `requirements/architecture/`
- UX Designs: `requirements/ux/`
- Domain Info: `requirements/reference/`

Begin by understanding the complete system from the PRD.
```

### Phase 5: Run Claude Code

1. Open terminal in your workspace
2. Run: `claude-code`
3. Claude Code will:
   - Read CLAUDE.md
   - Analyze all requirements
   - Create complete implementation
   - Provide running instructions

## 🏥 Health Insight System Demo

To run the complete health insight system demo:

### What You'll Build

A sophisticated multi-agent health analysis system featuring:
- 🧠 **Chief Medical Officer (CMO)** orchestrator agent
- 👥 **8 Medical Specialists** (Cardiology, Endocrinology, etc.)
- 📊 **Real-time Analysis** with SSE streaming
- 📈 **Dynamic Visualizations** generated by AI
- 🎨 **Beautiful Medical UI** with glassmorphism effects

### Demo Steps

1. **Use Provided Health Documents**
   ```
   use-cases/multi-agent-health-insight-system/
   ├── health-domain-requirements.md
   ├── multi-agent-architecture-brief.md
   ├── tool-interface-document.md
   └── Anthropic-Blog-[...].txt
   ```

2. **Follow Phases 1-5** above with health documents

3. **Expected Output Structure**
   ```
   health-insight-system/
   ├── backend/
   │   ├── main.py              # FastAPI server
   │   ├── services/            # Multi-agent orchestration
   │   ├── agents/              # CMO + specialists
   │   └── tools/               # Pre-built health tools
   ├── frontend/
   │   ├── src/
   │   │   ├── components/      # React components
   │   │   └── services/        # API integration
   │   └── package.json
   └── requirements/            # All specifications
   ```

4. **Run the System**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   
   # Frontend (new terminal)
   cd frontend
   npm install
   npm run dev
   ```

5. **Access at** http://localhost:3000

## 🎯 Creating Your Own Use Case

### Example: Financial Advisory System

1. **Create Domain Documents**
   ```markdown
   # finance-domain-requirements.md
   - Asset classes: stocks, bonds, crypto
   - Analysis types: risk, performance, allocation
   - User queries: "Optimize my portfolio", "Tax implications"
   ```

2. **Run Through AI Amigos**
   - PM creates: Chief Investment Officer + specialists
   - UX creates: Financial dashboards
   - Claude Code: Implements complete system

### Example: Legal Document Analyzer

1. **Create Domain Documents**
   ```markdown
   # legal-domain-requirements.md
   - Document types: contracts, patents, compliance
   - Analysis needs: risk assessment, clause extraction
   - Specialists: Contract Lawyer, IP Expert, Compliance Officer
   ```

2. **Same pattern, different domain!**

## 🔧 Technical Architecture

### Multi-Agent Orchestration

```python
# The pattern works like this:
Orchestrator (CMO/CIO/Senior Counsel)
    ├── Analyzes request complexity
    ├── Creates specialist tasks
    ├── Executes specialists in parallel
    ├── Synthesizes results
    └── Generates visualizations
```

### Real-time Streaming

```typescript
// SSE provides live updates:
- Specialist activation
- Progress indicators  
- Partial results
- Final synthesis
```

### Key Technologies

- **Backend**: FastAPI, Anthropic SDK, SSE
- **Frontend**: React, TypeScript, Tailwind CSS
- **Patterns**: Orchestrator-Worker, Progressive Disclosure
- **Based on**: [Anthropic's Research](https://www.anthropic.com/engineering/built-multi-agent-research-system)

## ❓ FAQ

<details>
<summary><b>Can I use this for non-health domains?</b></summary>

Absolutely! The 3 AI Amigos is domain-agnostic. Just create your own domain documents and follow the same process. We've included examples for finance, legal, and education systems.
</details>

<details>
<summary><b>Do I need to know how to code?</b></summary>

No! The AI agents handle all the coding. You just need to understand your domain and be able to describe what you want to build.
</details>

<details>
<summary><b>What if I already have some tools/APIs?</b></summary>

Perfect! Document them in a tool-interface-document.md and place any pre-built tools in backend/tools/. The agents will use them.
</details>

<details>
<summary><b>How long does the whole process take?</b></summary>

Typically 2-4 hours from start to working system:
- PM Agent: 30-45 minutes
- UX Agent: 30-45 minutes  
- Workspace setup: 15 minutes
- Claude Code: 45-90 minutes
</details>

<details>
<summary><b>Can I modify the agent instructions?</b></summary>

Yes! The agent instructions in `agents/*/config/` can be customized for your needs. Just maintain the core structure.
</details>

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🎯 Add new use cases
- 📚 Improve documentation
- 🐛 Report issues
- ⭐ Star this repo!

## 📚 Resources

### Essential Reading
- 📖 [Blog: Building Multi-Agent Systems with 3 AI Amigos](#) *(Coming Soon)*
- 🎥 [Video: Complete Demo Walkthrough](#) *(Coming Soon)*
- 📄 [Anthropic's Multi-Agent Research](https://www.anthropic.com/engineering/built-multi-agent-research-system)

### Get Help
- 💬 [Discussions](https://github.com/your-username/3-AMIGO-AGENTS/discussions)
- 🐛 [Issues](https://github.com/your-username/3-AMIGO-AGENTS/issues)
- 📧 Email: your.email@example.com

### Connect
- 🐦 Twitter: [@yourhandle](#)
- 💼 LinkedIn: [Your Name](#)
- 🌐 Website: [yourwebsite.com](#)

---

<p align="center">
  <b>🌟 If this helps you build something amazing, please star the repo and share your story!</b>
</p>

<p align="center">
  Made with ❤️ by [Your Name] using the 3 AI Amigos
</p>

<p align="center">
  <a href="#-3-ai-amigos-multi-agent-product-development-team">⬆ Back to Top</a>
</p>