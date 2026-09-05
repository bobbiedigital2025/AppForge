import { updateSession } from '@/lib/supabase/server-client';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff|woff2)).*)',
  ],
};

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
