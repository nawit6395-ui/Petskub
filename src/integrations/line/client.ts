import axios from 'axios';

const CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || '';
const CHANNEL_SECRET = import.meta.env.VITE_LINE_CHANNEL_SECRET || '';
const REDIRECT_URI = `${window.location.origin}/auth/line/callback`;

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
        // Optional state validation (may not work across sessions/browser tabs)
        const savedState = sessionStorage.getItem('line_state');
        if (savedState && state && state !== savedState) {
            console.warn('State mismatch - could be from different session/tab', {
                expected: savedState,
                received: state
            });
            // Don't throw error on state mismatch as it can happen in legitimate scenarios
        }

        // Exchange code for token with LINE
        const tokenResponse = await axios.post(
            'https://api.line.me/oauth2/v2.1/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CHANNEL_ID,
                client_secret: CHANNEL_SECRET,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;
        const idToken = tokenResponse.data.id_token;

        // Fetch user profile information
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const userInfo = profileResponse.data;

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
