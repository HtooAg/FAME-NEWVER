"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/ui/audio-player";
import { VideoPlayer, ImageViewer } from "@/components/ui/video-player";
import { formatDuration } from "@/lib/media-utils";

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

	const artistId = params.artistId as string;

	useEffect(() => {
		if (artistId) {
			fetchArtistProfile();
		} else {
			setError("Invalid artist ID");
			setLoading(false);
		}
	}, [artistId]);

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
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="grid w-full grid-cols-5 bg-white rounded-xl shadow-lg  border-2 border-purple-100 mb-8">
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
