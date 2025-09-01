import { NextRequest, NextResponse } from "next/server";
import { destroySessionResponse, getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";

export async function POST(request: NextRequest) {
	try {
		// Get session if it exists (but don't require it)
		const session = getSessionFromRequest(request);

		if (session) {
			console.log(`User ${session.email} (${session.role}) logged out`);
		} else {
			console.log("Logout requested without valid session");
		}

		// Create response
		const response = NextResponse.json<APIResponse>({
			success: true,
			data: {
				message: "Successfully logged out",
				redirectUrl: "/login",
			},
		});

		// Clear session cookie (even if no session exists)
		return destroySessionResponse(response);
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "An error occurred during logout",
				},
			},
			{ status: 500 }
		);
	}
}

// Also support GET for logout links
export async function GET(request: NextRequest) {
	try {
		// Get session if it exists (but don't require it)
		const session = getSessionFromRequest(request);

		if (session) {
			console.log(
				`User ${session.email} (${session.role}) logged out via GET`
			);
		} else {
			console.log("Logout requested via GET without valid session");
		}

		// Create response
		const response = NextResponse.json<APIResponse>({
			success: true,
			data: {
				message: "Successfully logged out",
				redirectUrl: "/login",
			},
		});

		// Clear session cookie (even if no session exists)
		return destroySessionResponse(response);
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "An error occurred during logout",
				},
			},
			{ status: 500 }
		);
	}
}
