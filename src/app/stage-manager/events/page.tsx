"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
	Plus,
	MapPin,
	Users,
	Settings,
	Eye,
	Edit,
	Trash2,
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
}

export default function EventsPage() {
	const router = useRouter();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			const response = await fetch("/api/stage-manager/events");
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setEvents(result.data.events);
				}
			} else if (response.status === 403) {
				router.push("/login");
			}
		} catch (error) {
			console.error("Error fetching events:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
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
					<p className="text-gray-600">Loading events...</p>
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
								href="/stage-manager"
								className="flex items-center"
							>
								<FameLogo
									width={40}
									height={40}
									className="mr-3"
								/>
								<div>
									<h1 className="text-xl font-semibold text-gray-900">
										My Events
									</h1>
									<p className="text-sm text-gray-500">
										Manage your events and performances
									</p>
								</div>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<Link href="/stage-manager/events/create">
								<Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
									<Plus className="h-4 w-4 mr-2" />
									Create Event
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{events.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{events.map((event) => (
							<Card
								key={event.id}
								className="hover:shadow-lg transition-all duration-300"
							>
								<CardHeader>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<CardTitle className="text-lg font-bold text-gray-900 mb-2">
												{event.name}
											</CardTitle>
											<CardDescription className="text-gray-600 flex items-center">
												<MapPin className="h-4 w-4 mr-1" />
												{event.venue}
											</CardDescription>
										</div>
										<Badge
											className={getStatusColor(
												event.status
											)}
										>
											{event.status
												.replace("_", " ")
												.toUpperCase()}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center text-sm text-gray-600">
											<Calendar className="h-4 w-4 mr-2" />
											{formatDate(event.date)}
										</div>

										<div className="flex items-center text-sm text-gray-600">
											<Users className="h-4 w-4 mr-2" />
											{event.artists?.length || 0} Artists
										</div>

										<p className="text-sm text-gray-700 line-clamp-2">
											{event.description}
										</p>

										<div className="flex space-x-2">
											<Link
												href={`/stage-manager/events/${event.id}`}
												className="flex-1"
											>
												<Button
													variant="outline"
													size="sm"
													className="w-full"
												>
													<Eye className="h-4 w-4 mr-2" />
													View
												</Button>
											</Link>
											<Link
												href={`/stage-manager/events/${event.id}/edit`}
												className="flex-1"
											>
												<Button
													variant="outline"
													size="sm"
													className="w-full"
												>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</Button>
											</Link>
										</div>

										<Link
											href={`/stage-manager/events/${event.id}/artists`}
											className="block"
										>
											<Button className="w-full bg-purple-600 hover:bg-purple-700">
												<Settings className="h-4 w-4 mr-2" />
												Manage Event
											</Button>
										</Link>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-16">
						<div className="bg-white rounded-lg shadow-sm p-12 max-w-md mx-auto">
							<Calendar className="h-16 w-16 text-gray-400 mx-auto mb-6" />
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								No Events Yet
							</h3>
							<p className="text-gray-600 mb-8">
								Create your first event to get started with
								managing shows and performances.
							</p>
							<Link href="/stage-manager/events/create">
								<Button
									size="lg"
									className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
								>
									<Plus className="h-5 w-5 mr-2" />
									Create Your First Event
								</Button>
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
