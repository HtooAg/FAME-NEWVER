"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Calendar, Shield, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
	const [profileData, setProfileData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/stage-manager/profile");
			const result = await response.json();

			if (result.success && result.data?.user) {
				const user = result.data.user;
				setProfileData({
					id: user.id,
					name:
						`${user.profile?.firstName || ""} ${
							user.profile?.lastName || ""
						}`.trim() || user.email,
					email: user.email,
					role: user.role,
					accountStatus: user.status,
					subscriptionStatus: user.subscriptionStatus || "active",
					subscriptionEndDate:
						user.subscriptionEndDate || "2024-12-31",
					eventId: user.eventId || null,
					firstName: user.profile?.firstName || "",
					lastName: user.profile?.lastName || "",
					phone: user.profile?.phone || "",
				});
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "suspended":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "Not set";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (loading || !profileData) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading profile...</p>
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
							<Link href="/stage-manager/events" className="mr-4">
								<Button variant="ghost" size="sm">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Events
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
									Profile Settings
								</h1>
								<p className="text-sm text-gray-500">
									Manage your account information
								</p>
							</div>
						</div>
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
			</header>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Profile Overview */}
					<div className="lg:col-span-1">
						<Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
							<CardHeader className="text-center">
								<div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
									<User className="h-10 w-10 text-white" />
								</div>
								<CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
									{profileData?.name}
								</CardTitle>
								<CardDescription className="text-purple-700 font-medium">
									Stage Manager
								</CardDescription>
								<div className="mt-4">
									<Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
										{profileData?.accountStatus
											?.charAt(0)
											.toUpperCase() +
											profileData?.accountStatus?.slice(
												1
											)}
									</Badge>
								</div>
							</CardHeader>
						</Card>
					</div>

					{/* Profile Details */}
					<div className="lg:col-span-2 space-y-6">
						<Card className="border-2 border-purple-100 shadow-lg">
							<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
								<CardTitle className="flex items-center text-purple-800">
									<User className="h-5 w-5 mr-2 text-purple-600" />
									Personal Information
								</CardTitle>
								<CardDescription className="text-purple-600">
									Your basic account information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 bg-white">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label
											htmlFor="name"
											className="text-purple-700 font-medium"
										>
											Full Name
										</Label>
										<Input
											id="name"
											value={profileData?.name || ""}
											disabled
											className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800"
										/>
									</div>
									<div>
										<Label
											htmlFor="email"
											className="text-purple-700 font-medium"
										>
											Email Address
										</Label>
										<Input
											id="email"
											value={profileData?.email || ""}
											disabled
											className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800"
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-purple-100 shadow-lg">
							<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
								<CardTitle className="flex items-center text-purple-800">
									<Shield className="h-5 w-5 mr-2 text-purple-600" />
									Account Status
								</CardTitle>
								<CardDescription className="text-purple-600">
									Your account and subscription details
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 bg-white">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<Label className="text-purple-700 font-medium">
											Account Status
										</Label>
										<div className="mt-1">
											<Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
												{profileData?.accountStatus
													?.charAt(0)
													.toUpperCase() +
													profileData?.accountStatus?.slice(
														1
													)}
											</Badge>
										</div>
									</div>
									<div>
										<Label className="text-purple-700 font-medium">
											Subscription Status
										</Label>
										<div className="mt-1">
											<Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md">
												{profileData?.subscriptionStatus
													?.charAt(0)
													.toUpperCase() +
													profileData?.subscriptionStatus?.slice(
														1
													) || "Active"}
											</Badge>
										</div>
									</div>
								</div>

								{profileData?.eventId && (
									<div>
										<Label className="text-purple-700 font-medium">
											Assigned Event ID
										</Label>
										<Input
											value={profileData.eventId}
											disabled
											className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 font-mono text-sm text-purple-800"
										/>
									</div>
								)}
							</CardContent>
						</Card>

						<Card className="border-2 border-purple-100 shadow-lg">
							<CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
								<CardTitle className="flex items-center text-purple-800">
									<Calendar className="h-5 w-5 mr-2 text-purple-600" />
									Registration Details
								</CardTitle>
								<CardDescription className="text-purple-600">
									Information about your account registration
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 bg-white">
								<div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
									<p className="text-sm text-blue-800 mb-2 font-semibold">
										Account Information:
									</p>
									<ul className="text-sm text-blue-700 space-y-1">
										<li>• Role: Stage Manager</li>
										<li>• Account Type: Professional</li>
										<li>
											• Registration Method: Web Interface
										</li>
										<li>
											• Approval Status:{" "}
											{profileData?.accountStatus ===
											"active"
												? "Approved by Admin"
												: "Pending Admin Review"}
										</li>
									</ul>
								</div>

								{profileData?.accountStatus === "pending" && (
									<div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
										<p className="text-sm text-yellow-800">
											<strong>Pending Approval:</strong>{" "}
											Your account is currently being
											reviewed by our admin team. You'll
											receive full access once approved.
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
