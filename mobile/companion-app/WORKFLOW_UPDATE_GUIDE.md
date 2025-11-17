# React Native App - Workflow Update Guide

## Overview

This guide explains how to update the existing React Native app to support the new approval workflow implemented in the web application.

## New Approval Workflow

### Regular Employees:
```
Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD (Final Approval)
```

### Department Heads:
```
DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO (Final Approval)
```

## Files That Need Updates

### 1. API Types (`src/api/types.ts`)

Update the LeaveRequest type to include new cancellation fields:

```typescript
export interface LeaveRequest {
  id: number;
  requesterId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;

  // NEW FIELDS for partial cancellation
  isCancellationRequest?: boolean;
  isPartialCancellation?: boolean;
  originalEndDate?: string;
  cancellationReason?: string;

  requester: {
    id: number;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'DEPT_HEAD' | 'HR_ADMIN' | 'HR_HEAD' | 'CEO';  // REQUIRED
  };

  approvals: Approval[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: number;
  leaveId: number;
  step: number;
  approverId: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED';
  toRole?: string | null;
  comment?: string | null;
  decidedAt?: string | null;
  approver: {
    id: number;
    name: string;
    role: string;  // REQUIRED for workflow logic
  };
}
```

### 2. API Endpoints (`src/api/endpoints.ts`)

Add new endpoints for partial cancellation:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints

  LEAVES: {
    LIST: '/api/leaves',
    CREATE: '/api/leaves',
    GET: (id: string) => `/api/leaves/${id}`,
    UPDATE: (id: string) => `/api/leaves/${id}`,
    DELETE: (id: string) => `/api/leaves/${id}`,

    // NEW: Partial cancellation
    PARTIAL_CANCEL: (id: string) => `/api/leaves/${id}/partial-cancel`,
  },

  APPROVALS: {
    LIST: '/api/approvals',
    APPROVE: (id: string) => `/api/leaves/${id}/approve`,
    REJECT: (id: string) => `/api/leaves/${id}/reject`,
    FORWARD: (id: string) => `/api/leaves/${id}/forward`,
    RETURN: (id: string) => `/api/leaves/${id}/return-for-modification`,
  },
};
```

### 3. Workflow Helper Functions

Create `src/utils/workflow.ts`:

```typescript
/**
 * Get approval workflow stages based on requester role
 */
export function getWorkflowStages(requesterRole: string): string[] {
  if (requesterRole === 'DEPT_HEAD') {
    return ['Submitted', 'HR Admin', 'HR Head', 'CEO'];
  }
  return ['Submitted', 'HR Admin', 'HR Head', 'Dept Head'];
}

/**
 * Determine if user can approve based on role and requester
 */
export function canApprove(
  userRole: string,
  requesterRole: string,
  currentStep: number
): boolean {
  const stages = getWorkflowStages(requesterRole);
  const finalApproverRole = stages[stages.length - 1];

  // Map stage names to roles
  const roleMap: Record<string, string> = {
    'HR Admin': 'HR_ADMIN',
    'HR Head': 'HR_HEAD',
    'Dept Head': 'DEPT_HEAD',
    'CEO': 'CEO',
  };

  const finalRole = roleMap[finalApproverRole];
  return userRole === finalRole;
}

/**
 * Determine if user can forward
 */
export function canForward(
  userRole: string,
  requesterRole: string
): boolean {
  // HR_ADMIN and HR_HEAD can forward (not final approvers)
  return userRole === 'HR_ADMIN' || userRole === 'HR_HEAD';
}

/**
 * Calculate current approval step index
 */
export function calculateCurrentStep(
  approvals: Approval[],
  status: string,
  requesterRole: string
): number {
  const stages = getWorkflowStages(requesterRole);

  if (status === 'APPROVED' || status === 'REJECTED') {
    return stages.length - 1;
  }

  const completedSteps = approvals
    .filter(a => a.decision === 'APPROVED' || a.decision === 'FORWARDED')
    .map(a => a.step)
    .sort((a, b) => b - a);

  if (completedSteps.length === 0) return 1; // At HR Admin

  return Math.min(completedSteps[0] + 1, stages.length - 1);
}
```

### 4. Approval Action Screens

Update approval screens to use new workflow logic:

#### `app/approvals/[id].tsx` (or similar):

```typescript
import { getWorkflowStages, canApprove, canForward } from '@/src/utils/workflow';

function ApprovalDetailScreen({ leaveRequest }) {
  const user = useAuthStore(state => state.user);
  const stages = getWorkflowStages(leaveRequest.requester.role);
  const currentStep = calculateCurrentStep(
    leaveRequest.approvals,
    leaveRequest.status,
    leaveRequest.requester.role
  );

  const userCanApprove = canApprove(
    user.role,
    leaveRequest.requester.role,
    currentStep
  );

  const userCanForward = canForward(
    user.role,
    leaveRequest.requester.role
  );

  return (
    <View>
      {/* Approval Stepper showing dynamic workflow */}
      <ApprovalStepper
        stages={stages}
        currentStep={currentStep}
      />

      {/* Action Buttons */}
      {userCanApprove && (
        <Button onPress={handleApprove}>Approve</Button>
      )}

      {userCanForward && (
        <Button onPress={handleForward}>Forward</Button>
      )}

      <Button onPress={handleReturn}>Return for Modification</Button>
      <Button onPress={handleReject}>Reject</Button>
    </View>
  );
}
```

### 5. Leave Detail Screen

Add partial cancellation button:

```typescript
function LeaveDetailScreen({ leave }) {
  const canPartiallyCancel =
    leave.status === 'APPROVED' &&
    new Date(leave.startDate) <= new Date() &&
    new Date() < new Date(leave.endDate);

  const handlePartialCancel = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Partial Cancellation',
      'Request to cancel remaining future days of this approved leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: async () => {
            try {
              await apiClient.post(
                API_ENDPOINTS.LEAVES.PARTIAL_CANCEL(leave.id.toString()),
                { reason: 'Personal reasons' }
              );
              Alert.alert('Success', 'Partial cancellation request submitted for approval');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View>
      {/* Leave details */}

      {canPartiallyCancel && (
        <Button
          mode="outlined"
          onPress={handlePartialCancel}
          icon="cancel"
        >
          Request Partial Cancellation
        </Button>
      )}
    </View>
  );
}
```

### 6. Dashboard Updates

Update pending approval counts to filter by role:

```typescript
function DashboardScreen() {
  const user = useAuthStore(state => state.user);

  // Filter pending approvals based on user role
  const pendingForUser = useMemo(() => {
    return pendingApprovals.filter(leave => {
      const canIApprove = canApprove(
        user.role,
        leave.requester.role,
        calculateCurrentStep(leave.approvals, leave.status, leave.requester.role)
      );

      const canIForward = canForward(user.role, leave.requester.role);

      return canIApprove || canIForward;
    });
  }, [pendingApprovals, user.role]);

  return (
    <View>
      <Text>Pending Approvals: {pendingForUser.length}</Text>
    </View>
  );
}
```

## Component Updates Needed

### Approval Stepper Component

Create/update `src/components/approvals/ApprovalStepper.tsx`:

```typescript
interface ApprovalStepperProps {
  stages: string[];
  currentStep: number;
}

export function ApprovalStepper({ stages, currentStep }: ApprovalStepperProps) {
  return (
    <View style={styles.container}>
      {stages.map((stage, index) => (
        <View key={stage} style={styles.step}>
          {/* Step indicator */}
          <View style={[
            styles.indicator,
            index < currentStep && styles.completed,
            index === currentStep && styles.active,
          ]} />

          {/* Stage label */}
          <Text style={styles.label}>{stage}</Text>

          {/* Connector line */}
          {index < stages.length - 1 && (
            <View style={[
              styles.connector,
              index < currentStep && styles.connectorCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );
}
```

## Testing Checklist

### Employee Workflow:
- [ ] Employee applies for leave → shows workflow: Submitted → HR Admin → HR Head → Dept Head
- [ ] HR Admin can forward (not approve)
- [ ] HR Head can forward (not approve)
- [ ] Dept Head can approve/reject (final)
- [ ] Approved leave shows completed workflow

### Dept Head Workflow:
- [ ] Dept head applies for leave → shows workflow: Submitted → HR Admin → HR Head → CEO
- [ ] HR Admin can forward
- [ ] HR Head can forward
- [ ] CEO can approve/reject (final)
- [ ] Approved leave shows completed workflow

### Partial Cancellation:
- [ ] Employee can request partial cancellation of approved leave
- [ ] Request follows same approval workflow
- [ ] Shows in pending approvals
- [ ] Balance restored after approval
- [ ] Past days remain locked

### Dashboard:
- [ ] Shows correct pending count for each role
- [ ] HR Admin sees step 1 requests
- [ ] HR Head sees step 2 requests
- [ ] Dept Head sees employee requests at step 3
- [ ] CEO sees dept head requests at step 3

## API Response Example

Ensure your backend returns this structure:

```json
{
  "id": 123,
  "status": "PENDING",
  "type": "EARNED",
  "startDate": "2025-01-20",
  "endDate": "2025-01-25",
  "workingDays": 5,
  "reason": "Family vacation",
  "isCancellationRequest": false,
  "requester": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE"
  },
  "approvals": [
    {
      "id": 1,
      "step": 1,
      "decision": "APPROVED",
      "approver": {
        "id": 10,
        "name": "HR Admin",
        "role": "HR_ADMIN"
      },
      "decidedAt": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "step": 2,
      "decision": "PENDING",
      "approver": {
        "id": 11,
        "name": "HR Head",
        "role": "HR_HEAD"
      }
    }
  ]
}
```

## Deployment

After making these updates:

1. Update `.env` with production API URL:
   ```
   EXPO_PUBLIC_API_URL="https://your-domain.com"
   ```

2. Test locally:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

4. Submit to app stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

Last Updated: 2025-11-17
Related: New Approval Workflow Implementation
