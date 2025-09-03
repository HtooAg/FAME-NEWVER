import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params;

		// Fetch event from Google Cloud Storage
		const event = await EventGCSService.getEvent(eventId);

		if (!event) {
			return NextResponse.json(
				{
					success: false,
					error: "Event not found",
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: event,
		});
	} catch (error) {
		console.error("Error fetching event:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch event from Google Cloud Storage",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params;
		const body = await request.json();
		const { name, venueName, startDate, endDate, description } = body;

		// Get existing event from GCS
		const existingEvent = await EventGCSService.getEvent(eventId);

		if (!existingEvent) {
			return NextResponse.json(
				{
					success: false,
					error: "Event not found",
				},
				{ status: 404 }
			);
		}

		// Update event data
		const updatedEvent = {
			...existingEvent,
			name: name || existingEvent.name,
			venueName: venueName || existingEvent.venueName,
			startDate: startDate || existingEvent.startDate,
			endDate: endDate || existingEvent.endDate,
			description: description || existingEvent.description,
			updatedAt: new Date().toISOString(),
		};

		// Save updated event to GCS
		const saved = await EventGCSService.saveEvent(eventId, updatedEvent);

		if (!saved) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to update event in Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			data: updatedEvent,
		});
	} catch (error) {
		console.error("Error updating event:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update event",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params;

		// Check if event exists
		const existingEvent = await EventGCSService.getEvent(eventId);

		if (!existingEvent) {
			return NextResponse.json(
				{
					success: false,
					error: "Event not found",
				},
				{ status: 404 }
			);
		}

		// Delete event from GCS
		const deleted = await EventGCSService.deleteEvent(eventId);

		if (!deleted) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to delete event from Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Event deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting event:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to delete event",
			},
			{ status: 500 }
		);
	}
}
