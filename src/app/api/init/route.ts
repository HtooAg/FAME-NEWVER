import { NextResponse } from "next/server";
import { writeJsonFile, readJsonFile } from "@/lib/gcs";

export async function POST() {
	try {
		// Check if users file already exists
		const existingUsers = await readJsonFile("users/users.json");

		if (existingUsers !== null) {
			return NextResponse.json({
				success: true,
				message: "Users file already exists",
				userCount: Array.isArray(existingUsers)
					? existingUsers.length
					: 0,
			});
		}

		// Create initial empty users array
		await writeJsonFile("users/users.json", []);

		return NextResponse.json({
			success: true,
			message: "Users file initialized successfully",
		});
	} catch (error) {
		console.error("Error initializing users file:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to initialize users file",
			},
			{ status: 500 }
		);
	}
}
