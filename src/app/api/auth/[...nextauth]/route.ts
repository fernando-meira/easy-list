import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth({
  ...authOptions,
  pages: {
    verifyRequest: '/api/auth/verify-request',
  },
});

export { handler as GET, handler as POST };
