import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = process.env.GCS_BUCKET_NAME || "fame-data";

export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const fileName = `events/${eventId}/timing-settings.json`;

		console.log(`Fetching timing settings from GCS: ${fileName}`);

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		const [exists] = await file.exists();
		if (!exists) {
			console.log(
				"Timing settings file not found, returning empty settings"
			);
			return NextResponse.json({
				success: true,
				data: {
					backstage_ready_time: null,
					show_start_time: null,
				},
			});
		}

		const [contents] = await file.download();
		const timingSettings = JSON.parse(contents.toString());

		console.log("Timing settings loaded from GCS:", timingSettings);

		return NextResponse.json({
			success: true,
			data: timingSettings,
		});
	} catch (error) {
		console.error("Error fetching timing settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch timing settings",
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const body = await request.json();
		const { backstage_ready_time, show_start_time, updated_by } = body;

		const fileName = `events/${eventId}/timing-settings.json`;

		console.log(`Updating timing settings in GCS: ${fileName}`, {
			backstage_ready_time,
			show_start_time,
			updated_by,
		});

		const timingSettings = {
			backstage_ready_time,
			show_start_time,
			updated_by,
			updated_at: new Date().toISOString(),
		};

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		await file.save(JSON.stringify(timingSettings, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log("Timing settings saved to GCS successfully");

		// Broadcast WebSocket event to all connected clients
		if (global.io) {
			global.io.to(`event_${eventId}`).emit("timing-settings-updated", {
				eventId,
				backstage_ready_time,
				show_start_time,
				timestamp: new Date().toISOString(),
			});
			console.log(`Timing settings update broadcast to event_${eventId}`);
		}

		return NextResponse.json({
			success: true,
			data: timingSettings,
		});
	} catch (error) {
		console.error("Error updating timing settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update timing settings",
			},
			{ status: 500 }
		);
	}
}
