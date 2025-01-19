'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ActivityFormData {
  activityType: 'CAMINATA' | 'CORRER' | 'BICICLETA_FIJA' | 'GYM' | 'TAP_OUT' | 'PILATES' | 'MALOVA';
  duration: number;
  date: Date;
  groupId: string;
}

export default function TrackerPage() {
  const [activityType, setActivityType] = useState<ActivityFormData['activityType']>('CAMINATA');
  const [duration, setDuration] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      // Filter only groups where user is a member
      const userGroups = data.groups.filter((group: any) => group.isMember);
      setGroups(userGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups');
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          duration: parseFloat(duration),
          date,
          groupId: selectedGroup,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log activity');
      }

      // Reset form
      setActivityType('CAMINATA');
      setDuration('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedGroup('');
      formRef.current?.reset();

      console.log('Activity logged successfully');
    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Log Activity</h1>
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Group Selection */}
        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
            Select Group
          </label>
          {groups.length > 0 ? (
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              You are not a member of any groups. Join a group from your profile page to start logging activities.
            </div>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
            Activity Type
          </label>
          <select
            id="activityType"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
            required
          >
            <option value="CAMINATA">Walking</option>
            <option value="CORRER">Running</option>
            <option value="BICICLETA_FIJA">Stationary Bike</option>
            <option value="GYM">Gym</option>
            <option value="TAP_OUT">Tap Out</option>
            <option value="PILATES">Pilates</option>
            <option value="MALOVA">Malova</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
            min="1"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Logging Activity...' : 'Log Activity'}
        </button>
      </form>
    </div>
  );
} 