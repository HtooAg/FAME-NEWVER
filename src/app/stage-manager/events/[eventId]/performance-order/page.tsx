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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
	Clock,
	ArrowLeft,
	Star,
	ArrowUp,
	ArrowDown,
	Plus,
	Mic,
	Video,
	Trash2,
	Speaker,
	Play,
	Timer,
	Sparkles,
	CheckCircle,
	Edit,
	Settings,
	RefreshCw,
	AlertTriangle,
	Copy,
	Music,
	ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateSimple } from "@/lib/date-utils";
import {
	calculateTotalShowTime,
	formatTime,
	formatTotalTime,
	calculateItemTiming,
	formatDuration,
	getDisplayDuration,
} from "@/lib/timing-utils";
import {
	apiCallWithRetry,
	showErrorToast,
	isNetworkError,
} from "@/lib/error-handling";
import { createWebSocketManager } from "@/lib/websocket-manager";

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

interface EventTimings {
	backstage_ready_time?: string;
	show_start_time?: string;
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

export default function PerformanceOrder() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;

	const [completedArtists, setCompletedArtists] = useState<Artist[]>([]);
	const [showOrderItems, setShowOrderItems] = useState<ShowOrderItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [editingCue, setEditingCue] = useState<Cue | null>(null);
	const [editForm, setEditForm] = useState({
		title: "",
		duration: 0,
		notes: "",
		backstage_ready_time: "",
		show_start_time: "",
	});
	const [eventTimings, setEventTimings] = useState<EventTimings>({});
	const [showTimingSettings, setShowTimingSettings] = useState(false);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [eventDates, setEventDates] = useState<string[]>([]);
	const [wsConnected, setWsConnected] = useState(false);
	const [cacheInitialized, setCacheInitialized] = useState(false);
	const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<
		EmergencyBroadcast[]
	>([]);
	const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
	const [newBroadcast, setNewBroadcast] = useState({
		message: "",
		emergency_code: "green",
	});

	// Import timing utilities
	const {
		calculateTotalShowTime,
		formatTime,
		calculateItemTiming,
		formatDuration,
		getDisplayDuration,
	} = require("@/lib/timing-utils");
	// Initialize WebSocket manager with auto-refresh polling
	useEffect(() => {
		let wsManager: any = null;

		const initializeWebSocketManager = async () => {
			try {
				// Initialize cache manager for this event
				const response = await fetch(`/api/events/${eventId}/cache`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						action: "warmup",
						performanceDate: selectedPerformanceDate,
					}),
				});

				// Cache initialized

				// Import and initialize WebSocket manager
				const { createWebSocketManager } = await import(
					"@/lib/websocket-manager"
				);

				wsManager = createWebSocketManager({
					eventId,
					role: "stage_manager",
					userId: `stage_manager_${eventId}`,
					showToasts: true,
					onConnect: () => {
						setWsConnected(true);
					},
					onDisconnect: () => {
						setWsConnected(false);
					},
					onDataUpdate: () => {
						fetchArtists();
						fetchEmergencyBroadcasts();
					},
				});

				await wsManager.initialize();

				// Store reference for cleanup
				(window as any).performanceOrderWsManager = wsManager;
			} catch (error) {
				console.error("Error initializing WebSocket manager:", error);
				setWsConnected(false);
			}
		};

		if (eventId && selectedPerformanceDate) {
			initializeWebSocketManager();
		}

		// Cleanup on unmount
		return () => {
			if ((window as any).performanceOrderWsManager) {
				(window as any).performanceOrderWsManager.destroy();
				delete (window as any).performanceOrderWsManager;
			}
		};
	}, [eventId, selectedPerformanceDate]);

	useEffect(() => {
		if (eventId) {
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

	// Separate useEffect to fetch artists when performance date changes
	useEffect(() => {
		if (selectedPerformanceDate) {
			fetchArtists();
		}
	}, [selectedPerformanceDate]);

	// Fetch emergency broadcasts on component mount
	useEffect(() => {
		if (eventId) {
			fetchEmergencyBroadcasts();
		}
	}, [eventId]);
	const fetchEventDates = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				const evt = data.data || data.event || data;
				const showDates = evt.show_dates || evt.showDates || [];

				if (showDates.length > 0) {
					setEventDates(showDates);

					if (!selectedPerformanceDate && showDates.length > 0) {
						setSelectedPerformanceDate(showDates[0]);
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
				} else {
					// Set default empty timings if no data exists
					setEventTimings({
						backstage_ready_time: undefined,
						show_start_time: undefined,
					});
				}
			}
		} catch (error) {
			console.error("Error fetching event timings:", error);
			// Set default empty timings on error
			setEventTimings({
				backstage_ready_time: undefined,
				show_start_time: undefined,
			});
		}
	};

	const saveEventTimings = async (timings: EventTimings) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/timing-settings`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						backstage_ready_time: timings.backstage_ready_time,
						show_start_time: timings.show_start_time,
						updated_by: "stage_manager", // You can get this from user context
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setEventTimings(timings);
					setShowTimingSettings(false);
					toast({
						title: "Timing settings saved",
						description:
							"Event timing has been updated and saved to GCS",
					});

					// Emit WebSocket event to notify other pages (DJ, MC, Live Board)
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("timing-settings-updated", {
							eventId,
							backstage_ready_time: timings.backstage_ready_time,
							show_start_time: timings.show_start_time,
							timestamp: new Date().toISOString(),
						});
					}
				} else {
					throw new Error(result.error || "Failed to save timings");
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save timings");
			}
		} catch (error) {
			console.error("Error saving timing settings:", error);
			toast({
				title: "Error saving timings",
				description:
					error instanceof Error
						? error.message
						: "Failed to save timing settings",
				variant: "destructive",
			});
		}
	};

	const initializeWebSocket = () => {
		try {
			// Use Socket.IO client instead of raw WebSocket
			const script = document.createElement("script");
			script.src = "/socket.io/socket.io.js";
			let socket: any = null;

			script.onload = () => {
				// @ts-ignore
				socket = io();

				socket.on("connect", () => {
					setWsConnected(true);
				});

				socket.on("disconnect", () => {
					setWsConnected(false);
				});

				socket.on("rehearsal_completed", (message: any) => {
					fetchArtists();
				});

				socket.on("performance_order_updated", (message: any) => {
					fetchArtists();
				});

				socket.on("emergency-alert", (message: any) => {
					fetchEmergencyBroadcasts();
					toast({
						title: `${message.data.emergency_code.toUpperCase()} EMERGENCY ALERT`,
						description: message.data.message,
						variant: "destructive",
					});
				});

				socket.on("emergency-clear", (message: any) => {
					fetchEmergencyBroadcasts();
					toast({
						title: "Emergency alert cleared",
						description: "Emergency broadcast has been deactivated",
					});
				});
			};
			document.head.appendChild(script);

			// Return cleanup function
			return () => {
				if (socket) {
					socket.disconnect();
				}
				if (script.parentNode) {
					script.parentNode.removeChild(script);
				}
			};
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
		}
	};
	const fetchArtists = async (showRefreshIndicator = false) => {
		if (!selectedPerformanceDate) return;

		try {
			if (showRefreshIndicator) {
				setRefreshing(true);
			}

			// Fetch all artists from GCS
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();

				if (data.success) {
					const artists = (data.data || []).map(
						(artist: any): Artist => {
							// Handle both snake_case and camelCase field names
							const performanceOrder =
								artist.performance_order ??
								artist.performanceOrder ??
								null;
							const performanceStatus =
								artist.performance_status ??
								artist.performanceStatus ??
								null;
							const performanceDate =
								artist.performance_date ??
								artist.performanceDate;
							const artistName =
								artist.artist_name ?? artist.artistName;
							const performanceDuration =
								artist.performance_duration ??
								artist.performanceDuration ??
								5;

							return {
								id: artist.id,
								artist_name: artistName,
								style: artist.style,
								performance_duration: performanceDuration,
								quality_rating: artist.quality_rating || null,
								performance_order: performanceOrder,
								rehearsal_completed:
									artist.rehearsal_completed || false,
								performance_status: performanceStatus,
								performance_date: performanceDate,
								actual_duration:
									artist.musicTracks?.find(
										(track: any) => track.is_main_track
									)?.duration || null,
							};
						}
					);

					// Normalize selected performance date to YYYY-MM-DD format
					const normalizeDate = (dateStr: string): string => {
						if (!dateStr) return "";

						// If already in YYYY-MM-DD format, return as is
						if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
							return dateStr;
						}

						// If ISO format with time, extract date part
						if (dateStr.includes("T")) {
							return dateStr.split("T")[0];
						}

						// Try to parse and format
						try {
							const date = new Date(dateStr);
							const year = date.getFullYear();
							const month = String(date.getMonth() + 1).padStart(
								2,
								"0"
							);
							const day = String(date.getDate()).padStart(2, "0");
							return `${year}-${month}-${day}`;
						} catch (error) {
							console.error(
								`Failed to normalize date: ${dateStr}`,
								error
							);
							return dateStr;
						}
					};

					const normalizedSelectedDate = normalizeDate(
						selectedPerformanceDate
					);

					// Filter artists for the selected performance date
					const filteredArtists = artists.filter((a: Artist) => {
						// Check both performance_date and performanceDate fields for compatibility
						const performanceDate =
							a.performance_date || (a as any).performanceDate;

						if (!performanceDate) {
							return false; // Only show artists with performance dates
						}

						// Normalize artist's performance date
						const artistDate = normalizeDate(performanceDate);

						return artistDate === normalizedSelectedDate;
					});

					// Artists who completed rehearsal but not yet assigned to show order
					const completed = filteredArtists.filter((a: Artist) => {
						return (
							a.rehearsal_completed &&
							a.performance_order === null &&
							(!a.performance_status ||
								a.performance_status === "not_started")
						);
					});

					// Artists assigned to show order - convert to show order items
					// Include artists with performance_order OR artists with performance_status (inconsistent state fix)
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
									"not_started") as ShowOrderItem["status"], // Default to Back Stage (not_started)
							};
						});

					// Fetch cues from GCS
					let cueItems: ShowOrderItem[] = [];
					try {
						const cuesResponse = await fetch(
							`/api/events/${eventId}/cues?performanceDate=${selectedPerformanceDate}`
						);
						if (cuesResponse.ok) {
							const cuesResult = await cuesResponse.json();
							if (cuesResult.success) {
								cueItems = cuesResult.data.map((cue: any) => {
									return {
										id: cue.id,
										type: "cue" as const,
										cue,
										performance_order:
											cue.performance_order,
										status: (cue.performance_status ||
											(cue.is_completed
												? "completed"
												: "not_started")) as ShowOrderItem["status"], // Default to Back Stage (not_started)
									};
								});
							}
						}
					} catch (cueError) {
						console.error("Error fetching cues:", cueError);
						// Continue without cues if fetch fails
					}

					// Combine and sort all show order items
					const allShowOrderItems = [
						...assignedArtists,
						...cueItems,
					].sort((a, b) => a.performance_order - b.performance_order);

					// Fix inconsistent state: artists with status but no order
					const artistsToFix = assignedArtists.filter(
						(item: ShowOrderItem) =>
							item.type === "artist" &&
							item.artist &&
							!item.artist.performance_order &&
							item.artist.performance_status &&
							item.artist.performance_status !== "not_started"
					);

					if (artistsToFix.length > 0) {
						// Fix them in the background
						artistsToFix.forEach(async (item: ShowOrderItem) => {
							if (item.artist) {
								try {
									await fetch(
										`/api/events/${eventId}/artists/${item.artist.id}`,
										{
											method: "PATCH",
											headers: {
												"Content-Type":
													"application/json",
											},
											body: JSON.stringify({
												performance_order:
													item.performance_order,
												performance_date:
													selectedPerformanceDate,
											}),
										}
									);
								} catch (error) {
									// Silent fail for background fix
								}
							}
						});
					}

					setCompletedArtists(completed);
					setShowOrderItems(allShowOrderItems);

					if (showRefreshIndicator) {
						toast({
							title: "Data refreshed",
							description:
								"Performance order data updated from GCS",
						});
					}
				}
			}
		} catch (error) {
			console.error("Error fetching artists:", error);
			toast({
				title: "Error fetching data",
				description: "Failed to load artists and cues",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
			if (showRefreshIndicator) {
				setRefreshing(false);
			}
		}
	};

	const handleManualRefresh = () => {
		fetchArtists(true);
	};
	const assignToShowOrder = async (artistId: string) => {
		if (!selectedPerformanceDate) {
			toast({
				title: "Error assigning artist",
				description: "Please select a performance date first",
				variant: "destructive",
			});
			return;
		}

		const nextOrder = showOrderItems.length + 1;

		try {
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						performance_order: nextOrder,
						performance_date: selectedPerformanceDate,
						performanceDate: selectedPerformanceDate, // Also set this field for consistency
						performance_status: "not_started", // Set initial status to Back Stage (not_started)
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();

				if (result.success) {
					toast({
						title: "Artist assigned to show order",
						description:
							"Artist has been added to the performance lineup",
					});

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("performance-order-update", {
							eventId,
							type: "artist",
							action: "assigned",
							artistId,
							performanceDate: selectedPerformanceDate,
						});
					}
				} else {
					throw new Error(result.error || "Failed to assign artist");
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to assign artist");
			}
		} catch (error) {
			console.error("Error assigning artist:", error);
			toast({
				title: "Error assigning artist",
				description:
					error instanceof Error
						? error.message
						: "Failed to assign artist to show order",
				variant: "destructive",
			});
		}
	};

	const removeFromShowOrder = async (
		itemId: string,
		itemType: "artist" | "cue"
	) => {
		if (itemType === "artist") {
			try {
				const response = await fetch(
					`/api/events/${eventId}/artists/${itemId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							performance_order: null,
							performance_status: "not_started",
						}),
					}
				);

				if (response.ok) {
					toast({
						title: "Artist removed from show order",
						description: "Artist removed from performance lineup",
					});

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("performance-order-update", {
							eventId,
							type: "artist",
							action: "removed",
							artistId: itemId,
							performanceDate: selectedPerformanceDate,
						});
					}

					fetchArtists();
				} else {
					throw new Error("Failed to remove artist");
				}
			} catch (error) {
				toast({
					title: "Error removing artist",
					description: "Failed to remove artist from show order",
					variant: "destructive",
				});
			}
		} else {
			// Remove cue via API
			if (!selectedPerformanceDate) {
				toast({
					title: "Error removing cue",
					description: "Performance date not selected",
					variant: "destructive",
				});
				return;
			}

			try {
				const response = await fetch(
					`/api/events/${eventId}/cues?cueId=${itemId}&performanceDate=${selectedPerformanceDate}`,
					{
						method: "DELETE",
					}
				);

				if (response.ok) {
					const result = await response.json();
					if (result.success) {
						// Remove from local state
						setShowOrderItems((prev) =>
							prev.filter((item) => item.id !== itemId)
						);
						toast({
							title: "Cue removed",
							description: "Cue removed from show order and GCS",
						});

						// Emit WebSocket event for real-time updates
						const wsManager = (window as any)
							.performanceOrderWsManager;
						if (wsManager) {
							wsManager.emit("cue_updated", {
								eventId,
								cueId: itemId,
								action: "deleted",
								performanceDate: selectedPerformanceDate,
							});
						}
					} else {
						throw new Error(result.error || "Failed to remove cue");
					}
				} else {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to remove cue");
				}
			} catch (error) {
				console.error("Error removing cue:", error);
				toast({
					title: "Error removing cue",
					description:
						error instanceof Error
							? error.message
							: "Failed to remove cue",
					variant: "destructive",
				});
			}
		}
	};

	// Drag and drop handler
	const handleDragEnd = async (result: any) => {
		if (!result.destination) return;

		const items = Array.from(showOrderItems);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		// Update performance orders for ALL items
		const updatedItems = items.map((item, index) => ({
			...item,
			performance_order: index + 1,
		}));

		// Update local state immediately for better UX
		setShowOrderItems(updatedItems);

		try {
			// Update all items (both artists and cues)
			const updatePromises = updatedItems.map(async (item) => {
				if (item.type === "artist" && item.artist) {
					const response = await fetch(
						`/api/events/${eventId}/artists/${item.artist.id}`,
						{
							method: "PATCH",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								performance_order: item.performance_order,
								performance_date: selectedPerformanceDate,
							}),
						}
					);

					if (!response.ok) {
						const errorData = await response.json();
						console.error(
							`Failed to update artist ${item.artist.id}:`,
							errorData
						);
						throw new Error(
							errorData.error?.message ||
								`Failed to update artist ${item.artist.artist_name}`
						);
					}

					return response.json();
				} else if (item.type === "cue" && item.cue) {
					const response = await fetch(
						`/api/events/${eventId}/cues`,
						{
							method: "PATCH",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								id: item.cue.id,
								performance_order: item.performance_order,
								performanceDate: selectedPerformanceDate,
							}),
						}
					);

					if (!response.ok) {
						const errorData = await response.json();
						console.error(
							`Failed to update cue ${item.cue.id}:`,
							errorData
						);
						throw new Error(
							`Failed to update cue ${item.cue.title}`
						);
					}

					return response.json();
				}
			});

			// Wait for all updates to complete
			await Promise.all(updatePromises);

			toast({
				title: "Order updated",
				description: "Performance order has been saved",
			});

			// Emit WebSocket event for real-time updates
			const wsManager = (window as any).performanceOrderWsManager;
			if (wsManager) {
				wsManager.emit("performance-order-update", {
					eventId,
					type: "order_changed",
					action: "reordered",
					performanceDate: selectedPerformanceDate,
				});
			}
		} catch (error) {
			console.error("Error updating order:", error);
			// Revert on error
			fetchArtists();
			toast({
				title: "Error updating order",
				description:
					error instanceof Error
						? error.message
						: "Failed to save new performance order",
				variant: "destructive",
			});
		}
	};

	// Add cue to show order
	const addCue = async (cueType: Cue["type"]) => {
		if (!selectedPerformanceDate) {
			toast({
				title: "Error adding cue",
				description: "Please select a performance date first",
				variant: "destructive",
			});
			return;
		}

		const cueLabels = {
			opening: "Opening",
			countdown: "Countdown",
			mc_break: "MC Break",
			video_break: "Video Break",
			cleaning_break: "Cleaning Break",
			speech_break: "Speech Break",
			artist_ending: "Artist Ending",
			animation: "Animation",
		};

		const newCue = {
			id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: cueType,
			title: cueLabels[cueType],
			duration: 5, // Default 5 minutes
			performance_order: showOrderItems.length + 1,
			performanceDate: selectedPerformanceDate,
			performance_status: "not_started", // Set initial status to Back Stage (not_started)
		};

		try {
			const response = await fetch(`/api/events/${eventId}/cues`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newCue),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					toast({
						title: "Cue added",
						description: `${cueLabels[cueType]} cue added to show order`,
					});

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("cue_updated", {
							eventId,
							cueId: result.data?.id || newCue.id,
							action: "created",
							cue: result.data || newCue,
							performanceDate: selectedPerformanceDate,
						});
					}

					fetchArtists(); // Refresh to show new cue
				} else {
					throw new Error(result.error || "Failed to add cue");
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add cue");
			}
		} catch (error) {
			console.error("Error adding cue:", error);
			toast({
				title: "Error adding cue",
				description:
					error instanceof Error
						? error.message
						: "Failed to add cue",
				variant: "destructive",
			});
		}
	};

	const editCue = (cue: Cue) => {
		setEditingCue(cue);
		setEditForm({
			title: cue.title,
			duration: cue.duration || 0,
			notes: cue.notes || "",
			backstage_ready_time: eventTimings.backstage_ready_time || "",
			show_start_time: eventTimings.show_start_time || "",
		});
	};

	const saveCueEdit = async () => {
		if (!editingCue || !selectedPerformanceDate) return;

		try {
			const response = await fetch(`/api/events/${eventId}/cues`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: editingCue.id,
					title: editForm.title,
					duration: editForm.duration,
					notes: editForm.notes,
					performanceDate: selectedPerformanceDate,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					// Update local state
					setShowOrderItems((prev) =>
						prev.map((item) =>
							item.id === editingCue.id && item.type === "cue"
								? {
										...item,
										cue: {
											...item.cue!,
											title: editForm.title,
											duration: editForm.duration,
											notes: editForm.notes,
										},
								  }
								: item
						)
					);

					setEditingCue(null);
					setEditForm({
						title: "",
						duration: 0,
						notes: "",
						backstage_ready_time: "",
						show_start_time: "",
					});

					toast({
						title: "Cue updated",
						description: "Cue details have been saved to GCS",
					});

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("cue_updated", {
							eventId,
							cueId: editingCue.id,
							action: "updated",
							cue: {
								...editingCue,
								title: editForm.title,
								duration: editForm.duration,
								notes: editForm.notes,
							},
							performanceDate: selectedPerformanceDate,
						});
					}
				} else {
					throw new Error(result.error || "Failed to update cue");
				}
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update cue");
			}
		} catch (error) {
			console.error("Error updating cue:", error);
			toast({
				title: "Error updating cue",
				description:
					error instanceof Error
						? error.message
						: "Failed to update cue",
				variant: "destructive",
			});
		}
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

	const updateItemStatus = async (
		itemId: string,
		newStatus: ShowOrderItem["status"]
	) => {
		// Find the item to determine if it's an artist or cue
		const item = showOrderItems.find((i) => i.id === itemId);
		if (!item) return;

		// Store original status for potential revert
		const originalStatus = item.status;

		try {
			// Update local state immediately for better UX
			setShowOrderItems((prevItems) =>
				prevItems.map((i) =>
					i.id === itemId ? { ...i, status: newStatus } : i
				)
			);

			if (item.type === "artist" && item.artist) {
				// Update artist status via API
				const response = await fetch(
					`/api/events/${eventId}/artists/${item.artist.id}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							performance_status: newStatus,
						}),
					}
				);

				if (response.ok) {
					const result = await response.json();

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("artist_status_changed", {
							eventId,
							artistId: item.artist.id,
							artist_name: item.artist.artist_name,
							status: newStatus || "not_started",
							performanceDate: selectedPerformanceDate,
							timestamp: new Date().toISOString(),
						});
					}

					toast({
						title: "Status Updated",
						description: `${item.artist.artist_name} is now ${(
							newStatus || "not_started"
						).replace("_", " ")}`,
					});
				} else {
					throw new Error("Failed to update artist status");
				}
			} else if (item.type === "cue" && item.cue) {
				// Update cue status via API
				const response = await fetch(`/api/events/${eventId}/cues`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						id: item.cue.id,
						performance_status: newStatus,
						performanceDate: selectedPerformanceDate,
					}),
				});

				if (response.ok) {
					const result = await response.json();

					// Emit WebSocket event for real-time updates
					const wsManager = (window as any).performanceOrderWsManager;
					if (wsManager) {
						wsManager.emit("cue_updated", {
							eventId,
							cueId: item.cue.id,
							action: "status_updated",
							cue: item.cue,
							status: newStatus || "not_started",
							performanceDate: selectedPerformanceDate,
							timestamp: new Date().toISOString(),
						});
					}

					toast({
						title: "Cue Status Updated",
						description: `${item.cue.title} is now ${(
							newStatus || "not_started"
						).replace("_", " ")}`,
					});
				} else {
					throw new Error("Failed to update cue status");
				}
			}

			// Data will be refreshed via WebSocket event
		} catch (error) {
			console.error("Error updating item status:", error);

			// Revert local state on error using the stored original status
			setShowOrderItems((prevItems) =>
				prevItems.map((i) =>
					i.id === itemId ? { ...i, status: originalStatus } : i
				)
			);

			toast({
				title: "Error updating status",
				description:
					error instanceof Error
						? error.message
						: "Failed to update status",
				variant: "destructive",
			});
		}
	};

	const moveItem = async (itemId: string, direction: "up" | "down") => {
		try {
			const currentIndex = showOrderItems.findIndex(
				(item) => item.id === itemId
			);
			if (currentIndex === -1) return;

			const newIndex =
				direction === "up" ? currentIndex - 1 : currentIndex + 1;
			if (newIndex < 0 || newIndex >= showOrderItems.length) return;

			// Create new array with swapped items
			const newItems = [...showOrderItems];
			[newItems[currentIndex], newItems[newIndex]] = [
				newItems[newIndex],
				newItems[currentIndex],
			];

			// Update performance orders for ALL items to ensure consistency
			const updatedItems = newItems.map((item, index) => ({
				...item,
				performance_order: index + 1,
			}));

			// Update local state immediately for better UX
			setShowOrderItems(updatedItems);

			// Update each item's order in the database
			const updatePromises = updatedItems.map(async (item) => {
				if (item.type === "artist" && item.artist) {
					const response = await fetch(
						`/api/events/${eventId}/artists/${item.artist.id}`,
						{
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								performance_order: item.performance_order,
								performance_date: selectedPerformanceDate,
							}),
						}
					);

					if (!response.ok) {
						throw new Error(
							`Failed to update artist ${item.artist.artist_name}`
						);
					}
					return response.json();
				} else if (item.type === "cue" && item.cue) {
					const response = await fetch(
						`/api/events/${eventId}/cues`,
						{
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								id: item.cue.id,
								performance_order: item.performance_order,
								performanceDate: selectedPerformanceDate,
							}),
						}
					);

					if (!response.ok) {
						throw new Error(
							`Failed to update cue ${item.cue.title}`
						);
					}
					return response.json();
				}
			});

			// Wait for all updates to complete
			await Promise.all(updatePromises);

			// Emit WebSocket event for real-time updates
			const wsManager = (window as any).performanceOrderWsManager;
			if (wsManager) {
				wsManager.emit("performance-order-update", {
					eventId,
					action: "reordered",
					performanceDate: selectedPerformanceDate,
					timestamp: new Date().toISOString(),
				});
			}

			toast({
				title: "Order Updated",
				description: "Performance order has been updated",
			});
		} catch (error) {
			console.error("Error moving item:", error);
			// Refresh data to restore correct order
			fetchArtists();

			toast({
				title: "Error updating order",
				description:
					error instanceof Error
						? error.message
						: "Failed to update performance order",
				variant: "destructive",
			});
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
					description: `${newBroadcast.emergency_code.toUpperCase()} alert broadcast to all dashboards`,
				});

				fetchEmergencyBroadcasts();

				// Broadcast via WebSocket to all connected dashboards
				// WebSocket will handle broadcasting to all connected clients
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
					description:
						"Emergency broadcast has been cleared from all dashboards",
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
				<Star
					className={`h-4 w-4 fill-current ${
						colors[rating as keyof typeof colors]
					}`}
				/>
			</div>
		);
	};

	const getRowColorClasses = (status?: ShowOrderItem["status"]) => {
		switch (status) {
			case "completed":
				return "bg-red-50 border-red-200 text-red-800 shadow-sm";
			case "currently_on_stage":
				return "bg-green-50 border-green-200 text-green-800 shadow-sm";
			case "next_on_deck":
				return "bg-blue-50 border-blue-200 text-blue-800 shadow-sm";
			case "not_started":
			default:
				return "bg-white border-gray-200 text-gray-900 shadow-sm"; // Back Stage - White background
		}
	};

	const copyArtistPortalLink = async () => {
		const artistPortalUrl = `${window.location.origin}/artist-register/${eventId}`;
		try {
			await navigator.clipboard.writeText(artistPortalUrl);
			toast({
				title: "Link copied!",
				description: "Artist portal link copied to clipboard",
			});
		} catch (error) {
			console.error("Failed to copy link:", error);
			toast({
				title: "Copy failed",
				description: "Failed to copy link to clipboard",
				variant: "destructive",
			});
		}
	};

	const cueTypes = [
		{ type: "opening" as const, label: "Opening", icon: Play },
		{ type: "countdown" as const, label: "Countdown", icon: Timer },
		{ type: "mc_break" as const, label: "MC Break", icon: Mic },
		{ type: "video_break" as const, label: "Video Break", icon: Video },
		{
			type: "cleaning_break" as const,
			label: "Cleaning Break",
			icon: Trash2,
		},
		{ type: "speech_break" as const, label: "Speech Break", icon: Speaker },
		{
			type: "artist_ending" as const,
			label: "Artist Ending",
			icon: CheckCircle,
		},
		{ type: "animation" as const, label: "Animation", icon: Sparkles },
	];
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading performance order...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
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
									Performance Order
								</h1>
								<p className="text-muted-foreground">
									Assign completed rehearsal artists to show
									order
								</p>
								<div className="flex items-center gap-4 mt-1">
									<div className="flex items-center gap-2">
										<div
											className={`w-2 h-2 rounded-full ${
												wsConnected
													? "bg-green-500"
													: "bg-red-500"
											}`}
										></div>
										<span className="text-xs text-muted-foreground">
											{wsConnected
												? "Real-time updates active"
												: "Connecting..."}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div
											className={`w-2 h-2 rounded-full ${
												cacheInitialized
													? "bg-blue-500"
													: "bg-gray-500"
											}`}
										></div>
										<span className="text-xs text-muted-foreground">
											{cacheInitialized
												? "Cache ready"
												: "Initializing cache..."}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Performance Day Selector */}
							{eventDates.length > 0 && (
								<>
									<Label
										htmlFor="performance-day"
										className="text-sm font-medium whitespace-nowrap"
									>
										Performance Day:
									</Label>
									<Select
										value={selectedPerformanceDate}
										onValueChange={
											setSelectedPerformanceDate
										}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Select performance day" />
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
								</>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={handleManualRefresh}
								disabled={refreshing}
								className="flex items-center gap-2"
							>
								<RefreshCw
									className={`h-4 w-4 ${
										refreshing ? "animate-spin" : ""
									}`}
								/>
								{refreshing ? "Refreshing..." : "Refresh"}
							</Button>
							<Dialog
								open={isEmergencyDialogOpen}
								onOpenChange={setIsEmergencyDialogOpen}
							>
								<DialogTrigger asChild>
									<Button variant="destructive" size="sm">
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
											code to all dashboards
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
							</Dialog>
						</div>
					</div>
				</div>
			</header>

			{/* Quick Access Dashboard Cards */}
			<div className="border-b border-border bg-gray-50">
				<div className="container mx-auto px-4 py-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* DJ Dashboard Card */}
						<Card
							className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white"
							onClick={() =>
								window.open(
									`/stage-manager/events/${eventId}/dj`,
									"_blank"
								)
							}
						>
							<CardHeader>
								<div className="flex items-center">
									<Music className="h-6 w-6 text-green-600 mr-3" />
									<CardTitle className="text-lg text-gray-900">
										DJ Dashboard
									</CardTitle>
								</div>
								<CardDescription className="text-gray-600">
									Access music tracks and performance order
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button className="w-full bg-green-600 hover:bg-green-700 text-white">
									<Music className="h-4 w-4 mr-2" />
									Open DJ Dashboard
								</Button>
							</CardContent>
						</Card>

						{/* MC Dashboard Card */}
						<Card
							className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white"
							onClick={() =>
								window.open(
									`/stage-manager/events/${eventId}/mc`,
									"_blank"
								)
							}
						>
							<CardHeader>
								<div className="flex items-center">
									<Mic className="h-6 w-6 text-yellow-600 mr-3" />
									<CardTitle className="text-lg text-gray-900">
										MC Dashboard
									</CardTitle>
								</div>
								<CardDescription className="text-gray-600">
									View artist info and announcements
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
									<Mic className="h-4 w-4 mr-2" />
									Open MC Dashboard
								</Button>
							</CardContent>
						</Card>

						{/* Live Performance Board Card */}
						<Card
							className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white"
							onClick={() =>
								window.open(
									`/stage-manager/events/${eventId}/live-board`,
									"_blank"
								)
							}
						>
							<CardHeader>
								<div className="flex items-center">
									<ExternalLink className="h-6 w-6 text-red-600 mr-3" />
									<CardTitle className="text-lg text-gray-900">
										Live Performance Board
									</CardTitle>
								</div>
								<CardDescription className="text-gray-600">
									Real-time performance monitoring and
									emergency management
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button className="w-full bg-red-600 hover:bg-red-700 text-white">
									<ExternalLink className="h-4 w-4 mr-2" />
									Open Live Board
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

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
								<Button
									size="sm"
									variant="outline"
									className="bg-white/20 hover:bg-white/30"
									onClick={() =>
										deactivateBroadcast(broadcast.id)
									}
								>
									Clear Alert
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<main className="container mx-auto px-4 py-8">
				{/* Timing Overview Section */}
				<div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Total Show Time
									</p>
									<p className="text-2xl font-bold">
										{formatTotalTime(
											calculateTotalShowTime(
												showOrderItems
											)
										)}
									</p>
								</div>
								<Timer className="h-8 w-8 text-muted-foreground" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Backstage Ready
									</p>
									<p className="text-2xl font-bold">
										{eventTimings.backstage_ready_time ||
											"--:--"}
									</p>
								</div>
								<Clock className="h-8 w-8 text-muted-foreground" />
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
								<div className="flex items-center gap-2">
									<Play className="h-8 w-8 text-muted-foreground" />
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											setShowTimingSettings(true)
										}
									>
										<Settings className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Show Order - Left Side */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="h-5 w-5" />
									Show Order
								</CardTitle>
								<CardDescription>
									Drag and drop to reorder performance lineup
								</CardDescription>
							</CardHeader>
							<CardContent>
								<DragDropContext onDragEnd={handleDragEnd}>
									<Droppable droppableId="showOrder">
										{(provided) => (
											<div
												{...provided.droppableProps}
												ref={provided.innerRef}
												className="space-y-3"
											>
												{showOrderItems.map(
													(item, index) => (
														<Draggable
															key={item.id}
															draggableId={
																item.id
															}
															index={index}
														>
															{(
																provided,
																snapshot
															) => (
																<div
																	ref={
																		provided.innerRef
																	}
																	{...provided.draggableProps}
																	{...provided.dragHandleProps}
																	className={`p-4 rounded-lg border-2 transition-all ${
																		snapshot.isDragging
																			? "shadow-lg scale-105"
																			: "shadow-sm"
																	} ${getRowColorClasses(
																		item.status
																	)} hover:shadow-md`}
																>
																	<div className="flex items-center justify-between">
																		<div className="flex items-center gap-3">
																			<span className="text-sm font-mono bg-muted px-2 py-1 rounded">
																				#
																				{index +
																					1}
																			</span>
																			{item.type ===
																				"artist" &&
																				item.artist && (
																					<div>
																						<div className="font-medium">
																							{
																								item
																									.artist
																									.artist_name
																							}
																						</div>
																						<div className="text-sm text-muted-foreground">
																							{
																								item
																									.artist
																									.style
																							}{" "}
																							•{" "}
																							{getDisplayDuration(
																								item.artist
																							)}
																							{item
																								.artist
																								.quality_rating &&
																								getQualityBadge(
																									item
																										.artist
																										.quality_rating
																								)}
																						</div>
																					</div>
																				)}
																			{item.type ===
																				"cue" &&
																				item.cue && (
																					<div className="flex items-center gap-2">
																						{(() => {
																							const IconComponent =
																								getCueIcon(
																									item.cue!
																										.type
																								);
																							return (
																								<IconComponent className="h-4 w-4" />
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
																								{
																									item
																										.cue
																										.duration
																								}{" "}
																								min
																								{item
																									.cue
																									.notes && (
																									<span className="ml-2">
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

																		<div className="flex items-center gap-2">
																			{eventTimings.show_start_time && (
																				<div className="text-xs text-muted-foreground">
																					{
																						calculateItemTiming(
																							showOrderItems,
																							index,
																							eventTimings.show_start_time
																						)
																							.startTime
																					}{" "}
																					-{" "}
																					{
																						calculateItemTiming(
																							showOrderItems,
																							index,
																							eventTimings.show_start_time
																						)
																							.endTime
																					}
																				</div>
																			)}

																			{/* Status Select */}
																			<div className="flex items-center gap-2">
																				<Select
																					value={
																						item.status ||
																						"not_started"
																					}
																					onValueChange={(
																						value
																					) =>
																						updateItemStatus(
																							item.id,
																							value as ShowOrderItem["status"]
																						)
																					}
																				>
																					<SelectTrigger className="w-[140px] h-8 bg-white border-gray-300 text-gray-900">
																						<SelectValue />
																					</SelectTrigger>
																					<SelectContent>
																						<SelectItem value="not_started">
																							Back
																							Stage
																						</SelectItem>
																						<SelectItem value="next_on_deck">
																							Next
																							on
																							Deck
																						</SelectItem>
																						<SelectItem value="currently_on_stage">
																							Currently
																							on
																							Stage
																						</SelectItem>
																						<SelectItem value="completed">
																							Completed
																						</SelectItem>
																					</SelectContent>
																				</Select>
																			</div>

																			{/* Action Buttons */}
																			<div className="flex gap-1">
																				<Button
																					size="sm"
																					variant="outline"
																					onClick={() =>
																						moveItem(
																							item.id,
																							"up"
																						)
																					}
																					disabled={
																						index ===
																						0
																					}
																				>
																					<ArrowUp className="h-4 w-4" />
																				</Button>
																				<Button
																					size="sm"
																					variant="outline"
																					onClick={() =>
																						moveItem(
																							item.id,
																							"down"
																						)
																					}
																					disabled={
																						index ===
																						showOrderItems.length -
																							1
																					}
																				>
																					<ArrowDown className="h-4 w-4" />
																				</Button>
																				{item.type ===
																					"cue" && (
																					<Button
																						size="sm"
																						variant="outline"
																						onClick={() =>
																							editCue(
																								item.cue!
																							)
																						}
																					>
																						<Edit className="h-4 w-4" />
																					</Button>
																				)}
																				<Button
																					size="sm"
																					variant="destructive"
																					onClick={() =>
																						removeFromShowOrder(
																							item.id,
																							item.type
																						)
																					}
																				>
																					<Trash2 className="h-4 w-4" />
																				</Button>
																			</div>
																		</div>
																	</div>
																</div>
															)}
														</Draggable>
													)
												)}
												{provided.placeholder}
												{showOrderItems.length ===
													0 && (
													<div className="text-center py-8 text-muted-foreground">
														No items in show order
														yet. Add artists or cues
														to get started.
													</div>
												)}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							</CardContent>
						</Card>
					</div>
					{/* Right Side - Completed Artists and Add Cues */}
					<div className="space-y-6">
						{/* Completed Rehearsal Artists */}
						<Card>
							<CardHeader>
								<CardTitle>Completed Rehearsal</CardTitle>
								<CardDescription>
									Artists ready to be assigned to show order
								</CardDescription>
							</CardHeader>
							<CardContent>
								{completedArtists.length === 0 ? (
									<p className="text-muted-foreground text-center py-4">
										No artists have completed rehearsal yet
									</p>
								) : (
									<div className="space-y-3">
										{completedArtists.map((artist) => (
											<div
												key={artist.id}
												className="flex items-center gap-3 p-3 border rounded-lg"
											>
												<div className="flex-1">
													<div className="font-medium">
														{artist.artist_name}
													</div>
													<div className="text-sm text-muted-foreground">
														{artist.style} •{" "}
														{artist.actual_duration && (
															<div className="text-xs text-muted-foreground">
																{formatDuration(
																	artist.actual_duration
																)}
															</div>
														)}
														{artist.quality_rating &&
															getQualityBadge(
																artist.quality_rating
															)}
													</div>
												</div>
												<Button
													size="sm"
													onClick={() =>
														assignToShowOrder(
															artist.id
														)
													}
												>
													Assign to Show Order
												</Button>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Add Cues Section */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Plus className="h-5 w-5" />
									Add Cues
								</CardTitle>
								<CardDescription>
									Add performance cues to the show order
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2">
									{cueTypes.map((cueType) => {
										const IconComponent = cueType.icon;
										return (
											<Button
												key={cueType.type}
												variant="outline"
												size="sm"
												onClick={() =>
													addCue(cueType.type)
												}
												className="flex items-center gap-2 justify-start"
											>
												<IconComponent className="h-4 w-4" />
												{cueType.label}
											</Button>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
				{/* Timing Settings Dialog */}
				<Dialog
					open={showTimingSettings}
					onOpenChange={setShowTimingSettings}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Event Timing Settings</DialogTitle>
							<DialogDescription>
								Set the backstage ready time and show start time
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="backstage-ready">
									Backstage Ready Time
								</Label>
								<Input
									id="backstage-ready"
									type="time"
									value={editForm.backstage_ready_time}
									onChange={(e) =>
										setEditForm({
											...editForm,
											backstage_ready_time:
												e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="show-start">
									Show Start Time
								</Label>
								<Input
									id="show-start"
									type="time"
									value={editForm.show_start_time}
									onChange={(e) =>
										setEditForm({
											...editForm,
											show_start_time: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="flex gap-2 pt-4">
							<Button
								onClick={() =>
									saveEventTimings({
										backstage_ready_time:
											editForm.backstage_ready_time,
										show_start_time:
											editForm.show_start_time,
									})
								}
								className="flex-1"
							>
								Save Timing Settings
							</Button>
							<Button
								variant="outline"
								onClick={() => setShowTimingSettings(false)}
							>
								Cancel
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Cue Edit Dialog */}
				<Dialog
					open={!!editingCue}
					onOpenChange={() => setEditingCue(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Cue</DialogTitle>
							<DialogDescription>
								Edit cue details and timing information
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="cue-title">Title</Label>
								<Input
									id="cue-title"
									value={editForm.title}
									onChange={(e) =>
										setEditForm({
											...editForm,
											title: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cue-duration">
									Duration (minutes)
								</Label>
								<Input
									id="cue-duration"
									type="number"
									value={editForm.duration}
									onChange={(e) =>
										setEditForm({
											...editForm,
											duration:
												parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cue-notes">Notes</Label>
								<Textarea
									id="cue-notes"
									value={editForm.notes}
									onChange={(e) =>
										setEditForm({
											...editForm,
											notes: e.target.value,
										})
									}
									placeholder="Additional notes for this cue"
								/>
							</div>
						</div>
						<div className="flex gap-2 pt-4">
							<Button onClick={saveCueEdit} className="flex-1">
								Save Changes
							</Button>
							<Button
								variant="outline"
								onClick={() => setEditingCue(null)}
							>
								Cancel
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
}
