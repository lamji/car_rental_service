/**
 * Socket.io Connection Handlers
 * Manages socket.io connections and events
 */

const { formatDate } = require('./logging');
const { extendHold } = require('./holdCountdown');

/**
 * Sets up socket.io connection handlers
 * @param {Object} io - Socket.io instance
 */
function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`\n[${formatDate()}] - SOCKET.IO CLIENT CONNECTED | Socket ID: ${socket.id}`);

    socket.on("join", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[${formatDate()}] - SOCKET.IO ROOM JOINED | User: ${userId} | Socket: ${socket.id} | Room: user:${userId}`);
    });

    socket.on("joinRoom", (roomName) => {
      socket.join(roomName);
      console.log(`[${formatDate()}] - SOCKET.IO ROOM JOINED | Socket: ${socket.id} | Room: ${roomName}`);
    });

    socket.on("extend_hold", (data) => {
      const { room } = data || {};
      console.log(`[${formatDate()}] - EXTEND HOLD REQUEST | Socket: ${socket.id} | Room: ${room}`);
      const result = extendHold(room);
      // Acknowledge back to the client
      socket.emit("hold_extended", {
        success: !!result,
        expiresAt: result?.expiresAt || null,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`\n[${formatDate()}] - SOCKET.IO CLIENT DISCONNECTED | Socket ID: ${socket.id} | Reason: ${reason}`);
    });
  });
}

module.exports = { setupSocketHandlers };
