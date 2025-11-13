// This is a workaround API endpoint for LINE OAuth callback
// For production, deploy the Edge Function at supabase/functions/line-oauth-callback/
// 
// This file demonstrates how the LINE token exchange should work
// 
// Backend API: POST /api/line-oauth-callback
// Body: { code, redirectUri }
// Response: { access_token, id_token, userInfo }

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return new Response('Missing code or redirectUri', { status: 400 });
    }

    const lineChannelId = process.env.VITE_LINE_CHANNEL_ID;
    const lineChannelSecret = process.env.VITE_LINE_CHANNEL_SECRET;

    if (!lineChannelId || !lineChannelSecret) {
      return new Response('LINE credentials not configured', { status: 500 });
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LINE token exchange error:', errorData);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    // Fetch user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LINE user profile');
    }

    const userInfo = await profileResponse.json();

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        userInfo: {
          userId: userInfo.userId,
          displayName: userInfo.displayName,
          pictureUrl: userInfo.pictureUrl,
          statusMessage: userInfo.statusMessage,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in LINE OAuth callback:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
