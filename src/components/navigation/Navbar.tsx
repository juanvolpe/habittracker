'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">🏃‍♂️ HabitTracker</span>
            </div>
            <div className="flex space-x-6">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Activity Tracker', path: '/dashboard/tracker' },
                { name: 'Profile', path: '/dashboard/profile' },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 rounded-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center px-4 py-2 my-3 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
} 