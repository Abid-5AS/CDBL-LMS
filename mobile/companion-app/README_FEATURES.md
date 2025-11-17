# CDBL LMS Mobile App - Feature Overview

## Updated Approval Workflow (2025-11-17)

The mobile app now implements the new approval workflow matching the web application:

### Regular Employees
```
Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD (Final Approval)
```

### Department Heads
```
DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO (Final Approval)
```

## New Feature: Partial Cancellation with Approval Flow

Employees can now request partial cancellation of approved leaves, which goes through the same approval flow:

### How it Works:
1. Employee selects an approved leave that has already started
2. Requests partial cancellation with a reason
3. System calculates:
   - Past days (already taken) - locked
   - Future days (can be cancelled)
4. Request is sent for approval following the standard flow
5. Once approved:
   - Leave end date is adjusted
   - Balance is restored for cancelled future days
   - Past days remain as taken

### Example:
- Original leave: Jan 15 - Jan 25 (10 days)
- Today: Jan 20
- Request partial cancellation on Jan 20
- Past days (Jan 15-19): 5 days - locked
- Future days (Jan 21-25): 5 days - can be cancelled
- New end date after approval: Jan 19
- Balance restored: 5 days

## Complete Feature List

### Leave Management
- ✅ Apply for all leave types (EL, CL, ML, etc.)
- ✅ View leave history and status
- ✅ Edit draft leave requests
- ✅ Cancel pending leave requests
- ✅ Request partial cancellation of approved leaves (NEW)
- ✅ Upload medical certificates
- ✅ View leave balance in real-time

### Approval Features (Role-Based)
- ✅ View pending approvals
- ✅ Approve requests (final approvers only: DEPT_HEAD or CEO)
- ✅ Forward to next approver (HR_ADMIN, HR_HEAD)
- ✅ Return for modification
- ✅ Reject with reason
- ✅ View approval history
- ✅ Bulk approve multiple requests

### Dashboard & Calendar
- ✅ Personal dashboard with leave statistics
- ✅ Team calendar showing all team members' leaves
- ✅ Holiday calendar
- ✅ Upcoming leave notifications
- ✅ Leave balance widget

### Notifications
- ✅ Push notifications for:
  - Leave submitted
  - Leave approved/rejected
  - Leave forwarded
  - Leave returned for modification
  - Cancellation request status
  - Approaching leave reminders

### Offline Features
- ✅ View leave history offline
- ✅ View leave balance offline
- ✅ Draft leave requests offline
- ✅ Auto-sync when online
- ✅ Conflict resolution for concurrent edits
- ✅ Sync status indicator

### Security & Authentication
- ✅ Biometric login (Fingerprint/Face ID)
- ✅ Secure token storage
- ✅ Auto-logout on inactivity
- ✅ Two-factor authentication (2FA)

### AI Features
- ✅ Leave policy chatbot (Gemini AI)
- ✅ Smart leave suggestions
- ✅ Balance prediction

### User Experience
- ✅ Dark mode support
- ✅ Material Design 3
- ✅ Smooth animations
- ✅ Pull-to-refresh
- ✅ Haptic feedback
- ✅ Swipe gestures
- ✅ Loading skeletons

## Technical Features

### API Integration
- ✅ RESTful API client
- ✅ Automatic token refresh
- ✅ Request retry with exponential backoff
- ✅ Response caching
- ✅ Network status monitoring

### Data Management
- ✅ Local SQLite database
- ✅ Optimistic updates
- ✅ Background sync
- ✅ Data migration support
- ✅ Query optimization with indexes

### Performance
- ✅ Code splitting
- ✅ Lazy loading
- ✅ List virtualization
- ✅ Image optimization
- ✅ Memory leak prevention
- ✅ Bundle size optimization

## Roadmap

### Upcoming Features
- [ ] Fingerprint/Face ID for approvals
- [ ] Offline approval queue
- [ ] Export leave report to PDF
- [ ] Team availability heatmap
- [ ] Leave analytics dashboard
- [ ] Multi-language support
- [ ] Widget for home screen (iOS/Android)

### Future Enhancements
- [ ] Apple Watch companion app
- [ ] Siri shortcuts integration
- [ ] Android Auto integration
- [ ] Voice-based leave application
- [ ] ML-based leave pattern analysis

## Comparison: Web vs Mobile

| Feature | Web App | Mobile App | Notes |
|---------|---------|------------|-------|
| Leave Application | ✅ | ✅ | Same form, mobile optimized |
| Approval Workflow | ✅ | ✅ | Complete parity |
| Partial Cancellation | ✅ | ✅ | Full approval flow |
| Calendar View | ✅ | ✅ | Touch-optimized on mobile |
| Dashboard | ✅ | ✅ | Swipeable cards on mobile |
| Offline Mode | ❌ | ✅ | Mobile-only |
| Biometric Auth | ❌ | ✅ | Mobile-only |
| AI Assistant | ❌ | ✅ | Mobile-only |
| Push Notifications | Browser | Native | Better on mobile |
| Dark Mode | ✅ | ✅ | Auto-switch on mobile |

## Development Status

| Module | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ Complete | JWT + Biometric |
| Leave Management | ✅ Complete | All leave types |
| Approval Workflow | ✅ Complete | New flow implemented |
| Partial Cancellation | ✅ Complete | With approval flow |
| Calendar | ✅ Complete | Team + Holidays |
| Dashboard | ✅ Complete | Role-based |
| Notifications | ✅ Complete | Push + In-app |
| Offline Sync | ✅ Complete | With conflict resolution |
| AI Assistant | 🔄 Partial | Basic features |
| Analytics | 📋 Planned | Q1 2025 |

## Known Limitations

1. **File Upload Size**: Limited to 10MB per file
2. **Offline Approval**: Approvals require internet connection (by design for security)
3. **Push Notifications**: Requires EAS configuration
4. **Biometric**: Not available on simulators/emulators
5. **AI Features**: Require Gemini API key

## Support Matrix

### iOS
- Minimum: iOS 13.4
- Recommended: iOS 15.0+
- Tested on: iPhone 11, 12, 13, 14, 15 series

### Android
- Minimum: Android 8.0 (API 26)
- Recommended: Android 11.0+ (API 30)
- Tested on: Samsung, Google Pixel, OnePlus devices

## Getting Help

1. Check this feature overview
2. Review main README.md for setup
3. Check DEPLOYMENT.md for hosting
4. Contact development team

---

Last Updated: 2025-11-17
Version: 1.0.0
