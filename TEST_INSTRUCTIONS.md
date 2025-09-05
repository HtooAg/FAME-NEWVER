# Testing Instructions for WebSocket Implementation

## Prerequisites

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open multiple browser tabs for testing

## Test Scenarios

### Scenario 1: Stage Manager Registration and Approval

#### Step 1: Register a New Stage Manager

1. Go to `/register`
2. Fill in the registration form:
    - First Name: Test
    - Last Name: Manager
    - Email: test.manager@example.com
    - Password: testpassword123
    - Phone: (optional)
3. Submit the form
4. Verify registration success message: "Stage Manager account created successfully. Your account is pending approval."

#### Step 2: Login as Pending Stage Manager

1. Go to `/login`
2. Login with the credentials from Step 1
3. Verify redirect to `/stage-manager-pending`
4. Verify the pending approval page displays correctly
5. Note the "Check Status" button

#### Step 3: Login as Super Admin

1. Open a new browser tab
2. Go to `/login`
3. Login as super admin (use existing admin credentials)
4. Go to `/super-admin`
5. Verify the pending registrations tab shows the new stage manager

#### Step 4: Test Real-Time Approval

1. Keep both tabs open (pending page + admin dashboard)
2. In the admin dashboard, click "Approve" for the test stage manager
3. **Expected Result**: The pending page should automatically show success alert and redirect to dashboard
4. Verify the stage manager can access `/stage-manager` dashboard

### Scenario 2: Admin Actions on Active Stage Managers

#### Step 1: Setup

1. Ensure you have an active stage manager account
2. Login as the stage manager in one tab
3. Login as super admin in another tab

#### Step 2: Test Deactivation

1. In admin dashboard, go to "All Stage Managers" tab
2. Find the active stage manager
3. Click "Deactivate" button
4. **Expected Result**: Stage manager tab should show error alert and redirect to login

#### Step 3: Test Credential Change

1. Create another active stage manager account
2. In admin dashboard, click "Change Credentials" for the stage manager
3. Enter new username (email) and password
4. Click "Update Credentials"
5. **Expected Result**: Stage manager should receive notification and be redirected to login
6. Verify the stage manager can login with new credentials

#### Step 4: Test Account Deletion

1. Create another stage manager account for testing
2. In admin dashboard, click "Delete" button
3. Confirm the deletion
4. **Expected Result**: Stage manager should receive notification and be redirected to login
5. Verify the account no longer exists in admin dashboard

### Scenario 3: Manual Status Checking

#### Step 1: Setup

1. Register a new stage manager (pending status)
2. Login and go to pending page
3. Do NOT keep admin dashboard open

#### Step 2: Approve via Admin (Different Session)

1. Open incognito/private browser window
2. Login as admin
3. Approve the stage manager
4. Close the admin window

#### Step 3: Test Manual Check

1. Go back to the pending page
2. Click "Check Status" button
3. **Expected Result**: Should detect approval and redirect to dashboard

## WebSocket Connection Testing

### Test 1: Connection Establishment

1. Open browser developer tools (F12)
2. Go to Console tab
3. Login as stage manager
4. Look for WebSocket connection messages:
    - "Connected to WebSocket server"
    - "User [userId] (stage_manager) authenticated"

### Test 2: Real-Time Message Delivery

1. Keep developer console open
2. Perform admin actions from another tab
3. Verify console shows received messages:
    - "Account status changed: [data]"
    - "Admin notification received: [data]"

## Error Handling Testing

### Test 1: Network Disconnection

1. Login as stage manager
2. Disconnect internet/network
3. Reconnect network
4. Verify WebSocket reconnects automatically
5. Test admin actions still work

### Test 2: Invalid Actions

1. Try to access `/stage-manager` with pending status
2. Verify redirect to pending page
3. Try to access admin pages without proper role
4. Verify proper error handling

## Performance Testing

### Test 1: Multiple Connections

1. Open 5+ browser tabs with different stage manager accounts
2. Perform admin actions
3. Verify all tabs receive appropriate notifications
4. Check server console for connection management

### Test 2: Rapid Actions

1. Quickly approve/reject multiple stage managers
2. Verify all notifications are delivered
3. Check for any message loss or delays

## Expected Results Summary

✅ **Working Features:**

-   Stage manager pending approval page
-   Real-time status updates via WebSocket
-   Admin dashboard with new action buttons
-   Automatic redirects on status changes
-   Manual status checking fallback
-   Proper error handling and alerts
-   Cross-browser compatibility

❌ **Common Issues to Check:**

-   WebSocket connection failures
-   Missing real-time updates
-   Incorrect redirects
-   UI component errors
-   Authentication issues

## Troubleshooting

### WebSocket Not Connecting

1. Check server console for errors
2. Verify port 3000 is available
3. Check browser console for connection errors
4. Ensure socket.io dependencies are installed

### Real-Time Updates Not Working

1. Verify user authentication in WebSocket
2. Check room joining in server logs
3. Verify event emission in admin actions
4. Check client event listeners

### UI Issues

1. Verify all UI components are imported
2. Check for missing CSS classes
3. Verify alert component styling
4. Check responsive design on mobile

## Success Criteria

-   ✅ Stage managers can see pending approval page
-   ✅ Real-time notifications work without page refresh
-   ✅ Admin can manage stage managers with new actions
-   ✅ Automatic redirects work properly
-   ✅ Manual status checking works as fallback
-   ✅ WebSocket connections are stable
-   ✅ Error handling is graceful
-   ✅ UI is responsive and user-friendly
