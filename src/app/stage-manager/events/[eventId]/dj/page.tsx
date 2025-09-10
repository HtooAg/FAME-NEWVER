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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Music,
	Clock,
	ArrowLeft,
	Upload,
	Calendar,
	Star,
	CheckCircle,
	Timer,
	Mic,
	Video,
	Trash2,
	Speaker,
	Sparkles,
	AlertTriangle,
	RefreshCw,
	Download,
	FileMusic,
	Volume2,
	Save,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateSimple, formatDateForDropdown } from "@/lib/date-utils";
import {
	getStatusColorClasses,
	getStatusLabel,
	getStatusBadgeVariant,
} from "@/lib/status-utils";
import { formatDuration, getDisplayDuration } from "@/lib/timing-utils";
import { createWebSocketManager } from "@/lib/websocket-manager";
import { AudioPlayer } from "@/components/ui/audio-player";
import { downloadFile, detectAudioDuration } from "@/lib/media-utils";

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
	id?: string;
	artist_id?: string;
	artist_name?: string;
	song_title: string;
	duration: number;
	file_url: string;
	file_path?: string;
	is_main_track: boolean;
	tempo: string;
	notes: string;
	dj_notes?: string;
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

	const [event, setEvent] = useState<Event | null>(null);
	const [showOrderItems, setShowOrderItems] = useState<ShowOrderItem[]>([]);
	const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [eventDates, setEventDates] = useState<string[]>([]);
	const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<
		EmergencyBroadcast[]
	>([]);
	const [wsConnected, setWsConnected] = useState(false);
	const [downloadingAll, setDownloadingAll] = useState(false);
	const [expandedArtists, setExpandedArtists] = useState<string[]>([]);
	const [djNotesState, setDjNotesState] = useState<{ [key: string]: string }>(
		{}
	);
	const [uploadingTracks, setUploadingTracks] = useState<{
		[key: string]: boolean;
	}>({});
	const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

	useEffect(() => {
		if (eventId) {
			fetchEventData();
			fetchEventDates();
			fetchEmergencyBroadcasts();
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
		if (selectedPerformanceDate) {
			fetchPerformanceOrder();
		}
	}, [selectedPerformanceDate]);

	// Initialize WebSocket manager for real-time updates
	useEffect(() => {
		let wsManager: any = null;

		const initializeWebSocketManager = async () => {
			try {
				wsManager = createWebSocketManager({
					eventId,
					role: "dj",
					userId: `dj_${eventId}`,
					showToasts: true,
					onConnect: () => {
						console.log("DJ WebSocket connected");
						setWsConnected(true);
					},
					onDisconnect: () => {
						console.log("DJ WebSocket disconnected");
						setWsConnected(false);
					},
					onDataUpdate: () => {
						console.log("DJ data update triggered");
						fetchPerformanceOrder();
						fetchEmergencyBroadcasts();
					},
				});

				await wsManager.initialize();

				// Store reference for cleanup
				(window as any).djWsManager = wsManager;
			} catch (error) {
				console.error(
					"Error initializing DJ WebSocket manager:",
					error
				);
				setWsConnected(false);
			}
		};

		if (eventId && selectedPerformanceDate) {
			initializeWebSocketManager();
		}

		// Cleanup on unmount
		return () => {
			if ((window as any).djWsManager) {
				(window as any).djWsManager.destroy();
				delete (window as any).djWsManager;
			}
		};
	}, [eventId, selectedPerformanceDate]);

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

	const fetchPerformanceOrder = useCallback(async () => {
		if (!selectedPerformanceDate) return;

		try {
			setLoading(true);

			// Fetch artists from GCS
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
						const performanceDate =
							a.performance_date || (a as any).performanceDate;

						if (!performanceDate) {
							return false;
						}

						let artistDate: string;
						try {
							if (typeof performanceDate === "string") {
								if (performanceDate.includes("T")) {
									artistDate = performanceDate.split("T")[0];
								} else if (
									performanceDate.includes("-") &&
									performanceDate.length === 10
								) {
									artistDate = performanceDate;
								} else {
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
	}, [eventId, selectedPerformanceDate, toast]);

	const fetchMusicTracks = async (artistIds: string[]) => {
		try {
			// Fetch all artists to get their music tracks
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					const allTracks: MusicTrack[] = [];

					data.data.forEach((artist: any) => {
						if (
							artist.musicTracks &&
							artistIds.includes(artist.id)
						) {
							const tracks = artist.musicTracks.map(
								(track: any) => ({
									...track,
									artist_id: artist.id,
									artist_name:
										artist.artistName || artist.artist_name,
								})
							);
							allTracks.push(...tracks);
						}
					});

					setMusicTracks(allTracks);
				}
			}
		} catch (error) {
			console.error("Error fetching music tracks:", error);
		}
	};

	const getArtistTracks = (artistId: string) => {
		return musicTracks.filter((track) => track.artist_id === artistId);
	};

	// Download all music from all performances
	const downloadAllMusic = async () => {
		setDownloadingAll(true);
		try {
			const tracksWithFiles = musicTracks.filter(
				(track) =>
					track.file_url &&
					!track.song_title.toLowerCase().includes("cue") // Exclude cue tracks
			);

			if (tracksWithFiles.length === 0) {
				toast({
					title: "No music files",
					description: "No music files available for download",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Downloading music",
				description: `Starting download of ${tracksWithFiles.length} tracks...`,
			});

			// Download each track
			for (const track of tracksWithFiles) {
				try {
					const filename = `${track.artist_name || "Unknown"} - ${
						track.song_title
					}`;
					await downloadFile(track.file_url, filename);

					// Small delay between downloads to prevent overwhelming the browser
					await new Promise((resolve) => setTimeout(resolve, 500));
				} catch (error) {
					console.error(
						`Failed to download ${track.song_title}:`,
						error
					);
				}
			}

			toast({
				title: "Download complete",
				description: `Downloaded ${tracksWithFiles.length} music files`,
			});
		} catch (error) {
			console.error("Error downloading all music:", error);
			toast({
				title: "Download failed",
				description: "Failed to download music files",
				variant: "destructive",
			});
		} finally {
			setDownloadingAll(false);
		}
	};

	// Save DJ notes
	const saveDjNotes = async (artistId: string) => {
		try {
			const notes = djNotesState[artistId] || "";

			// Update artist with DJ notes
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						dj_notes: notes,
					}),
				}
			);

			if (response.ok) {
				toast({
					title: "Notes saved",
					description: "DJ notes have been saved successfully",
				});

				// Refresh data
				fetchPerformanceOrder();
			} else {
				throw new Error("Failed to save notes");
			}
		} catch (error) {
			console.error("Error saving DJ notes:", error);
			toast({
				title: "Save failed",
				description: "Failed to save DJ notes",
				variant: "destructive",
			});
		}
	};

	// Delete music track
	const deleteTrack = async (artistId: string, trackIndex: number) => {
		try {
			// Get current artist data
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`
			);
			if (!response.ok) throw new Error("Failed to fetch artist");

			const artistData = await response.json();
			const updatedTracks = [...(artistData.data.musicTracks || [])];
			updatedTracks.splice(trackIndex, 1);

			// Update artist with modified tracks
			const updateResponse = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						musicTracks: updatedTracks,
					}),
				}
			);

			if (updateResponse.ok) {
				toast({
					title: "Track deleted",
					description: "Music track has been deleted successfully",
				});

				// Refresh data
				fetchPerformanceOrder();
			} else {
				throw new Error("Failed to delete track");
			}
		} catch (error) {
			console.error("Error deleting track:", error);
			toast({
				title: "Delete failed",
				description: "Failed to delete music track",
				variant: "destructive",
			});
		}
	};

	// Upload new music track
	const uploadNewTrack = async (
		artistId: string,
		file: File,
		title: string
	) => {
		try {
			setUploadingTracks((prev) => ({ ...prev, [artistId]: true }));

			const formData = new FormData();
			formData.append("file", file);
			formData.append("type", "music");

			// Upload file
			const uploadResponse = await fetch(
				`/api/events/${eventId}/upload`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!uploadResponse.ok) throw new Error("Failed to upload file");

			const uploadResult = await uploadResponse.json();

			// Detect duration
			const duration = await detectAudioDuration(file);

			// Get current artist data
			const artistResponse = await fetch(
				`/api/events/${eventId}/artists/${artistId}`
			);
			if (!artistResponse.ok) throw new Error("Failed to fetch artist");

			const artistData = await artistResponse.json();
			const updatedTracks = [...(artistData.data.musicTracks || [])];

			// Add new track
			updatedTracks.push({
				song_title: title,
				duration: duration,
				file_url: uploadResult.url,
				file_path: uploadResult.path,
				is_main_track: updatedTracks.length === 0,
				tempo: "",
				notes: "",
			});

			// Update artist with new track
			const updateResponse = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						musicTracks: updatedTracks,
					}),
				}
			);

			if (updateResponse.ok) {
				toast({
					title: "Track uploaded",
					description:
						"New music track has been uploaded successfully",
				});

				// Refresh data
				fetchPerformanceOrder();
				return true;
			} else {
				throw new Error("Failed to update artist");
			}
		} catch (error) {
			console.error("Error uploading track:", error);
			toast({
				title: "Upload failed",
				description: "Failed to upload music track",
				variant: "destructive",
			});
			return false;
		} finally {
			setUploadingTracks((prev) => ({ ...prev, [artistId]: false }));
		}
	};

	// Emergency broadcast functions
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
					role: "dj",
					userId: `dj_${eventId}`,
					showToasts: true,
					onConnect: () => {
						console.log(
							"DJ WebSocket connected - Real-time mode active"
						);
						setWsConnected(true);
						// Initial data fetch when connected
						if (selectedPerformanceDate) {
							fetchPerformanceOrder();
						}
						fetchEmergencyBroadcasts();
					},
					onDisconnect: () => {
						console.log("DJ WebSocket disconnected");
						setWsConnected(false);
					},
					onDataUpdate: () => {
						console.log("DJ WebSocket data update received");
						setLastUpdateTime(new Date().toLocaleTimeString());

						// Use setTimeout to ensure functions are available
						setTimeout(() => {
							if (selectedPerformanceDate) {
								console.log(
									"Refreshing DJ performance order via WebSocket..."
								);
								fetchPerformanceOrder();
							}
							console.log(
								"Refreshing DJ emergency broadcasts via WebSocket..."
							);
							fetchEmergencyBroadcasts();
						}, 100);
					},
				});

				await wsManager.initialize();

				// Store reference for cleanup
				(window as any).djWsManager = wsManager;
			} catch (error) {
				console.error(
					"Error initializing DJ WebSocket manager:",
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
			if ((window as any).djWsManager) {
				(window as any).djWsManager.destroy();
				delete (window as any).djWsManager;
			}
		};
	}, [eventId, fetchPerformanceOrder, fetchEmergencyBroadcasts]);

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

	// Using imported status utilities
	const getRowColorClasses = (status?: string | null) => {
		return `${getStatusColorClasses(status)} shadow-md border-2`;
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
			opening: Music,
			countdown: Timer,
			artist_ending: CheckCircle,
			animation: Sparkles,
		};
		return iconMap[cueType];
	};

	// Clean Upload Component - No auto-refresh interference with WebSocket-only mode
	const ArtistUploadSection = ({ artist }: { artist: Artist }) => {
		const [title, setTitle] = useState("");
		const [file, setFile] = useState<File | null>(null);
		const [isUploading, setIsUploading] = useState(false);
		const fileInputRef = useRef<HTMLInputElement>(null);

		const handleUpload = async () => {
			if (!file || !title.trim()) {
				toast({
					title: "Missing information",
					description:
						"Please provide both track title and audio file",
					variant: "destructive",
				});
				return;
			}

			setIsUploading(true);

			try {
				const success = await uploadNewTrack(
					artist.id,
					file,
					title.trim()
				);

				if (success) {
					// Clear form after successful upload
					setTitle("");
					setFile(null);
					if (fileInputRef.current) {
						fileInputRef.current.value = "";
					}

					toast({
						title: "Upload successful",
						description: `"${title}" has been uploaded successfully`,
					});
				}
			} catch (error) {
				console.error("Upload error:", error);
				toast({
					title: "Upload failed",
					description: "Failed to upload track. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsUploading(false);
			}
		};

		const clearForm = () => {
			setTitle("");
			setFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		};

		return (
			<Card className="mt-4 border-2 border-dashed border-muted-foreground/25">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm flex items-center gap-2">
							<Upload className="h-4 w-4" />
							Upload New Track
						</CardTitle>
						{(title.trim() || file) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearForm}
								className="text-muted-foreground hover:text-foreground"
							>
								Clear
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor={`track-title-${artist.id}`}>
							Track Title *
						</Label>
						<Input
							id={`track-title-${artist.id}`}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter track title"
							className="focus:ring-2 focus:ring-primary"
							disabled={isUploading}
						/>
					</div>

					<div>
						<Label htmlFor={`track-file-${artist.id}`}>
							Audio File *
						</Label>
						<Input
							ref={fileInputRef}
							id={`track-file-${artist.id}`}
							type="file"
							accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
							onChange={(e) =>
								setFile(e.target.files?.[0] || null)
							}
							className="focus:ring-2 focus:ring-primary"
							disabled={isUploading}
						/>
						{file && (
							<div className="mt-2 p-2 bg-muted rounded-md">
								<p className="text-sm font-medium text-foreground">
									Selected: {file.name}
								</p>
								<p className="text-xs text-muted-foreground">
									Size: {(file.size / 1024 / 1024).toFixed(2)}{" "}
									MB
								</p>
							</div>
						)}
					</div>

					<div className="flex gap-2">
						<Button
							onClick={handleUpload}
							disabled={!file || !title.trim() || isUploading}
							className="flex-1"
						>
							{isUploading ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="h-4 w-4 mr-2" />
									Upload Track
								</>
							)}
						</Button>

						{(title.trim() || file) && (
							<Button
								variant="outline"
								onClick={clearForm}
								disabled={isUploading}
							>
								Cancel
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		);
	};

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
						<div className="flex items-center gap-4">
							<Button
								onClick={downloadAllMusic}
								disabled={
									downloadingAll || musicTracks.length === 0
								}
								variant="outline"
								className="flex items-center gap-2"
							>
								{downloadingAll ? (
									<>
										<RefreshCw className="h-4 w-4 animate-spin" />
										Downloading...
									</>
								) : (
									<>
										<Download className="h-4 w-4" />
										Download All Music
									</>
								)}
							</Button>
							{selectedPerformanceDate && (
								<Badge
									variant="outline"
									className="flex items-center gap-1"
								>
									<Calendar className="h-3 w-3" />
									{formatDateForDropdown(
										selectedPerformanceDate
									)}
								</Badge>
							)}
						</div>
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
								<Accordion
									type="multiple"
									className="space-y-4"
								>
									{filteredItems.map((item, index) => (
										<Card
											key={item.id}
											className={`transition-all duration-200 ${getRowColorClasses(
												item.status
											)}`}
										>
											{item.type === "artist" &&
											item.artist ? (
												<AccordionItem
													value={item.id}
													className="border-none"
												>
													<AccordionTrigger className="px-6 py-4 hover:no-underline">
														<div className="flex items-center justify-between w-full mr-4">
															<div className="flex items-center space-x-4">
																<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
																	{index + 1}
																</div>
																<div className="text-left">
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
																		{item
																			.artist
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
															</div>
														</div>
													</AccordionTrigger>
													<AccordionContent className="px-6 pb-6">
														<div className="space-y-6">
															{/* Music Tracks Section */}
															<div>
																<h4 className="font-medium mb-4 flex items-center gap-2">
																	<FileMusic className="h-4 w-4" />
																	Music Tracks
																	& Timing
																</h4>
																{(() => {
																	const artistTracks =
																		getArtistTracks(
																			item.artist!
																				.id
																		);
																	return artistTracks.length ===
																		0 ? (
																		<Card className="p-4">
																			<div className="text-center text-muted-foreground">
																				<FileMusic className="h-8 w-8 mx-auto mb-2 opacity-50" />
																				<p>
																					No
																					music
																					tracks
																					uploaded
																				</p>
																			</div>
																		</Card>
																	) : (
																		<div className="space-y-3">
																			{artistTracks.map(
																				(
																					track,
																					trackIndex
																				) => (
																					<Card
																						key={
																							trackIndex
																						}
																						className="p-4"
																					>
																						<div className="flex items-center justify-between mb-3">
																							<div className="flex items-center gap-3">
																								<h5 className="font-medium">
																									{
																										track.song_title
																									}
																								</h5>
																								<Badge
																									variant={
																										track.is_main_track
																											? "default"
																											: "outline"
																									}
																								>
																									{track.is_main_track
																										? "Main Track"
																										: "Additional"}
																								</Badge>
																							</div>
																							<Button
																								variant="destructive"
																								size="sm"
																								onClick={() => {
																									if (
																										confirm(
																											`Delete "${track.song_title}"?`
																										)
																									) {
																										deleteTrack(
																											item.artist!
																												.id,
																											trackIndex
																										);
																									}
																								}}
																							>
																								<Trash2 className="h-4 w-4 mr-1" />
																								Delete
																							</Button>
																						</div>

																						{track.file_url ? (
																							<AudioPlayer
																								track={
																									track
																								}
																							/>
																						) : (
																							<div className="bg-muted/50 rounded-lg p-3">
																								<div className="flex items-center gap-2 text-muted-foreground">
																									<AlertTriangle className="h-4 w-4" />
																									<span className="text-sm">
																										No
																										audio
																										file
																										uploaded
																									</span>
																								</div>
																							</div>
																						)}

																						<div className="grid grid-cols-2 gap-4 mt-3 text-sm">
																							<div>
																								<Label className="text-xs text-muted-foreground">
																									Tempo
																								</Label>
																								<p className="font-medium">
																									{track.tempo ||
																										"Not specified"}
																								</p>
																							</div>
																							<div>
																								<Label className="text-xs text-muted-foreground">
																									Duration
																								</Label>
																								<p className="font-medium">
																									{formatDuration(
																										track.duration
																									)}
																								</p>
																							</div>
																						</div>

																						{track.notes && (
																							<div className="mt-3 p-3 bg-muted rounded-lg">
																								<Label className="text-xs text-muted-foreground">
																									Artist
																									Notes
																								</Label>
																								<p className="text-sm mt-1">
																									{
																										track.notes
																									}
																								</p>
																							</div>
																						)}
																					</Card>
																				)
																			)}
																		</div>
																	);
																})()}
															</div>

															{/* DJ Notes Section */}
															<div>
																<h4 className="font-medium mb-4 flex items-center gap-2">
																	<Volume2 className="h-4 w-4" />
																	DJ Notes
																</h4>
																<div className="space-y-3">
																	<Textarea
																		value={
																			djNotesState[
																				item.artist!
																					.id
																			] ||
																			""
																		}
																		onChange={(
																			e
																		) =>
																			setDjNotesState(
																				(
																					prev
																				) => ({
																					...prev,
																					[item.artist!
																						.id]:
																						e
																							.target
																							.value,
																				})
																			)
																		}
																		placeholder="Add your DJ notes, cues, and timing information here..."
																		className="min-h-[100px]"
																	/>
																	<Button
																		onClick={() =>
																			saveDjNotes(
																				item.artist!
																					.id
																			)
																		}
																		size="sm"
																	>
																		<Save className="h-4 w-4 mr-2" />
																		Save DJ
																		Notes
																	</Button>
																</div>
															</div>

															{/* Upload New Track Section */}
															<div>
																<h4 className="font-medium mb-4 flex items-center gap-2">
																	<Upload className="h-4 w-4" />
																	Upload New
																	Track
																</h4>
																<ArtistUploadSection
																	artist={
																		item.artist
																	}
																/>
															</div>
														</div>
													</AccordionContent>
												</AccordionItem>
											) : (
												// Cue items (non-expandable)
												<CardContent className="p-6">
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-4">
															<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
																{index + 1}
															</div>
															{item.type ===
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
													</div>
												</CardContent>
											)}
										</Card>
									))}
								</Accordion>
							);
						})()}
					</div>
				</div>
			</main>
		</div>
	);
}
