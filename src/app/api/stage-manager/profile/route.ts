import { NextRequest, NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getUserById } from "@/lib/data-access";
import { APIResponse } from "@/types";

export async function GET(request: NextRequest) {
	try {
		// Check authentication and authorization
		const sessionData = await getSessionData(request);
		if (
			!sessionData ||
			!["super_admin", "stage_manager"].includes(sessionData.role)
		) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Stage manager access required",
					},
				},
				{ status: 403 }
			);
		}

		// Get user data
		const user = await getUserById(sessionData.userId);
		if (!user) {
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

		const profileData = {
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				status: user.status,
				profile: user.profile,
				createdAt: user.createdAt,
				lastLogin: user.lastLogin,
			},
		};

		return NextResponse.json<APIResponse>({
			success: true,
			data: profileData,
		});
	} catch (error) {
		console.error("Error fetching profile:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to fetch profile",
				},
			},
			{ status: 500 }
		);
	}
}
