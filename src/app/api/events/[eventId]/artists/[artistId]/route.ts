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

export async function PATCH(
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

		// Update only the provided fields
		const updatedArtist = {
			...artists[artistIndex],
			...updateData,
			updatedAt: new Date().toISOString(),
		};

		// Update the artist in the array
		artists[artistIndex] = updatedArtist;

		// Save updated artists list
		await EventGCSService.saveArtists(eventId, artists);

		// Broadcast WebSocket updates to all connected clients for this event
		if (global.io) {
			// Notify about artist status changes
			if (updateData.performance_status !== undefined) {
				global.io.to(`event_${eventId}`).emit("artist_status_changed", {
					eventId,
					id: artistId,
					artist_name: updatedArtist.artistName,
					performance_status: updateData.performance_status,
					timestamp: new Date().toISOString(),
				});
				console.log(
					`Artist status changed: ${updatedArtist.artistName} -> ${updateData.performance_status}`
				);
			}

			// Notify about performance order changes
			if (updateData.performance_order !== undefined) {
				global.io
					.to(`event_${eventId}`)
					.emit("performance-order-update", {
						eventId,
						type: "artist",
						action:
							updateData.performance_order === null
								? "removed"
								: "updated",
						artistId,
						artist_name: updatedArtist.artistName,
						timestamp: new Date().toISOString(),
					});
				console.log(
					`Performance order updated: ${updatedArtist.artistName} -> ${updateData.performance_order}`
				);
			}

			// Notify about performance date changes
			if (updateData.performance_date !== undefined) {
				global.io.to(`event_${eventId}`).emit("artist_assigned", {
					eventId,
					id: artistId,
					artist_name: updatedArtist.artistName,
					performance_date: updateData.performance_date,
					timestamp: new Date().toISOString(),
				});
				console.log(
					`Artist assigned to date: ${updatedArtist.artistName} -> ${updateData.performance_date}`
				);
			}
		}

		return NextResponse.json<APIResponse>({
			success: true,
			data: {
				artist: updatedArtist,
			},
		});
	} catch (error) {
		console.error("Patch artist error:", error);
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

		// Find the artist to delete for WebSocket broadcast
		const artistToDelete = artists.find((a: any) => a.id === artistId);

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

		// Broadcast WebSocket update
		if (artistToDelete && global.io) {
			global.io.to(`event_${eventId}`).emit("artist_deleted", {
				eventId,
				id: artistId,
				artist_name: artistToDelete.artistName,
				timestamp: new Date().toISOString(),
			});
			console.log(`Artist deleted: ${artistToDelete.artistName}`);
		}

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
