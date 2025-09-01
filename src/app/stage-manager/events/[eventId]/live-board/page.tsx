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
	Play,
	Pause,
	SkipForward,
	Clock,
	Users,
	Mic,
	Music,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Event {
	id: string;
	name: string;
	venue: string;
	status: string;
}

export default function LiveBoardPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		if (eventId) {
			fetchEvent();
		}

		// Update time every second
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
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

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading live board...</p>
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
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<header className="bg-gray-800 shadow-sm border-b border-gray-700">
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
									<h1 className="text-xl font-semibold text-white">
										Live Board
									</h1>
									<p className="text-sm text-gray-300">
										{event.name} • {event.venue}
									</p>
								</div>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<div className="text-right">
								<p className="text-sm text-gray-300">
									Current Time
								</p>
								<p className="text-lg font-mono text-white">
									{formatTime(currentTime)}
								</p>
							</div>
							<Link href={`/stage-manager/events/${eventId}`}>
								<Button
									variant="outline"
									className="border-gray-600 text-gray-300 hover:bg-gray-700"
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Event
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Status Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Play className="h-8 w-8 text-green-500" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-white">
										LIVE
									</p>
									<p className="text-sm text-gray-400">
										Event Status
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Users className="h-8 w-8 text-blue-500" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-white">
										5
									</p>
									<p className="text-sm text-gray-400">
										Artists Ready
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Mic className="h-8 w-8 text-purple-500" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-white">
										ON
									</p>
									<p className="text-sm text-gray-400">
										MC Status
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Music className="h-8 w-8 text-pink-500" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-white">
										READY
									</p>
									<p className="text-sm text-gray-400">
										DJ Status
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Current Performance */}
				<Card className="bg-gray-800 border-gray-700 mb-8">
					<CardHeader>
						<CardTitle className="text-white text-xl">
							Current Performance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-2xl font-bold text-white mb-2">
									Artist Name
								</h3>
								<p className="text-gray-300">
									Hip Hop • 5 minutes
								</p>
								<div className="flex items-center mt-2">
									<Clock className="h-4 w-4 text-gray-400 mr-2" />
									<span className="text-gray-400">
										Started: 8:30 PM
									</span>
								</div>
							</div>
							<div className="flex space-x-4">
								<Button
									size="lg"
									className="bg-green-600 hover:bg-green-700"
								>
									<Play className="h-5 w-5 mr-2" />
									Start
								</Button>
								<Button
									size="lg"
									variant="outline"
									className="border-gray-600 text-gray-300 hover:bg-gray-700"
								>
									<Pause className="h-5 w-5 mr-2" />
									Pause
								</Button>
								<Button
									size="lg"
									variant="outline"
									className="border-gray-600 text-gray-300 hover:bg-gray-700"
								>
									<SkipForward className="h-5 w-5 mr-2" />
									Next
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Up Next */}
				<Card className="bg-gray-800 border-gray-700">
					<CardHeader>
						<CardTitle className="text-white text-xl">
							Up Next
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
								>
									<div className="flex items-center">
										<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
											{i}
										</div>
										<div>
											<h4 className="text-white font-semibold">
												Artist {i + 1}
											</h4>
											<p className="text-gray-400 text-sm">
												Performance Style • Duration
											</p>
										</div>
									</div>
									<Badge
										variant="outline"
										className="border-gray-600 text-gray-300"
									>
										Ready
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
