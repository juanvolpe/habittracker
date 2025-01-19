'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import WeeklyLeaderboard from '@/components/dashboard/RecentGroupActivities';
import WeeklyGroupActivity from '@/components/dashboard/WeeklyGroupActivity';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  isMember: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        const data = await response.json();
        
        if (response.ok) {
          const memberGroups = data.groups.filter((group: Group) => group.isMember);
          setGroups(memberGroups);
          
          // If user has groups, select the first one
          if (memberGroups.length > 0) {
            setSelectedGroup(memberGroups[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchGroups();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If no groups, show message
  if (groups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to HabitTracker!</h2>
          <p className="text-gray-600 mb-4">To start tracking your activities, please visit your profile page to join or create a group.</p>
          <Link 
            href="/dashboard/profile"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-semibold text-blue-600">
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-500">Track your activities and see your group's progress</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Group
            </label>
            <select
              id="group-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="MMMM d, yyyy"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyLeaderboard selectedGroup={selectedGroup} selectedDate={selectedDate} />
        <WeeklyGroupActivity groups={groups} selectedGroup={selectedGroup} selectedDate={selectedDate} />
      </div>
    </div>
  );
} 