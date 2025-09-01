import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Generate unique IDs
export function generateId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Generate event-specific registration URL
export function generateRegistrationUrl(eventId: string): string {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	return `${baseUrl}/register/${eventId}`;
}

// Format date for display
export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// Format time for display
export function formatTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Format file size
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Validate email format
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Validate phone number (basic)
export function isValidPhone(phone: string): boolean {
	const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
	return phoneRegex.test(phone);
}

// Sanitize filename for storage
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9.-]/g, "_")
		.replace(/_{2,}/g, "_")
		.toLowerCase();
}

// Check if user has permission for action
export function hasPermission(userRole: string, requiredRole: string): boolean {
	const roleHierarchy = {
		super_admin: 4,
		stage_manager: 3,
		dj: 2,
		artist: 1,
	};

	return (
		(roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >=
		(roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0)
	);
}

// Sleep utility for testing
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
