"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function StageManagerPendingPage() {
	const [status, setStatus] = useState<string>("pending");
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState<{
		type: "success" | "error" | "info";
		message: string;
	} | null>(null);
	const [userId, setUserId] = useState<string>("");
	const router = useRouter();

	// WebSocket for real-time notifications
	useWebSocket({
		userId,
		role: "stage_manager",
		onStatusChange: async (data) => {
			setStatus(data.status);
			setAlert({
				type: "success",
				message: data.message,
			});

			if (data.status === "active") {
				// Refresh session to update status
				try {
					await fetch("/api/auth/refresh-session", {
						method: "POST",
					});
				} catch (error) {
					console.error("Failed to refresh session:", error);
				}

				setTimeout(() => {
					router.push("/stage-manager");
				}, 2000);
			}
		},
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

	const checkStatus = async () => {
		setLoading(true);
		try {
			// First refresh the session to get updated user data
			const refreshResponse = await fetch("/api/auth/refresh-session", {
				method: "POST",
			});

			if (refreshResponse.ok) {
				const refreshResult = await refreshResponse.json();
				if (refreshResult.success) {
					const newStatus = refreshResult.data.user.status;
					setStatus(newStatus);

					if (newStatus === "active") {
						setAlert({
							type: "success",
							message:
								"Your account has been approved! Redirecting to dashboard...",
						});

						// Redirect to dashboard after 2 seconds
						setTimeout(() => {
							router.push("/stage-manager");
						}, 2000);
						return;
					} else if (newStatus === "rejected") {
						setAlert({
							type: "error",
							message:
								"Your account has been rejected. Please contact support.",
						});
						return;
					} else if (newStatus === "suspended") {
						setAlert({
							type: "error",
							message:
								"Your account has been suspended. Please contact support.",
						});
						return;
					}
				}
			}

			// Fallback to check-status if refresh fails
			const response = await fetch("/api/auth/check-status");
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					const newStatus = result.data.status;
					setStatus(newStatus);

					if (newStatus === "active") {
						setAlert({
							type: "success",
							message:
								"Your account has been approved! Redirecting to dashboard...",
						});

						// Redirect to dashboard after 2 seconds
						setTimeout(() => {
							router.push("/stage-manager");
						}, 2000);
					} else if (newStatus === "rejected") {
						setAlert({
							type: "error",
							message:
								"Your account has been rejected. Please contact support.",
						});
					} else if (newStatus === "suspended") {
						setAlert({
							type: "error",
							message:
								"Your account has been suspended. Please contact support.",
						});
					}
				}
			}
		} catch (error) {
			console.error("Error checking status:", error);
			setAlert({
				type: "error",
				message: "Failed to check status. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Check status on page load and get user ID
		const fetchUserData = async () => {
			try {
				const response = await fetch("/api/auth/me");
				if (response.ok) {
					const result = await response.json();
					if (result.success) {
						setUserId(result.data.userId);
					}
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchUserData();
		checkStatus();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="max-w-md w-full mx-4">
				<Card className="shadow-lg">
					<CardHeader className="text-center">
						<div className="flex justify-center mb-4">
							<Image
								src="/fame-logo.png"
								alt="FAME Logo"
								width={60}
								height={60}
							/>
						</div>
						<CardTitle className="text-2xl font-bold text-gray-900">
							Account Pending Approval
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{alert && (
							<Alert
								className={`${
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

						<div className="text-center space-y-4">
							{status === "pending" && (
								<>
									<div className="flex justify-center">
										<Clock className="h-16 w-16 text-yellow-500" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											Waiting for Admin Approval
										</h3>
										<p className="text-gray-600">
											Your stage manager account is
											currently under review. An
											administrator will approve your
											account soon.
										</p>
									</div>
								</>
							)}

							{status === "active" && (
								<>
									<div className="flex justify-center">
										<CheckCircle className="h-16 w-16 text-green-500" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-green-700 mb-2">
											Account Approved!
										</h3>
										<p className="text-gray-600">
											Your account has been approved. You
											will be redirected to your
											dashboard.
										</p>
									</div>
								</>
							)}

							{(status === "rejected" ||
								status === "suspended") && (
								<>
									<div className="flex justify-center">
										<AlertCircle className="h-16 w-16 text-red-500" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-red-700 mb-2">
											Account{" "}
											{status === "rejected"
												? "Rejected"
												: "Suspended"}
										</h3>
										<p className="text-gray-600">
											Please contact support for more
											information.
										</p>
									</div>
								</>
							)}
						</div>

						<div className="space-y-3">
							<Button
								onClick={checkStatus}
								disabled={loading}
								className="w-full bg-purple-600 hover:bg-purple-700"
							>
								{loading ? "Checking..." : "Check Status"}
							</Button>

							<Button
								variant="outline"
								onClick={() => router.push("/login")}
								className="w-full"
							>
								Back to Login
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
