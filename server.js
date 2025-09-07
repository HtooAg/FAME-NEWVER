const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Store connected users
const connectedUsers = new Map();

app.prepare()
	.then(() => {
		const httpServer = createServer(handler);

		const io = new Server(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			},
		});

		io.on("connection", (socket) => {
			console.log("User connected:", socket.id);

			// Handle user authentication
			socket.on("authenticate", (data) => {
				const { userId, role, eventId } = data;
				connectedUsers.set(socket.id, {
					userId,
					role,
					eventId,
					socketId: socket.id,
				});
				socket.join(`user_${userId}`);
				socket.join(`role_${role}`);

				// Join event-specific rooms for real-time updates
				if (eventId) {
					socket.join(`event_${eventId}`);
					socket.join(`event_${eventId}_${role}`);
				}

				// Special handling for super admins
				if (role === "super_admin") {
					console.log(
						`Super Admin ${userId} connected - will receive real-time notifications`
					);
				}

				console.log(
					`User ${userId} (${role}) authenticated and joined rooms for event ${eventId}`
				);
			});

			// Handle status updates for stage managers
			socket.on("status_update", (data) => {
				const { userId, status, message } = data;

				// Send notification to specific user
				io.to(`user_${userId}`).emit("account_status_changed", {
					status,
					message,
					timestamp: new Date().toISOString(),
				});

				console.log(`Status update sent to user ${userId}: ${status}`);
			});

			// Handle admin actions
			socket.on("admin_action", (data) => {
				const { targetUserId, action, message } = data;

				// Send notification to target user
				io.to(`user_${targetUserId}`).emit("admin_notification", {
					action,
					message,
					timestamp: new Date().toISOString(),
				});

				console.log(
					`Admin action sent to user ${targetUserId}: ${action}`
				);
			});

			// Handle emergency broadcasts
			socket.on("emergency-alert", (data) => {
				const { eventId, message, emergency_code } = data;
				console.log(
					`Emergency alert for event ${eventId}: ${emergency_code} - ${message}`
				);

				// Broadcast to all users connected to this event
				io.to(`event_${eventId}`).emit("emergency-alert", {
					message,
					emergency_code,
					timestamp: new Date().toISOString(),
				});
			});

			socket.on("emergency-clear", (data) => {
				const { eventId, broadcastId } = data;
				console.log(
					`Emergency cleared for event ${eventId}: ${broadcastId}`
				);

				// Broadcast to all users connected to this event
				io.to(`event_${eventId}`).emit("emergency-clear", {
					broadcastId,
					timestamp: new Date().toISOString(),
				});
			});

			// Handle artist status changes
			socket.on("artist_status_changed", (data) => {
				const { eventId, artistId, status, artist_name } = data;
				console.log(
					`Artist status changed for event ${eventId}: ${artist_name} -> ${status}`
				);

				// Broadcast to all users connected to this event
				io.to(`event_${eventId}`).emit("artist_status_changed", {
					eventId,
					artistId,
					status,
					artist_name,
					timestamp: new Date().toISOString(),
				});
			});

			// Handle live board updates
			socket.on("live-board-update", (data) => {
				const { eventId, itemId, status, itemType } = data;
				console.log(
					`Live board update for event ${eventId}: ${itemType} ${itemId} -> ${status}`
				);

				// Broadcast to all users connected to this event
				io.to(`event_${eventId}`).emit("live-board-update", {
					eventId,
					itemId,
					status,
					itemType,
					timestamp: new Date().toISOString(),
				});
			});

			// Handle performance order updates
			socket.on("performance-order-update", (data) => {
				const { eventId, type, action } = data;
				console.log(
					`Performance order update for event ${eventId}: ${type} ${action}`
				);

				// Broadcast to all users connected to this event
				io.to(`event_${eventId}`).emit("performance-order-update", {
					eventId,
					type,
					action,
					timestamp: new Date().toISOString(),
				});
			});

			// Handle user disconnect
			socket.on("disconnect", () => {
				const user = connectedUsers.get(socket.id);
				if (user) {
					console.log(`User ${user.userId} disconnected`);
					connectedUsers.delete(socket.id);
				}
			});
		});

		// Export io for use in API routes
		global.io = io;

		httpServer
			.once("error", (err) => {
				console.error("Server error:", err);
				process.exit(1);
			})
			.listen(port, hostname, () => {
				console.log(`> Ready on http://${hostname}:${port}`);
				console.log("> WebSocket server is running");
				console.log(`> Environment: ${process.env.NODE_ENV}`);
				console.log(`> Port: ${port}, Hostname: ${hostname}`);
			});
	})
	.catch((err) => {
		console.error("Failed to prepare Next.js app:", err);
		process.exit(1);
	});
