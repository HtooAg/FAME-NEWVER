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
	ArrowLeft,
	Calendar,
	Clock,
	GripVertical,
	Star,
	CheckCircle,
	RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDropdown, formatDateSimple } from "@/lib/date-utils";
import {
	getStatusColorClasses,
	getStatusLabel,
	getStatusBadgeVariant,
} from "@/lib/status-utils";
import { formatDuration, getDisplayDuration } from "@/lib/timing-utils";
import { createWebSocketManager } from "@/lib/websocket-manager";

interface Event {
	id: string;
	name: string;
	venue: string;
	show_dates: string[];
}

interface Artist {
	id: string;
	artist_name: string;
	style: string;
	performance_duration: number;
	actual_duration: number | null;
	quality_rating: number | null;
	rehearsal_date: string | null;
	rehearsal_order: number | null;
	is_confirmed: boolean;
	performance_date: string | null;
	rehearsal_completed: boolean;
}

export default function RehearsalSchedule() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [wsConnected, setWsConnected] = useState(false);
	const [wsInitialized, setWsInitialized] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
			fetchArtists();
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

	// Initialize WebSocket manager for real-time updates
	useEffect(() => {
		let wsManager: any = null;

		const initializeWebSocketManager = async () => {
			try {
				wsManager = createWebSocketManager({
					eventId,
					role: "rehearsal",
					userId: `rehearsal_${eventId}`,
					showToasts: true,
					onConnect: () => {
						console.log("Rehearsal WebSocket connected");
						setWsConnected(true);
						setWsInitialized(true);
					},
					onDisconnect: () => {
						console.log("Rehearsal WebSocket disconnected");
						setWsConnected(false);
					},
					onDataUpdate: () => {
						console.log("Rehearsal data update triggered");
						fetchArtists();
					},
				});

				await wsManager.initialize();

				// Store reference for cleanup
				(window as any).rehearsalWsManager = wsManager;
			} catch (error) {
				console.error(
					"Error initializing Rehearsal WebSocket manager:",
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
			if ((window as any).rehearsalWsManager) {
				(window as any).rehearsalWsManager.destroy();
				delete (window as any).rehearsalWsManager;
			}
		};
	}, [eventId]);

	// Debug effect to log artists state changes
	useEffect(() => {
		console.log(
			"Artists state updated:",
			artists.map((a) => ({
				id: a.id,
				name: a.artist_name,
				rehearsal_order: a.rehearsal_order,
				rehearsal_date: a.rehearsal_date,
			}))
		);
	}, [artists]);

	// Auto-normalize orders only when adding new artists to prevent conflicts
	const autoNormalizeIfNeeded = async () => {
		if (!selectedDate || artists.length === 0) return;

		const scheduledArtists = artists.filter(
			(a) =>
				a.rehearsal_date === selectedDate && a.rehearsal_order !== null
		);

		if (scheduledArtists.length > 1) {
			const orders = scheduledArtists.map((a) => a.rehearsal_order);
			const hasDuplicates = orders.length !== new Set(orders).size;

			if (hasDuplicates) {
				console.log(
					"Auto-fixing duplicate orders after artist addition..."
				);
				setTimeout(() => {
					// normalizeRehearsalOrders();
				}, 1000);
			}
		}
	};

	// Add visibility change listener to refresh data when user returns to page
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && eventId) {
				console.log(
					"Page became visible, refreshing rehearsal data from GCS..."
				);
				fetchArtists();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange
			);
		};
	}, [eventId]);

	// Add focus listener to refresh data when user returns to window
	useEffect(() => {
		const handleFocus = () => {
			if (eventId) {
				console.log(
					"Window focused, refreshing rehearsal data from GCS..."
				);
				fetchArtists();
			}
		};

		window.addEventListener("focus", handleFocus);

		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const res = await fetch(`/api/events/${eventId}`);
			if (!res.ok) throw new Error("Failed to fetch event");
			const json = await res.json();
			const evt = json.data || json.event || json; // tolerate shapes
			const showDates = evt.show_dates || evt.showDates || [];
			setEvent({
				id: String(evt.id),
				name: evt.name,
				venue: evt.venue,
				show_dates: showDates,
			});

			// Set first show date as default
			if (showDates.length > 0) {
				setSelectedDate(showDates[0]);
			}
		} catch (error) {
			console.error("Error fetching event:", error);
			toast({
				title: "Error fetching event",
				description: "Failed to load event details",
				variant: "destructive",
			});
		}
	};

	const fetchArtists = async (showRefreshIndicator = false) => {
		try {
			if (showRefreshIndicator) {
				setRefreshing(true);
			}

			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();

				if (data.success) {
					// Filter only assigned artists and map to expected format
					const assignedArtists = (data.data || [])
						.filter(
							(artist: any) =>
								artist.performanceDate ||
								artist.performance_date
						)
						.map((artist: any) => {
							console.log(`Mapping artist ${artist.id}:`, {
								rehearsal_date: artist.rehearsal_date,
								rehearsal_order: artist.rehearsal_order,
								rehearsal_completed: artist.rehearsal_completed,
								quality_rating: artist.quality_rating,
							});

							return {
								id: artist.id,
								artist_name:
									artist.artistName || artist.artist_name,
								style: artist.style,
								performance_duration:
									artist.performanceDuration ||
									artist.performance_duration ||
									5,
								actual_duration:
									artist.musicTracks?.find(
										(track: any) => track.is_main_track
									)?.duration || null,
								quality_rating: artist.quality_rating || null,
								rehearsal_date: artist.rehearsal_date || null,
								rehearsal_order: artist.rehearsal_order || null,
								is_confirmed: artist.is_confirmed || false,
								performance_date:
									artist.performanceDate ||
									artist.performance_date,
								rehearsal_completed:
									artist.rehearsal_completed || false,
							};
						});
					setArtists(assignedArtists);
					console.log(
						`Loaded ${assignedArtists.length} assigned artists for rehearsal scheduling from GCS`
					);

					if (showRefreshIndicator) {
						toast({
							title: "Data refreshed",
							description:
								"Rehearsal data updated from Google Cloud Storage",
						});
					}
				} else {
					console.error("Failed to fetch artists:", data.error);
					setArtists([]);
				}
			} else {
				throw new Error("Failed to fetch artists");
			}
		} catch (error) {
			console.error("Error fetching artists:", error);
			toast({
				title: "Error fetching artists",
				description: "Failed to load artist list",
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

	const initializeWebSocket = async () => {
		// Prevent multiple initializations
		if (wsInitialized) {
			console.log("WebSocket already initialized, skipping...");
			return () => {};
		}

		setWsInitialized(true);

		try {
			// Import and initialize WebSocket manager
			const { createWebSocketManager } = await import(
				"@/lib/websocket-manager"
			);

			const wsManager = createWebSocketManager({
				eventId,
				role: "stage_manager",
				userId: `stage_manager_rehearsal_${eventId}`,
				showToasts: true,
				onConnect: () => {
					console.log("Rehearsal WebSocket connected");
					setWsConnected(true);
				},
				onDisconnect: () => {
					console.log("Rehearsal WebSocket disconnected");
					setWsConnected(false);
				},
				onDataUpdate: () => {
					console.log("Rehearsal data update triggered");
					fetchArtists();
				},
			});

			await wsManager.initialize();

			// Store reference for cleanup and emitting events
			(window as any).rehearsalWsManager = wsManager;

			// Return cleanup function
			return () => {
				if ((window as any).rehearsalWsManager) {
					(window as any).rehearsalWsManager.destroy();
					delete (window as any).rehearsalWsManager;
				}
				setWsInitialized(false);
			};
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
			setWsInitialized(false);
			throw error;
		}
	};

	const updateQualityRating = async (artistId: string, rating: number) => {
		try {
			console.log(
				`Updating quality rating for artist ${artistId}: ${rating}`
			);

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ quality_rating: rating }),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("Quality rating API response:", result);

				setArtists(
					artists.map((artist) =>
						artist.id === artistId
							? { ...artist, quality_rating: rating }
							: artist
					)
				);

				toast({
					title: "Quality rating updated",
					description: "Artist quality rating has been saved to GCS",
				});

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).rehearsalWsManager;
				if (wsManager) {
					wsManager.emit("artist_quality_rating_updated", {
						eventId,
						artistId: artistId,
						artist_name: artists.find((a) => a.id === artistId)
							?.artist_name,
						quality_rating: rating,
						timestamp: new Date().toISOString(),
					});
				}

				// Refresh data from GCS to ensure consistency
				setTimeout(() => {
					fetchArtists();
				}, 1000);
			} else {
				const errorData = await response.json();
				console.error("API Error:", errorData);
				throw new Error(
					errorData.error?.message || "Failed to update rating"
				);
			}
		} catch (error: any) {
			console.error("Error updating quality rating:", error);
			toast({
				title: "Error updating rating",
				description: error.message || "Failed to update quality rating",
				variant: "destructive",
			});
		}
	};

	// Simple function to add artist to rehearsal schedule
	const addArtistToRehearsal = async (artistId: string) => {
		try {
			// Get current scheduled artists for this date
			const currentScheduled = artists.filter(
				(a) =>
					a.rehearsal_date === selectedDate &&
					a.rehearsal_order !== null
			);

			// Calculate next order number
			const nextOrder = currentScheduled.length + 1;

			console.log(
				`Adding artist ${artistId} to rehearsal with order ${nextOrder}`
			);

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						rehearsal_date: selectedDate,
						rehearsal_order: nextOrder,
					}),
				}
			);

			if (response.ok) {
				await fetchArtists();
				toast({
					title: "Artist added to rehearsal",
					description: "Artist has been scheduled for rehearsal",
				});
			} else {
				throw new Error("Failed to add artist to rehearsal");
			}
		} catch (error) {
			console.error("Error adding artist to rehearsal:", error);
			toast({
				title: "Error",
				description: "Failed to add artist to rehearsal schedule",
				variant: "destructive",
			});
		}
	};

	// Simple function to remove artist from rehearsal schedule
	const removeArtistFromRehearsal = async (artistId: string) => {
		try {
			console.log(`Removing artist ${artistId} from rehearsal schedule`);

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						rehearsal_date: null,
						rehearsal_order: null,
					}),
				}
			);

			if (response.ok) {
				await fetchArtists();
				toast({
					title: "Artist removed from rehearsal",
					description:
						"Artist has been removed from rehearsal schedule",
				});
			} else {
				throw new Error("Failed to remove artist from rehearsal");
			}
		} catch (error) {
			console.error("Error removing artist from rehearsal:", error);
			toast({
				title: "Error",
				description: "Failed to remove artist from rehearsal",
				variant: "destructive",
			});
		}
	};

	const toggleRehearsalStatus = async (
		artistId: string,
		currentStatus: boolean
	) => {
		try {
			const newStatus = !currentStatus;
			console.log(
				`Toggling rehearsal status for artist ${artistId}: ${currentStatus} -> ${newStatus}`
			);

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ rehearsal_completed: newStatus }),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("Rehearsal status API response:", result);

				setArtists(
					artists.map((artist) =>
						artist.id === artistId
							? { ...artist, rehearsal_completed: newStatus }
							: artist
					)
				);

				toast({
					title: newStatus
						? "Rehearsal completed"
						: "Rehearsal marked as uncompleted",
					description: newStatus
						? "Artist is now ready for performance order and saved to GCS"
						: "Artist removed from performance order queue and saved to GCS",
				});

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).rehearsalWsManager;
				if (wsManager) {
					wsManager.emit("rehearsal_updated", {
						eventId,
						artistId,
						action: newStatus ? "completed" : "uncompleted",
						rehearsal_completed: newStatus,
					});
				}

				// Refresh data from GCS to ensure consistency
				setTimeout(() => {
					fetchArtists();
				}, 1000);

				console.log(
					`Artist ${artistId} rehearsal status updated: ${
						newStatus ? "completed" : "uncompleted"
					}`
				);
			} else {
				const errorData = await response.json();
				console.error("API Error:", errorData);
				throw new Error(
					errorData.error?.message ||
						"Failed to update rehearsal status"
				);
			}
		} catch (error: any) {
			console.error("Error updating rehearsal status:", error);
			toast({
				title: "Error updating rehearsal status",
				description:
					error.message || "Failed to update rehearsal status",
				variant: "destructive",
			});
		}
	};

	// Helper function to format duration
	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "N/A";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const scheduleRehearsal = async (
		artistId: string,
		date: string,
		order: number
	) => {
		try {
			console.log(`Scheduling rehearsal for artist ${artistId}:`, {
				rehearsal_date: date,
				rehearsal_order: order,
			});

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						rehearsal_date: date,
						rehearsal_order: order,
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("Rehearsal scheduling API response:", result);

				// Update local state immediately
				setArtists(
					artists.map((artist) =>
						artist.id === artistId
							? {
									...artist,
									rehearsal_date: date,
									rehearsal_order: order,
							  }
							: artist
					)
				);

				toast({
					title: "Rehearsal scheduled",
					description: "Rehearsal date and order saved to GCS",
				});

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).rehearsalWsManager;
				if (wsManager) {
					wsManager.emit("rehearsal_updated", {
						eventId,
						artistId,
						action: "scheduled",
						rehearsal_date: date,
						rehearsal_order: order,
					});
				}

				// Refresh data from GCS to ensure consistency
				setTimeout(() => {
					fetchArtists();
				}, 1000);

				console.log(
					`Rehearsal scheduled for artist ${artistId}: ${date}, order ${order}`
				);
			} else {
				const errorData = await response.json();
				console.error("API Error:", errorData);
				throw new Error(
					errorData.error?.message || "Failed to schedule rehearsal"
				);
			}
		} catch (error: any) {
			console.error("Error scheduling rehearsal:", error);
			toast({
				title: "Error scheduling rehearsal",
				description: error.message || "Failed to schedule rehearsal",
				variant: "destructive",
			});
		}
	};

	const moveArtist = (artistId: string, direction: "up" | "down") => {
		const scheduledArtists = artists.filter(
			(a) =>
				a.rehearsal_date === selectedDate && a.rehearsal_order !== null
		);
		const currentIndex = scheduledArtists.findIndex(
			(a) => a.id === artistId
		);

		if (currentIndex === -1) return;

		const newIndex =
			direction === "up" ? currentIndex - 1 : currentIndex + 1;
		if (newIndex < 0 || newIndex >= scheduledArtists.length) return;

		// Simple swap orders
		const currentArtist = scheduledArtists[currentIndex];
		const swapArtist = scheduledArtists[newIndex];

		scheduleRehearsal(
			currentArtist.id,
			selectedDate,
			swapArtist.rehearsal_order!
		);
		scheduleRehearsal(
			swapArtist.id,
			selectedDate,
			currentArtist.rehearsal_order!
		);
	};

	const moveUnscheduledArtist = (
		artistId: string,
		direction: "up" | "down"
	) => {
		// Get artists for the selected date first
		const artistsForDate = artists.filter((a) => {
			if (!selectedDate) return false;
			return a.performance_date === selectedDate;
		});
		const filteredUnscheduled = artistsForDate.filter(
			(a) => !a.rehearsal_date
		);
		const currentIndex = filteredUnscheduled.findIndex(
			(a) => a.id === artistId
		);
		if (currentIndex === -1) return;

		const newIndex =
			direction === "up" ? currentIndex - 1 : currentIndex + 1;
		if (newIndex < 0 || newIndex >= filteredUnscheduled.length) return;

		// Swap in artists array
		const newArtists = [...artists];
		const artistsToSwap = newArtists.filter(
			(a) => a.performance_date === selectedDate && !a.rehearsal_date
		);
		const currentArtist = artistsToSwap[currentIndex];
		const swapArtist = artistsToSwap[newIndex];

		const currentArtistIndex = newArtists.findIndex(
			(a) => a.id === currentArtist.id
		);
		const swapArtistIndex = newArtists.findIndex(
			(a) => a.id === swapArtist.id
		);

		[newArtists[currentArtistIndex], newArtists[swapArtistIndex]] = [
			newArtists[swapArtistIndex],
			newArtists[currentArtistIndex],
		];

		setArtists(newArtists);
	};

	const addToRehearsalOrder = (artistId: string) => {
		const scheduledForDate = artists.filter(
			(a) =>
				a.rehearsal_date === selectedDate && a.rehearsal_order !== null
		);

		// Always use the count + 1 to ensure unique sequential ordering
		const nextOrder = scheduledForDate.length + 1;

		console.log(
			`Adding artist ${artistId} to rehearsal with order ${nextOrder}`
		);
		scheduleRehearsal(artistId, selectedDate, nextOrder);
	};

	const removeFromRehearsal = async (artistId: string) => {
		try {
			console.log(`Removing artist ${artistId} from rehearsal schedule`);

			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						rehearsal_date: null,
						rehearsal_order: null,
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("Remove from rehearsal API response:", result);

				setArtists(
					artists.map((artist) =>
						artist.id === artistId
							? {
									...artist,
									rehearsal_date: null,
									rehearsal_order: null,
							  }
							: artist
					)
				);

				toast({
					title: "Removed from rehearsal",
					description:
						"Artist removed from rehearsal schedule and saved to GCS",
				});

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).rehearsalWsManager;
				if (wsManager) {
					wsManager.emit("rehearsal_updated", {
						eventId,
						artistId,
						action: "removed",
						rehearsal_date: null,
						rehearsal_order: null,
					});
				}

				// Refresh data from GCS to ensure consistency
				setTimeout(() => {
					fetchArtists();
				}, 1000);

				console.log(
					`Artist ${artistId} removed from rehearsal schedule`
				);
			} else {
				const errorData = await response.json();
				console.error("API Error:", errorData);
				throw new Error(
					errorData.error?.message ||
						"Failed to remove from rehearsal"
				);
			}
		} catch (error: any) {
			console.error("Error removing from rehearsal:", error);
			toast({
				title: "Error removing from rehearsal",
				description:
					error.message || "Failed to remove artist from rehearsal",
				variant: "destructive",
			});
		}
	};

	const renderStarRating = (
		artistId: string,
		currentRating: number | null
	) => {
		return (
			<div className="flex items-center gap-1">
				{[3, 2, 1].map((starValue) => {
					const isActive = currentRating === starValue;
					const colors = {
						1: "text-green-500",
						2: "text-yellow-500",
						3: "text-blue-500",
					};

					return (
						<button
							key={starValue}
							onClick={() =>
								updateQualityRating(artistId, starValue)
							}
							className="hover:scale-110 transition-transform"
						>
							<Star
								className={`h-4 w-4 ${
									isActive
										? `fill-current ${
												colors[
													starValue as keyof typeof colors
												]
										  }`
										: "text-gray-300 hover:text-gray-400"
								}`}
							/>
						</button>
					);
				})}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading rehearsal schedule...
					</p>
				</div>
			</div>
		);
	}

	// Filter artists based on selected rehearsal date
	const artistsForSelectedDate = artists.filter((a) => {
		if (!selectedDate) return false;
		// Show artists who have a performance date matching the selected show date
		return a.performance_date === selectedDate;
	});

	const unscheduledArtists = artistsForSelectedDate.filter(
		(a) => a.rehearsal_date === null || a.rehearsal_date !== selectedDate
	);
	const scheduledArtists = artistsForSelectedDate
		.filter(
			(a) =>
				a.rehearsal_date !== null && a.rehearsal_date === selectedDate
		)
		.sort((a, b) => (a.rehearsal_order || 0) - (b.rehearsal_order || 0));

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
									Rehearsal Schedule
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
											? "Real-time updates active"
											: "Connecting..."}
									</span>
								</div>
							</div>
						</div>
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
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Calendar className="h-8 w-8 text-blue-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-muted-foreground">
										Assigned Artists
									</p>
									<p className="text-2xl font-bold text-foreground">
										{artists.length}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Clock className="h-8 w-8 text-yellow-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-muted-foreground">
										Scheduled for Rehearsal
									</p>
									<p className="text-2xl font-bold text-foreground">
										{
											artists.filter(
												(a) => a.rehearsal_date
											).length
										}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<CheckCircle className="h-8 w-8 text-green-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-muted-foreground">
										Rehearsals Completed
									</p>
									<p className="text-2xl font-bold text-foreground">
										{
											artists.filter(
												(a) => a.rehearsal_completed
											).length
										}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Date Selection & Scheduled Artists */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Rehearsal Date
								</CardTitle>
								<CardDescription>
									Select a show date to schedule rehearsals
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Select
									value={selectedDate}
									onValueChange={setSelectedDate}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select rehearsal date" />
									</SelectTrigger>
									<SelectContent>
										{event?.show_dates?.map((date) => (
											<SelectItem key={date} value={date}>
												{formatDateForDropdown(date)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</CardContent>
						</Card>

						{selectedDate && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-5 w-5" />
										Rehearsal Schedule -{" "}
										{formatDateSimple(selectedDate)}
									</CardTitle>
									<CardDescription>
										Artists scheduled for rehearsal in order
									</CardDescription>
								</CardHeader>
								<CardContent>
									{scheduledArtists.length === 0 ? (
										<p className="text-muted-foreground text-center py-4">
											No artists scheduled for rehearsal
											yet
										</p>
									) : (
										<div className="space-y-3">
											{scheduledArtists.map(
												(artist, index) => (
													<div
														key={artist.id}
														className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50"
													>
														<div className="flex items-center gap-2">
															<span className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">
																#{index + 1}
															</span>
														</div>
														<div className="flex-1">
															<div className="font-medium">
																{
																	artist.artist_name
																}
															</div>
															<div className="text-sm text-muted-foreground">
																{/* {artist.style} •{" "}
																{
																	artist.performance_duration
																}{" "}
																min */}
																{artist.actual_duration && (
																	<span className="text-muted-foreground ml-1">
																		(
																		{formatDuration(
																			artist.actual_duration
																		)}
																		)
																	</span>
																)}
															</div>
														</div>
														<div className="flex items-center gap-2">
															{artist.rehearsal_completed && (
																<Badge
																	variant="secondary"
																	className="flex items-center gap-1"
																>
																	<CheckCircle className="h-3 w-3" />
																	Completed
																</Badge>
															)}
															{renderStarRating(
																artist.id,
																artist.quality_rating
															)}
															<div className="flex gap-1">
																{/* <Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		moveArtist(
																			artist.id,
																			"up"
																		)
																	}
																	disabled={
																		index ===
																		0
																	}
																>
																	↑
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		moveArtist(
																			artist.id,
																			"down"
																		)
																	}
																	disabled={
																		index ===
																		scheduledArtists.length -
																			1
																	}
																>
																	↓
																</Button> */}
																<Button
																	size="sm"
																	variant={
																		artist.rehearsal_completed
																			? "secondary"
																			: "default"
																	}
																	onClick={() =>
																		toggleRehearsalStatus(
																			artist.id,
																			artist.rehearsal_completed
																		)
																	}
																>
																	{artist.rehearsal_completed
																		? "Completed"
																		: "Mark Complete"}
																</Button>
																<Button
																	size="sm"
																	variant="destructive"
																	onClick={() =>
																		removeFromRehearsal(
																			artist.id
																		)
																	}
																>
																	Remove
																</Button>
															</div>
														</div>
													</div>
												)
											)}
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>

					{/* Available Artists */}
					<div className="space-y-6">
						{selectedDate && (
							<Card>
								<CardHeader>
									<CardTitle>
										Available Artists -{" "}
										{formatDateSimple(selectedDate)}
									</CardTitle>
									<CardDescription>
										Artists assigned to this show date but
										not yet scheduled for rehearsal
									</CardDescription>
								</CardHeader>
								<CardContent>
									{unscheduledArtists.length === 0 ? (
										<p className="text-muted-foreground text-center py-4">
											All artists for this date are
											scheduled for rehearsal
										</p>
									) : (
										<div className="space-y-3">
											{unscheduledArtists.map(
												(artist, index) => (
													<div
														key={artist.id}
														className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
													>
														<div className="flex-1">
															<div className="font-medium">
																{
																	artist.artist_name
																}
															</div>
															<div className="text-sm text-muted-foreground">
																{/* {artist.style} •{" "}
																{
																	artist.performance_duration
																}{" "}
																min */}
																{artist.actual_duration && (
																	<span className="text-muted-foreground ml-1">
																		(
																		{formatDuration(
																			artist.actual_duration
																		)}
																		)
																	</span>
																)}
															</div>
														</div>
														<div className="flex items-center gap-2">
															<div className="flex gap-1">
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		moveUnscheduledArtist(
																			artist.id,
																			"up"
																		)
																	}
																	disabled={
																		index ===
																		0
																	}
																>
																	↑
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		moveUnscheduledArtist(
																			artist.id,
																			"down"
																		)
																	}
																	disabled={
																		index ===
																		unscheduledArtists.length -
																			1
																	}
																>
																	↓
																</Button>
																<Button
																	size="sm"
																	onClick={() =>
																		addToRehearsalOrder(
																			artist.id
																		)
																	}
																	disabled={
																		!selectedDate
																	}
																>
																	Schedule
																</Button>
															</div>
														</div>
													</div>
												)
											)}
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
