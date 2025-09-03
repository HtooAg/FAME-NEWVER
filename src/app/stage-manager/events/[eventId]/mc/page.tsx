"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Mic,
	Clock,
	User,
	ArrowLeft,
	Users,
	Calendar,
	Star,
	CheckCircle,
	Edit3,
	Timer,
	Video,
	Trash2,
	Speaker,
	Sparkles,
	Play,
	AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Artist {
	id: string;
	artistName: string;
	realName?: string;
	style: string;
	biography?: string;
	performanceDuration: number;
	performanceOrder: number | null;
	rehearsalCompleted: boolean;
	qualityRating: number | null;
	mcNotes?: string;
	phone?: string;
	email?: string;
	performanceStatus?: string;
	performanceDate?: string;
}

interface Cue {
	id: string;
	type:
		| "mc_break"
		| "video_break"
		| "cleaning_break"
		| "speech_break"
		| "opening"
		| "countdown"
		| "artist_ending"
		| "animation";
	title: string;
	duration?: number;
	performanceOrder: number;
	notes?: string;
	isCompleted?: boolean;
	mcNotes?: string;
	performanceDate?: string;
}

interface ShowOrderItem {
	id: string;
	type: "artist" | "cue";
	artist?: Artist;
	cue?: Cue;
	performanceOrder: number;
	status?:
		| "not_started"
		| "next_on_deck"
		| "next_on_stage"
		| "currently_on_stage"
		| "completed";
}

interface Event {
	id: string;
	name: string;
	venueName: string;
	showDates: string[];
}

export default function MCDashboard() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [showOrderItems, setShowOrderItems] = useState<ShowOrderItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [eventDates, setEventDates] = useState<string[]>([]);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
		}
	}, [eventId]);

	useEffect(() => {
		if (selectedPerformanceDate) {
			fetchPerformanceOrder();
		}
	}, [selectedPerformanceDate]);

	const fetchEventData = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				const evt = data.data || data;
				setEvent({
					id: evt.id,
					name: evt.name,
					venueName: evt.venueName,
					showDates: evt.showDates || [],
				});

				// Set up dates
				const showDates = evt.showDates || [];
				if (showDates.length > 0) {
					const dates = showDates.map(
						(date: string) => date.split("T")[0]
					);
					setEventDates(dates);
					if (!selectedPerformanceDate) {
						setSelectedPerformanceDate(dates[0]);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching event data:", error);
		}
	};

	const fetchPerformanceOrder = async () => {
		if (!selectedPerformanceDate) return;

		try {
			setLoading(true);

			// Fetch artists
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();
				const artists = (data.artists || []).map((artist: any) => ({
					id: artist.id,
					artistName: artist.artistName,
					realName: artist.realName,
					style: artist.style,
					biography: artist.biography,
					performanceDuration: artist.performanceDuration || 30,
					performanceOrder: artist.performanceOrder || null,
					rehearsalCompleted: artist.rehearsalCompleted || false,
					qualityRating: artist.qualityRating || null,
					mcNotes: artist.mcNotes,
					phone: artist.phone,
					email: artist.email,
					performanceStatus:
						artist.performanceStatus || "not_started",
					performanceDate: artist.performanceDate,
				}));

				// Create show order items from artists
				const artistItems = artists
					.filter((a: Artist) => a.performanceOrder !== null)
					.map((artist: Artist, index: number) => ({
						id: artist.id,
						type: "artist" as const,
						artist,
						performanceOrder: artist.performanceOrder || index + 1,
						status: (artist.performanceStatus ||
							"not_started") as ShowOrderItem["status"],
					}))
					.sort((a, b) => a.performanceOrder - b.performanceOrder);

				setShowOrderItems(artistItems);
			}
		} catch (error) {
			console.error("Error fetching performance order:", error);
		} finally {
			setLoading(false);
		}
	};

	const updateMCNotes = async (
		itemId: string,
		notes: string,
		itemType: "artist" | "cue"
	) => {
		try {
			if (itemType === "artist") {
				// Update local state
				setShowOrderItems((prev) =>
					prev.map((item) =>
						item.id === itemId && item.type === "artist"
							? {
									...item,
									artist: {
										...item.artist!,
										mcNotes: notes,
									},
							  }
							: item
					)
				);
				alert("MC Notes updated successfully");
			}
		} catch (error) {
			console.error("Error updating MC notes:", error);
			alert("Failed to update MC notes");
		}
	};

	const getItemStatus = (item: ShowOrderItem, index: number) => {
		if (item.status) return item.status;
		if (index === 0) return "currently_on_stage";
		if (index === 1) return "next_on_stage";
		if (index === 2) return "next_on_deck";
		return "not_started";
	};

	const getRowColorClasses = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-red-50 border-red-200";
			case "currently_on_stage":
				return "bg-green-50 border-green-200";
			case "next_on_stage":
				return "bg-yellow-50 border-yellow-200";
			case "next_on_deck":
				return "bg-blue-50 border-blue-200";
			default:
				return "bg-background";
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return (
					<Badge className="bg-red-500 text-white">Completed</Badge>
				);
			case "currently_on_stage":
				return (
					<Badge className="bg-green-500 text-white">
						Currently On Stage
					</Badge>
				);
			case "next_on_stage":
				return (
					<Badge className="bg-yellow-500 text-white">
						Next On Stage
					</Badge>
				);
			case "next_on_deck":
				return (
					<Badge className="bg-blue-500 text-white">
						Next On Deck
					</Badge>
				);
			default:
				return <Badge variant="outline">Not Started</Badge>;
		}
	};

	const getQualityBadge = (rating: number | null) => {
		if (!rating) return null;

		return (
			<div className="flex items-center gap-1">
				{Array.from({ length: rating }, (_, i) => (
					<Star
						key={i}
						className="h-3 w-3 fill-current text-yellow-500"
					/>
				))}
			</div>
		);
	};

	const getDefaultIntroduction = (item: ShowOrderItem) => {
		if (item.type === "artist" && item.artist) {
			return `Ladies and gentlemen, please welcome to the stage ${item.artist.artistName}! ${item.artist.artistName} is a talented ${item.artist.style} performer who brings ${item.artist.performanceDuration} minutes of incredible entertainment. Let's give them a warm welcome!`;
		}
		return "";
	};

	// MC Notes Cell Component
	const MCNotesCell = ({
		item,
		onUpdate,
	}: {
		item: ShowOrderItem;
		onUpdate: (id: string, notes: string, type: "artist" | "cue") => void;
	}) => {
		const [isEditing, setIsEditing] = useState(false);
		const [notes, setNotes] = useState(
			(item.type === "artist"
				? item.artist?.mcNotes
				: item.cue?.mcNotes) || ""
		);

		const handleSave = () => {
			onUpdate(item.id, notes, item.type);
			setIsEditing(false);
		};

		const handleCancel = () => {
			setNotes(
				(item.type === "artist"
					? item.artist?.mcNotes
					: item.cue?.mcNotes) || ""
			);
			setIsEditing(false);
		};

		if (isEditing) {
			return (
				<div className="space-y-2 min-w-[200px]">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Add MC introduction notes..."
						className="min-h-[60px]"
					/>
					<div className="flex gap-1">
						<Button size="sm" onClick={handleSave}>
							Save
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleCancel}
						>
							Cancel
						</Button>
					</div>
				</div>
			);
		}

		return (
			<div className="max-w-[200px]">
				{notes ? (
					<div className="space-y-1">
						<p className="text-sm truncate" title={notes}>
							{notes}
						</p>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsEditing(true)}
							className="h-6 px-2 text-xs"
						>
							<Edit3 className="h-3 w-3 mr-1" />
							Edit
						</Button>
					</div>
				) : (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsEditing(true)}
						className="h-8 text-xs"
					>
						<Edit3 className="h-3 w-3 mr-1" />
						Add Notes
					</Button>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading MC dashboard...</p>
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
									MC Dashboard
								</h1>
								<p className="text-sm text-gray-500">
									{event?.name} at {event?.venueName}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							{eventDates.length > 1 && (
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									<Select
										value={selectedPerformanceDate}
										onValueChange={
											setSelectedPerformanceDate
										}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Select show date" />
										</SelectTrigger>
										<SelectContent>
											{eventDates.map((date, index) => (
												<SelectItem
													key={date}
													value={date}
												>
													Day {index + 1} -{" "}
													{new Date(
														date
													).toLocaleDateString()}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<div className="flex items-center gap-2">
								<Mic className="h-5 w-5" />
								<span className="text-sm text-muted-foreground">
									Artist Introductions
								</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Current Status Section */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{/* Currently On Stage */}
					<Card className="border-green-500 bg-green-50">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg text-green-700 flex items-center gap-2">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								Currently On Stage
							</CardTitle>
						</CardHeader>
						<CardContent>
							{showOrderItems.length > 0 &&
							showOrderItems[0]?.type === "artist" ? (
								<div className="flex items-center gap-4">
									<Avatar className="h-12 w-12">
										<AvatarFallback>
											{showOrderItems[0]
												.artist!.artistName.charAt(0)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<h3 className="font-semibold text-lg">
											{
												showOrderItems[0].artist!
													.artistName
											}
										</h3>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Badge variant="outline">
												{
													showOrderItems[0].artist!
														.style
												}
											</Badge>
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{
													showOrderItems[0].artist!
														.performanceDuration
												}{" "}
												min
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center text-muted-foreground">
									<Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p>No performance currently on stage</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Next Up */}
					<Card className="border-yellow-500 bg-yellow-50">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg text-yellow-700 flex items-center gap-2">
								<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
								Next Up
							</CardTitle>
						</CardHeader>
						<CardContent>
							{showOrderItems.length > 1 &&
							showOrderItems[1]?.type === "artist" ? (
								<div className="flex items-center gap-4">
									<Avatar className="h-12 w-12">
										<AvatarFallback>
											{showOrderItems[1]
												.artist!.artistName.charAt(0)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<h3 className="font-semibold text-lg">
											{
												showOrderItems[1].artist!
													.artistName
											}
										</h3>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Badge variant="outline">
												{
													showOrderItems[1].artist!
														.style
												}
											</Badge>
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{
													showOrderItems[1].artist!
														.performanceDuration
												}{" "}
												min
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center text-muted-foreground">
									<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p>No next performance scheduled</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Next on Deck */}
					<Card className="border-blue-500 bg-blue-50">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg text-blue-700 flex items-center gap-2">
								<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
								Next on Deck
							</CardTitle>
						</CardHeader>
						<CardContent>
							{showOrderItems.length > 2 &&
							showOrderItems[2]?.type === "artist" ? (
								<div className="flex items-center gap-4">
									<Avatar className="h-12 w-12">
										<AvatarFallback>
											{showOrderItems[2]
												.artist!.artistName.charAt(0)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<h3 className="font-semibold text-lg">
											{
												showOrderItems[2].artist!
													.artistName
											}
										</h3>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Badge variant="outline">
												{
													showOrderItems[2].artist!
														.style
												}
											</Badge>
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{
													showOrderItems[2].artist!
														.performanceDuration
												}{" "}
												min
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center text-muted-foreground">
									<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p>No artist on deck</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Performance Order Table */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mic className="h-5 w-5" />
							Performance Order & MC Notes
						</CardTitle>
						<CardDescription>
							Manage introductions and notes for each performance
						</CardDescription>
					</CardHeader>
					<CardContent>
						{showOrderItems.length === 0 ? (
							<div className="text-center py-8">
								<Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-500">
									No performances scheduled for this date
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
										<TableHead>Quality</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="min-w-[200px]">
											MC Notes
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{showOrderItems.map((item, index) => {
										const status = getItemStatus(
											item,
											index
										);
										return (
											<TableRow
												key={item.id}
												className={`${getRowColorClasses(
													status
												)} border-l-4`}
											>
												<TableCell className="font-medium">
													{item.performanceOrder}
												</TableCell>
												<TableCell>
													{item.type === "artist" &&
													item.artist ? (
														<div className="flex items-center gap-3">
															<Avatar className="h-8 w-8">
																<AvatarFallback>
																	{item.artist.artistName
																		.charAt(
																			0
																		)
																		.toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<div>
																<p className="font-medium">
																	{
																		item
																			.artist
																			.artistName
																	}
																</p>
																{item.artist
																	.realName && (
																	<p className="text-xs text-muted-foreground">
																		{
																			item
																				.artist
																				.realName
																		}
																	</p>
																)}
															</div>
														</div>
													) : (
														<span>Unknown</span>
													)}
												</TableCell>
												<TableCell>
													{item.type === "artist" &&
													item.artist ? (
														<Badge variant="outline">
															{item.artist.style}
														</Badge>
													) : (
														"-"
													)}
												</TableCell>
												<TableCell>
													{item.type === "artist" &&
													item.artist ? (
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{
																item.artist
																	.performanceDuration
															}{" "}
															min
														</span>
													) : (
														"-"
													)}
												</TableCell>
												<TableCell>
													{item.type === "artist" &&
													item.artist
														? getQualityBadge(
																item.artist
																	.qualityRating
														  )
														: "-"}
												</TableCell>
												<TableCell>
													{getStatusBadge(status)}
												</TableCell>
												<TableCell>
													<MCNotesCell
														item={item}
														onUpdate={updateMCNotes}
													/>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
