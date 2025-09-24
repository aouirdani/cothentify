import type { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const providers = [] as any[];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(GithubProvider({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET }));
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}

providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      // Default role is MEMBER; extend to fetch roles from API later.
      return { id: 'dev-user', name: 'Dev User', email: credentials.email, role: 'MEMBER' } as any;
    },
  }),
);

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role || 'MEMBER';
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = (token as any).role || 'MEMBER';
      return session;
    },
  },
};

