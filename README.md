# STIX CUT — MΛGIC Clipping

**Find the most viral moment in a video with Gemini, trim it in the browser with ffmpeg.wasm, and forge matching stickers**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white)

A STIX MAGIC web app for short-form creators. You drop in a video (MP4, MOV or WEBM). **Gemini** analyzes it and returns the viral window (start and end timestamps) plus aesthetic caption suggestions, and the app then **trims that segment entirely in the browser** with ffmpeg.wasm and downloads the clip. A small Express server adds a **sticker forge**: it builds a styled prompt, fetches a generated image from Pollinations, converts it with `sharp` to a 512 × 512 lossless WebP and can post it to a Telegram chat. The server also handles **Stripe** Checkout (a Pro price or a "Stars" price) with a billing portal, and a Telegram archive endpoint. It was scaffolded in Google AI Studio ([app link](https://ai.studio/apps/d87dd599-0490-4761-b4a1-7bc18a4748b3)). It's for STIX MAGIC / ClipsFlow creators cutting hooks from long videos.

## Architecture

```mermaid
flowchart LR
  user([Creator]) --> spa[React SPA · Vite<br/>src/App.tsx]
  spa -->|video analysis| gemini[Google Gemini API<br/>viral window + captions]
  spa -->|trim -ss/-t, copy codec| ffw[ffmpeg.wasm<br/>core loaded from unpkg]
  ffw -->|clip download| user
  spa -->|/api/forge-sticker| server[Express server<br/>server.ts]
  server -->|prompt → image| poll[Pollinations image API]
  server -->|sharp → 512px WebP| server
  server -->|sendMessage / sticker| tg[Telegram Bot API]
  spa -->|/api/create-checkout-session<br/>/api/create-portal-session| server
  server --> stripe[Stripe Checkout + Billing Portal]
  spa -->|/api/archive/telegram| server
```

## Stack

- React 19 + TypeScript, Vite, Tailwind CSS, Motion, Lucide
- `@google/genai` (Gemini), `@ffmpeg/ffmpeg` (ffmpeg.wasm)
- Express (`server.ts`, run with `tsx`), `sharp`, Stripe

## Project structure

```text
src/App.tsx     upload, Gemini analysis, in-browser trim, sticker UI, paywall
server.ts       Express: /api/forge-sticker, /api/create-checkout-session,
                /api/create-portal-session, /api/archive/telegram + Vite / static
fly.toml        Fly.io app config
Dockerfile      static file server image (gostatic)
```

## Local development

```bash
npm install

# fill in the names below
cp .env.example .env.local

# tsx server.ts (API + Vite middleware)
npm run dev

# tsc --noEmit
npm run lint

# vite build → dist/
npm run build

npm run preview
```

> ⚠️ `GEMINI_API_KEY` is injected into the client bundle (`vite.config.ts` `define`), so any public build exposes it. Move the Gemini calls behind the server before shipping publicly.

## Environment variables

Names only (see `.env.example`).

`GEMINI_API_KEY`, `APP_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_STARS_PRICE_ID`, `DISABLE_HMR`

## Deploy

The repo contains a `fly.toml` (Fly.io app `stix-cut-app`, internal port 8073) and a `Dockerfile` that only serves static files with gostatic on port 8080. Those two don't match each other or the Express server, and the static image wouldn't serve the `/api/*` routes. `npm start` (`tsx server.ts`) is the full-stack entry point.
