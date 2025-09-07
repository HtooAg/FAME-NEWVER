import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";

interface EmergencyBroadcast {
	id: string;
	message: string;
	emergency_code: string;
	is_active: boolean;
	created_at: string;
	event_id: string;
}

// PATCH - Update emergency broadcast (mainly to deactivate)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { eventId: string; broadcastId: string } }
) {
	try {
		const { eventId, broadcastId } = params;
		const body = await request.json();
		const { is_active } = body;

		const fileName = `events/${eventId}/emergency-broadcasts.json`;
		const file = storage.bucket(bucketName).file(fileName);

		// Load existing broadcasts
		let broadcasts: EmergencyBroadcast[] = [];
		try {
			const [exists] = await file.exists();
			if (!exists) {
				return NextResponse.json(
					{
						success: false,
						error: "No broadcasts found",
					},
					{ status: 404 }
				);
			}

			const [contents] = await file.download();
			broadcasts = JSON.parse(contents.toString());
		} catch (error) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to load broadcasts",
				},
				{ status: 500 }
			);
		}

		// Find and update the broadcast
		const broadcastIndex = broadcasts.findIndex(
			(b) => b.id === broadcastId
		);
		if (broadcastIndex === -1) {
			return NextResponse.json(
				{
					success: false,
					error: "Broadcast not found",
				},
				{ status: 404 }
			);
		}

		// Update the broadcast
		broadcasts[broadcastIndex] = {
			...broadcasts[broadcastIndex],
			is_active:
				is_active !== undefined
					? is_active
					: broadcasts[broadcastIndex].is_active,
		};

		// Save back to GCS
		await file.save(JSON.stringify(broadcasts, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		// Notify via WebSocket if broadcast was deactivated
		if (is_active === false && global.io) {
			global.io.to(`event_${eventId}`).emit("emergency-clear", {
				broadcastId,
				timestamp: new Date().toISOString(),
			});
			console.log("Emergency broadcast cleared via WebSocket");
		}

		return NextResponse.json({
			success: true,
			data: broadcasts[broadcastIndex],
		});
	} catch (error) {
		console.error("Error updating emergency broadcast:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update emergency broadcast",
			},
			{ status: 500 }
		);
	}
}

// DELETE - Delete emergency broadcast
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { eventId: string; broadcastId: string } }
) {
	try {
		const { eventId, broadcastId } = params;

		const fileName = `events/${eventId}/emergency-broadcasts.json`;
		const file = storage.bucket(bucketName).file(fileName);

		// Load existing broadcasts
		let broadcasts: EmergencyBroadcast[] = [];
		try {
			const [exists] = await file.exists();
			if (!exists) {
				return NextResponse.json(
					{
						success: false,
						error: "No broadcasts found",
					},
					{ status: 404 }
				);
			}

			const [contents] = await file.download();
			broadcasts = JSON.parse(contents.toString());
		} catch (error) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to load broadcasts",
				},
				{ status: 500 }
			);
		}

		// Filter out the broadcast to delete
		const updatedBroadcasts = broadcasts.filter(
			(b) => b.id !== broadcastId
		);

		if (updatedBroadcasts.length === broadcasts.length) {
			return NextResponse.json(
				{
					success: false,
					error: "Broadcast not found",
				},
				{ status: 404 }
			);
		}

		// Save back to GCS
		await file.save(JSON.stringify(updatedBroadcasts, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		return NextResponse.json({
			success: true,
			message: "Broadcast deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting emergency broadcast:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to delete emergency broadcast",
			},
			{ status: 500 }
		);
	}
}
