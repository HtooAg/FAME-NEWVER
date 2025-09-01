"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	ArrowLeft,
	Check,
	X,
	Clock,
	Mail,
	Phone,
	Music,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Artist {
	id: string;
	email: string;
	profile: {
		artistName: string;
		realName: string;
		phone?: string;
		performanceStyle: string;
		duration: number;
		biography: string;
	};
	registrationDate: string;
	approvalStatus: "pending" | "approved" | "rejected";
}

interface Event {
	id: string;
	name: string;
	venue: string;
	artists: Artist[];
}

export default function ArtistsManagementPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (eventId) {
			fetchEvent();
		}
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			const response = await fetch(
				`/api/stage-manager/events/${eventId}`
			);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setEvent(result.data.event);
				}
			} else if (response.status === 403) {
				router.push("/login");
			} else if (response.status === 404) {
				router.push("/stage-manager/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleApproval = async (
		artistId: string,
		status: "approved" | "rejected"
	) => {
		try {
			const response = await fetch(
				`/api/stage-manager/events/${eventId}/artists/${artistId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ approvalStatus: status }),
				}
			);

			if (response.ok) {
				// Refresh the event data
				fetchEvent();
			}
		} catch (error) {
			console.error("Error updating artist approval:", error);
		}
	};

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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading artists...</p>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Event Not Found
					</h2>
					<Link href="/stage-manager/events">
						<Button>Back to Events</Button>
					</Link>
				</div>
			</div>
		);
	}

	const pendingArtists =
		event.artists?.filter((a) => a.approvalStatus === "pending") || [];
	const approvedArtists =
		event.artists?.filter((a) => a.approvalStatus === "approved") || [];
	const rejectedArtists =
		event.artists?.filter((a) => a.approvalStatus === "rejected") || [];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										Artist Management
									</h1>
									<p className="text-sm text-gray-500">
										{event.name} • {event.venue}
									</p>
								</div>
							</Link>
						</div>
						<Link href={`/stage-manager/events/${eventId}`}>
							<Button variant="outline">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Event
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Users className="h-8 w-8 text-blue-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										{event.artists?.length || 0}
									</p>
									<p className="text-sm text-gray-600">
										Total Artists
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
									<p className="text-2xl font-bold text-gray-900">
										{pendingArtists.length}
									</p>
									<p className="text-sm text-gray-600">
										Pending
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Check className="h-8 w-8 text-green-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										{approvedArtists.length}
									</p>
									<p className="text-sm text-gray-600">
										Approved
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<X className="h-8 w-8 text-red-600" />
								<div className="ml-4">
									<p className="text-2xl font-bold text-gray-900">
										{rejectedArtists.length}
									</p>
									<p className="text-sm text-gray-600">
										Rejected
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Pending Approvals */}
				{pendingArtists.length > 0 && (
					<div className="mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-4">
							Pending Approvals ({pendingArtists.length})
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{pendingArtists.map((artist) => (
								<Card
									key={artist.id}
									className="border-yellow-200"
								>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="text-lg">
													{artist.profile.artistName}
												</CardTitle>
												<CardDescription>
													{artist.profile.realName}
												</CardDescription>
											</div>
											<Badge
												className={getStatusColor(
													artist.approvalStatus
												)}
											>
												{artist.approvalStatus.toUpperCase()}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex items-center text-sm text-gray-600">
												<Mail className="h-4 w-4 mr-2" />
												{artist.email}
											</div>
											{artist.profile.phone && (
												<div className="flex items-center text-sm text-gray-600">
													<Phone className="h-4 w-4 mr-2" />
													{artist.profile.phone}
												</div>
											)}
											<div className="flex items-center text-sm text-gray-600">
												<Music className="h-4 w-4 mr-2" />
												{
													artist.profile
														.performanceStyle
												}{" "}
												• {artist.profile.duration} min
											</div>
											<p className="text-sm text-gray-700 line-clamp-2">
												{artist.profile.biography}
											</p>
											<p className="text-xs text-gray-500">
												Registered:{" "}
												{formatDate(
													artist.registrationDate
												)}
											</p>
											<div className="flex space-x-2 pt-2">
												<Button
													size="sm"
													className="flex-1 bg-green-600 hover:bg-green-700"
													onClick={() =>
														handleApproval(
															artist.id,
															"approved"
														)
													}
												>
													<Check className="h-4 w-4 mr-1" />
													Approve
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
													onClick={() =>
														handleApproval(
															artist.id,
															"rejected"
														)
													}
												>
													<X className="h-4 w-4 mr-1" />
													Reject
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* Approved Artists */}
				{approvedArtists.length > 0 && (
					<div className="mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-4">
							Approved Artists ({approvedArtists.length})
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{approvedArtists.map((artist) => (
								<Card
									key={artist.id}
									className="border-green-200"
								>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="text-lg">
													{artist.profile.artistName}
												</CardTitle>
												<CardDescription>
													{artist.profile.realName}
												</CardDescription>
											</div>
											<Badge
												className={getStatusColor(
													artist.approvalStatus
												)}
											>
												{artist.approvalStatus.toUpperCase()}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex items-center text-sm text-gray-600">
												<Music className="h-4 w-4 mr-2" />
												{
													artist.profile
														.performanceStyle
												}{" "}
												• {artist.profile.duration} min
											</div>
											<p className="text-sm text-gray-700 line-clamp-2">
												{artist.profile.biography}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* No Artists Message */}
				{(!event.artists || event.artists.length === 0) && (
					<div className="text-center py-16">
						<div className="bg-white rounded-lg shadow-sm p-12 max-w-md mx-auto">
							<Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								No Artists Yet
							</h3>
							<p className="text-gray-600 mb-8">
								Artists will appear here once they register for
								your event.
							</p>
							<div className="p-4 bg-gray-100 rounded-md text-sm break-all">
								{(() => {
									const origin =
										typeof window !== "undefined"
											? window.location.origin
											: "http://localhost:3000";
									return `${origin}/artist-register/${eventId}`;
								})()}
							</div>
							<p className="text-xs text-gray-500 mt-2">
								Share this registration link with artists
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
