"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Clock,
	Users,
	AlertTriangle,
	Video,
	RefreshCw,
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Mic,
	Speaker,
	Play,
	Timer,
	Sparkles,
	CheckCircle,
	Trash2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateSimple } from "@/lib/date-utils";
import {
	getStatusColorClasses,
	getStatusLabel,
	getStatusBadgeVariant,
} from "@/lib/status-utils";
import { formatDuration, getDisplayDuration } from "@/lib/timing-utils";

interface Artist {
	id: string;
	artist_name: string;
	style: string;
	image_url?: string;
	performance_order: number | null;
	props_needed?: string;
	performance_notes?: string;
	performance_duration: number;
	actual_duration?: number | null;
	quality_rating: number | null;
	rehearsal_completed: boolean;
	performance_status?: string | null;
	performance_date?: string | null;
	mc_notes?: string | null;
	biography?: string | null;
	artist_notes?: string | null;
}

interface Cue {
	id: string;
	type: string;
	title: string;
	duration: number;
	performance_order: number;
	notes?: string;
	is_completed?: boolean;
	performance_status?: string | null;
	mc_notes?: string | null;
	performance_date?: string | null;
}

interface PerformanceItem {
	id: string;
	type: "artist" | "cue";
	artist?: Artist;
	cue?: Cue;
	performance_order: number;
	status?:
		| "completed"
		| "currently_on_stage"
		| "next_on_stage"
		| "next_on_deck"
		| "not_started";
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

export default function LivePerformanceBoard() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [performanceItems, setPerformanceItems] = useState<PerformanceItem[]>(
		[]
	);
	const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<
		EmergencyBroadcast[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [currentPerformerIndex, setCurrentPerformerIndex] = useState(0);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [availableDates, setAvailableDates] = useState<string[]>([]);
	const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
	const [newBroadcast, setNewBroadcast] = useState({
		message: "",
		emergency_code: "green",
	});
	const [wsConnected, setWsConnected] = useState(false);
	const [currentTime, setCurrentTime] = useState<Date | null>(null); // Start as null to avoid hydration mismatch
	const [eventTimings, setEventTimings] = useState<{
		backstage_ready_time?: string;
		show_start_time?: string;
	}>({});
	const [elapsedTime, setElapsedTime] = useState(0); // Track elapsed time for current performer

	// Real-time clock update (client-side only to avoid hydration mismatch)
	useEffect(() => {
		// Set initial time on client
		setCurrentTime(new Date());

		const timer = setInterval(() => {
			setCurrentTime(new Date());
			// Increment elapsed time every second
			setElapsedTime((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// Reset elapsed time when performer changes
	useEffect(() => {
		setElapsedTime(0);
	}, [currentPerformerIndex]);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
			fetchEventDates();
			fetchEventTimings();
		}

		// Listen for WebSocket toast events
		const handleWebSocketToast = (event: CustomEvent) => {
			const { title, description, variant } = event.detail;
			toast({ title, description, variant });
		};

		window.addEventListener(
			"websocket-toast",
			handleWebSocketToast as EventListener
		);

		return () => {
			window.removeEventListener(
				"websocket-toast",
				handleWebSocketToast as EventListener
			);
		};
	}, [eventId, toast]);

	useEffect(() => {
		if (selectedDate) {
			fetchData();
			fetchEmergencyBroadcasts();
		}
	}, [selectedDate]);

	// Helper function to format duration from seconds to minutes:seconds
	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "N/A";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

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
					setAvailableDates(showDates);

					if (!selectedDate && showDates.length > 0) {
						setSelectedDate(showDates[0]);
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

	const fetchEventTimings = async () => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/timing-settings`
			);
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					setEventTimings({
						backstage_ready_time: result.data.backstage_ready_time,
						show_start_time: result.data.show_start_time,
					});
				}
			}
		} catch (error) {
			console.error("Error fetching event timings:", error);
		}
	};
	const fetchData = useCallback(async () => {
		if (!selectedDate) return;

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
						image_url: artist.image_url || "",
						performance_duration:
							artist.performanceDuration ||
							artist.performance_duration ||
							5,
						actual_duration:
							artist.musicTracks?.find(
								(track: any) => track.is_main_track
							)?.duration || null,
						performance_order: artist.performance_order || null,
						rehearsal_completed:
							artist.rehearsal_completed || false,
						quality_rating: artist.quality_rating || null,
						performance_status: artist.performance_status || null,
						performance_date:
							artist.performanceDate || artist.performance_date,
						props_needed: artist.props_needed,
						performance_notes:
							artist.mc_notes || artist.performance_notes || "",
						mc_notes: artist.mc_notes,
						biography: artist.biography,
						artist_notes: artist.artist_notes || artist.artistNotes,
					}));

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

						// Normalize selectedDate for comparison
						let normalizedSelectedDate = selectedDate;
						if (selectedDate.includes("T")) {
							normalizedSelectedDate = selectedDate.split("T")[0];
						}

						return artistDate === normalizedSelectedDate;
					});

					// Artists assigned to show order - include artists with performance_order OR artists with performance_status
					const assignedArtists = filteredArtists
						.filter(
							(a: Artist) =>
								a.performance_order !== null ||
								(a.performance_status &&
									a.performance_status !== "not_started" &&
									a.rehearsal_completed)
						)
						.map((artist: Artist) => {
							// If artist has status but no order, assign a temporary order for display
							let displayOrder = artist.performance_order;
							if (
								!displayOrder &&
								artist.performance_status &&
								artist.performance_status !== "not_started"
							) {
								// Find the highest existing order and add 1
								const maxOrder = Math.max(
									0,
									...filteredArtists
										.filter(
											(a: Artist) =>
												a.performance_order !== null
										)
										.map(
											(a: Artist) =>
												a.performance_order || 0
										)
								);
								displayOrder = maxOrder + 1;
							}

							return {
								id: artist.id,
								type: "artist" as const,
								artist: {
									...artist,
									performance_order: displayOrder,
								},
								performance_order: displayOrder || 0,
								status: (artist.performance_status ||
									"not_started") as PerformanceItem["status"],
							};
						});

					// Fetch cues from GCS
					let cueItems: PerformanceItem[] = [];
					try {
						const cuesResponse = await fetch(
							`/api/events/${eventId}/cues?performanceDate=${selectedDate}`
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
											: "not_started")) as PerformanceItem["status"],
								}));
							}
						}
					} catch (cueError) {
						console.error("Error fetching cues:", cueError);
					}

					// Combine and sort all show order items
					const allPerformanceItems = [
						...assignedArtists,
						...cueItems,
					].sort((a, b) => a.performance_order - b.performance_order);

					setPerformanceItems(allPerformanceItems);

					// Set current performer index based on status
					const currentIndex = allPerformanceItems.findIndex(
						(item) => item.status === "currently_on_stage"
					);
					if (currentIndex !== -1) {
						setCurrentPerformerIndex(currentIndex);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching performance order:", error);
			toast({
				title: "Error loading data",
				description: "Failed to load performance data",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [eventId, selectedDate, toast]);

	const fetchEmergencyBroadcasts = useCallback(async () => {
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
	}, [eventId]);

	// Initialize WebSocket manager with auto-refresh
	useEffect(() => {
		let wsManager: any = null;

		const initializeWebSocketManager = async () => {
			try {
				// Import and initialize WebSocket manager
				const { createWebSocketManager } = await import(
					"@/lib/websocket-manager"
				);

				wsManager = createWebSocketManager({
					eventId,
					role: "live_board",
					userId: `live_board_${eventId}`,
					showToasts: true,
					onConnect: () => {
						console.log("Live Board WebSocket connected");
						setWsConnected(true);
					},
					onDisconnect: () => {
						console.log("Live Board WebSocket disconnected");
						setWsConnected(false);
					},
					onDataUpdate: () => {
						console.log("Live Board data update triggered");
						// Use setTimeout to ensure functions are available and avoid stale closures
						setTimeout(() => {
							if (selectedDate) {
								console.log("Refreshing Live Board data...");
								fetchData();
							}
							console.log(
								"Refreshing Live Board emergency broadcasts..."
							);
							fetchEmergencyBroadcasts();
							fetchEventTimings();
						}, 100);
					},
				});

				await wsManager.initialize();

				// Store reference for cleanup
				(window as any).liveBoardWsManager = wsManager;
			} catch (error) {
				console.error(
					"Error initializing Live Board WebSocket manager:",
					error
				);
				setWsConnected(false);
			}
		};

		if (eventId) {
			initializeWebSocketManager();
		}

		// Cleanup on unmount
		return () => {
			if ((window as any).liveBoardWsManager) {
				(window as any).liveBoardWsManager.destroy();
				delete (window as any).liveBoardWsManager;
			}
		};
	}, [eventId, fetchData, fetchEmergencyBroadcasts]);

	const createEmergencyBroadcast = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const response = await fetch(
				`/api/events/${eventId}/emergency-broadcasts`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: newBroadcast.message,
						emergency_code: newBroadcast.emergency_code,
						is_active: true,
					}),
				}
			);

			if (response.ok) {
				setNewBroadcast({ message: "", emergency_code: "green" });
				setIsEmergencyDialogOpen(false);

				toast({
					title: "Emergency broadcast sent",
					description: `${newBroadcast.emergency_code.toUpperCase()} alert broadcast`,
				});

				fetchEmergencyBroadcasts();
			} else {
				throw new Error("Failed to create emergency broadcast");
			}
		} catch (error) {
			console.error("Error creating emergency broadcast:", error);
			toast({
				title: "Error sending broadcast",
				description: "Failed to send emergency broadcast",
				variant: "destructive",
			});
		}
	};

	const deactivateBroadcast = async (broadcastId: string) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/emergency-broadcasts/${broadcastId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						is_active: false,
					}),
				}
			);

			if (response.ok) {
				toast({
					title: "Broadcast deactivated",
					description: "Emergency broadcast has been cleared",
				});

				fetchEmergencyBroadcasts();
			} else {
				throw new Error("Failed to deactivate broadcast");
			}
		} catch (error) {
			console.error("Error deactivating broadcast:", error);
			toast({
				title: "Error deactivating broadcast",
				description: "Failed to clear emergency broadcast",
				variant: "destructive",
			});
		}
	};
	const updatePerformanceStatus = async (
		itemId: string,
		status: string,
		itemType: "artist" | "cue"
	) => {
		try {
			let response;

			if (itemType === "artist") {
				response = await fetch(
					`/api/events/${eventId}/artists/${itemId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							performance_status: status,
						}),
					}
				);
			} else {
				response = await fetch(`/api/events/${eventId}/cues`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						id: itemId,
						performance_status: status,
						performanceDate: selectedDate,
					}),
				});
			}

			if (response.ok) {
				toast({
					title: "Status updated",
					description: `Performance marked as ${status.replace(
						"_",
						" "
					)}`,
				});

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).liveBoardWsManager;
				if (wsManager) {
					wsManager.emit("live-board-update", {
						eventId,
						itemId,
						status,
						itemType,
						action: "status_updated",
						performanceDate: selectedDate,
					});
				}

				fetchData();
			} else {
				throw new Error("Failed to update status");
			}
		} catch (error) {
			console.error("Error updating performance status:", error);
			toast({
				title: "Error updating status",
				description: "Failed to update performance status",
				variant: "destructive",
			});
		}
	};

	const nextPerformer = async () => {
		if (currentPerformerIndex < performanceItems.length - 1) {
			const newIndex = currentPerformerIndex + 1;
			const currentItem = performanceItems[currentPerformerIndex];
			const nextItem = performanceItems[newIndex];

			// Mark current as completed
			if (currentItem) {
				await updatePerformanceStatus(
					currentItem.id,
					"completed",
					currentItem.type
				);
			}

			// Mark next as currently on stage
			if (nextItem) {
				await updatePerformanceStatus(
					nextItem.id,
					"currently_on_stage",
					nextItem.type
				);
			}

			setCurrentPerformerIndex(newIndex);

			if (nextItem?.type === "artist" && nextItem.artist) {
				toast({
					title: "Next performer called",
					description: `Now calling ${nextItem.artist.artist_name}`,
				});
			} else if (nextItem?.type === "cue" && nextItem.cue) {
				toast({
					title: "Next cue",
					description: `Now playing ${nextItem.cue.title}`,
				});
			}
		}
	};

	const previousPerformer = async () => {
		if (currentPerformerIndex > 0) {
			const newIndex = currentPerformerIndex - 1;
			const currentItem = performanceItems[currentPerformerIndex];
			const prevItem = performanceItems[newIndex];

			// Mark current as not started
			if (currentItem) {
				await updatePerformanceStatus(
					currentItem.id,
					"not_started",
					currentItem.type
				);
			}

			// Mark previous as currently on stage
			if (prevItem) {
				await updatePerformanceStatus(
					prevItem.id,
					"currently_on_stage",
					prevItem.type
				);
			}

			setCurrentPerformerIndex(newIndex);

			if (prevItem?.type === "artist" && prevItem.artist) {
				toast({
					title: "Previous performer called",
					description: `Now calling ${prevItem.artist.artist_name}`,
				});
			} else if (prevItem?.type === "cue" && prevItem.cue) {
				toast({
					title: "Previous cue",
					description: `Now playing ${prevItem.cue.title}`,
				});
			}
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

	const getCueIcon = (cueType: string) => {
		const iconMap: { [key: string]: any } = {
			mc_break: Mic,
			video_break: Video,
			cleaning_break: Trash2,
			speech_break: Speaker,
			opening: Play,
			countdown: Timer,
			artist_ending: CheckCircle,
			animation: Sparkles,
		};
		return iconMap[cueType] || Video;
	};

	// Status color functions
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

	const getStatusBadge = (status?: string | null) => {
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

	// Calculate total show time
	const calculateTotalShowTime = () => {
		return performanceItems.reduce((total, item) => {
			if (item.type === "artist" && item.artist) {
				return total + (item.artist.performance_duration || 0);
			} else if (item.type === "cue" && item.cue) {
				return total + (item.cue.duration || 0) * 60; // Convert minutes to seconds
			}
			return total;
		}, 0);
	};

	// Calculate remaining time with live countdown
	const calculateRemainingTime = () => {
		const remainingItems = performanceItems.slice(currentPerformerIndex);
		const totalRemaining = remainingItems.reduce((total, item) => {
			if (item.type === "artist" && item.artist) {
				return total + (item.artist.performance_duration || 0);
			} else if (item.type === "cue" && item.cue) {
				return total + (item.cue.duration || 0) * 60;
			}
			return total;
		}, 0);

		// Subtract elapsed time from current performer
		return Math.max(0, totalRemaining - elapsedTime);
	};

	// Format time in HH:MM:SS
	const formatTimeDisplay = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours}h ${minutes}m ${secs}s`;
	};

	// Format current time (handle null for SSR)
	const formatCurrentTime = (date: Date | null) => {
		if (!date) return "--:--:--";
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	};

	// Get items by status and position
	const getCurrentItem = () => performanceItems[currentPerformerIndex];
	const getNextItem = () => performanceItems[currentPerformerIndex + 1];
	const getOnDeckItem = () => performanceItems[currentPerformerIndex + 2];

	// Removed loading state to prevent interruption during auto-refresh
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									router.push(
										`/stage-manager/events/${eventId}`
									)
								}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to Dashboard
							</Button>
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									Live Performance Board
								</h1>
								<p className="text-muted-foreground">
									Real-time performance order and emergency
									management
								</p>
							</div>
						</div>
						<div className="flex gap-2 items-center">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										wsConnected
											? "bg-green-500 animate-pulse"
											: "bg-red-500"
									}`}
								></div>
								<span className="text-sm text-muted-foreground">
									{wsConnected ? "Live" : "Offline"}
								</span>
							</div>
							<Button
								onClick={fetchData}
								variant="outline"
								size="sm"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh
							</Button>
							{/* <Dialog
								open={isEmergencyDialogOpen}
								onOpenChange={setIsEmergencyDialogOpen}
							>
								<DialogTrigger asChild>
									<Button variant="destructive">
										<AlertTriangle className="h-4 w-4 mr-2" />
										Emergency Broadcast
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											Emergency Broadcast
										</DialogTitle>
										<DialogDescription>
											Send an emergency message with color
											code
										</DialogDescription>
									</DialogHeader>
									<form
										onSubmit={createEmergencyBroadcast}
										className="space-y-4"
									>
										<div className="space-y-2">
											<Label>Emergency Code</Label>
											<Select
												value={
													newBroadcast.emergency_code
												}
												onValueChange={(value) =>
													setNewBroadcast({
														...newBroadcast,
														emergency_code: value,
													})
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="red">
														🔴 RED - Emergency
													</SelectItem>
													<SelectItem value="blue">
														🔵 BLUE - Security
													</SelectItem>
													<SelectItem value="green">
														🟢 GREEN - All Clear
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Message</Label>
											<Textarea
												value={newBroadcast.message}
												onChange={(e) =>
													setNewBroadcast({
														...newBroadcast,
														message: e.target.value,
													})
												}
												placeholder="Enter emergency message..."
												required
											/>
										</div>
										<div className="flex gap-2">
											<Button type="submit">
												Send Broadcast
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={() =>
													setIsEmergencyDialogOpen(
														false
													)
												}
											>
												Cancel
											</Button>
										</div>
									</form>
								</DialogContent>
							</Dialog> */}
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
			{/* Date Selection */}
			{availableDates.length > 1 && (
				<div className="border-b border-border bg-muted/30">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Label
									htmlFor="date-select"
									className="text-sm font-medium"
								>
									Performance Date:
								</Label>
								<Select
									value={selectedDate}
									onValueChange={setSelectedDate}
								>
									<SelectTrigger
										id="date-select"
										className="w-48"
									>
										<SelectValue placeholder="Select date" />
									</SelectTrigger>
									<SelectContent>
										{availableDates.map((date, index) => (
											<SelectItem key={date} value={date}>
												Day {index + 1} -{" "}
												{formatDateSimple(date)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="text-sm text-muted-foreground">
								{event?.name && `${event.name}`}
							</div>
						</div>
					</div>
				</div>
			)}{" "}
			<main className="container mx-auto px-4 py-8">
				{/* Real-Time Clock and Timing Overview */}
				<div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Current Time
									</p>
									<p className="text-2xl font-bold">
										{formatCurrentTime(currentTime)}
									</p>
								</div>
								<Clock className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Total Show Time
									</p>
									<p className="text-2xl font-bold">
										{formatTimeDisplay(
											calculateTotalShowTime()
										)}
									</p>
								</div>
								<Timer className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Remaining Time
									</p>
									<p className="text-2xl font-bold">
										{formatTimeDisplay(
											calculateRemainingTime()
										)}
									</p>
								</div>
								<Timer className="h-8 w-8 text-orange-500" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Show Start
									</p>
									<p className="text-2xl font-bold">
										{eventTimings.show_start_time ||
											"--:--"}
									</p>
								</div>
								<Play className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Performance Controls */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							Performance Controls
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4 items-center justify-center">
							<Button
								onClick={previousPerformer}
								disabled={currentPerformerIndex <= 0}
								variant="outline"
								size="lg"
							>
								<ChevronLeft className="h-4 w-4 mr-2" />
								Previous
							</Button>
							<div className="text-center px-8">
								<p className="text-sm text-muted-foreground">
									Current Position
								</p>
								<p className="text-3xl font-bold">
									{currentPerformerIndex + 1} of{" "}
									{performanceItems.length}
								</p>
								{getCurrentItem() && (
									<p className="text-sm text-muted-foreground mt-1">
										{getCurrentItem()?.type === "artist"
											? getCurrentItem()?.artist
													?.artist_name
											: getCurrentItem()?.cue?.title}
									</p>
								)}
							</div>
							<Button
								onClick={nextPerformer}
								disabled={
									currentPerformerIndex >=
									performanceItems.length - 1
								}
								size="lg"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-2" />
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
					{/* Now Performing - GREEN */}
					<Card className="bg-green-500 text-white">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								NOW PERFORMING
							</CardTitle>
						</CardHeader>
						<CardContent>
							{getCurrentItem() ? (
								<div className="text-center space-y-4">
									{getCurrentItem()?.type === "artist" &&
									getCurrentItem()?.artist ? (
										<>
											<Avatar className="h-24 w-24 mx-auto border-2 border-white">
												<AvatarImage
													src={
														getCurrentItem()?.artist
															?.image_url
													}
													alt={
														getCurrentItem()?.artist
															?.artist_name
													}
												/>
												<AvatarFallback className="text-2xl bg-white text-green-500">
													{getCurrentItem()
														?.artist?.artist_name.charAt(
															0
														)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="text-2xl font-bold">
													{
														getCurrentItem()?.artist
															?.artist_name
													}
												</h3>
												<p className="text-white/80">
													{
														getCurrentItem()?.artist
															?.style
													}
												</p>
												<div className="flex items-center justify-center gap-2 mt-2">
													<Badge className="bg-white text-green-500">
														Position{" "}
														{currentPerformerIndex +
															1}
													</Badge>
													{getCurrentItem()?.artist
														?.actual_duration && (
														<Badge className="bg-white/20 text-white border-white/30">
															{formatDuration(
																getCurrentItem()
																	?.artist
																	?.actual_duration ||
																	null
															)}
														</Badge>
													)}
												</div>
											</div>
											{getCurrentItem()?.artist
												?.performance_notes && (
												<div className="text-sm bg-white/10 rounded p-3">
													<p className="font-medium">
														MC Notes:
													</p>
													<p>
														{
															getCurrentItem()
																?.artist
																?.performance_notes
														}
													</p>
												</div>
											)}
										</>
									) : getCurrentItem()?.type === "cue" &&
									  getCurrentItem()?.cue ? (
										<>
											<div className="h-24 w-24 mx-auto border-2 border-white rounded-full flex items-center justify-center bg-white text-green-500">
												{(() => {
													const IconComponent =
														getCueIcon(
															getCurrentItem()
																?.cue?.type ||
																""
														);
													return (
														<IconComponent className="h-12 w-12" />
													);
												})()}
											</div>
											<div>
												<h3 className="text-2xl font-bold">
													{
														getCurrentItem()?.cue
															?.title
													}
												</h3>
												<p className="text-white/80">
													{
														getCurrentItem()?.cue
															?.duration
													}{" "}
													minutes
												</p>
												<Badge className="mt-2 bg-white text-green-500">
													Position{" "}
													{currentPerformerIndex + 1}
												</Badge>
											</div>
										</>
									) : null}
								</div>
							) : (
								<div className="text-center py-8">
									<p>Performance Complete!</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Next Up - YELLOW */}
					<Card className="bg-yellow-400 text-black">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								NEXT UP
							</CardTitle>
						</CardHeader>
						<CardContent>
							{getNextItem() ? (
								<div className="text-center space-y-4">
									{getNextItem()?.type === "artist" &&
									getNextItem()?.artist ? (
										<>
											<Avatar className="h-20 w-20 mx-auto border-2 border-black">
												<AvatarImage
													src={
														getNextItem()?.artist
															?.image_url
													}
													alt={
														getNextItem()?.artist
															?.artist_name
													}
												/>
												<AvatarFallback className="text-lg bg-black text-yellow-400">
													{getNextItem()
														?.artist?.artist_name.charAt(
															0
														)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="text-xl font-bold">
													{
														getNextItem()?.artist
															?.artist_name
													}
												</h3>
												<p className="text-black/80">
													{
														getNextItem()?.artist
															?.style
													}
												</p>
												<div className="flex items-center justify-center gap-2 mt-2">
													<Badge className="bg-black text-yellow-400">
														Position{" "}
														{currentPerformerIndex +
															2}
													</Badge>
													{getNextItem()?.artist
														?.actual_duration && (
														<Badge className="bg-black/20 text-black border-black/30">
															{formatDuration(
																getNextItem()
																	?.artist
																	?.actual_duration ||
																	null
															)}
														</Badge>
													)}
												</div>
											</div>
											{getNextItem()?.artist
												?.props_needed && (
												<div className="text-sm bg-black/10 rounded p-3">
													<p className="font-medium">
														Props Needed:
													</p>
													<p>
														{
															getNextItem()
																?.artist
																?.props_needed
														}
													</p>
												</div>
											)}
										</>
									) : getNextItem()?.type === "cue" &&
									  getNextItem()?.cue ? (
										<>
											<div className="h-20 w-20 mx-auto border-2 border-black rounded-full flex items-center justify-center bg-black text-yellow-400">
												{(() => {
													const IconComponent =
														getCueIcon(
															getNextItem()?.cue
																?.type || ""
														);
													return (
														<IconComponent className="h-10 w-10" />
													);
												})()}
											</div>
											<div>
												<h3 className="text-xl font-bold">
													{getNextItem()?.cue?.title}
												</h3>
												<p className="text-black/80">
													{
														getNextItem()?.cue
															?.duration
													}{" "}
													minutes
												</p>
												<Badge className="mt-2 bg-black text-yellow-400">
													Position{" "}
													{currentPerformerIndex + 2}
												</Badge>
											</div>
										</>
									) : null}
								</div>
							) : (
								<div className="text-center py-8 text-black/70">
									<p>No more items</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* On Deck - BLUE */}
					<Card className="bg-blue-500 text-white">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								ON DECK
							</CardTitle>
						</CardHeader>
						<CardContent>
							{getOnDeckItem() ? (
								<div className="text-center space-y-4">
									{getOnDeckItem()?.type === "artist" &&
									getOnDeckItem()?.artist ? (
										<>
											<Avatar className="h-16 w-16 mx-auto border-2 border-white">
												<AvatarImage
													src={
														getOnDeckItem()?.artist
															?.image_url
													}
													alt={
														getOnDeckItem()?.artist
															?.artist_name
													}
												/>
												<AvatarFallback className="bg-white text-blue-500">
													{getOnDeckItem()
														?.artist?.artist_name.charAt(
															0
														)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="text-lg font-bold">
													{
														getOnDeckItem()?.artist
															?.artist_name
													}
												</h3>
												<p className="text-white/80">
													{
														getOnDeckItem()?.artist
															?.style
													}
												</p>
												<div className="flex items-center justify-center gap-2 mt-2">
													<Badge className="bg-white text-blue-500">
														Position{" "}
														{currentPerformerIndex +
															3}
													</Badge>
													{getOnDeckItem()?.artist
														?.actual_duration && (
														<Badge className="bg-white/20 text-white border-white/30">
															{formatDuration(
																getOnDeckItem()
																	?.artist
																	?.actual_duration ||
																	null
															)}
														</Badge>
													)}
												</div>
											</div>
										</>
									) : getOnDeckItem()?.type === "cue" &&
									  getOnDeckItem()?.cue ? (
										<>
											<div className="h-16 w-16 mx-auto border-2 border-white rounded-full flex items-center justify-center bg-white text-blue-500">
												{(() => {
													const IconComponent =
														getCueIcon(
															getOnDeckItem()?.cue
																?.type || ""
														);
													return (
														<IconComponent className="h-8 w-8" />
													);
												})()}
											</div>
											<div>
												<h3 className="text-lg font-bold">
													{
														getOnDeckItem()?.cue
															?.title
													}
												</h3>
												<p className="text-white/80">
													{
														getOnDeckItem()?.cue
															?.duration
													}{" "}
													minutes
												</p>
												<Badge className="mt-2 bg-white text-blue-500">
													Position{" "}
													{currentPerformerIndex + 3}
												</Badge>
											</div>
										</>
									) : null}
								</div>
							) : (
								<div className="text-center py-8 text-white/70">
									<p>No one on deck</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
				{/* Complete Performance Order */}
				<Card>
					<CardHeader>
						<CardTitle>Complete Performance Order</CardTitle>
						<CardDescription>
							Full lineup for tonight's show
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{performanceItems.map((item, index) => {
								const isCurrent =
									index === currentPerformerIndex;
								const isCompleted =
									index < currentPerformerIndex;
								const isNext =
									index === currentPerformerIndex + 1;
								const isOnDeck =
									index === currentPerformerIndex + 2;

								return (
									<div
										key={item.id}
										className={`flex items-center gap-3 p-3 rounded-lg border ${
											isCurrent
												? "bg-green-500 text-white border-green-500"
												: isCompleted
												? "bg-red-500 text-white border-red-500"
												: isNext
												? "bg-yellow-400 text-black border-yellow-400"
												: isOnDeck
												? "bg-blue-500 text-white border-blue-500"
												: "bg-card"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
												isCurrent
													? "bg-white text-green-500"
													: isCompleted
													? "bg-white text-red-500"
													: isNext
													? "bg-black text-yellow-400"
													: isOnDeck
													? "bg-white text-blue-500"
													: "bg-primary text-primary-foreground"
											}`}
										>
											{item.performance_order}
										</div>
										{item.type === "artist" &&
										item.artist ? (
											<>
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={
															item.artist
																.image_url
														}
														alt={
															item.artist
																.artist_name
														}
													/>
													<AvatarFallback>
														{item.artist.artist_name
															.charAt(0)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1">
													<div className="font-medium">
														{
															item.artist
																.artist_name
														}
													</div>
													<div
														className={`text-sm ${
															isCurrent ||
															isCompleted ||
															isNext ||
															isOnDeck
																? "opacity-80"
																: "text-muted-foreground"
														}`}
													>
														{item.artist.style}
														{item.artist
															.actual_duration && (
															<span>
																{" "}
																•{" "}
																{formatDuration(
																	item.artist
																		.actual_duration ||
																		null
																)}
															</span>
														)}
													</div>
												</div>
											</>
										) : item.type === "cue" && item.cue ? (
											<>
												<div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
													{(() => {
														const IconComponent =
															getCueIcon(
																item.cue
																	?.type || ""
															);
														return (
															<IconComponent className="h-4 w-4" />
														);
													})()}
												</div>
												<div className="flex-1">
													<div className="font-medium">
														{item.cue.title}
													</div>
													<div
														className={`text-sm ${
															isCurrent ||
															isCompleted ||
															isNext ||
															isOnDeck
																? "opacity-80"
																: "text-muted-foreground"
														}`}
													>
														{item.cue.type.replace(
															"_",
															" "
														)}{" "}
														• {item.cue.duration}{" "}
														min
													</div>
												</div>
											</>
										) : null}
										<Badge
											variant={
												isCurrent
													? "default"
													: isCompleted
													? "destructive"
													: isNext
													? "secondary"
													: isOnDeck
													? "outline"
													: "outline"
											}
											className={
												isCurrent
													? "bg-white text-green-500"
													: isCompleted
													? "bg-white text-red-500"
													: isNext
													? "bg-black text-yellow-400"
													: isOnDeck
													? "bg-white text-blue-500"
													: ""
											}
										>
											{isCurrent
												? "NOW PERFORMING"
												: isCompleted
												? "COMPLETED"
												: isNext
												? "NEXT UP"
												: isOnDeck
												? "ON DECK"
												: "WAITING"}
										</Badge>
									</div>
								);
							})}
						</div>

						{performanceItems.length === 0 && (
							<div className="text-center py-12">
								<Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
								<h3 className="text-lg font-medium mb-2">
									No performances scheduled
								</h3>
								<p className="text-muted-foreground">
									No performances found for the selected date
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
