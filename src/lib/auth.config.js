/**
 * Edge-compatible NextAuth config (no Node APIs / no bcrypt).
 * Used by middleware. The full config in `auth.js` extends this with providers.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublicPage = pathname === '/login';
      const isPublicApi =
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/telegram/webhook') ||
        pathname.startsWith('/api/cron') ||
        pathname.startsWith('/api/health');
      if (isPublicPage || isPublicApi) return true;
      return !!auth?.user;
    },
  },
};
