'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface User {
  name: string;
  email: string;
}

interface Member {
  user: User;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: {
    name: string;
    email: string;
  };
  members: Array<{
    user: {
      name: string;
      email: string;
    };
    role: string;
  }>;
  memberCount: number;
  activityCount: number;
  isMember: boolean;
  isCreator: boolean;
}

interface RawUser {
  name?: string | null;
  email?: string;
}

interface RawMember {
  user?: RawUser;
  role?: string;
}

interface RawGroup {
  id?: string;
  name?: string;
  description?: string;
  members?: RawMember[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      console.log('Profile: Starting fetchGroups...');
      const response = await fetch('/api/groups', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Profile: API Response Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('Profile: Raw API Response:', JSON.stringify(rawData, null, 2));

      // Validate top-level structure
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid API response: not an object');
      }

      // Extract groups array with validation
      const groupsArray = rawData.groups;
      if (!Array.isArray(groupsArray)) {
        console.error('Profile: Invalid groups data:', rawData);
        throw new Error('Invalid API response: groups is not an array');
      }

      // Process each group with strict validation
      const processedGroups = groupsArray.map((rawGroup: RawGroup, index: number) => {
        console.log(`Profile: Processing group ${index}:`, JSON.stringify(rawGroup, null, 2));
        
        if (!rawGroup || typeof rawGroup !== 'object') {
          console.warn(`Profile: Invalid group at index ${index}`);
          return null;
        }

        // Ensure all required fields exist
        const group: Group = {
          id: rawGroup.id || `temp-${Date.now()}-${index}`,
          name: rawGroup.name || 'Unnamed Group',
          description: rawGroup.description || '',
          createdBy: {
            name: '',
            email: ''
          },
          members: [],
          memberCount: 0,
          activityCount: 0,
          isMember: false,
          isCreator: false
        };

        // Process members if they exist
        if (Array.isArray(rawGroup.members)) {
          group.members = rawGroup.members
            .map((rawMember: RawMember, memberIndex: number) => {
              try {
                if (!rawMember || !rawMember.user) {
                  console.warn(`Profile: Invalid member at index ${memberIndex} in group ${group.id}`);
                  return null;
                }

                // Ensure user object has required fields
                const user = {
                  name: rawMember.user.name || 'Unknown User',
                  email: rawMember.user.email || `unknown${memberIndex}@example.com`
                };

                // Validate user data
                if (!user.name || !user.email) {
                  console.warn(`Profile: Member ${memberIndex} in group ${group.id} has missing user data`);
                }

                return {
                  user,
                  role: rawMember.role || 'MEMBER'
                };
              } catch (err) {
                console.error(`Profile: Error processing member ${memberIndex} in group ${group.id}:`, err);
                return null;
              }
            })
            .filter((member): member is Member => member !== null);
        } else {
          console.warn(`Profile: No members array for group ${group.id}`);
        }

        console.log(`Profile: Processed group ${index}:`, JSON.stringify(group, null, 2));
        return group;
      }).filter((group): group is Group => group !== null); // Type guard for filter

      console.log('Profile: Final processed groups:', JSON.stringify(processedGroups, null, 2));
      setGroups(processedGroups);
      setError(null);
    } catch (err) {
      console.error('Profile: Error in fetchGroups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      setGroups([]); // Reset groups on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (status === 'loading') {
      console.log('Profile: Session is loading');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('Profile: User is unauthenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      console.log('Profile: User is authenticated, fetching groups', {
        userId: session.user.id,
        email: session.user.email
      });
      fetchGroups();
    } else {
      console.warn('Profile: Authenticated but no user data');
    }
  }, [status, router, fetchGroups, session]);

  // Refresh data periodically
  useEffect(() => {
    if (status !== 'authenticated') return;

    const intervalId = setInterval(() => {
      console.log('Profile: Refreshing groups data');
      fetchGroups();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [status, fetchGroups]);

  // Listen for focus events to refresh data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const handleFocus = () => {
      console.log('Profile: Window focused, refreshing data');
      fetchGroups();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, fetchGroups]);

  // Show loading state while session is being checked
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no session or user data
  if (!session?.user || typeof session.user.email === 'undefined') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-red-500">
            Unable to load user data. Please try logging in again.
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mx-auto block"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-red-500">Error: {error}</div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchGroups();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button 
          onClick={() => {
            console.log('Profile: Manual refresh triggered');
            setLoading(true);
            fetchGroups();
          }}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full mr-4 bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
            {(() => {
              // Safely get the initial
              if (session.user.name && session.user.name.length > 0) {
                return session.user.name[0].toUpperCase();
              }
              if (session.user.email && session.user.email.length > 0) {
                return session.user.email[0].toUpperCase();
              }
              return 'U'; // Fallback if no name or email
            })()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{session.user.name || 'User'}</h2>
            <p className="text-gray-600">{session.user.email || 'No email provided'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Groups</h2>
        {groups.length === 0 ? (
          <p className="text-gray-500">No groups available.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium">{group.name}</h3>
                    {group.description && (
                      <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                  </div>
                  {!group.isCreator && (
                    <button
                      onClick={async () => {
                        try {
                          const endpoint = group.isMember ? 'leave' : 'join';
                          const response = await fetch(`/api/groups/${group.id}/${endpoint}`, {
                            method: 'POST',
                          });
                          
                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || `Failed to ${endpoint} group`);
                          }
                          
                          // Refresh groups after joining/leaving
                          fetchGroups();
                        } catch (err) {
                          console.error(`Error ${group.isMember ? 'leaving' : 'joining'} group:`, err);
                          setError(err instanceof Error ? err.message : 'Failed to update group membership');
                        }
                      }}
                      className={`px-4 py-2 rounded ${
                        group.isMember
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      {group.isMember ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>Created by {group.createdBy.name || group.createdBy.email}</span>
                  <span>•</span>
                  <span>{group.memberCount} members</span>
                  <span>•</span>
                  <span>{group.activityCount} activities</span>
                </div>

                <div className="mt-3">
                  <h4 className="font-medium">Members:</h4>
                  <ul className="mt-1 space-y-1">
                    {group.members.map((member, index) => {
                      const displayName = member.user.name || member.user.email;
                      const initial = (member.user.name?.[0] || member.user.email[0]).toUpperCase();

                      return (
                        <li key={`${group.id}-member-${index}`} className="text-gray-600 flex items-center">
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mr-2">
                            {initial}
                          </span>
                          <span>{displayName}</span>
                          <span className="ml-2 text-sm text-gray-500">({member.role})</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 