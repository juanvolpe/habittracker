'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface Group {
  id: string;
  name: string;
  description?: string;
  isMember: boolean;
  creatorId: string;
  members: {
    user: {
      name: string;
      email: string;
    };
  }[];
  _count?: {
    members: number;
  };
}

interface PersonalData {
  photoUrl?: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const loadData = async () => {
    if (status === 'authenticated' && session?.user?.id) {
      console.log('Session in profile:', session);
      try {
        console.log('Fetching groups...');
        const response = await fetch('/api/groups?showAll=true');
        console.log('Groups API status:', response.status);
        const data = await response.json();
        console.log('Groups API full response:', data);
        
        if (response.ok) {
          console.log('Setting groups:', data.groups);
          setGroups(data.groups || []);
        } else {
          const errorMessage = data.details || data.error || 'Unknown error';
          console.error('Failed to fetch groups:', errorMessage);
          setError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
        console.error('Error in groups fetch:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
      
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        if (response.ok) {
          setPersonalData(data.personalData);
        }
      } catch (err) {
        console.error('Failed to fetch personal data:', err);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [status, session]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const photoUrl = prompt('Please enter the URL of your profile photo:');
    if (!photoUrl) return;

    try {
      // Update profile with new photo URL
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          photoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await loadData();
      setSuccessMessage('Profile photo updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile photo');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (!session?.user?.id) {
        setError('You must be logged in to create a group');
        return;
      }

      if (!newGroupData.name.trim()) {
        setError('Group name is required');
        return;
      }

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newGroupData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create group');
      }
      
      setShowCreateModal(false);
      setNewGroupData({ name: '', description: '' });
      setSuccessMessage('Group created successfully!');
      await loadData();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to join group');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to leave group');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/delete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete group');
      await loadData();
      setSuccessMessage('Group deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Sign out the user
      await signOut({ redirect: false });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-4">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-semibold text-blue-600">
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                {session?.user?.name || 'User'}
              </h2>
              <p className="text-gray-500 mb-4">{session?.user?.email}</p>
              {successMessage && (
                <div className="text-green-500 text-sm mb-4">{successMessage}</div>
              )}
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}
              <div className="space-y-2">
                <button
                  onClick={handleDeleteUser}
                  className="w-full text-red-500 hover:text-red-700 text-sm font-medium py-2"
                >
                  Delete Account
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full text-red-500 hover:text-red-700 text-sm font-medium py-2 border-t border-gray-100"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Groups</h2>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Group
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading groups...</div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-gray-600 mb-3">{group.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          {(group._count?.members ?? group.members?.length ?? 0)} members
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {!group.isMember ? (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Join Group
                          </button>
                        ) : (
                          <>
                            <span className="px-4 py-2 bg-green-100 text-green-600 rounded-lg">
                              Member
                            </span>
                            {session?.user?.id === group.creatorId && (
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="text-red-500 hover:text-red-700 text-sm mt-2 font-medium"
                              >
                                Delete Group
                              </button>
                            )}
                            {session?.user?.id !== group.creatorId && (
                              <button
                                onClick={() => handleLeaveGroup(group.id)}
                                className="text-red-500 hover:text-red-700 text-sm mt-2"
                              >
                                Leave Group
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No groups available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-blue-900 mb-4">
              Create New Group
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupData.name}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-blue-200 px-3 py-2"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) =>
                    setNewGroupData({
                      ...newGroupData,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-blue-200 px-3 py-2"
                  placeholder="Describe your group"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 