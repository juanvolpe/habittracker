import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string; signedOut?: string };
}) {
  const session = await auth();

  // If user is already logged in, redirect to the intended page or dashboard
  if (session) {
    redirect(searchParams.from || "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {searchParams.error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {searchParams.error === "AuthError"
                ? "Authentication failed. Please check your credentials."
                : "An error occurred. Please try again."}
            </p>
          )}
          {searchParams.signedOut && (
            <p className="mt-2 text-center text-sm text-green-600">
              You have been signed out successfully.
            </p>
          )}
        </div>
        <LoginForm callbackUrl={searchParams.from || "/dashboard"} />
      </div>
    </div>
  );
} 