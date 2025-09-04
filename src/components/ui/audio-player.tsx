"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Play, Pause, Volume2, AlertCircle, Download } from "lucide-react";
import { convertGcsUrl, downloadFile, formatDuration } from "@/lib/media-utils";

interface AudioPlayerProps {
	track?: {
		song_title: string;
		duration: number;
		notes: string;
		is_main_track: boolean;
		tempo: string;
		file_url: string;
		file_path?: string;
	};
	src?: string;
	onError?: (error: string) => void;
}

export function AudioPlayer({ track, src, onError }: AudioPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const audioRef = useRef<HTMLAudioElement>(null);

	const audioUrl = convertGcsUrl(track?.file_url || src || "");
	const songTitle = track?.song_title || "Audio File";

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !audioUrl) return;

		setHasError(false);
		setIsLoading(true);

		const updateTime = () => setCurrentTime(audio.currentTime);
		const updateDuration = () => {
			setDuration(audio.duration);
			setIsLoading(false);
		};
		const handleEnd = () => setIsPlaying(false);
		const handleError = (e: Event) => {
			console.error("Audio error:", e);
			setHasError(true);
			setIsLoading(false);
			setIsPlaying(false);
			// Don't call onError to avoid showing toast messages
		};
		const handleCanPlay = () => {
			setIsLoading(false);
		};

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);
		audio.addEventListener("ended", handleEnd);
		audio.addEventListener("error", handleError);
		audio.addEventListener("canplay", handleCanPlay);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnd);
			audio.removeEventListener("error", handleError);
			audio.removeEventListener("canplay", handleCanPlay);
		};
	}, [audioUrl, onError]);

	const togglePlay = async () => {
		const audio = audioRef.current;
		if (!audio || hasError) return;

		try {
			if (isPlaying) {
				audio.pause();
				setIsPlaying(false);
			} else {
				await audio.play();
				setIsPlaying(true);
			}
		} catch (error) {
			console.error("Play error:", error);
			setHasError(true);
			// Don't call onError to avoid showing toast messages
		}
	};

	const handleDownload = async () => {
		if (track?.file_url || src) {
			await downloadFile(
				track?.file_url || src || "",
				track?.song_title || "audio"
			);
		}
	};

	if (!audioUrl) {
		return (
			<div className="bg-muted/50 rounded-lg p-3">
				<div className="flex items-center gap-2 text-muted-foreground">
					<AlertCircle className="h-4 w-4" />
					<span className="text-sm">No audio file available</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-muted/50 rounded-lg p-3 space-y-2">
			<audio ref={audioRef} src={audioUrl} preload="metadata" />

			<div className="flex items-center gap-3">
				{hasError ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleDownload}
						className="h-8 w-8 p-0"
						title="Download audio file"
					>
						<Download className="h-3 w-3" />
					</Button>
				) : (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={togglePlay}
						disabled={isLoading}
						className="h-8 w-8 p-0"
					>
						{isLoading ? (
							<div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
						) : isPlaying ? (
							<Pause className="h-3 w-3" />
						) : (
							<Play className="h-3 w-3" />
						)}
					</Button>
				)}

				<div className="flex-1">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium truncate">
							{songTitle}
						</span>
						<span className="text-muted-foreground">
							{formatDuration(currentTime)} /{" "}
							{formatDuration(duration || track?.duration || 0)}
						</span>
					</div>

					<div className="w-full bg-muted rounded-full h-1 mt-1">
						<div
							className="bg-primary h-1 rounded-full transition-all"
							style={{
								width: `${
									duration
										? (currentTime / duration) * 100
										: 0
								}%`,
							}}
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{!hasError && (
						<Volume2 className="h-4 w-4 text-muted-foreground" />
					)}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleDownload}
						className="h-6 w-6 p-0"
						title="Download audio file"
					>
						<Download className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{track?.notes && (
				<p className="text-xs text-muted-foreground">{track.notes}</p>
			)}
		</div>
	);
}
