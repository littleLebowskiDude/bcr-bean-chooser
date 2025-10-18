# Bean Choose - Product Specification v1.2

**Owner:** Beechworth Coffee Roasters  
**Date:** 15 Oct 2025  
**PM:** ChatGPT  

---

## 1. Problem Statement
Customers are unsure which beans to buy for their machine or brew method, what grind to choose, and which flavours they will enjoy. This uncertainty hurts confidence and conversion. Staff and partners also field repetitive questions.

**Solution**  
A fast, mobile-first quiz that recommends the best beans based on brew method, flavour preference, and caffeine level. It integrates with Shopify to pull products and deep link to product pages for checkout. QR codes on shelves and packaging open the quiz instantly.

---

## 2. Goals and Success Metrics
- **Primary goal:** Drive bean sales and nudge subscriptions.  
- **Secondary goals:** Educate, reduce choice friction, and help in-store customers make confident choices.  
- **KPIs:**
  - Quiz start and completion rates.  
  - Answer breakdown by brew method, flavour, and caffeine level.  
  - Click-through rate to product pages.  
  - Add-to-cart or checkout click rate (where possible).  
  - Subscription attach rate (via product page behaviour).  

---

## 3. Target Users and Use Cases
- **In-store shoppers** scanning a QR on a shelf talker or bag.  
- **Website visitors** exploring beans on beechworthcoffee.com.au.  
- **Retail partners** linking from their sites or POS.  

Key journeys:  
1) Shelf scan → 3 quick answers → Top pick + 2 alternates → Product page.  
2) Website browse → Quiz widget → Recommendations → Product page.  

---

## 4. Product Scope - MVP
- **Standalone site** hosted on Vercel at a subdomain (e.g. choose.beechworthcoffee.com.au).  
- Deep links go directly to the corresponding Shopify product page (no add-to-cart yet).  
- Mobile-first responsive UI optimised for QR use cases.  
- 3 core questions:  
  1) Brew method  
  2) Flavour preference  
  3) Caffeine level  
- Results view:  
  - Top Choice card + 2 Alternatives.  
  - Price, tasting notes, origin highlights, CTA: **View on Shopify**.  
  - Brewing tip matching the user’s chosen brew method.  

---

## 5. Content Strategy
Tone: friendly, plain-language, helpful - no coffee snobbery.  
Copy snippets:
- Header: “Find your perfect brew in under 30 seconds.”  
- Button: “Show my beans.”  
- Brewing tip: “For AeroPress, start with a 1:15 ratio and 2-minute steep.”  

---

## 6. Quiz Design
### Questions
**Q1. How do you brew at home or work?**  
Options: Espresso machine, Stovetop / Moka pot, Pour-over / Chemex, French Press / Plunger, (optional) Filter drip, (optional) Cold brew.  

**Q2. Which flavour direction are you into today?**  
Options: Chocolatey and nutty, Caramel and sweet, Balanced and smooth, Fruity and bright, Floral and delicate, Dark and bold.  

**Q3. Caffeine preference?**  
Options: Regular, Half caf, Decaf.  

---

## 7. Brewing Tips
| Method | Tip |
|--------|-----|
| Espresso machine | Use a fine grind, 18–20 g in your basket, aim for ~30 ml in 25–30 sec. |
| Stovetop / Moka pot | Use a fine (between filter & espresso) grind, pre-heat water, and remove just before it sputters. |
| Pour-over / Chemex | Use medium grind, bloom first, then pour slowly in circles for even extraction. |
| French Press / Plunger | Use coarse grind, steep 3-4 min, press slowly to reduce sediment. |
| Filter drip | Use medium grind, filter paper, and steady pour for consistency. |
| Cold Brew | Use coarse grind, steep 12–18 hrs, filter before serving. |

---

## 8. Recommendation Logic
Each product defines weights for: `brew_compatibility`, `flavour_profile`, and `caffeine`.  
The algorithm ranks all products and displays top 3 matches, with one highlighted as the **Top Choice**.  

---

## 9. Shopify Integration
- Pull product data via Shopify API or from a cached `products.json` file.  
- Store attributes in Shopify metafields (`custom.flavour_profile`, `custom.brew_compatibility`, `custom.caffeine`).  
- Deep link to product pages: `https://beechworth.coffee/products/{handle}`.  

---

## 10. Hosting and Deployment
- **Platform:** Vercel (recommended).  
- **Repo:** GitHub → auto-deploy via Vercel.  
- **Domain:** choose.beechworthcoffee.com.au.  
- **Tech stack:** React + TypeScript + Tailwind CSS + Vite.  
- **Static data:** Products cached nightly or via webhook.

Benefits: instant deployment, CDN edge caching, simple rollbacks, HTTPS by default.

---

## 11. Analytics and Tracking
**Purpose:** Understand customer preferences, usage patterns, and conversion intent.

### Metrics to capture
- `quiz_started`  
- `question_answered` (with question + value)  
- `results_viewed`  
- `click_product` (product handle + position in list)  
- `quiz_completed`  
- `utm_source` / `utm_medium` from QR parameters  

### Implementation options
- **GA4:** Basic site and funnel tracking.  
- **Vercel Edge Function:** Serverless endpoint logs JSON events to Google Sheets, Firestore, or Supabase.  
- **Hybrid setup (recommended):** GA4 for traffic + Vercel logging for detailed answer data.

### Example Event JSON
```json
{
  "event": "question_answered",
  "session_id": "a83f7b1d",
  "question_id": "brew_method",
  "answer": "Stovetop / Moka pot",
  "sequence": 1,
  "timestamp": "2025-10-15T03:14:00Z",
  "utm_source": "retail_partner_oxley"
}
```

### Reporting Dashboard
A simple Looker Studio or Google Sheets dashboard showing:

**A. Overview Metrics**  
- Total quiz starts, completion rate, avg time, CTR to product pages, top UTM sources.

**B. Brew Method Insights**  
- Bar chart showing % per method.

**C. Flavour Preferences**  
- Pie chart of flavour choices.

**D. Caffeine Preferences**  
- Donut chart: Regular / Decaf / Half-Caf.

**E. Product Clicks**  
- Table showing top clicked products and CTR.

**F. Partner Breakdown**  
- Stacked chart by `utm_source` showing retail partner engagement.

All tracking anonymous and cookie-free unless site cookies already exist.

---

## 12. Roadmap
**MVP (2 weeks)**  
- Quiz flow (3 questions).  
- Static `products.json` with example products.  
- Results with Top 3 and deep links.  
- Basic GA4 tracking.  

**Phase 2**  
- Automated Shopify sync.  
- Custom analytics endpoint for detailed event storage.  
- UTM-based reporting for retail partners.  

**Phase 3**  
- A/B test question wording.  
- Add optional “body” question.  
- PWA install option.  
- Brew tip CMS for quick edits.  

---

## 13. Acceptance Criteria
- Loads in < 1.5 s on mid-range phone.  
- Works standalone on Vercel with subdomain.  
- 3 mandatory questions, accessible controls.  
- Results show Top Choice + 2 alternatives with product info.  
- Links go directly to Shopify product pages.  
- Events logged to GA4 or analytics endpoint.  
- QR scan opens instantly with no blockers.

---

## 14. Next Steps
1. Set up Vercel project and GitHub repo.  
2. Create a `products.json` with product handles and metafields from Shopify.  
3. Implement quiz flow and analytics event tracking.  
4. Generate QR codes for in-store use.  
5. Review data after 100 responses to refine recommendations.

---

## 15. Analytics Architecture and Dashboard

### Schema Summary
| Event | Description | Key Fields |
|--------|--------------|-------------|
| `quiz_started` | When quiz begins | session_id, utm_source |
| `question_answered` | When a question is answered | session_id, question_id, answer, timestamp |
| `results_viewed` | When results screen shown | session_id, top_choice, alt_1, alt_2 |
| `click_product` | When user clicks product | product_handle, position, timestamp |
| `quiz_completed` | All 3 questions answered | session_id, duration |

### Data Flow
- **Frontend:** Sends JSON events via fetch() to `/api/log-event`.  
- **Backend (Vercel Edge Function):** Appends to Google Sheets or Firestore.  
- **Analytics (GA4):** Parallel gtag event for funnel tracking.  

### Dashboard Layout
- **Overview:** total starts, completions, CTR, top sources.  
- **Brew Methods:** bar chart (method vs count).  
- **Flavour Preferences:** pie chart.  
- **Caffeine Breakdown:** donut chart.  
- **Product Engagement:** table of top products clicked.  
- **Partner Attribution:** stacked chart by UTM source.

### Purpose
Allow Angus and team to see how people use the quiz, which brews are most common, which flavours trend, and whether retail QR codes are driving engagement.

