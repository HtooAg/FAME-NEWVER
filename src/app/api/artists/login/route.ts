import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function POST(request: NextRequest) {
	try {
		const { email, artistName } = await request.json();

		if (!email || !artistName) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "MISSING_FIELDS",
						message: "Email and artist name are required",
					},
				},
				{ status: 400 }
			);
		}

		// Search for artist across all events
		const events = await EventGCSService.listEvents();

		let foundArtist = null;

		for (const event of events) {
			const artists = await EventGCSService.getArtists(event.id);
			const artist = artists.find(
				(a: any) =>
					a.email?.toLowerCase() === email.toLowerCase() &&
					a.artistName?.toLowerCase() === artistName.toLowerCase()
			);
			if (artist) {
				foundArtist = {
					...artist,
					eventId: event.id,
					eventName: event.name,
				};
				break;
			}
		}

		if (!foundArtist) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message:
							"Artist not found with the provided email and name",
					},
				},
				{ status: 404 }
			);
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				artist: foundArtist,
			},
		});
	} catch (error) {
		console.error("Artist login error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to authenticate artist",
				},
			},
			{ status: 500 }
		);
	}
}
