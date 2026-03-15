import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for check-auth-email')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { email } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      return jsonResponse({ error: 'A valid email is required' }, 400)
    }

    let page = 1
    const perPage = 200

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) {
        throw error
      }

      const users = data?.users || []
      const matchingUser = users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail)
      if (matchingUser) {
        return jsonResponse({
          status: matchingUser.email_confirmed_at ? 'confirmed_account' : 'unconfirmed_account',
        })
      }

      if (users.length < perPage || !data?.nextPage) {
        break
      }

      page = data.nextPage
    }

    return jsonResponse({ status: 'available' })
  } catch (error) {
    console.error('check-auth-email failed:', error)
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    )
  }
})
