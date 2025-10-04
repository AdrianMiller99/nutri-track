# Deploying Supabase Edge Functions

To fix CORS issues with the Open Food Facts API, we use Supabase Edge Functions as a proxy. This guide explains how to deploy them.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase account and project

## Step 1: Login to Supabase CLI

```bash
npx supabase login
```

This will open a browser for authentication.

## Step 2: Link Your Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
1. Go to https://app.supabase.com/
2. Select your project
3. Look at the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`
4. Or go to Settings → General → Reference ID

## Step 3: Deploy the Edge Functions

Deploy both functions at once:

```bash
npx supabase functions deploy search-products
npx supabase functions deploy get-product
```

Or deploy individually:

```bash
# Search function
npx supabase functions deploy search-products

# Product lookup function
npx supabase functions deploy get-product
```

## Step 4: Verify Deployment

After deployment, you should see output like:

```
✓ Deployed Function search-products in us-east-1
✓ Deployed Function get-product in us-east-1
```

You can test the functions in your browser:

```
# Search
https://YOUR_PROJECT_REF.supabase.co/functions/v1/search-products?query=apple

# Product lookup
https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-product?barcode=3017620422003
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

## Step 5: Test in Your App

Restart your dev server and try searching again:

```bash
npm run dev
```

Go to `/app/search` and search for a product. It should now work without CORS errors!

## Troubleshooting

### "Command not found: supabase"

Install the CLI globally:

```bash
npm install -g supabase
```

### "Project not linked"

Run the link command again with the correct project ref:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Functions deployed but getting 404

1. Check that your `VITE_SUPABASE_URL` in `.env` is correct
2. Make sure the URL doesn't have a trailing slash
3. Verify the functions are deployed in the Supabase Dashboard:
   - Go to https://app.supabase.com/project/YOUR_PROJECT/functions

### Still getting CORS errors

1. Make sure `USE_EDGE_FUNCTIONS` is set to `true` in `src/services/openFoodFacts.js`
2. Clear your browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the browser console for the actual URL being called

## Updating Functions

If you make changes to the edge functions, redeploy them:

```bash
npx supabase functions deploy search-products
npx supabase functions deploy get-product
```

## Viewing Logs

To see function logs:

```bash
# View logs for search function
npx supabase functions logs search-products

# View logs for product function
npx supabase functions logs get-product

# Follow logs (live tail)
npx supabase functions logs search-products --follow
```

Or view them in the Supabase Dashboard:
https://app.supabase.com/project/YOUR_PROJECT/functions

## Local Development (Optional)

You can run edge functions locally for development:

```bash
# Start local Supabase (includes functions)
npx supabase start

# Your functions will be available at:
# http://localhost:54321/functions/v1/search-products
# http://localhost:54321/functions/v1/get-product
```

To use local functions, update `src/services/openFoodFacts.js`:

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
```

## Cost

Edge Functions are free for the first 500K requests/month on Supabase's free tier, then $2 per 1M requests. For a personal nutrition tracking app, you'll likely stay well within the free tier.

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://docs.deno.com/deploy/manual)

