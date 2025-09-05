import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getUserById } from "@/lib/data-access";
import { APIResponse } from "@/types";

export async function GET(request: NextRequest) {
	try {
		// Get session from request
		const session = getSessionFromRequest(request);
		console.log("[AUTH/ME] Session data:", session);

		if (!session) {
			console.log("[AUTH/ME] No session found");
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Authentication required",
					},
				},
				{ status: 401 }
			);
		}

		// Get current user data from database
		console.log("[AUTH/ME] Looking for user ID:", session.userId);
		const user = await getUserById(session.userId);
		console.log(
			"[AUTH/ME] Found user:",
			user
				? { id: user.id, email: user.email, status: user.status }
				: null
		);

		if (!user) {
			console.log("[AUTH/ME] User not found in database");
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "USER_NOT_FOUND",
						message: "User not found",
					},
				},
				{ status: 404 }
			);
		}

		// Check if user status allows access
		if (user.status !== "active") {
			console.log("[AUTH/ME] User status not active:", user.status);
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "ACCOUNT_NOT_ACTIVE",
						message: `Account status: ${user.status}`,
					},
				},
				{ status: 403 }
			);
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				userId: user.id,
				email: user.email,
				status: user.status,
				role: user.role,
				profile: user.profile,
				createdAt: user.createdAt,
				lastLogin: user.lastLogin,
			},
		});
	} catch (error) {
		console.error("Get user info error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to get user information",
				},
			},
			{ status: 500 }
		);
	}
}
