# BanglaCaption — captions that sell

Bangla sales-caption generator for Facebook sellers: product in → 3 ready
captions with discount math, hashtags and CTA out. Built to demo to real
sellers at ৳299/mo.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB persistence
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` captions live in `.data/` (gitignored file store).

## Features (built feature-by-feature)

- **F1** — rule-based Bangla caption engine (3 tones × 5 categories) +
  provider interface (template live, OpenAI stub) + generate/history API
- **F2** — generator dashboard (one-click copy, history, delete) + demo seed
- **F3** — verified build + live tests (discount math, validation, delete)

## Notes

- `cacheComponents: false` + `dynamic = "force-dynamic"` so every number is live.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
