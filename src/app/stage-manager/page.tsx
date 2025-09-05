"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Calendar,
	LogOut,
	Plus,
	Settings,
	MapPin,
	ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Event } from "@/lib/types/event";
import { motion } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useRouter } from "next/navigation";

export default function StageManagerDashboard() {
	const [user, setUser] = useState<any>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState<{
		type: "success" | "error" | "info";
		message: string;
	} | null>(null);
	const router = useRouter();

	// WebSocket for real-time notifications
	useWebSocket({
		userId: user?.id,
		role: "stage_manager",
		onAdminNotification: (data) => {
			if (
				data.action === "deactivate" ||
				data.action === "delete" ||
				data.action === "changeCredentials"
			) {
				setAlert({
					type: "error",
					message: data.message,
				});

				// Redirect to login after showing the message
				setTimeout(() => {
					router.push("/login");
				}, 3000);
			}
		},
	});

	useEffect(() => {
		// Check if user session needs to be refreshed
		const refreshSessionIfNeeded = async () => {
			try {
				const response = await fetch("/api/auth/refresh-session", {
					method: "POST",
				});
				if (response.ok) {
					const result = await response.json();
					if (
						result.success &&
						result.data.user.status === "pending"
					) {
						// User is still pending, redirect to pending page
						router.push("/stage-manager-pending");
						return;
					}
				}
			} catch (error) {
				console.error("Failed to refresh session:", error);
			}

			// Proceed with normal dashboard loading
			fetchDashboardData();
		};

		refreshSessionIfNeeded();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);

			// Fetch user data
			const userResponse = await fetch("/api/stage-manager/profile");
			if (userResponse.ok) {
				const userResult = await userResponse.json();
				console.log("User data:", userResult.data?.user); // Debug log
				setUser(userResult.data?.user);
			} else {
				console.error(
					"Failed to fetch user data:",
					userResponse.status
				);
			}

			// Fetch events
			const eventsResponse = await fetch("/api/events");
			if (eventsResponse.ok) {
				const eventsResult = await eventsResponse.json();
				setEvents(eventsResult.data || []);
			} else {
				console.error("Failed to fetch events:", eventsResponse.status);
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const requestEvents = () => {
		fetchDashboardData();
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return "No date";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (error) {
			return "Invalid date";
		}
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
							<Image
								src="/fame-logo.png"
								alt="FAME Logo"
								width={40}
								height={40}
								className="mr-3"
							/>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Stage Manager Dashboard
								</h1>
								<p className="text-sm text-gray-500">
									{user?.profile?.firstName &&
									user?.profile?.lastName
										? `${user.profile.firstName} ${user.profile.lastName} - ${user.email}`
										: user?.email || "Stage Manager"}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								size="sm"
								onClick={requestEvents}
								disabled={loading}
							>
								{loading ? "Loading..." : "Refresh Events"}
							</Button>
							<Link href="/stage-manager/profile">
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4 mr-2" />
									Profile
								</Button>
							</Link>
							<Button
								variant="outline"
								onClick={async () => {
									try {
										const response = await fetch(
											"/api/auth/logout",
											{
												method: "POST",
											}
										);
										if (response.ok) {
											window.location.href = "/login";
										}
									} catch (error) {
										console.error("Logout error:", error);
									}
								}}
							>
								<LogOut className="h-4 w-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Alert for admin notifications */}
				{alert && (
					<Alert
						className={`mb-6 ${
							alert.type === "success"
								? "border-green-500 bg-green-50"
								: alert.type === "error"
								? "border-red-500 bg-red-50"
								: "border-blue-500 bg-blue-50"
						}`}
					>
						<AlertDescription
							className={`${
								alert.type === "success"
									? "text-green-700"
									: alert.type === "error"
									? "text-red-700"
									: "text-blue-700"
							}`}
						>
							{alert.message}
						</AlertDescription>
					</Alert>
				)}

				{/* Welcome Section */}
				<motion.div
					className="mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<div className="text-center">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Welcome,{" "}
							{user?.profile?.firstName && user?.profile?.lastName
								? `${user.profile.firstName} ${user.profile.lastName}`
								: user?.email?.split("@")[0] || "Stage Manager"}
							!
						</h2>
						<p className="text-lg text-gray-600">
							Manage your events and create amazing experiences
						</p>
					</div>
				</motion.div>

				{/* My Events Section */}
				<motion.div
					className="mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
						<CardHeader>
							<CardTitle className="text-2xl font-bold flex items-center">
								<Calendar className="h-6 w-6 mr-3" />
								My Events
							</CardTitle>
							<CardDescription className="text-purple-100">
								Manage your assigned events and create new ones
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
				</motion.div>

				{/* Loading State for Events */}
				{loading && events.length === 0 && (
					<motion.div
						className="text-center py-16"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						<div className="bg-white rounded-lg shadow-sm p-12 max-w-md mx-auto">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Loading Events...
							</h3>
							<p className="text-gray-600">
								Please wait while we fetch your events.
							</p>
						</div>
					</motion.div>
				)}

				{/* Events List */}
				{!loading && events.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						<h3 className="text-xl font-semibold text-gray-900 mb-4">
							Your Events ({events.length})
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{events.map((event, index) => (
								<motion.div
									key={event.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.6,
										delay: 0.1 * index,
									}}
								>
									<Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
										<CardHeader>
											<div className="flex justify-between items-start">
												<div className="flex-1">
													<CardTitle className="text-lg font-bold text-gray-900 mb-2">
														{event.name ||
															"Untitled Event"}
													</CardTitle>
													<CardDescription className="text-gray-600 flex items-center">
														<MapPin className="h-4 w-4 mr-1" />
														{event.venueName ||
															"No venue"}
													</CardDescription>
												</div>
												<Badge
													className={getStatusColor(
														event.status || "draft"
													)}
												>
													{(event.status || "draft")
														.charAt(0)
														.toUpperCase() +
														(
															event.status ||
															"draft"
														).slice(1)}
												</Badge>
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												<div className="flex items-center text-sm text-gray-600">
													<Calendar className="h-4 w-4 mr-2" />
													{formatDate(
														event.startDate
													)}{" "}
													-{" "}
													{formatDate(event.endDate)}
												</div>

												<p className="text-sm text-gray-700 line-clamp-2">
													{event.description ||
														"No description"}
												</p>

												<div className="space-y-4">
													<div className="p-2 bg-muted rounded-md text-sm break-all">
														{(() => {
															const origin =
																typeof window !==
																"undefined"
																	? window
																			.location
																			.origin
																	: process
																			.env
																			.NEXT_PUBLIC_BASE_URL ||
																	  "http://localhost:3000";
															return `${origin}/artist-register/${event.id}`;
														})()}
													</div>
													<Link
														href={`/stage-manager/events/${event.id}`}
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
								</motion.div>
							))}
						</div>
					</motion.div>
				)}

				{!loading && events.length === 0 && (
					<motion.div
						className="text-center py-16"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
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
					</motion.div>
				)}
			</div>
		</div>
	);
}
