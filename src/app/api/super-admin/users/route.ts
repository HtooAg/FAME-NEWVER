import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";
import { updateUserStatus, getUser } from "@/lib/gcs";

export async function POST(request: NextRequest) {
	try {
		const session = getSessionFromRequest(request);

		if (!session) {
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

		if (session.role !== "super_admin") {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "FORBIDDEN",
						message: "Access denied. Super admin role required.",
					},
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { action, userId } = body;

		if (!action || !userId) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Action and userId are required",
					},
				},
				{ status: 400 }
			);
		}

		// Check if user exists
		const user = await getUser(userId);
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

		// Process user action
		let newStatus = "";
		let message = "";

		switch (action) {
			case "approve":
				newStatus = "active";
				message = "User approved successfully";
				break;
			case "reject":
				newStatus = "rejected";
				message = "User rejected successfully";
				break;
			case "suspend":
				newStatus = "suspended";
				message = "User suspended successfully";
				break;
			case "activate":
				newStatus = "active";
				message = "User activated successfully";
				break;
			default:
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "INVALID_ACTION",
							message: "Invalid action specified",
						},
					},
					{ status: 400 }
				);
		}

		// Update user status in the database
		const updatedUser = await updateUserStatus(
			userId,
			newStatus,
			session.userId
		);

		// TODO: Send notification email to user
		// TODO: Log the action for audit trail

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				message,
				userId,
				action,
				user: updatedUser,
			},
		});
	} catch (error) {
		console.error("Super admin users API error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to process user action",
				},
			},
			{ status: 500 }
		);
	}
}
