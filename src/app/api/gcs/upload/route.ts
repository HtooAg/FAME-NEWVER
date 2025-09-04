import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/gcs";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const eventId = formData.get("eventId") as string;
		const artistId = formData.get("artistId") as string;
		const fileType = formData.get("fileType") as string;

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		if (!eventId || !artistId || !fileType) {
			return NextResponse.json(
				{
					error: "Missing required parameters: eventId, artistId, or fileType",
				},
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Create file path
		const timestamp = Date.now();
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
		const fileName = `events/${eventId}/artists/${artistId}/${fileType}/${timestamp}_${sanitizedFileName}`;

		// Upload to GCS
		const result = await uploadFile(fileName, buffer, file.type);

		return NextResponse.json({
			url: result,
			fileName: fileName,
			message: "File uploaded successfully",
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
