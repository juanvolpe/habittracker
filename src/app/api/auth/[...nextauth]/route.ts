import { authOptions } from "@/auth"
import NextAuth from "next-auth"

// Force Node.js runtime for this route
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

console.log('Auth route configuration:', {
  runtime: process.env.NEXT_RUNTIME,
  nodeEnv: process.env.NODE_ENV,
  dynamic: process.env.NEXT_DYNAMIC
});

// Create and export the route handlers
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }