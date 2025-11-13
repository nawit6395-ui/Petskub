import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LineOAuthRequest {
  code: string
  state: string
  redirectUri: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state, redirectUri } = await req.json() as LineOAuthRequest

    // Verify required environment variables
    const lineChannelId = Deno.env.get('LINE_CHANNEL_ID')
    const lineChannelSecret = Deno.env.get('LINE_CHANNEL_SECRET')

    if (!lineChannelId || !lineChannelSecret) {
      throw new Error('LINE credentials not configured')
    }

    if (!code || !state || !redirectUri) {
      throw new Error('Missing required parameters: code, state, redirectUri')
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('LINE token exchange error:', errorData)
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const idToken = tokenData.id_token

    // Fetch user profile information
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LINE user profile')
    }

    const userInfo = await profileResponse.json()

    // Return user information along with tokens
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        id_token: idToken,
        userInfo: {
          userId: userInfo.userId,
          displayName: userInfo.displayName,
          pictureUrl: userInfo.pictureUrl,
          statusMessage: userInfo.statusMessage,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in line-oauth-callback:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during LINE OAuth callback',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
