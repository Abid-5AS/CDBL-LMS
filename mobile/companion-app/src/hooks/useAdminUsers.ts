/**
 * Hook for managing admin user operations
 * Fetches users list and provides CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department: string | null;
  empCode: string | null;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  empCode?: string;
  password: string;
}

export interface UpdateRoleRequest {
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

export interface UseAdminUsersResult {
  users: AdminUser[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<boolean>;
  updateUserRole: (id: string, role: 'ADMIN' | 'MANAGER' | 'USER') => Promise<boolean>;
  deactivateUser: (id: string) => Promise<boolean>;
  isProcessing: boolean;
}

export function useAdminUsers(): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<AdminUser[]>(
        API_ENDPOINTS.ADMIN_USERS.LIST
      );

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch users';
      setError(new Error(errorMessage));
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refetch = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(
    async (data: CreateUserRequest): Promise<boolean> => {
      try {
        setIsProcessing(true);

        const response = await apiClient.post<AdminUser>(
          API_ENDPOINTS.ADMIN_USERS.CREATE,
          data
        );

        if (response.success && response.data) {
          // Add the new user to the list
          setUsers((prev) => [response.data!, ...prev]);
          return true;
        } else {
          throw new Error(response.message || 'Failed to create user');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create user';
        console.error('Error creating user:', err);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const updateUserRole = useCallback(
    async (id: string, role: 'ADMIN' | 'MANAGER' | 'USER'): Promise<boolean> => {
      try {
        setIsProcessing(true);

        const payload: UpdateRoleRequest = { role };

        const response = await apiClient.put<AdminUser>(
          API_ENDPOINTS.ADMIN_USERS.UPDATE_ROLE(id),
          payload
        );

        if (response.success && response.data) {
          // Update the user in the list
          setUsers((prev) =>
            prev.map((user) =>
              user.id === id ? { ...user, role: response.data!.role } : user
            )
          );
          return true;
        } else {
          throw new Error(response.message || 'Failed to update role');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update role';
        console.error('Error updating role:', err);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const deactivateUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsProcessing(true);

        const response = await apiClient.post(
          API_ENDPOINTS.ADMIN_USERS.DEACTIVATE(id),
          {}
        );

        if (response.success) {
          // Remove the user from the list with animation support
          setUsers((prev) => prev.filter((user) => user.id !== id));
          return true;
        } else {
          throw new Error(response.message || 'Failed to deactivate user');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to deactivate user';
        console.error('Error deactivating user:', err);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser,
    updateUserRole,
    deactivateUser,
    isProcessing,
  };
}
