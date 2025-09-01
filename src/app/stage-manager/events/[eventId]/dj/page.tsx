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
	Music,
	Upload,
	Play,
	Pause,
	Volume2,
	Headphones,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Event {
	id: string;
	name: string;
	venue: string;
}

interface MusicTrack {
	id: string;
	name: string;
	artist: string;
	duration: string;
	genre: string;
	bpm?: number;
}

export default function DJManagementPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [tracks, setTracks] = useState<MusicTrack[]>([]);
	const [currentTrack, setCurrentTrack] = useState<string | null>(null);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
			loadTracks();
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
					setEvent(result.data.event);
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

	const loadTracks = () => {
		// Mock music tracks
		const mockTracks = [
			{
				id: "1",
				name: "Summer Vibes",
				artist: "DJ Cool",
				duration: "3:45",
				genre: "House",
				bpm: 128,
			},
			{
				id: "2",
				name: "Night Energy",
				artist: "Beat Master",
				duration: "4:12",
				genre: "Electronic",
				bpm: 132,
			},
			{
				id: "3",
				name: "Crowd Pleaser",
				artist: "Mix King",
				duration: "3:28",
				genre: "Pop",
				bpm: 120,
			},
		];
		setTracks(mockTracks);
	};

	const togglePlay = (trackId: string) => {
		if (currentTrack === trackId) {
			setCurrentTrack(null);
		} else {
			setCurrentTrack(trackId);
		}
	};

	const getGenreColor = (genre: string) => {
		const colors = {
			House: "bg-blue-100 text-blue-800",
			Electronic: "bg-purple-100 text-purple-800",
			Pop: "bg-pink-100 text-pink-800",
			Hip: "bg-green-100 text-green-800",
			Rock: "bg-red-100 text-red-800",
		};
		return (
			colors[genre as keyof typeof colors] || "bg-gray-100 text-gray-800"
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading DJ management...</p>
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
										DJ Management
									</h1>
									<p className="text-sm text-gray-500">
										{event.name} • {event.venue}
									</p>
								</div>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<Button className="bg-purple-600 hover:bg-purple-700">
								<Upload className="h-4 w-4 mr-2" />
								Upload Music
							</Button>
							<Link href={`/stage-manager/events/${eventId}`}>
								<Button variant="outline">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Event
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* DJ Status */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Headphones className="h-8 w-8 text-green-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										READY
									</p>
									<p className="text-sm text-gray-600">
										DJ Status
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Music className="h-8 w-8 text-blue-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										{tracks.length}
									</p>
									<p className="text-sm text-gray-600">
										Tracks
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Volume2 className="h-8 w-8 text-purple-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										85%
									</p>
									<p className="text-sm text-gray-600">
										Volume
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Play className="h-8 w-8 text-pink-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										{currentTrack ? "PLAYING" : "STOPPED"}
									</p>
									<p className="text-sm text-gray-600">
										Playback
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Music Library */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Music className="h-5 w-5 mr-2 text-purple-600" />
							Music Library
						</CardTitle>
						<CardDescription>
							Manage music tracks for the event
						</CardDescription>
					</CardHeader>
					<CardContent>
						{tracks.length > 0 ? (
							<div className="space-y-4">
								{tracks.map((track) => (
									<div
										key={track.id}
										className={`flex items-center p-4 rounded-lg border transition-all ${
											currentTrack === track.id
												? "bg-purple-50 border-purple-200"
												: "bg-gray-50 border-gray-200"
										}`}
									>
										<Button
											size="sm"
											variant={
												currentTrack === track.id
													? "default"
													: "outline"
											}
											onClick={() => togglePlay(track.id)}
											className="mr-4"
										>
											{currentTrack === track.id ? (
												<Pause className="h-4 w-4" />
											) : (
												<Play className="h-4 w-4" />
											)}
										</Button>

										<div className="flex-1">
											<h3 className="font-semibold text-gray-900">
												{track.name}
											</h3>
											<p className="text-sm text-gray-600">
												by {track.artist} •{" "}
												{track.duration}
											</p>
										</div>

										<div className="flex items-center space-x-4">
											<Badge
												className={getGenreColor(
													track.genre
												)}
											>
												{track.genre}
											</Badge>
											{track.bpm && (
												<span className="text-sm text-gray-600">
													{track.bpm} BPM
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									No Music Tracks
								</h3>
								<p className="text-gray-600 mb-4">
									Upload music tracks to get started with DJ
									management.
								</p>
								<Button className="bg-purple-600 hover:bg-purple-700">
									<Upload className="h-4 w-4 mr-2" />
									Upload Your First Track
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* DJ Controls */}
				{tracks.length > 0 && (
					<Card className="mt-8">
						<CardHeader>
							<CardTitle>DJ Controls</CardTitle>
							<CardDescription>
								Live mixing and playback controls
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-center space-x-6 py-8">
								<Button size="lg" variant="outline">
									<Volume2 className="h-5 w-5 mr-2" />
									Volume
								</Button>
								<Button
									size="lg"
									className="bg-green-600 hover:bg-green-700"
								>
									<Play className="h-5 w-5 mr-2" />
									Play
								</Button>
								<Button size="lg" variant="outline">
									<Pause className="h-5 w-5 mr-2" />
									Pause
								</Button>
								<Button size="lg" variant="outline">
									<Headphones className="h-5 w-5 mr-2" />
									Cue
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
