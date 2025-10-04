// Supabase Edge Function to proxy Open Food Facts search API
// This avoids CORS issues when calling from the browser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OFF_API_BASE = 'https://world.openfoodfacts.org'
const USER_AGENT = 'NutriTrack/0.1.0 (https://github.com/AdrianMiller99/nutri-track)'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('pageSize') || '25'

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build Open Food Facts API URL
    const params = new URLSearchParams({
      search_terms: query,
      page: page,
      page_size: pageSize,
      json: '1',
      fields: 'code,product_name,product_name_en,brands,image_url,image_front_url,nutriments,serving_size,serving_quantity,categories,labels,nutriscore_grade,nova_group'
    })

    const offUrl = `${OFF_API_BASE}/cgi/search.pl?${params}`
    
    console.log(`Fetching from OFF: ${offUrl}`)

    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    if (!response.ok) {
      throw new Error(`OFF API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

