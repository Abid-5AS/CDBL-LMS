import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '../../../src/components/shared/ThemedCard';
import { ThemedButton } from '../../../src/components/shared/ThemedButton';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useAdminUsers, AdminUser } from '../../../src/hooks/useAdminUsers';
import {
  Search,
  UserPlus,
  User,
  Mail,
  Briefcase,
  Shield,
  UserCog,
  UserX,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { spacing, radius, typography } from '../../../src/theme/designTokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminUsersScreen() {
  const { colors, isDark } = useTheme();
  const { users, isLoading, error, updateUserRole, deactivateUser, refetch, isProcessing } =
    useAdminUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query) ||
        user.empCode?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleDeactivateUser = (user: AdminUser) => {
    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate ${user.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // Configure animation before state change
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

              const success = await deactivateUser(user.id);
              if (success) {
                Alert.alert('Success', 'User deactivated successfully');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to deactivate user');
            }
          },
        },
      ]
    );
  };

  const handleEditRole = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      const success = await updateUserRole(selectedUser.id, newRole);
      if (success) {
        Alert.alert('Success', 'User role updated successfully');
        setShowRoleModal(false);
        setSelectedUser(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return colors.error;
      case 'MANAGER':
        return colors.warning;
      case 'USER':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield;
      case 'MANAGER':
        return UserCog;
      case 'USER':
        return User;
      default:
        return User;
    }
  };

  const renderUserCard = (user: AdminUser) => {
    const RoleIcon = getRoleIcon(user.role);
    const roleBadgeColor = getRoleBadgeColor(user.role);

    return (
      <ThemedCard key={user.id} style={styles.userCard}>
        {/* Top: Avatar + Name + Role Badge */}
        <View style={styles.userHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2)}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              {user.name}
            </Text>

            <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor + '20' }]}>
              <RoleIcon size={14} color={roleBadgeColor} />
              <Text style={[styles.roleText, { color: roleBadgeColor }]}>
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        {/* Middle: Department + Email */}
        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Briefcase
              size={16}
              color={
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.detailText,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {user.department || 'No Department'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Mail
              size={16}
              color={
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.detailText,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {user.email}
            </Text>
          </View>
        </View>

        {/* Bottom: Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.editButton,
              { backgroundColor: colors.primary + '15', borderColor: colors.primary },
            ]}
            onPress={() => handleEditRole(user)}
            disabled={isProcessing}
          >
            <UserCog size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Edit Role
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deactivateButton,
              { borderColor: colors.error },
            ]}
            onPress={() => handleDeactivateUser(user)}
            disabled={isProcessing}
          >
            <UserX size={18} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Deactivate
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.title,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
          >
            User Management
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: 'surfaceVariant' in colors ? colors.surfaceVariant : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
              borderColor: colors.border,
            },
          ]}
        >
          <Search
            size={20}
            color={
              'textSecondary' in colors
                ? colors.textSecondary
                : colors.onSurfaceVariant
            }
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
            placeholder="Search users..."
            placeholderTextColor={
              'textSecondary' in colors
                ? colors.textSecondary
                : colors.onSurfaceVariant
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X
                size={20}
                color={
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text
              style={[
                styles.messageText,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Loading users...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.messageText, { color: colors.error }]}>
              {error.message}
            </Text>
            <ThemedButton onPress={refetch} style={styles.retryButton}>
              Retry
            </ThemedButton>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <User
              size={48}
              color={
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.messageText,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          </View>
        ) : (
          filteredUsers.map(renderUserCard)
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() =>
          Alert.alert(
            'Create User',
            'User creation feature coming soon!',
            [{ text: 'OK' }]
          )
        }
      >
        <UserPlus size={24} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Role Edit Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowRoleModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface || colors.background,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    Edit User Role
                  </Text>
                  <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                    <X
                      size={24}
                      color={'text' in colors ? colors.text : colors.onSurface}
                    />
                  </TouchableOpacity>
                </View>

                {selectedUser && (
                  <View style={styles.modalBody}>
                    <Text
                      style={[
                        styles.modalUserName,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {selectedUser.name}
                    </Text>

                    <View style={styles.roleOptions}>
                      {(['USER', 'MANAGER', 'ADMIN'] as const).map((role) => {
                        const RoleIcon = getRoleIcon(role);
                        const isSelected = newRole === role;

                        return (
                          <TouchableOpacity
                            key={role}
                            style={[
                              styles.roleOption,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary + '20'
                                  : 'surfaceVariant' in colors ? colors.surfaceVariant : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                                borderColor: isSelected ? colors.primary : 'transparent',
                                borderWidth: isSelected ? 2 : 0,
                              },
                            ]}
                            onPress={() => setNewRole(role)}
                          >
                            <RoleIcon
                              size={24}
                              color={
                                isSelected
                                  ? colors.primary
                                  : 'text' in colors
                                  ? colors.text
                                  : colors.onSurface
                              }
                            />
                            <Text
                              style={[
                                styles.roleOptionText,
                                {
                                  color: isSelected
                                    ? colors.primary
                                    : 'text' in colors
                                    ? colors.text
                                    : colors.onSurface,
                                },
                              ]}
                            >
                              {role}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.modalActions}>
                      <ThemedButton
                        variant="outline"
                        onPress={() => setShowRoleModal(false)}
                        style={styles.modalButton}
                      >
                        Cancel
                      </ThemedButton>
                      <ThemedButton
                        onPress={handleUpdateRole}
                        style={styles.modalButton}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Updating...' : 'Update Role'}
                      </ThemedButton>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: radius.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: radius.xl,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
  },
  searchContainer: {
    paddingHorizontal: radius.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: radius.lg,
    paddingBottom: spacing.xxl * 2 + spacing.sm,
  },
  userCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: spacing.xxl + spacing.md,
    height: spacing.xxl + spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  roleText: {
    fontSize: 12,
    fontWeight: typography.display.fontWeight,
  },
  userDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm + 2,
    gap: 6,
  },
  editButton: {
    borderWidth: 1.5,
  },
  deactivateButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
  },
  fab: {
    position: 'absolute',
    right: radius.lg,
    bottom: radius.lg,
    width: spacing.xxl + spacing.md,
    height: spacing.xxl + spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: radius.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: radius.lg,
  },
  modalTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  modalBody: {
    gap: radius.lg,
  },
  modalUserName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  roleOptions: {
    gap: spacing.md,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  roleOptionText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
