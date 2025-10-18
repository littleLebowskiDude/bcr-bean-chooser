# Bean Choose - Starter (TypeScript + Vite + Tailwind)

A minimal quiz that recommends coffee beans based on brew method, flavour preference, and caffeine level. 
Designed for standalone hosting on Vercel with deep links to Shopify product pages.

## Quick start
```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy
- Push to GitHub and connect the repo in Vercel.
- Set optional env var `VITE_GA_MEASUREMENT_ID` for GA4.

## Project structure
```
public/data/products.json  # product catalogue (mock)
api/log-event.ts           # serverless endpoint to log analytics events
src/pages/App.tsx          # quiz + results
src/lib/recommend.ts       # scoring logic
src/lib/analytics.ts       # GA4 + endpoint tracking
```

## GA4
- Add your GA4 Measurement ID as an env var `VITE_GA_MEASUREMENT_ID` in Vercel.
- Custom events are sent for: quiz_started, question_answered, results_viewed, click_product.

## Notes
- Replace `public/data/products.json` with a generated file from Shopify metafields in Phase 2.
- Update `shopify_url` values to your exact product handles.
- The serverless endpoint currently logs to Vercel logs - wire this to Sheets/Firestore later if needed.
