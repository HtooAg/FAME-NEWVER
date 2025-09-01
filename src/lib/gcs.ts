import { Storage } from "@google-cloud/storage";
import { readLocalJsonFile, writeLocalJsonFile } from "./local-storage";

// Check if we're in development mode and GCS is not properly configured
const isDevelopment = process.env.NODE_ENV === "development";
const useLocalStorage =
	isDevelopment &&
	(!process.env.GOOGLE_CLOUD_PROJECT_ID ||
		!process.env.GOOGLE_CLOUD_KEY_FILE);

let storage: Storage | null = null;
let bucket: any = null;

// Initialize GCS only if properly configured
if (!useLocalStorage) {
	try {
		storage = new Storage({
			projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
			keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
		});

		const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";
		bucket = storage.bucket(bucketName);

		console.log("✅ GCS initialized successfully");
	} catch (error) {
		console.warn(
			"⚠️ GCS initialization failed, falling back to local storage:",
			error
		);
		// Will use local storage fallback
	}
} else {
	console.log("🔧 Development mode: Using local storage instead of GCS");
}

export { storage, bucket };

// Read JSON file from GCS or local storage in development
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
	// Use local storage in development if GCS is not configured
	if (useLocalStorage || !bucket) {
		console.log(`Using local storage for ${filePath}`);
		return await readLocalJsonFile<T>(filePath);
	}

	try {
		const file = bucket.file(filePath);
		const [exists] = await file.exists();

		if (!exists) {
			console.log(`File ${filePath} does not exist in GCS`);
			return null;
		}

		const [contents] = await file.download();
		return JSON.parse(contents.toString());
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		// Fallback to local storage in development
		if (isDevelopment) {
			console.warn("GCS error, falling back to local storage");
			return await readLocalJsonFile<T>(filePath);
		}
		throw error;
	}
}

// Write JSON file to GCS or local storage in development
export async function writeJsonFile<T>(
	filePath: string,
	data: T
): Promise<void> {
	// Use local storage in development if GCS is not configured
	if (useLocalStorage || !bucket) {
		console.log(`Using local storage for ${filePath}`);
		return await writeLocalJsonFile<T>(filePath, data);
	}

	try {
		const file = bucket.file(filePath);
		const jsonString = JSON.stringify(data, null, 2);

		await file.save(jsonString, {
			metadata: {
				contentType: "application/json",
			},
		});

		console.log(`File ${filePath} saved successfully`);
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		// Fallback to local storage in development
		if (isDevelopment) {
			console.warn("GCS error, falling back to local storage");
			return await writeLocalJsonFile<T>(filePath, data);
		}
		throw error;
	}
}

// Utility functions for GCS operations
export async function uploadFile(
	fileName: string,
	fileBuffer: Buffer,
	contentType: string
): Promise<string> {
	if (!bucket) {
		throw new Error("GCS not properly configured");
	}

	const file = bucket.file(fileName);

	await file.save(fileBuffer, {
		metadata: {
			contentType,
		},
	});

	const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";
	return `gs://${bucketName}/${fileName}`;
}

export async function downloadFile(fileName: string): Promise<Buffer> {
	if (!bucket) {
		throw new Error("GCS not properly configured");
	}

	const file = bucket.file(fileName);
	const [contents] = await file.download();
	return contents;
}

export async function fileExists(fileName: string): Promise<boolean> {
	if (!bucket) {
		return false;
	}

	try {
		const file = bucket.file(fileName);
		const [exists] = await file.exists();
		return exists;
	} catch (error) {
		console.error(`Error checking file existence ${fileName}:`, error);
		return false;
	}
}

export async function deleteFile(fileName: string): Promise<void> {
	if (!bucket) {
		throw new Error("GCS not properly configured");
	}

	const file = bucket.file(fileName);
	await file.delete();
}

export async function getSignedUrl(
	fileName: string,
	action: "read" | "write" = "read",
	expires: Date = new Date(Date.now() + 60 * 60 * 1000) // 1 hour default
): Promise<string> {
	if (!bucket) {
		throw new Error("GCS not properly configured");
	}

	const file = bucket.file(fileName);

	const [url] = await file.getSignedUrl({
		action,
		expires,
	});

	return url;
}

// File upload configuration and validation
export const UPLOAD_CONFIG = {
	maxFileSize: 50 * 1024 * 1024, // 50MB
	maxImageSize: 10 * 1024 * 1024, // 10MB
	maxAudioSize: 50 * 1024 * 1024, // 50MB
	allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
	allowedAudioTypes: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg"],
	allowedDocumentTypes: [
		"application/pdf",
		"text/plain",
		"application/msword",
	],
};

// Generate unique file ID
function generateFileId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get file extension from filename
function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf(".");
	return lastDot !== -1 ? filename.substring(lastDot) : "";
}

// Determine file category based on MIME type
function getFileCategory(
	mimeType: string
): "image" | "audio" | "video" | "document" {
	if (UPLOAD_CONFIG.allowedImageTypes.includes(mimeType)) {
		return "image";
	}
	if (UPLOAD_CONFIG.allowedAudioTypes.includes(mimeType)) {
		return "audio";
	}
	if (mimeType.startsWith("video/")) {
		return "video";
	}
	return "document";
}

// Create organized folder structure
export function createFilePath(
	category: "user" | "event",
	id: string,
	fileType: string
): string {
	const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	return `uploads/${category}/${id}/${fileType}/${timestamp}`;
}

// Event management functions
export async function getEventsForStageManager(stageManagerId: string) {
	try {
		const events =
			(await readJsonFile<any[]>(
				`events/stage-manager-${stageManagerId}.json`
			)) || [];
		return events;
	} catch (error) {
		console.error("Error getting events for stage manager:", error);
		return [];
	}
}

export async function createEvent(eventData: any) {
	try {
		const eventId = generateFileId();
		const event = {
			id: eventId,
			...eventData,
			createdAt: new Date(),
			artists: [],
		};

		// Save individual event
		await writeJsonFile(`events/${eventId}.json`, event);

		// Update stage manager's events list
		const stageManagerEvents = await getEventsForStageManager(
			eventData.stageManagerId
		);
		stageManagerEvents.push(event);
		await writeJsonFile(
			`events/stage-manager-${eventData.stageManagerId}.json`,
			stageManagerEvents
		);

		return event;
	} catch (error) {
		console.error("Error creating event:", error);
		throw error;
	}
}

export async function getEvent(eventId: string) {
	try {
		return await readJsonFile(`events/${eventId}.json`);
	} catch (error) {
		console.error("Error getting event:", error);
		return null;
	}
}

export async function updateEvent(eventId: string, eventData: any) {
	try {
		const existingEvent = await getEvent(eventId);
		if (!existingEvent) {
			throw new Error("Event not found");
		}

		const updatedEvent = {
			...existingEvent,
			...eventData,
			updatedAt: new Date(),
		};

		await writeJsonFile(`events/${eventId}.json`, updatedEvent);

		// Update stage manager's events list
		const stageManagerEvents = await getEventsForStageManager(
			existingEvent.stageManagerId
		);
		const eventIndex = stageManagerEvents.findIndex(
			(e) => e.id === eventId
		);
		if (eventIndex !== -1) {
			stageManagerEvents[eventIndex] = updatedEvent;
			await writeJsonFile(
				`events/stage-manager-${existingEvent.stageManagerId}.json`,
				stageManagerEvents
			);
		}

		return updatedEvent;
	} catch (error) {
		console.error("Error updating event:", error);
		throw error;
	}
}

export async function deleteEvent(eventId: string) {
	try {
		const event = await getEvent(eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		// Remove from stage manager's events list
		const eventData = event as any;
		if (eventData.stageManagerId) {
			const stageManagerEvents = await getEventsForStageManager(
				eventData.stageManagerId
			);
			const filteredEvents = stageManagerEvents.filter(
				(e) => e.id !== eventId
			);
			await writeJsonFile(
				`events/stage-manager-${eventData.stageManagerId}.json`,
				filteredEvents
			);
		}

		// Note: In a real implementation, you might want to archive rather than delete
		// For now, we'll just remove from the stage manager's list

		return true;
	} catch (error) {
		console.error("Error deleting event:", error);
		throw error;
	}
}

// User management functions
export async function getAllUsers() {
	try {
		// Get users from all registration files
		const pendingUsers = await getPendingUsers();
		const approvedUsers = await getStageManagers();
		const rejectedUsers =
			(await readJsonFile<any[]>(
				"registrations/stage-managers/rejected.json"
			)) || [];

		// Combine all users
		const allUsers = [...pendingUsers, ...approvedUsers, ...rejectedUsers];
		return allUsers;
	} catch (error) {
		console.error("Error getting all users:", error);
		return [];
	}
}

export async function getPendingUsers() {
	try {
		// Fetch pending registrations from the specific GCS path
		const pendingUsers =
			(await readJsonFile<any[]>(
				"registrations/stage-managers/pending.json"
			)) || [];
		return pendingUsers;
	} catch (error) {
		console.error("Error getting pending users:", error);
		return [];
	}
}

export async function getStageManagers() {
	try {
		// Fetch approved/active stage managers from the specific GCS path
		const activeStageManagers =
			(await readJsonFile<any[]>(
				"registrations/stage-managers/approved.json"
			)) || [];
		return activeStageManagers;
	} catch (error) {
		console.error("Error getting stage managers:", error);
		return [];
	}
}

export async function updateUserStatus(
	userId: string,
	status: string,
	approvedBy?: string
) {
	try {
		// Get pending users from the pending file
		const pendingUsers = await getPendingUsers();
		const userIndex = pendingUsers.findIndex((user) => user.id === userId);

		if (userIndex === -1) {
			throw new Error("User not found in pending registrations");
		}

		const user = pendingUsers[userIndex];

		// Update user data
		user.status = status;
		user.updatedAt = new Date();

		if (approvedBy) {
			user.approvedBy = approvedBy;
			user.approvalDate = new Date();
		}

		// Remove user from pending list
		pendingUsers.splice(userIndex, 1);
		await writeJsonFile(
			"registrations/stage-managers/pending.json",
			pendingUsers
		);

		// If approved, add to approved list
		if (status === "active") {
			const approvedUsers = await getStageManagers();
			approvedUsers.push(user);
			await writeJsonFile(
				"registrations/stage-managers/approved.json",
				approvedUsers
			);
		}
		// If rejected, we could add to a rejected.json file if needed
		else if (status === "rejected") {
			const rejectedUsers =
				(await readJsonFile<any[]>(
					"registrations/stage-managers/rejected.json"
				)) || [];
			rejectedUsers.push(user);
			await writeJsonFile(
				"registrations/stage-managers/rejected.json",
				rejectedUsers
			);
		}

		return user;
	} catch (error) {
		console.error("Error updating user status:", error);
		throw error;
	}
}

export async function getUser(userId: string) {
	try {
		// Search in pending users first
		const pendingUsers = await getPendingUsers();
		let user = pendingUsers.find((user) => user.id === userId);

		if (user) return user;

		// Search in approved users
		const approvedUsers = await getStageManagers();
		user = approvedUsers.find((user) => user.id === userId);

		if (user) return user;

		// Search in rejected users
		const rejectedUsers =
			(await readJsonFile<any[]>(
				"registrations/stage-managers/rejected.json"
			)) || [];
		user = rejectedUsers.find((user) => user.id === userId);

		return user || null;
	} catch (error) {
		console.error("Error getting user:", error);
		return null;
	}
}

export async function createUser(userData: any) {
	try {
		const users = await getAllUsers();
		const userId = generateFileId();

		const user = {
			id: userId,
			...userData,
			createdAt: new Date(),
			lastLogin: null,
		};

		users.push(user);
		await writeJsonFile("users/all-users.json", users);

		return user;
	} catch (error) {
		console.error("Error creating user:", error);
		throw error;
	}
}

// Initialize data structure without sample data - only fetch real data from fame-data bucket
export async function initializeDataStructure() {
	try {
		// Initialize registration structure if it doesn't exist (empty)
		const pendingUsers = await readJsonFile(
			"registrations/stage-managers/pending.json"
		);
		if (!pendingUsers) {
			await writeJsonFile(
				"registrations/stage-managers/pending.json",
				[]
			);
			console.log("Pending registrations structure initialized (empty)");
		}

		const approvedUsers = await readJsonFile(
			"registrations/stage-managers/approved.json"
		);
		if (!approvedUsers) {
			await writeJsonFile(
				"registrations/stage-managers/approved.json",
				[]
			);
			console.log("Approved registrations structure initialized (empty)");
		}

		const rejectedUsers = await readJsonFile(
			"registrations/stage-managers/rejected.json"
		);
		if (!rejectedUsers) {
			await writeJsonFile(
				"registrations/stage-managers/rejected.json",
				[]
			);
			console.log("Rejected registrations structure initialized (empty)");
		}

		// Initialize events structure if it doesn't exist (empty)
		const existingEvents = await readJsonFile("events/all-events.json");
		if (!existingEvents) {
			await writeJsonFile("events/all-events.json", []);
			console.log("Events structure initialized (empty)");
		}

		return true;
	} catch (error) {
		console.error("Error initializing data structure:", error);
		return false;
	}
}
