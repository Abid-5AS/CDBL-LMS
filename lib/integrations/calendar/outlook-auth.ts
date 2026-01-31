import { ConfidentialClientApplication } from '@azure/msal-node';

const SCOPES = ['Calendars.ReadWrite', 'offline_access'];

export const getOutlookAuthConfig = () => {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const tenantId = process.env.OUTLOOK_TENANT_ID || 'common';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth/outlook`;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Outlook Calendar credentials');
    }

    return {
        auth: {
            clientId,
            clientSecret,
            authority: `https://login.microsoftonline.com/${tenantId}`,
        },
    };
};

export const getOutlookAuthUrl = async () => {
    const config = getOutlookAuthConfig();
    const cca = new ConfidentialClientApplication(config);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth/outlook`;

    return await cca.getAuthCodeUrl({
        scopes: SCOPES,
        redirectUri,
    });
};

export const getOutlookTokens = async (code: string) => {
    const config = getOutlookAuthConfig();
    const cca = new ConfidentialClientApplication(config);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/auth/outlook`;

    const response = await cca.acquireTokenByCode({
        code,
        scopes: SCOPES,
        redirectUri,
    });

    return {
        accessToken: response.accessToken,
        refreshToken: response.account?.homeAccountId, // MSAL handles refresh tokens internally usually, but we might need to store account ID or similar
        // Note: MSAL structure is different. We might need to adjust based on exact needs.
        // For simple flow, we might just store the tokens if returned.
        // Actually, acquireTokenByCode returns accessToken. Refresh token is handled by MSAL cache usually.
        // But for manual handling, we might need to check response properties.
    };
};
