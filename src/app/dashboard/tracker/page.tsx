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
      setGroups(data.groups);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Activity Tracker</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Log Activity</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </label>
            <select
              id="activityType"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityFormData['activityType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="CAMINATA">Caminata</option>
              <option value="CORRER">Correr</option>
              <option value="BICICLETA_FIJA">Bicicleta Fija</option>
              <option value="GYM">Gym</option>
              <option value="TAP_OUT">Tap Out</option>
              <option value="PILATES">Pilates</option>
              <option value="MALOVA">Malova</option>
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter duration in minutes"
              min="1"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Logging...' : 'Log Activity'}
          </button>
        </form>
      </div>
    </div>
  );
} 