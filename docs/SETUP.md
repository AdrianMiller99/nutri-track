# Nutri Track Setup Guide

## Prerequisites

- Node.js 20.19+ or 22.12+
- A Supabase account and project
- (Optional) Android Studio for mobile builds

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project settings at:  
https://app.supabase.com/project/YOUR_PROJECT/settings/api

### 3. Run Database Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### Option B: Manual SQL Execution

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy the contents of `supabase/migrations/001_create_products_cache.sql`
3. Paste and run it in the SQL Editor

### 4. Deploy Edge Functions (Required to fix CORS)

Deploy the proxy functions to avoid CORS issues:

```bash
# Login to Supabase CLI
npx supabase login

# Link your project (if not done above)
npx supabase link --project-ref your-project-ref

# Deploy the functions
npx supabase functions deploy search-products
npx supabase functions deploy get-product
```

**Detailed instructions**: See [Deploying Edge Functions](./DEPLOYING_EDGE_FUNCTIONS.md)

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Building for Android

### 1. Sync Capacitor

```bash
npx cap sync android
```

### 2. Open in Android Studio

```bash
npx cap open android
```

### 3. Build and Run

Use Android Studio to build and deploy to emulator or device.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Project Structure

```
nutri-track/
├── src/
│   ├── views/          # Page components
│   ├── stores/         # Pinia stores
│   ├── services/       # API services
│   ├── lib/            # Shared utilities
│   └── router/         # Vue Router config
├── supabase/
│   └── migrations/     # Database migrations
├── docs/               # Documentation
└── android/            # Capacitor Android project
```

## Common Issues

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection fails

- Verify your `.env` file exists and has correct values
- Check that you're using `VITE_` prefix (required for Vite)
- Restart the dev server after changing `.env`

### Android build fails

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Next Steps

1. Read [Open Food Facts Integration](./OPEN_FOOD_FACTS_INTEGRATION.md)
2. Check out the [README.md](../README.md) for MVP scope
3. Start building! 🚀

