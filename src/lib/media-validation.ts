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
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",
		],
	},
	video: {
		maxSize: 100 * 1024 * 1024, // 100MB
		allowedTypes: [
			"video/mp4",
			"video/webm",
			"video/ogg",
			"video/avi",
			"video/mov",
			"video/wmv",
		],
	},
	audio: {
		maxSize: 50 * 1024 * 1024, // 50MB
		allowedTypes: [
			"audio/mpeg",
			"audio/mp3",
			"audio/wav",
			"audio/ogg",
			"audio/aac",
			"audio/m4a",
			"audio/flac",
			"audio/wma",
		],
	},
};

export function validateMediaFile(
	file: MediaFile,
	category: "image" | "video" | "audio"
): ValidationResult {
	const config = VALIDATION_CONFIG[category];

	// Check file size
	if (file.size > config.maxSize) {
		const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
		return {
			isValid: false,
			error: `File size exceeds ${maxSizeMB}MB limit for ${category} files`,
		};
	}

	// Check file type
	if (!config.allowedTypes.includes(file.type.toLowerCase())) {
		return {
			isValid: false,
			error: `File type ${file.type} is not supported for ${category} files`,
		};
	}

	// Check file name
	if (!file.name || file.name.trim() === "") {
		return {
			isValid: false,
			error: "File name is required",
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
