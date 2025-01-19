import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/navigation/Navbar"
import MobileNav from "@/components/navigation/MobileNav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  )
} 