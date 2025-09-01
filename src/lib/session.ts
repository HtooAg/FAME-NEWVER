import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SessionData } from "@/types";
import { SESSION_CONFIG } from "./constants";
import { isValidSession } from "./auth";

// Encrypt/decrypt utilities (simple base64 for now, can be enhanced with proper encryption)
function encryptSession(data: SessionData): string {
	const sessionString = JSON.stringify(data);
	// Use btoa for browser compatibility and edge runtime
	return typeof btoa !== "undefined"
		? btoa(sessionString)
		: Buffer.from(sessionString).toString("base64");
}

function decryptSession(encryptedData: string): SessionData | null {
	try {
		// Use atob for browser compatibility and edge runtime
		const sessionString =
			typeof atob !== "undefined"
				? atob(encryptedData)
				: Buffer.from(encryptedData, "base64").toString("utf-8");

		const data = JSON.parse(sessionString);

		if (isValidSession(data)) {
			return data;
		}

		return null;
	} catch (error) {
		console.error("Error decrypting session:", error);
		return null;
	}
}

// Server-side session management (for API routes and server components)
export async function createSession(sessionData: SessionData): Promise<void> {
	const cookieStore = await cookies();
	const encryptedSession = encryptSession(sessionData);

	cookieStore.set(SESSION_CONFIG.COOKIE_NAME, encryptedSession, {
		httpOnly: SESSION_CONFIG.HTTP_ONLY,
		secure: SESSION_CONFIG.SECURE,
		maxAge: SESSION_CONFIG.MAX_AGE,
		sameSite: "lax",
		path: "/",
	});
}

export async function getSession(): Promise<SessionData | null> {
	try {
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME);

		if (!sessionCookie?.value) {
			return null;
		}

		return decryptSession(sessionCookie.value);
	} catch (error) {
		console.error("Error getting session:", error);
		return null;
	}
}

export async function destroySession(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
}

// Client-side session management (for middleware and client components)
export function createSessionResponse(
	sessionData: SessionData,
	response: NextResponse = new NextResponse()
): NextResponse {
	const encryptedSession = encryptSession(sessionData);

	response.cookies.set(SESSION_CONFIG.COOKIE_NAME, encryptedSession, {
		httpOnly: SESSION_CONFIG.HTTP_ONLY,
		secure: SESSION_CONFIG.SECURE,
		maxAge: SESSION_CONFIG.MAX_AGE,
		sameSite: "lax",
		path: "/",
	});

	return response;
}

export function getSessionFromRequest(
	request: NextRequest
): SessionData | null {
	try {
		const sessionCookie = request.cookies.get(SESSION_CONFIG.COOKIE_NAME);

		if (!sessionCookie?.value) {
			return null;
		}

		return decryptSession(sessionCookie.value);
	} catch (error) {
		console.error("Error getting session from request:", error);
		return null;
	}
}

// Alias for getSessionFromRequest for API compatibility
export function getSessionData(
	request: NextRequest
): Promise<SessionData | null> {
	return Promise.resolve(getSessionFromRequest(request));
}

export function destroySessionResponse(
	response: NextResponse = new NextResponse()
): NextResponse {
	response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
	return response;
}

// Session validation helpers
export function isSessionExpired(sessionData: SessionData): boolean {
	// For now, we rely on cookie expiration
	// Could add timestamp checking here if needed
	return false;
}

export function requireActiveSession(
	sessionData: SessionData | null
): SessionData {
	if (!sessionData) {
		throw new Error("No active session");
	}

	if (sessionData.status !== "active") {
		throw new Error(`Account status: ${sessionData.status}`);
	}

	if (isSessionExpired(sessionData)) {
		throw new Error("Session expired");
	}

	return sessionData;
}

export function requireRole(
	sessionData: SessionData | null,
	requiredRole: string
): SessionData {
	const session = requireActiveSession(sessionData);

	const roleHierarchy: Record<string, number> = {
		super_admin: 4,
		stage_manager: 3,
		dj: 2,
		artist: 1,
	};

	const userLevel = roleHierarchy[session.role] || 0;
	const requiredLevel = roleHierarchy[requiredRole] || 0;

	if (userLevel < requiredLevel) {
		throw new Error(
			`Insufficient permissions. Required: ${requiredRole}, Current: ${session.role}`
		);
	}

	return session;
}
