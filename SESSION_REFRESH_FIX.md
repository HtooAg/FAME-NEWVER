# Session Refresh Fix Summary

## Problem

When stage managers get approved (status changes from "pending" to "active"), their session cookie still contains the old "pending" status. This causes:

-   401 Unauthorized errors when accessing APIs
-   403 Forbidden errors on stage manager endpoints
-   Inability to access the dashboard after approval

## Root Cause

Session cookies are not automatically updated when user data changes in the database. The session contains a snapshot of user data from login time.

## Solution Applied

### 1. Created Session Refresh API

**File:** `src/app/api/auth/refresh-session/route.ts`

-   Fetches fresh user data from database
-   Creates new session with updated status/role
-   Returns updated user information
-   Sets new session cookie

### 2. Created Missing /api/auth/me Endpoint

**File:** `src/app/api/auth/me/route.ts`

-   Uses session-based authentication (not JWT)
-   Returns current user data from database
-   Fixes 500 errors on user info requests

### 3. Updated Stage Manager Pending Page

**File:** `src/app/stage-manager-pending/page.tsx`

-   Calls session refresh before status checking
-   Updates session when WebSocket receives approval notification
-   Ensures smooth transition to dashboard

### 4. Updated Stage Manager Dashboard

**File:** `src/app/stage-manager/page.tsx`

-   Refreshes session on page load
-   Redirects to pending page if still pending
-   Handles session/database status mismatches

### 5. Updated Stage Manager Profile API

**File:** `src/app/api/stage-manager/profile/route.ts`

-   Uses fresh database data for authorization
-   Allows both "active" and "pending" status access
-   Fixes 403 Forbidden errors

### 6. Updated Middleware

**File:** `middleware.ts`

-   Allows pending stage managers to access dashboard
-   Dashboard handles session refresh and proper redirects
-   Prevents redirect loops

## Flow After Fix

### Approval Process

1. **Admin approves** stage manager in dashboard
2. **Database updated** - user status: "pending" → "active"
3. **WebSocket notification** sent to user
4. **Pending page receives** notification
5. **Session refreshed** automatically via API call
6. **User redirected** to dashboard with fresh session

### Manual Status Check

1. **User clicks** "Check Status" button
2. **Session refreshed** first to get latest data
3. **Status checked** against fresh database data
4. **Redirect occurs** if status changed

### Dashboard Access

1. **User navigates** to `/stage-manager`
2. **Session refreshed** on page load
3. **Fresh status checked** against database
4. **Redirect to pending** if still pending
5. **Dashboard loads** if approved

## API Endpoints Added/Fixed

### ✅ `/api/auth/refresh-session` (NEW)

-   **Method:** POST
-   **Purpose:** Updates session with fresh user data
-   **Returns:** Updated user info and redirect URL

### ✅ `/api/auth/me` (NEW)

-   **Method:** GET
-   **Purpose:** Returns current user information
-   **Uses:** Session-based authentication

### ✅ `/api/stage-manager/profile` (FIXED)

-   **Issue:** 403 Forbidden errors
-   **Fix:** Uses fresh database data for authorization
-   **Now:** Allows pending and active users

## Testing the Fix

### Test Scenario 1: Real-time Approval

1. Register stage manager (pending status)
2. Login → redirected to pending page ✅
3. Admin approves user ✅
4. WebSocket notification received ✅
5. Session automatically refreshed ✅
6. Redirect to dashboard works ✅
7. Dashboard APIs work (no 401/403 errors) ✅

### Test Scenario 2: Manual Status Check

1. Stage manager on pending page
2. Admin approves (different browser/session)
3. User clicks "Check Status" ✅
4. Session refreshed with new status ✅
5. Redirect to dashboard ✅
6. No authorization errors ✅

### Test Scenario 3: Direct Dashboard Access

1. User with pending session but active database status
2. Navigate to `/stage-manager` ✅
3. Session refreshed automatically ✅
4. Dashboard loads successfully ✅
5. All APIs work correctly ✅

## Debug Information

The refresh session endpoint includes detailed logging:

```
Session refresh requested
Current session: { userId: "...", role: "stage_manager", status: "pending" }
Fetching fresh user data for: user-123
Fresh user data: { id: "user-123", role: "stage_manager", status: "active" }
New session data: { userId: "user-123", role: "stage_manager", status: "active" }
Session refresh successful, status changed: true
```

## Expected Results

✅ **No more 401 Unauthorized errors**  
✅ **No more 403 Forbidden errors**  
✅ **Smooth approval process with real-time updates**  
✅ **Dashboard accessible after approval**  
✅ **All stage manager APIs work correctly**  
✅ **Session stays in sync with database**  
✅ **Manual status checking works**  
✅ **WebSocket notifications work**

## Files Modified

-   `src/app/api/auth/refresh-session/route.ts` (NEW)
-   `src/app/api/auth/me/route.ts` (NEW)
-   `src/app/stage-manager-pending/page.tsx` (UPDATED)
-   `src/app/stage-manager/page.tsx` (UPDATED)
-   `src/app/api/stage-manager/profile/route.ts` (UPDATED)
-   `middleware.ts` (UPDATED)

The session refresh system ensures that user sessions stay synchronized with the database, eliminating authorization errors during the approval process.
