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
	Calendar,
	MapPin,
	Users,
	Settings,
	Edit,
	ArrowLeft,
	Music,
	Mic,
	Clock,
	List,
	Play,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";

interface Event {
	id: string;
	name: string;
	venue: string;
	date: string;
	status: string;
	description: string;
	artists?: any[];
	settings?: {
		maxArtists: number;
	};
}

export default function EventDetailsPage() {
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "planning":
				return "bg-yellow-100 text-yellow-800";
			case "registration_open":
				return "bg-blue-100 text-blue-800";
			case "live":
				return "bg-green-100 text-green-800";
			case "completed":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading event...</p>
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

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<Link
								href="/stage-manager/events"
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										{event.name}
									</h1>
									<p className="text-sm text-gray-500">
										Event Management Dashboard
									</p>
								</div>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<Link
								href={`/stage-manager/events/${eventId}/edit`}
							>
								<Button variant="outline">
									<Edit className="h-4 w-4 mr-2" />
									Edit Event
								</Button>
							</Link>
							<Link href="/stage-manager/events">
								<Button variant="outline">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Events
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Event Info Card */}
				<Card className="mb-8">
					<CardHeader>
						<div className="flex justify-between items-start">
							<div>
								<CardTitle className="text-2xl font-bold text-gray-900 mb-2">
									{event.name}
								</CardTitle>
								<CardDescription className="text-lg">
									<div className="flex items-center space-x-4">
										<span className="flex items-center">
											<MapPin className="h-4 w-4 mr-1" />
											{event.venue}
										</span>
										<span className="flex items-center">
											<Calendar className="h-4 w-4 mr-1" />
											{formatDate(event.date)}
										</span>
									</div>
								</CardDescription>
							</div>
							<Badge className={getStatusColor(event.status)}>
								{event.status.replace("_", " ").toUpperCase()}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="flex items-center">
								<Users className="h-5 w-5 text-gray-400 mr-2" />
								<span className="text-sm text-gray-600">
									{event.artists?.length || 0} /{" "}
									{event.settings?.maxArtists || 20} Artists
								</span>
							</div>
						</div>
						{event.description && (
							<p className="text-gray-700">{event.description}</p>
						)}
					</CardContent>
				</Card>

				{/* Management Options */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Artists Management */}
					<Link href={`/stage-manager/events/${eventId}/artists`}>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<Users className="h-5 w-5 mr-2 text-purple-600" />
									Manage Artists
								</CardTitle>
								<CardDescription>
									View and manage artist registrations
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold text-purple-600">
									{event.artists?.length || 0}
								</p>
								<p className="text-sm text-gray-600">
									Registered Artists
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* Performance Order */}
					<Link
						href={`/stage-manager/events/${eventId}/performance-order`}
					>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<List className="h-5 w-5 mr-2 text-blue-600" />
									Performance Order
								</CardTitle>
								<CardDescription>
									Set the order of performances
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600">
									Organize show lineup
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* Show Order */}
					<Link href={`/stage-manager/events/${eventId}/show-order`}>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<Clock className="h-5 w-5 mr-2 text-green-600" />
									Show Order
								</CardTitle>
								<CardDescription>
									Manage show timing and schedule
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600">
									Schedule management
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* DJ Management */}
					<Link href={`/stage-manager/events/${eventId}/dj`}>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<Music className="h-5 w-5 mr-2 text-pink-600" />
									DJ Management
								</CardTitle>
								<CardDescription>
									Manage DJ and music requirements
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600">
									Music coordination
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* MC Management */}
					<Link href={`/stage-manager/events/${eventId}/mc`}>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<Mic className="h-5 w-5 mr-2 text-orange-600" />
									MC Management
								</CardTitle>
								<CardDescription>
									Manage MC and announcements
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600">
									Host coordination
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* Live Board */}
					<Link href={`/stage-manager/events/${eventId}/live-board`}>
						<Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
							<CardHeader>
								<CardTitle className="flex items-center text-lg">
									<Play className="h-5 w-5 mr-2 text-red-600" />
									Live Board
								</CardTitle>
								<CardDescription>
									Real-time event management
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600">
									Live event control
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
}
