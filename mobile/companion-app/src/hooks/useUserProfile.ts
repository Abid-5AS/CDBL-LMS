import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, saveUserProfile } from '../database';

export interface UserProfile {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string | null;
  role: string | null;
  last_synced_at: number | null;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserProfile();
      setProfile(data as UserProfile);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: {
      employeeId: string;
      name: string;
      email: string;
      department?: string;
      role?: string;
    }) => {
      try {
        await saveUserProfile(updates);
        await fetchProfile();
        return { success: true };
      } catch (err) {
        console.error('Error updating user profile:', err);
        return { success: false, error: err };
      }
    },
    [fetchProfile]
  );

  const refresh = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refresh,
  };
}
