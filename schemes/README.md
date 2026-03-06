# Scheme Finder Chatbot

Farmer-friendly chatbot that asks 14 questions and suggests Indian government schemes via Gemini.

## Setup

1. **Vercel:** Add environment variable `GEMINI_API_KEY` in Project → Settings → Environment Variables (get key from [Google AI Studio](https://aistudio.google.com/apikey)).
2. **Local:** Create `.env` in repo root with `GEMINI_API_KEY=your_key`. The API route reads it when you run `vercel dev` or deploy.

## Run locally

From repo root:

- Build all: `npm run build`
- Or run only schemes: `cd schemes && npm run dev` (then open http://localhost:5173/schemes/ with correct base)

To test the API locally, use `vercel dev` from the repo root so `/api/schemes-advice` is available.
