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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	LogOut,
	UserCheck,
	UserX,
	Clock,
	AlertCircle,
	CheckCircle,
	Users,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";
import { User } from "@/types";

interface SuperAdminData {
	pendingRegistrations: User[];
	allStageManagers: User[];
}

export default function SuperAdminPage() {
	const router = useRouter();
	const [data, setData] = useState<SuperAdminData | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const response = await fetch("/api/super-admin/dashboard");
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
			} else {
				console.error("Failed to fetch dashboard data");
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleUserAction = async (action: string, userId: string) => {
		setActionLoading(userId);
		try {
			const response = await fetch("/api/super-admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action,
					userId,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					alert(
						result.data?.message ||
							`${action} completed successfully`
					);
					await fetchData();
				} else {
					alert(result.error?.message || `Failed to ${action} user`);
				}
			} else {
				alert(`Failed to ${action} user`);
			}
		} catch (error) {
			console.error(`Error performing ${action}:`, error);
			alert("Network error occurred");
		} finally {
			setActionLoading(null);
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

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
			pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
			suspended: { color: "bg-red-100 text-red-800", icon: AlertCircle },
			deactivated: { color: "bg-gray-100 text-gray-800", icon: Users },
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.pending;
		const Icon = config.icon;

		return (
			<Badge className={`flex items-center gap-1 w-fit ${config.color}`}>
				<Icon className="h-3 w-3" />
				{status}
			</Badge>
		);
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-black text-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p>Loading Super Admin Dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-black text-white">
			{/* Header */}
			<header className="bg-gray-900 border-b border-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<FameLogo width={40} height={40} className="mr-3" />
							<div>
								<h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
									Super Admin Dashboard
								</h1>
								<p className="text-sm text-gray-400">
									Stage Manager Management
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								onClick={handleLogout}
								className="border-gray-600 text-gray-300 hover:bg-gray-800"
							>
								<LogOut className="h-4 w-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Card className="bg-gray-900 border-gray-800">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Clock className="h-8 w-8 text-yellow-400" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">
										Pending Approvals
									</p>
									<p className="text-2xl font-bold text-white">
										{data?.pendingRegistrations?.length ||
											0}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="bg-gray-900 border-gray-800">
						<CardContent className="p-6">
							<div className="flex items-center">
								<Users className="h-8 w-8 text-blue-400" />
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">
										Total Stage Managers
									</p>
									<p className="text-2xl font-bold text-white">
										{data?.allStageManagers?.length || 0}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Tabs */}
				<Tabs defaultValue="pending" className="w-full">
					<TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
						<TabsTrigger
							value="pending"
							className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
						>
							Pending Approvals (
							{data?.pendingRegistrations?.length || 0})
						</TabsTrigger>
						<TabsTrigger
							value="stage-managers"
							className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
						>
							All Stage Managers (
							{data?.allStageManagers?.length || 0})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="pending" className="space-y-6">
						<Card className="bg-gray-900 border-gray-800">
							<CardHeader>
								<CardTitle className="text-white">
									Pending Stage Manager Registrations
								</CardTitle>
								<CardDescription className="text-gray-400">
									Review and approve new Stage Manager
									applications
								</CardDescription>
							</CardHeader>
							<CardContent>
								{!data?.pendingRegistrations?.length ? (
									<div className="text-center py-8 text-gray-400">
										<Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p className="text-lg">
											No pending registrations
										</p>
										<p className="text-sm">
											New registrations will appear here
											for approval
										</p>
									</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow className="border-gray-800">
												<TableHead className="text-gray-300">
													Name
												</TableHead>
												<TableHead className="text-gray-300">
													Email
												</TableHead>
												<TableHead className="text-gray-300">
													Phone
												</TableHead>
												<TableHead className="text-gray-300">
													Registered
												</TableHead>
												<TableHead className="text-gray-300">
													Status
												</TableHead>
												<TableHead className="text-gray-300">
													Actions
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{data.pendingRegistrations.map(
												(user) => (
													<TableRow
														key={user.id}
														className="border-gray-800"
													>
														<TableCell className="text-white font-medium">
															{
																user.profile
																	.firstName
															}{" "}
															{
																user.profile
																	.lastName
															}
														</TableCell>
														<TableCell className="text-gray-300">
															{user.email}
														</TableCell>
														<TableCell className="text-gray-300">
															{user.profile
																.phone || "-"}
														</TableCell>
														<TableCell className="text-gray-300">
															{formatDate(
																user.createdAt
															)}
														</TableCell>
														<TableCell>
															{getStatusBadge(
																user.status
															)}
														</TableCell>
														<TableCell className="space-x-2">
															<Button
																size="sm"
																onClick={() =>
																	handleUserAction(
																		"approve",
																		user.id
																	)
																}
																disabled={
																	actionLoading ===
																	user.id
																}
																className="bg-green-600 hover:bg-green-700"
															>
																{actionLoading ===
																user.id ? (
																	<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
																) : (
																	<UserCheck className="h-4 w-4 mr-1" />
																)}
																Approve
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	handleUserAction(
																		"reject",
																		user.id
																	)
																}
																disabled={
																	actionLoading ===
																	user.id
																}
																className="border-red-600 text-red-400 hover:bg-red-900/20"
															>
																{actionLoading ===
																user.id ? (
																	<div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
																) : (
																	<UserX className="h-4 w-4 mr-1" />
																)}
																Reject
															</Button>
														</TableCell>
													</TableRow>
												)
											)}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="stage-managers" className="space-y-6">
						<Card className="bg-gray-900 border-gray-800">
							<CardHeader>
								<CardTitle className="text-white">
									All Stage Managers
								</CardTitle>
								<CardDescription className="text-gray-400">
									View all Stage Manager accounts
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow className="border-gray-800">
											<TableHead className="text-gray-300">
												Name
											</TableHead>
											<TableHead className="text-gray-300">
												Email
											</TableHead>
											<TableHead className="text-gray-300">
												Status
											</TableHead>
											<TableHead className="text-gray-300">
												Last Login
											</TableHead>
											<TableHead className="text-gray-300">
												Created
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data?.allStageManagers?.map((user) => (
											<TableRow
												key={user.id}
												className="border-gray-800"
											>
												<TableCell className="text-white font-medium">
													{user.profile.firstName}{" "}
													{user.profile.lastName}
												</TableCell>
												<TableCell className="text-gray-300">
													{user.email}
												</TableCell>
												<TableCell>
													{getStatusBadge(
														user.status
													)}
												</TableCell>
												<TableCell className="text-gray-300">
													{user.lastLogin
														? formatDate(
																user.lastLogin
														  )
														: "Never"}
												</TableCell>
												<TableCell className="text-gray-300">
													{formatDate(user.createdAt)}
												</TableCell>
											</TableRow>
										)) || []}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
