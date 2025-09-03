import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";

export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;

		// Fetch artists from Google Cloud Storage
		const artists = await EventGCSService.getArtists(eventId);

		return NextResponse.json({
			success: true,
			artists: artists,
		});
	} catch (error) {
		console.error("Error fetching artists:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch artists from Google Cloud Storage",
			},
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const { eventId } = params;
		const body = await request.json();

		// Get existing artists
		const existingArtists = await EventGCSService.getArtists(eventId);

		// Add new artist
		const newArtist = {
			id: `artist-${Date.now()}-${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			...body,
			eventId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const updatedArtists = [...existingArtists, newArtist];

		// Save to GCS
		const saved = await EventGCSService.saveArtists(
			eventId,
			updatedArtists
		);

		if (!saved) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to save artist to Google Cloud Storage",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			data: newArtist,
		});
	} catch (error) {
		console.error("Error creating artist:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create artist",
			},
			{ status: 500 }
		);
	}
}
