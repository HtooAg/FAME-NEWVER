"use client";

import { Button } from "@/components/ui/button";
import { FameLogo } from "@/components/ui/fame-logo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div className="min-h-screen bg-black text-white overflow-hidden">
			{/* Animated Background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
				<div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-float" />
				<div
					className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-float"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl animate-float"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Hero Section */}
			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
				<div
					className={`mb-8 ${
						mounted ? "animate-scale-in" : "opacity-0"
					}`}
				>
					<div className="relative">
						<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 animate-glow" />
						<FameLogo
							width={200}
							height={200}
							className="relative z-10 drop-shadow-2xl hover-lift"
						/>
					</div>
				</div>

				<h1
					className={`text-5xl sm:text-6xl md:text-7xl font-bold mb-6 gradient-text-purple-pink ${
						mounted
							? "animate-fade-in-up animate-stagger-1"
							: "opacity-0"
					}`}
				>
					Welcome to FAME
				</h1>

				<p
					className={`text-xl sm:text-2xl md:text-3xl mb-12 max-w-4xl px-4 text-gray-300 leading-relaxed ${
						mounted
							? "animate-fade-in-up animate-stagger-2"
							: "opacity-0"
					}`}
				>
					Your Ultimate Event Management Platform for Stage Managers
				</p>

				<div
					className={`flex flex-col sm:flex-row gap-6 items-center ${
						mounted
							? "animate-fade-in-up animate-stagger-3"
							: "opacity-0"
					}`}
				>
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl px-10 py-6 rounded-full shadow-2xl border-0 font-semibold tracking-wide hover-lift hover-glow transition-all duration-300"
						onClick={() => router.push("/register")}
					>
						Get Started
					</Button>

					<Button
						size="lg"
						variant="outline"
						className="bg-transparent border-2 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white text-xl px-10 py-6 rounded-full shadow-2xl font-semibold tracking-wide hover-lift transition-all duration-300"
						onClick={() => router.push("/register")}
					>
						Join as Stage Manager
					</Button>
				</div>

				<div
					className={`mt-12 ${
						mounted
							? "animate-fade-in-up animate-stagger-4"
							: "opacity-0"
					}`}
				>
					<p className="text-gray-400 text-lg mb-4">
						Already have an account?
					</p>
					<div className="flex flex-col gap-4 items-center">
						<button
							onClick={() => router.push("/login")}
							className="text-purple-400 hover:text-purple-300 text-xl font-semibold underline decoration-2 underline-offset-4 transition-all duration-300 hover-glow"
						>
							Sign in
						</button>

						{/* Temporary logout button for debugging */}
						<button
							onClick={async () => {
								try {
									await fetch("/api/auth/logout", {
										method: "POST",
									});
									alert(
										"Session cleared! Now try signing in."
									);
								} catch (error) {
									console.error("Logout error:", error);
								}
							}}
							className="text-red-400 hover:text-red-300 text-sm underline"
						>
							Clear Session (Debug)
						</button>
					</div>

					{/* Development Helper */}
					{/* {process.env.NODE_ENV === "development" && (
						<div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
							<p className="text-yellow-400 text-sm mb-4">
								Development Mode
							</p>
							<div className="flex flex-col gap-2">
								<button
									onClick={async () => {
										try {
											const response = await fetch(
												"/api/dev/init",
												{ method: "POST" }
											);
											const data = await response.json();
											if (data.success) {
												alert(
													"Test users created! Check console for login details."
												);
												console.log(
													"Test accounts:",
													data.data.users
												);
											} else {
												alert(
													"Error: " +
														data.error.message
												);
											}
										} catch (error) {
											console.error("Init error:", error);
											alert(
												"Failed to initialize test data"
											);
										}
									}}
									className="text-yellow-400 hover:text-yellow-300 text-sm underline text-left"
								>
									Create Test Users
								</button>
								<button
									onClick={async () => {
										try {
											const response = await fetch(
												"/api/dev/create-super-admin",
												{ method: "POST" }
											);
											const data = await response.json();
											if (data.success) {
												alert(
													"Super admin created! Email: admin@fame.dev, Password: admin123"
												);
												console.log(
													"Super admin:",
													data.data.user
												);
											} else {
												alert(
													"Error: " +
														data.error.message
												);
											}
										} catch (error) {
											console.error(
												"Create admin error:",
												error
											);
											alert(
												"Failed to create super admin"
											);
										}
									}}
									className="text-yellow-400 hover:text-yellow-300 text-sm underline text-left"
								>
									Create Super Admin
								</button>
								<button
									onClick={async () => {
										try {
											const response = await fetch(
												"/api/dev/check-users"
											);
											const data = await response.json();
											if (data.success) {
												console.log(
													"Found users:",
													data.data.foundUsers
												);
												alert(
													`Found ${data.data.totalFound} users. Check console for details.`
												);
											} else {
												alert(
													"Error: " +
														data.error.message
												);
											}
										} catch (error) {
											console.error(
												"Check users error:",
												error
											);
											alert("Failed to check users");
										}
									}}
									className="text-yellow-400 hover:text-yellow-300 text-sm underline text-left"
								>
									Check Existing Users
								</button>
							</div>
						</div>
					)} */}
				</div>

				{/* Enhanced Floating particles */}
				{mounted &&
					[...Array(20)].map((_, i) => (
						<div
							key={i}
							className="absolute w-2 h-2 bg-white/20 rounded-full animate-particle-float"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								animationDelay: `${Math.random() * 4}s`,
								animationDuration: `${3 + Math.random() * 2}s`,
							}}
						/>
					))}
			</div>
		</div>
	);
}
