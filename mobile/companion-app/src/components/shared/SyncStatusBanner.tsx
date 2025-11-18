import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { syncService, SyncResult } from '../../sync/SyncService';
import { networkMonitor } from '../../sync/NetworkMonitor';
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react-native';
import { spacing, typography } from '../../theme/designTokens';

export function SyncStatusBanner() {
  const { colors, isDark } = useTheme();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Listen for sync events
    const unsubscribeSync = syncService.addListener((result) => {
      setSyncResult(result);
    });

    // Listen for network changes
    const unsubscribeNetwork = networkMonitor.addListener((connected) => {
      setIsConnected(connected);
    });

    // Load last sync time
    loadLastSyncTime();

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
    };
  }, []);

  const loadLastSyncTime = async () => {
    const time = await syncService.getLastSyncTime();
    setLastSyncTime(time);
  };

  const handleRefresh = async () => {
    const result = await syncService.sync();
    if (result.status === 'success') {
      setLastSyncTime(result.lastSyncTime || null);
    }
  };

  const getTimeSinceSync = (): string => {
    if (!lastSyncTime) return 'Never synced';

    const now = new Date();
    const syncTime = new Date(lastSyncTime);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (!isConnected) return colors.error;
    if (syncResult?.status === 'syncing') return colors.warning;
    if (syncResult?.status === 'success') return colors.success;
    if (syncResult?.status === 'error') return colors.error;
    return colors.primary;
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    const size = 16;

    if (!isConnected) return <WifiOff size={size} color={color} />;
    if (syncResult?.status === 'syncing')
      return <ActivityIndicator size="small" color={color} />;
    if (syncResult?.status === 'success') return <CheckCircle size={size} color={color} />;
    if (syncResult?.status === 'error') return <AlertCircle size={size} color={color} />;
    return <Wifi size={size} color={color} />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Offline';
    if (syncResult?.status === 'syncing') return 'Syncing...';
    if (syncResult?.status === 'success') return `Synced ${getTimeSinceSync()}`;
    if (syncResult?.status === 'error') return 'Sync failed';
    return `Last synced ${getTimeSinceSync()}`;
  };

  // Don't show banner if everything is synced and connected
  if (isConnected && syncResult?.status !== 'syncing' && syncResult?.status !== 'error') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant,
          borderBottomColor: getStatusColor() + '30',
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.statusInfo}>
          {getStatusIcon()}
          <Text
            style={[
              styles.statusText,
              {
                color: 'text' in colors ? colors.text : colors.onSurface,
              },
            ]}
          >
            {getStatusText()}
          </Text>
        </View>

        {isConnected && syncResult?.status !== 'syncing' && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {syncResult?.errors && syncResult.errors.length > 0 && (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
            },
          ]}
        >
          {syncResult.errors[0]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    marginTop: spacing.xs,
  },
});
