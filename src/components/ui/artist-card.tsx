"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/ui/audio-player";
import { VideoPlayer } from "@/components/ui/video-player";
import {
	CheckCircle,
	XCircle,
	Clock,
	Eye,
	Mail,
	Phone,
	Music,
	Palette,
	MapPin,
	Settings,
	Download,
	ExternalLink,
	Instagram,
	Facebook,
	Youtube,
} from "lucide-react";

interface Artist {
	id: string;
	eventId: string;
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
	equipment: string;
	showLink: string;
	socialMedia: {
		instagram: string;
		facebook: string;
		youtube: string;
		tiktok: string;
		website: string;
	};
	mcNotes: string;
	stageManagerNotes: string;
	notes: string;
	eventName: string;
	musicTracks: Array<{
		song_title: string;
		duration: number;
		notes: string;
		is_main_track: boolean;
		tempo: string;
		file_url: string;
		file_path: string;
		uploadedAt: string;
		fileSize: number;
		contentType: string;
	}>;
	galleryFiles: Array<{
		url: string;
		file_url: string;
		file_path: string;
		type: string;
		name: string;
		size: number;
		uploadedAt: string;
		contentType: string;
	}>;
	status: "pending" | "approved" | "rejected";
	createdAt: string;
	updatedAt: string;
}

interface ArtistCardProps {
	artist: Artist;
	onStatusUpdate: (artistId: string, status: "approved" | "rejected") => void;
	onViewDetails: (artist: Artist) => void;
}

export function ArtistCard({
	artist,
	onStatusUpdate,
	onViewDetails,
}: ArtistCardProps) {
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "approved":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4" />;
			case "approved":
				return <CheckCircle className="h-4 w-4" />;
			case "rejected":
				return <XCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	};

	const downloadFile = async (filePath: string, fileName: string) => {
		try {
			const response = await fetch(`/api/download/${filePath}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (error) {
			console.error("Error downloading file:", error);
		}
	};

	return (
		<Card className="h-full hover:shadow-lg transition-all duration-300 bg-white">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<CardTitle className="text-lg font-bold text-gray-900 mb-1">
							{artist.artistName}
						</CardTitle>
						<CardDescription className="text-sm text-gray-600">
							{artist.realName}
						</CardDescription>
						<div className="flex items-center mt-2 space-x-2">
							<Badge variant="outline" className="text-xs">
								{artist.style}
							</Badge>
							<Badge variant="outline" className="text-xs">
								{formatDuration(artist.performanceDuration)}
							</Badge>
						</div>
					</div>
					<Badge className={getStatusColor(artist.status)}>
						{getStatusIcon(artist.status)}
						<span className="ml-1 capitalize">{artist.status}</span>
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Contact Info */}
				<div className="space-y-2">
					<div className="flex items-center text-sm text-gray-600">
						<Mail className="h-4 w-4 mr-2" />
						<span className="truncate">{artist.email}</span>
					</div>
					<div className="flex items-center text-sm text-gray-600">
						<Phone className="h-4 w-4 mr-2" />
						<span>{artist.phone}</span>
					</div>
				</div>

				{/* Performance Info */}
				<div className="space-y-2">
					<div className="flex items-center text-sm text-gray-600">
						<Music className="h-4 w-4 mr-2" />
						<span>{artist.performanceType}</span>
					</div>
					{artist.musicTracks && artist.musicTracks.length > 0 && (
						<div className="text-sm text-gray-600">
							<span className="font-medium">
								{artist.musicTracks.length}
							</span>{" "}
							music tracks
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col space-y-2 pt-2">
					<Dialog
						open={isDetailsOpen}
						onOpenChange={setIsDetailsOpen}
					>
						<DialogTrigger asChild>
							<Button variant="outline" className="w-full">
								<Eye className="h-4 w-4 mr-2" />
								View Details
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle className="text-xl font-bold">
									{artist.artistName} - {artist.realName}
								</DialogTitle>
								<DialogDescription>
									Complete artist registration details
								</DialogDescription>
							</DialogHeader>

							<Tabs defaultValue="basic" className="w-full">
								<TabsList className="grid w-full grid-cols-5">
									<TabsTrigger value="basic">
										Basic Info
									</TabsTrigger>
									<TabsTrigger value="performance">
										Performance
									</TabsTrigger>
									<TabsTrigger value="technical">
										Technical
									</TabsTrigger>
									<TabsTrigger value="media">
										Media
									</TabsTrigger>
									<TabsTrigger value="notes">
										Notes
									</TabsTrigger>
								</TabsList>

								<TabsContent
									value="basic"
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Artist Name
											</label>
											<p className="text-gray-900">
												{artist.artistName}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Real Name
											</label>
											<p className="text-gray-900">
												{artist.realName}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Email
											</label>
											<p className="text-gray-900">
												{artist.email}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Phone
											</label>
											<p className="text-gray-900">
												{artist.phone}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Style
											</label>
											<p className="text-gray-900">
												{artist.style}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Performance Type
											</label>
											<p className="text-gray-900">
												{artist.performanceType}
											</p>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Biography
										</label>
										<p className="text-gray-900 mt-1">
											{artist.biography}
										</p>
									</div>
									{/* Social Media */}
									<div>
										<label className="text-sm font-medium text-gray-700 mb-2 block">
											Social Media
										</label>
										<div className="flex flex-wrap gap-2">
											{artist.socialMedia?.instagram && (
												<a
													href={
														artist.socialMedia
															.instagram
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm hover:bg-pink-200"
												>
													<Instagram className="h-3 w-3 mr-1" />
													Instagram
												</a>
											)}
											{artist.socialMedia?.facebook && (
												<a
													href={
														artist.socialMedia
															.facebook
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
												>
													<Facebook className="h-3 w-3 mr-1" />
													Facebook
												</a>
											)}
											{artist.socialMedia?.youtube && (
												<a
													href={
														artist.socialMedia
															.youtube
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200"
												>
													<Youtube className="h-3 w-3 mr-1" />
													YouTube
												</a>
											)}
											{artist.socialMedia?.website && (
												<a
													href={
														artist.socialMedia
															.website
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200"
												>
													<ExternalLink className="h-3 w-3 mr-1" />
													Website
												</a>
											)}
										</div>
									</div>
								</TabsContent>

								<TabsContent
									value="performance"
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Duration
											</label>
											<p className="text-gray-900">
												{formatDuration(
													artist.performanceDuration
												)}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Show Link
											</label>
											{artist.showLink ? (
												<a
													href={artist.showLink}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:text-blue-800 flex items-center"
												>
													<ExternalLink className="h-3 w-3 mr-1" />
													View Show
												</a>
											) : (
												<p className="text-gray-500">
													No show link provided
												</p>
											)}
										</div>
									</div>
								</TabsContent>

								<TabsContent
									value="technical"
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Costume Color
											</label>
											<div className="flex items-center">
												<div
													className="w-4 h-4 rounded-full mr-2 border"
													style={{
														backgroundColor:
															artist.customCostumeColor ||
															artist.costumeColor,
													}}
												></div>
												<p className="text-gray-900">
													{artist.customCostumeColor ||
														artist.costumeColor}
												</p>
											</div>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Stage Position Start
											</label>
											<p className="text-gray-900">
												{artist.stagePositionStart}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Stage Position End
											</label>
											<p className="text-gray-900">
												{artist.stagePositionEnd}
											</p>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Lighting Colors
										</label>
										<div className="flex space-x-2 mt-1">
											<div className="flex items-center">
												<div
													className="w-4 h-4 rounded-full mr-1 border"
													style={{
														backgroundColor:
															artist.lightColorSingle,
													}}
												></div>
												<span className="text-sm">
													{artist.lightColorSingle}
												</span>
											</div>
											<div className="flex items-center">
												<div
													className="w-4 h-4 rounded-full mr-1 border"
													style={{
														backgroundColor:
															artist.lightColorTwo,
													}}
												></div>
												<span className="text-sm">
													{artist.lightColorTwo}
												</span>
											</div>
											<div className="flex items-center">
												<div
													className="w-4 h-4 rounded-full mr-1 border"
													style={{
														backgroundColor:
															artist.lightColorThree,
													}}
												></div>
												<span className="text-sm">
													{artist.lightColorThree}
												</span>
											</div>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Equipment
										</label>
										<p className="text-gray-900 mt-1">
											{artist.equipment}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Light Requests
										</label>
										<p className="text-gray-900 mt-1">
											{artist.lightRequests}
										</p>
									</div>
								</TabsContent>

								<TabsContent
									value="media"
									className="space-y-4"
								>
									{/* Music Tracks */}
									{artist.musicTracks &&
										artist.musicTracks.length > 0 && (
											<div>
												<label className="text-sm font-medium text-gray-700 mb-2 block">
													Music Tracks
												</label>
												<div className="space-y-2">
													{artist.musicTracks.map(
														(track, index) => (
															<div
																key={index}
																className="p-3 border rounded-lg"
															>
																<div className="flex justify-between items-start mb-2">
																	<div>
																		<h4 className="font-medium">
																			{
																				track.song_title
																			}
																		</h4>
																		<p className="text-sm text-gray-600">
																			{formatDuration(
																				track.duration
																			)}{" "}
																			•{" "}
																			{
																				track.tempo
																			}{" "}
																			tempo
																			{track.is_main_track && (
																				<Badge className="ml-2 bg-purple-100 text-purple-800">
																					Main
																					Track
																				</Badge>
																			)}
																		</p>
																	</div>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() =>
																			downloadFile(
																				track.file_path,
																				track.song_title
																			)
																		}
																	>
																		<Download className="h-3 w-3 mr-1" />
																		Download
																	</Button>
																</div>
																{track.notes && (
																	<p className="text-sm text-gray-600 mb-2">
																		{
																			track.notes
																		}
																	</p>
																)}
																<AudioPlayer
																	src={`/api/download/${track.file_path}`}
																/>
															</div>
														)
													)}
												</div>
											</div>
										)}

									{/* Gallery Files */}
									{artist.galleryFiles &&
										artist.galleryFiles.length > 0 && (
											<div>
												<label className="text-sm font-medium text-gray-700 mb-2 block">
													Gallery
												</label>
												<div className="grid grid-cols-2 gap-4">
													{artist.galleryFiles.map(
														(file, index) => (
															<div
																key={index}
																className="border rounded-lg p-3"
															>
																<div className="flex justify-between items-start mb-2">
																	<div>
																		<h4 className="font-medium text-sm">
																			{
																				file.name
																			}
																		</h4>
																		<p className="text-xs text-gray-600">
																			{
																				file.type
																			}{" "}
																			•{" "}
																			{(
																				file.size /
																				1024 /
																				1024
																			).toFixed(
																				2
																			)}{" "}
																			MB
																		</p>
																	</div>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() =>
																			downloadFile(
																				file.file_path,
																				file.name
																			)
																		}
																	>
																		<Download className="h-3 w-3" />
																	</Button>
																</div>
																{file.type ===
																"video" ? (
																	<VideoPlayer
																		src={`/api/download/${file.file_path}`}
																	/>
																) : (
																	<div className="bg-gray-100 rounded p-4 text-center text-sm text-gray-600">
																		{
																			file.type
																		}{" "}
																		file
																	</div>
																)}
															</div>
														)
													)}
												</div>
											</div>
										)}
								</TabsContent>

								<TabsContent
									value="notes"
									className="space-y-4"
								>
									<div>
										<label className="text-sm font-medium text-gray-700">
											MC Notes
										</label>
										<p className="text-gray-900 mt-1">
											{artist.mcNotes ||
												"No MC notes provided"}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Stage Manager Notes
										</label>
										<p className="text-gray-900 mt-1">
											{artist.stageManagerNotes ||
												"No stage manager notes provided"}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											General Notes
										</label>
										<p className="text-gray-900 mt-1">
											{artist.notes ||
												"No general notes provided"}
										</p>
									</div>
								</TabsContent>
							</Tabs>
						</DialogContent>
					</Dialog>

					{artist.status === "pending" && (
						<div className="flex space-x-2">
							<Button
								onClick={() =>
									onStatusUpdate(artist.id, "approved")
								}
								className="flex-1 bg-green-600 hover:bg-green-700 text-white"
								size="sm"
							>
								<CheckCircle className="h-4 w-4 mr-1" />
								Approve
							</Button>
							<Button
								onClick={() =>
									onStatusUpdate(artist.id, "rejected")
								}
								variant="destructive"
								className="flex-1"
								size="sm"
							>
								<XCircle className="h-4 w-4 mr-1" />
								Reject
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
