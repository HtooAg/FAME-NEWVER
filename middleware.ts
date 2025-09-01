import { NextRequest, NextResponse } from "next/server";

// Types for middleware (avoiding imports that might cause edge runtime issues)
type UserRole = "super_admin" | "stage_manager" | "artist" | "dj";
type UserStatus = "active" | "pending" | "suspended" | "deactivated";

interface SessionData {
	userId: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	eventId?: string;
}

// Define protected routes and their required roles
const PROTECTED_ROUTES: Record<string, UserRole> = {
	"/super-admin": "super_admin",
	"/stage-manager": "stage_manager",
	"/dj": "dj",
};

// Routes that require authentication but no specific role
const AUTH_REQUIRED_ROUTES = ["/profile", "/settings", "/logout"];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/",
	"/login",
	"/register",
	"/about",
	"/contact",
	"/events/register", // Artist registration pages
];

// Status-specific redirect routes
const STATUS_ROUTES: Record<UserStatus, string> = {
	pending: "/account-pending",
	suspended: "/account-suspended",
	deactivated: "/account-deactivated",
	active: "", // No redirect needed for active users
};

// Session extraction function (inline to avoid edge runtime issues)
function getSessionFromRequest(request: NextRequest): SessionData | null {
	try {
		const sessionCookie = request.cookies.get("fame-session");

		if (!sessionCookie?.value) {
			return null;
		}

		// Decrypt session (simple base64 for now)
		// Using atob instead of Buffer for edge runtime compatibility
		const sessionString = atob(sessionCookie.value);
		const data = JSON.parse(sessionString);

		// Validate session data
		if (
			data &&
			typeof data.userId === "string" &&
			typeof data.email === "string" &&
			typeof data.role === "string" &&
			typeof data.status === "string" &&
			["super_admin", "stage_manager", "artist", "dj"].includes(
				data.role
			) &&
			["active", "pending", "suspended", "deactivated"].includes(
				data.status
			)
		) {
			return data;
		}

		return null;
	} catch (error) {
		console.error("Error getting session from request:", error);
		return null;
	}
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for API routes, static files, and Next.js internals
	if (
		pathname.startsWith("/api/") ||
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/favicon.ico") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	// Get session from request
	const session = getSessionFromRequest(request);

	// Check if route is public
	if (isPublicRoute(pathname)) {
		// If user is logged in and trying to access login page, redirect to dashboard
		if (session && pathname === "/login") {
			return redirectToDashboard(request, session);
		}
		return NextResponse.next();
	}

	// Check if user is authenticated
	if (!session) {
		return redirectToLogin(request);
	}

	// Check user status and redirect if necessary
	if (session.status !== "active") {
		const statusRedirect = STATUS_ROUTES[session.status];
		if (statusRedirect && pathname !== statusRedirect) {
			return NextResponse.redirect(new URL(statusRedirect, request.url));
		}
		// If already on the correct status page, allow access
		if (pathname === STATUS_ROUTES[session.status]) {
			return NextResponse.next();
		}
	}

	// Check if route requires specific role
	const requiredRole = getRequiredRole(pathname);
	if (requiredRole) {
		if (!hasRequiredRole(session.role, requiredRole)) {
			return redirectToUnauthorized(request);
		}
	}

	// Check if route requires authentication (but no specific role)
	if (requiresAuth(pathname) && !session) {
		return redirectToLogin(request);
	}

	return NextResponse.next();
}

// Helper functions
function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => {
		if (route.endsWith("*")) {
			return pathname.startsWith(route.slice(0, -1));
		}
		return pathname === route || pathname.startsWith(route + "/");
	});
}

function getRequiredRole(pathname: string): UserRole | null {
	for (const [route, role] of Object.entries(PROTECTED_ROUTES)) {
		if (pathname === route || pathname.startsWith(route + "/")) {
			return role;
		}
	}
	return null;
}

function requiresAuth(pathname: string): boolean {
	return AUTH_REQUIRED_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(route + "/")
	);
}

function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
	const roleHierarchy: Record<UserRole, number> = {
		super_admin: 4,
		stage_manager: 3,
		dj: 2,
		artist: 1,
	};

	return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

function redirectToLogin(request: NextRequest): NextResponse {
	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
	return NextResponse.redirect(loginUrl);
}

function redirectToUnauthorized(request: NextRequest): NextResponse {
	return NextResponse.redirect(new URL("/unauthorized", request.url));
}

function redirectToDashboard(request: NextRequest, session: any): NextResponse {
	const dashboardUrl = getDashboardUrl(session.role);
	return NextResponse.redirect(new URL(dashboardUrl, request.url));
}

function getDashboardUrl(role: UserRole): string {
	switch (role) {
		case "super_admin":
			return "/super-admin";
		case "stage_manager":
			return "/stage-manager";
		case "dj":
			return "/dj";
		default:
			return "/";
	}
}

// Configure which paths the middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
