# Authentication Bypass Implementation Guide

**Purpose**: Disable authentication for QA testing while maintaining full feature access
**Environment**: Development only (Never use in production)
**Version**: 1.0

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Implementation Methods](#implementation-methods)
3. [Environment Variables](#environment-variables)
4. [Testing with Different Roles](#testing-with-different-roles)
5. [Reverting Changes](#reverting-changes)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 30-Second Setup

```bash
# 1. Navigate to project root
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management

# 2. Create/edit .env.local
cat > .env.local << 'EOF'
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave_test"
JWT_SECRET="test-secret-key-minimum-32-characters-long"
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"

# Enable auth bypass for testing
SKIP_AUTH=true
MOCK_USER_ROLE=CEO

# Optional: Enable test mode
NEXT_PUBLIC_TEST_MODE=true
EOF

# 3. Start server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
# You should see the dashboard (bypassing login)
```

---

## Implementation Methods

### Method 1: Middleware Bypass (RECOMMENDED)

This is the cleanest and most comprehensive method.

**File Location**: `middleware.ts` (in project root)

**Step 1: Find the middleware file**
```bash
ls -la middleware.ts
# If it doesn't exist, create it
```

**Step 2: Add bypass logic**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TESTING ONLY: Bypass authentication for development
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_AUTH === "true"
  ) {
    // Skip auth check, add mock user info
    const mockUserId = "test-user-" + (process.env.MOCK_USER_ROLE || "CEO");
    const mockRole = process.env.MOCK_USER_ROLE || "CEO";

    const mockUser = {
      id: mockUserId,
      email: mockRole.toLowerCase() + "@cdbl.com",
      role: mockRole,
      name: mockRole.replace(/_/g, " "),
    };

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-mock-user", JSON.stringify(mockUser));
    requestHeaders.set("x-skip-auth", "true");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Normal authentication check
  const token = request.cookies.get("token")?.value;

  if (!token && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Step 3: Update lib/auth.ts**

Find the `getSession()` function and update it:

```typescript
export async function getSession(request?: Request) {
  // TESTING ONLY: Return mock session when auth bypass enabled
  if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
    const mockRole = process.env.MOCK_USER_ROLE || "CEO";
    return {
      id: "test-user-" + mockRole.toLowerCase(),
      email: mockRole.toLowerCase() + "@cdbl.com",
      name: mockRole.replace(/_/g, " "),
      role: mockRole as UserRole,
      department: "Test Department",
      isAuthenticated: true,
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: request?.headers || {},
      credentials: "include",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
```

---

### Method 2: Environment Variable Check in Routes

Alternative method using environment variables in API routes.

**File Location**: `app/api/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

// TESTING ONLY: Mock authentication
export async function GET(request: NextRequest) {
  // Check if auth bypass is enabled
  if (process.env.SKIP_AUTH === "true") {
    const mockRole = request.headers.get("x-mock-role") || "CEO";
    return NextResponse.json({
      id: "test-user-" + mockRole.toLowerCase(),
      email: mockRole.toLowerCase() + "@cdbl.com",
      role: mockRole,
      name: mockRole.replace(/_/g, " "),
      isAuthenticated: true,
    });
  }

  // Normal auth flow
  // ... existing code ...
}
```

---

### Method 3: React Context Mock

Update the auth context to inject mock user.

**File Location**: `lib/auth-context.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TESTING ONLY: Mock user injection
    if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
      const mockRole = process.env.NEXT_PUBLIC_MOCK_USER_ROLE || "CEO";
      setUser({
        id: "test-user-" + mockRole.toLowerCase(),
        email: mockRole.toLowerCase() + "@cdbl.com",
        role: mockRole as UserRole,
        name: mockRole.replace(/_/g, " "),
        isAuthenticated: true,
      });
      setLoading(false);
      return;
    }

    // Normal auth check
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        setUser(await response.json());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

---

## Environment Variables

### Complete .env.local Setup

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave_test"

# ===========================================
# JWT & AUTHENTICATION
# ===========================================
JWT_SECRET="test-secret-key-minimum-32-characters-long"
JWT_EXPIRES_IN="8h"

# ===========================================
# NODE ENVIRONMENT
# ===========================================
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"

# ===========================================
# TESTING CONFIGURATION (DEV ONLY)
# ===========================================
# Method 1: Skip authentication entirely
SKIP_AUTH=true

# Method 2: Test mode with mock user
NEXT_PUBLIC_TEST_MODE=true

# ===========================================
# ROLE SELECTION (Change to test different roles)
# ===========================================
# Options: CEO, HR_HEAD, HR_ADMIN, DEPT_HEAD, EMPLOYEE, SYSTEM_ADMIN
MOCK_USER_ROLE=CEO

# ===========================================
# FILE UPLOAD
# ===========================================
NEXT_PUBLIC_FILE_UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880  # 5MB in bytes

# ===========================================
# FEATURES
# ===========================================
NEXT_PUBLIC_FEATURE_FLAGS="all"
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_LOGGING=true

# ===========================================
# API CONFIGURATION
# ===========================================
NEXT_PUBLIC_API_URL="http://localhost:3000"
API_TIMEOUT=30000  # 30 seconds
```

---

## Testing with Different Roles

### Quick Role Switching

**Step 1: Edit .env.local**
```bash
# For CEO
MOCK_USER_ROLE=CEO

# For HR_HEAD
MOCK_USER_ROLE=HR_HEAD

# For HR_ADMIN
MOCK_USER_ROLE=HR_ADMIN

# For DEPT_HEAD
MOCK_USER_ROLE=DEPT_HEAD

# For EMPLOYEE
MOCK_USER_ROLE=EMPLOYEE

# For SYSTEM_ADMIN
MOCK_USER_ROLE=SYSTEM_ADMIN
```

**Step 2: Reload page**
- Press `F5` (Windows) or `Cmd+R` (Mac)
- Or close and reopen the browser tab

**Expected behavior**: Dashboard adapts to the selected role

### Create Role-Specific Test Script

**File**: `scripts/test-role.sh`

```bash
#!/bin/bash

ROLE=$1

if [ -z "$ROLE" ]; then
    echo "Usage: ./scripts/test-role.sh [ROLE]"
    echo "Available roles: CEO, HR_HEAD, HR_ADMIN, DEPT_HEAD, EMPLOYEE, SYSTEM_ADMIN"
    exit 1
fi

# Update .env.local
sed -i.bak "s/MOCK_USER_ROLE=.*/MOCK_USER_ROLE=$ROLE/" .env.local

echo "✓ Set role to: $ROLE"
echo "✓ Reload the page to see changes"
echo ""
echo "Open http://localhost:3000 in browser and refresh (F5)"
```

**Usage**:
```bash
chmod +x scripts/test-role.sh
./scripts/test-role.sh CEO
./scripts/test-role.sh HR_HEAD
./scripts/test-role.sh EMPLOYEE
```

---

## Reverting Changes

### Remove Auth Bypass

**Step 1: Update .env.local**
```bash
# Remove or set to false
SKIP_AUTH=false
NEXT_PUBLIC_TEST_MODE=false
```

**Step 2: Restore middleware.ts** (if modified)
```bash
# If you have git
git checkout middleware.ts

# Or manually remove the testing code block
```

**Step 3: Restart server**
```bash
# Stop: Ctrl+C
# Restart: npm run dev
```

### Complete Rollback

```bash
# If using git, revert all changes
git checkout .env.local middleware.ts lib/auth.ts

# Restart server
npm run dev
```

---

## Troubleshooting

### Issue 1: Still seeing login page after bypass enabled

**Solution**:
1. Make sure `SKIP_AUTH=true` in `.env.local`
2. Make sure `NODE_ENV=development`
3. Clear browser cache: `Ctrl+Shift+Delete` (Chrome)
4. Restart development server: `npm run dev`
5. Hard reload: `Ctrl+Shift+R`

### Issue 2: Wrong role showing

**Solution**:
1. Verify `MOCK_USER_ROLE` is set correctly
2. Reload page (F5)
3. Check `.env.local` for typos
4. Restart server

### Issue 3: Middleware not working

**Solution**:
1. Verify `middleware.ts` exists in root
2. Check syntax for errors: `npx tsc --noEmit`
3. Make sure bypass code is before normal auth check
4. Restart server

### Issue 4: Database connection error

**Solution**:
```bash
# Check if MySQL is running
mysql -u user -p -e "SELECT 1"

# If not running:
# On Mac with Homebrew:
brew services start mysql

# On Linux:
sudo systemctl start mysql

# Verify connection string
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < /dev/null
```

### Issue 5: "Database doesn't exist" error

**Solution**:
```bash
# Create database
mysql -u user -p -e "CREATE DATABASE cdbl_leave_test;"

# Run migrations
npx prisma migrate deploy

# Seed data
npm run seed
```

---

## Security Notes

### IMPORTANT: Never Use in Production

This bypass should ONLY be used in:
- ✓ Local development
- ✓ Development server
- ✓ Testing environment
- ✗ NOT in staging
- ✗ NOT in production
- ✗ NOT with real user data

### Recommendations

1. **Use feature flag**:
```typescript
if (
  process.env.NODE_ENV === "development" &&
  process.env.SKIP_AUTH === "true"
) {
  // Only then bypass auth
}
```

2. **Always check NODE_ENV**:
```typescript
if (process.env.NODE_ENV !== "development") {
  throw new Error("Auth bypass not allowed");
}
```

3. **Never commit to git with auth disabled**:
```bash
# Add to .gitignore if not already there
echo ".env.local" >> .gitignore

# Don't commit bypass code to main branch
git checkout middleware.ts  # Before committing
```

4. **Remove bypass code before deployment**:
```bash
# Check for bypass code
git grep "SKIP_AUTH" -- ":(exclude).env.local"
git grep "NEXT_PUBLIC_TEST_MODE" -- ":(exclude).env.local"

# Remove any found
```

---

## Example: Complete Testing Session

### Session 1: Test CEO Dashboard
```bash
# 1. Set role
echo "MOCK_USER_ROLE=CEO" >> .env.local

# 2. Start server
npm run dev

# 3. Open http://localhost:3000
# 4. Should see CEO dashboard with full access
# 5. Test all features as CEO
```

### Session 2: Test Employee Features
```bash
# 1. Update role
sed -i "s/MOCK_USER_ROLE=.*/MOCK_USER_ROLE=EMPLOYEE/" .env.local

# 2. Reload page (F5)
# 3. Should see employee dashboard only
# 4. Test leave application, balance, etc.
```

### Session 3: Test Approval Workflow
```bash
# Simulate complete workflow

# Step 1: Apply leave as EMPLOYEE
MOCK_USER_ROLE=EMPLOYEE
# Apply leave via /leaves/apply

# Step 2: Approve as HR_ADMIN
MOCK_USER_ROLE=HR_ADMIN
# Go to /approvals and approve

# Step 3: Approve as DEPT_HEAD
MOCK_USER_ROLE=DEPT_HEAD
# Go to /approvals and approve

# Step 4: Final approve as HR_HEAD
MOCK_USER_ROLE=HR_HEAD
# Go to /approvals and approve

# Step 5: CEO escalation (optional)
MOCK_USER_ROLE=CEO
# View approved leaves in dashboard
```

---

## Verification Checklist

After implementing auth bypass:

- [ ] Application loads without login screen
- [ ] Dashboard visible immediately
- [ ] Current role displays correctly
- [ ] Can switch roles via .env.local
- [ ] All pages accessible
- [ ] Components render without errors
- [ ] Database accessible
- [ ] Notifications functional
- [ ] File uploads working
- [ ] Approval workflow testable
- [ ] Console has no authentication errors

---

## Additional Resources

### Useful Commands

```bash
# Start development server with auto-reload
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# View database with Prisma Studio
npx prisma studio

# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Check active environment variables
env | grep -E "NEXT_PUBLIC_|MOCK_USER|SKIP_AUTH"

# View .env.local without committing
cat .env.local
```

### File Locations Reference

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth bypass logic (recommended) |
| `lib/auth.ts` | Session management |
| `lib/auth-context.tsx` | React auth context |
| `.env.local` | Environment variables |
| `app/api/auth/*` | Auth API routes |

---

## Next Steps

1. Implement auth bypass using Method 1 (Middleware)
2. Set up .env.local with test configuration
3. Run `npm run dev` to start server
4. Visit http://localhost:3000
5. Follow QA_TESTING_GUIDE.md for comprehensive testing
6. Switch roles as needed to test all features
7. Use QA_TESTING_GUIDE.md checklist to test all components

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Status**: Ready for Implementation
