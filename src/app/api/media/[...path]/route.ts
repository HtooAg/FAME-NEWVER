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

		// Create a signed URL for direct access (valid for 1 hour)
		const [signedUrl] = await file.getSignedUrl({
			action: "read",
			expires: Date.now() + 60 * 60 * 1000, // 1 hour
			version: "v4",
		});

		// Return the signed URL for direct access with proper CORS headers
		const response = NextResponse.redirect(signedUrl);
		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, HEAD, OPTIONS"
		);
		response.headers.set("Access-Control-Allow-Headers", "Content-Type");

		return response;
	} catch (error) {
		console.error("Error serving media file:", error);

		// If GCS fails, try to return a direct storage URL as fallback
		try {
			const filePath = params.path.join("/");
			const directUrl = `https://storage.cloud.google.com/${bucketName}/${filePath}`;
			return NextResponse.redirect(directUrl);
		} catch (fallbackError) {
			console.error("Fallback URL generation failed:", fallbackError);
			return NextResponse.json(
				{ error: "Failed to serve media file" },
				{ status: 500 }
			);
		}
	}
}

// Handle HEAD requests for metadata
export async function HEAD(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	try {
		const filePath = params.path.join("/");

		if (!filePath) {
			return new NextResponse(null, { status: 400 });
		}

		const file = bucket.file(filePath);
		const [exists] = await file.exists();

		if (!exists) {
			return new NextResponse(null, { status: 404 });
		}

		const [metadata] = await file.getMetadata();

		return new NextResponse(null, {
			status: 200,
			headers: {
				"Content-Type":
					metadata.contentType || "application/octet-stream",
				"Content-Length": metadata.size?.toString() || "0",
				"Cache-Control": "public, max-age=3600",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	} catch (error) {
		console.error("Error getting media file metadata:", error);
		return new NextResponse(null, { status: 500 });
	}
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Max-Age": "86400",
		},
	});
}
