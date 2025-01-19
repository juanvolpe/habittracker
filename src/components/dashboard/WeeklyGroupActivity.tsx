'use client';

import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

interface MonthlyGroupActivityProps {
  groups: any[];
  selectedGroup: string;
  selectedDate: Date;
}

export default function WeeklyGroupActivity({ groups = [], selectedGroup, selectedDate }: MonthlyGroupActivityProps) {
  const [activities, setActivities] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities when group or date changes
  useEffect(() => {
    if (!selectedGroup) return;

    const fetchWeeklyActivities = async () => {
      try {
        setLoading(true);
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start from Monday
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const url = `/api/groups/${selectedGroup}/weekly-activities?date=${weekStart.toISOString()}&viewType=weekly`;
        console.log('Fetching activities from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error fetching weekly activities: ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched activities:', data);
        setActivities(data.activities || {});
      } catch (error) {
        console.error('Failed to fetch weekly activities:', error);
        setError('Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyActivities();
  }, [selectedGroup, selectedDate]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No groups available</p>
      </div>
    );
  }

  // Get array of 7 days starting from Monday of the selected date's week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Weekly Activity</h2>
          <p className="text-sm text-gray-400 mt-1">
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {daysInWeek.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayActivities = activities[dateKey] || [];
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

          return (
            <div 
              key={dateKey} 
              className={`border rounded-lg p-4 ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-32">
                  <p className="font-semibold text-gray-900">{format(day, 'EEEE')}</p>
                  <p className="text-sm text-gray-500">{format(day, 'MMM d')}</p>
                </div>
                
                <div className="flex-grow">
                  {loading ? (
                    <div className="text-center py-2">
                      <div className="animate-spin inline-block h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div>
                      {dayActivities.length > 0 ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          {dayActivities.map((user: any) => (
                            <div
                              key={user.userId}
                              className="relative group"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt={user.userName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-blue-600 font-medium text-sm">
                                    {user.userName.charAt(0)}
                                  </span>
                                )}
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                {user.userName} • {user.activityCount} activities
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-sm text-gray-400">
                          No activities
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 