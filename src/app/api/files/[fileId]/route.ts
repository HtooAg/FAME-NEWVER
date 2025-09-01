import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/route-protection";
import {
	readJsonFile,
	writeJsonFile,
	deleteFile,
	getSignedUrl,
} from "@/lib/gcs";
import { APIResponse, MediaFile } from "@/types";

// Get file information
export const GET = withAuth(
	async (request: NextRequest, session, { params }) => {
		try {
			const { fileId } = params;

			if (!fileId) {
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "MISSING_FILE_ID",
							message: "File ID is required",
						},
					},
					{ status: 400 }
				);
			}

			// Find file in user's files or event files
			let mediaFile: MediaFile | null = null;
			let filePath: string | null = null;

			// Check user files
			const userFiles = await readJsonFile<MediaFile[]>(
				`users/${session.userId}/files.json`
			);
			if (userFiles) {
				mediaFile = userFiles.find((f) => f.id === fileId) || null;
				if (mediaFile) {
					filePath = `uploads/user/${session.userId}/${mediaFile.category}`;
				}
			}

			// Artist functionality removed - focusing on stage manager workflow

			if (!mediaFile || !filePath) {
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "FILE_NOT_FOUND",
							message: "File not found or access denied",
						},
					},
					{ status: 404 }
				);
			}

			// Generate fresh signed URL
			const fullFilePath = `${filePath}/${mediaFile.filename}`;
			const signedUrl = await getSignedUrl(
				fullFilePath,
				"read",
				new Date(Date.now() + 24 * 60 * 60 * 1000)
			); // 24 hours

			return NextResponse.json<APIResponse>({
				success: true,
				data: {
					file: {
						...mediaFile,
						url: signedUrl,
					},
				},
			});
		} catch (error) {
			console.error("Get file error:", error);
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "INTERNAL_ERROR",
						message: "Failed to retrieve file",
					},
				},
				{ status: 500 }
			);
		}
	}
);

// Delete file
export const DELETE = withAuth(
	async (request: NextRequest, session, { params }) => {
		try {
			const { fileId } = params;

			if (!fileId) {
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "MISSING_FILE_ID",
							message: "File ID is required",
						},
					},
					{ status: 400 }
				);
			}

			// Find and remove file from user's files
			let fileFound = false;
			let mediaFile: MediaFile | null = null;
			let filePath: string | null = null;
			let metadataPath: string | null = null;

			// Check user files
			const userFilesPath = `users/${session.userId}/files.json`;
			const userFiles = await readJsonFile<MediaFile[]>(userFilesPath);
			if (userFiles) {
				const fileIndex = userFiles.findIndex((f) => f.id === fileId);
				if (fileIndex !== -1) {
					mediaFile = userFiles[fileIndex];
					filePath = `uploads/user/${session.userId}/${mediaFile.category}/${mediaFile.filename}`;
					metadataPath = userFilesPath;

					// Remove from array
					userFiles.splice(fileIndex, 1);
					await writeJsonFile(userFilesPath, userFiles);
					fileFound = true;
				}
			}

			// Artist functionality removed - focusing on stage manager workflow

			if (!fileFound || !filePath) {
				return NextResponse.json<APIResponse>(
					{
						success: false,
						error: {
							code: "FILE_NOT_FOUND",
							message: "File not found or access denied",
						},
					},
					{ status: 404 }
				);
			}

			// Delete file from GCS
			try {
				await deleteFile(filePath);
			} catch (error) {
				console.warn(
					`Failed to delete file from GCS: ${filePath}`,
					error
				);
				// Continue even if GCS deletion fails - metadata is already removed
			}

			return NextResponse.json<APIResponse>({
				success: true,
				data: {
					message: "File deleted successfully",
					fileId,
				},
			});
		} catch (error) {
			console.error("Delete file error:", error);
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "INTERNAL_ERROR",
						message: "Failed to delete file",
					},
				},
				{ status: 500 }
			);
		}
	}
);
