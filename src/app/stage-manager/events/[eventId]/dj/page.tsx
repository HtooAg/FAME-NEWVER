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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Music,
	Play,
	Pause,
	Clock,
	ArrowLeft,
	Upload,
	Edit3,
	Users,
	Calendar,
	Star,
	CheckCircle,
	Headphones,
	Edit,
	Timer,
	Mic,
	Video,
	Trash2,
	Speaker,
	Sparkles,
	AlertTriangle,
	RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateSimple, formatDateForDropdown } from "@/lib/date-utils";

interface Artist {
	id: string;
	artist_name: string;
	style: string;
	performance_duration: number;
	quality_rating: number | null;
	performance_order: number | null;
	rehearsal_completed: boolean;
	performance_status?: string | null;
	performance_date?: string | null;
	actual_duration?: number;
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
	start_time?: string;
	end_time?: string;
	is_completed?: boolean;
	completed_at?: string;
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

interface MusicTrack {
	id: string;
	artist_id: string;
	song_title: string;
	duration: number;
	file_url: string | null;
	is_main_track: boolean;
	tempo: string | null;
	notes: string | null;
	dj_notes?: string | null;
}

interface Event {
	id: string;
	name: string;
	venue: string;
	show_dates: string[];
}

export default function DJDashboard() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;
	const wsRef = useRef<WebSocket | null>(null);

	const [event, setEvent] = useState<Event | null>(null);
	const [showOrderItems, setShowOrderItems] = useState<ShowOrderItem[]>([]);
	const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
	const [currentTrack, setCurrentTrack] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [eventDates, setEventDates] = useState<string[]>([]);
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
				script.onload = () => {
					// @ts-ignore - Socket.IO is loaded dynamically
					const socket = io();

					socket.on("connect", () => {
						console.log("DJ Dashboard Socket.IO connected");
						setWsConnected(true);

						// Authenticate as DJ for this event
						socket.emit("authenticate", {
							userId: `dj_${eventId}`,
							role: "dj",
							eventId: eventId,
						});
					});

					socket.on("disconnect", () => {
						console.log("DJ Dashboard Socket.IO disconnected");
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

					// Store socket reference for cleanup
					wsRef.current = socket as any;
				};

				script.onerror = () => {
					console.error("Failed to load Socket.IO client");
					setWsConnected(false);
				};

				document.head.appendChild(script);
			} catch (error) {
				console.warn("DJ Dashboard Socket.IO setup failed:", error);
				setWsConnected(false);
			}
		};

		connectSocket();

		return () => {
			if (wsRef.current) {
				(wsRef.current as any).disconnect();
			}
		};
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

				console.log("=== DJ EVENT DATE DEBUG ===");
				console.log("Raw event show dates:", showDates);

				if (showDates.length > 0) {
					// Use dates directly like rehearsal page - no normalization needed
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
					const artists = (data.data || []).map((artist: any) => ({
						id: artist.id,
						artist_name: artist.artistName || artist.artist_name,
						style: artist.style,
						performance_duration:
							artist.performanceDuration ||
							artist.performance_duration ||
							5,
						quality_rating: artist.quality_rating || null,
						performance_order: artist.performance_order || null,
						rehearsal_completed:
							artist.rehearsal_completed || false,
						performance_status: artist.performance_status || null,
						performance_date:
							artist.performanceDate || artist.performance_date,
						actual_duration:
							artist.musicTracks?.find(
								(track: any) => track.is_main_track
							)?.duration || null,
					}));

					// Filter artists for the selected performance date
					const filteredArtists = artists.filter((a: Artist) => {
						// Check both performance_date and performanceDate fields for compatibility
						const performanceDate =
							a.performance_date || (a as any).performanceDate;

						if (!performanceDate) {
							console.log(
								`Artist ${a.artist_name} has no performance date, skipping`
							);
							return false; // Only show artists with performance dates
						}

						// Normalize both dates to YYYY-MM-DD format for comparison
						let artistDate: string;
						try {
							// Handle different date formats
							if (typeof performanceDate === "string") {
								if (performanceDate.includes("T")) {
									// ISO format: 2025-09-16T00:00:00.000Z
									// Extract date part only
									artistDate = performanceDate.split("T")[0];
								} else if (
									performanceDate.includes("-") &&
									performanceDate.length === 10
								) {
									// Already in YYYY-MM-DD format
									artistDate = performanceDate;
								} else {
									// Try to parse as date and format as YYYY-MM-DD
									const parsedDate = new Date(
										performanceDate
									);
									const year = parsedDate.getFullYear();
									const month = String(
										parsedDate.getMonth() + 1
									).padStart(2, "0");
									const day = String(
										parsedDate.getDate()
									).padStart(2, "0");
									artistDate = `${year}-${month}-${day}`;
								}
							} else {
								// Handle Date object
								const dateObj = new Date(performanceDate);
								const year = dateObj.getFullYear();
								const month = String(
									dateObj.getMonth() + 1
								).padStart(2, "0");
								const day = String(dateObj.getDate()).padStart(
									2,
									"0"
								);
								artistDate = `${year}-${month}-${day}`;
							}
						} catch (error) {
							console.error(
								`Error parsing performance_date for artist ${a.id}:`,
								performanceDate,
								error
							);
							return false;
						}

						// Normalize selectedPerformanceDate for comparison
						let normalizedSelectedDate = selectedPerformanceDate;
						if (selectedPerformanceDate.includes("T")) {
							normalizedSelectedDate =
								selectedPerformanceDate.split("T")[0];
						}

						console.log(
							`DJ Filtering artist ${a.artist_name}: artistDate=${artistDate}, selectedDate=${selectedPerformanceDate}, normalizedSelectedDate=${normalizedSelectedDate}, rawDate=${performanceDate}`
						);
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
									cue,
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

					// Fetch music tracks for all artists
					const artistIds = filteredArtists.map(
						(artist: Artist) => artist.id
					);
					if (artistIds.length > 0) {
						await fetchMusicTracks(artistIds);
					}

					console.log("=== DJ DASHBOARD DEBUG ===");
					console.log(
						`Selected performance date: ${selectedPerformanceDate}`
					);
					console.log(`Total artists from API: ${artists.length}`);
					console.log(
						`Filtered artists for date: ${filteredArtists.length}`
					);
					console.log(
						`Show order items: ${allShowOrderItems.length}`
					);
					console.log("=== END DEBUG ===");
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

	const fetchMusicTracks = async (artistIds: string[]) => {
		try {
			// This would need to be implemented in your API
			// For now, we'll use mock data
			const mockTracks: MusicTrack[] = [];
			setMusicTracks(mockTracks);
		} catch (error) {
			console.error("Error fetching music tracks:", error);
		}
	};

	const playTrack = (trackId: string) => {
		setCurrentTrack(trackId);
		setIsPlaying(true);
		toast({
			title: "Playing track",
			description: "Audio playback would start here",
		});
	};

	const pauseTrack = () => {
		setIsPlaying(false);
		toast({
			title: "Track paused",
			description: "Audio playback paused",
		});
	};

	const getArtistTracks = (artistId: string) => {
		return musicTracks.filter((track) => track.artist_id === artistId);
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
		if (artist.actual_duration) {
			return formatDuration(artist.actual_duration);
		}
		return `${artist.performance_duration} min`;
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

	const getRowColorClasses = (status?: string | null) => {
		switch (status) {
			case "completed":
				return "bg-white border-red-300 text-red-900 shadow-md border-2";
			case "currently_on_stage":
				return "bg-white border-green-300 text-green-900 shadow-md border-2";
			case "next_on_stage":
				return "bg-white border-yellow-300 text-yellow-900 shadow-md border-2";
			case "next_on_deck":
				return "bg-white border-blue-300 text-blue-900 shadow-md border-2";
			default:
				return "bg-white border-gray-300 text-gray-900 shadow-md border-2";
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

	const MusicEditDialog = ({
		artistId,
		tracks,
	}: {
		artistId: string;
		tracks: MusicTrack[];
	}) => {
		const [newTrackTitle, setNewTrackTitle] = useState("");
		const [selectedFile, setSelectedFile] = useState<File | null>(null);

		// return (
		// 	<Dialog>
		// 		<DialogTrigger asChild>
		// 			<Button variant="outline" size="sm">
		// 				<Edit className="h-4 w-4 mr-1" />
		// 				Edit Music
		// 			</Button>
		// 		</DialogTrigger>
		// 		<DialogContent className="max-w-2xl">
		// 			<DialogHeader>
		// 				<DialogTitle>Edit Music Tracks</DialogTitle>
		// 				<DialogDescription>
		// 					Upload new tracks or edit existing ones
		// 				</DialogDescription>
		// 			</DialogHeader>
		// 			<div className="space-y-4">
		// 				{/* Upload new track */}
		// 				<div className="border rounded-lg p-4">
		// 					<h4 className="font-medium mb-3">
		// 						Upload New Track
		// 					</h4>
		// 					<div className="space-y-3">
		// 						<div>
		// 							<Label htmlFor="track-title">
		// 								Track Title
		// 							</Label>
		// 							<Input
		// 								id="track-title"
		// 								value={newTrackTitle}
		// 								onChange={(e) =>
		// 									setNewTrackTitle(e.target.value)
		// 								}
		// 								placeholder="Enter track title"
		// 							/>
		// 						</div>
		// 						<div>
		// 							<Label htmlFor="track-file">
		// 								Audio File
		// 							</Label>
		// 							<Input
		// 								id="track-file"
		// 								type="file"
		// 								accept="audio/*"
		// 								onChange={(e) =>
		// 									setSelectedFile(
		// 										e.target.files?.[0] || null
		// 									)
		// 								}
		// 							/>
		// 						</div>
		// 						<Button
		// 							onClick={() => {
		// 								if (selectedFile && newTrackTitle) {
		// 									// uploadNewTrack would be implemented here
		// 									toast({
		// 										title: "Track uploaded",
		// 										description:
		// 											"Track uploaded successfully",
		// 									});
		// 									setNewTrackTitle("");
		// 									setSelectedFile(null);
		// 								}
		// 							}}
		// 							disabled={!selectedFile || !newTrackTitle}
		// 						>
		// 							<Upload className="h-4 w-4 mr-1" />
		// 							Upload Track
		// 						</Button>
		// 					</div>
		// 				</div>

		// 				{/* Existing tracks */}
		// 				<div className="space-y-3">
		// 					<h4 className="font-medium">Existing Tracks</h4>
		// 					{tracks.length === 0 ? (
		// 						<p className="text-muted-foreground text-center py-4">
		// 							No tracks available
		// 						</p>
		// 					) : (
		// 						tracks.map((track) => (
		// 							<div
		// 								key={track.id}
		// 								className="border rounded-lg p-3"
		// 							>
		// 								<div className="flex items-center justify-between mb-2">
		// 									<h5 className="font-medium">
		// 										{track.song_title}
		// 									</h5>
		// 									<Badge
		// 										variant={
		// 											track.is_main_track
		// 												? "default"
		// 												: "outline"
		// 										}
		// 									>
		// 										{track.is_main_track
		// 											? "Main"
		// 											: "Additional"}
		// 									</Badge>
		// 								</div>
		// 								<div className="grid grid-cols-2 gap-2">
		// 									<div>
		// 										<Label>Tempo</Label>
		// 										<Input
		// 											value={track.tempo || ""}
		// 											placeholder="e.g., 120 BPM"
		// 											readOnly
		// 										/>
		// 									</div>
		// 									<div>
		// 										<Label>
		// 											Duration (seconds)
		// 										</Label>
		// 										<Input
		// 											type="number"
		// 											value={track.duration}
		// 											readOnly
		// 										/>
		// 									</div>
		// 								</div>
		// 								<div className="mt-2">
		// 									<Label>DJ Notes</Label>
		// 									<Input
		// 										value={track.notes || ""}
		// 										placeholder="DJ notes or cues"
		// 										readOnly
		// 									/>
		// 								</div>
		// 							</div>
		// 						))
		// 					)}
		// 				</div>
		// 			</div>
		// 		</DialogContent>
		// 	</Dialog>
		// );
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading DJ dashboard...
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
								DJ Dashboard
							</h1>
							<p className="text-muted-foreground">
								{event?.name}
							</p>
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
								<div
									className={`w-2 h-2 rounded-full ${
										wsConnected
											? "bg-green-500"
											: "bg-red-500"
									}`}
								></div>
								<span className="text-sm text-muted-foreground">
									{wsConnected
										? "Live Performance Control"
										: "Connecting..."}
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

			<main className="container mx-auto px-4 py-6">
				<div className="mb-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							Performance Order
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
					<div className="space-y-4">
						{(() => {
							// Filter performance items by selected date
							const filteredItems = showOrderItems.filter(
								(item) => {
									if (!selectedPerformanceDate) return true;

									if (item.type === "artist") {
										const performanceDate =
											item.artist?.performance_date;
										if (!performanceDate) return false;
										const artistDate = new Date(
											performanceDate
										)
											.toISOString()
											.split("T")[0];
										const filterDate = new Date(
											selectedPerformanceDate
										)
											.toISOString()
											.split("T")[0];
										return artistDate === filterDate;
									}

									if (item.type === "cue") {
										// Cues are already filtered by performance date in the API call
										return true;
									}

									return true;
								}
							);

							return filteredItems.length === 0 ? (
								<Card className="p-6">
									<div className="text-center">
										<Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<h3 className="text-lg font-semibold mb-2">
											{selectedPerformanceDate
												? "No Performances Scheduled"
												: "No Performance Order Set"}
										</h3>
										<p className="text-muted-foreground">
											{selectedPerformanceDate
												? `No performances are scheduled for ${formatDateSimple(
														selectedPerformanceDate
												  )}.`
												: "The Stage Manager hasn't set up the performance order yet."}
										</p>
									</div>
								</Card>
							) : (
								filteredItems.map((item, index) => (
									<Card
										key={item.id}
										className={`transition-all duration-200 ${getRowColorClasses(
											item.status
										)}`}
									>
										<CardContent className="p-6">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
														{index + 1}
													</div>
													{item.type === "artist" &&
														item.artist && (
															<div>
																<h3 className="text-lg font-semibold">
																	{
																		item
																			.artist
																			.artist_name
																	}
																</h3>
																<div className="flex items-center gap-2 mt-1">
																	<Badge variant="outline">
																		{
																			item
																				.artist
																				.style
																		}
																	</Badge>
																	<span className="text-sm text-muted-foreground flex items-center gap-1">
																		<Clock className="h-3 w-3" />
																		{getDisplayDuration(
																			item.artist
																		)}
																	</span>
																	{item.artist
																		.rehearsal_completed && (
																		<Badge
																			variant="secondary"
																			className="flex items-center gap-1"
																		>
																			<CheckCircle className="h-3 w-3" />
																			Rehearsed
																		</Badge>
																	)}
																	{getQualityBadge(
																		item
																			.artist
																			.quality_rating
																	)}
																</div>
															</div>
														)}
													{item.type === "cue" &&
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
																	<h3 className="text-lg font-semibold">
																		{
																			item
																				.cue
																				.title
																		}
																	</h3>
																	<div className="flex items-center gap-2 mt-1">
																		<span className="text-sm text-muted-foreground flex items-center gap-1">
																			<Clock className="h-3 w-3" />
																			{
																				item
																					.cue
																					.duration
																			}{" "}
																			min
																		</span>
																		{item
																			.cue
																			.notes && (
																			<span className="text-sm text-muted-foreground">
																				•{" "}
																				{
																					item
																						.cue
																						.notes
																				}
																			</span>
																		)}
																	</div>
																</div>
															</div>
														)}
												</div>
												<div className="flex items-center gap-4">
													<Badge
														variant={
															item.status ===
															"completed"
																? "destructive"
																: item.status ===
																  "currently_on_stage"
																? "default"
																: "outline"
														}
													>
														{item.status ===
															"not_started" &&
															"Not Started"}
														{item.status ===
															"next_on_deck" &&
															"Next on Deck"}
														{item.status ===
															"next_on_stage" &&
															"Next on Stage"}
														{item.status ===
															"currently_on_stage" &&
															"Currently on Stage"}
														{item.status ===
															"completed" &&
															"Completed"}
													</Badge>
													{item.type === "artist" && (
														<div className="flex items-center gap-2">
															{/* <MusicEditDialog
																artistId={
																	item.artist!
																		.id
																}
																tracks={getArtistTracks(
																	item.artist!
																		.id
																)}
															/> */}
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))
							);
						})()}
					</div>
				</div>
			</main>
		</div>
	);
}
