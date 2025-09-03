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
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	ArrowLeft,
	Upload,
	Music,
	Image,
	User,
	Lightbulb,
	FileText,
	CheckCircle,
	Plus,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Event {
	id: string;
	name: string;
	venue: string;
	start_date: string;
	end_date: string;
}

// Helper function to get color for preview
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
	};
	return colorMap[colorValue] || "#888888";
};

function ArtistRegistrationForm() {
	const { eventId } = useParams();
	const router = useRouter();
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [existingProfile, setExistingProfile] = useState<any>(null);
	const { toast } = useToast();

	const [artistData, setArtistData] = useState({
		artist_name: "",
		real_name: "",
		email: "",
		phone: "",
		style: "",
		performance_type: "",
		biography: "",
		notes: "",
		props_needed: "",
		performance_duration: 5,
		costume_color: "",
		custom_costume_color: "",
		light_color_single: "trust",
		light_color_two: "none",
		light_color_three: "none",
		light_requests: "",
		show_link: "",
		stage_position_start: "",
		stage_position_end: "",
		custom_stage_position: "",
		mc_notes: "",
		stage_manager_notes: "",
		instagram_link: "",
		facebook_link: "",
		tiktok_link: "",
		youtube_link: "",
		website_link: "",
	});

	const [musicTracks, setMusicTracks] = useState([
		{
			song_title: "",
			duration: 0,
			notes: "",
			is_main_track: true,
			tempo: "",
			file_url: "",
			file_path: "",
		},
	]);

	const [galleryFiles, setGalleryFiles] = useState<
		{
			url: string;
			type: "image" | "video";
			name: string;
			file_path?: string;
			size?: number;
			uploadedAt?: string;
			contentType?: string;
		}[]
	>([]);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [registeredArtistId, setRegisteredArtistId] = useState<string | null>(
		null
	);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
			fetchExistingProfile();
		}
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				setEvent(data.data || data);
			} else {
				throw new Error("Failed to fetch event");
			}
		} catch (error) {
			toast({
				title: "Error fetching event",
				description: "Failed to load event details",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchExistingProfile = async () => {
		try {
			// Check if there's an existing profile for this event
			const urlParams = new URLSearchParams(window.location.search);
			const artistId = urlParams.get("artistId");

			if (artistId) {
				// Editing existing profile
				const response = await fetch(
					`/api/events/${eventId}/artists/${artistId}`
				);
				if (response.ok) {
					const data = await response.json();
					if (data.artist) {
						setExistingProfile(data.artist);
						// Pre-fill form with existing data for editing
						setArtistData({
							artist_name: data.artist.artistName || "",
							real_name: data.artist.realName || "",
							email: data.artist.email || "",
							phone: data.artist.phone || "",
							style: data.artist.style || "",
							performance_type: data.artist.performanceType || "",
							biography: data.artist.biography || "",
							notes: data.artist.notes || "",
							props_needed: data.artist.equipment || "",
							performance_duration:
								data.artist.performanceDuration || 5,
							costume_color: data.artist.costumeColor || "",
							custom_costume_color:
								data.artist.customCostumeColor || "",
							light_color_single:
								data.artist.lightColorSingle || "trust",
							light_color_two:
								data.artist.lightColorTwo || "none",
							light_color_three:
								data.artist.lightColorThree || "none",
							light_requests: data.artist.lightRequests || "",
							show_link: data.artist.showLink || "",
							stage_position_start:
								data.artist.stagePositionStart || "",
							stage_position_end:
								data.artist.stagePositionEnd || "",
							custom_stage_position:
								data.artist.customStagePosition || "",
							mc_notes: data.artist.mcNotes || "",
							stage_manager_notes:
								data.artist.stageManagerNotes || "",
							instagram_link:
								data.artist.socialMedia?.instagram || "",
							facebook_link:
								data.artist.socialMedia?.facebook || "",
							tiktok_link: data.artist.socialMedia?.tiktok || "",
							youtube_link:
								data.artist.socialMedia?.youtube || "",
							website_link:
								data.artist.socialMedia?.website || "",
						});

						if (data.artist.musicTracks) {
							setMusicTracks(data.artist.musicTracks);
						}

						if (data.artist.galleryFiles) {
							setGalleryFiles(data.artist.galleryFiles);
						}
					}
				}
			}
			// If no artistId, form stays empty for new registration
		} catch (error) {
			console.error("Error fetching existing profile:", error);
		}
	};

	const handleInputChange = (field: string, value: string | number) => {
		setArtistData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const addMusicTrack = () => {
		setMusicTracks((prev) => [
			...prev,
			{
				song_title: "",
				duration: 0,
				notes: "",
				is_main_track: false,
				tempo: "",
				file_url: "",
				file_path: "",
			},
		]);
	};

	const updateMusicTrack = (
		index: number,
		field: string,
		value: string | number | boolean
	) => {
		setMusicTracks((prev) =>
			prev.map((track, i) =>
				i === index ? { ...track, [field]: value } : track
			)
		);
	};

	const removeMusicTrack = (index: number) => {
		if (musicTracks.length > 1) {
			setMusicTracks((prev) => prev.filter((_, i) => i !== index));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields
		if (!artistData.artist_name.trim()) {
			toast({
				title: "Validation Error",
				description: "Artist/Stage Name is required",
				variant: "destructive",
			});
			return;
		}

		if (!artistData.costume_color) {
			toast({
				title: "Validation Error",
				description: "Costume Color is required",
				variant: "destructive",
			});
			return;
		}

		// Validate that at least one music track has a song title
		const validTracks = musicTracks.filter((track) =>
			track.song_title.trim()
		);
		if (validTracks.length === 0) {
			toast({
				title: "Validation Error",
				description: "At least one track with a song title is required",
				variant: "destructive",
			});
			return;
		}

		setSubmitting(true);

		try {
			console.log("Submitting artist data:", artistData);
			console.log("Music tracks:", validTracks);
			console.log("Gallery files:", galleryFiles);

			const urlParams = new URLSearchParams(window.location.search);
			const artistId = urlParams.get("artistId");

			let response;

			if (existingProfile && artistId) {
				// Update existing artist
				response = await fetch(
					`/api/events/${eventId}/artists/${artistId}`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							artistName: artistData.artist_name,
							realName: artistData.real_name,
							email: artistData.email,
							phone: artistData.phone,
							style: artistData.style,
							performanceType: artistData.performance_type,
							performanceDuration:
								artistData.performance_duration,
							biography: artistData.biography,
							costumeColor: artistData.costume_color,
							customCostumeColor: artistData.custom_costume_color,
							lightColorSingle: artistData.light_color_single,
							lightColorTwo: artistData.light_color_two,
							lightColorThree: artistData.light_color_three,
							lightRequests: artistData.light_requests,
							stagePositionStart: artistData.stage_position_start,
							stagePositionEnd: artistData.stage_position_end,
							customStagePosition:
								artistData.custom_stage_position,
							equipment: artistData.props_needed,
							showLink: artistData.show_link,
							socialMedia: {
								instagram: artistData.instagram_link,
								facebook: artistData.facebook_link,
								youtube: artistData.youtube_link,
								tiktok: artistData.tiktok_link,
								website: artistData.website_link,
							},
							mcNotes: artistData.mc_notes,
							stageManagerNotes: artistData.stage_manager_notes,
							notes: artistData.notes,
							eventName: event?.name || "",
							musicTracks: validTracks,
							galleryFiles: galleryFiles,
						}),
					}
				);
			} else {
				// Create new artist
				response = await fetch(`/api/events/${eventId}/artists`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						artistName: artistData.artist_name,
						realName: artistData.real_name,
						email: artistData.email,
						phone: artistData.phone,
						style: artistData.style,
						performanceType: artistData.performance_type,
						performanceDuration: artistData.performance_duration,
						biography: artistData.biography,
						costumeColor: artistData.costume_color,
						customCostumeColor: artistData.custom_costume_color,
						lightColorSingle: artistData.light_color_single,
						lightColorTwo: artistData.light_color_two,
						lightColorThree: artistData.light_color_three,
						lightRequests: artistData.light_requests,
						stagePositionStart: artistData.stage_position_start,
						stagePositionEnd: artistData.stage_position_end,
						customStagePosition: artistData.custom_stage_position,
						equipment: artistData.props_needed,
						showLink: artistData.show_link,
						socialMedia: {
							instagram: artistData.instagram_link,
							facebook: artistData.facebook_link,
							youtube: artistData.youtube_link,
							tiktok: artistData.tiktok_link,
							website: artistData.website_link,
						},
						mcNotes: artistData.mc_notes,
						stageManagerNotes: artistData.stage_manager_notes,
						notes: artistData.notes,
						eventName: event?.name || "",
						musicTracks: validTracks,
						galleryFiles: galleryFiles,
					}),
				});
			}

			if (response.ok) {
				const result = await response.json();
				console.log("Registration result:", result);

				// Store the artist ID for redirect
				const artistId =
					result.data?.id || result.artist?.id || result.id;
				if (artistId) {
					setRegisteredArtistId(artistId);
					// Update the URL to include the artist ID
					const newUrl = `${window.location.pathname}?artistId=${artistId}`;
					window.history.replaceState({}, "", newUrl);
				}

				setShowSuccessDialog(true);
			} else {
				const errorData = await response.json();
				throw new Error(
					errorData.error?.message || "Registration failed"
				);
			}
		} catch (error) {
			console.error("Full error:", error);
			toast({
				title: existingProfile
					? "Update failed"
					: "Registration failed",
				description: `Failed to ${
					existingProfile ? "update" : "register"
				} artist. Please try again.`,
				variant: "destructive",
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-muted-foreground">
						Loading event...
					</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="text-xl font-semibold mb-2">
						Event not found
					</h2>
					<Button onClick={() => router.push("/")}>
						Back to Home
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<div>
							<h1 className="text-2xl font-bold text-foreground">
								{existingProfile
									? "Edit Artist Profile"
									: "Artist Registration"}
							</h1>
							<p className="text-muted-foreground">
								{event.name} - {event.venue}
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<form onSubmit={handleSubmit} className="space-y-8">
					<Accordion
						type="single"
						defaultValue="basic-info"
						collapsible
						className="w-full"
					>
						{/* 1. Basic Information */}
						<AccordionItem value="basic-info">
							<AccordionTrigger className="text-lg font-semibold">
								<div className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Basic Information
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<Card>
									<CardContent className="space-y-4 pt-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="artist_name">
													Artist/Stage Name *
												</Label>
												<Input
													id="artist_name"
													value={
														artistData.artist_name
													}
													onChange={(e) =>
														handleInputChange(
															"artist_name",
															e.target.value
														)
													}
													placeholder="Enter your stage name"
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="real_name">
													Real Name
												</Label>
												<Input
													id="real_name"
													value={artistData.real_name}
													onChange={(e) =>
														handleInputChange(
															"real_name",
															e.target.value
														)
													}
													placeholder="Enter your real name"
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="email">
													Email
												</Label>
												<Input
													id="email"
													type="email"
													value={artistData.email}
													onChange={(e) =>
														handleInputChange(
															"email",
															e.target.value
														)
													}
													placeholder="Enter your email"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="phone">
													Phone
												</Label>
												<Input
													id="phone"
													value={artistData.phone}
													onChange={(e) =>
														handleInputChange(
															"phone",
															e.target.value
														)
													}
													placeholder="Enter your phone number"
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="style">
													Performance Style
												</Label>
												<Input
													id="style"
													value={artistData.style}
													onChange={(e) =>
														handleInputChange(
															"style",
															e.target.value
														)
													}
													placeholder="e.g., Hip-hop, Jazz, Comedy, etc."
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="performance_type">
													Performance Type
												</Label>
												<Select
													value={
														artistData.performance_type
													}
													onValueChange={(value) =>
														handleInputChange(
															"performance_type",
															value
														)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select performance type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="solo">
															Solo Performance
														</SelectItem>
														<SelectItem value="duo">
															Duo
														</SelectItem>
														<SelectItem value="trio">
															Trio
														</SelectItem>
														<SelectItem value="group">
															Group (4+)
														</SelectItem>
														<SelectItem value="band">
															Band
														</SelectItem>
														<SelectItem value="other">
															Other
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="biography">
												Artist Biography
											</Label>
											<Textarea
												id="biography"
												value={artistData.biography}
												onChange={(e) =>
													handleInputChange(
														"biography",
														e.target.value
													)
												}
												placeholder="Tell us about yourself and your performance"
												className="min-h-[100px]"
											/>
										</div>
									</CardContent>
								</Card>
							</AccordionContent>
						</AccordionItem>

						{/* 2. Music Information */}
						<AccordionItem value="music-info">
							<AccordionTrigger className="text-lg font-semibold">
								<div className="flex items-center gap-2">
									<Music className="h-5 w-5" />
									Music Information
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<Card>
									<CardContent className="space-y-4 pt-6">
										<div className="space-y-4">
											<div>
												<Label className="text-base font-medium">
													Performance Tracks
												</Label>
											</div>
											<div className="space-y-4">
												{musicTracks.map(
													(track, index) => (
														<div
															key={index}
															className="border rounded-lg p-4 space-y-4"
														>
															<div className="flex justify-between items-center">
																<h4 className="font-medium">
																	Track{" "}
																	{index + 1}
																</h4>
																{musicTracks.length >
																	1 && (
																	<Button
																		type="button"
																		onClick={() =>
																			removeMusicTrack(
																				index
																			)
																		}
																		variant="destructive"
																		size="sm"
																	>
																		Remove
																	</Button>
																)}
															</div>
															<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																<div className="space-y-2">
																	<Label>
																		Song
																		Title
																	</Label>
																	<Input
																		value={
																			track.song_title
																		}
																		onChange={(
																			e
																		) =>
																			updateMusicTrack(
																				index,
																				"song_title",
																				e
																					.target
																					.value
																			)
																		}
																		placeholder="Enter song title"
																	/>
																</div>
																<div className="space-y-2">
																	<Label>
																		Tempo
																	</Label>
																	<Input
																		value={
																			track.tempo
																		}
																		onChange={(
																			e
																		) =>
																			updateMusicTrack(
																				index,
																				"tempo",
																				e
																					.target
																					.value
																			)
																		}
																		placeholder="e.g., Fast, Medium, Slow"
																	/>
																</div>
															</div>
															<div className="space-y-2">
																<Label>
																	DJ Notes
																</Label>
																<Textarea
																	value={
																		track.notes
																	}
																	onChange={(
																		e
																	) =>
																		updateMusicTrack(
																			index,
																			"notes",
																			e
																				.target
																				.value
																		)
																	}
																	placeholder="Special instructions for the DJ"
																	className="min-h-[80px]"
																/>
															</div>
														</div>
													)
												)}
											</div>
											<Button
												type="button"
												onClick={addMusicTrack}
												variant="outline"
												className="w-full"
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Another Track
											</Button>
										</div>
									</CardContent>
								</Card>
							</AccordionContent>
						</AccordionItem>

						{/* 3. Technical Information */}
						<AccordionItem value="technical-info">
							<AccordionTrigger className="text-lg font-semibold">
								<div className="flex items-center gap-2">
									<Lightbulb className="h-5 w-5" />
									Technical Information
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<Card>
									<CardContent className="space-y-6 pt-6">
										<div className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="performance_duration">
														Performance Duration
														(minutes)
													</Label>
													<Input
														id="performance_duration"
														type="number"
														min="1"
														max="30"
														value={
															artistData.performance_duration
														}
														onChange={(e) =>
															handleInputChange(
																"performance_duration",
																parseInt(
																	e.target
																		.value
																) || 5
															)
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="costume_color">
														Costume Color *
													</Label>
													<Select
														value={
															artistData.costume_color
														}
														onValueChange={(
															value
														) =>
															handleInputChange(
																"costume_color",
																value
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select costume color" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="red">
																Red
															</SelectItem>
															<SelectItem value="blue">
																Blue
															</SelectItem>
															<SelectItem value="green">
																Green
															</SelectItem>
															<SelectItem value="yellow">
																Yellow
															</SelectItem>
															<SelectItem value="purple">
																Purple
															</SelectItem>
															<SelectItem value="pink">
																Pink
															</SelectItem>
															<SelectItem value="orange">
																Orange
															</SelectItem>
															<SelectItem value="black">
																Black
															</SelectItem>
															<SelectItem value="white">
																White
															</SelectItem>
															<SelectItem value="other">
																Other
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											{artistData.costume_color ===
												"other" && (
												<div className="space-y-2">
													<Label htmlFor="custom_costume_color">
														Custom Costume Color
													</Label>
													<Input
														id="custom_costume_color"
														value={
															artistData.custom_costume_color
														}
														onChange={(e) =>
															handleInputChange(
																"custom_costume_color",
																e.target.value
															)
														}
														placeholder="Describe your costume color"
													/>
												</div>
											)}

											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												<div className="space-y-2">
													<Label htmlFor="light_color_single">
														Primary Light Color
													</Label>
													<Select
														value={
															artistData.light_color_single
														}
														onValueChange={(
															value
														) =>
															handleInputChange(
																"light_color_single",
																value
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select primary color" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="trust">
																Trust Lighting
																Designer
															</SelectItem>
															<SelectItem value="red">
																Red
															</SelectItem>
															<SelectItem value="blue">
																Blue
															</SelectItem>
															<SelectItem value="green">
																Green
															</SelectItem>
															<SelectItem value="amber">
																Amber
															</SelectItem>
															<SelectItem value="magenta">
																Magenta
															</SelectItem>
															<SelectItem value="cyan">
																Cyan
															</SelectItem>
															<SelectItem value="purple">
																Purple
															</SelectItem>
															<SelectItem value="white">
																White
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-2">
													<Label htmlFor="light_color_two">
														Secondary Light Color
													</Label>
													<Select
														value={
															artistData.light_color_two
														}
														onValueChange={(
															value
														) =>
															handleInputChange(
																"light_color_two",
																value
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select secondary color" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">
																None
															</SelectItem>
															<SelectItem value="red">
																Red
															</SelectItem>
															<SelectItem value="blue">
																Blue
															</SelectItem>
															<SelectItem value="green">
																Green
															</SelectItem>
															<SelectItem value="amber">
																Amber
															</SelectItem>
															<SelectItem value="magenta">
																Magenta
															</SelectItem>
															<SelectItem value="cyan">
																Cyan
															</SelectItem>
															<SelectItem value="purple">
																Purple
															</SelectItem>
															<SelectItem value="white">
																White
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-2">
													<Label htmlFor="light_color_three">
														Third Light Color
													</Label>
													<Select
														value={
															artistData.light_color_three
														}
														onValueChange={(
															value
														) =>
															handleInputChange(
																"light_color_three",
																value
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select third color" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">
																None
															</SelectItem>
															<SelectItem value="red">
																Red
															</SelectItem>
															<SelectItem value="blue">
																Blue
															</SelectItem>
															<SelectItem value="green">
																Green
															</SelectItem>
															<SelectItem value="amber">
																Amber
															</SelectItem>
															<SelectItem value="magenta">
																Magenta
															</SelectItem>
															<SelectItem value="cyan">
																Cyan
															</SelectItem>
															<SelectItem value="purple">
																Purple
															</SelectItem>
															<SelectItem value="white">
																White
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="light_requests">
													Special Lighting Requests
												</Label>
												<Textarea
													id="light_requests"
													value={
														artistData.light_requests
													}
													onChange={(e) =>
														handleInputChange(
															"light_requests",
															e.target.value
														)
													}
													placeholder="Any special lighting requirements or effects"
													className="min-h-[80px]"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="props_needed">
													Props/Equipment Needed
												</Label>
												<Textarea
													id="props_needed"
													value={
														artistData.props_needed
													}
													onChange={(e) =>
														handleInputChange(
															"props_needed",
															e.target.value
														)
													}
													placeholder="List any props, equipment, or setup requirements"
													className="min-h-[80px]"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							</AccordionContent>
						</AccordionItem>

						{/* 4. Additional Information */}
						<AccordionItem value="additional-info">
							<AccordionTrigger className="text-lg font-semibold">
								<div className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Additional Information
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<Card>
									<CardContent className="space-y-4 pt-6">
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="show_link">
													Demo Video/Show Link
												</Label>
												<Input
													id="show_link"
													type="url"
													value={artistData.show_link}
													onChange={(e) =>
														handleInputChange(
															"show_link",
															e.target.value
														)
													}
													placeholder="https://youtube.com/watch?v=..."
												/>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="instagram_link">
														Instagram
													</Label>
													<Input
														id="instagram_link"
														value={
															artistData.instagram_link
														}
														onChange={(e) =>
															handleInputChange(
																"instagram_link",
																e.target.value
															)
														}
														placeholder="@username or full URL"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="facebook_link">
														Facebook
													</Label>
													<Input
														id="facebook_link"
														value={
															artistData.facebook_link
														}
														onChange={(e) =>
															handleInputChange(
																"facebook_link",
																e.target.value
															)
														}
														placeholder="Facebook page URL"
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="youtube_link">
														YouTube
													</Label>
													<Input
														id="youtube_link"
														value={
															artistData.youtube_link
														}
														onChange={(e) =>
															handleInputChange(
																"youtube_link",
																e.target.value
															)
														}
														placeholder="YouTube channel URL"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="website_link">
														Website
													</Label>
													<Input
														id="website_link"
														value={
															artistData.website_link
														}
														onChange={(e) =>
															handleInputChange(
																"website_link",
																e.target.value
															)
														}
														placeholder="Your website URL"
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="mc_notes">
													Notes for MC
												</Label>
												<Textarea
													id="mc_notes"
													value={artistData.mc_notes}
													onChange={(e) =>
														handleInputChange(
															"mc_notes",
															e.target.value
														)
													}
													placeholder="Special instructions or information for the MC"
													className="min-h-[80px]"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="stage_manager_notes">
													Notes for Stage Manager
												</Label>
												<Textarea
													id="stage_manager_notes"
													value={
														artistData.stage_manager_notes
													}
													onChange={(e) =>
														handleInputChange(
															"stage_manager_notes",
															e.target.value
														)
													}
													placeholder="Special instructions or requirements for the stage manager"
													className="min-h-[80px]"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="notes">
													General Notes
												</Label>
												<Textarea
													id="notes"
													value={artistData.notes}
													onChange={(e) =>
														handleInputChange(
															"notes",
															e.target.value
														)
													}
													placeholder="Any additional information or special requirements"
													className="min-h-[80px]"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					{/* Submit Button */}
					<div className="flex justify-end space-x-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting ? (
								<div className="flex items-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									{existingProfile
										? "Updating..."
										: "Registering..."}
								</div>
							) : existingProfile ? (
								"Update Profile"
							) : (
								"Register Artist"
							)}
						</Button>
					</div>
				</form>

				{/* Success Dialog */}
				<Dialog
					open={showSuccessDialog}
					onOpenChange={setShowSuccessDialog}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-green-600" />
								{existingProfile
									? "Profile Updated!"
									: "Registration Successful!"}
							</DialogTitle>
							<DialogDescription>
								{existingProfile
									? "Your artist profile has been updated successfully."
									: "Your artist registration has been submitted successfully."}
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setShowSuccessDialog(false)}
							>
								Close
							</Button>
							{registeredArtistId && (
								<Button
									onClick={() =>
										router.push(
											`/artist-dashboard/${registeredArtistId}`
										)
									}
								>
									View Dashboard
								</Button>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
}

export default ArtistRegistrationForm;
