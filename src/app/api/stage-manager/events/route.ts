import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { APIResponse } from "@/types";
import { getEventsForStageManager, createEvent } from "@/lib/gcs";

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

		const events = await getEventsForStageManager(session.userId);

		return NextResponse.json<APIResponse>({
			success: true,
			data: { events },
		});
	} catch (error) {
		console.error("Events API error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to load events",
				},
			},
			{ status: 500 }
		);
	}
}

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

		const body = await request.json();
		const { name, venue, date, description, maxArtists } = body;

		if (!name || !venue || !date) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Name, venue, and date are required",
					},
				},
				{ status: 400 }
			);
		}

		const eventData = {
			name,
			venue,
			date: new Date(date),
			description: description || "",
			stageManagerId: session.userId,
			status: "planning" as const,
			settings: {
				maxArtists: maxArtists || 20,
				registrationDeadline: new Date(date),
				allowLateRegistration: false,
				requireApproval: true,
			},
		};

		const event = await createEvent(eventData);

		return NextResponse.json<APIResponse>({
			success: true,
			data: { event },
		});
	} catch (error) {
		console.error("Create event API error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to create event",
				},
			},
			{ status: 500 }
		);
	}
}
