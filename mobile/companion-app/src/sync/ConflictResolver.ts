/**
 * Conflict Resolver
 *
 * Handles conflicts between local and server data during sync
 */

export type ConflictResolutionStrategy = 'server-wins' | 'client-wins' | 'manual';

export interface SyncConflict {
  id: string;
  entity: string;
  localData: any;
  serverData: any;
  localTimestamp: string;
  serverTimestamp: string;
}

export interface ConflictResolution {
  id: string;
  resolution: 'accept-server' | 'keep-local' | 'merge';
  mergedData?: any;
}

class ConflictResolver {
  /**
   * Resolve a single conflict using the specified strategy
   */
  resolve(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy = 'server-wins'
  ): ConflictResolution {
    switch (strategy) {
      case 'server-wins':
        return this.resolveServerWins(conflict);

      case 'client-wins':
        return this.resolveClientWins(conflict);

      case 'manual':
        // For manual resolution, we need user input
        // Return a placeholder that UI can handle
        return {
          id: conflict.id,
          resolution: 'keep-local',
        };

      default:
        return this.resolveServerWins(conflict);
    }
  }

  /**
   * Server data takes precedence
   */
  private resolveServerWins(conflict: SyncConflict): ConflictResolution {
    return {
      id: conflict.id,
      resolution: 'accept-server',
    };
  }

  /**
   * Client data takes precedence
   */
  private resolveClientWins(conflict: SyncConflict): ConflictResolution {
    return {
      id: conflict.id,
      resolution: 'keep-local',
    };
  }

  /**
   * Attempt to merge changes intelligently
   */
  merge(conflict: SyncConflict): ConflictResolution {
    // For leave applications, we can merge certain fields
    if (conflict.entity === 'leave_application') {
      return this.mergeLeaveApplication(conflict);
    }

    // For profile, merge non-conflicting fields
    if (conflict.entity === 'profile') {
      return this.mergeProfile(conflict);
    }

    // Default: server wins
    return this.resolveServerWins(conflict);
  }

  /**
   * Merge leave application data
   */
  private mergeLeaveApplication(conflict: SyncConflict): ConflictResolution {
    const { localData, serverData } = conflict;

    // If server has updated status (approved/rejected), keep server data
    if (
      serverData.status !== 'pending' &&
      localData.status === 'pending'
    ) {
      return {
        id: conflict.id,
        resolution: 'accept-server',
      };
    }

    // If local is newer and still pending, keep local
    const localTime = new Date(conflict.localTimestamp).getTime();
    const serverTime = new Date(conflict.serverTimestamp).getTime();

    if (localTime > serverTime && localData.status === 'pending') {
      return {
        id: conflict.id,
        resolution: 'keep-local',
      };
    }

    // Default: server wins
    return {
      id: conflict.id,
      resolution: 'accept-server',
    };
  }

  /**
   * Merge profile data
   */
  private mergeProfile(conflict: SyncConflict): ConflictResolution {
    const { localData, serverData } = conflict;

    // Merge fields, preferring server for critical data
    const mergedData = {
      ...localData,
      ...serverData,
      // Keep local phone number if changed recently
      phoneNumber:
        new Date(conflict.localTimestamp) > new Date(conflict.serverTimestamp)
          ? localData.phoneNumber
          : serverData.phoneNumber,
    };

    return {
      id: conflict.id,
      resolution: 'merge',
      mergedData,
    };
  }

  /**
   * Detect if there's a conflict between local and server data
   */
  hasConflict(localData: any, serverData: any, localTimestamp: string, serverTimestamp: string): boolean {
    // If timestamps are the same, no conflict
    if (localTimestamp === serverTimestamp) {
      return false;
    }

    // Simple deep comparison
    return JSON.stringify(localData) !== JSON.stringify(serverData);
  }
}

export const conflictResolver = new ConflictResolver();
