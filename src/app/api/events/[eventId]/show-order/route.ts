import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";

export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;

		// Fetch show order from Google Cloud Storage
		const showOrder = await EventGCSService.getShowOrder(eventId);

		return NextResponse.json(showOrder);
	} catch (error) {
		console.error("Error fetching show order:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch show order from Google Cloud Storage",
			},
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const body = await request.json();

		// Create new show order
		const newShowOrder = {
			...body,
			eventId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Save to Google Cloud Storage
		const saved = await EventGCSService.saveShowOrder(
			eventId,
			newShowOrder
		);

		if (!saved) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to save show order to Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			showOrder: newShowOrder,
		});
	} catch (error) {
		console.error("Error creating show order:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create show order",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const body = await request.json();

		// Update show order
		const updatedShowOrder = {
			...body,
			eventId,
			updatedAt: new Date().toISOString(),
		};

		// Save to Google Cloud Storage
		const saved = await EventGCSService.saveShowOrder(
			eventId,
			updatedShowOrder
		);

		if (!saved) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to update show order in Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			showOrder: updatedShowOrder,
		});
	} catch (error) {
		console.error("Error updating show order:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update show order",
			},
			{ status: 500 }
		);
	}
}
