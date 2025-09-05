# WebSocket Implementation for Real-Time Notifications

## Overview

This implementation adds real-time notifications for stage manager account management using WebSocket connections.

## Features Implemented

### 1. Stage Manager Pending Approval Page

-   **Location**: `/src/app/stage-manager-pending/page.tsx`
-   **Purpose**: Shows pending approval status for stage managers
-   **Features**:
    -   Real-time status updates via WebSocket
    -   Check Status button for manual status checking
    -   Automatic redirect to dashboard when approved
    -   Alert notifications for status changes

### 2. WebSocket Server

-   **Location**: `/server.js`
-   **Purpose**: Handles real-time communication between admin and stage managers
-   **Features**:
    -   User authentication and room management
    -   Status update broadcasting
    -   Admin action notifications
    -   Connection management

### 3. WebSocket Client Hook

-   **Location**: `/src/hooks/useWebSocket.ts`
-   **Purpose**: React hook for WebSocket functionality
-   **Features**:
    -   Automatic connection management
    -   Event handling for status changes
    -   Admin notification handling
    -   Cleanup on unmount

### 4. Enhanced Super Admin Dashboard

-   **Location**: `/src/app/super-admin/page.tsx`
-   **New Features**:
    -   Deactivate button for active stage managers
    -   Delete button with confirmation
    -   Change credentials dialog (username/password)
    -   Real-time notification sending

### 5. Enhanced Stage Manager Dashboard

-   **Location**: `/src/app/stage-manager/page.tsx`
-   **New Features**:
    -   Real-time notification alerts
    -   Automatic logout on account actions
    -   Alert display for admin actions

## API Enhancements

### Super Admin Users API

-   **Location**: `/src/app/api/super-admin/users/route.ts`
-   **New Actions**:
    -   `deactivate`: Deactivates a stage manager account
    -   `delete`: Permanently deletes a stage manager account
    -   `changeCredentials`: Updates username and password

### Login API Updates

-   **Location**: `/src/app/api/auth/login/route.ts`
-   **Changes**:
    -   Allows pending stage managers to login
    -   Redirects to pending page instead of blocking login

## Real-Time Notification Flow

### 1. Account Approval

1. Admin clicks "Approve" on pending stage manager
2. API updates user status to "active"
3. WebSocket sends `status_update` event to user
4. Stage manager receives notification and redirects to dashboard

### 2. Account Actions (Deactivate/Delete/Change Credentials)

1. Admin performs action on stage manager
2. API processes the action
3. WebSocket sends `admin_action` event to user
4. Stage manager receives notification and redirects to login

### 3. Real-Time Status Checking

1. Stage manager clicks "Check Status" button
2. API checks current status
3. If status changed, appropriate action is taken
4. WebSocket provides instant updates without manual checking

## Usage Instructions

### For Stage Managers

1. Register as stage manager (status: pending)
2. Login redirects to pending approval page
3. Wait for admin approval or click "Check Status"
4. Receive real-time notifications when status changes
5. Automatic redirect to dashboard when approved

### For Super Admins

1. View pending registrations in admin dashboard
2. Approve/reject pending stage managers
3. Manage existing stage managers:
    - Deactivate active accounts
    - Delete accounts permanently
    - Change login credentials
4. Real-time notifications sent automatically

## Technical Details

### WebSocket Events

-   `authenticate`: User joins their room
-   `status_update`: Status change notifications
-   `admin_action`: Admin action notifications
-   `account_status_changed`: Client receives status updates
-   `admin_notification`: Client receives admin actions

### Security

-   User authentication required for WebSocket connection
-   Room-based message delivery (user-specific)
-   Session validation for all actions

### Error Handling

-   Connection retry logic
-   Graceful fallback to manual status checking
-   Error alerts for failed operations

## Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. WebSocket server runs automatically with Next.js
4. Test with multiple browser tabs (admin + stage manager)

## Production Considerations

-   WebSocket server scales with application
-   Consider using Redis for multi-instance deployments
-   Monitor WebSocket connections for performance
-   Implement connection limits if needed
