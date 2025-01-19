import NextAuth, { getServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Force Node.js runtime
export const runtime = "nodejs"

console.log('Auth configuration loading:', {
  runtime: process.env.NEXT_RUNTIME,
  nodeEnv: process.env.NODE_ENV,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  hasSecret: !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET
});

// Export auth options without dynamic imports
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Authorize attempt:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          console.log('User lookup result:', { found: !!user });

          if (!user || !user.password) {
            console.log('User not found or missing password');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('Password validation:', { isValid });

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}

// Export the auth function
export async function auth() {
  return await getServerSession(authOptions)
} 