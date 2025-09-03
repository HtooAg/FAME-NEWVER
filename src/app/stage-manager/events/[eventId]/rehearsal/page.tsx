"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Clock,
	Users,
	Play,
	Pause,
	RotateCcw,
	CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Event {
	id: string;
	name: string;
	venueName: string;
}

export default function RehearsalSession() {
	const params = useParams();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [isRehearsing, setIsRehearsing] = useState(false);
	const [rehearsalTime, setRehearsalTime] = useState(0);
	const [currentArtist, setCurrentArtist] = useState<string | null>(null);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
		}

		let timer: NodeJS.Timeout;
		if (isRehearsing) {
			timer = setInterval(() => {
				setRehearsalTime((prev) => prev + 1);
			}, 1000);
		}

		return () => {
			if (timer) clearInterval(timer);
		};
	}, [eventId, isRehearsing]);

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

	const startRehearsal = () => {
		setIsRehearsing(true);
		setRehearsalTime(0);
		setCurrentArtist("Sample Artist");
	};

	const pauseRehearsal = () => {
		setIsRehearsing(false);
	};

	const resetRehearsal = () => {
		setIsRehearsing(false);
		setRehearsalTime(0);
	};

	const completeRehearsal = () => {
		setIsRehearsing(false);
		alert("Rehearsal completed successfully!");
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">
						Loading rehearsal session...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="mr-4"
							>
								<Button variant="ghost" size="sm">
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
								<h1 className="text-xl font-semibold text-gray-900">
									Rehearsal Session
								</h1>
								<p className="text-sm text-gray-500">
									{event?.name} at {event?.venueName}
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-8"
				>
					<Card className="text-center">
						<CardHeader>
							<CardTitle className="text-3xl font-bold">
								{formatTime(rehearsalTime)}
							</CardTitle>
							<p className="text-muted-foreground">
								{isRehearsing
									? "Rehearsal in progress"
									: "Rehearsal timer"}
							</p>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-center gap-4">
								{!isRehearsing ? (
									<Button
										onClick={startRehearsal}
										size="lg"
										className="bg-green-600 hover:bg-green-700"
									>
										<Play className="h-5 w-5 mr-2" />
										Start Rehearsal
									</Button>
								) : (
									<Button
										onClick={pauseRehearsal}
										size="lg"
										variant="outline"
									>
										<Pause className="h-5 w-5 mr-2" />
										Pause
									</Button>
								)}
								<Button
									onClick={resetRehearsal}
									size="lg"
									variant="outline"
								>
									<RotateCcw className="h-5 w-5 mr-2" />
									Reset
								</Button>
								{rehearsalTime > 0 && (
									<Button
										onClick={completeRehearsal}
										size="lg"
										className="bg-blue-600 hover:bg-blue-700"
									>
										<CheckCircle className="h-5 w-5 mr-2" />
										Complete
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{currentArtist && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Current Artist
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-semibold">
										{currentArtist}
									</h3>
									<p className="text-muted-foreground">
										Electronic Music
									</p>
								</div>
								<Badge
									className={
										isRehearsing
											? "bg-green-500 text-white"
											: "bg-gray-500 text-white"
									}
								>
									{isRehearsing ? "Rehearsing" : "Ready"}
								</Badge>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
