import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const getGoogleAuth = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth/google`;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Google Calendar credentials');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const getGoogleAuthUrl = () => {
    const auth = getGoogleAuth();
    return auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Force refresh token generation
    });
};

export const getGoogleTokens = async (code: string) => {
    const auth = getGoogleAuth();
    const { tokens } = await auth.getToken(code);
    return tokens;
};
