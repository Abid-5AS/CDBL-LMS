import { OutlookCalendarProvider } from '@/lib/integrations/calendar/outlook';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const provider = new OutlookCalendarProvider();
  
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/outlook`;
  
  const authUrl = provider.getAuthUrl(redirectUri);
  
  return NextResponse.redirect(authUrl);
}

export const dynamic = "force-dynamic";
