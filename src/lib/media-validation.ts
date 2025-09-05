interface MediaFile {
	name: string;
	size: number;
	type: string;
}

interface ValidationResult {
	isValid: boolean;
	error?: string;
}

const VALIDATION_CONFIG = {
	image: {
		maxSize: Infinity, // No size limit
		allowedTypes: [], // Allow all types - will be checked dynamically
	},
	video: {
		maxSize: Infinity, // No size limit
		allowedTypes: [], // Allow all types - will be checked dynamically
	},
	audio: {
		maxSize: Infinity, // No size limit
		allowedTypes: [], // Allow all types - will be checked dynamically
	},
};

export function validateMediaFile(
	file: MediaFile,
	category: "image" | "video" | "audio"
): ValidationResult {
	// Check file name
	if (!file.name || file.name.trim() === "") {
		return {
			isValid: false,
			error: "File name is required",
		};
	}

	// Check if file has content
	if (file.size === 0) {
		return {
			isValid: false,
			error: "File appears to be empty",
		};
	}

	// Basic MIME type validation - allow all types that match the category
	if (category === "image" && !file.type.startsWith("image/")) {
		return {
			isValid: false,
			error: "Selected file is not an image",
		};
	}

	if (category === "video" && !file.type.startsWith("video/")) {
		return {
			isValid: false,
			error: "Selected file is not a video",
		};
	}

	if (category === "audio" && !file.type.startsWith("audio/")) {
		return {
			isValid: false,
			error: "Selected file is not an audio file",
		};
	}

	return { isValid: true };
}

export function getFileCategory(
	mimeType: string
): "image" | "video" | "audio" | "document" {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "document";
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
