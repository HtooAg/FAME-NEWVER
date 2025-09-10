// WebSocket-Only Manager with Toast Notifications
// This utility provides real-time updates via WebSocket only - no polling fallback

interface WebSocketManagerOptions {
	eventId: string;
	role: string;
	userId?: string;
	showToasts?: boolean;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onDataUpdate?: () => void;
}

interface WebSocketEvents {
	[key: string]: (data: any) => void;
}

export class WebSocketManager {
	private socket: any = null;
	private eventId: string;
	private role: string;
	private userId: string;
	private isConnected = false;
	private options: WebSocketManagerOptions;
	private eventHandlers: WebSocketEvents = {};
	// Polling properties removed - WebSocket-only mode

	constructor(options: WebSocketManagerOptions) {
		this.options = options;
		this.eventId = options.eventId;
		this.role = options.role;
		this.userId = options.userId || `${options.role}_${options.eventId}`;
		// Polling interval removed - WebSocket-only mode
	}

	async initialize(): Promise<void> {
		try {
			await this.loadSocketIO();
			this.setupWebSocket();
			console.log(
				`WebSocket-only mode initialized for ${this.role} - No polling`
			);
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
			console.log(
				`WebSocket connection failed for ${this.role} - No fallback polling`
			);
		}
	}

	private loadSocketIO(): Promise<void> {
		return new Promise((resolve, reject) => {
			// Check if Socket.IO is already loaded
			if (typeof (window as any).io !== "undefined") {
				resolve();
				return;
			}

			const script = document.createElement("script");
			script.src = "/socket.io/socket.io.js";
			script.onload = () => resolve();
			script.onerror = () =>
				reject(new Error("Failed to load Socket.IO"));
			document.head.appendChild(script);
		});
	}

	private setupWebSocket(): void {
		try {
			// @ts-ignore
			this.socket = io();

			this.socket.on("connect", () => {
				console.log(`WebSocket connected for ${this.role}`);
				this.isConnected = true;
				this.resetReconnectAttempts();

				// Authenticate
				this.socket.emit("authenticate", {
					userId: this.userId,
					role: this.role,
					eventId: this.eventId,
				});

				this.options.onConnect?.();
				this.showToast("Connected", "Real-time updates active");
			});

			this.socket.on("disconnect", (reason: string) => {
				console.log(`WebSocket disconnected for ${this.role}:`, reason);
				this.isConnected = false;
				this.options.onDisconnect?.();

				// Don't show toast for intentional disconnects
				if (reason !== "io client disconnect") {
					this.showToast(
						"Disconnected",
						"Real-time updates unavailable",
						"destructive"
					);
				}
			});

			this.socket.on("connect_error", (error: any) => {
				console.error(
					`WebSocket connection error for ${this.role}:`,
					error
				);
				this.isConnected = false;
				this.handleConnectionError(error);
			});

			this.socket.on("error", (error: any) => {
				console.error(`WebSocket error for ${this.role}:`, error);
				this.handleConnectionError(error);
			});

			// Set up common event listeners
			this.setupCommonEventListeners();
		} catch (error) {
			console.error("WebSocket setup failed:", error);
			this.isConnected = false;
			this.handleConnectionError(error);
		}
	}

	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;

	private handleConnectionError(error: any): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			const delay = Math.min(
				1000 * Math.pow(2, this.reconnectAttempts - 1),
				30000
			);

			console.log(
				`WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
			);

			setTimeout(() => {
				if (!this.isConnected) {
					this.setupWebSocket();
				}
			}, delay);
		} else {
			console.error("Max WebSocket reconnection attempts reached");
			this.showToast(
				"Connection Failed",
				"Real-time updates unavailable",
				"destructive"
			);
		}
	}

	private resetReconnectAttempts(): void {
		this.reconnectAttempts = 0;
	}

	private setupCommonEventListeners(): void {
		if (!this.socket) return;

		// Artist-related events
		this.socket.on("artist_registered", (data: any) => {
			console.log("Artist registered:", data);
			if (data.eventId === this.eventId) {
				this.showToast(
					"New Artist",
					`${data.artist_name || "An artist"} has registered`
				);
				this.triggerDataUpdate();
			}
		});

		this.socket.on("artist_assigned", (data: any) => {
			console.log("Artist assigned:", data);
			if (data.eventId === this.eventId) {
				this.showToast(
					"Artist Assigned",
					`Artist assigned to performance date`
				);
				this.triggerDataUpdate();
			}
		});

		this.socket.on("artist_status_changed", (data: any) => {
			console.log("Artist status changed:", data);
			if (data.eventId === this.eventId) {
				const statusMap: { [key: string]: string } = {
					not_started: "Not Started",
					currently_on_stage: "Currently On Stage",
					next_on_stage: "Next On Stage",
					next_on_deck: "Next On Deck",
					completed: "Completed",
				};
				const statusText = statusMap[data.status] || data.status;
				this.showToast(
					"Status Updated",
					`${data.artist_name || "Artist"} is now ${statusText}`
				);
				this.triggerDataUpdate();
			}
		});

		this.socket.on("artist_quality_rating_updated", (data: any) => {
			console.log("Artist quality rating updated:", data);
			if (data.eventId === this.eventId) {
				const stars = "★".repeat(data.quality_rating || 0);
				this.showToast(
					"Quality Rating Updated",
					`${data.artist_name || "Artist"} rated ${stars} (${
						data.quality_rating
					}/5)`
				);
				this.triggerDataUpdate();
			}
		});

		this.socket.on("artist_deleted", (data: any) => {
			console.log("Artist deleted:", data);
			if (data.eventId === this.eventId) {
				this.showToast(
					"Artist Removed",
					"An artist has been removed from the event"
				);
				this.triggerDataUpdate();
			}
		});

		// Rehearsal events
		this.socket.on("rehearsal_updated", (data: any) => {
			console.log("Rehearsal updated:", data);
			if (data.eventId === this.eventId) {
				const actionMap: { [key: string]: string } = {
					scheduled: "scheduled for rehearsal",
					completed: "completed rehearsal",
					removed: "removed from rehearsal",
				};
				const actionText = actionMap[data.action] || data.action;
				this.showToast("Rehearsal Updated", `Artist ${actionText}`);
				this.triggerDataUpdate();
			}
		});

		// Performance order events
		this.socket.on("performance-order-update", (data: any) => {
			console.log("Performance order updated:", data);
			if (data.eventId === this.eventId) {
				this.showToast(
					"Performance Order",
					"Show order has been updated"
				);
				this.triggerDataUpdate();
			}
		});

		// Cue events
		this.socket.on("cue_updated", (data: any) => {
			console.log("Cue updated:", data);
			if (data.eventId === this.eventId) {
				const actionMap: { [key: string]: string } = {
					created: "added",
					updated: "updated",
					deleted: "removed",
					status_updated: "status changed",
				};
				const actionText = actionMap[data.action] || data.action;
				this.showToast("Cue Updated", `Custom cue ${actionText}`);
				this.triggerDataUpdate();
			}
		});

		// Live board events
		this.socket.on("live-board-update", (data: any) => {
			console.log("Live board updated:", data);
			if (data.eventId === this.eventId) {
				this.showToast("Live Board", "Performance status updated");
				this.triggerDataUpdate();
			}
		});

		// Emergency events
		this.socket.on("emergency-alert", (data: any) => {
			console.log("Emergency alert:", data);
			this.showToast("EMERGENCY ALERT", data.message, "destructive");
			this.triggerDataUpdate();
		});

		this.socket.on("emergency-clear", (data: any) => {
			console.log("Emergency cleared:", data);
			this.showToast(
				"Emergency Cleared",
				"Emergency alert has been deactivated"
			);
			this.triggerDataUpdate();
		});
	}

	// Polling functionality removed - WebSocket-only mode

	// Visibility handling removed - WebSocket-only mode

	private debounceTimer: NodeJS.Timeout | null = null;

	private triggerDataUpdate(): void {
		// Reduced debounce for more responsive updates
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			console.log(`Triggering data update for ${this.role}`);
			this.options.onDataUpdate?.();
			this.debounceTimer = null;
		}, 50); // Reduced to 50ms for faster response
	}

	private showToast(
		title: string,
		description: string,
		variant: "default" | "destructive" = "default"
	): void {
		if (!this.options.showToasts) return;

		// Try to use toast if available
		try {
			const toastEvent = new CustomEvent("websocket-toast", {
				detail: { title, description, variant },
			});
			window.dispatchEvent(toastEvent);
		} catch (error) {
			console.log(`${title}: ${description}`);
		}
	}

	// Emit events to server
	emit(event: string, data: any): void {
		if (this.socket && this.isConnected) {
			this.socket.emit(event, data);
			console.log(`Emitted ${event}:`, data);
		} else {
			console.warn(`Cannot emit ${event}: WebSocket not connected`);
		}
	}

	// Add custom event listener
	on(event: string, handler: (data: any) => void): void {
		this.eventHandlers[event] = handler;
		if (this.socket) {
			this.socket.on(event, handler);
		}
	}

	// Remove event listener
	off(event: string): void {
		if (this.eventHandlers[event]) {
			delete this.eventHandlers[event];
		}
		if (this.socket) {
			this.socket.off(event);
		}
	}

	// Check connection status
	isWebSocketConnected(): boolean {
		return this.isConnected;
	}

	// Cleanup
	destroy(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}

		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}

		this.isConnected = false;
		console.log(
			`WebSocket manager destroyed for ${this.role} - WebSocket-only mode`
		);
	}
}

// Utility function to create WebSocket manager
export function createWebSocketManager(
	options: WebSocketManagerOptions
): WebSocketManager {
	return new WebSocketManager(options);
}
