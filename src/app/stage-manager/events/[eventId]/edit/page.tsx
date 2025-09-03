"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, EventFormData } from "@/lib/schemas/event";
import { Event } from "@/lib/types/event";
import { motion } from "framer-motion";

export default function EditEventPage() {
	const router = useRouter();
	const params = useParams();
	const eventId = params.eventId as string;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showStartCalendar, setShowStartCalendar] = useState(false);
	const [showEndCalendar, setShowEndCalendar] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<EventFormData>({
		resolver: zodResolver(eventFormSchema),
	});

	const startDate = watch("startDate");
	const endDate = watch("endDate");

	useEffect(() => {
		fetchEvent();
	}, [eventId]);

	const fetchEvent = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/events/${eventId}`);

			if (response.ok) {
				const result = await response.json();
				const event: Event = result.data;

				// Pre-populate form with existing data
				setValue("name", event.name);
				setValue("venueName", event.venueName);
				setValue("startDate", new Date(event.startDate));
				setValue("endDate", new Date(event.endDate));
				setValue("description", event.description);
			} else {
				console.error("Failed to fetch event");
				router.push("/stage-manager/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
			router.push("/stage-manager/events");
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: EventFormData) => {
		try {
			setSaving(true);

			const response = await fetch(`/api/events/${eventId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: data.name,
					venueName: data.venueName,
					startDate: data.startDate.toISOString(),
					endDate: data.endDate.toISOString(),
					description: data.description,
				}),
			});

			if (response.ok) {
				router.push(`/stage-manager/events/${eventId}`);
			} else {
				console.error("Failed to update event");
			}
		} catch (error) {
			console.error("Error updating event:", error);
		} finally {
			setSaving(false);
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
									Edit Event
								</h1>
								<p className="text-sm text-gray-500">
									Stage Manager
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<Card className="shadow-lg bg-white">
						<CardHeader>
							<CardTitle className="text-2xl font-bold text-gray-900">
								Edit Event
							</CardTitle>
							<CardDescription className="text-gray-600">
								Update your event details and settings.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-6"
							>
								{/* Event Name */}
								<div className="space-y-2">
									<Label
										htmlFor="name"
										className="text-gray-700"
									>
										Event Name *
									</Label>
									<Input
										id="name"
										placeholder="Enter event name"
										{...register("name")}
										className={cn(
											"bg-white border-gray-300 text-gray-900 placeholder-gray-500",
											errors.name && "border-red-500"
										)}
									/>
									{errors.name && (
										<p className="text-sm text-red-600">
											{errors.name.message}
										</p>
									)}
								</div>

								{/* Venue Name */}
								<div className="space-y-2">
									<Label
										htmlFor="venueName"
										className="text-gray-700"
									>
										Venue Name *
									</Label>
									<Input
										id="venueName"
										placeholder="Enter venue name"
										{...register("venueName")}
										className={cn(
											"bg-white border-gray-300 text-gray-900 placeholder-gray-500",
											errors.venueName && "border-red-500"
										)}
									/>
									{errors.venueName && (
										<p className="text-sm text-red-600">
											{errors.venueName.message}
										</p>
									)}
								</div>

								{/* Date Range */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Start Date */}
									<div className="space-y-2">
										<Label className="text-gray-700">
											Start Date *
										</Label>
										<Popover
											open={showStartCalendar}
											onOpenChange={setShowStartCalendar}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900",
														!startDate &&
															"text-gray-500",
														errors.startDate &&
															"border-red-500"
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{startDate
														? format(
																startDate,
																"PPP"
														  )
														: "Pick start date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0 bg-white"
												align="start"
											>
												<Calendar
													mode="single"
													selected={startDate}
													onSelect={(
														date: Date | undefined
													) => {
														if (date) {
															setValue(
																"startDate",
																date
															);
															setShowStartCalendar(
																false
															);
														}
													}}
													disabled={(date: Date) =>
														date < new Date()
													}
												/>
											</PopoverContent>
										</Popover>
										{errors.startDate && (
											<p className="text-sm text-red-600">
												{errors.startDate.message}
											</p>
										)}
									</div>

									{/* End Date */}
									<div className="space-y-2">
										<Label className="text-gray-700">
											End Date *
										</Label>
										<Popover
											open={showEndCalendar}
											onOpenChange={setShowEndCalendar}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900",
														!endDate &&
															"text-gray-500",
														errors.endDate &&
															"border-red-500"
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{endDate
														? format(endDate, "PPP")
														: "Pick end date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0 bg-white"
												align="start"
											>
												<Calendar
													mode="single"
													selected={endDate}
													onSelect={(
														date: Date | undefined
													) => {
														if (date) {
															setValue(
																"endDate",
																date
															);
															setShowEndCalendar(
																false
															);
														}
													}}
													disabled={(date: Date) =>
														date <
														(startDate ||
															new Date())
													}
												/>
											</PopoverContent>
										</Popover>
										{errors.endDate && (
											<p className="text-sm text-red-600">
												{errors.endDate.message}
											</p>
										)}
									</div>
								</div>

								{/* Description */}
								<div className="space-y-2">
									<Label
										htmlFor="description"
										className="text-gray-700"
									>
										Description *
									</Label>
									<Textarea
										id="description"
										placeholder="Enter event description"
										rows={4}
										{...register("description")}
										className={cn(
											"bg-white border-gray-300 text-gray-900 placeholder-gray-500",
											errors.description &&
												"border-red-500"
										)}
									/>
									{errors.description && (
										<p className="text-sm text-red-600">
											{errors.description.message}
										</p>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col sm:flex-row gap-4 pt-6">
									<Button
										type="submit"
										disabled={saving}
										className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
									>
										{saving ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Updating Event...
											</>
										) : (
											"Update Event"
										)}
									</Button>
									<Link
										href={`/stage-manager/events/${eventId}`}
										className="flex-1"
									>
										<Button
											type="button"
											variant="outline"
											className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
										>
											Cancel
										</Button>
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}
