# Nutri Track

**Elevator pitch:** A Vue + Capacitor app where users sign in, log foods/drinks via search or barcode, and see daily nutrients at a glance with easy day-to-day comparisons.

**Primary user goal:** Track today's intake quickly; review trends without friction.

## 🚀 Quick Start

**New to the project?** → Read the [Quick Start Guide](./docs/QUICK_START.md) to get running in 5 minutes!

**Key Commands:**
```bash
npm install              # Install dependencies
npm run dev              # Start dev server
deploy-functions.bat     # Deploy Supabase Edge Functions (Windows)
```

# MVP scope (MoSCoW)

**Must-have** ✅

* ✅ Auth (email/password)
* ✅ Dashboard: today's calories + key macros (kcal, protein, carbs, fat); switch day (prev/next)
* ✅ "Add item" flow:
  * ✅ Search OpenFoodFacts by text
  * ✅ Add serving(s) to today; auto-calc nutrients
  * 🚧 Scan barcode to lookup product (API ready, needs camera integration)
* 🚧 History view: list of past days (can navigate days, but no history list yet)

**Should-have**

* ✅ Edit/delete logged items
* ✅ Cache product lookups locally (perf/offline)
* ✅ Show additional micronutrients (fiber, sugar, sodium)
* 🚧 Basic targets (calorie goal) and progress ring

**Could-have**

* Quick-add recent/favorites
* Multiple meals (breakfast/lunch/dinner)
* Day comparison view

**Won't-have (yet)**

* Social features
* Complex coaching/AI
* Custom food creation (we'll add later)

# App structure (routes)

* `/` — Landing / marketing
* `/auth` — Sign in / Sign up
* `/app/dashboard` — Today view (+ date picker / arrows)
* `/app/add` — Search + barcode scanner
* `/app/product/:code` — Product details (confirm/add)
* `/app/history` — Calendar or list of days

# Core components (first pass)

* `StatsCard`, `MacroRing`, `DaySwitcher`
* `SearchBox`, `SearchResults`, `ProductCard`
* `BarcodeScanner` (web + Android)
* `AddQuantityForm` (serving size, grams, multiplier)
* `LogList` (today’s items)
* `NavbarApp`, `NavbarLanding`

# State management (Pinia stores)

* `useAuthStore` – session/user
* `useDayStore` – selected date, today’s entries, totals
* `useSearchStore` – query, results, loading
* `useSettingsStore` – goals, units, preferences
* `useCacheStore` – product cache by `barcode` or `product_id`

# Data model (minimal)

**users** (from auth provider)

**entries**

* `id`, `user_id`, `date` (YYYY-MM-DD), `created_at`

**entry\_items**

* `id`, `entry_id`, `product_code` (barcode or OFF id)
* `label` (snapshot of product name)
* `serving_grams`, `quantity`
* `kcal`, `protein_g`, `carb_g`, `fat_g` (snapshot for stability)

**products\_cache** (optional)

* `code`, `name`, `brand`, `nutriments` JSON, `last_fetched_at`

> We snapshot nutrients into `entry_items` so your historical days don’t change if OFF updates a product later.

# Integrations

* **OpenFoodFacts API** ✅

  * Text search: query endpoint
  * Barcode: lookup by code
  * Smart caching with Supabase (7-day cache, offline support)
  * See: [Open Food Facts Integration Guide](./docs/OPEN_FOOD_FACTS_INTEGRATION.md)
* **Barcode scanning**

  * Web: `@zxing/browser` (good in desktop/mobile browsers)
  * Android: Capacitor plugin (e.g., ML Kit barcode) or reuse ZXing via camera stream

# Tech picks (Vue-side)

* Vue 3 + Vite, **Vue Router**, **Pinia**, Javascript
* UI: Vuetify/Naive
* Charts: `vue-chartjs` or a simple SVG macro ring
* Capacitor for Android packaging (later)

# First 3 milestones (tiny, teachable slices)

1. **Scaffold + routing + auth shell**

   * Pages + navigation (no real auth yet)
   * Mock user state in Pinia to learn flows
2. **Dashboard + day switching + local logging**

   * Pinia store for day + entries (in-memory/localStorage)
   * Add simple “Add item” dialog that takes manual numbers (no API yet)
3. **OpenFoodFacts search + add**

   * Build search service + results list
   * Product details page + “Add” with serving math
   * (Then barcode scanning)

After that, swap mock auth/storage for real backend, and package with Capacitor.

# Documentation

* **[Setup Guide](./docs/SETUP.md)** - Initial setup and configuration
* **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Database migrations walkthrough
* **[Deploying Edge Functions](./docs/DEPLOYING_EDGE_FUNCTIONS.md)** - Fix CORS issues (required!)
* **[Open Food Facts Integration](./docs/OPEN_FOOD_FACTS_INTEGRATION.md)** - API usage and caching details

# Features

## ✅ Implemented

- **Authentication** - Email/password signup and login with Supabase Auth
- **Food Search** - Search 3M+ products from Open Food Facts
- **Smart Caching** - Products cached locally for offline use (7-day expiry)
- **Daily Dashboard** - View today's nutrition totals with day navigation
- **Food Logging** - Add foods with custom serving sizes
- **Edit/Delete** - Modify or remove logged items
- **Macro Tracking** - Calories, protein, carbs, fat, fiber, sugar, sodium
- **Responsive UI** - Works on desktop and mobile browsers

## 🚧 In Progress

- **Barcode Scanning** - Camera integration for mobile
- **History View** - Calendar view of past entries
- **Goals & Targets** - Set daily calorie/macro goals

## 📱 Mobile App

- Capacitor setup complete for Android
- Ready to build APK for testing

# Attribution

This app uses data from [Open Food Facts](https://openfoodfacts.org), a collaborative, free and open database of food products from around the world.
