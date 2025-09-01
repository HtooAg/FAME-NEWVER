import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";
import { getEventsForStageManager } from "@/lib/gcs";

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

		if (
			session.role !== "stage_manager" &&
			session.role !== "super_admin"
		) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "FORBIDDEN",
						message: "Access denied. Stage manager role required.",
					},
				},
				{ status: 403 }
			);
		}

		// Get events for this stage manager
		const events = await getEventsForStageManager(session.userId);

		// Calculate stats
		const stats = {
			totalEvents: events.length,
			activeEvents: events.filter(
				(e) => e.status === "active" || e.status === "registration_open"
			).length,
			totalArtists: events.reduce(
				(sum, event) => sum + (event.artists?.length || 0),
				0
			),
		};

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				user: {
					id: session.userId,
					email: session.email,
					role: session.role,
					status: session.status,
					profile: {
						firstName: "Stage",
						lastName: "Manager",
					},
				},
				stats,
				events: events.map((event) => ({
					id: event.id,
					name: event.name,
					venueName: event.venue,
					status: event.status,
					startDate: event.date,
					endDate: event.date,
					description: event.description || `Event at ${event.venue}`,
				})),
			},
		});
	} catch (error) {
		console.error("Dashboard API error:", error);
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
