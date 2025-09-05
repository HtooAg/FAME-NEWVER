import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";
import { getUser } from "@/lib/gcs";

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
		const { action, userId, newPassword, newUsername } = body;

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
		let message = "";
		let updatedUser;

		// Import data access functions
		const {
			getUserById,
			updateUser,
			approvePendingStageManager,
			rejectPendingStageManager,
			deleteUser,
		} = await import("@/lib/data-access");

		switch (action) {
			case "approve":
				try {
					console.log("[SUPER-ADMIN] Approving user:", userId);
					// Use the proper approval function that moves user from pending to active
					await approvePendingStageManager(userId);
					message = "User approved successfully";
					// Get the updated user data
					updatedUser = await getUserById(userId);
					console.log(
						"[SUPER-ADMIN] User approved successfully:",
						updatedUser?.id
					);
				} catch (error) {
					console.error("[SUPER-ADMIN] Error approving user:", error);
					throw error;
				}
				break;
			case "reject":
				try {
					console.log("[SUPER-ADMIN] Rejecting user:", userId);
					// Use the proper rejection function that removes user from pending
					await rejectPendingStageManager(userId);
					message = "User rejected successfully";
					updatedUser = null; // User is removed, not updated
					console.log("[SUPER-ADMIN] User rejected successfully");
				} catch (error) {
					console.error("[SUPER-ADMIN] Error rejecting user:", error);
					throw error;
				}
				break;
			case "suspend":
				try {
					console.log("[SUPER-ADMIN] Suspending user:", userId);
					message = "User suspended successfully";
					// Update user status using data access layer
					const userToSuspend = await getUserById(userId);
					if (userToSuspend) {
						userToSuspend.status = "suspended";
						await updateUser(userToSuspend);
						updatedUser = userToSuspend;
						console.log(
							"[SUPER-ADMIN] User suspended successfully:",
							updatedUser.id
						);
					} else {
						throw new Error("User not found for suspension");
					}
				} catch (error) {
					console.error(
						"[SUPER-ADMIN] Error suspending user:",
						error
					);
					throw error;
				}
				break;
			case "activate":
				try {
					console.log("[SUPER-ADMIN] Activating user:", userId);
					message = "User activated successfully";
					// Update user status using data access layer
					const userToActivate = await getUserById(userId);
					if (userToActivate) {
						userToActivate.status = "active";
						await updateUser(userToActivate);
						updatedUser = userToActivate;
						console.log(
							"[SUPER-ADMIN] User activated successfully:",
							updatedUser.id
						);
					} else {
						throw new Error("User not found for activation");
					}
				} catch (error) {
					console.error(
						"[SUPER-ADMIN] Error activating user:",
						error
					);
					throw error;
				}
				break;
			case "deactivate":
				try {
					console.log("[SUPER-ADMIN] Deactivating user:", userId);
					message = "User deactivated successfully";
					// Update user status using data access layer
					const userToDeactivate = await getUserById(userId);
					if (userToDeactivate) {
						userToDeactivate.status = "deactivated";
						await updateUser(userToDeactivate);
						updatedUser = userToDeactivate;
						console.log(
							"[SUPER-ADMIN] User deactivated successfully:",
							updatedUser.id
						);
					} else {
						throw new Error("User not found for deactivation");
					}
				} catch (error) {
					console.error(
						"[SUPER-ADMIN] Error deactivating user:",
						error
					);
					throw error;
				}
				break;
			case "delete":
				try {
					console.log("[SUPER-ADMIN] Deleting user:", userId);
					await deleteUser(userId);
					message = "User deleted successfully";
					updatedUser = null;
					console.log("[SUPER-ADMIN] User deleted successfully");
				} catch (error) {
					console.error("[SUPER-ADMIN] Error deleting user:", error);
					throw error;
				}
				break;
			case "changeCredentials":
				if (!newPassword || !newUsername) {
					return NextResponse.json<APIResponse>(
						{
							success: false,
							error: {
								code: "VALIDATION_ERROR",
								message:
									"New password and username are required",
							},
						},
						{ status: 400 }
					);
				}

				const { hashPassword } = await import("@/lib/auth");
				const hashedPassword = await hashPassword(newPassword);
				const userToUpdate = {
					...user,
					email: newUsername,
					passwordHash: hashedPassword,
				};
				await updateUser(userToUpdate);

				message = "User credentials updated successfully";
				updatedUser = userToUpdate;
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

		// Send real-time WebSocket notifications
		if (global.io) {
			// Notify the specific user about the action
			global.io.to(`user_${userId}`).emit("admin_action", {
				action,
				message,
				user: updatedUser,
				timestamp: new Date().toISOString(),
			});

			// Notify all admins about the action (for dashboard updates)
			global.io.to("role_super_admin").emit("admin_action_performed", {
				action,
				userId,
				message,
				user: updatedUser,
				performedBy: session.userId,
				timestamp: new Date().toISOString(),
			});

			console.log(
				`[WEBSOCKET] Notifications sent for action: ${action} on user: ${userId}`
			);
		}

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
