import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";
const bucket = storage.bucket(bucketName);

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	try {
		const filePath = params.path.join("/");

		if (!filePath) {
			return NextResponse.json(
				{ error: "File path is required" },
				{ status: 400 }
			);
		}

		// Get the file from GCS
		const file = bucket.file(filePath);

		// Check if file exists
		const [exists] = await file.exists();
		if (!exists) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 }
			);
		}

		// Get file metadata
		const [metadata] = await file.getMetadata();

		// Create a signed URL for download (valid for 1 hour)
		const [signedUrl] = await file.getSignedUrl({
			action: "read",
			expires: Date.now() + 60 * 60 * 1000, // 1 hour
			responseDisposition: `attachment; filename="${
				metadata.name || "download"
			}"`,
		});

		// Return the signed URL as JSON so we can handle it properly
		return NextResponse.json({
			downloadUrl: signedUrl,
			filename: metadata.name || "download",
			contentType: metadata.contentType || "application/octet-stream",
			size: metadata.size || 0,
		});
	} catch (error) {
		console.error("Error generating download URL:", error);
		return NextResponse.json(
			{ error: "Failed to generate download URL" },
			{ status: 500 }
		);
	}
}
