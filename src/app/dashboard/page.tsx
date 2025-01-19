'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import WeeklyLeaderboard from '@/components/dashboard/RecentGroupActivities';
import WeeklyGroupActivity from '@/components/dashboard/WeeklyGroupActivity';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Group {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        const data = await response.json();
        if (response.ok && data.groups.length > 0) {
          setGroups(data.groups);
          setSelectedGroup(data.groups[0].id); // Select first group by default
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Controls Section */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        {/* Group Selector */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        {/* Single Date Picker */}
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date) => setSelectedDate(date)}
          dateFormat="MMMM d, yyyy"
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          placeholderText="Select a date"
          showPopperArrow={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard Section */}
        <div>
          <WeeklyLeaderboard
            selectedGroup={selectedGroup}
            selectedDate={selectedDate}
          />
        </div>

        {/* Weekly Group Activity Section */}
        <div>
          <WeeklyGroupActivity
            groups={groups}
            selectedGroup={selectedGroup}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
} 