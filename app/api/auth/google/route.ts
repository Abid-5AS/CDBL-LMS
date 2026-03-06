import { GoogleCalendarProvider } from '@/lib/integrations/calendar/google';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const provider = new GoogleCalendarProvider();
  
  // Construct redirect URI based on current origin
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/google`;
  
  const authUrl = provider.getAuthUrl(redirectUri);
  
  return NextResponse.redirect(authUrl);
}

export const dynamic = "force-dynamic";
