import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";
import {
	getAllUsers,
	getPendingUsers,
	getStageManagers,
	approveUser,
} from "@/lib/gcs";

export async function GET(request: NextRequest) {
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

		// Initialize registration structure if needed
		const { initializeDataStructure } = await import("@/lib/gcs");
		await initializeDataStructure();

		// Fetch real data from fame-data bucket
		const allUsers = await getAllUsers();
		const pendingUsers = await getPendingUsers();
		const stageManagers = await getStageManagers();

		// Calculate stats
		const stats = {
			totalUsers: allUsers.length,
			totalStageManagers: stageManagers.length,
			pendingApprovals: pendingUsers.length,
			activeStageManagers: stageManagers.filter(
				(sm: any) => sm.status === "active"
			).length,
		};

		const dashboardData = {
			user: {
				id: session.userId,
				email: session.email,
				role: session.role,
				status: session.status,
				profile: {
					firstName: "Super",
					lastName: "Admin",
				},
			},
			stats,
			pendingRegistrations: pendingUsers,
			allStageManagers: stageManagers,
		};

		return NextResponse.json<APIResponse>({
			success: true,
			data: dashboardData,
		});
	} catch (error) {
		console.error("Super admin dashboard API error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to load dashboard data",
				},
			},
			{ status: 500 }
		);
	}
}
