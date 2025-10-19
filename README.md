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
public/data/products.csv  # product catalogue + scoring matrix (editable CSV)
public/data/weights.csv   # question weights (editable CSV)
api/log-event.ts          # serverless endpoint to log analytics events
src/pages/App.tsx         # quiz + results
src/lib/recommend.ts      # scoring logic
src/lib/analytics.ts      # GA4 + endpoint tracking
```

## GA4
- Add your GA4 Measurement ID as an env var `VITE_GA_MEASUREMENT_ID` in Vercel.
- Custom events are sent for: quiz_started, question_answered, results_viewed, click_product.

## Notes
- Replace `public/data/products.csv` with a generated file from Shopify metafields in Phase 2 (keep the same column structure).
- Update `shopify_url` values to your exact product handles.
- The serverless endpoint currently logs to Vercel logs - wire this to Sheets/Firestore later if needed.

## Adjusting recommendation weights (business-friendly)
1. Open `public/data/weights.csv` in Excel, Numbers, or Google Sheets. You will see two columns: `question` and `weight`. Supported question keys are `brew`, `flavour`, `coffeeStyle`, and `caffeine`.
2. Update the numeric values to shift emphasis. For example, increasing the `coffeeStyle` weight nudges the quiz to care more about milk vs. black preferences.
3. Ensure the weights stay non-negative. The app automatically normalises them so they behave like percentages; there is no need to make them add up to 1 manually (though doing so keeps it tidy).
4. Save / export the file as CSV (comma-separated) and replace the existing `public/data/weights.csv`.
5. Redeploy the site. The app fetches the CSV at runtime with no caching, so the latest weights take effect as soon as the new file is live.

### Hosting the CSV elsewhere
If you prefer to edit a copy stored in cloud storage (e.g. S3, Dropbox, Google Drive direct download), upload the CSV and set an environment variable `VITE_WEIGHTS_CSV_URL` to the public URL. The app will fetch that URL instead of the bundled file, so your team can update weights without touching the repo. Make sure the link returns raw CSV data without requiring authentication.

## Adjusting product-level scores (business-friendly)
1. Open `public/data/products.csv` in your spreadsheet tool of choice. Each row is a product; the `brew_*`, `flavour_*`, `caffeine_*`, and `style_*` columns represent the score this product should receive (0 to 1) when a customer picks that answer.
2. Update the numeric values to rebalance results. Example: setting `flavour_fruity` to `1` and `flavour_chocolatey` to `0.2` means the product strongly favours fruity answers, while bumping `style_milk` makes it win for milk-based drinks.
3. Keep values between 0 and 1. The quiz will clamp anything outside that range and automatically normalise the brew/flavour/caffeine question weights before scoring.
4. Save / export the sheet as CSV (comma-separated) and replace `public/data/products.csv`, or upload it to shared storage and set `VITE_PRODUCTS_CSV_URL` to the public link. The app fetches the CSV at runtime without caching, so the latest numbers apply as soon as the new file is live.
5. Redeploy (only required when editing the local file). If you use the environment-variable approach, simply updating the hosted CSV is enough.
