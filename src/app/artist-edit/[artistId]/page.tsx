"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Save,
	Plus,
	Undo2,
	Redo2,
	Trash2,
	Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArtistProfile {
	id: string;
	artistName: string;
	realName: string;
	email: string;
	phone: string;
	style: string;
	performanceType: string;
	biography: string;
	notes: string;
	equipment: string;
	performanceDuration: number;
	costumeColor: string;
	customCostumeColor: string;
	lightColorSingle: string;
	lightColorTwo: string;
	lightColorThree: string;
	lightRequests: string;
	showLink: string;
	stagePositionStart: string;
	stagePositionEnd: string;
	customStagePosition: string;
	mcNotes: string;
	stageManagerNotes: string;
	socialMedia: {
		instagram: string;
		facebook: string;
		tiktok: string;
		youtube: string;
		website: string;
	};
	musicTracks: any[];
	galleryFiles: any[];
	eventId: string;
	eventName: string;
}

export default function ArtistEditPage() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const artistId = params.artistId as string;

	const [profile, setProfile] = useState<ArtistProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

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

	const [musicTracks, setMusicTracks] = useState<any[]>([]);
	const [galleryFiles, setGalleryFiles] = useState<any[]>([]);

	useEffect(() => {
		if (artistId) {
			fetchArtistProfile();
		}
	}, [artistId]);

	const fetchArtistProfile = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/artists/${artistId}`);

			if (!response.ok) {
				throw new Error("Failed to fetch artist profile");
			}

			const data = await response.json();
			console.log("Fetched artist data:", data);

			if (data.success && data.data) {
				const artist = data.data;
				setProfile(artist);

				// Pre-fill form with existing data
				setArtistData({
					artist_name: artist.artistName || "",
					real_name: artist.realName || "",
					email: artist.email || "",
					phone: artist.phone || "",
					style: artist.style || "",
					performance_type: artist.performanceType || "",
					biography: artist.biography || "",
					notes: artist.notes || "",
					props_needed: artist.equipment || "",
					performance_duration: artist.performanceDuration || 5,
					costume_color: artist.costumeColor || "",
					custom_costume_color: artist.customCostumeColor || "",
					light_color_single: artist.lightColorSingle || "trust",
					light_color_two: artist.lightColorTwo || "none",
					light_color_three: artist.lightColorThree || "none",
					light_requests: artist.lightRequests || "",
					show_link: artist.showLink || "",
					stage_position_start: artist.stagePositionStart || "",
					stage_position_end: artist.stagePositionEnd || "",
					custom_stage_position: artist.customStagePosition || "",
					mc_notes: artist.mcNotes || "",
					stage_manager_notes: artist.stageManagerNotes || "",
					instagram_link: artist.socialMedia?.instagram || "",
					facebook_link: artist.socialMedia?.facebook || "",
					tiktok_link: artist.socialMedia?.tiktok || "",
					youtube_link: artist.socialMedia?.youtube || "",
					website_link: artist.socialMedia?.website || "",
				});

				const tracks = artist.musicTracks || [];
				const files = artist.galleryFiles || [];

				setMusicTracks(tracks);
				setGalleryFiles(files);
			} else {
				throw new Error("Invalid response format");
			}
		} catch (error) {
			console.error("Error fetching artist profile:", error);
			toast({
				title: "Error",
				description: "Failed to load artist profile",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field: string, value: string | number) => {
		setArtistData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			const response = await fetch(`/api/artists/${artistId}`, {
				method: "PATCH",
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
					musicTracks: musicTracks,
					galleryFiles: galleryFiles,
				}),
			});

			if (response.ok) {
				toast({
					title: "Profile Updated",
					description:
						"Your artist profile has been updated successfully",
				});
				router.push(`/artist-dashboard/${artistId}`);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || "Update failed");
			}
		} catch (error) {
			console.error("Update error:", error);
			toast({
				title: "Update failed",
				description: "Failed to update profile. Please try again.",
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
						Loading profile...
					</p>
				</div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="text-xl font-semibold mb-2">
						Profile not found
					</h2>
					<Button onClick={() => router.push("/artist-dashboard")}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Dashboard
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
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(`/artist-dashboard/${artistId}`)
							}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Dashboard
						</Button>
						<div>
							<h1 className="text-2xl font-bold text-foreground">
								Edit Artist Profile
							</h1>
							<p className="text-muted-foreground">
								{profile.artistName} - {profile.eventName}
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

						{/* 2. Technical Information */}
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

						{/* 3. Additional Information */}
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
									Updating...
								</div>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Update Profile
								</>
							)}
						</Button>
					</div>
				</form>
			</main>
		</div>
	);
}
