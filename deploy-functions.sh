#!/bin/bash

# Quick script to deploy Supabase Edge Functions
# This fixes CORS issues with Open Food Facts API

set -e

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    echo "⚠️  Project not linked yet"
    echo "Please run: npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Find your project ref at: https://app.supabase.com/project/YOUR_PROJECT/settings/general"
    exit 1
fi

echo "📤 Deploying search-products function..."
npx supabase functions deploy search-products

echo ""
echo "📤 Deploying get-product function..."
npx supabase functions deploy get-product

echo ""
echo "✅ Done! Your functions are now deployed."
echo ""
echo "🧪 Test them:"
echo "  Search: https://YOUR_PROJECT_REF.supabase.co/functions/v1/search-products?query=apple"
echo "  Product: https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-product?barcode=3017620422003"
echo ""
echo "🎉 Now try searching in your app at /app/search"

