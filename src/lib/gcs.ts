import { Storage } from "@google-cloud/storage";
import { readLocalJsonFile, writeLocalJsonFile } from "./local-storage";
import { Event } from "@/types";

// Upload configuration
const UPLOAD_CONFIG = {
	maxImageSize: 5 * 1024 * 1024, // 5MB
	maxAudioSize: 50 * 1024 * 1024, // 50MB
	maxFileSize: 10 * 1024 * 1024, // 10MB
	allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
	allowedAudioTypes: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a"],
	allowedDocumentTypes: [
		"application/pdf",
		"text/plain",
		"application/msword",
	],
};

// Use local storage for development
const useLocalStorage =
	process.env.NODE_ENV === "development" &&
	!process.env.GOOGLE_CLOUD_PROJECT_ID;

// Initialize Google Cloud Storage
const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "fame-data";
const bucket = storage.bucket(bucketName);

export interface GCSFile {
	name: string;
	data: any;
}

// Generic functions for GCS operations
export class GCSService {
	// Save data to GCS
	static async saveFile(filePath: string, data: any): Promise<boolean> {
		try {
			const file = bucket.file(filePath);
			const jsonData = JSON.stringify(data, null, 2);

			await file.save(jsonData, {
				metadata: {
					contentType: "application/json",
				},
			});

			console.log(`File saved to GCS: ${filePath}`);
			return true;
		} catch (error) {
			console.error(`Error saving file to GCS: ${filePath}`, error);
			return false;
		}
	}

	// Read data from GCS
	static async readFile(filePath: string): Promise<any | null> {
		try {
			const file = bucket.file(filePath);
			const [exists] = await file.exists();

			if (!exists) {
				return null;
			}

			const [contents] = await file.download();
			return JSON.parse(contents.toString());
		} catch (error) {
			console.error(`Error reading file from GCS: ${filePath}`, error);
			return null;
		}
	}

	// List files in a directory
	static async listFiles(prefix: string): Promise<string[]> {
		try {
			const [files] = await bucket.getFiles({ prefix });
			return files.map((file) => file.name);
		} catch (error) {
			console.error(`Error listing files from GCS: ${prefix}`, error);
			return [];
		}
	}

	// Delete file from GCS
	static async deleteFile(filePath: string): Promise<boolean> {
		try {
			const file = bucket.file(filePath);
			await file.delete();
			console.log(`File deleted from GCS: ${filePath}`);
			return true;
		} catch (error) {
			console.error(`Error deleting file from GCS: ${filePath}`, error);
			return false;
		}
	}

	// Check if file exists
	static async fileExists(filePath: string): Promise<boolean> {
		try {
			const file = bucket.file(filePath);
			const [exists] = await file.exists();
			return exists;
		} catch (error) {
			console.error(`Error checking file existence: ${filePath}`, error);
			return false;
		}
	}
}

// Event-specific GCS operations
export class EventGCSService {
	// Save event to GCS
	static async saveEvent(eventId: string, eventData: any): Promise<boolean> {
		const filePath = `events/${eventId}.json`;
		return await GCSService.saveFile(filePath, eventData);
	}

	// Get event from GCS
	static async getEvent(eventId: string): Promise<any | null> {
		const filePath = `events/${eventId}.json`;
		return await GCSService.readFile(filePath);
	}

	// List all events
	static async listEvents(): Promise<any[]> {
		try {
			const fileNames = await GCSService.listFiles("events/");
			const events = [];

			for (const fileName of fileNames) {
				if (fileName.endsWith(".json")) {
					const eventData = await GCSService.readFile(fileName);
					if (eventData) {
						events.push(eventData);
					}
				}
			}

			return events;
		} catch (error) {
			console.error("Error listing events:", error);
			return [];
		}
	}

	// Delete event
	static async deleteEvent(eventId: string): Promise<boolean> {
		const filePath = `events/${eventId}.json`;
		return await GCSService.deleteFile(filePath);
	}

	// Save stage manager data
	static async saveStageManagerData(
		eventId: string,
		dataType: string,
		data: any
	): Promise<boolean> {
		const filePath = `registrations/stage_manager/${eventId}/${dataType}.json`;
		return await GCSService.saveFile(filePath, data);
	}

	// Get stage manager data
	static async getStageManagerData(
		eventId: string,
		dataType: string
	): Promise<any | null> {
		const filePath = `registrations/stage_manager/${eventId}/${dataType}.json`;
		return await GCSService.readFile(filePath);
	}

	// Save artists data
	static async saveArtists(
		eventId: string,
		artists: any[]
	): Promise<boolean> {
		const filePath = `registrations/stage_manager/${eventId}/artists.json`;
		return await GCSService.saveFile(filePath, {
			artists,
			updatedAt: new Date().toISOString(),
		});
	}

	// Get artists data
	static async getArtists(eventId: string): Promise<any[]> {
		const filePath = `registrations/stage_manager/${eventId}/artists.json`;
		const data = await GCSService.readFile(filePath);
		return data?.artists || [];
	}

	// Save show order
	static async saveShowOrder(
		eventId: string,
		showOrder: any
	): Promise<boolean> {
		const filePath = `registrations/stage_manager/${eventId}/show-order.json`;
		return await GCSService.saveFile(filePath, showOrder);
	}

	// Get show order
	static async getShowOrder(eventId: string): Promise<any | null> {
		const filePath = `registrations/stage_manager/${eventId}/show-order.json`;
		return await GCSService.readFile(filePath);
	}

	// Save rehearsals
	static async saveRehearsals(
		eventId: string,
		rehearsals: any[]
	): Promise<boolean> {
		const filePath = `registrations/stage_manager/${eventId}/rehearsals.json`;
		return await GCSService.saveFile(filePath, {
			rehearsals,
			updatedAt: new Date().toISOString(),
		});
	}

	// Get rehearsals
	static async getRehearsals(eventId: string): Promise<any[]> {
		const filePath = `registrations/stage_manager/${eventId}/rehearsals.json`;
		const data = await GCSService.readFile(filePath);
		return data?.rehearsals || [];
	}

	// Add single rehearsal
	static async addRehearsal(
		eventId: string,
		rehearsal: any
	): Promise<boolean> {
		const rehearsals = await this.getRehearsals(eventId);
		rehearsals.push(rehearsal);
		return await this.saveRehearsals(eventId, rehearsals);
	}

	// Update rehearsal
	static async updateRehearsal(
		eventId: string,
		rehearsalId: string,
		updates: any
	): Promise<boolean> {
		const rehearsals = await this.getRehearsals(eventId);
		const index = rehearsals.findIndex((r) => r.id === rehearsalId);

		if (index !== -1) {
			rehearsals[index] = {
				...rehearsals[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return await this.saveRehearsals(eventId, rehearsals);
		}

		return false;
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

// Upload file with metadata for the upload API
export async function uploadFileWithMetadata(
	fileBuffer: Buffer,
	originalName: string,
	mimeType: string,
	uploadPath: string,
	uploadedBy: string,
	metadata: {
		category: string;
		eventId?: string;
		userRole: string;
	}
) {
	// Validate file size based on category
	const maxSize =
		metadata.category === "image"
			? UPLOAD_CONFIG.maxImageSize
			: metadata.category === "audio"
			? UPLOAD_CONFIG.maxAudioSize
			: UPLOAD_CONFIG.maxFileSize;

	if (fileBuffer.length > maxSize) {
		throw new Error(
			`File size exceeds maximum allowed size for ${metadata.category} files`
		);
	}

	// Validate file type
	const allowedTypes =
		metadata.category === "image"
			? UPLOAD_CONFIG.allowedImageTypes
			: metadata.category === "audio"
			? UPLOAD_CONFIG.allowedAudioTypes
			: UPLOAD_CONFIG.allowedDocumentTypes;

	if (!allowedTypes.includes(mimeType)) {
		throw new Error(
			`File type ${mimeType} not allowed for ${metadata.category} files`
		);
	}

	// Generate unique file ID and create filename
	const fileId = generateFileId();
	const extension = getFileExtension(originalName);
	const fileName = `${fileId}${extension}`;
	const fullPath = `${uploadPath}/${fileName}`;

	// Upload to GCS or local storage
	let url: string;
	if (useLocalStorage || !bucket) {
		// For local development, create a local file path
		url = `/uploads/${fullPath}`;
		// In a real implementation, you'd save the file locally here
	} else {
		url = await uploadFile(fullPath, fileBuffer, mimeType);
	}

	return {
		id: fileId,
		filename: fileName,
		originalName,
		mimeType,
		size: fileBuffer.length,
		url,
		uploadedBy,
		uploadedAt: new Date(),
		category: metadata.category,
		eventId: metadata.eventId,
		userRole: metadata.userRole,
	};
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

// Legacy function exports for backward compatibility
export const readJsonFile = GCSService.readFile;
export const writeJsonFile = GCSService.saveFile;
export const deleteFile = GCSService.deleteFile;
export const uploadFile = GCSService.saveFile;
export const createFilePath = (fileName: string) => `uploads/${fileName}`;
export const getSignedUrl = async (filePath: string) => {
	// For now, return a placeholder URL
	return `https://storage.googleapis.com/${bucketName}/${filePath}`;
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
// User management functions
export const getAllUsers = async () => {
	// Get all stage managers from the correct path
	const stageManagers = await getStageManagers();
	const pendingUsers = await getPendingUsers();

	// Combine both arrays
	return [...stageManagers, ...pendingUsers];
};

export const createUser = async (userData: any) => {
	const users = await getAllUsers();
	users.push(userData);
	return await GCSService.saveFile("users/users.json", { users });
};

export const getUserByEmail = async (email: string) => {
	const users = await getAllUsers();
	return users.find((user: any) => user.email === email);
};

export const getUser = async (userId: string) => {
	// First check in stage managers
	const stageManagers = await getStageManagers();
	const stageManager = stageManagers.find((user: any) => user.id === userId);
	if (stageManager) {
		return stageManager;
	}

	// Then check in pending users
	const pendingUsers = await getPendingUsers();
	const pendingUser = pendingUsers.find((user: any) => user.id === userId);
	if (pendingUser) {
		return pendingUser;
	}

	// Fallback to old method
	const users = await getAllUsers();
	return users.find((user: any) => user.id === userId);
};

export const updateUserStatus = async (
	userId: string,
	status: string,
	approvedBy?: string
) => {
	// First check if user is in pending registrations
	const pendingUsers = await getPendingUsers();
	const pendingIndex = pendingUsers.findIndex(
		(user: any) => user.id === userId
	);

	if (pendingIndex !== -1) {
		// User is in pending, handle approval/rejection
		const user = pendingUsers[pendingIndex];

		if (status === "active") {
			// Approve: move from pending to stage managers
			return await approvePendingRegistration(userId);
		} else if (status === "rejected") {
			// Reject: remove from pending
			return await rejectPendingRegistration(userId);
		}
	}

	// If not in pending, check if user is already in stage managers
	const stageManagers = await getStageManagers();
	const stageManagerIndex = stageManagers.findIndex(
		(user: any) => user.id === userId
	);

	if (stageManagerIndex !== -1) {
		// Update existing stage manager status
		stageManagers[stageManagerIndex].status = status;
		stageManagers[stageManagerIndex].updatedAt = new Date().toISOString();
		if (approvedBy) {
			stageManagers[stageManagerIndex].updatedBy = approvedBy;
		}

		const success = await GCSService.saveFile(
			"users/stage_manager/users.json",
			stageManagers
		);
		return success ? stageManagers[stageManagerIndex] : false;
	}

	return false;
};

export const getPendingUsers = async () => {
	// Fetch pending registrations from the correct path
	const data = await GCSService.readFile(
		"registrations/stage-managers/pending.json"
	);
	// Handle both array format and object format
	if (Array.isArray(data)) {
		return data;
	}
	return data?.registrations || data?.users || data || [];
};

export const getStageManagers = async () => {
	// Fetch stage managers from the correct path
	const data = await GCSService.readFile("users/stage_manager/users.json");
	// Handle both array format and object format
	if (Array.isArray(data)) {
		return data;
	}
	return data?.users || data || [];
};

// Event management functions
export const getEvent = EventGCSService.getEvent;
export const createEvent = EventGCSService.saveEvent;
export const updateEvent = EventGCSService.saveEvent;
export const deleteEvent = EventGCSService.deleteEvent;

export const getEventsForStageManager = async (stageManagerId: string) => {
	const events = await EventGCSService.listEvents();
	return events.filter(
		(event: any) => event.stageManagerId === stageManagerId
	);
};

// Additional helper functions for stage manager management
export const addPendingRegistration = async (registrationData: any) => {
	const pendingUsers = await getPendingUsers();
	pendingUsers.push({
		...registrationData,
		id: Date.now().toString(), // Simple ID generation
		createdAt: new Date().toISOString(),
		status: "pending",
	});
	// Save as direct array to match existing format
	return await GCSService.saveFile(
		"registrations/stage-managers/pending.json",
		pendingUsers
	);
};

export const approvePendingRegistration = async (registrationId: string) => {
	const pendingUsers = await getPendingUsers();
	const registrationIndex = pendingUsers.findIndex(
		(user: any) => user.id === registrationId
	);

	if (registrationIndex !== -1) {
		const approvedUser = pendingUsers[registrationIndex];

		// Remove from pending
		pendingUsers.splice(registrationIndex, 1);
		await GCSService.saveFile(
			"registrations/stage-managers/pending.json",
			pendingUsers
		);

		// Add to approved stage managers
		const stageManagers = await getStageManagers();
		const newStageManager = {
			...approvedUser,
			status: "active",
			approvedAt: new Date().toISOString(),
		};
		stageManagers.push(newStageManager);

		const success = await GCSService.saveFile(
			"users/stage_manager/users.json",
			stageManagers
		);

		return success ? newStageManager : false;
	}

	return false;
};

export const rejectPendingRegistration = async (registrationId: string) => {
	const pendingUsers = await getPendingUsers();
	const registrationIndex = pendingUsers.findIndex(
		(user: any) => user.id === registrationId
	);

	if (registrationIndex !== -1) {
		pendingUsers.splice(registrationIndex, 1);
		return await GCSService.saveFile(
			"registrations/stage-managers/pending.json",
			pendingUsers
		);
	}

	return false;
};

// Initialize data structure in GCS bucket
export const initializeDataStructure = async (): Promise<boolean> => {
	try {
		// Check if pending registrations file exists, if not create it
		const pendingExists = await GCSService.fileExists(
			"registrations/stage-managers/pending.json"
		);
		if (!pendingExists) {
			await GCSService.saveFile(
				"registrations/stage-managers/pending.json",
				[]
			);
			console.log("Initialized pending registrations structure");
		}

		// Check if stage managers users file exists, if not create it
		const stageManagersExists = await GCSService.fileExists(
			"users/stage_manager/users.json"
		);
		if (!stageManagersExists) {
			await GCSService.saveFile("users/stage_manager/users.json", []);
			console.log("Initialized stage managers users structure");
		}

		// Check if events directory structure exists
		const eventsFiles = await GCSService.listFiles("events/");
		if (eventsFiles.length === 0) {
			// Create a placeholder file to ensure the directory exists
			await GCSService.saveFile("events/.gitkeep", "");
			console.log("Initialized events directory structure");
		}

		return true;
	} catch (error) {
		console.error("Error initializing data structure:", error);
		return false;
	}
};
