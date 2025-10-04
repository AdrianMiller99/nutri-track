// Supabase Edge Function to proxy Open Food Facts product lookup API
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
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const offUrl = `${OFF_API_BASE}/api/v2/product/${barcode}`
    
    console.log(`Fetching product ${barcode} from OFF`)

    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ status: 0, product: null }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
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

