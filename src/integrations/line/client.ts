const CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || '';
// Use explicit redirect if provided, else fall back to current origin
const REDIRECT_URI =
    (import.meta.env.VITE_LINE_REDIRECT_URI as string) || `${window.location.origin}/auth/line/callback`;

// Function to initiate LINE login
export const initiateLineLogin = () => {
    if (!CHANNEL_ID) {
        throw new Error('LINE Channel ID is not configured');
    }

    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);
    sessionStorage.setItem('line_state', state);
    sessionStorage.setItem('line_nonce', nonce);
    
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${CHANNEL_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=profile%20openid%20email&nonce=${nonce}`;
    window.location.href = lineLoginUrl;
};

// Function to handle the callback from LINE
export const handleLineCallback = async (code: string, state: string) => {
    try {
        // Validate state to prevent CSRF attacks
        const savedState = sessionStorage.getItem('line_state');
        if (savedState && state) {
            if (state !== savedState) {
                throw new Error('State mismatch - possible CSRF attack');
            }
        }

        console.log('Starting LINE token exchange with:', {
            code: code.substring(0, 10) + '...',
            redirectUri: REDIRECT_URI,
            channelId: CHANNEL_ID,
        });

        // Exchange code for token directly with LINE
        // Note: This is safe for localhost development
        // For production, move to backend/Edge Function
        const tokenResponse = await fetch(
            'https://api.line.me/oauth2/v2.1/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    client_id: CHANNEL_ID,
                    // Note: For development only. Production should use backend
                    client_secret: import.meta.env.VITE_LINE_CHANNEL_SECRET || '',
                }).toString(),
            }
        );

        console.log('Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('LINE token error response:', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                body: errorText,
            });
            throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful');

        const accessToken = tokenData.access_token;
        const idToken = tokenData.id_token;

        // Fetch user profile information
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!profileResponse.ok) {
            const profileError = await profileResponse.text();
            console.error('Profile fetch error:', profileError);
            throw new Error('Failed to fetch LINE user profile');
        }

        const userInfo = await profileResponse.json();
        console.log('User profile fetched:', {
            userId: userInfo.userId,
            displayName: userInfo.displayName,
        });

        // Clean up session storage
        sessionStorage.removeItem('line_state');
        sessionStorage.removeItem('line_nonce');

        return {
            userId: userInfo.userId,
            displayName: userInfo.displayName,
            pictureUrl: userInfo.pictureUrl,
            statusMessage: userInfo.statusMessage,
            accessToken: accessToken,
            idToken: idToken,
        };
    } catch (error) {
        console.error('Error during LINE login:', error);
        throw error;
    }
};
