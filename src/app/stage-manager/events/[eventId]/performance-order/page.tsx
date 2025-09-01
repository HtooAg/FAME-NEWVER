"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	GripVertical,
	Clock,
	Music,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Artist {
	id: string;
	profile: {
		artistName: string;
		performanceStyle: string;
		duration: number;
	};
	order: number;
}

interface Event {
	id: string;
	name: string;
	venue: string;
	artists: Artist[];
}

export default function PerformanceOrderPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [artists, setArtists] = useState<Artist[]>([]);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
		}
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const response = await fetch(
				`/api/stage-manager/events/${eventId}`
			);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					const eventData = result.data.event;
					setEvent(eventData);

					// Mock artists data with performance order
					const mockArtists = [
						{
							id: "1",
							profile: {
								artistName: "DJ Rhythm",
								performanceStyle: "Hip Hop",
								duration: 5,
							},
							order: 1,
						},
						{
							id: "2",
							profile: {
								artistName: "MC Flow",
								performanceStyle: "Rap",
								duration: 4,
							},
							order: 2,
						},
						{
							id: "3",
							profile: {
								artistName: "Beat Master",
								performanceStyle: "Electronic",
								duration: 6,
							},
							order: 3,
						},
					];
					setArtists(mockArtists);
				}
			} else if (response.status === 403) {
				router.push("/login");
			} else if (response.status === 404) {
				router.push("/stage-manager/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
		} finally {
			setLoading(false);
		}
	};

	const moveArtist = (artistId: string, direction: "up" | "down") => {
		const currentIndex = artists.findIndex((a) => a.id === artistId);
		if (currentIndex === -1) return;

		const newArtists = [...artists];
		const targetIndex =
			direction === "up" ? currentIndex - 1 : currentIndex + 1;

		if (targetIndex < 0 || targetIndex >= newArtists.length) return;

		// Swap artists
		[newArtists[currentIndex], newArtists[targetIndex]] = [
			newArtists[targetIndex],
			newArtists[currentIndex],
		];

		// Update order numbers
		newArtists.forEach((artist, index) => {
			artist.order = index + 1;
		});

		setArtists(newArtists);
	};

	const getTotalDuration = () => {
		return artists.reduce(
			(total, artist) => total + artist.profile.duration,
			0
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">
						Loading performance order...
					</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Event Not Found
					</h2>
					<Link href="/stage-manager/events">
						<Button>Back to Events</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										Performance Order
									</h1>
									<p className="text-sm text-gray-500">
										{event.name} • {event.venue}
									</p>
								</div>
							</Link>
						</div>
						<Link href={`/stage-manager/events/${eventId}`}>
							<Button variant="outline">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Event
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Summary Card */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center">
							<Clock className="h-5 w-5 mr-2 text-purple-600" />
							Performance Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center">
								<p className="text-2xl font-bold text-purple-600">
									{artists.length}
								</p>
								<p className="text-sm text-gray-600">
									Total Artists
								</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-blue-600">
									{getTotalDuration()}
								</p>
								<p className="text-sm text-gray-600">
									Total Minutes
								</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-green-600">
									{Math.floor(getTotalDuration() / 60)}h{" "}
									{getTotalDuration() % 60}m
								</p>
								<p className="text-sm text-gray-600">
									Duration
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Performance Order */}
				<Card>
					<CardHeader>
						<CardTitle>Set Performance Order</CardTitle>
						<CardDescription>
							Drag and drop or use the arrows to reorder
							performances
						</CardDescription>
					</CardHeader>
					<CardContent>
						{artists.length > 0 ? (
							<div className="space-y-4">
								{artists.map((artist, index) => (
									<div
										key={artist.id}
										className="flex items-center p-4 bg-gray-50 rounded-lg border"
									>
										<div className="flex items-center mr-4">
											<GripVertical className="h-5 w-5 text-gray-400 mr-2" />
											<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
												{artist.order}
											</div>
										</div>

										<div className="flex-1">
											<h3 className="font-semibold text-gray-900">
												{artist.profile.artistName}
											</h3>
											<div className="flex items-center text-sm text-gray-600">
												<Music className="h-4 w-4 mr-1" />
												{
													artist.profile
														.performanceStyle
												}{" "}
												• {artist.profile.duration} min
											</div>
										</div>

										<div className="flex space-x-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													moveArtist(artist.id, "up")
												}
												disabled={index === 0}
											>
												<ArrowUp className="h-4 w-4" />
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													moveArtist(
														artist.id,
														"down"
													)
												}
												disabled={
													index === artists.length - 1
												}
											>
												<ArrowDown className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}

								<div className="flex justify-end pt-4">
									<Button className="bg-purple-600 hover:bg-purple-700">
										Save Performance Order
									</Button>
								</div>
							</div>
						) : (
							<div className="text-center py-12">
								<Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									No Artists Yet
								</h3>
								<p className="text-gray-600 mb-4">
									Add artists to your event to set the
									performance order.
								</p>
								<Link
									href={`/stage-manager/events/${eventId}/artists`}
								>
									<Button>Manage Artists</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
