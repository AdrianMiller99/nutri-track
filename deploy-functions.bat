@echo off
REM Quick script to deploy Supabase Edge Functions (Windows)
REM This fixes CORS issues with Open Food Facts API

echo 🚀 Deploying Supabase Edge Functions...
echo.

REM Check if project is linked
if not exist .supabase\config.toml (
    echo ⚠️  Project not linked yet
    echo Please run: npx supabase link --project-ref YOUR_PROJECT_REF
    echo.
    echo Find your project ref at: https://app.supabase.com/project/YOUR_PROJECT/settings/general
    exit /b 1
)

echo 📤 Deploying search-products function...
call npx supabase functions deploy search-products

echo.
echo 📤 Deploying get-product function...
call npx supabase functions deploy get-product

echo.
echo ✅ Done! Your functions are now deployed.
echo.
echo 🧪 Test them:
echo   Search: https://YOUR_PROJECT_REF.supabase.co/functions/v1/search-products?query=apple
echo   Product: https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-product?barcode=3017620422003
echo.
echo 🎉 Now try searching in your app at /app/search

