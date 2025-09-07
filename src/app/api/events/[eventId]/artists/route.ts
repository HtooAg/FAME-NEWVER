import { NextRequest, NextResponse } from "next/server";
import { EventGCSService } from "@/lib/gcs";
import { APIResponse } from "@/types";

export async function GET(
	request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	try {
		const eventId = params.eventId;

		// Get artists for this event
		const artists = await EventGCSService.getArtists(eventId);

		return NextResponse.json<APIResponse>({
			success: true,
			data: artists,
		});
	} catch (error) {
		console.error("Get artists error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to fetch artists",
				},
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
		const eventId = params.eventId;
		const artistData = await request.json();

		// Generate unique artist ID
		const artistId = `artist-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		// Create artist object
		const artist = {
			id: artistId,
			eventId,
			artistName: artistData.artistName,
			realName: artistData.realName,
			email: artistData.email,
			phone: artistData.phone,
			style: artistData.style,
			performanceType: artistData.performanceType,
			performanceDuration: artistData.performanceDuration,
			biography: artistData.biography,
			costumeColor: artistData.costumeColor,
			customCostumeColor: artistData.customCostumeColor,
			lightColorSingle: artistData.lightColorSingle,
			lightColorTwo: artistData.lightColorTwo,
			lightColorThree: artistData.lightColorThree,
			lightRequests: artistData.lightRequests,
			stagePositionStart: artistData.stagePositionStart,
			stagePositionEnd: artistData.stagePositionEnd,
			customStagePosition: artistData.customStagePosition,
			equipment: artistData.equipment,
			showLink: artistData.showLink,
			socialMedia: artistData.socialMedia,
			mcNotes: artistData.mcNotes,
			stageManagerNotes: artistData.stageManagerNotes,
			notes: artistData.notes,
			eventName: artistData.eventName,
			musicTracks: artistData.musicTracks || [],
			galleryFiles: artistData.galleryFiles || [],
			status: "pending",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Get existing artists
		const existingArtists = await EventGCSService.getArtists(eventId);

		// Add new artist
		const updatedArtists = [...existingArtists, artist];

		// Save updated artists list
		await EventGCSService.saveArtists(eventId, updatedArtists);

		// Broadcast WebSocket update
		if (global.io) {
			global.io.emit("artist_registered", {
				type: "artist_registered",
				data: {
					id: artistId,
					eventId,
					...artist,
				},
			});
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				id: artistId,
				artist,
			},
		});
	} catch (error) {
		console.error("Create artist error:", error);
		return NextResponse.json<APIResponse>(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to create artist registration",
				},
			},
			{ status: 500 }
		);
	}
}
