# Mirror

Mirror is a Vana Cup app that generates a shareable AI persona card from ChatGPT or Claude conversation history.

## Features

- ChatGPT connect flow via Vana request/status/read API routes (`chatgpt.conversations`)
- Claude connect flow via Vana request/status/read API routes (`claude.conversations`)
- Persona engine with Gemini integration and deterministic fallback
- Server-side card renderer (SVG to PNG) using color-family templates
- Result and permanent share pages with OG image endpoint
- Live ticker of recently generated cards

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## External requirements

- `GEMINI_API_KEY`
- Vana app credentials (`VANA_APP_PRIVATE_KEY`, `VANA_APP_URL`, network setup)
- Vana connector sources (`VANA_CHATGPT_CONNECTOR_SOURCE`, `VANA_CLAUDE_CONNECTOR_SOURCE`)
- KV credentials for persistent production storage
- Mainnet identity registration and escrow funding for production Vana reads/writes

## Test

```bash
npm test
npm run lint
npm run build
```
