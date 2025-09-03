import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function GET(request: NextRequest) {
	try {
		// This is a simplified implementation
		// In a real app, you would get the artist ID from the session/auth
		const url = new URL(request.url);
		const artistId = url.searchParams.get("artistId");

		if (!artistId) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "MISSING_ARTIST_ID",
						message: "Artist ID is required",
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
			const artist = artists.find((a: any) => a.id === artistId);
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
						message: "Artist profile not found",
					},
				},
				{ status: 404 }
			);
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: foundArtist,
		});
	} catch (error) {
		console.error("Get artist profile error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to fetch artist profile",
				},
			},
			{ status: 500 }
		);
	}
}
