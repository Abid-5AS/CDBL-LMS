# Troubleshooting Guide

> Solutions to common issues in the CDBL Leave Management System

## Table of Contents

- [Login Issues](#login-issues)
- [Leave Application Problems](#leave-application-problems)
- [File Upload Issues](#file-upload-issues)
- [Balance Discrepancies](#balance-discrepancies)
- [Approval Issues](#approval-issues)
- [Performance Problems](#performance-problems)
- [Display & UI Issues](#display--ui-issues)

---

## Login Issues

### Cannot log in with email and password

**Symptoms:** "Invalid credentials" error

**Solutions:**
1. Verify email is your CDBL email (@cdbl.com)
2. Check Caps Lock is off
3. Try password reset via HR Admin
4. Clear browser cache and cookies
5. Try incognito/private browsing mode

### Session expired immediately after login

**Symptoms:** Logged out right after signing in

**Solutions:**
1. Clear browser cookies
2. Ensure browser accepts third-party cookies
3. Check system date/time is correct
4. Try different browser
5. Contact IT support

### Two-factor authentication not working

**Symptoms:** OTP not received or invalid

**Solutions:**
1. Check email spam/junk folder
2. Request new OTP after 1 minute
3. Verify email address in profile is correct
4. Contact HR to reset 2FA
5. Check email server is not blocking automated emails

---

## Leave Application Problems

### "Insufficient balance" error but balance shows available

**Symptoms:** Error even though balance appears sufficient

**Causes & Solutions:**

**Overlapping Leaves:**
- Check if you have pending/approved leave for same dates
- Cancel or modify conflicting leave first

**Working Day Calculation:**
- System excludes weekends and holidays
- Verify working days match your expectation

**Pending Deductions:**
- Approved leaves not yet deducted from balance
- Refresh balance page to see pending deductions

**Wrong Leave Type:**
- Ensure you're checking balance for correct type
- CL, ML, EL have separate balances

### Cannot submit leave request

**Symptoms:** Submit button disabled or errors on submission

**Common Causes:**

1. **Required fields empty**
   - Fill all fields marked with *
   - Provide minimum 10-character reason

2. **Invalid date range**
   - End date must be after start date
   - Cannot select past dates (except Medical Leave)
   - Check if dates fall on holidays/weekends only

3. **Missing documents**
   - Medical certificate required for ML > 3 days
   - Upload document before submitting

4. **Duplicate request**
   - Cannot have overlapping leave dates
   - Cancel existing request first

### Leave not appearing in history

**Symptoms:** Submitted leave doesn't show in My Leaves

**Solutions:**
1. Refresh the page (F5)
2. Check filter settings (Status, Date range)
3. Clear browser cache
4. Verify submission confirmation was received
5. Contact HR if still missing after 30 minutes

### Cannot edit submitted leave

**Symptoms:** Edit button not available

**Explanation:**
- Once submitted, leave can only be edited if returned for modification
- Before submission (DRAFT status): Can edit freely
- After submission: Must cancel and resubmit, or wait for "Return for Modification"

**Workaround:**
- Cancel the request
- Create new request with correct details

---

## File Upload Issues

### File upload fails

**Symptoms:** "Upload failed" or upload spinner forever

**Solutions:**

**File too large:**
- Maximum size: 5 MB
- Compress or resize image
- Convert multi-page PDF to compressed format

**Invalid file type:**
- Only PDF, JPG, PNG accepted
- Convert other formats (e.g., HEIC to JPG)
- Rename file to have correct extension

**Network issues:**
- Check internet connection
- Try uploading again
- Use smaller file
- Try different network (mobile data vs WiFi)

**Browser issues:**
- Clear browser cache
- Try different browser
- Disable browser extensions
- Check browser console for errors

### Uploaded file not displaying

**Symptoms:** Upload succeeded but file doesn't appear

**Solutions:**
1. Refresh the page
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Wait 1-2 minutes for processing
4. Check if file size was within limit
5. Try re-uploading

### Cannot download uploaded certificate

**Symptoms:** Download link not working

**Solutions:**
1. Right-click and "Save link as..."
2. Try different browser
3. Check popup blocker settings
4. Clear browser cache
5. Contact IT if file is corrupted

---

## Balance Discrepancies

### Balance calculation seems wrong

**Symptoms:** Numbers don't match expected balance

**Diagnostic Steps:**

1. **Check the year**
   - Ensure viewing correct year (default: current year)
   - Switch year dropdown if needed

2. **Verify accrual calculation**
   - EL: 2 days/month from join date
   - CL & ML: 14 days on Jan 1st
   - Pro-rated for new joiners

3. **Check pending leaves**
   - Approved leaves reduce projected balance
   - Pending leaves shown separately
   - Rejected leaves don't affect balance

4. **Review leave history**
   - Export leave history to Excel
   - Manually verify used days
   - Check for cancelled leaves (may still show)

5. **Verify conversions**
   - EL > 60 days converts to Special Leave
   - Check conversion history

**Still wrong?**
- Take screenshot of balance page
- Note down expected vs actual
- Email hr@cdbl.com with details

### Conversion not reflected

**Symptoms:** EL over 60 days but no Special Leave credit

**Explanation:**
- Conversions process at year-end (December 31st)
- Mid-year excess doesn't auto-convert
- Manual conversion by HR required for special cases

**Solution:**
- Wait until year-end for automatic conversion
- Contact HR for manual processing if urgent

### Encashment not updating balance

**Symptoms:** Encashment approved but balance not reduced

**Timeline:**
- HR approval: Immediate
- Finance processing: 1-2 business days
- Balance update: After finance confirmation
- Payment: Next salary cycle

**If delayed beyond 3 days:**
- Contact HR Admin
- Verify encashment status
- Check audit log

---

## Approval Issues

### Approval stuck for long time

**Symptoms:** Leave pending with same approver for days

**Timeframes:**
- HR Admin: 1 business day
- Department Head: 2 business days
- HR Head: 3 business days
- CEO: 5 business days

**Actions:**

**If within timeframe:**
- Wait for automatic reminder (sent at 50% of timeframe)

**If beyond timeframe:**
- Automatic escalation triggers
- Check if approver is on leave
- Contact HR Admin for manual escalation
- Email approver directly as reminder

### Cannot approve leave (for approvers)

**Symptoms:** Approve button not working

**Common Causes:**

1. **Not your turn**
   - Check approval step sequence
   - Wait for previous approver

2. **Already approved/rejected**
   - Refresh page
   - Check approval timeline

3. **Missing information**
   - Employee needs to upload documents
   - Request modification first

4. **System error**
   - Clear cache and retry
   - Try different browser
   - Contact IT support

### Approval notification not received

**Symptoms:** Leave approved but no email/notification

**Solutions:**
1. Check notification bell in app
2. Check email spam folder
3. Verify email settings in profile
4. Enable browser notifications
5. Check notification preferences in settings

---

## Performance Problems

### Pages loading slowly

**Symptoms:** Long wait times, spinners

**Solutions:**

**Browser-side:**
1. Clear browser cache and cookies
2. Close unnecessary browser tabs
3. Disable heavy extensions
4. Update browser to latest version
5. Try incognito mode

**Network-side:**
1. Check internet connection speed
2. Try different network (WiFi vs mobile)
3. Avoid peak hours (9-11 AM)
4. Use wired connection if possible

**System-side:**
1. Report to IT if persistent
2. Check status page for outages
3. Try during off-peak hours

### Dashboard not loading

**Symptoms:** Blank screen or loading forever

**Solutions:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear local storage:
   - Open browser console (F12)
   - Go to Application > Local Storage
   - Clear all entries
3. Try different browser
4. Check browser console for errors
5. Report to IT with screenshot

### Export taking too long

**Symptoms:** Export stuck at "Generating..."

**Causes:**
- Too much data (> 10,000 records)
- Complex date range
- Server load

**Solutions:**
1. Reduce date range
2. Add more filters (department, status, etc.)
3. Try exporting in smaller chunks
4. Use Excel format (faster than PDF)
5. Try during off-peak hours

---

## Display & UI Issues

### Page looks broken or misaligned

**Symptoms:** Layout issues, overlapping text

**Solutions:**
1. Ensure browser is up-to-date
2. Clear cache and cookies
3. Zoom level at 100% (Ctrl+0 / Cmd+0)
4. Try different browser
5. Disable browser extensions
6. Check screen resolution (min 1280x720)

### Dark mode not working

**Symptoms:** Stuck in light/dark mode

**Solutions:**
1. Click theme toggle in navigation
2. Check system theme settings
3. Clear local storage
4. Refresh page
5. Reset preferences in settings

### Mobile view issues

**Symptoms:** Desktop view on mobile, hard to use

**Solutions:**
1. Rotate device to portrait mode
2. Pinch to zoom in/out
3. Force refresh (pull down)
4. Clear mobile browser cache
5. Try Chrome mobile browser
6. Update mobile OS

### Calendar not displaying holidays

**Symptoms:** Holiday calendar shows empty

**Solutions:**
1. Check year/month filter settings
2. Refresh page
3. Verify holidays are defined for that period
4. Contact HR if holidays missing
5. Try list view instead of calendar view

### Buttons not clickable

**Symptoms:** Click doesn't work, no response

**Solutions:**
1. Check if button is disabled (grayed out)
2. Ensure form is fully loaded
3. Disable browser extensions
4. Try different browser
5. Check browser console for JavaScript errors

---

## Error Messages

### "Network Error" or "Failed to fetch"

**Causes:** Connection lost, server down, firewall

**Solutions:**
1. Check internet connection
2. Try accessing other websites
3. Disable VPN if using
4. Check firewall settings
5. Retry after a few minutes
6. Contact IT if persistent

### "Session expired"

**Cause:** Inactive for > 30 minutes

**Solution:**
- Log in again
- Your unsaved work may be lost
- Enable auto-save if available

### "Unauthorized" or "Access Denied"

**Causes:** Insufficient permissions, wrong role

**Solutions:**
1. Verify you're logged in
2. Check your assigned role
3. Contact HR if permissions incorrect
4. Log out and log back in
5. Clear cookies and retry

### "Database error"

**Cause:** Temporary system issue

**Solutions:**
1. Wait 1-2 minutes and retry
2. If during business hours, IT notified automatically
3. If after hours, call emergency support
4. Do not retry repeatedly (may worsen issue)

---

## Advanced Troubleshooting

### Collect diagnostic information

When reporting issues, include:

1. **Screenshot** of error message
2. **Browser** and version (e.g., Chrome 120)
3. **Operating System** (Windows 11, macOS, etc.)
4. **Steps to reproduce** the issue
5. **Expected** vs **Actual** behavior
6. **Browser console** errors (F12 > Console tab)

### Check browser console

1. Press F12 (or Cmd+Option+I on Mac)
2. Go to Console tab
3. Look for red errors
4. Take screenshot
5. Send to IT support

### Clear all browser data

**Chrome:**
1. Settings > Privacy > Clear browsing data
2. Select "All time"
3. Check all boxes
4. Clear data

**Firefox:**
1. Settings > Privacy & Security
2. Clear Data
3. Select all
4. Clear

**Safari:**
1. Preferences > Privacy
2. Manage Website Data
3. Remove All

---

## Getting Help

### Self-Service Resources

1. Check this troubleshooting guide
2. Search FAQ documentation
3. Review user guide for your role
4. Check system status page
5. Browse help center articles

### Contact Support

**Priority 1 (Critical - System Down):**
- Emergency Hotline: +880-XXXX-XXXXXX (24/7)
- Expected response: 15 minutes

**Priority 2 (High - Cannot work):**
- Support Email: support@cdbl.com
- Expected response: 2 hours

**Priority 3 (Medium - Workaround exists):**
- Support Email: support@cdbl.com
- Expected response: 4 hours

**Priority 4 (Low - Question/Request):**
- Email: support@cdbl.com
- Expected response: 1 business day

### Information to provide

- **Subject:** Clear description of issue
- **Priority:** Indicate urgency
- **Details:** What you were doing when error occurred
- **Screenshot:** Visual proof of issue
- **Browser/Device:** What you're using
- **Attempted solutions:** What you already tried

---

*Last Updated: November 15, 2025*
