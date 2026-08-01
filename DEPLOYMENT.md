# Mirror production deployment

This folder is the clean production source package for Mirror. Upload this folder to GitHub, then connect the GitHub repository to a Node-capable Next.js host such as Vercel, Render, Railway, or a VPS.

## Build settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- Node version: use Node 22 LTS or newer

This app uses dynamic API routes and server rendering, so it should not be deployed as a static GitHub Pages site.

## Environment variables

Copy the names from `.env.example` into your hosting provider's environment variable settings. Do not commit `.env.local`.

Required production integrations include:

- `GEMINI_API_KEY`
- Vana app credentials
- Vana connector source ids for ChatGPT and Claude
- KV / Redis credentials for persistent production storage

## Local production check

```bash
npm install
npm run build
npm run start
```
