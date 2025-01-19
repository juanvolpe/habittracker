'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek } from 'date-fns';

interface Group {
  id: string;
  name: string;
}

interface UserActivity {
  userId: string;
  userName: string;
  photoUrl: string | null;
  activityCount: number;
}

interface Props {
  selectedGroup: string;
  selectedDate: Date;
}

export default function WeeklyLeaderboard({ selectedGroup, selectedDate }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYearlyView, setIsYearlyView] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard();
    }
  }, [selectedGroup, isYearlyView, selectedDate]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.groups && Array.isArray(data.groups)) {
        setGroups(data.groups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let startDate;
      if (isYearlyView) {
        startDate = new Date(selectedDate.getFullYear(), 0, 1); // Start of current year
      } else {
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      }
      
      const response = await fetch(
        `/api/groups/${selectedGroup}/weekly-activities?date=${startDate.toISOString()}&viewType=${isYearlyView ? 'yearly' : 'weekly'}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Process the activities data to create a leaderboard
      const userActivities = new Map<string, UserActivity>();
      
      Object.values(data.activities).forEach((dayActivities: any) => {
        if (Array.isArray(dayActivities)) {
          dayActivities.forEach((user) => {
            if (!userActivities.has(user.userId)) {
              userActivities.set(user.userId, {
                userId: user.userId,
                userName: user.userName,
                photoUrl: user.photoUrl,
                activityCount: 0
              });
            }
            userActivities.get(user.userId)!.activityCount += user.activityCount;
          });
        }
      });

      // Convert to array and sort by activity count
      const sortedLeaderboard = Array.from(userActivities.values())
        .sort((a, b) => b.activityCount - a.activityCount);

      setLeaderboard(sortedLeaderboard);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-500'; // Gold
      case 1: return 'bg-gray-400';   // Silver
      case 2: return 'bg-amber-600';  // Bronze
      default: return 'bg-blue-200';  // Others
    }
  };

  const getPositionLabel = (index: number) => {
    switch (index) {
      case 0: return '🥇 1st';
      case 1: return '🥈 2nd';
      case 2: return '🥉 3rd';
      default: return `${index + 1}th`;
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  const maxActivities = leaderboard[0]?.activityCount || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 pl-2">
            {isYearlyView ? 'Yearly Leaderboard' : 'Monthly Leaderboard'}
          </h2>
          <p className="text-sm text-gray-400 mt-1 pl-2">
            {isYearlyView 
              ? format(selectedDate, 'yyyy')
              : format(selectedDate, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center bg-white rounded-lg p-1 border-2 border-blue-200 shadow-sm">
          <button
            onClick={() => setIsYearlyView(false)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              !isYearlyView
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            M
          </button>
          <button
            onClick={() => setIsYearlyView(true)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              isYearlyView
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Y
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No activities this week
        </div>
      ) : (
        <div className="space-y-8">
          {/* Podium for top 3 */}
          <div className="flex justify-center items-end gap-4 mb-12 h-32 pt-4">
            {/* Second Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-gray-400">
                    {leaderboard[1].photoUrl ? (
                      <img
                        src={leaderboard[1].photoUrl}
                        alt={leaderboard[1].userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">
                          {leaderboard[1].userName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xl">🥈</span>
                </div>
                <div className="h-20 w-24 bg-gray-400 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white text-xl font-bold">{leaderboard[1].activityCount}</span>
                </div>
              </div>
            )}
            
            {/* First Place */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-500">
                    {leaderboard[0].photoUrl ? (
                      <img
                        src={leaderboard[0].photoUrl}
                        alt={leaderboard[0].userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-yellow-700">
                          {leaderboard[0].userName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-2xl">🥇</span>
                </div>
                <div className="h-24 w-24 bg-yellow-500 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white text-2xl font-bold">{leaderboard[0].activityCount}</span>
                </div>
              </div>
            )}
            
            {/* Third Place */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-amber-600">
                    {leaderboard[2].photoUrl ? (
                      <img
                        src={leaderboard[2].photoUrl}
                        alt={leaderboard[2].userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-amber-700">
                          {leaderboard[2].userName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-lg">🥉</span>
                </div>
                <div className="h-16 w-24 bg-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-white text-lg font-bold">{leaderboard[2].activityCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* List of all participants with bar charts */}
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div key={user.userId} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-gray-500">
                  {getPositionLabel(index)}
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.userName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {user.userName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {user.activityCount} activities
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPositionColor(index)} transition-all duration-500`}
                      style={{ width: `${(user.activityCount / maxActivities) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 