'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ActivityFormData {
  activityType: 'CAMINATA' | 'CORRER' | 'BICICLETA_FIJA' | 'GYM' | 'TAP_OUT' | 'PILATES' | 'MALOVA' | 'NATACION';
  duration: number;
  date: Date;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  isMember: boolean;
}

export default function TrackerPage() {
  const { data: session } = useSession();
  const [activityType, setActivityType] = useState<ActivityFormData['activityType']>('CAMINATA');
  const [duration, setDuration] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [weight, setWeight] = useState<string>('');
  const [weightDate, setWeightDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        const data = await response.json();
        
        if (response.ok) {
          const memberGroups = data.groups.filter((group: Group) => group.isMember);
          setGroups(memberGroups);
          if (memberGroups.length > 0) {
            setSelectedGroup(memberGroups[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('Failed to fetch groups');
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Log Your Activities?</h2>
          <p className="text-gray-600 mb-4">To start logging your activities, you'll need to join or create a group first. Visit your profile page to get started!</p>
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
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localDate = new Date(today.getTime() - (offset * 60 * 1000));
      setDate(localDate.toISOString().split('T')[0]);
      setSelectedGroup('');
      formRef.current?.reset();

      console.log('Activity logged successfully');
      setSuccessMessage('Activity logged successfully');
    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: parseFloat(weight),
          date: weightDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log weight');
      }

      setWeight('');
      setSuccessMessage('Weight logged successfully');
    } catch (err) {
      console.error('Error logging weight:', err);
      setError(err instanceof Error ? err.message : 'Failed to log weight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-6 bg-white rounded-lg shadow">
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
              <option value="NATACION">Swimming</option>
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

          {successMessage && (
            <div className="text-green-500 text-sm bg-green-50 rounded-lg p-3">
              {successMessage}
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

      {/* Weight Logging Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-blue-900 mb-6">Log Weight</h2>
        <form onSubmit={handleWeightSubmit} className="space-y-6">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
              step="0.1"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="weightDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="weightDate"
              value={weightDate}
              onChange={(e) => setWeightDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-blue-200 px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging Weight...' : 'Log Weight'}
          </button>
        </form>
      </div>
    </div>
  );
} 