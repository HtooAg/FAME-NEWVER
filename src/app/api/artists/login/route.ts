import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function POST(request: NextRequest) {
	try {
		const { email, artistName, artistId } = await request.json();

		// If artistId is provided, try to find by ID first
		if (artistId) {
			console.log(`Searching for artist by ID: ${artistId}`);
			const events = await EventGCSService.listEvents();

			for (const event of events) {
				const artists = await EventGCSService.getArtists(event.id);
				const artist = artists.find((a: any) => a.id === artistId);

				if (artist) {
					console.log("Found artist by ID:", artist);
					return NextResponse.json<APIResponse>({
						success: true,
						data: {
							artist: {
								...artist,
								eventId: event.id,
								eventName: event.name,
							},
						},
					});
				}
			}
		}

		// Fallback to email and name search
		if (!email || !artistName) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "MISSING_FIELDS",
						message:
							"Email and artist name are required (or provide Artist ID)",
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

				console.log(
					`Comparing: ${artistEmail} === ${searchEmail} && ${artistNameField} === ${searchName}`
				);

				return (
					artistEmail === searchEmail &&
					artistNameField === searchName
				);
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
