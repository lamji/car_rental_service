/**
 * Hold Countdown Manager
 * Manages 2-minute hold timers per userAgent.
 * On expiry, emits socket event to the userAgent room and auto-releases the booking.
 */

const Car = require("../models/car");
const { setJSON, getJSON } = require("./redis");
const { emitHoldExpired, emitHoldWarning } = require("./socket/holdExpiryEvents");
const { emitCarHoldUpdate } = require("./socket");
const { formatDate } = require("./logging");

const HOLD_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const WARNING_BEFORE_MS = 30 * 1000; // 30 seconds before expiry

// In-memory store: userAgent -> timer data
const activeHolds = new Map();

/**
 * Generates a unique room name from userAgent string
 * @param {string} userAgent - Browser user agent string
 * @returns {string} Hashed room name
 */
function getUserAgentRoom(userAgent) {
  // Simple hash to create a short, unique room name
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hold:${Math.abs(hash).toString(36)}`;
}

/**
 * Starts a 2-minute hold countdown for a booking
 * @param {Object} params
 * @param {string} params.userAgent - Client user agent
 * @param {string} params.carId - Car ID
 * @param {string} params.bookingId - Booking subdocument ID
 * @param {Object} params.bookingDetails - { startDate, endDate, startTime, endTime }
 */
function startHoldCountdown({ userAgent, carId, bookingId, bookingDetails }) {
  const room = getUserAgentRoom(userAgent);

  // Clear any existing hold for this userAgent
  clearHoldCountdown(userAgent);

  const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  // Warning timer (30s before expiry)
  const warningTimer = setTimeout(() => {
    emitHoldWarning(global.io, room, {
      carId,
      bookingId,
      bookingDetails,
      secondsRemaining: 30,
    });
    console.log(`[${formatDate()}] - HOLD WARNING sent to room: ${room}`);
  }, HOLD_DURATION_MS - WARNING_BEFORE_MS);

  // Expiry timer
  const expiryTimer = setTimeout(async () => {
    console.log(`[${formatDate()}] - HOLD EXPIRED for room: ${room}, bookingId: ${bookingId}`);

    // Emit expiry event to client
    emitHoldExpired(global.io, room, {
      carId,
      bookingId,
      bookingDetails,
    });

    // Auto-release the booking from DB
    await autoReleaseBooking(carId, bookingId);

    // Clean up
    activeHolds.delete(userAgent);
  }, HOLD_DURATION_MS);

  activeHolds.set(userAgent, {
    carId,
    bookingId,
    bookingDetails,
    room,
    warningTimer,
    expiryTimer,
    expiresAt,
  });

  console.log(`[${formatDate()}] - HOLD STARTED | Room: ${room} | Car: ${carId} | Booking: ${bookingId} | Expires: ${expiresAt.toISOString()}`);

  return { room, expiresAt: expiresAt.toISOString() };
}

/**
 * Clears an active hold countdown for a userAgent
 * @param {string} userAgent - Client user agent
 * @returns {boolean} Whether a hold was cleared
 */
function clearHoldCountdown(userAgent) {
  const hold = activeHolds.get(userAgent);
  if (!hold) return false;

  clearTimeout(hold.warningTimer);
  clearTimeout(hold.expiryTimer);
  activeHolds.delete(userAgent);

  console.log(`[${formatDate()}] - HOLD CLEARED for room: ${hold.room}`);
  return true;
}

/**
 * Gets the active hold for a userAgent
 * @param {string} userAgent
 * @returns {Object|null}
 */
function getActiveHold(userAgent) {
  return activeHolds.get(userAgent) || null;
}

/**
 * Auto-releases a booking from DB and Redis when hold expires
 * @param {string} carId
 * @param {string} bookingId
 */
async function autoReleaseBooking(carId, bookingId) {
  try {
    const updatedCar = await Car.findOneAndUpdate(
      {
        _id: carId,
        isActive: true,
        "availability.unavailableDates._id": bookingId,
      },
      {
        $pull: { "availability.unavailableDates": { _id: bookingId } },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updatedCar) {
      console.log(`[${formatDate()}] - AUTO-RELEASE: Booking ${bookingId} not found or already removed`);
      return;
    }

    // Update Redis cache
    await setJSON(`car:${carId}`, updatedCar, 300);

    // Clear main cars cache
    const { clearCache } = require("./redis");
    await clearCache("cars");

    // Emit car hold update to all clients
    emitCarHoldUpdate(
      global.io,
      updatedCar,
      "release",
      `Hold expired - auto-released booking ${bookingId}`
    );

    console.log(`[${formatDate()}] - AUTO-RELEASE: Booking ${bookingId} removed from car ${carId}`);
  } catch (error) {
    console.error(`[${formatDate()}] - AUTO-RELEASE ERROR:`, error);
  }
}

/**
 * Extends an active hold by restarting the 2-minute countdown.
 * Looks up the hold by room name (since the client only knows its room).
 * @param {string} room - The userAgent room name
 * @returns {{ room: string, expiresAt: string } | null}
 */
function extendHold(room) {
  // Find the hold entry by room
  for (const [userAgent, hold] of activeHolds.entries()) {
    if (hold.room === room) {
      console.log(`[${formatDate()}] - HOLD EXTENDED | Room: ${room} | Car: ${hold.carId} | Booking: ${hold.bookingId}`);
      return startHoldCountdown({
        userAgent,
        carId: hold.carId,
        bookingId: hold.bookingId,
        bookingDetails: hold.bookingDetails,
      });
    }
  }

  console.log(`[${formatDate()}] - HOLD EXTEND FAILED - no active hold for room: ${room}`);
  return null;
}

module.exports = {
  getUserAgentRoom,
  startHoldCountdown,
  clearHoldCountdown,
  getActiveHold,
  extendHold,
  autoReleaseBooking,
  HOLD_DURATION_MS,
};
