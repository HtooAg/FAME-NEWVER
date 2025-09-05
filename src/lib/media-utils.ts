/**
 * Utility functions for handling media files and URLs
 */

/**
 * Convert Google Cloud Storage URL to HTTP URL
 * @param url - The GCS URL (gs://) or HTTP URL
 * @returns HTTP URL that can be accessed by browsers
 */
export function convertGcsUrl(url: string): string {
	if (!url) return "";

	// If it's already an HTTP URL, return as is
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	// Convert gs:// URL to use our API endpoint
	if (url.startsWith("gs://")) {
		const path = url.replace("gs://", "").replace(/^[^/]+\//, ""); // Remove bucket name
		return `/api/media/${path}`;
	}

	return url;
}

/**
 * Convert GCS URL to direct Google Storage URL (fallback)
 * @param url - The GCS URL (gs://) or HTTP URL
 * @returns Direct Google Storage HTTP URL
 */
export function convertGcsUrlDirect(url: string): string {
	if (!url) return "";

	// If it's already an HTTP URL, return as is
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	// Convert gs:// URL to direct HTTP URL
	if (url.startsWith("gs://")) {
		const path = url.replace("gs://", "");
		return `https://storage.cloud.google.com/${path}`;
	}

	return url;
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns File extension with dot (e.g., ".mp3")
 */
export function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf(".");
	return lastDot !== -1 ? filename.substring(lastDot) : "";
}

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format duration in seconds to mm:ss format
 * @param seconds - Duration in seconds
 * @returns Formatted duration (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
	if (!seconds || isNaN(seconds)) return "0:00";

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Check if a URL is a valid media URL
 * @param url - The URL to check
 * @returns True if the URL appears to be valid
 */
export function isValidMediaUrl(url: string): boolean {
	if (!url) return false;

	try {
		new URL(convertGcsUrl(url));
		return true;
	} catch {
		return false;
	}
}

/**
 * Get media type from file extension or MIME type
 * @param filename - The filename or MIME type
 * @returns Media type ("audio", "video", "image", or "unknown")
 */
export function getMediaType(
	filename: string
): "audio" | "video" | "image" | "unknown" {
	const extension = getFileExtension(filename.toLowerCase());

	// Audio extensions
	if (
		[".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma"].includes(
			extension
		)
	) {
		return "audio";
	}

	// Video extensions
	if ([".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"].includes(extension)) {
		return "video";
	}

	// Image extensions
	if (
		[".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(
			extension
		)
	) {
		return "image";
	}

	// Check MIME type if extension doesn't match
	if (filename.startsWith("audio/")) return "audio";
	if (filename.startsWith("video/")) return "video";
	if (filename.startsWith("image/")) return "image";

	return "unknown";
}

/**
 * Open media file in a new window for playback
 * @param url - The media URL
 * @param filename - The filename (optional, for window title)
 */
export function playInNewWindow(url: string, filename?: string): void {
	const convertedUrl = convertGcsUrlDirect(url);

	if (!convertedUrl) {
		console.error("Invalid URL for playback:", url);
		return;
	}

	// Open in new window with appropriate size for media playback
	const windowFeatures =
		"width=800,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no";
	const newWindow = window.open(
		convertedUrl,
		filename || "media-player",
		windowFeatures
	);

	if (!newWindow) {
		// Fallback if popup is blocked - open in new tab
		window.open(convertedUrl, "_blank", "noopener,noreferrer");
	}
}

/**
 * Create a download link for a media file using our download API
 * @param url - The media URL (GCS URL)
 * @param filename - The filename for download
 */
export async function downloadFile(
	url: string,
	filename?: string
): Promise<void> {
	if (!url) {
		console.error("Invalid URL for download:", url);
		return;
	}

	try {
		// Extract path from GCS URL
		let filePath = "";
		if (url.startsWith("gs://")) {
			filePath = url.replace("gs://", "").replace(/^[^/]+\//, ""); // Remove bucket name
		} else if (url.startsWith("https://storage.cloud.google.com/")) {
			filePath = url
				.replace("https://storage.cloud.google.com/", "")
				.replace(/^[^/]+\//, "");
		} else {
			// If it's already a path, use it directly
			filePath = url;
		}

		console.log("Attempting to download file:", filePath);

		// Call our download API to get a signed URL
		const response = await fetch(
			`/api/download/${encodeURIComponent(filePath)}`
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Download API failed: ${response.status}`, errorText);
			throw new Error(
				`Download API failed: ${response.status} - ${errorText}`
			);
		}

		const data = await response.json();

		if (data.downloadUrl) {
			console.log("Using signed download URL:", data.downloadUrl);

			// Use the public download URL
			let downloadUrl = data.downloadUrl;
			console.log("Using public download URL:", downloadUrl);

			// Create a download link with the signed URL
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = filename || data.filename || "download";
			link.target = "_blank"; // Open in new tab to handle authentication
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} else {
			throw new Error("No download URL received from API");
		}
	} catch (error) {
		console.error("Download failed, trying fallback:", error);

		// Fallback 1: Try the media API route
		try {
			let filePath = "";
			if (url.startsWith("gs://")) {
				filePath = url.replace("gs://", "").replace(/^[^/]+\//, "");
			} else if (url.startsWith("https://storage.cloud.google.com/")) {
				filePath = url
					.replace("https://storage.cloud.google.com/", "")
					.replace(/^[^/]+\//, "");
			} else {
				filePath = url;
			}

			const mediaUrl = `/api/media/${filePath}`;
			console.log("Trying media API fallback:", mediaUrl);
			window.open(mediaUrl, "_blank");
			return;
		} catch (fallbackError) {
			console.error("Media API fallback failed:", fallbackError);
		}

		// Fallback 2: Try direct GCS URL
		try {
			const directUrl = convertGcsUrlDirect(url);
			if (directUrl) {
				console.log("Trying direct GCS URL fallback:", directUrl);
				window.open(directUrl, "_blank");
				return;
			}
		} catch (directError) {
			console.error("Direct URL fallback failed:", directError);
		}

		// If all else fails, show an error message
		alert(
			`Failed to download file: ${
				filename || "Unknown file"
			}. Please contact support.`
		);
	}
}

/**
 * Validate media file before upload
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateMediaFile(
	file: File,
	maxSize: number = Infinity,
	allowedTypes: string[] = []
): { isValid: boolean; error?: string } {
	// Check if file exists and has content
	if (!file || file.size === 0) {
		return {
			isValid: false,
			error: "File appears to be empty or invalid",
		};
	}

	// Check file name
	if (!file.name || file.name.trim() === "") {
		return {
			isValid: false,
			error: "File name is required",
		};
	}

	// No size or type restrictions - allow all files
	return { isValid: true };
}

/**
 * Detect audio duration from URL
 * @param url - The audio URL
 * @returns Promise that resolves to duration in seconds
 */
export function detectDurationFromUrl(url: string): Promise<number> {
	return new Promise((resolve) => {
		const audio = new Audio();
		let resolved = false;

		const resolveOnce = (duration: number) => {
			if (!resolved) {
				resolved = true;
				resolve(duration);
			}
		};

		const timeout = setTimeout(() => {
			console.warn(`Duration detection from URL timeout: ${url}`);
			resolveOnce(0);
		}, 15000);

		audio.addEventListener("loadedmetadata", () => {
			if (
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				clearTimeout(timeout);
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Duration detected from URL: ${durationInSeconds} seconds`
				);
				resolveOnce(durationInSeconds);
			}
		});

		audio.addEventListener("error", (e) => {
			clearTimeout(timeout);
			console.error(`Error detecting duration from URL:`, e);
			resolveOnce(0);
		});

		audio.preload = "metadata";
		audio.src = convertGcsUrl(url);
		audio.load();
	});
}

/**
 * Alternative audio duration detection method
 * @param file - The audio file
 * @returns Promise that resolves to duration in seconds
 */
export function detectAudioDurationAlternative(file: File): Promise<number> {
	return new Promise((resolve) => {
		const audio = new Audio();
		const url = URL.createObjectURL(file);
		let resolved = false;

		const cleanup = () => {
			URL.revokeObjectURL(url);
		};

		const resolveOnce = (duration: number) => {
			if (!resolved) {
				resolved = true;
				cleanup();
				resolve(duration);
			}
		};

		// Try a different approach - wait for duration change
		let checkCount = 0;
		const checkDuration = () => {
			checkCount++;
			if (
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Alternative method detected duration: ${durationInSeconds} seconds`
				);
				resolveOnce(durationInSeconds);
			} else if (checkCount < 50) {
				// Try for 5 seconds (50 * 100ms)
				setTimeout(checkDuration, 100);
			} else {
				console.warn(
					`Alternative duration detection failed after ${checkCount} attempts`
				);
				resolveOnce(0);
			}
		};

		audio.addEventListener("loadstart", () => {
			setTimeout(checkDuration, 100);
		});

		audio.addEventListener("error", (e) => {
			console.error(`Alternative duration detection error:`, e);
			resolveOnce(0);
		});

		audio.preload = "auto";
		audio.src = url;
		audio.load();
	});
}

/**
 * Detect audio duration from file
 * @param file - The audio file
 * @returns Promise that resolves to duration in seconds
 */
export function detectAudioDuration(file: File): Promise<number> {
	return new Promise((resolve) => {
		const audio = new Audio();
		const url = URL.createObjectURL(file);
		let resolved = false;

		const cleanup = () => {
			URL.revokeObjectURL(url);
		};

		const resolveOnce = (duration: number) => {
			if (!resolved) {
				resolved = true;
				cleanup();
				resolve(duration);
			}
		};

		// Set a timeout to prevent hanging
		const timeout = setTimeout(() => {
			console.warn(`Primary duration detection timeout for ${file.name}`);
			resolveOnce(0);
		}, 15000); // 15 second timeout

		// Multiple event listeners for better compatibility
		audio.addEventListener("loadedmetadata", () => {
			if (
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				clearTimeout(timeout);
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Duration detected via loadedmetadata: ${durationInSeconds} seconds for ${file.name}`
				);
				resolveOnce(durationInSeconds);
			}
		});

		audio.addEventListener("durationchange", () => {
			if (
				!resolved &&
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				clearTimeout(timeout);
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Duration detected via durationchange: ${durationInSeconds} seconds for ${file.name}`
				);
				resolveOnce(durationInSeconds);
			}
		});

		audio.addEventListener("canplay", () => {
			if (
				!resolved &&
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				clearTimeout(timeout);
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Duration detected via canplay: ${durationInSeconds} seconds for ${file.name}`
				);
				resolveOnce(durationInSeconds);
			}
		});

		audio.addEventListener("canplaythrough", () => {
			if (
				!resolved &&
				audio.duration &&
				!isNaN(audio.duration) &&
				audio.duration > 0
			) {
				clearTimeout(timeout);
				const durationInSeconds = Math.round(audio.duration);
				console.log(
					`Duration detected via canplaythrough: ${durationInSeconds} seconds for ${file.name}`
				);
				resolveOnce(durationInSeconds);
			}
		});

		audio.addEventListener("error", (e) => {
			clearTimeout(timeout);
			console.error(
				`Primary duration detection error for ${file.name}:`,
				e
			);
			resolveOnce(0);
		});

		// Set preload and load the audio
		audio.preload = "metadata";
		audio.src = url;
		audio.load(); // Explicitly load the audio
	});
}
