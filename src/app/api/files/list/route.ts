import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/route-protection";
import { readJsonFile } from "@/lib/gcs";
import { APIResponse, MediaFile } from "@/types";

export const GET = withAuth(async (request: NextRequest, session) => {
	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const eventId = searchParams.get("eventId");

		let allFiles: MediaFile[] = [];

		// Get user files
		const userFiles = await readJsonFile<MediaFile[]>(
			`users/${session.userId}/files.json`
		);
		if (userFiles !== null && Array.isArray(userFiles)) {
			allFiles.push(...userFiles);
		}

		// Artist functionality removed - focusing on stage manager workflow
		const targetEventId = eventId || session.eventId;

		// Filter by category if specified
		if (category) {
			allFiles = allFiles.filter((file) => file.category === category);
		}

		// Sort by upload date (newest first)
		allFiles.sort(
			(a, b) =>
				new Date(b.uploadedAt).getTime() -
				new Date(a.uploadedAt).getTime()
		);

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				files: allFiles,
				total: allFiles.length,
			},
		});
	} catch (error) {
		console.error("List files error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to list files",
				},
			},
			{ status: 500 }
		);
	}
});
