import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SummaryPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-8">
          <span className="bg-blue-100 p-3 rounded-lg mr-4">📊</span>
          <h1 className="text-2xl font-bold text-blue-900">Activity Summary</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 transform transition-all duration-200 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-blue-800">Weekly Stats</h2>
              <span className="bg-blue-200 p-2 rounded-lg">🎯</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">5 activities</p>
            <p className="text-sm text-blue-500">Last 7 days</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 transform transition-all duration-200 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-blue-800">Monthly Progress</h2>
              <span className="bg-blue-200 p-2 rounded-lg">⏱️</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">15 hours</p>
            <p className="text-sm text-blue-500">This month</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 transform transition-all duration-200 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-blue-800">Streak</h2>
              <span className="bg-blue-200 p-2 rounded-lg">🔥</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">3 days</p>
            <p className="text-sm text-blue-500">Current streak</p>
          </div>
        </div>
      </div>
    </div>
  )
} 