import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function POST(request: NextRequest) {
	try {
		const { email, artistName, artistId } = await request.json();

		// Require email and artist name (artist ID is optional but if provided, must match)
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
			console.log(
				`Searching in event ${event.id}, found ${artists.length} artists`
			);

			const artist = artists.find((a: any) => {
				const artistEmail = a.email?.toLowerCase();
				const artistNameField = (
					a.artistName || a.artist_name
				)?.toLowerCase();
				const searchEmail = email.toLowerCase();
				const searchName = artistName.toLowerCase();

				// Check email and artist name match
				const emailMatch = artistEmail === searchEmail;
				const nameMatch = artistNameField === searchName;

				// If artist ID is provided, it must also match
				let idMatch = true;
				if (artistId && artistId.trim() !== "") {
					idMatch = a.id === artistId;
					console.log(
						`Comparing ID: ${a.id} === ${artistId} = ${idMatch}`
					);
				}

				console.log(
					`Comparing: email(${emailMatch}) && name(${nameMatch}) && id(${idMatch})`
				);

				return emailMatch && nameMatch && idMatch;
			});

			if (artist) {
				console.log("Found matching artist:", artist);
				foundArtist = {
					...artist,
					eventId: event.id,
					eventName: event.name,
				};
				break;
			}
		}

		if (!foundArtist) {
			const errorMessage =
				artistId && artistId.trim() !== ""
					? "Artist not found. Please check your Artist ID, email, and artist name are all correct."
					: "Artist not found with the provided email and artist name.";

			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message: errorMessage,
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
