"use client";

import { useState, useEffect, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateSimple, formatDateForDropdown } from "@/lib/date-utils";

interface Artist {
	id: string;
	artist_name: string;
	real_name?: string | null;
	style: string;
	biography?: string | null;
	artist_notes?: string | null;
	actual_duration?: number;
	performance_order: number | null;
	rehearsal_completed: boolean;
	quality_rating: number | null;
	mc_notes?: string | null;
	phone?: string | null;
	email?: string | null;
	performance_status?: string | null;
	performance_date?: string | null;
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
	performance_order: number;
	notes?: string;
	is_completed?: boolean;
	mc_notes?: string | null;
	performance_date?: string | null;
}

interface ShowOrderItem {
	id: string;
	type: "artist" | "cue";
	artist?: Artist;
	cue?: Cue;
	performance_order: number;
	status?:
		| "not_started"
		| "next_on_deck"
		| "next_on_stage"
		| "currently_on_stage"
		| "completed";
}

interface EmergencyBroadcast {
	id: string;
	message: string;
	emergency_code: string;
	is_active: boolean;
	created_at: string;
}

interface Event {
	id: string;
	name: string;
	venue: string;
	show_dates: string[];
}

export default function MCDashboard() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [showOrderItems, setShowOrderItems] = useState<ShowOrderItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [eventDates, setEventDates] = useState<string[]>([]);
	const [selectedItem, setSelectedItem] = useState<ShowOrderItem | null>(
		null
	);
	const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<
		EmergencyBroadcast[]
	>([]);
	const [wsConnected, setWsConnected] = useState(false);

	// Initialize Socket.IO connection for emergency alerts
	useEffect(() => {
		const connectSocket = () => {
			try {
				// Load Socket.IO client and connect
				const script = document.createElement("script");
				script.src = "/socket.io/socket.io.js";
				let socket: any = null;

				script.onload = () => {
					// @ts-ignore - Socket.IO is loaded dynamically
					socket = io();

					socket.on("connect", () => {
						console.log("MC Dashboard Socket.IO connected");
						setWsConnected(true);

						// Authenticate as MC for this event
						socket.emit("authenticate", {
							userId: `mc_${eventId}`,
							role: "mc",
							eventId: eventId,
						});
					});

					socket.on("disconnect", () => {
						console.log("MC Dashboard Socket.IO disconnected");
						setWsConnected(false);
					});

					// Listen for emergency alerts
					socket.on("emergency-alert", (data: any) => {
						console.log("Emergency alert:", data);
						fetchEmergencyBroadcasts();
						toast({
							title: `${data.emergency_code.toUpperCase()} EMERGENCY ALERT`,
							description: data.message,
							variant: "destructive",
						});
					});

					socket.on("emergency-clear", (data: any) => {
						console.log("Emergency cleared:", data);
						fetchEmergencyBroadcasts();
						toast({
							title: "Emergency alert cleared",
							description:
								"Emergency broadcast has been deactivated",
						});
					});

					// Listen for performance status updates
					socket.on("artist_status_changed", (data: any) => {
						console.log("Artist status changed:", data);
						if (data.eventId === eventId) {
							// Update local state with real-time status change
							setShowOrderItems((prev) =>
								prev.map((item) =>
									item.id === data.id &&
									item.type === "artist"
										? {
												...item,
												status:
													data.performance_status ||
													item.status,
										  }
										: item
								)
							);
						}
					});

					socket.on("connect_error", (error: any) => {
						console.error("Socket.IO connection error:", error);
						setWsConnected(false);
					});
				};

				script.onerror = () => {
					console.error("Failed to load Socket.IO client");
					setWsConnected(false);
				};

				document.head.appendChild(script);
			} catch (error) {
				console.warn("MC Dashboard Socket.IO setup failed:", error);
				setWsConnected(false);
			}
		};

		connectSocket();
	}, [eventId]);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
			fetchEventDates();
			fetchEmergencyBroadcasts();
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
				const evt = data.data || data.event || data;
				setEvent({
					id: evt.id,
					name: evt.name || evt.eventName,
					venue: evt.venue,
					show_dates: evt.show_dates || evt.showDates || [],
				});
			}
		} catch (error) {
			console.error("Error fetching event data:", error);
		}
	};

	const fetchEventDates = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				const evt = data.data || data.event || data;
				const showDates = evt.show_dates || evt.showDates || [];

				if (showDates.length > 0) {
					// Use dates directly like other pages - no normalization needed
					console.log("Using event dates directly:", showDates);
					setEventDates(showDates);

					if (!selectedPerformanceDate && showDates.length > 0) {
						setSelectedPerformanceDate(showDates[0]);
						console.log(
							"Set default performance date:",
							showDates[0]
						);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching event dates:", error);
		}
	};

	const fetchPerformanceOrder = async () => {
		if (!selectedPerformanceDate) return;

		try {
			setLoading(true);

			// Fetch artists from GCS (same as performance order page)
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();

				if (data.success) {
					const artists = (data.data || []).map((artist: any) => {
						// Debug: Log the raw artist data to see what fields are available
						console.log("Raw artist data:", artist);

						return {
							id: artist.id,
							artist_name:
								artist.artistName || artist.artist_name,
							real_name: artist.realName || artist.real_name,
							style: artist.style,
							biography: artist.biography,
							artist_notes:
								artist.artist_notes || artist.artistNotes,
							actual_duration:
								artist.musicTracks?.find(
									(track: any) => track.is_main_track
								)?.duration || null,
							performance_order: artist.performance_order || null,
							rehearsal_completed:
								artist.rehearsal_completed || false,
							quality_rating: artist.quality_rating || null,
							mc_notes: artist.mc_notes,
							phone: artist.phone,
							email: artist.email,
							performance_status:
								artist.performance_status || null,
							performance_date:
								artist.performanceDate ||
								artist.performance_date,
						};
					});

					// Filter artists for the selected performance date
					const filteredArtists = artists.filter((a: Artist) => {
						if (!a.performance_date) return false;

						// Normalize both dates for comparison
						let artistDate: string;
						const performanceDate = a.performance_date;

						if (performanceDate.includes("T")) {
							artistDate = performanceDate.split("T")[0];
						} else {
							artistDate = performanceDate;
						}

						// Normalize selectedPerformanceDate for comparison
						let normalizedSelectedDate = selectedPerformanceDate;
						if (selectedPerformanceDate.includes("T")) {
							normalizedSelectedDate =
								selectedPerformanceDate.split("T")[0];
						}

						return artistDate === normalizedSelectedDate;
					});

					// Artists assigned to show order
					const assignedArtists = filteredArtists
						.filter(
							(a: Artist) =>
								a.performance_order !== null ||
								(a.performance_status &&
									a.performance_status !== "not_started" &&
									a.rehearsal_completed)
						)
						.map((artist: Artist) => ({
							id: artist.id,
							type: "artist" as const,
							artist,
							performance_order: artist.performance_order || 0,
							status: (artist.performance_status ||
								"not_started") as ShowOrderItem["status"],
						}));

					// Fetch cues from GCS
					let cueItems: ShowOrderItem[] = [];
					try {
						const cuesResponse = await fetch(
							`/api/events/${eventId}/cues?performanceDate=${selectedPerformanceDate}`
						);
						if (cuesResponse.ok) {
							const cuesResult = await cuesResponse.json();
							if (cuesResult.success) {
								cueItems = cuesResult.data.map((cue: any) => ({
									id: cue.id,
									type: "cue" as const,
									cue: {
										...cue,
										mc_notes: cue.mc_notes,
									},
									performance_order: cue.performance_order,
									status: (cue.performance_status ||
										(cue.is_completed
											? "completed"
											: "not_started")) as ShowOrderItem["status"],
								}));
							}
						}
					} catch (cueError) {
						console.error("Error fetching cues:", cueError);
					}

					// Combine and sort all show order items
					const allShowOrderItems = [
						...assignedArtists,
						...cueItems,
					].sort((a, b) => a.performance_order - b.performance_order);

					setShowOrderItems(allShowOrderItems);
				}
			}
		} catch (error) {
			console.error("Error fetching performance order:", error);
			toast({
				title: "Error loading data",
				description: "Failed to load performance order",
				variant: "destructive",
			});
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
				// Update artist MC notes via API
				const response = await fetch(
					`/api/events/${eventId}/artists/${itemId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							mc_notes: notes,
						}),
					}
				);

				if (response.ok) {
					// Update local state
					setShowOrderItems((prev) =>
						prev.map((item) =>
							item.id === itemId && item.type === "artist"
								? {
										...item,
										artist: {
											...item.artist!,
											mc_notes: notes,
										},
								  }
								: item
						)
					);

					toast({
						title: "MC Notes updated",
						description:
							"Artist notes have been saved successfully",
					});
				} else {
					throw new Error("Failed to update artist MC notes");
				}
			} else {
				// Update cue MC notes via API
				const response = await fetch(`/api/events/${eventId}/cues`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						id: itemId,
						mc_notes: notes,
						performanceDate: selectedPerformanceDate,
					}),
				});

				if (response.ok) {
					// Update local state
					setShowOrderItems((prev) =>
						prev.map((item) =>
							item.id === itemId && item.type === "cue"
								? {
										...item,
										cue: { ...item.cue!, mc_notes: notes },
								  }
								: item
						)
					);

					toast({
						title: "MC Notes updated",
						description: "Cue notes have been saved successfully",
					});
				} else {
					throw new Error("Failed to update cue MC notes");
				}
			}
		} catch (error) {
			console.error("Error updating MC notes:", error);
			toast({
				title: "Error updating notes",
				description: "Failed to save MC notes",
				variant: "destructive",
			});
		}
	};

	const getItemStatus = (item: ShowOrderItem, index: number) => {
		if (item.status) return item.status;
		if (item.type === "cue" && item.cue?.is_completed) {
			return "completed";
		}
		if (index === 0) return "currently_on_stage";
		if (index === 1) return "next_on_stage";
		if (index === 2) return "next_on_deck";
		return "not_started";
	};

	const getRowColorClasses = (status: string) => {
		switch (status) {
			case "completed":
				return "border-red-300 text-red-900 shadow-sm border-2";
			case "currently_on_stage":
				return "border-green-300 text-green-900 shadow-sm border-2";
			case "next_on_stage":
				return "border-yellow-300 text-yellow-900 shadow-sm border-2";
			case "next_on_deck":
				return "border-blue-300 text-blue-900 shadow-sm border-2";
			default:
				return "border-gray-300 text-gray-900 shadow-sm border-2";
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return (
					<Badge className="bg-red-500 text-white hover:bg-red-500 cursor-default">
						Completed
					</Badge>
				);
			case "currently_on_stage":
				return (
					<Badge className="bg-green-500 text-white hover:bg-green-500 cursor-default">
						Currently On Stage
					</Badge>
				);
			case "next_on_stage":
				return (
					<Badge className="bg-yellow-500 text-white hover:bg-yellow-500 cursor-default">
						Next On Stage
					</Badge>
				);
			case "next_on_deck":
				return (
					<Badge className="bg-blue-500 text-white hover:bg-blue-500 cursor-default">
						Next On Deck
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="cursor-default">
						Not Started
					</Badge>
				);
		}
	};

	// Emergency broadcast functions
	const fetchEmergencyBroadcasts = async () => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/emergency-broadcasts`
			);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setEmergencyBroadcasts(data.data || []);
				}
			}
		} catch (error) {
			console.error("Error fetching emergency broadcasts:", error);
		}
	};

	const getEmergencyColor = (code: string) => {
		switch (code) {
			case "red":
				return "bg-red-500 text-white";
			case "blue":
				return "bg-blue-500 text-white";
			case "green":
				return "bg-green-500 text-white";
			default:
				return "bg-gray-500 text-white";
		}
	};

	const getQualityBadge = (rating: number | null) => {
		if (!rating) return null;

		const colors = {
			1: "text-green-500",
			2: "text-yellow-500",
			3: "text-blue-500",
		};

		return (
			<div className="flex items-center gap-1">
				{Array.from({ length: rating }, (_, i) => (
					<Star
						key={i}
						className={`h-3 w-3 fill-current ${
							colors[rating as keyof typeof colors]
						}`}
					/>
				))}
			</div>
		);
	};

	const getCueIcon = (cueType: Cue["type"]) => {
		const iconMap = {
			mc_break: Mic,
			video_break: Video,
			cleaning_break: Trash2,
			speech_break: Speaker,
			opening: Play,
			countdown: Timer,
			artist_ending: CheckCircle,
			animation: Sparkles,
		};
		return iconMap[cueType];
	};

	// Helper function to format duration from seconds to minutes:seconds
	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "N/A";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Helper function to get display duration (prefer actual_duration over performance_duration)
	const getDisplayDuration = (artist: Artist) => {
		if ((artist as any).actual_duration) {
			return formatDuration((artist as any).actual_duration);
		}
		return `${artist.performance_date} min`;
	};

	const getDefaultIntroduction = (item: ShowOrderItem) => {
		if (item.type === "artist" && item.artist) {
			const durationText = item.artist.actual_duration
				? `${formatDuration(item.artist.actual_duration)} of`
				: "";
			return `Ladies and gentlemen, please welcome to the stage ${item.artist.artist_name}! ${item.artist.artist_name} is a talented ${item.artist.style} performer who brings ${durationText} incredible entertainment. Let's give them a warm welcome!`;
		} else if (item.type === "cue" && item.cue) {
			return `Ladies and gentlemen, we now have a ${item.cue.title.toLowerCase()} for ${
				item.cue.duration
			} minutes. Please enjoy this brief intermission.`;
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
				? item.artist?.mc_notes
				: item.cue?.mc_notes) || ""
		);

		const handleSave = () => {
			onUpdate(item.id, notes, item.type);
			setIsEditing(false);
		};

		const handleCancel = () => {
			setNotes(
				(item.type === "artist"
					? item.artist?.mc_notes
					: item.cue?.mc_notes) || ""
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
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading MC dashboard...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center gap-4 mb-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(`/stage-manager/events/${eventId}`)
							}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					</div>
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-2xl font-bold text-foreground">
								MC Dashboard
							</h1>
							<p className="text-muted-foreground">
								{event?.name} - {event?.venue}
							</p>
							<div className="flex items-center gap-2 mt-1">
								<div
									className={`w-2 h-2 rounded-full ${
										wsConnected
											? "bg-green-500"
											: "bg-red-500"
									}`}
								></div>
								<span className="text-xs text-muted-foreground">
									{wsConnected
										? "Live updates active"
										: "Connecting..."}
								</span>
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
													{formatDateSimple(date)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<Button
								onClick={fetchPerformanceOrder}
								variant="outline"
								size="sm"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh
							</Button>
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

			{/* Emergency Broadcasts */}
			{emergencyBroadcasts.length > 0 && (
				<div className="border-b border-border">
					{emergencyBroadcasts.map((broadcast) => (
						<div
							key={broadcast.id}
							className={`p-4 ${getEmergencyColor(
								broadcast.emergency_code
							)}`}
						>
							<div className="container mx-auto flex justify-between items-center">
								<div className="flex items-center gap-3">
									<AlertTriangle className="h-5 w-5" />
									<div>
										<span className="font-bold">
											{broadcast.emergency_code.toUpperCase()}{" "}
											ALERT:
										</span>
										<span className="ml-2">
											{broadcast.message}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Current Status Section */}
			<div className="border-b border-border bg-muted/30">
				<div className="container mx-auto px-4 py-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Currently On Stage */}
						<Card className="border-green-500 bg-green-500">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg text-white flex items-center gap-2">
									<div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
									Currently On Stage
								</CardTitle>
							</CardHeader>
							<CardContent className="text-white">
								{showOrderItems.length > 0 &&
								showOrderItems[0]?.type === "artist" ? (
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												{showOrderItems[0]
													.artist!.artist_name.charAt(
														0
													)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<h3 className="font-semibold text-lg">
												{
													showOrderItems[0].artist!
														.artist_name
												}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[0]
															.artist!.style
													}
												</Badge>
												{showOrderItems[0].artist!
													.actual_duration && (
													<span className="text-white/80 ml-1 flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{formatDuration(
															showOrderItems[0]
																.artist!
																.actual_duration
														)}
													</span>
												)}
											</div>
										</div>
									</div>
								) : showOrderItems.length > 0 &&
								  showOrderItems[0]?.type === "cue" ? (
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
											{(() => {
												const IconComponent =
													getCueIcon(
														showOrderItems[0].cue!
															.type
													);
												return (
													<IconComponent className="h-6 w-6 text-muted-foreground" />
												);
											})()}
										</div>
										<div>
											<h3 className="font-semibold text-lg">
												{showOrderItems[0].cue!.title}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[0].cue!
															.type
													}
												</Badge>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{showOrderItems[0].cue!
														.duration || 5}{" "}
													min
												</span>
											</div>
										</div>
									</div>
								) : (
									<div className="text-center text-white/80">
										<Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p>No performance currently on stage</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Next Up */}
						<Card className="border-yellow-500 bg-yellow-500">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg text-white flex items-center gap-2">
									<div className="w-3 h-3 bg-white rounded-full"></div>
									Next Up
								</CardTitle>
							</CardHeader>
							<CardContent className="text-white">
								{showOrderItems.length > 1 &&
								showOrderItems[1]?.type === "artist" ? (
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												{showOrderItems[1]
													.artist!.artist_name.charAt(
														0
													)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<h3 className="font-semibold text-lg">
												{
													showOrderItems[1].artist!
														.artist_name
												}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[1]
															.artist!.style
													}
												</Badge>
												{showOrderItems[1].artist!
													.actual_duration && (
													<span className="text-white/80 ml-1 flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{formatDuration(
															showOrderItems[1]
																.artist!
																.actual_duration
														)}
													</span>
												)}
											</div>
										</div>
									</div>
								) : showOrderItems.length > 1 &&
								  showOrderItems[1]?.type === "cue" ? (
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
											{(() => {
												const IconComponent =
													getCueIcon(
														showOrderItems[1].cue!
															.type
													);
												return (
													<IconComponent className="h-6 w-6 text-muted-foreground" />
												);
											})()}
										</div>
										<div>
											<h3 className="font-semibold text-lg">
												{showOrderItems[1].cue!.title}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[1].cue!
															.type
													}
												</Badge>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{showOrderItems[1].cue!
														.duration || 5}{" "}
													min
												</span>
											</div>
										</div>
									</div>
								) : showOrderItems.length === 1 ? (
									<div className="text-center text-white/80">
										<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p>Last item in performance order</p>
									</div>
								) : (
									<div className="text-center text-white/80">
										<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p>No next performance scheduled</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Next on Deck */}
						<Card className="border-blue-500 bg-blue-500">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg text-white flex items-center gap-2">
									<div className="w-3 h-3 bg-white rounded-full"></div>
									Next on Deck
								</CardTitle>
							</CardHeader>
							<CardContent className="text-white">
								{showOrderItems.length > 2 &&
								showOrderItems[2]?.type === "artist" ? (
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												{showOrderItems[2]
													.artist!.artist_name.charAt(
														0
													)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<h3 className="font-semibold text-lg">
												{
													showOrderItems[2].artist!
														.artist_name
												}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[2]
															.artist!.style
													}
												</Badge>
												{showOrderItems[2].artist!
													.actual_duration && (
													<span className="text-white/80 ml-1 flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{formatDuration(
															showOrderItems[2]
																.artist!
																.actual_duration
														)}
													</span>
												)}
											</div>
										</div>
									</div>
								) : showOrderItems.length > 2 &&
								  showOrderItems[2]?.type === "cue" ? (
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
											{(() => {
												const IconComponent =
													getCueIcon(
														showOrderItems[2].cue!
															.type
													);
												return (
													<IconComponent className="h-6 w-6 text-muted-foreground" />
												);
											})()}
										</div>
										<div>
											<h3 className="font-semibold text-lg">
												{showOrderItems[2].cue!.title}
											</h3>
											<div className="flex items-center gap-2 text-sm text-white/80">
												<Badge
													variant="outline"
													className="bg-white/20 text-white border-white/30"
												>
													{
														showOrderItems[2].cue!
															.type
													}
												</Badge>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{showOrderItems[2].cue!
														.duration || 5}{" "}
													min
												</span>
											</div>
										</div>
									</div>
								) : showOrderItems.length <= 2 ? (
									<div className="text-center text-white/80">
										<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p>No upcoming performances</p>
									</div>
								) : (
									<div className="text-center text-white/80">
										<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p>No performance on deck</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<main className="container mx-auto px-4 py-8">
				<div className="space-y-6">
					{/* Performance Schedule */}
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold">
							Performance Schedule
						</h2>
						{selectedPerformanceDate && (
							<Badge
								variant="outline"
								className="flex items-center gap-1"
							>
								<Calendar className="h-3 w-3" />
								{formatDateForDropdown(selectedPerformanceDate)}
							</Badge>
						)}
					</div>

					{/* Performance Order List */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mic className="h-5 w-5" />
								MC Introduction Schedule
							</CardTitle>
						</CardHeader>
						<CardContent>
							{(() => {
								// Filter performance items by selected date
								const filteredItems = showOrderItems.filter(
									(item) => {
										if (!selectedPerformanceDate)
											return true;

										if (item.type === "artist") {
											const performanceDate =
												item.artist?.performance_date;
											if (!performanceDate) return false;

											// Normalize both dates for comparison
											let artistDate: string;
											if (performanceDate.includes("T")) {
												artistDate =
													performanceDate.split(
														"T"
													)[0];
											} else {
												artistDate = performanceDate;
											}

											let normalizedSelectedDate =
												selectedPerformanceDate;
											if (
												selectedPerformanceDate.includes(
													"T"
												)
											) {
												normalizedSelectedDate =
													selectedPerformanceDate.split(
														"T"
													)[0];
											}

											return (
												artistDate ===
												normalizedSelectedDate
											);
										}

										if (item.type === "cue") {
											// Cues are already filtered by performance date in the API call
											return true;
										}

										return true;
									}
								);

								if (filteredItems.length === 0) {
									return (
										<div className="text-center py-12">
											<Mic className="h-16 w-16 mx-auto mb-4 opacity-50" />
											<h3 className="text-lg font-medium mb-2">
												No performances scheduled
											</h3>
											<p className="text-muted-foreground">
												No performances found for the
												selected date
											</p>
										</div>
									);
								}

								return (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-16">
													#
												</TableHead>
												<TableHead>
													Performer/Cue
												</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Duration</TableHead>
												<TableHead>Biography</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="w-32">
													Action
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredItems.map(
												(item, index) => {
													const status =
														getItemStatus(
															item,
															index
														);
													const rowClasses =
														getRowColorClasses(
															status
														);

													return (
														<TableRow
															key={item.id}
															className={
																rowClasses
															}
														>
															<TableCell className="font-medium">
																{index + 1}
															</TableCell>
															<TableCell>
																{item.type ===
																	"artist" &&
																item.artist ? (
																	<div className="flex items-center gap-3">
																		<Avatar className="h-8 w-8">
																			<AvatarFallback>
																				{item.artist.artist_name
																					.charAt(
																						0
																					)
																					.toUpperCase()}
																			</AvatarFallback>
																		</Avatar>
																		<div>
																			<div className="font-medium">
																				{
																					item
																						.artist
																						.artist_name
																				}
																			</div>
																			{item
																				.artist
																				.real_name && (
																				<div className="text-sm text-muted-foreground">
																					{
																						item
																							.artist
																							.real_name
																					}
																				</div>
																			)}
																		</div>
																	</div>
																) : (
																	item.type ===
																		"cue" &&
																	item.cue && (
																		<div className="flex items-center gap-3">
																			{(() => {
																				const IconComponent =
																					getCueIcon(
																						item.cue!
																							.type
																					);
																				return (
																					<IconComponent className="h-5 w-5" />
																				);
																			})()}
																			<div>
																				<div className="font-medium">
																					{
																						item
																							.cue
																							.title
																					}
																				</div>
																				<div className="text-sm text-muted-foreground">
																					{item.cue.type.replace(
																						"_",
																						" "
																					)}
																				</div>
																			</div>
																		</div>
																	)
																)}
															</TableCell>
															<TableCell>
																{item.type ===
																	"artist" &&
																item.artist ? (
																	<Badge variant="outline">
																		{
																			item
																				.artist
																				.style
																		}
																	</Badge>
																) : (
																	item.type ===
																		"cue" &&
																	item.cue && (
																		<Badge variant="secondary">
																			{item.cue.type.replace(
																				"_",
																				" "
																			)}
																		</Badge>
																	)
																)}
															</TableCell>
															<TableCell>
																{item.type ===
																"artist" ? (
																	<span className="flex items-center gap-1">
																		<Clock className="h-3 w-3" />
																		{item
																			.artist
																			?.actual_duration
																			? formatDuration(
																					item
																						.artist
																						.actual_duration
																			  )
																			: "Duration TBD"}
																	</span>
																) : item.type ===
																  "cue" ? (
																	<span className="flex items-center gap-1">
																		<Clock className="h-3 w-3" />
																		{item
																			.cue
																			?.duration ||
																			5}{" "}
																		min
																	</span>
																) : (
																	<span className="text-muted-foreground text-sm">
																		No
																		duration
																	</span>
																)}
															</TableCell>
															<TableCell className="max-w-[200px]">
																{item.type ===
																	"artist" &&
																item.artist ? (
																	<div className="text-sm">
																		{item
																			.artist
																			.biography ||
																			`${item.artist.artist_name} is a talented ${item.artist.style} performer.`}
																	</div>
																) : (
																	item.type ===
																		"cue" &&
																	item.cue && (
																		<div className="text-sm text-muted-foreground">
																			{item
																				.cue
																				.notes ||
																				"Performance cue"}
																		</div>
																	)
																)}
															</TableCell>
															<TableCell>
																{getStatusBadge(
																	status
																)}
															</TableCell>
															<TableCell>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		setSelectedItem(
																			item
																		)
																	}
																>
																	Select
																</Button>
															</TableCell>
														</TableRow>
													);
												}
											)}
										</TableBody>
									</Table>
								);
							})()}
						</CardContent>
					</Card>

					{/* Selected Performance Item Details */}
					{selectedItem && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Edit3 className="h-5 w-5" />
									Selected Performance Item
								</CardTitle>
								<CardDescription>
									Edit MC notes and introduction details
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{/* Item Details */}
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semibold mb-2">
												{selectedItem.type === "artist"
													? selectedItem.artist
															?.artist_name
													: selectedItem.cue?.title}
											</h3>
											{selectedItem.type === "artist" &&
												selectedItem.artist && (
													<div className="space-y-3">
														<div className="flex items-center gap-2">
															<Badge variant="outline">
																{
																	selectedItem
																		.artist
																		.style
																}
															</Badge>
															{selectedItem.artist
																.actual_duration && (
																<span className="text-sm text-muted-foreground flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{formatDuration(
																		selectedItem
																			.artist
																			.actual_duration
																	)}
																</span>
															)}
															{getQualityBadge(
																selectedItem
																	.artist
																	.quality_rating
															)}
														</div>
														{selectedItem.artist
															.biography && (
															<div>
																<Label className="text-sm font-medium">
																	Biography
																</Label>
																<p className="text-sm text-muted-foreground mt-1">
																	{
																		selectedItem
																			.artist
																			.biography
																	}
																</p>
															</div>
														)}
													</div>
												)}
										</div>

										{/* MC Notes Section */}
										<div className="space-y-3">
											<Label className="text-sm font-medium">
												MC Introduction Notes
											</Label>
											<MCNotesCell
												item={selectedItem}
												onUpdate={updateMCNotes}
											/>
										</div>

										{/* Default Introduction Preview */}
										<div className="space-y-3">
											<Label className="text-sm font-medium">
												Suggested Introduction
											</Label>
											<div className="p-4 bg-muted rounded-lg">
												<p className="text-sm">
													{getDefaultIntroduction(
														selectedItem
													)}
												</p>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		</div>
	);
}
