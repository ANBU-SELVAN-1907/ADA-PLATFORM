# Deloitte AI Insights — Discovery Cockpit v3.0.0

An enterprise-grade, award-winning web application for autonomous codebase architecture discovery. Built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Ultra-Premium Landing Page** — Cinematic animations, floating agent cards, particle effects, ambient orbs, and scan-line effects
- **Multi-Agent Processing Pipeline** — 10 AI agents visualized in a cinematic grid with animated connections, glowing nodes, and real-time terminal output
- **Comprehensive Results Dashboard** — Tabbed interface with overview, tech stack, security, dependencies, infrastructure, telemetry, and documentation
- **Flexible LLM Provider Configuration** — Support for OmniRoute (default), Google Gemini, OpenAI, Anthropic Claude, and Azure OpenAI
- **Enterprise-Grade UI/UX** — Glass morphism, neo-morphism, gradient borders, magnetic buttons, scroll reveals, and smooth page transitions

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Zustand (state management)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## LLM Provider Configuration

Click the **Settings** button (⚙) or press `Cmd/Ctrl + ,` to open the settings panel. Configure:

1. **OmniRoute** (default) — Enterprise routing layer
2. **Google Gemini** — Multimodal AI model
3. **OpenAI** — GPT-4 and GPT-3.5 models
4. **Anthropic Claude** — Claude 3 family
5. **Azure OpenAI** — Microsoft Azure OpenAI Service

Each provider supports custom API keys and endpoint URLs. The active provider is used for all discovery operations.

## Keyboard Shortcuts

- `Cmd/Ctrl + K` — Focus search input
- `Cmd/Ctrl + ,` — Open settings
- `Escape` — Close settings

## Architecture

```
src/
├── components/
│   ├── landing/          # Landing page with cinematic effects
│   ├── processing/       # Agent pipeline visualization
│   ├── results/          # Results dashboard with tabs
│   ├── nav/              # Top navigation
│   ├── settings/         # Settings modal with LLM providers
│   ├── motion/           # Animation components
│   └── ui/               # Reusable UI components
├── api/                  # API client and mock data
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── lib/                  # Utility functions
├── store.ts              # Zustand state management
├── App.tsx               # Main application component
└── main.tsx              # Application entry point
```

## License

© 2026 Deloitte Digital. All rights reserved.
