import { NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function GET(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "NOT_ALLOWED",
					message: "This endpoint is only available in development",
				},
			},
			{ status: 403 }
		);
	}

	try {
		const userFiles = [
			// Super admin files
			"users/super_admin/Alice-4.json",
			"users/super_admin/John-Doe-3.json",

			// Stage manager files
			"users/stage_manager/John-1.json",
			"users/stage_manager/Maung-Maung-5.json",
			"users/stage_manager/Sayan-2.json",
		];

		const foundUsers = [];

		for (const filePath of userFiles) {
			try {
				const user = await readJsonFile(filePath);
				if (user) {
					foundUsers.push({
						file: filePath,
						user: user,
					});
				}
			} catch (error) {
				console.log(`File not found: ${filePath}`);
			}
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				message: "User files check completed",
				foundUsers: foundUsers,
				totalFound: foundUsers.length,
			},
		});
	} catch (error) {
		console.error("Error checking users:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "CHECK_ERROR",
					message: "Failed to check user files",
				},
			},
			{ status: 500 }
		);
	}
}
