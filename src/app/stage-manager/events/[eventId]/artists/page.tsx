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
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/ui/audio-player";
import { VideoPlayer, ImageViewer } from "@/components/ui/video-player";
import { LazyMediaLoader } from "@/components/ui/lazy-media-loader";
import { ArtistStatusBadge } from "@/components/ui/artist-status-badge";
import { ArtistStatusDialog } from "@/components/ui/artist-status-dialog";
import { formatDateSimple } from "@/lib/date-utils";

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
			const cleanup = initializeWebSocket();

			// Cleanup function
			return () => {
				if (cleanup) {
					cleanup();
				}
			};
		}
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

	const initializeWebSocket = () => {
		// Prevent multiple initializations
		if (wsInitialized) {
			console.log("WebSocket already initialized, skipping...");
			return () => {};
		}

		setWsInitialized(true);

		// Initialize WebSocket connection for real-time artist submissions
		try {
			// Use Socket.IO client instead of raw WebSocket
			const script = document.createElement("script");
			script.src = "/socket.io/socket.io.js";
			let socket: any = null;

			script.onload = () => {
				// @ts-ignore
				socket = io();

				socket.on("connect", () => {
					console.log("Socket.IO connected");
					setWsConnected(true);
				});

				socket.on("disconnect", () => {
					console.log("Socket.IO disconnected");
					setWsConnected(false);
				});

				socket.on("artist_registered", (message: any) => {
					console.log("Artist registered:", message);

					const newArtist = {
						id: message.data.id,
						artist_name:
							message.data.artistName || message.data.artist_name,
						real_name:
							message.data.realName || message.data.real_name,
						email: message.data.email,
						style: message.data.style,
						performance_duration:
							message.data.performanceDuration ||
							message.data.performance_duration,
						performance_date:
							message.data.performanceDate ||
							message.data.performance_date,
						status: message.data.status || "pending",
						created_at:
							message.data.createdAt || message.data.created_at,
						actual_duration:
							message.data.musicTracks?.find(
								(track: any) => track.is_main_track
							)?.duration || null,
					};

					// Check if artist already exists to prevent duplicates
					setArtists((prev) => {
						const existingIndex = prev.findIndex(
							(artist) => artist.id === newArtist.id
						);
						console.log(
							`Artist ${newArtist.id} exists at index:`,
							existingIndex
						);
						console.log(
							"Current artists:",
							prev.map((a) => a.id)
						);

						if (existingIndex !== -1) {
							// Update existing artist
							console.log("Updating existing artist");
							const updated = [...prev];
							updated[existingIndex] = newArtist;
							return updated;
						} else {
							// Add new artist
							console.log("Adding new artist");
							return [newArtist, ...prev];
						}
					});

					toast({
						title: "New Artist Registration",
						description: `${newArtist.artist_name} has submitted their application`,
					});
				});

				socket.on("artist_assigned", (message: any) => {
					console.log("Artist assigned:", message);

					setArtists((prev) =>
						prev.map((artist) =>
							artist.id === message.data.id
								? {
										...artist,
										performance_date:
											message.data.performance_date,
								  }
								: artist
						)
					);

					toast({
						title: "Artist Assignment Updated",
						description: `${
							message.data.artistName || message.data.artist_name
						} has been assigned`,
					});
				});

				socket.on("artist_status_changed", (message: any) => {
					console.log("Artist status changed:", message);

					setArtists((prev) =>
						prev.map((artist) =>
							artist.id === message.data.id
								? {
										...artist,
										status: message.data.status,
										...message.data,
								  }
								: artist
						)
					);

					toast({
						title: "Artist Status Updated",
						description: `${
							message.data.artistName || message.data.artist_name
						} status changed`,
					});
				});

				socket.on("artist_deleted", (message: any) => {
					console.log("Artist deleted:", message);

					setArtists((prev) =>
						prev.filter((artist) => artist.id !== message.data.id)
					);

					toast({
						title: "Artist Removed",
						description: `${
							message.data.artistName || message.data.artist_name
						} has been removed`,
						variant: "destructive",
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
				setWsInitialized(false);
			};
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
			setWsInitialized(false);
			return () => {}; // Return empty cleanup function on error
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

						{/* Assigned Artists */}
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
												<TableHead>
													Performance Date
												</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{assignedArtists.map((artist) => (
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
														{artist.performance_date &&
															formatDateSimple(
																artist.performance_date
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
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	assignPerformanceDate(
																		artist.id,
																		null
																	)
																}
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
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>

						{/* Artist Detail Dialog */}
						<Dialog
							open={isDetailDialogOpen}
							onOpenChange={setIsDetailDialogOpen}
						>
							<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle>
										Artist Details -{" "}
										{selectedArtist?.artist_name}
									</DialogTitle>
									<DialogDescription>
										Complete artist information and media
										files
									</DialogDescription>
								</DialogHeader>

								{selectedArtist && (
									<div className="space-y-6">
										{/* Basic Information and Performance Details */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Card>
												<CardHeader>
													<CardTitle className="text-lg">
														Basic Information
													</CardTitle>
												</CardHeader>
												<CardContent className="space-y-3">
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
													<div>
														<p className="text-sm text-muted-foreground">
															Email
														</p>
														<p className="font-medium">
															{
																selectedArtist.email
															}
														</p>
													</div>
													{(selectedArtist as any)
														.phone && (
														<div>
															<p className="text-sm text-muted-foreground">
																Phone
															</p>
															<p className="font-medium">
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
															Performance Style
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
																Performance Type
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
													<div>
														<p className="text-sm text-muted-foreground">
															Status
														</p>
														<ArtistStatusBadge
															status={
																selectedArtist.status
															}
														/>
													</div>
												</CardContent>
											</Card>

											<Card>
												<CardHeader>
													<CardTitle className="text-lg">
														Performance Details
													</CardTitle>
												</CardHeader>
												<CardContent className="space-y-3">
													{(selectedArtist as any)
														.biography && (
														<div>
															<p className="text-sm text-muted-foreground">
																Biography
															</p>
															<p className="text-sm">
																{
																	(
																		selectedArtist as any
																	).biography
																}
															</p>
														</div>
													)}
													{(selectedArtist as any)
														.equipment && (
														<div>
															<p className="text-sm text-muted-foreground">
																Equipment
															</p>
															<p className="text-sm">
																{
																	(
																		selectedArtist as any
																	).equipment
																}
															</p>
														</div>
													)}
													{(selectedArtist as any)
														.lightRequests && (
														<div>
															<p className="text-sm text-muted-foreground">
																Light Requests
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
													{(selectedArtist as any)
														.mcNotes && (
														<div>
															<p className="text-sm text-muted-foreground">
																MC Notes
															</p>
															<p className="text-sm">
																{
																	(
																		selectedArtist as any
																	).mcNotes
																}
															</p>
														</div>
													)}
													{(selectedArtist as any)
														.stageManagerNotes && (
														<div>
															<p className="text-sm text-muted-foreground">
																Stage Manager
																Notes
															</p>
															<p className="text-sm">
																{
																	(
																		selectedArtist as any
																	)
																		.stageManagerNotes
																}
															</p>
														</div>
													)}
												</CardContent>
											</Card>
										</div>

										{/* Music Tracks */}
										{(selectedArtist as any).musicTracks &&
											(selectedArtist as any).musicTracks
												.length > 0 && (
												<Card>
													<CardHeader>
														<CardTitle className="text-lg">
															Music Tracks
														</CardTitle>
													</CardHeader>
													<CardContent>
														<div className="space-y-4">
															{(
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
																		className="border rounded-lg p-4"
																	>
																		<div className="flex items-center justify-between mb-2">
																			<h4 className="font-medium">
																				{
																					track.song_title
																				}
																			</h4>
																			{track.is_main_track && (
																				<Badge>
																					Main
																					Track
																				</Badge>
																			)}
																		</div>
																		<div className="grid grid-cols-2 gap-4 text-sm">
																			<div>
																				<span className="text-muted-foreground">
																					Duration:
																				</span>{" "}
																				{formatDuration(
																					track.duration
																				)}
																			</div>
																			<div>
																				<span className="text-muted-foreground">
																					Tempo:
																				</span>{" "}
																				{
																					track.tempo
																				}
																			</div>
																		</div>
																		{track.notes && (
																			<p className="text-sm text-muted-foreground mt-2">
																				{
																					track.notes
																				}
																			</p>
																		)}
																		{track.file_url && (
																			<div className="mt-3">
																				<AudioPlayer
																					src={
																						track.file_url
																					}
																				/>
																			</div>
																		)}
																	</div>
																)
															)}
														</div>
													</CardContent>
												</Card>
											)}

										{/* Gallery Files */}
										{(selectedArtist as any).galleryFiles &&
											(selectedArtist as any).galleryFiles
												.length > 0 && (
												<Card>
													<CardHeader>
														<CardTitle className="text-lg">
															Gallery Files
														</CardTitle>
													</CardHeader>
													<CardContent>
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
																		className="aspect-square"
																	>
																		{file.type ===
																		"video" ? (
																			<VideoPlayer
																				file={
																					file
																				}
																				className="w-full h-full"
																			/>
																		) : (
																			<ImageViewer
																				file={
																					file
																				}
																				className="w-full h-full"
																			/>
																		)}
																	</div>
																)
															)}
														</div>
													</CardContent>
												</Card>
											)}
									</div>
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
