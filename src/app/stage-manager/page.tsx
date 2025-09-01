"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
	LogOut,
	Plus,
	Settings,
	MapPin,
	ExternalLink,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";
import { User } from "@/types";
import Link from "next/link";

interface StageManagerData {
	user: User;
	stats: {
		totalEvents: number;
		activeEvents: number;
		totalArtists: number;
	};
	events: Array<{
		id: string;
		name: string;
		venueName: string;
		status: string;
		startDate: string;
		endDate: string;
		description: string;
	}>;
}

export default function StageManagerPage() {
	const router = useRouter();
	const [data, setData] = useState<StageManagerData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const response = await fetch("/api/stage-manager/dashboard");
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setData(result.data);
				} else {
					console.error(
						"Failed to fetch dashboard data:",
						result.error
					);
				}
			} else if (response.status === 403) {
				// Redirect to login if unauthorized
				router.push("/login");
			} else {
				console.error("Failed to fetch dashboard data");
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);
			router.push("/login");
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "draft":
				return "bg-gray-100 text-gray-800";
			case "active":
				return "bg-green-100 text-green-800";
			case "completed":
				return "bg-blue-100 text-blue-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading dashboard...</p>
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
							<FameLogo width={40} height={40} className="mr-3" />
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Stage Manager Dashboard
								</h1>
								<p className="text-sm text-gray-500">
									{data?.user?.profile?.firstName}{" "}
									{data?.user?.profile?.lastName} •{" "}
									{data?.user?.email}
									{data?.events &&
										data.events.length > 0 &&
										` • Managing ${
											data.events.length
										} event${
											data.events.length !== 1 ? "s" : ""
										}`}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => window.location.reload()}
							>
								Refresh Events
							</Button>
							<Link href="/stage-manager/profile">
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4 mr-2" />
									Profile
								</Button>
							</Link>
							<Button variant="outline" onClick={handleLogout}>
								<LogOut className="h-4 w-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome Section */}
				<div className="mb-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Welcome, {data?.user?.profile?.firstName}{" "}
							{data?.user?.profile?.lastName}!
						</h2>
						<p className="text-lg text-gray-600 mb-2">
							Manage your events and create amazing experiences
						</p>
						<div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
							<span>Stage Manager ID: {data?.user?.id}</span>
							<span>•</span>
							<span>
								Status:{" "}
								<span className="capitalize font-medium text-green-600">
									{data?.user?.status}
								</span>
							</span>
						</div>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Calendar className="h-8 w-8 text-purple-600" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">
										Total Events
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{data?.stats?.totalEvents || 0}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
									<div className="h-4 w-4 bg-green-600 rounded-full"></div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">
										Active Events
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{data?.stats?.activeEvents || 0}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
									<span className="text-blue-600 font-bold text-sm">
										A
									</span>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">
										Total Artists
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{data?.stats?.totalArtists || 0}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* My Events Section */}
				<div className="mb-8">
					<Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
						<CardHeader>
							<CardTitle className="text-2xl font-bold flex items-center">
								<Calendar className="h-6 w-6 mr-3" />
								My Events
							</CardTitle>
							<CardDescription className="text-purple-100">
								Manage your assigned events and create new ones
								(Filtered by your Stage Manager ID)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/stage-manager/events">
								<Button
									size="lg"
									className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
								>
									Access My Events
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>

				{/* Stage Manager Info Card */}
				<div className="mb-8">
					<Card className="bg-white border border-gray-200 shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg font-semibold text-gray-900">
								Stage Manager Profile
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Full Name
									</p>
									<p className="text-lg font-semibold text-gray-900">
										{data?.user?.profile?.firstName}{" "}
										{data?.user?.profile?.lastName}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">
										Email
									</p>
									<p className="text-lg text-gray-900">
										{data?.user?.email}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">
										Manager ID
									</p>
									<p className="text-lg font-mono text-gray-900">
										{data?.user?.id}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Events List */}
				{data?.events && data.events.length > 0 ? (
					<div>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold text-gray-900">
								Your Events ({data.events.length})
							</h3>
							<p className="text-sm text-gray-500">
								Filtered by Stage Manager ID: {data?.user?.id}
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{data.events.map((event, index) => (
								<Card
									key={event.id}
									className="hover:shadow-lg transition-all duration-300 hover:scale-105"
								>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<CardTitle className="text-lg font-bold text-gray-900 mb-2">
													{event.name}
												</CardTitle>
												<CardDescription className="text-gray-600 flex items-center">
													<MapPin className="h-4 w-4 mr-1" />
													{event.venueName}
												</CardDescription>
											</div>
											<Badge
												className={getStatusColor(
													event.status
												)}
											>
												{event.status
													.charAt(0)
													.toUpperCase() +
													event.status.slice(1)}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex items-center text-sm text-gray-600">
												<Calendar className="h-4 w-4 mr-2" />
												{formatDate(event.startDate)} -{" "}
												{formatDate(event.endDate)}
											</div>

											<p className="text-sm text-gray-700 line-clamp-2">
												{event.description}
											</p>

											<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
												<span className="font-medium">
													Stage Manager:
												</span>{" "}
												{data?.user?.profile?.firstName}{" "}
												{data?.user?.profile?.lastName}
												{(event as any)
													.stageManagerId && (
													<span className="ml-2">
														• ID:{" "}
														{
															(event as any)
																.stageManagerId
														}
													</span>
												)}
											</div>

											<div className="space-y-4">
												<div className="p-2 bg-gray-100 rounded-md text-sm break-all">
													{(() => {
														const origin =
															typeof window !==
															"undefined"
																? window
																		.location
																		.origin
																: process.env
																		.NEXT_PUBLIC_BASE_URL ||
																  "http://localhost:3000";
														return `${origin}/artist-register/${event.id}`;
													})()}
												</div>
												<Link
													href={`/stage-manager/events/${event.id}/artists`}
												>
													<Button className="w-full bg-purple-600 hover:bg-purple-700">
														<ExternalLink className="h-4 w-4 mr-2" />
														Manage Artists
													</Button>
												</Link>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
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
