import NextAuth, { getServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Force Node.js runtime
export const runtime = "nodejs"

console.log('Auth configuration loading:', {
  runtime: process.env.NEXT_RUNTIME,
  nodeEnv: process.env.NODE_ENV
});

// Export auth options without dynamic imports
export const authOptions: NextAuthOptions = {
  debug: true,  // Enable next-auth debugging
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
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login?error=AuthError",
    signOut: "/login?signedOut=true"
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role!
        session.user.email = token.email!
        session.user.name = token.name || null
      }
      return session
    }
  }
}

// Export the auth function
export async function auth() {
  return await getServerSession(authOptions)
} 