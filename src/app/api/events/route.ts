import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";

export async function GET(request: NextRequest) {
	try {
		const { getSessionFromRequest } = await import("@/lib/session");
		const session = getSessionFromRequest(request);

		if (!session) {
			return NextResponse.json(
				{
					success: false,
					error: "Authentication required",
				},
				{ status: 401 }
			);
		}

		// Fetch events from Google Cloud Storage
		let events = await EventGCSService.listEvents();

		// Filter events by stage manager ID if user is a stage manager
		if (session.role === "stage_manager") {
			events = events.filter(
				(event: any) => event.stageManagerId === session.userId
			);
		}

		return NextResponse.json({
			success: true,
			data: events,
		});
	} catch (error) {
		console.error("Error fetching events:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch events from Google Cloud Storage",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { getSessionFromRequest } = await import("@/lib/session");
		const session = getSessionFromRequest(request);

		if (!session) {
			return NextResponse.json(
				{
					success: false,
					error: "Authentication required",
				},
				{ status: 401 }
			);
		}

		if (session.role !== "stage_manager") {
			return NextResponse.json(
				{
					success: false,
					error: "Only stage managers can create events",
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { name, venueName, startDate, endDate, description } = body;

		// Validate required fields
		if (!name || !venueName || !startDate || !endDate || !description) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields",
				},
				{ status: 400 }
			);
		}

		// Create new event
		const eventId = `event-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		const newEvent = {
			id: eventId,
			name,
			venueName,
			startDate,
			endDate,
			description,
			status: "draft",
			showDates: [],
			stageManagerId: session.userId, // Associate event with stage manager
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Save to Google Cloud Storage
		const saved = await EventGCSService.saveEvent(eventId, newEvent);

		if (!saved) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to save event to Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			data: newEvent,
		});
	} catch (error) {
		console.error("Error creating event:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create event",
			},
			{ status: 500 }
		);
	}
}
