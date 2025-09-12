"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	NotificationProvider,
	NotificationBell,
} from "@/components/NotificationProvider";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	UserCheck,
	Calendar,
	CheckCircle,
	Eye,
	Trash2,
	Plus,
	Copy,
	X,
	User,
	Music,
	Image,
	Lightbulb,
	Palette,
	Navigation,
	Globe,
	Instagram,
	Facebook,
	Youtube,
	Download,
	Play,
	Phone,
	Mail,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/ui/audio-player";
import { VideoPlayer, ImageViewer } from "@/components/ui/video-player";
import { LazyMediaLoader } from "@/components/ui/lazy-media-loader";
import { ArtistStatusBadge } from "@/components/ui/artist-status-badge";
import { ArtistStatusDialog } from "@/components/ui/artist-status-dialog";
import { formatDateSimple } from "@/lib/date-utils";
import {
	getStatusColorClasses,
	getStatusLabel,
	getStatusBadgeVariant,
} from "@/lib/status-utils";
import { formatDuration } from "@/lib/timing-utils";

interface Event {
	id: string;
	name: string;
	venue: string;
	show_dates: string[];
}

interface Artist {
	id: string;
	artist_name: string;
	real_name: string;
	email: string;
	style: string;
	performance_duration: number;
	performance_date: string | null;
	created_at: string;
	actual_duration: number | null; // Duration from uploaded music in seconds
	status: string | null; // Artist status
}

export default function ArtistManagement() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [loading, setLoading] = useState(true);
	const [wsConnected, setWsConnected] = useState(false);
	const [wsInitialized, setWsInitialized] = useState(false);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const [statusArtist, setStatusArtist] = useState<Artist | null>(null);
	const [newArtist, setNewArtist] = useState({
		artist_name: "",
		real_name: "",
		email: "",
		password: "",
		style: "",
		performance_duration: 15,
		biography: "",
		phone: "",
	});
	const [createdCredentials, setCreatedCredentials] = useState<{
		email: string;
		password: string;
		loginUrl: string;
	} | null>(null);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
			fetchArtists();
			// Initialize WebSocket connection for real-time updates
			initializeWebSocket();
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
		} catch (error) {
			console.error("Error fetching event:", error);
			toast({
				title: "Error",
				description: "Failed to load event details",
				variant: "destructive",
			});
		}
	};

	const fetchArtists = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();

				if (data.success) {
					// Process artists to match sample UI format
					const processedArtists = (data.data || []).map(
						(artist: any) => ({
							id: artist.id,
							artist_name:
								artist.artistName || artist.artist_name,
							real_name: artist.realName || artist.real_name,
							email: artist.email,
							style: artist.style,
							performance_duration:
								artist.performanceDuration ||
								artist.performance_duration,
							performance_date:
								artist.performanceDate ||
								artist.performance_date,
							created_at: artist.createdAt || artist.created_at,
							status: artist.status || "pending",
							actual_duration:
								artist.musicTracks?.find(
									(track: any) => track.is_main_track
								)?.duration || null,
						})
					);

					setArtists(processedArtists);
					console.log(
						`Loaded ${processedArtists.length} artists from GCS for event ${eventId}`
					);
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
				title: "Error",
				description: "Failed to load artist submissions",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
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
				userId: `stage_manager_artists_${eventId}`,
				showToasts: true,
				onConnect: () => {
					console.log("Artists WebSocket connected");
					setWsConnected(true);
				},
				onDisconnect: () => {
					console.log("Artists WebSocket disconnected");
					setWsConnected(false);
				},
				onDataUpdate: () => {
					console.log("Artists data update triggered");
					fetchArtists();
				},
			});

			await wsManager.initialize();

			// Store reference for cleanup and emitting events
			(window as any).artistsWsManager = wsManager;

			// Return cleanup function
			return () => {
				if ((window as any).artistsWsManager) {
					(window as any).artistsWsManager.destroy();
					delete (window as any).artistsWsManager;
				}
				setWsInitialized(false);
			};
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
			setWsInitialized(false);
			throw error;
		}
	};

	const assignPerformanceDate = async (
		artistId: string,
		performanceDate: string | null
	) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						performance_date: performanceDate,
						performanceDate: performanceDate, // Also send both field names for compatibility
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();

				// Update local state immediately for better UX
				setArtists(
					artists.map((artist) =>
						artist.id === artistId
							? { ...artist, performance_date: performanceDate }
							: artist
					)
				);

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).artistsWsManager;
				if (wsManager) {
					wsManager.emit(
						performanceDate
							? "artist_assigned"
							: "artist_unassigned",
						{
							eventId,
							artistId,
							performance_date: performanceDate,
							action: performanceDate ? "assigned" : "unassigned",
						}
					);
				}

				toast({
					title: performanceDate
						? "Performance date assigned"
						: "Artist unassigned",
					description: performanceDate
						? "Artist has been assigned to a performance date and will appear in rehearsal calendar"
						: "Artist has been moved back to submitted applications",
				});

				console.log(
					`Artist ${artistId} assignment updated: ${
						performanceDate
							? "assigned to " + performanceDate
							: "unassigned"
					}`
				);
			} else {
				const errorData = await response.json();
				throw new Error(
					errorData.error?.message ||
						"Failed to update performance date"
				);
			}
		} catch (error: any) {
			console.error("Error updating performance date:", error);
			toast({
				title: "Error updating artist",
				description:
					error.message || "Failed to update performance date",
				variant: "destructive",
			});
		}
	};

	const deleteArtist = async (artistId: string) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				// Update local state immediately for better UX
				setArtists(artists.filter((artist) => artist.id !== artistId));

				// Emit WebSocket event for real-time updates
				const wsManager = (window as any).artistsWsManager;
				if (wsManager) {
					wsManager.emit("artist_deleted", {
						eventId,
						artistId,
						action: "deleted",
					});
				}

				toast({
					title: "Artist deleted",
					description:
						"Artist profile has been removed. They will need to register again.",
				});

				console.log(`Artist ${artistId} deleted successfully`);
			} else {
				const errorData = await response.json();
				throw new Error(
					errorData.error?.message || "Failed to delete artist"
				);
			}
		} catch (error: any) {
			console.error("Error deleting artist:", error);
			toast({
				title: "Error deleting artist",
				description: error.message || "Failed to delete artist profile",
				variant: "destructive",
			});
		}
	};

	const generatePassword = () => {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let password = "";
		for (let i = 0; i < 12; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return password;
	};

	const createArtistManually = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}/artists`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					artistName: newArtist.artist_name,
					realName: newArtist.real_name,
					email: newArtist.email,
					phone: newArtist.phone,
					style: newArtist.style,
					performanceDuration: newArtist.performance_duration,
					biography: newArtist.biography,
					password: newArtist.password,
				}),
			});

			if (response.ok) {
				const result = await response.json();

				// Generate login URL with pre-filled email
				const loginUrl = `${window.location.origin}/artist-dashboard/${result.data.id}`;

				setCreatedCredentials({
					email: newArtist.email,
					password: newArtist.password,
					loginUrl,
				});

				// Reset form
				setNewArtist({
					artist_name: "",
					real_name: "",
					email: "",
					password: "",
					style: "",
					performance_duration: 15,
					biography: "",
					phone: "",
				});

				// Refresh artists list
				fetchArtists();

				toast({
					title: "Artist created successfully",
					description:
						"The artist account has been created with login credentials",
				});
			} else {
				throw new Error("Failed to create artist");
			}
		} catch (error: any) {
			console.error("Error creating artist:", error);
			toast({
				title: "Error creating artist",
				description: error.message || "Failed to create artist account",
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

	const copyCredentials = () => {
		if (!createdCredentials) return;

		const credentialsText = `Artist Login Credentials

Name: ${newArtist.artist_name}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}
Login URL: ${createdCredentials.loginUrl}

Please use these credentials to access your artist dashboard.`;

		navigator.clipboard.writeText(credentialsText);
		toast({
			title: "Credentials copied",
			description: "Login credentials have been copied to clipboard",
		});
	};

	const viewArtistDetails = async (artistId: string) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/artists/${artistId}`
			);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					// Convert the detailed artist data to match our Artist interface
					const artistData = data.data.artist;
					const detailedArtist: Artist = {
						id: artistData.id,
						artist_name:
							artistData.artistName || artistData.artist_name,
						real_name: artistData.realName || artistData.real_name,
						email: artistData.email,
						style: artistData.style,
						performance_duration:
							artistData.performanceDuration ||
							artistData.performance_duration,
						performance_date:
							artistData.performanceDate ||
							artistData.performance_date,
						created_at:
							artistData.createdAt || artistData.created_at,
						status: artistData.status,
						actual_duration:
							artistData.musicTracks?.find(
								(track: any) => track.is_main_track
							)?.duration || null,
						// Add additional detailed data
						...artistData,
					};
					setSelectedArtist(detailedArtist);
					setIsDetailDialogOpen(true);
				}
			} else {
				throw new Error("Failed to fetch artist details");
			}
		} catch (error) {
			console.error("Error fetching artist details:", error);
			toast({
				title: "Error",
				description: "Failed to load artist details",
				variant: "destructive",
			});
		}
	};

	const openStatusDialog = (artist: Artist) => {
		setStatusArtist(artist);
		setIsStatusDialogOpen(true);
	};

	const handleStatusUpdated = (newStatus: string) => {
		if (statusArtist) {
			// Update the artist in the local state
			setArtists((prev) =>
				prev.map((artist) =>
					artist.id === statusArtist.id
						? { ...artist, status: newStatus }
						: artist
				)
			);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading artist submissions...
					</p>
				</div>
			</div>
		);
	}

	const submittedArtists = artists.filter((a) => !a.performance_date);
	const assignedArtists = artists.filter((a) => a.performance_date);

	return (
		<NotificationProvider userRole="stage-manager">
			<div className="min-h-screen bg-background">
				<header className="border-b border-border">
					<div className="container mx-auto px-4 py-4">
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
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-foreground">
									Artist Management
								</h1>
								<p className="text-muted-foreground">
									{event?.name}
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
							{/* <NotificationBell /> */}
						</div>
					</div>
				</header>

				<main className="container mx-auto px-4 py-8">
					<div className="space-y-8">
						{/* Add Artist Manually */}
						<div className="flex justify-end">
							<Button
								className="flex items-center gap-2"
								onClick={() => {
									const registrationUrl = `/artist-register/${eventId}`;
									window.open(
										registrationUrl,
										"_blank",
										"noopener,noreferrer"
									);
								}}
							>
								<Plus className="h-4 w-4" />
								Add Artist Manually
							</Button>
						</div>

						{/* Submitted Applications */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UserCheck className="h-5 w-5" />
									Submitted Applications (
									{submittedArtists.length})
								</CardTitle>
								<CardDescription>
									Artists who have submitted their
									applications but haven't been assigned to a
									performance date yet
								</CardDescription>
							</CardHeader>
							<CardContent>
								{submittedArtists.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										No submitted applications yet
									</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													Artist Name
												</TableHead>
												<TableHead>Real Name</TableHead>
												<TableHead>Style</TableHead>
												<TableHead>Duration</TableHead>
												{/* <TableHead>Status</TableHead> */}
												<TableHead>Submitted</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{submittedArtists.map((artist) => (
												<TableRow key={artist.id}>
													<TableCell className="font-medium">
														{artist.artist_name}
													</TableCell>
													<TableCell>
														{artist.real_name}
													</TableCell>
													<TableCell>
														{artist.style}
													</TableCell>
													<TableCell>
														{/* {
															artist.performance_duration
														}
														min */}
														{artist.actual_duration && (
															<span className="text-muted-foreground ml-1">
																{formatDuration(
																	artist.actual_duration
																)}
															</span>
														)}
													</TableCell>
													{/* <TableCell>
														<ArtistStatusBadge
															status={
																artist.status
															}
														/>
													</TableCell> */}
													<TableCell>
														{new Date(
															artist.created_at
														).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	viewArtistDetails(
																		artist.id
																	)
																}
															>
																<Eye className="h-4 w-4" />
															</Button>
															{/* <Button
																variant="outline"
																size="sm"
																onClick={() =>
																	openStatusDialog(
																		artist
																	)
																}
															>
																<CheckCircle className="h-4 w-4" />
															</Button> */}
															{event?.show_dates &&
																event.show_dates
																	.length >
																	0 && (
																	<Select
																		onValueChange={(
																			value
																		) =>
																			assignPerformanceDate(
																				artist.id,
																				value
																			)
																		}
																	>
																		<SelectTrigger className="w-32">
																			<SelectValue placeholder="Assign" />
																		</SelectTrigger>
																		<SelectContent>
																			{event.show_dates.map(
																				(
																					date
																				) => (
																					<SelectItem
																						key={
																							date
																						}
																						value={
																							date
																						}
																					>
																						{formatDateSimple(
																							date
																						)}
																					</SelectItem>
																				)
																			)}
																		</SelectContent>
																	</Select>
																)}
															<AlertDialog>
																<AlertDialogTrigger
																	asChild
																>
																	<Button
																		variant="outline"
																		size="sm"
																		className="text-destructive hover:text-destructive"
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogHeader>
																		<AlertDialogTitle>
																			Delete
																			Artist
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			Are
																			you
																			sure
																			you
																			want
																			to
																			delete{" "}
																			{
																				artist.artist_name
																			}
																			?
																			This
																			action
																			cannot
																			be
																			undone.
																		</AlertDialogDescription>
																	</AlertDialogHeader>
																	<AlertDialogFooter>
																		<AlertDialogCancel>
																			Cancel
																		</AlertDialogCancel>
																		<AlertDialogAction
																			onClick={() =>
																				deleteArtist(
																					artist.id
																				)
																			}
																			className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																		>
																			Delete
																		</AlertDialogAction>
																	</AlertDialogFooter>
																</AlertDialogContent>
															</AlertDialog>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>

						{/* Assigned Artists - Grouped by Performance Date */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Assigned Artists ({assignedArtists.length})
								</CardTitle>
								<CardDescription>
									Artists who have been assigned to specific
									performance dates
								</CardDescription>
							</CardHeader>
							<CardContent>
								{assignedArtists.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										No artists assigned yet
									</div>
								) : (
									<div className="space-y-8">
										{(() => {
											// Group artists by performance date
											const groupedArtists =
												assignedArtists.reduce(
													(groups, artist) => {
														const date =
															artist.performance_date ||
															"unassigned";
														if (!groups[date]) {
															groups[date] = [];
														}
														groups[date].push(
															artist
														);
														return groups;
													},
													{} as Record<
														string,
														Artist[]
													>
												);

											// Sort dates and create day labels
											const sortedDates = Object.keys(
												groupedArtists
											)
												.filter(
													(date) =>
														date !== "unassigned"
												)
												.sort(
													(a, b) =>
														new Date(a).getTime() -
														new Date(b).getTime()
												);

											return sortedDates.map(
												(date, index) => {
													const dayNumber = index + 1;
													const artistsForDate =
														groupedArtists[date];

													return (
														<div
															key={date}
															className="space-y-4"
														>
															{/* Day Header */}
															<div className="flex items-center gap-4">
																<div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold">
																	Day{" "}
																	{dayNumber}
																</div>
																<div className="text-lg font-medium text-foreground">
																	{formatDateSimple(
																		date
																	)}
																</div>
																<div className="text-sm text-muted-foreground">
																	(
																	{
																		artistsForDate.length
																	}{" "}
																	artist
																	{artistsForDate.length !==
																	1
																		? "s"
																		: ""}
																	)
																</div>
															</div>

															{/* Artists Table for this day */}
															<div className="border rounded-lg">
																<Table>
																	<TableHeader>
																		<TableRow>
																			<TableHead>
																				Artist
																				Name
																			</TableHead>
																			<TableHead>
																				Real
																				Name
																			</TableHead>
																			<TableHead>
																				Style
																			</TableHead>
																			<TableHead>
																				Duration
																			</TableHead>
																			<TableHead>
																				Actions
																			</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{artistsForDate.map(
																			(
																				artist
																			) => (
																				<TableRow
																					key={
																						artist.id
																					}
																				>
																					<TableCell className="font-medium">
																						{
																							artist.artist_name
																						}
																					</TableCell>
																					<TableCell>
																						{
																							artist.real_name
																						}
																					</TableCell>
																					<TableCell>
																						{
																							artist.style
																						}
																					</TableCell>
																					<TableCell>
																						{artist.actual_duration && (
																							<span className="text-muted-foreground">
																								{formatDuration(
																									artist.actual_duration
																								)}
																							</span>
																						)}
																					</TableCell>
																					<TableCell>
																						<div className="flex items-center gap-2">
																							<Button
																								variant="outline"
																								size="sm"
																								onClick={() =>
																									viewArtistDetails(
																										artist.id
																									)
																								}
																							>
																								<Eye className="h-4 w-4" />
																							</Button>
																							<Button
																								variant="outline"
																								size="sm"
																								onClick={() =>
																									assignPerformanceDate(
																										artist.id,
																										null
																									)
																								}
																								title="Unassign from this date"
																							>
																								<X className="h-4 w-4" />
																							</Button>
																							<AlertDialog>
																								<AlertDialogTrigger
																									asChild
																								>
																									<Button
																										variant="outline"
																										size="sm"
																										className="text-destructive hover:text-destructive"
																									>
																										<Trash2 className="h-4 w-4" />
																									</Button>
																								</AlertDialogTrigger>
																								<AlertDialogContent>
																									<AlertDialogHeader>
																										<AlertDialogTitle>
																											Delete
																											Artist
																										</AlertDialogTitle>
																										<AlertDialogDescription>
																											Are
																											you
																											sure
																											you
																											want
																											to
																											delete{" "}
																											{
																												artist.artist_name
																											}

																											?
																											This
																											action
																											cannot
																											be
																											undone.
																										</AlertDialogDescription>
																									</AlertDialogHeader>
																									<AlertDialogFooter>
																										<AlertDialogCancel>
																											Cancel
																										</AlertDialogCancel>
																										<AlertDialogAction
																											onClick={() =>
																												deleteArtist(
																													artist.id
																												)
																											}
																											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																										>
																											Delete
																										</AlertDialogAction>
																									</AlertDialogFooter>
																								</AlertDialogContent>
																							</AlertDialog>
																						</div>
																					</TableCell>
																				</TableRow>
																			)
																		)}
																	</TableBody>
																</Table>
															</div>
														</div>
													);
												}
											);
										})()}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Artist Detail Dialog */}
						<Dialog
							open={isDetailDialogOpen}
							onOpenChange={setIsDetailDialogOpen}
						>
							<DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle>
										Artist Details -{" "}
										{selectedArtist?.artist_name}
									</DialogTitle>
									<DialogDescription>
										Complete artist information, media
										files, and technical requirements
									</DialogDescription>
								</DialogHeader>

								{selectedArtist && (
									<Tabs
										defaultValue="overview"
										className="w-full"
									>
										<TabsList className="grid w-full grid-cols-5">
											<TabsTrigger value="overview">
												Overview
											</TabsTrigger>
											<TabsTrigger value="music">
												Music
											</TabsTrigger>
											<TabsTrigger value="technical">
												Technical
											</TabsTrigger>
											<TabsTrigger value="gallery">
												Gallery
											</TabsTrigger>
											<TabsTrigger value="event">
												Event Details
											</TabsTrigger>
										</TabsList>

										{/* Overview Tab */}
										<TabsContent
											value="overview"
											className="space-y-6"
										>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												{/* Basic Information */}
												<Card>
													<CardHeader>
														<CardTitle className="flex items-center gap-2">
															<User className="h-5 w-5" />
															Basic Information
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-4">
														<div>
															<p className="text-sm text-muted-foreground">
																Artist ID
															</p>
															<p className="font-medium text-xs text-gray-600">
																{
																	selectedArtist.id
																}
															</p>
														</div>
														<div>
															<p className="text-sm text-muted-foreground">
																Artist Name
															</p>
															<p className="font-medium">
																{
																	selectedArtist.artist_name
																}
															</p>
														</div>
														<div>
															<p className="text-sm text-muted-foreground">
																Real Name
															</p>
															<p className="font-medium">
																{
																	selectedArtist.real_name
																}
															</p>
														</div>
														<div className="flex items-center gap-2">
															<Mail className="h-4 w-4 text-muted-foreground" />
															<p className="text-sm">
																{
																	selectedArtist.email
																}
															</p>
														</div>
														{(selectedArtist as any)
															.phone && (
															<div className="flex items-center gap-2">
																<Phone className="h-4 w-4 text-muted-foreground" />
																<p className="text-sm">
																	{
																		(
																			selectedArtist as any
																		).phone
																	}
																</p>
															</div>
														)}
														<div>
															<p className="text-sm text-muted-foreground">
																Performance
																Style
															</p>
															<p className="font-medium">
																{
																	selectedArtist.style
																}
															</p>
														</div>
														{(selectedArtist as any)
															.performanceType && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Performance
																	Type
																</p>
																<p className="font-medium">
																	{
																		(
																			selectedArtist as any
																		)
																			.performanceType
																	}
																</p>
															</div>
														)}
														<div>
															<p className="text-sm text-muted-foreground">
																Duration
															</p>
															<p className="font-medium">
																{
																	selectedArtist.performance_duration
																}{" "}
																minutes
															</p>
														</div>
													</CardContent>
												</Card>

												{/* Biography */}
												<Card>
													<CardHeader>
														<CardTitle>
															Biography
														</CardTitle>
													</CardHeader>
													<CardContent>
														<p className="text-sm leading-relaxed">
															{(
																selectedArtist as any
															).biography ||
																"No biography provided"}
														</p>
													</CardContent>
												</Card>
											</div>

											{/* Social Media Links */}
											{(selectedArtist as any)
												.socialMedia && (
												<Card>
													<CardHeader>
														<CardTitle className="flex items-center gap-2">
															<Globe className="h-5 w-5" />
															Social Media & Links
														</CardTitle>
													</CardHeader>
													<CardContent>
														<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
															{(
																selectedArtist as any
															).socialMedia
																?.instagram && (
																<a
																	href={
																		(
																			selectedArtist as any
																		)
																			.socialMedia
																			.instagram
																	}
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
															{(
																selectedArtist as any
															).socialMedia
																?.facebook && (
																<a
																	href={
																		(
																			selectedArtist as any
																		)
																			.socialMedia
																			.facebook
																	}
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
															{(
																selectedArtist as any
															).socialMedia
																?.youtube && (
																<a
																	href={
																		(
																			selectedArtist as any
																		)
																			.socialMedia
																			.youtube
																	}
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
															{(
																selectedArtist as any
															).socialMedia
																?.website && (
																<a
																	href={
																		(
																			selectedArtist as any
																		)
																			.socialMedia
																			.website
																	}
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
															{(
																selectedArtist as any
															).showLink && (
																<a
																	href={
																		(
																			selectedArtist as any
																		)
																			.showLink
																	}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
																>
																	<Play className="h-4 w-4 text-purple-600" />
																	<span className="text-sm">
																		Demo
																		Video
																	</span>
																</a>
															)}
														</div>
													</CardContent>
												</Card>
											)}
										</TabsContent>

										{/* Music Tab */}
										<TabsContent
											value="music"
											className="space-y-6"
										>
											<Card>
												<CardHeader>
													<CardTitle className="flex items-center gap-2">
														<Music className="h-5 w-5" />
														Music Tracks
													</CardTitle>
													<CardDescription>
														Uploaded music tracks
														for the performance
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="space-y-4">
														{(selectedArtist as any)
															.musicTracks &&
														(selectedArtist as any)
															.musicTracks
															.length > 0 ? (
															(
																selectedArtist as any
															).musicTracks.map(
																(
																	track: any,
																	index: number
																) => (
																	<div
																		key={
																			index
																		}
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
																					-
																					Tempo:{" "}
																					{
																						track.tempo
																					}
																				</p>
																			</div>
																			<div className="flex items-center gap-2">
																				{track.is_main_track && (
																					<Badge variant="secondary">
																						Main
																						Track
																					</Badge>
																				)}
																			</div>
																		</div>
																		{track.notes && (
																			<p className="text-sm text-muted-foreground">
																				{
																					track.notes
																				}
																			</p>
																		)}
																		{track.file_url && (
																			<div className="space-y-2">
																				<AudioPlayer
																					track={
																						track
																					}
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
																No music tracks
																uploaded yet
															</p>
														)}
													</div>
												</CardContent>
											</Card>
										</TabsContent>

										{/* Technical Tab */}
										<TabsContent
											value="technical"
											className="space-y-6"
										>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												{/* Costume & Lighting */}
												<Card>
													<CardHeader>
														<CardTitle className="flex items-center gap-2">
															<Palette className="h-5 w-5" />
															Costume & Lighting
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-4">
														{(selectedArtist as any)
															.costumeColor && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Costume
																	Color
																</p>
																<div className="flex items-center gap-2">
																	<div
																		className="w-6 h-6 rounded border-2 border-muted-foreground/20"
																		style={{
																			backgroundColor:
																				(
																					selectedArtist as any
																				)
																					.costumeColor ===
																				"blue"
																					? "#0000ff"
																					: (
																							selectedArtist as any
																					  )
																							.costumeColor ===
																					  "red"
																					? "#ff0000"
																					: (
																							selectedArtist as any
																					  )
																							.costumeColor ===
																					  "green"
																					? "#00ff00"
																					: (
																							selectedArtist as any
																					  )
																							.costumeColor ===
																					  "black"
																					? "#000000"
																					: (
																							selectedArtist as any
																					  )
																							.costumeColor ===
																					  "white"
																					? "#ffffff"
																					: "#888888",
																		}}
																	></div>
																	<p className="font-medium capitalize">
																		{
																			(
																				selectedArtist as any
																			)
																				.costumeColor
																		}
																	</p>
																</div>
																{(
																	selectedArtist as any
																)
																	.customCostumeColor && (
																	<p className="text-sm text-muted-foreground mt-1">
																		Custom:{" "}
																		{
																			(
																				selectedArtist as any
																			)
																				.customCostumeColor
																		}
																	</p>
																)}
															</div>
														)}
														{((
															selectedArtist as any
														).lightColorSingle ||
															(
																selectedArtist as any
															).lightColorTwo ||
															(
																selectedArtist as any
															)
																.lightColorThree) && (
															<div>
																<p className="text-sm text-muted-foreground mb-2">
																	Lighting
																	Colors
																</p>
																<div className="space-y-2">
																	{(
																		selectedArtist as any
																	)
																		.lightColorSingle && (
																		<div className="flex items-center gap-2">
																			<div className="w-4 h-4 rounded border border-muted-foreground/20 bg-blue-500"></div>
																			<span className="text-sm">
																				Primary:{" "}
																				{
																					(
																						selectedArtist as any
																					)
																						.lightColorSingle
																				}
																			</span>
																		</div>
																	)}
																	{(
																		selectedArtist as any
																	)
																		.lightColorTwo &&
																		(
																			selectedArtist as any
																		)
																			.lightColorTwo !==
																			"none" && (
																			<div className="flex items-center gap-2">
																				<div className="w-4 h-4 rounded border border-muted-foreground/20 bg-green-500"></div>
																				<span className="text-sm">
																					Secondary:{" "}
																					{
																						(
																							selectedArtist as any
																						)
																							.lightColorTwo
																					}
																				</span>
																			</div>
																		)}
																	{(
																		selectedArtist as any
																	)
																		.lightColorThree &&
																		(
																			selectedArtist as any
																		)
																			.lightColorThree !==
																			"none" && (
																			<div className="flex items-center gap-2">
																				<div className="w-4 h-4 rounded border border-muted-foreground/20 bg-red-500"></div>
																				<span className="text-sm">
																					Third:{" "}
																					{
																						(
																							selectedArtist as any
																						)
																							.lightColorThree
																					}
																				</span>
																			</div>
																		)}
																</div>
															</div>
														)}
														{(selectedArtist as any)
															.lightRequests && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Special
																	Lighting
																	Requests
																</p>
																<p className="text-sm">
																	{
																		(
																			selectedArtist as any
																		)
																			.lightRequests
																	}
																</p>
															</div>
														)}
													</CardContent>
												</Card>

												{/* Stage Positioning */}
												<Card>
													<CardHeader>
														<CardTitle className="flex items-center gap-2">
															<Navigation className="h-5 w-5" />
															Stage Positioning
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-4">
														{(selectedArtist as any)
															.stagePositionStart && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Starting
																	Position
																</p>
																<p className="font-medium capitalize">
																	{(
																		selectedArtist as any
																	).stagePositionStart.replace(
																		"-",
																		" "
																	)}
																</p>
															</div>
														)}
														{(selectedArtist as any)
															.stagePositionEnd && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Ending
																	Position
																</p>
																<p className="font-medium capitalize">
																	{(
																		selectedArtist as any
																	).stagePositionEnd.replace(
																		"-",
																		" "
																	)}
																</p>
															</div>
														)}
														{(selectedArtist as any)
															.customStagePosition && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Custom
																	Position
																	Details
																</p>
																<p className="text-sm">
																	{
																		(
																			selectedArtist as any
																		)
																			.customStagePosition
																	}
																</p>
															</div>
														)}
														{(selectedArtist as any)
															.equipment && (
															<div>
																<p className="text-sm text-muted-foreground">
																	Props and
																	Equipment
																</p>
																<p className="text-sm">
																	{
																		(
																			selectedArtist as any
																		)
																			.equipment
																	}
																</p>
															</div>
														)}
													</CardContent>
												</Card>
											</div>

											{/* Notes */}
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<Card>
													<CardHeader>
														<CardTitle>
															MC Notes
														</CardTitle>
													</CardHeader>
													<CardContent>
														<p className="text-sm">
															{(
																selectedArtist as any
															).mcNotes ||
																"No special notes for MC"}
														</p>
													</CardContent>
												</Card>
												<Card>
													<CardHeader>
														<CardTitle>
															Stage Manager Notes
														</CardTitle>
													</CardHeader>
													<CardContent>
														<p className="text-sm">
															{(
																selectedArtist as any
															)
																.stageManagerNotes ||
																"No special notes for stage manager"}
														</p>
													</CardContent>
												</Card>
											</div>
										</TabsContent>

										{/* Gallery Tab */}
										<TabsContent
											value="gallery"
											className="space-y-6"
										>
											<Card>
												<CardHeader>
													<CardTitle className="flex items-center gap-2">
														<Image className="h-5 w-5" />
														Media Gallery
													</CardTitle>
													<CardDescription>
														Uploaded images and
														videos
													</CardDescription>
												</CardHeader>
												<CardContent>
													{(selectedArtist as any)
														.galleryFiles &&
													(selectedArtist as any)
														.galleryFiles.length >
														0 ? (
														<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
															{(
																selectedArtist as any
															).galleryFiles.map(
																(
																	file: any,
																	index: number
																) => (
																	<div
																		key={
																			index
																		}
																		className="relative group"
																	>
																		{file.type ===
																		"image" ? (
																			<ImageViewer
																				file={
																					file
																				}
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
																				file={
																					file
																				}
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
																				{
																					file.name
																				}
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
															No media files
															uploaded yet
														</p>
													)}
												</CardContent>
											</Card>
										</TabsContent>

										{/* Event Details Tab */}
										<TabsContent
											value="event"
											className="space-y-6"
										>
											<Card>
												<CardHeader>
													<CardTitle className="flex items-center gap-2">
														<Calendar className="h-5 w-5" />
														Event Information
													</CardTitle>
												</CardHeader>
												<CardContent className="space-y-4">
													<div>
														<p className="text-sm text-muted-foreground">
															Event Name
														</p>
														<p className="font-medium text-lg">
															{event?.name}
														</p>
													</div>
													<div>
														<p className="text-sm text-muted-foreground">
															Registration Status
														</p>
														<ArtistStatusBadge
															status={
																selectedArtist.status
															}
															className="mt-1"
														/>
													</div>
													{selectedArtist.performance_date && (
														<div>
															<p className="text-sm text-muted-foreground">
																Assigned
																Performance Date
															</p>
															<p className="font-medium">
																{formatDateSimple(
																	selectedArtist.performance_date
																)}
															</p>
														</div>
													)}
													<div>
														<p className="text-sm text-muted-foreground">
															Registration Date
														</p>
														<p className="font-medium">
															{new Date(
																selectedArtist.created_at
															).toLocaleDateString(
																"en-US",
																{
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																}
															)}
														</p>
													</div>
												</CardContent>
											</Card>
										</TabsContent>
									</Tabs>
								)}

								<DialogFooter>
									<Button
										onClick={() =>
											setIsDetailDialogOpen(false)
										}
									>
										Close
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Artist Status Dialog */}
						<ArtistStatusDialog
							open={isStatusDialogOpen}
							onOpenChange={setIsStatusDialogOpen}
							artistId={statusArtist?.id || ""}
							artistName={statusArtist?.artist_name || ""}
							eventId={eventId}
							currentStatus={statusArtist?.status || null}
							onStatusUpdated={handleStatusUpdated}
						/>
					</div>
				</main>
			</div>
		</NotificationProvider>
	);
}
