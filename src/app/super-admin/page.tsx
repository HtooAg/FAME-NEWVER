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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	LogOut,
	UserCheck,
	UserX,
	Clock,
	AlertCircle,
	CheckCircle,
	Users,
	UserMinus,
	Trash2,
	Key,
} from "lucide-react";
import { FameLogo } from "@/components/ui/fame-logo";
import { User } from "@/types";
import { useWebSocket } from "@/hooks/useWebSocket";

interface SuperAdminData {
	pendingRegistrations: User[];
	allStageManagers: User[];
}

export default function SuperAdminPage() {
	const router = useRouter();
	const [data, setData] = useState<SuperAdminData | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [changePasswordDialog, setChangePasswordDialog] = useState<{
		open: boolean;
		user: User | null;
	}>({ open: false, user: null });
	const [newPassword, setNewPassword] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [notifications, setNotifications] = useState<
		Array<{
			id: string;
			message: string;
			type: "info" | "success" | "warning" | "error";
			timestamp: Date;
		}>
	>([]);

	const { sendStatusUpdate, sendAdminAction } = useWebSocket({
		userId: "admin",
		role: "super_admin",
		onNewRegistration: (data) => {
			console.log("New registration received:", data);
			// Add notification
			const notification = {
				id: Date.now().toString(),
				message: `New stage manager registration: ${data.user.firstName} ${data.user.lastName}`,
				type: "info" as const,
				timestamp: new Date(),
			};
			setNotifications((prev) => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
			// Refresh data to show new registration
			fetchData();
		},
		onAdminActionPerformed: (data) => {
			console.log("Admin action performed:", data);
			// Add notification for actions performed by other admins
			if (data.performedBy !== "admin") {
				const notification = {
					id: Date.now().toString(),
					message: `Admin action: ${data.action} performed on user ${
						data.user?.profile?.firstName || "Unknown"
					}`,
					type: "success" as const,
					timestamp: new Date(),
				};
				setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
			}
			// Refresh data to reflect changes
			fetchData();
		},
	});

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

	const handleUserAction = async (
		action: string,
		userId: string,
		additionalData?: any
	) => {
		setActionLoading(userId);
		try {
			const response = await fetch("/api/super-admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action,
					userId,
					...additionalData,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					alert(
						result.data?.message ||
							`${action} completed successfully`
					);

					// Send real-time notification to the affected user
					const actionMessages = {
						approve: "Your account has been approved!",
						reject: "Your account has been rejected.",
						deactivate: "Your account has been deactivated.",
						delete: "Your account has been deleted.",
						changeCredentials:
							"Your login credentials have been updated.",
					};

					if (action === "approve") {
						sendStatusUpdate(
							userId,
							"active",
							actionMessages[
								action as keyof typeof actionMessages
							]
						);
					} else {
						sendAdminAction(
							userId,
							action,
							actionMessages[
								action as keyof typeof actionMessages
							]
						);
					}

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

	const handleChangePassword = async () => {
		if (!changePasswordDialog.user || !newPassword || !newUsername) {
			alert("Please fill in all fields");
			return;
		}

		await handleUserAction(
			"changeCredentials",
			changePasswordDialog.user.id,
			{
				newPassword,
				newUsername,
			}
		);

		setChangePasswordDialog({ open: false, user: null });
		setNewPassword("");
		setNewUsername("");
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
			<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p>Loading Super Admin Dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 text-white">
			{/* Header */}
			<header className="bg-purple-800/50 border-b border-purple-600">
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
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
								<span className="text-gray-400">
									Real-time updates active
								</span>
							</div>
							<Button
								variant="outline"
								onClick={handleLogout}
								className="bg-gradient-to-br from-purple-50 to-pink-50"
							>
								<LogOut className="h-4 w-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{/* Real-time Notifications */}
				{notifications.length > 0 && (
					<div className="space-y-2">
						{notifications.map((notification) => (
							<div
								key={notification.id}
								className={`p-4 rounded-lg border-l-4 ${
									notification.type === "info"
										? "bg-blue-900/20 border-blue-500 text-blue-200"
										: notification.type === "success"
										? "bg-green-900/20 border-green-500 text-green-200"
										: notification.type === "warning"
										? "bg-yellow-900/20 border-yellow-500 text-yellow-200"
										: "bg-red-900/20 border-red-500 text-red-200"
								} animate-in slide-in-from-top-2 duration-300`}
							>
								<div className="flex justify-between items-start">
									<p className="text-sm font-medium">
										{notification.message}
									</p>
									<button
										onClick={() =>
											setNotifications((prev) =>
												prev.filter(
													(n) =>
														n.id !== notification.id
												)
											)
										}
										className="text-gray-400 hover:text-white ml-4"
									>
										×
									</button>
								</div>
								<p className="text-xs opacity-75 mt-1">
									{notification.timestamp.toLocaleTimeString()}
								</p>
							</div>
						))}
					</div>
				)}

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Card className="bg-purple-800/50 border-purple-600">
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
					<Card className="bg-purple-800/50 border-purple-600">
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
					<TabsList className="grid w-full grid-cols-2 bg-purple-800/50 border-purple-600">
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
						<Card className="bg-purple-800/50 border-purple-600">
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
						<Card className="bg-purple-800/50 border-purple-600">
							<CardHeader>
								<CardTitle className="text-white">
									All Stage Managers
								</CardTitle>
								<CardDescription className="text-gray-400">
									Manage Stage Manager accounts
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
											<TableHead className="text-gray-300">
												Actions
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
												<TableCell className="space-x-2">
													{user.status ===
														"active" && (
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																handleUserAction(
																	"deactivate",
																	user.id
																)
															}
															disabled={
																actionLoading ===
																user.id
															}
															className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
														>
															{actionLoading ===
															user.id ? (
																<div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
															) : (
																<UserMinus className="h-4 w-4 mr-1" />
															)}
															Deactivate
														</Button>
													)}

													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															setChangePasswordDialog(
																{
																	open: true,
																	user,
																}
															)
														}
														disabled={
															actionLoading ===
															user.id
														}
														className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
													>
														<Key className="h-4 w-4 mr-1" />
														Change Credentials
													</Button>

													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															if (
																confirm(
																	"Are you sure you want to delete this user? This action cannot be undone."
																)
															) {
																handleUserAction(
																	"delete",
																	user.id
																);
															}
														}}
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
															<Trash2 className="h-4 w-4 mr-1" />
														)}
														Delete
													</Button>
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

			{/* Change Credentials Dialog */}
			<Dialog
				open={changePasswordDialog.open}
				onOpenChange={(open) =>
					setChangePasswordDialog({ open, user: null })
				}
			>
				<DialogContent className="bg-purple-900 border-purple-600 text-white">
					<DialogHeader>
						<DialogTitle>Change User Credentials</DialogTitle>
						<DialogDescription className="text-gray-400">
							Update the username and password for{" "}
							{changePasswordDialog.user?.profile.firstName}{" "}
							{changePasswordDialog.user?.profile.lastName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label
								htmlFor="newUsername"
								className="text-gray-300"
							>
								New Username (Email)
							</Label>
							<Input
								id="newUsername"
								type="email"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								placeholder="Enter new email"
								className="bg-purple-800 border-purple-600 text-white"
							/>
						</div>
						<div>
							<Label
								htmlFor="newPassword"
								className="text-gray-300"
							>
								New Password
							</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Enter new password"
								className="bg-purple-800 border-purple-600 text-white"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setChangePasswordDialog({
									open: false,
									user: null,
								})
							}
							className="border-gray-600 text-gray-300 hover:bg-gray-800"
						>
							Cancel
						</Button>
						<Button
							onClick={handleChangePassword}
							className="bg-blue-600 hover:bg-blue-700"
						>
							Update Credentials
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
