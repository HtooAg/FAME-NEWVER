import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/data-access";
import { APIResponse } from "@/types";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "MISSING_EMAIL",
						message: "Email address is required",
					},
				},
				{ status: 400 }
			);
		}

		// Check if user exists
		const user = await getUserByEmail(email);

		// For security, we always return success even if user doesn't exist
		// This prevents email enumeration attacks
		if (!user) {
			console.log(
				`Password reset requested for non-existent email: ${email}`
			);
		} else {
			console.log(
				`Password reset requested for user: ${user.id} (${email})`
			);

			// TODO: In a real implementation, you would:
			// 1. Generate a secure reset token
			// 2. Store it in the database with expiration
			// 3. Send an email with the reset link
			// 4. Create a reset password page that validates the token

			// For now, we'll just log it
			console.log("Password reset functionality not yet implemented");
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				message:
					"If an account with that email exists, we've sent a password reset link.",
			},
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to process password reset request",
				},
			},
			{ status: 500 }
		);
	}
}
