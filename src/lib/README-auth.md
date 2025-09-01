# Authentication and Route Protection

This document explains how to use the authentication middleware and route protection utilities in the FAME system.

## Middleware

The middleware (`middleware.ts`) automatically protects routes based on user authentication and role requirements.

### Protected Routes

-   `/super-admin/*` - Requires `super_admin` role
-   `/stage-manager/*` - Requires `stage_manager` role
-   `/dj/*` - Requires `dj` role
-   `/artist/*` - Requires `artist` role

### Status-based Redirects

Users with non-active status are automatically redirected:

-   `pending` → `/account-pending`
-   `suspended` → `/account-suspended`
-   `deactivated` → `/account-deactivated`

### Public Routes

These routes don't require authentication:

-   `/` (home)
-   `/login`
-   `/register`
-   `/about`
-   `/contact`
-   `/events/register/*` (artist registration)

## API Route Protection

Use the `withAuth` higher-order function to protect API routes:

```typescript
import { withAuth } from "@/lib/route-protection";

export const GET = withAuth(
	async (request, session) => {
		// Your protected handler code here
		return NextResponse.json({ success: true });
	},
	{
		requiredRole: "stage_manager", // Optional: minimum role required
		allowedStatuses: ["active", "pending"], // Optional: allowed user statuses
	}
);
```

## Server Component Protection

Use `requireAuth` in server components and server actions:

```typescript
import { requireAuth } from "@/lib/route-protection";

export default async function ProtectedPage() {
	const session = await requireAuth({
		requiredRole: "artist",
		allowedStatuses: ["active"],
	});

	return <div>Welcome {session.email}!</div>;
}
```

## Client-side Permission Checks

Use `canUserAccess` for conditional rendering:

```typescript
import { canUserAccess } from "@/lib/route-protection";

function MyComponent({ userRole, userStatus }) {
	const canEdit = canUserAccess(userRole, userStatus, "stage_manager");

	return <div>{canEdit && <button>Edit</button>}</div>;
}
```

## Role Hierarchy

The system uses a role hierarchy where higher roles can access lower-level routes:

1. `super_admin` (level 4) - Can access everything
2. `stage_manager` (level 3) - Can access dj and artist routes
3. `dj` (level 2) - Can access artist routes
4. `artist` (level 1) - Can only access artist routes

## Status Requirements

By default, only `active` users can access protected routes. You can customize this:

```typescript
// Allow pending users too
const session = await requireAuth({
	allowedStatuses: ["active", "pending"],
});
```

## Error Handling

The middleware and route protection utilities handle errors gracefully:

-   Missing authentication → Redirect to `/login`
-   Insufficient permissions → Redirect to `/unauthorized`
-   Invalid status → Redirect to appropriate status page
-   API routes return appropriate HTTP status codes and error messages

## Testing

Test your protected routes and API endpoints:

1. Visit `/test-auth` to test page-level protection
2. Call `/api/test-protected` to test API route protection
3. Try accessing routes with different user roles and statuses
