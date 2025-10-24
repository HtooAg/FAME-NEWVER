"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
	User,
	Music,
	Image,
	Calendar,
	MapPin,
	Phone,
	Mail,
	Globe,
	Instagram,
	Facebook,
	Youtube,
	Edit,
	Download,
	Play,
	Lightbulb,
	Palette,
	Navigation,
	ArrowLeft,
	LogOut,
	Clock,
	Timer,
	AlertTriangle,
	Users,
	Mic,
	Video,
	Speaker,
	Trash2,
	CheckCircle,
	Sparkles,
	RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/ui/audio-player";
import { VideoPlayer, ImageViewer } from "@/components/ui/video-player";
import { formatDuration } from "@/lib/media-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateSimple } from "@/lib/date-utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ArtistProfile {
	id: string;
	artistName: string;
	realName: string;
	email: string;
	phone: string;
	style: string;
	performanceType: string;
	performanceDuration: number;
	biography: string;
	costumeColor: string;
	customCostumeColor: string;
	lightColorSingle: string;
	lightColorTwo: string;
	lightColorThree: string;
	lightRequests: string;
	stagePositionStart: string;
	stagePositionEnd: string;
	customStagePosition: string;
	socialMedia: {
		instagram: string;
		facebook: string;
		youtube: string;
		tiktok: string;
		website: string;
	};
	mcNotes: string;
	stageManagerNotes: string;
	showLink: string;
	musicTracks: Array<{
		song_title: string;
		duration: number;
		notes: string;
		is_main_track: boolean;
		tempo: string;
		file_url: string;
	}>;
	galleryFiles: Array<{
		url: string;
		type: "image" | "video";
		name: string;
	}>;
	eventName: string;
	eventId: string;
	status: string;
	createdAt: string;
	performanceDate?: string;
}

interface LiveBoardArtist {
	id: string;
	artist_name: string;
	style: string;
	image_url?: string;
	performance_order: number | null;
	performance_duration: number;
	actual_duration?: number | null;
	performance_status?: string | null;
	performance_date?: string | null;
	mc_notes?: string | null;
}

interface LiveBoardCue {
	id: string;
	type: string;
	title: string;
	duration: number;
	performance_order: number;
	notes?: string;
	performance_status?: string | null;
}

interface PerformanceItem {
	id: string;
	type: "artist" | "cue";
	artist?: LiveBoardArtist;
	cue?: LiveBoardCue;
	performance_order: number;
	status?: string | null;
}

interface EmergencyBroadcast {
	id: string;
	message: string;
	emergency_code: string;
	is_active: boolean;
	created_at: string;
}

// Helper function to get color style
const getColorStyle = (colorValue: string) => {
	const colorMap: { [key: string]: string } = {
		red: "#ff0000",
		blue: "#0000ff",
		green: "#00ff00",
		amber: "#ffbf00",
		magenta: "#ff00ff",
		cyan: "#00ffff",
		purple: "#800080",
		yellow: "#ffff00",
		white: "#ffffff",
		"warm-white": "#fff8dc",
		"cold-blue": "#add8e6",
		uv: "#9400d3",
		rose: "#ff69b4",
		orange: "#ffa500",
		pink: "#ffc0cb",
		teal: "#008080",
		lavender: "#e6e6fa",
		gold: "#ffd700",
		turquoise: "#40e0d0",
		black: "#000000",
		silver: "#c0c0c0",
		trust: "#888888",
	};
	return colorMap[colorValue] || "#888888";
};

// Helper function to format duration is now imported from media-utils

export default function ArtistDashboard() {
	const router = useRouter();
	const params = useParams();
	const { toast } = useToast();
	const [profile, setProfile] = useState<ArtistProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Live Board state
	const [performanceItems, setPerformanceItems] = useState<PerformanceItem[]>(
		[]
	);
	const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<
		EmergencyBroadcast[]
	>([]);
	const [wsConnected, setWsConnected] = useState(false);
	const [currentTime, setCurrentTime] = useState<Date | null>(null);
	const [eventTimings, setEventTimings] = useState<{
		backstage_ready_time?: string;
		show_start_time?: string;
	}>({});
	const [elapsedTime, setElapsedTime] = useState(0);
	const [currentPerformerIndex, setCurrentPerformerIndex] = useState(0);
	const [availableDates, setAvailableDates] = useState<string[]>([]);
	const [selectedPerformanceDate, setSelectedPerformanceDate] =
		useState<string>("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const artistId = params.artistId as string;

	useEffect(() => {
		if (artistId) {
			fetchArtistProfile();
		} else {
			setError("Invalid artist ID");
			setLoading(false);
		}
	}, [artistId]);

	// Real-time clock update for live board
	useEffect(() => {
		setCurrentTime(new Date());
		const timer = setInterval(() => {
			setCurrentTime(new Date());
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// Reset elapsed time when performer changes
	useEffect(() => {
		setElapsedTime(0);
	}, [currentPerformerIndex]);

	// Fetch event dates when profile is loaded (only once)
	useEffect(() => {
		const loadEventDates = async () => {
			if (!profile?.eventId) return;
			try {
				const response = await fetch(`/api/events/${profile.eventId}`);
				if (response.ok) {
					const data = await response.json();
					const evt = data.data || data.event || data;
					const showDates = evt.show_dates || evt.showDates || [];

					if (showDates.length > 0) {
						setAvailableDates(showDates);
						// Only set default date if no date is currently selected
						if (!selectedPerformanceDate) {
							if (profile.performanceDate) {
								setSelectedPerformanceDate(
									profile.performanceDate
								);
							} else if (showDates.length > 0) {
								setSelectedPerformanceDate(showDates[0]);
							}
						}
					}
				}
			} catch (error) {
				console.error("Error fetching event dates:", error);
			}
		};

		if (profile?.eventId && availableDates.length === 0) {
			loadEventDates();
		}
	}, [
		profile?.eventId,
		profile?.performanceDate,
		selectedPerformanceDate,
		availableDates.length,
	]);

	// Fetch live board data when date is selected
	useEffect(() => {
		const loadLiveBoardData = async () => {
			if (!profile?.eventId || !selectedPerformanceDate) return;

			try {
				const response = await fetch(
					`/api/events/${profile.eventId}/artists`
				);
				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						const artists = (data.data || []).map(
							(artist: any) => ({
								id: artist.id,
								artist_name:
									artist.artistName || artist.artist_name,
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
								performance_order:
									artist.performance_order || null,
								performance_status:
									artist.performance_status || null,
								performance_date:
									artist.performanceDate ||
									artist.performance_date,
								mc_notes: artist.mc_notes,
							})
						);

						const filteredArtists = artists.filter(
							(a: LiveBoardArtist) => {
								if (!a.performance_date) return false;
								const artistDate = a.performance_date.includes(
									"T"
								)
									? a.performance_date.split("T")[0]
									: a.performance_date;
								const selectedDate =
									selectedPerformanceDate.includes("T")
										? selectedPerformanceDate.split("T")[0]
										: selectedPerformanceDate;
								return artistDate === selectedDate;
							}
						);

						const assignedArtists = filteredArtists
							.filter(
								(a: LiveBoardArtist) =>
									a.performance_order !== null ||
									(a.performance_status &&
										a.performance_status !== "not_started")
							)
							.map((artist: LiveBoardArtist) => ({
								id: artist.id,
								type: "artist" as const,
								artist,
								performance_order:
									artist.performance_order || 0,
								status:
									artist.performance_status || "not_started",
							}));

						let cueItems: PerformanceItem[] = [];
						try {
							const cuesResponse = await fetch(
								`/api/events/${profile.eventId}/cues?performanceDate=${selectedPerformanceDate}`
							);
							if (cuesResponse.ok) {
								const cuesResult = await cuesResponse.json();
								if (cuesResult.success) {
									cueItems = cuesResult.data.map(
										(cue: any) => ({
											id: cue.id,
											type: "cue" as const,
											cue: { ...cue },
											performance_order:
												cue.performance_order,
											status:
												cue.performance_status ||
												(cue.is_completed
													? "completed"
													: "not_started"),
										})
									);
								}
							}
						} catch (cueError) {
							console.error("Error fetching cues:", cueError);
						}

						const allItems = [...assignedArtists, ...cueItems].sort(
							(a, b) => a.performance_order - b.performance_order
						);
						setPerformanceItems(allItems);

						const currentIndex = allItems.findIndex(
							(item) => item.status === "currently_on_stage"
						);
						if (currentIndex !== -1) {
							setCurrentPerformerIndex(currentIndex);
						}
					}
				}
			} catch (error) {
				console.error("Error fetching live board data:", error);
			}
		};

		const loadEmergencyBroadcasts = async () => {
			if (!profile?.eventId) return;
			try {
				const response = await fetch(
					`/api/events/${profile.eventId}/emergency-broadcasts`
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

		const loadEventTimings = async () => {
			if (!profile?.eventId) return;
			try {
				const response = await fetch(
					`/api/events/${profile.eventId}/timing-settings`
				);
				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						setEventTimings({
							backstage_ready_time:
								result.data.backstage_ready_time,
							show_start_time: result.data.show_start_time,
						});
					}
				}
			} catch (error) {
				console.error("Error fetching event timings:", error);
			}
		};

		if (profile?.eventId && selectedPerformanceDate) {
			loadLiveBoardData();
			loadEmergencyBroadcasts();
			loadEventTimings();
		}
	}, [profile?.eventId, selectedPerformanceDate, refreshTrigger]);

	// Initialize WebSocket for live board updates
	useEffect(() => {
		if (!profile?.eventId) return;

		let wsManager: any = null;

		const initializeWebSocketManager = async () => {
			try {
				const { createWebSocketManager } = await import(
					"@/lib/websocket-manager"
				);

				wsManager = createWebSocketManager({
					eventId: profile.eventId,
					role: "artist",
					userId: `artist_${artistId}`,
					showToasts: true, // Don't show toasts for artists
					onConnect: () => {
						setWsConnected(true);
					},
					onDisconnect: () => {
						setWsConnected(false);
					},
					onDataUpdate: () => {
						// Trigger a refresh by updating the counter
						setRefreshTrigger((prev) => prev + 1);
					},
				});

				await wsManager.initialize();
				(window as any).artistLiveBoardWsManager = wsManager;
			} catch (error) {
				console.error("Error initializing WebSocket:", error);
				setWsConnected(false);
			}
		};

		initializeWebSocketManager();

		return () => {
			if ((window as any).artistLiveBoardWsManager) {
				(window as any).artistLiveBoardWsManager.destroy();
				delete (window as any).artistLiveBoardWsManager;
			}
		};
	}, [profile?.eventId, artistId]);

	const fetchArtistProfile = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/artists/${artistId}`);
			const data = await response.json();

			if (!response.ok) {
				if (response.status === 404) {
					setError("Artist profile not found");
				} else if (data.success === false) {
					setError(
						data.error?.message || "Failed to load artist profile"
					);
				} else {
					setError("Failed to load artist profile");
				}
				return;
			}

			if (data.success && data.data) {
				setProfile(data.data);
			} else {
				setError("Invalid response format");
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
			setError("Network error occurred");
			toast({
				title: "Error",
				description: "Failed to load your profile",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "approved":
			case "active":
				return "default";
			case "pending":
				return "secondary";
			default:
				return "outline";
		}
	};

	// Live Board helper functions
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

	const formatTimeDisplay = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours}h ${minutes}m ${secs}s`;
	};

	const formatCurrentTime = (date: Date | null) => {
		if (!date) return "--:--:--";
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	};

	const calculateTotalShowTime = () => {
		return performanceItems.reduce((total, item) => {
			if (item.type === "artist" && item.artist) {
				return total + (item.artist.performance_duration || 0);
			} else if (item.type === "cue" && item.cue) {
				return total + (item.cue.duration || 0) * 60;
			}
			return total;
		}, 0);
	};

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
		return Math.max(0, totalRemaining - elapsedTime);
	};

	const getCurrentItem = () => performanceItems[currentPerformerIndex];
	const getNextItem = () => performanceItems[currentPerformerIndex + 1];
	const getOnDeckItem = () => performanceItems[currentPerformerIndex + 2];

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading your dashboard...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="text-xl font-semibold mb-2">Error</h2>
					<p className="text-muted-foreground mb-4">{error}</p>
					<div className="space-x-2">
						<Button onClick={() => router.push("/")}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Home
						</Button>
						<Button variant="outline" onClick={fetchArtistProfile}>
							Try Again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="text-xl font-semibold mb-2">
						No Profile Found
					</h2>
					<p className="text-muted-foreground mb-4">
						Artist profile could not be loaded.
					</p>
					<Button onClick={() => router.push("/")}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Home
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
			{/* Enhanced Header with Logo and Animations */}
			<header className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white shadow-2xl overflow-hidden">
				{/* Animated background elements */}
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
					<div
						className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl animate-pulse"
						style={{ animationDelay: "1s" }}
					></div>
				</div>

				<div className="container mx-auto px-4 py-8 relative z-10">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6 animate-fade-in-up">
							<div className="relative">
								<div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse"></div>
								<div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-3 border border-white/20 shadow-2xl">
									<img
										src="/fame-logo.png"
										alt="FAME Logo"
										className="h-16 w-16 object-contain drop-shadow-2xl"
									/>
								</div>
							</div>
							<div>
								<h1 className="text-4xl font-bold drop-shadow-2xl mb-1">
									Artist Dashboard
								</h1>
								<p className="text-purple-100 text-xl font-medium">
									Welcome back, {profile.artistName}!
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								className="text-white hover:bg-white/20 h-10"
								onClick={() =>
									router.push(`/artist-edit/${profile.id}`)
								}
							>
								<Edit className="h-4 w-4 mr-2" />
								Edit Profile
							</Button>
							<Button
								variant="ghost"
								className="text-white hover:bg-white/20 h-10"
								onClick={() => {
									// Clear artist session
									localStorage.removeItem("artistSession");
									// Redirect to artist login page
									router.push("/artist-login");
								}}
							>
								<LogOut className="h-4 w-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 max-w-6xl">
				<Tabs defaultValue="liveboard" className="w-full">
					<TabsList className="grid w-full grid-cols-6 bg-white rounded-xl shadow-lg  border-2 border-purple-100 mb-8">
						<TabsTrigger
							value="liveboard"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Live Board
						</TabsTrigger>
						<TabsTrigger
							value="overview"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value="music"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Music
						</TabsTrigger>
						<TabsTrigger
							value="technical"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Technical
						</TabsTrigger>
						<TabsTrigger
							value="gallery"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Gallery
						</TabsTrigger>
						<TabsTrigger
							value="event"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
						>
							Event Details
						</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Basic Information */}
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-purple-100 rounded-full p-2">
											<User className="h-5 w-5 text-purple-600" />
										</div>
										<span className="text-gray-900">
											Basic Information
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 pt-6">
									<div>
										<p className="text-sm text-muted-foreground">
											Artist ID
										</p>
										<p className="font-medium text-xs text-gray-600">
											{profile.id}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Artist Name
										</p>
										<p className="font-medium">
											{profile.artistName}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Real Name
										</p>
										<p className="font-medium">
											{profile.realName}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm">
											{profile.email}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm">
											{profile.phone}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Performance Style
										</p>
										<p className="font-medium">
											{profile.style}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Performance Type
										</p>
										<p className="font-medium">
											{profile.performanceType}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Duration
										</p>
										<p className="font-medium">
											{profile.performanceDuration}{" "}
											minutes
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Biography */}
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-pink-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-pink-100 rounded-full p-2">
											<User className="h-5 w-5 text-pink-600" />
										</div>
										<span className="text-gray-900">
											Biography
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6">
									<p className="text-sm leading-relaxed">
										{profile.biography}
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Social Media Links */}
						<Card className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
							<CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 py-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="bg-blue-100 rounded-full p-2">
										<Globe className="h-5 w-5 text-blue-600" />
									</div>
									<span className="text-gray-900">
										Social Media & Links
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6 pt-6">
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									{profile.socialMedia?.instagram && (
										<a
											href={profile.socialMedia.instagram}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
										>
											<Instagram className="h-4 w-4 text-pink-600" />
											<span className="text-sm">
												Instagram
											</span>
										</a>
									)}
									{profile.socialMedia?.facebook && (
										<a
											href={profile.socialMedia.facebook}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
										>
											<Facebook className="h-4 w-4 text-blue-600" />
											<span className="text-sm">
												Facebook
											</span>
										</a>
									)}
									{profile.socialMedia?.youtube && (
										<a
											href={profile.socialMedia.youtube}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
										>
											<Youtube className="h-4 w-4 text-red-600" />
											<span className="text-sm">
												YouTube
											</span>
										</a>
									)}
									{profile.socialMedia?.website && (
										<a
											href={profile.socialMedia.website}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
										>
											<Globe className="h-4 w-4 text-green-600" />
											<span className="text-sm">
												Website
											</span>
										</a>
									)}
									{profile.showLink && (
										<a
											href={profile.showLink}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
										>
											<Play className="h-4 w-4 text-purple-600" />
											<span className="text-sm">
												Demo Video
											</span>
										</a>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Music Tab */}
					<TabsContent value="music" className="space-y-6">
						<Card className="bg-white rounded-2xl shadow-lg border-2 border-pink-100 overflow-hidden hover:shadow-xl transition-all duration-300">
							<CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 py-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="bg-pink-100 rounded-full p-2">
										<Music className="h-5 w-5 text-pink-600" />
									</div>
									<span className="text-gray-900">
										Music Tracks
									</span>
								</CardTitle>
								<CardDescription className="mt-2">
									Your uploaded music tracks for the
									performance
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="space-y-4">
									{profile.musicTracks &&
									profile.musicTracks.length > 0 ? (
										profile.musicTracks.map(
											(track, index) => (
												<div
													key={index}
													className="border rounded-lg p-4 space-y-3"
												>
													<div className="flex items-center justify-between">
														<div>
															<h4 className="font-medium">
																{
																	track.song_title
																}
															</h4>
															<p className="text-sm text-muted-foreground">
																Duration:{" "}
																{formatDuration(
																	track.duration
																)}{" "}
																- Tempo:{" "}
																{track.tempo}
															</p>
														</div>
														<div className="flex items-center gap-2">
															{track.is_main_track && (
																<Badge variant="secondary">
																	Main Track
																</Badge>
															)}
														</div>
													</div>
													{track.file_url && (
														<div className="space-y-2">
															<AudioPlayer
																track={track}
																onError={(
																	error
																) => {
																	console.error(
																		"Audio playback error:",
																		error
																	);
																}}
															/>
															<div className="flex justify-end">
																<Button
																	variant="outline"
																	size="sm"
																	onClick={async () => {
																		const {
																			downloadFile,
																		} =
																			await import(
																				"@/lib/media-utils"
																			);
																		await downloadFile(
																			track.file_url,
																			track.song_title
																		);
																	}}
																	className="flex items-center gap-2"
																>
																	<Download className="h-3 w-3" />
																	Download
																</Button>
															</div>
														</div>
													)}
												</div>
											)
										)
									) : (
										<p className="text-center text-muted-foreground py-8">
											No music tracks uploaded yet
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Technical Tab */}
					<TabsContent value="technical" className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Costume & Lighting */}
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-yellow-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-yellow-100 rounded-full p-2">
											<Palette className="h-5 w-5 text-yellow-600" />
										</div>
										<span className="text-gray-900">
											Costume & Lighting
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 pt-6">
									<div>
										<p className="text-sm text-muted-foreground">
											Costume Color
										</p>
										<div className="flex items-center gap-2">
											<div
												className="w-6 h-6 rounded border-2 border-muted-foreground/20"
												style={{
													backgroundColor:
														getColorStyle(
															profile.costumeColor
														),
												}}
											></div>
											<p className="font-medium capitalize">
												{profile.costumeColor}
											</p>
										</div>
										{profile.customCostumeColor && (
											<p className="text-sm text-muted-foreground mt-1">
												Custom:{" "}
												{profile.customCostumeColor}
											</p>
										)}
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-2">
											Lighting Colors
										</p>
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<div
													className="w-4 h-4 rounded border border-muted-foreground/20"
													style={{
														backgroundColor:
															getColorStyle(
																profile.lightColorSingle
															),
													}}
												></div>
												<span className="text-sm">
													Primary:{" "}
													{profile.lightColorSingle}
												</span>
											</div>
											{profile.lightColorTwo !==
												"none" && (
												<div className="flex items-center gap-2">
													<div
														className="w-4 h-4 rounded border border-muted-foreground/20"
														style={{
															backgroundColor:
																getColorStyle(
																	profile.lightColorTwo
																),
														}}
													></div>
													<span className="text-sm">
														Secondary:{" "}
														{profile.lightColorTwo}
													</span>
												</div>
											)}
											{profile.lightColorThree !==
												"none" && (
												<div className="flex items-center gap-2">
													<div
														className="w-4 h-4 rounded border border-muted-foreground/20"
														style={{
															backgroundColor:
																getColorStyle(
																	profile.lightColorThree
																),
														}}
													></div>
													<span className="text-sm">
														Third:{" "}
														{
															profile.lightColorThree
														}
													</span>
												</div>
											)}
										</div>
									</div>
									{profile.lightRequests && (
										<div>
											<p className="text-sm text-muted-foreground">
												Special Lighting Requests
											</p>
											<p className="text-sm">
												{profile.lightRequests}
											</p>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Stage Positioning */}
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-blue-100 rounded-full p-2">
											<Navigation className="h-5 w-5 text-blue-600" />
										</div>
										<span className="text-gray-900">
											Stage Positioning
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 pt-6">
									<div>
										<p className="text-sm text-muted-foreground">
											Starting Position
										</p>
										<p className="font-medium capitalize">
											{profile.stagePositionStart?.replace(
												"-",
												" "
											) ?? "Not specified"}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Ending Position
										</p>
										<p className="font-medium capitalize">
											{profile.stagePositionEnd?.replace(
												"-",
												" "
											) ?? "Not specified"}
										</p>
									</div>
									{profile.customStagePosition && (
										<div>
											<p className="text-sm text-muted-foreground">
												Custom Position Details
											</p>
											<p className="text-sm">
												{profile.customStagePosition}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Notes */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-green-100 rounded-full p-2">
											<Lightbulb className="h-5 w-5 text-green-600" />
										</div>
										<span className="text-gray-900">
											MC Notes
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6">
									<p className="text-sm">
										{profile.mcNotes ||
											"No special notes for MC"}
									</p>
								</CardContent>
							</Card>
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-teal-100 overflow-hidden hover:shadow-xl transition-all duration-300">
								<CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 py-6">
									<CardTitle className="flex items-center gap-3 text-lg">
										<div className="bg-teal-100 rounded-full p-2">
											<User className="h-5 w-5 text-teal-600" />
										</div>
										<span className="text-gray-900">
											Stage Manager Notes
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-6">
									<p className="text-sm">
										{profile.stageManagerNotes ||
											"No special notes for stage manager"}
									</p>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* Gallery Tab */}
					<TabsContent value="gallery" className="space-y-6">
						<Card className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300">
							<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 py-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="bg-purple-100 rounded-full p-2">
										<Image className="h-5 w-5 text-purple-600" />
									</div>
									<span className="text-gray-900">
										Media Gallery
									</span>
								</CardTitle>
								<CardDescription className="mt-2">
									Your uploaded images and videos
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								{profile.galleryFiles &&
								profile.galleryFiles.length > 0 ? (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{profile.galleryFiles.map(
											(file, index) => (
												<div
													key={index}
													className="relative group"
												>
													{file.type === "image" ? (
														<ImageViewer
															file={file}
															onError={(
																error
															) => {
																console.error(
																	"Image viewer error:",
																	error
																);
															}}
															className="aspect-square"
														/>
													) : (
														<VideoPlayer
															file={file}
															onError={(
																error
															) => {
																console.error(
																	"Video player error:",
																	error
																);
															}}
															className="aspect-square"
														/>
													)}
													<div className="flex items-center justify-between mt-1">
														<p className="text-xs text-muted-foreground truncate flex-1">
															{file.name}
														</p>
														<Button
															variant="ghost"
															size="sm"
															onClick={async () => {
																const {
																	downloadFile,
																} =
																	await import(
																		"@/lib/media-utils"
																	);
																await downloadFile(
																	file.url,
																	file.name
																);
															}}
															className="h-6 w-6 p-0 ml-1"
															title="Download file"
														>
															<Download className="h-3 w-3" />
														</Button>
													</div>
												</div>
											)
										)}
									</div>
								) : (
									<p className="text-center text-muted-foreground py-8">
										No media files uploaded yet
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Live Board Tab */}
					<TabsContent value="liveboard" className="space-y-6">
						{/* Performance Date Selection */}
						{availableDates.length > 1 && (
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-purple-100">
								<CardContent className="pt-6">
									<div className="flex items-center gap-4">
										<Label
											htmlFor="performance-date-select"
											className="text-sm font-medium whitespace-nowrap"
										>
											Performance Date:
										</Label>
										<Select
											value={selectedPerformanceDate}
											onValueChange={
												setSelectedPerformanceDate
											}
										>
											<SelectTrigger
												id="performance-date-select"
												className="w-full max-w-md"
											>
												<SelectValue placeholder="Select performance date" />
											</SelectTrigger>
											<SelectContent>
												{availableDates.map(
													(date, index) => (
														<SelectItem
															key={date}
															value={date}
														>
															Day {index + 1} -{" "}
															{formatDateSimple(
																date
															)}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Emergency Broadcasts */}
						{emergencyBroadcasts.length > 0 && (
							<div className="space-y-2">
								{emergencyBroadcasts.map((broadcast) => (
									<div
										key={broadcast.id}
										className={`p-4 rounded-xl ${getEmergencyColor(
											broadcast.emergency_code
										)} shadow-lg`}
									>
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
								))}
							</div>
						)}

						{/* Real-Time Clock and Timing Overview */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<Card className="bg-white rounded-2xl shadow-lg border-2 border-blue-100">
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

							<Card className="bg-white rounded-2xl shadow-lg border-2 border-purple-100">
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

							<Card className="bg-white rounded-2xl shadow-lg border-2 border-orange-100">
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

							<Card className="bg-white rounded-2xl shadow-lg border-2 border-green-100">
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

						{/* Current Performance Status */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Now Performing - GREEN */}
							<Card className="bg-green-500 text-white rounded-2xl shadow-xl">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-5 w-5" />
										NOW PERFORMING
									</CardTitle>
								</CardHeader>
								<CardContent>
									{getCurrentItem() ? (
										<div className="text-center space-y-4">
											{getCurrentItem()?.type ===
												"artist" &&
											getCurrentItem()?.artist ? (
												<>
													<Avatar className="h-24 w-24 mx-auto border-2 border-white">
														<AvatarImage
															src={
																getCurrentItem()
																	?.artist
																	?.image_url
															}
															alt={
																getCurrentItem()
																	?.artist
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
																getCurrentItem()
																	?.artist
																	?.artist_name
															}
														</h3>
														<p className="text-white/80">
															{
																getCurrentItem()
																	?.artist
																	?.style
															}
														</p>
														<Badge className="mt-2 bg-white text-green-500">
															Position{" "}
															{currentPerformerIndex +
																1}
														</Badge>
													</div>
												</>
											) : getCurrentItem()?.type ===
													"cue" &&
											  getCurrentItem()?.cue ? (
												<>
													<div className="h-24 w-24 mx-auto border-2 border-white rounded-full flex items-center justify-center bg-white text-green-500">
														{(() => {
															const IconComponent =
																getCueIcon(
																	getCurrentItem()
																		?.cue
																		?.type ||
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
																getCurrentItem()
																	?.cue?.title
															}
														</h3>
														<p className="text-white/80">
															{
																getCurrentItem()
																	?.cue
																	?.duration
															}{" "}
															minutes
														</p>
														<Badge className="mt-2 bg-white text-green-500">
															Position{" "}
															{currentPerformerIndex +
																1}
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
							<Card className="bg-yellow-400 text-black rounded-2xl shadow-xl">
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
																getNextItem()
																	?.artist
																	?.image_url
															}
															alt={
																getNextItem()
																	?.artist
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
																getNextItem()
																	?.artist
																	?.artist_name
															}
														</h3>
														<p className="text-black/80">
															{
																getNextItem()
																	?.artist
																	?.style
															}
														</p>
														<Badge className="mt-2 bg-black text-yellow-400">
															Position{" "}
															{currentPerformerIndex +
																2}
														</Badge>
													</div>
												</>
											) : getNextItem()?.type === "cue" &&
											  getNextItem()?.cue ? (
												<>
													<div className="h-20 w-20 mx-auto border-2 border-black rounded-full flex items-center justify-center bg-black text-yellow-400">
														{(() => {
															const IconComponent =
																getCueIcon(
																	getNextItem()
																		?.cue
																		?.type ||
																		""
																);
															return (
																<IconComponent className="h-10 w-10" />
															);
														})()}
													</div>
													<div>
														<h3 className="text-xl font-bold">
															{
																getNextItem()
																	?.cue?.title
															}
														</h3>
														<p className="text-black/80">
															{
																getNextItem()
																	?.cue
																	?.duration
															}{" "}
															minutes
														</p>
														<Badge className="mt-2 bg-black text-yellow-400">
															Position{" "}
															{currentPerformerIndex +
																2}
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
							<Card className="bg-blue-500 text-white rounded-2xl shadow-xl">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-5 w-5" />
										ON DECK
									</CardTitle>
								</CardHeader>
								<CardContent>
									{getOnDeckItem() ? (
										<div className="text-center space-y-4">
											{getOnDeckItem()?.type ===
												"artist" &&
											getOnDeckItem()?.artist ? (
												<>
													<Avatar className="h-16 w-16 mx-auto border-2 border-white">
														<AvatarImage
															src={
																getOnDeckItem()
																	?.artist
																	?.image_url
															}
															alt={
																getOnDeckItem()
																	?.artist
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
																getOnDeckItem()
																	?.artist
																	?.artist_name
															}
														</h3>
														<p className="text-white/80">
															{
																getOnDeckItem()
																	?.artist
																	?.style
															}
														</p>
														<Badge className="mt-2 bg-white text-blue-500">
															Position{" "}
															{currentPerformerIndex +
																3}
														</Badge>
													</div>
												</>
											) : getOnDeckItem()?.type ===
													"cue" &&
											  getOnDeckItem()?.cue ? (
												<>
													<div className="h-16 w-16 mx-auto border-2 border-white rounded-full flex items-center justify-center bg-white text-blue-500">
														{(() => {
															const IconComponent =
																getCueIcon(
																	getOnDeckItem()
																		?.cue
																		?.type ||
																		""
																);
															return (
																<IconComponent className="h-8 w-8" />
															);
														})()}
													</div>
													<div>
														<h3 className="text-lg font-bold">
															{
																getOnDeckItem()
																	?.cue?.title
															}
														</h3>
														<p className="text-white/80">
															{
																getOnDeckItem()
																	?.cue
																	?.duration
															}{" "}
															minutes
														</p>
														<Badge className="mt-2 bg-white text-blue-500">
															Position{" "}
															{currentPerformerIndex +
																3}
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
						<Card className="bg-white rounded-2xl shadow-lg border-2 border-purple-100">
							<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<Users className="h-5 w-5" />
										Complete Performance Order
									</CardTitle>
									<div className="flex items-center gap-2">
										<div
											className={`w-2 h-2 rounded-full ${
												wsConnected
													? "bg-green-500 animate-pulse"
													: "bg-red-500"
											}`}
										></div>
										<span className="text-xs text-muted-foreground">
											{wsConnected ? "Live" : "Offline"}
										</span>
									</div>
								</div>
								<CardDescription>
									Full lineup for tonight's show
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
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
												className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
													isCurrent
														? "bg-green-50 border-green-500"
														: isCompleted
														? "bg-red-50 border-red-500"
														: isNext
														? "bg-yellow-50 border-yellow-400"
														: isOnDeck
														? "bg-blue-50 border-blue-500"
														: "bg-white border-gray-200"
												}`}
											>
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
															<div className="text-sm text-muted-foreground">
																{
																	item.artist
																		.style
																}
															</div>
														</div>
													</>
												) : item.type === "cue" &&
												  item.cue ? (
													<>
														<div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
															{(() => {
																const IconComponent =
																	getCueIcon(
																		item.cue
																			?.type ||
																			""
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
															<div className="text-sm text-muted-foreground">
																{item.cue.type.replace(
																	"_",
																	" "
																)}{" "}
																•{" "}
																{
																	item.cue
																		.duration
																}{" "}
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
															? "bg-green-500 text-white"
															: isCompleted
															? "bg-red-500 text-white"
															: isNext
															? "bg-yellow-400 text-black"
															: isOnDeck
															? "bg-blue-500 text-white"
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
											Check back later for the performance
											schedule
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Event Details Tab */}
					<TabsContent value="event" className="space-y-6">
						<Card className="bg-white rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden hover:shadow-xl transition-all duration-300">
							<CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 py-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="bg-indigo-100 rounded-full p-2">
										<Calendar className="h-5 w-5 text-indigo-600" />
									</div>
									<span className="text-gray-900">
										Event Information
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 pt-6">
								<div>
									<p className="text-sm text-muted-foreground">
										Event Name
									</p>
									<p className="font-medium text-lg">
										{profile.eventName}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Registration Status
									</p>
									<Badge
										variant={getStatusBadgeVariant(
											profile.status
										)}
										className="mt-1"
									>
										{profile.status
											.charAt(0)
											.toUpperCase() +
											profile.status.slice(1)}
									</Badge>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Registration Date
									</p>
									<p className="font-medium">
										{new Date(
											profile.createdAt
										).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
								<div className="pt-4">
									<Button
										onClick={() =>
											router.push(
												`/artist-edit/${profile.id}`
											)
										}
										className="w-full"
									>
										<Edit className="h-4 w-4 mr-2" />
										Edit Profile
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
