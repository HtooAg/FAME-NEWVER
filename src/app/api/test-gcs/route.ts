import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";
const bucket = storage.bucket(bucketName);

export async function GET(request: NextRequest) {
	try {
		const results = {
			config: {
				projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
				bucketName: bucketName,
				keyFileExists: process.env.GOOGLE_CLOUD_KEY_FILE
					? "Set"
					: "Not set",
			},
			tests: {} as any,
		};

		// Test 1: Check if bucket exists
		try {
			const [bucketExists] = await bucket.exists();
			results.tests.bucketExists = bucketExists;
		} catch (error) {
			results.tests.bucketExists = `Error: ${error}`;
		}

		// Test 2: Try to list files (basic permission test)
		try {
			const [files] = await bucket.getFiles({ maxResults: 5 });
			results.tests.canListFiles = true;
			results.tests.fileCount = files.length;
			results.tests.sampleFiles = files.slice(0, 3).map((f) => f.name);
		} catch (error) {
			results.tests.canListFiles = `Error: ${error}`;
		}

		// Test 3: Try to create a signed URL for a test file
		try {
			const testFile = bucket.file("test-file.txt");
			const [signedUrl] = await testFile.getSignedUrl({
				action: "read",
				expires: Date.now() + 15 * 60 * 1000, // 15 minutes
				version: "v4",
			});
			results.tests.canCreateSignedUrl = true;
			results.tests.sampleSignedUrl = signedUrl.substring(0, 100) + "...";
		} catch (error) {
			results.tests.canCreateSignedUrl = `Error: ${error}`;
		}

		// Test 4: Check service account permissions
		try {
			const testFileName = `test-permissions-${Date.now()}.txt`;
			const testFile = bucket.file(testFileName);

			// Try to upload a test file
			await testFile.save("Test content", {
				metadata: {
					contentType: "text/plain",
				},
			});

			// Try to read it back
			const [content] = await testFile.download();
			const contentString = content.toString();

			// Clean up - delete the test file
			await testFile.delete();

			results.tests.canUploadAndDownload =
				contentString === "Test content";
		} catch (error) {
			results.tests.canUploadAndDownload = `Error: ${error}`;
		}

		return NextResponse.json(results, { status: 200 });
	} catch (error) {
		console.error("GCS test error:", error);
		return NextResponse.json(
			{
				error: "Failed to test GCS configuration",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
