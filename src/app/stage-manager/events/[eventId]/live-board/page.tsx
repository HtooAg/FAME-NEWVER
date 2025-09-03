"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Radio,
	AlertTriangle,
	Users,
	Clock,
	Play,
	Pause,
	SkipForward,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Event {
	id: string;
	name: string;
	venueName: string;
}

export default function LivePerformanceBoard() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [isLive, setIsLive] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		if (eventId) {
			fetchEventData();
		}

		// Update time every second
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, [eventId]);

	const fetchEventData = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				setEvent(data.data);
			}
		} catch (error) {
			console.error("Error fetching event data:", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleLiveMode = () => {
		setIsLive(!isLive);
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

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<header className="bg-gray-800 shadow-sm border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="mr-4"
							>
								<Button
									variant="ghost"
									size="sm"
									className="text-white hover:bg-gray-700"
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Event
								</Button>
							</Link>
							<Image
								src="/fame-logo.png"
								alt="FAME Logo"
								width={40}
								height={40}
								className="mr-3"
							/>
							<div>
								<h1 className="text-xl font-semibold text-white">
									Live Performance Board
								</h1>
								<p className="text-sm text-gray-300">
									{event?.name} at {event?.venueName}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<div className="text-right">
								<p className="text-sm text-gray-300">
									Current Time
								</p>
								<p className="text-lg font-mono text-white">
									{currentTime.toLocaleTimeString()}
								</p>
							</div>
							<Button
								onClick={toggleLiveMode}
								className={`${
									isLive
										? "bg-red-600 hover:bg-red-700"
										: "bg-green-600 hover:bg-green-700"
								} text-white`}
							>
								<Radio className="h-4 w-4 mr-2" />
								{isLive ? "LIVE" : "Go Live"}
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Live Status Banner */}
				{isLive && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8"
					>
						<div className="bg-red-600 text-white p-4 rounded-lg flex items-center justify-center">
							<Radio className="h-5 w-5 mr-2 animate-pulse" />
							<span className="font-bold text-lg">
								LIVE PERFORMANCE IN PROGRESS
							</span>
						</div>
					</motion.div>
				)}

				{/* Current Status Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{/* Currently On Stage */}
					<Card className="bg-gray-800 border-gray-700">
						<CardHeader className="pb-3">
							<CardTitle className="text-green-400 flex items-center gap-2">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								Currently On Stage
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center text-gray-300">
								<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No performance currently active</p>
							</div>
						</CardContent>
					</Card>

					{/* Next Up */}
					<Card className="bg-gray-800 border-gray-700">
						<CardHeader className="pb-3">
							<CardTitle className="text-yellow-400 flex items-center gap-2">
								<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
								Next Up
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center text-gray-300">
								<Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No next performance scheduled</p>
							</div>
						</CardContent>
					</Card>

					{/* Emergency Controls */}
					<Card className="bg-gray-800 border-gray-700">
						<CardHeader className="pb-3">
							<CardTitle className="text-red-400 flex items-center gap-2">
								<AlertTriangle className="h-5 w-5" />
								Emergency Controls
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Button
									variant="destructive"
									className="w-full bg-red-600 hover:bg-red-700"
								>
									Emergency Stop
								</Button>
								<Button
									variant="outline"
									className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
								>
									Technical Pause
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Performance Controls */}
				<Card className="bg-gray-800 border-gray-700 mb-8">
					<CardHeader>
						<CardTitle className="text-white flex items-center gap-2">
							<Play className="h-5 w-5" />
							Performance Controls
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center gap-4">
							<Button
								variant="outline"
								size="lg"
								className="border-gray-600 text-gray-300 hover:bg-gray-700"
							>
								<SkipForward className="h-5 w-5 mr-2" />
								Previous
							</Button>
							<Button
								size="lg"
								className="bg-green-600 hover:bg-green-700 text-white px-8"
							>
								<Play className="h-5 w-5 mr-2" />
								Start Performance
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="border-gray-600 text-gray-300 hover:bg-gray-700"
							>
								<SkipForward className="h-5 w-5 mr-2" />
								Next
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Performance Timeline */}
				<Card className="bg-gray-800 border-gray-700">
					<CardHeader>
						<CardTitle className="text-white flex items-center gap-2">
							<Clock className="h-5 w-5" />
							Performance Timeline
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-center py-8 text-gray-400">
							<Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No performance schedule available</p>
							<p className="text-sm mt-2">
								Set up your show order to see the timeline here
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
