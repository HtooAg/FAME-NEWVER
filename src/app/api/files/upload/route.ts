import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/route-protection";
import { uploadFileWithMetadata, createFilePath } from "@/lib/gcs";
import { writeJsonFile, readJsonFile } from "@/lib/gcs";
import { APIResponse, MediaFile } from "@/types";

export const POST = withAuth(async (request: NextRequest, session) => {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const category = formData.get("category") as string;
		const eventId = formData.get("eventId") as string;

		if (!file) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "NO_FILE",
						message: "No file provided",
					},
				},
				{ status: 400 }
			);
		}

		if (!category || !["image", "audio", "document"].includes(category)) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "INVALID_CATEGORY",
						message:
							"Invalid file category. Must be image, audio, or document",
					},
				},
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const buffer = Buffer.from(await file.arrayBuffer());

		// Determine upload path based on user role and context
		let uploadPath: string;
		// Artist functionality removed - focusing on stage manager workflow
		uploadPath = createFilePath("user", session.userId, category);

		// Upload file to GCS
		const uploadedFile = await uploadFileWithMetadata(
			buffer,
			file.name,
			file.type,
			uploadPath,
			session.userId,
			{
				category,
				eventId: eventId || undefined,
				userRole: session.role,
			}
		);

		// Create MediaFile record
		const mediaFile: MediaFile = {
			id: uploadedFile.id,
			filename: uploadedFile.filename,
			originalName: uploadedFile.originalName,
			mimeType: uploadedFile.mimeType,
			size: uploadedFile.size,
			url: uploadedFile.url,
			uploadedBy: uploadedFile.uploadedBy,
			uploadedAt: uploadedFile.uploadedAt,
			category: uploadedFile.category,
		};

		// Store file metadata in appropriate location
		const metadataPath = eventId
			? `events/${eventId}/files/${session.userId}.json`
			: `users/${session.userId}/files.json`;

		// Read existing files
		const existingFiles =
			(await readJsonFile<MediaFile[]>(metadataPath)) || [];
		existingFiles.push(mediaFile);

		// Save updated file list
		await writeJsonFile(metadataPath, existingFiles);

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				file: mediaFile,
				message: "File uploaded successfully",
			},
		});
	} catch (error) {
		console.error("File upload error:", error);

		// Handle specific upload errors
		if (error instanceof Error) {
			if (
				error.message.includes("File size exceeds") ||
				error.message.includes("File type")
			) {
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "UPLOAD_VALIDATION_ERROR",
							message: error.message,
						},
					},
					{ status: 400 }
				);
			}
		}

		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "UPLOAD_ERROR",
					message: "Failed to upload file",
				},
			},
			{ status: 500 }
		);
	}
});
