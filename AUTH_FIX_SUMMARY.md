# Authentication Fix Summary

## Problem

When stage managers registered, they were stored in `registrations/stage-managers/pending.json`, but during login, the system only looked in `users/stage_manager/users.json`. This caused a "User not found" error for pending stage managers.

## Root Cause

The `getUserByEmail` function in `src/lib/data-access.ts` was only checking active user collections, not pending registrations.

## Solution Applied

### 1. Updated `getUserByEmail` function

**File:** `src/lib/data-access.ts`

**Before:**

```typescript
async getUserByEmail(email: string): Promise<User | null> {
    // Only checked users/super_admin/users.json and users/stage_manager/users.json
    return null; // if not found in active users
}
```

**After:**

```typescript
async getUserByEmail(email: string): Promise<User | null> {
    // Check super admin users
    // Check stage manager users
    // Also check pending stage manager registrations
    const pendingStageManagers = await this.readJson<User[]>(
        "registrations/stage-managers/pending.json"
    );
    if (pendingStageManagers) {
        const pendingStageManager = pendingStageManagers.find(
            (user) => user.email === email
        );
        if (pendingStageManager) return pendingStageManager;
    }
    return null;
}
```

### 2. Updated `getAllUsers` function

**File:** `src/lib/data-access.ts`

Added pending registrations to the complete user list:

```typescript
// Also include pending stage manager registrations
const pendingStageManagers = await this.readJson<User[]>(
	"registrations/stage-managers/pending.json"
);
if (pendingStageManagers) {
	users.push(...pendingStageManagers);
}
```

### 3. Updated `updateUser` function

**File:** `src/lib/data-access.ts`

Added support for updating pending users:

```typescript
// If not found in regular users, check pending registrations for stage managers
if (user.role === "stage_manager") {
	const pendingPath = "registrations/stage-managers/pending.json";
	const pendingUsers = (await this.readJson<User[]>(pendingPath)) || [];

	const pendingIndex = pendingUsers.findIndex((u) => u.id === user.id);
	if (pendingIndex !== -1) {
		pendingUsers[pendingIndex] = user;
		await this.writeJson(pendingPath, pendingUsers);
		return;
	}
}
```

### 4. Enhanced `addPendingStageManager` function

**File:** `src/lib/data-access.ts`

Added duplicate email checking:

```typescript
async addPendingStageManager(user: User): Promise<void> {
    // Check if user already exists anywhere in the system
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
        throw new Error("User with this email already exists");
    }
    // ... rest of function
}
```

## Flow After Fix

### Registration Flow

1. User registers at `/register`
2. API calls `addPendingStageManager()`
3. User saved to `registrations/stage-managers/pending.json`
4. Status: `pending`, Role: `stage_manager`

### Login Flow

1. User attempts login at `/login`
2. API calls `getUserByEmail()`
3. Function now checks:
    - `users/super_admin/users.json`
    - `users/stage_manager/users.json`
    - `registrations/stage-managers/pending.json` ✅ **NEW**
4. Pending user found and authenticated
5. Redirected to `/stage-manager-pending`

### Approval Flow

1. Admin approves pending user
2. User moved from `registrations/stage-managers/pending.json` to `users/stage_manager/users.json`
3. Status changed from `pending` to `active`
4. Real-time notification sent via WebSocket
5. User redirected to dashboard

## Testing the Fix

### Quick Test

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# 2. Login (should work now)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Expected Results

✅ Registration: Success message  
✅ Login: Success with `redirectUrl: "/stage-manager-pending"`  
✅ No more "User not found" errors  
✅ Pending page accessible  
✅ WebSocket authentication works  
✅ Admin can see pending user  
✅ Approval process works

## Files Modified

-   `src/lib/data-access.ts` - Core authentication functions
-   No frontend changes needed
-   No API endpoint changes needed

## Impact

-   ✅ Fixes login for pending stage managers
-   ✅ Maintains all existing functionality
-   ✅ No breaking changes
-   ✅ Backward compatible
-   ✅ Supports the complete approval workflow
