"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	ArrowLeft,
	Users,
	Calendar,
	CheckCircle,
	Clock,
	Star,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Artist {
	id: string;
	artistName: string;
	realName?: string;
	style: string;
	performanceDuration: number;
	status: "pending" | "approved" | "rejected";
	email?: string;
	phone?: string;
}

interface Event {
	id: string;
	name: string;
	venueName: string;
}

export default function ArtistsManagement() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (eventId) {
			fetchEventData();
			fetchArtists();
		}
	}, [eventId]);

	const fetchEventData = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`);
			if (response.ok) {
				const data = await response.json();
				setEvent(data.data);
			}
		} catch (error) {
			console.error("Error fetching event data:", error);
		}
	};

	const fetchArtists = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/events/${eventId}/artists`);
			if (response.ok) {
				const data = await response.json();
				setArtists(data.artists || []);
			}
		} catch (error) {
			console.error("Error fetching artists:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "approved":
				return (
					<Badge className="bg-green-500 text-white">Approved</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-yellow-500 text-white">Pending</Badge>
				);
			case "rejected":
				return (
					<Badge className="bg-red-500 text-white">Rejected</Badge>
				);
			default:
				return <Badge variant="outline">Unknown</Badge>;
		}
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

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href={`/stage-manager/events/${eventId}`}
								className="mr-4"
							>
								<Button variant="ghost" size="sm">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Event
								</Button>
							</Link>
							<Image
								src="/fame-logo.png"
								alt="FAME Logo"
								width={40}
								height={40}
								className="mr-3"
							/>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Artists Management
								</h1>
								<p className="text-sm text-gray-500">
									{event?.name} at {event?.venueName}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							<span className="text-sm text-muted-foreground">
								Registered Artists
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
				>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center">
								<Users className="h-8 w-8 text-purple-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Total Artists
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{artists.length}
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
									<p className="text-sm font-medium text-gray-600">
										Approved
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{
											artists.filter(
												(a) => a.status === "approved"
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
								<Clock className="h-8 w-8 text-yellow-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Pending
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{
											artists.filter(
												(a) => a.status === "pending"
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
								<Star className="h-8 w-8 text-blue-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										Performance Ready
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{
											artists.filter(
												(a) => a.status === "approved"
											).length
										}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Artists Table */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Registered Artists
						</CardTitle>
					</CardHeader>
					<CardContent>
						{artists.length === 0 ? (
							<div className="text-center py-8">
								<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-500">
									No artists registered for this event yet
								</p>
								<p className="text-sm text-gray-400 mt-2">
									Artists will appear here once they register
									for your event
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Artist</TableHead>
										<TableHead>Style</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Contact</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{artists.map((artist) => (
										<TableRow key={artist.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-8 w-8">
														<AvatarFallback>
															{artist.artistName
																.charAt(0)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">
															{artist.artistName}
														</p>
														{artist.realName && (
															<p className="text-xs text-muted-foreground">
																{
																	artist.realName
																}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{artist.style}
												</Badge>
											</TableCell>
											<TableCell>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{artist.performanceDuration}{" "}
													min
												</span>
											</TableCell>
											<TableCell>
												{getStatusBadge(artist.status)}
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{artist.email && (
														<p className="text-gray-600">
															{artist.email}
														</p>
													)}
													{artist.phone && (
														<p className="text-gray-500">
															{artist.phone}
														</p>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
