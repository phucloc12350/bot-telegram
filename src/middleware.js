import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth?.user;

  // Redirect logged-in user away from /login
  if (pathname === '/login' && isAuthed) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Public paths đã được handle qua callback `authorized` trong authConfig.
  // Khi callback trả false, NextAuth tự redirect tới /login (cho page)
  // hoặc trả 401 (cho /api/*).
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Loại trừ static assets & next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
