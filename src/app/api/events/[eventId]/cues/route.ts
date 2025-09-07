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
		const { searchParams } = new URL(request.url);
		const performanceDate = searchParams.get("performanceDate");

		if (!performanceDate) {
			return NextResponse.json(
				{
					success: false,
					error: "Performance date is required",
				},
				{ status: 400 }
			);
		}

		const fileName = `events/${eventId}/cues/${performanceDate}.json`;

		console.log(`Fetching cues from GCS: ${fileName}`);

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		const [exists] = await file.exists();
		if (!exists) {
			console.log("Cues file not found, returning empty array");
			return NextResponse.json({
				success: true,
				data: [],
			});
		}

		const [contents] = await file.download();
		const cues = JSON.parse(contents.toString());

		console.log(`Loaded ${cues.length} cues from GCS`);

		return NextResponse.json({
			success: true,
			data: cues,
		});
	} catch (error) {
		console.error("Error fetching cues:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch cues",
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
		const { performanceDate, ...cueData } = body;

		if (!performanceDate) {
			return NextResponse.json(
				{
					success: false,
					error: "Performance date is required",
				},
				{ status: 400 }
			);
		}

		const fileName = `events/${eventId}/cues/${performanceDate}.json`;

		console.log(`Adding cue to GCS: ${fileName}`, cueData);

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		// Load existing cues or create empty array
		let cues = [];
		const [exists] = await file.exists();
		if (exists) {
			const [contents] = await file.download();
			cues = JSON.parse(contents.toString());
		}

		// Add new cue
		const newCue = {
			...cueData,
			created_at: new Date().toISOString(),
			performance_status: "not_started",
			is_completed: false,
		};

		cues.push(newCue);

		// Save back to GCS
		await file.save(JSON.stringify(cues, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log("Cue added to GCS successfully");

		return NextResponse.json({
			success: true,
			data: newCue,
		});
	} catch (error) {
		console.error("Error adding cue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to add cue",
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
		const { id, performanceDate, ...updateData } = body;

		if (!performanceDate || !id) {
			return NextResponse.json(
				{
					success: false,
					error: "Performance date and cue ID are required",
				},
				{ status: 400 }
			);
		}

		const fileName = `events/${eventId}/cues/${performanceDate}.json`;

		console.log(`Updating cue in GCS: ${fileName}`, { id, updateData });

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		const [exists] = await file.exists();
		if (!exists) {
			return NextResponse.json(
				{
					success: false,
					error: "Cues file not found",
				},
				{ status: 404 }
			);
		}

		const [contents] = await file.download();
		let cues = JSON.parse(contents.toString());

		// Find and update the cue
		const cueIndex = cues.findIndex((cue: any) => cue.id === id);
		if (cueIndex === -1) {
			return NextResponse.json(
				{
					success: false,
					error: "Cue not found",
				},
				{ status: 404 }
			);
		}

		cues[cueIndex] = {
			...cues[cueIndex],
			...updateData,
			updated_at: new Date().toISOString(),
		};

		// Save back to GCS
		await file.save(JSON.stringify(cues, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log("Cue updated in GCS successfully");

		return NextResponse.json({
			success: true,
			data: cues[cueIndex],
		});
	} catch (error) {
		console.error("Error updating cue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update cue",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const { searchParams } = new URL(request.url);
		const cueId = searchParams.get("cueId");
		const performanceDate = searchParams.get("performanceDate");

		if (!performanceDate || !cueId) {
			return NextResponse.json(
				{
					success: false,
					error: "Performance date and cue ID are required",
				},
				{ status: 400 }
			);
		}

		const fileName = `events/${eventId}/cues/${performanceDate}.json`;

		console.log(`Deleting cue from GCS: ${fileName}`, { cueId });

		const bucket = storage.bucket(bucketName);
		const file = bucket.file(fileName);

		const [exists] = await file.exists();
		if (!exists) {
			return NextResponse.json(
				{
					success: false,
					error: "Cues file not found",
				},
				{ status: 404 }
			);
		}

		const [contents] = await file.download();
		let cues = JSON.parse(contents.toString());

		// Remove the cue
		const originalLength = cues.length;
		cues = cues.filter((cue: any) => cue.id !== cueId);

		if (cues.length === originalLength) {
			return NextResponse.json(
				{
					success: false,
					error: "Cue not found",
				},
				{ status: 404 }
			);
		}

		// Save back to GCS
		await file.save(JSON.stringify(cues, null, 2), {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log("Cue deleted from GCS successfully");

		return NextResponse.json({
			success: true,
			message: "Cue deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting cue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to delete cue",
			},
			{ status: 500 }
		);
	}
}
