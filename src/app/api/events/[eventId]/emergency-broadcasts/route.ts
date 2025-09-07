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

// GET - Fetch emergency broadcasts for an event
export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const fileName = `events/${eventId}/emergency-broadcasts.json`;

		try {
			const file = storage.bucket(bucketName).file(fileName);
			const [exists] = await file.exists();

			if (!exists) {
				return NextResponse.json({
					success: true,
					data: [],
				});
			}

			const [contents] = await file.download();
			const broadcasts: EmergencyBroadcast[] = JSON.parse(
				contents.toString()
			);

			// Filter only active broadcasts
			const activeBroadcasts = broadcasts.filter(
				(broadcast) => broadcast.is_active
			);

			return NextResponse.json({
				success: true,
				data: activeBroadcasts,
			});
		} catch (error) {
			console.error("Error fetching emergency broadcasts:", error);
			return NextResponse.json({
				success: true,
				data: [],
			});
		}
	} catch (error) {
		console.error("Error in emergency broadcasts GET:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch emergency broadcasts",
			},
			{ status: 500 }
		);
	}
}

// POST - Create new emergency broadcast
export async function POST(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const body = await request.json();
		const { message, emergency_code, is_active = true } = body;

		console.log("Creating emergency broadcast:", {
			eventId,
			message,
			emergency_code,
		});

		if (!message || !emergency_code) {
			return NextResponse.json(
				{
					success: false,
					error: "Message and emergency code are required",
				},
				{ status: 400 }
			);
		}

		console.log("Using GCS bucket:", bucketName);

		const fileName = `events/${eventId}/emergency-broadcasts.json`;
		const file = storage.bucket(bucketName).file(fileName);

		// Load existing broadcasts
		let broadcasts: EmergencyBroadcast[] = [];
		try {
			const [exists] = await file.exists();
			if (exists) {
				const [contents] = await file.download();
				broadcasts = JSON.parse(contents.toString());
			}
		} catch (error) {
			console.log("No existing broadcasts file, creating new one");
			broadcasts = [];
		}

		// Create new broadcast
		const newBroadcast: EmergencyBroadcast = {
			id: `broadcast_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			message,
			emergency_code,
			is_active,
			created_at: new Date().toISOString(),
			event_id: eventId,
		};

		// Add to broadcasts array
		broadcasts.push(newBroadcast);

		// Save to GCS
		await file.save(JSON.stringify(broadcasts, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log(
			"Emergency broadcast created successfully:",
			newBroadcast.id
		);

		// Notify via WebSocket if available
		if (global.io) {
			global.io.to(`event_${eventId}`).emit("emergency-alert", {
				message,
				emergency_code,
				timestamp: new Date().toISOString(),
			});
			console.log("Emergency broadcast sent via WebSocket");
		}

		return NextResponse.json({
			success: true,
			data: newBroadcast,
		});
	} catch (error) {
		console.error("Error creating emergency broadcast:", error);
		return NextResponse.json(
			{
				success: false,
				error: `Failed to create emergency broadcast: ${error.message}`,
			},
			{ status: 500 }
		);
	}
}
