"use client";

import { useState } from "react";
import { Button } from "./button";
import { Play, Eye, AlertCircle, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { convertGcsUrl, downloadFile } from "@/lib/media-utils";

interface MediaFile {
	name: string;
	type: "image" | "video";
	url: string;
	file_path?: string;
	size?: number;
	uploadedAt?: string;
	contentType?: string;
}

interface VideoPlayerProps {
	file?: MediaFile;
	src?: string;
	onError?: (error: string) => void;
	className?: string;
}

interface ImageViewerProps {
	file?: MediaFile;
	src?: string;
	alt?: string;
	onError?: (error: string) => void;
	className?: string;
}

export function VideoPlayer({
	file,
	src,
	onError,
	className,
}: VideoPlayerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [hasError, setHasError] = useState(false);

	const videoUrl = convertGcsUrl(file?.url || src || "");
	const fileName = file?.name || "video";

	const handleVideoError = () => {
		setHasError(true);
		// Don't call onError to avoid showing toast messages
	};

	const handleDownload = async () => {
		if (file?.url || src) {
			await downloadFile(file?.url || src || "", file?.name || "video");
		}
	};

	if (!videoUrl) {
		return (
			<div
				className={`bg-muted rounded-lg flex items-center justify-center p-4 ${className}`}
			>
				<div className="text-center text-muted-foreground">
					<AlertCircle className="h-8 w-8 mx-auto mb-2" />
					<p className="text-xs">No video available</p>
				</div>
			</div>
		);
	}

	return hasError ? (
		<div
			className={`relative group cursor-pointer ${className}`}
			onClick={handleDownload}
		>
			<div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
				<div className="text-center">
					<Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						Download Video
					</p>
				</div>
			</div>
			<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
				<Download className="h-6 w-6 text-white" />
			</div>
		</div>
	) : (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className={`relative group cursor-pointer ${className}`}>
					<div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
						<div className="text-center">
							<Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
							<p className="text-xs text-muted-foreground">
								Video
							</p>
						</div>
					</div>
					<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
						<Play className="h-6 w-6 text-white" />
					</div>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-4xl">
				<div className="space-y-4">
					{hasError ? (
						<div className="text-center p-8">
							<AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
							<p className="text-lg font-medium mb-2">
								Cannot play video
							</p>
							<p className="text-muted-foreground mb-4">
								The video format may not be supported by your
								browser.
							</p>
							<Button onClick={handleDownload} variant="outline">
								<Download className="h-4 w-4 mr-2" />
								Download Video
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<video
								controls
								className="w-full max-h-[70vh]"
								onError={handleVideoError}
							>
								<source
									src={videoUrl}
									type={file?.contentType || "video/mp4"}
								/>
								Your browser does not support the video tag.
							</video>
							<div className="flex justify-center">
								<Button
									onClick={handleDownload}
									variant="outline"
									size="sm"
								>
									<Download className="h-4 w-4 mr-2" />
									Download Video
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function ImageViewer({
	file,
	src,
	alt,
	onError,
	className,
}: ImageViewerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [hasError, setHasError] = useState(false);

	const imageUrl = convertGcsUrl(file?.url || src || "");
	const imageName = file?.name || alt || "image";

	const handleImageError = () => {
		setHasError(true);
		// Don't call onError to avoid showing toast messages
	};

	const handleDownload = async () => {
		if (file?.url || src) {
			await downloadFile(file?.url || src || "", file?.name || "image");
		}
	};

	if (!imageUrl) {
		return (
			<div
				className={`bg-muted rounded-lg flex items-center justify-center p-4 ${className}`}
			>
				<div className="text-center text-muted-foreground">
					<AlertCircle className="h-8 w-8 mx-auto mb-2" />
					<p className="text-xs">No image available</p>
				</div>
			</div>
		);
	}

	return hasError ? (
		<div
			className={`relative group cursor-pointer ${className}`}
			onClick={handleDownload}
		>
			<div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
				<div className="text-center">
					<Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						Download Image
					</p>
				</div>
			</div>
			<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
				<Download className="h-6 w-6 text-white" />
			</div>
		</div>
	) : (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className={`relative group cursor-pointer ${className}`}>
					<img
						src={imageUrl}
						alt={imageName}
						className="w-full h-full object-cover rounded-lg"
						onError={handleImageError}
					/>
					<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
						<Eye className="h-6 w-6 text-white" />
					</div>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-4xl">
				<div className="space-y-4">
					{hasError ? (
						<div className="text-center p-8">
							<AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
							<p className="text-lg font-medium mb-2">
								Cannot display image
							</p>
							<p className="text-muted-foreground mb-4">
								The image format may not be supported or the
								file may be corrupted.
							</p>
							<Button onClick={handleDownload} variant="outline">
								<Download className="h-4 w-4 mr-2" />
								Download Image
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<img
								src={imageUrl}
								alt={imageName}
								className="w-full max-h-[80vh] object-contain"
								onError={handleImageError}
							/>
							<div className="flex justify-center">
								<Button
									onClick={handleDownload}
									variant="outline"
									size="sm"
								>
									<Download className="h-4 w-4 mr-2" />
									Download Image
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
