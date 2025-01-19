import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "@/components/auth/RegisterForm";

// Force Node.js runtime
export const runtime = "nodejs";

export default async function RegisterPage() {
  console.log('Register page: Checking authentication...');
  
  const session = await auth();
  console.log('Register page: Auth check result:', { 
    isAuthenticated: !!session,
    userId: session?.user?.id 
  });

  if (session) {
    console.log('Register page: User already authenticated, redirecting to dashboard');
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
} 