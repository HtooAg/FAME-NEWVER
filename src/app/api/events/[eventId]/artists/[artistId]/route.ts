import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string; artistId: string } }
) {
	try {
		const { eventId, artistId } = params;

		// Get artists for this event
		const artists = await EventGCSService.getArtists(eventId);

		// Find the specific artist
		const artist = artists.find((a: any) => a.id === artistId);

		if (!artist) {
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
			data: {
				artist,
			},
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

export async function PUT(
	request: NextRequest,
	{ params }: { params: { eventId: string; artistId: string } }
) {
	try {
		const { eventId, artistId } = params;
		const updateData = await request.json();

		// Get existing artists
		const artists = await EventGCSService.getArtists(eventId);

		// Find artist index
		const artistIndex = artists.findIndex((a: any) => a.id === artistId);

		if (artistIndex === -1) {
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
			artistName: updateData.artistName,
			realName: updateData.realName,
			email: updateData.email,
			phone: updateData.phone,
			style: updateData.style,
			performanceType: updateData.performanceType,
			performanceDuration: updateData.performanceDuration,
			biography: updateData.biography,
			costumeColor: updateData.costumeColor,
			customCostumeColor: updateData.customCostumeColor,
			lightColorSingle: updateData.lightColorSingle,
			lightColorTwo: updateData.lightColorTwo,
			lightColorThree: updateData.lightColorThree,
			lightRequests: updateData.lightRequests,
			stagePositionStart: updateData.stagePositionStart,
			stagePositionEnd: updateData.stagePositionEnd,
			customStagePosition: updateData.customStagePosition,
			equipment: updateData.equipment,
			showLink: updateData.showLink,
			socialMedia: updateData.socialMedia,
			mcNotes: updateData.mcNotes,
			stageManagerNotes: updateData.stageManagerNotes,
			notes: updateData.notes,
			eventName: updateData.eventName,
			musicTracks: updateData.musicTracks || [],
			galleryFiles: updateData.galleryFiles || [],
			updatedAt: new Date().toISOString(),
		};

		// Update the artist in the array
		artists[artistIndex] = updatedArtist;

		// Save updated artists list
		await EventGCSService.saveArtists(eventId, artists);

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				artist: updatedArtist,
			},
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

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { eventId: string; artistId: string } }
) {
	try {
		const { eventId, artistId } = params;

		// Get existing artists
		const artists = await EventGCSService.getArtists(eventId);

		// Filter out the artist to delete
		const updatedArtists = artists.filter((a: any) => a.id !== artistId);

		if (artists.length === updatedArtists.length) {
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

		// Save updated artists list
		await EventGCSService.saveArtists(eventId, updatedArtists);

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				message: "Artist deleted successfully",
			},
		});
	} catch (error) {
		console.error("Delete artist error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to delete artist",
				},
			},
			{ status: 500 }
		);
	}
}
