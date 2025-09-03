"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	ArrowLeft,
	Music,
	Calendar,
	Clock,
	GripVertical,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Artist {
	id: string;
	artistName: string;
	realName?: string;
	style: string;
	performanceDuration: number;
	performanceOrder: number | null;
	status: "pending" | "approved" | "rejected";
}

interface Event {
	id: string;
	name: string;
	venueName: string;
}

export default function PerformanceOrderManagement() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
			fetchArtists();
		}
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
		}
	};

	const fetchArtists = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();
				const approvedArtists = (data.artists || []).filter(
					(artist: Artist) => artist.status === "approved"
				);
				setArtists(approvedArtists);
			}
		} catch (error) {
			console.error("Error fetching artists:", error);
		} finally {
			setLoading(false);
		}
	};

	const moveArtist = (fromIndex: number, toIndex: number) => {
		const newArtists = [...artists];
		const [movedArtist] = newArtists.splice(fromIndex, 1);
		newArtists.splice(toIndex, 0, movedArtist);

		// Update performance order
		const updatedArtists = newArtists.map((artist, index) => ({
			...artist,
			performanceOrder: index + 1,
		}));

		setArtists(updatedArtists);
	};

	const calculateStartTime = (index: number): string => {
		const baseTime = new Date();
		baseTime.setHours(19, 0, 0, 0); // Start at 7 PM

		let totalMinutes = 0;
		for (let i = 0; i < index; i++) {
			totalMinutes += artists[i].performanceDuration + 5; // +5 minutes setup time
		}

		const startTime = new Date(baseTime.getTime() + totalMinutes * 60000);
		return startTime.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
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
									Performance Order
								</h1>
								<p className="text-sm text-gray-500">
									{event?.name} at {event?.venueName}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Music className="h-5 w-5" />
							<span className="text-sm text-muted-foreground">
								Show Management
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Performance Order Table */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Music className="h-5 w-5" />
							Performance Order & Timing
						</CardTitle>
					</CardHeader>
					<CardContent>
						{artists.length === 0 ? (
							<div className="text-center py-8">
								<Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-500">
									No approved artists for this event yet
								</p>
								<p className="text-sm text-gray-400 mt-2">
									Artists need to be approved before they can
									be added to the performance order
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-16">
											#
										</TableHead>
										<TableHead>Artist</TableHead>
										<TableHead>Style</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead>Start Time</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{artists.map((artist, index) => (
										<TableRow key={artist.id}>
											<TableCell className="font-medium">
												{index + 1}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-8 w-8">
														<AvatarFallback>
															{artist.artistName
																.charAt(0)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">
															{artist.artistName}
														</p>
														{artist.realName && (
															<p className="text-xs text-muted-foreground">
																{
																	artist.realName
																}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{artist.style}
												</Badge>
											</TableCell>
											<TableCell>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{artist.performanceDuration}{" "}
													min
												</span>
											</TableCell>
											<TableCell>
												<span className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{calculateStartTime(index)}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
													{index > 0 && (
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																moveArtist(
																	index,
																	index - 1
																)
															}
														>
															<ArrowUp className="h-3 w-3" />
														</Button>
													)}
													{index <
														artists.length - 1 && (
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																moveArtist(
																	index,
																	index + 1
																)
															}
														>
															<ArrowDown className="h-3 w-3" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
