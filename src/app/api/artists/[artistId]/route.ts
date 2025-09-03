import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function GET(
	request: NextRequest,
	{ params }: { params: { artistId: string } }
) {
	try {
		const { artistId } = params;

		// We need to search across all events to find the artist
		// This is a simplified approach - in a real app you might want to index artists separately
		const events = await EventGCSService.listEvents();

		let foundArtist = null;

		for (const event of events) {
			const artists = await EventGCSService.getArtists(event.id);
			const artist = artists.find((a: any) => a.id === artistId);
			if (artist) {
				foundArtist = artist;
				break;
			}
		}

		if (!foundArtist) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "Artist not found",
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
		console.error("Get artist error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to fetch artist",
				},
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { artistId: string } }
) {
	try {
		const { artistId } = params;
		const updateData = await request.json();

		// Find the artist across all events
		const events = await EventGCSService.listEvents();

		let foundEvent = null;
		let artistIndex = -1;
		let artists = [];

		for (const event of events) {
			artists = await EventGCSService.getArtists(event.id);
			artistIndex = artists.findIndex((a: any) => a.id === artistId);
			if (artistIndex !== -1) {
				foundEvent = event;
				break;
			}
		}

		if (!foundEvent || artistIndex === -1) {
			return NextResponse.json<APIResponse>(
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "Artist not found",
					},
				},
				{ status: 404 }
			);
		}

		// Update artist data
		const updatedArtist = {
			...artists[artistIndex],
			...updateData,
			updatedAt: new Date().toISOString(),
		};

		// Update the artist in the array
		artists[artistIndex] = updatedArtist;

		// Save updated artists list
		await EventGCSService.saveArtists(foundEvent.id, artists);

		return NextResponse.json<APIResponse>({
			success: true,
			data: updatedArtist,
		});
	} catch (error) {
		console.error("Update artist error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to update artist",
				},
			},
			{ status: 500 }
		);
	}
}
