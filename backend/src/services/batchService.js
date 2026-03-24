const Room = require('../models/Room');

const roomBatches = {};

const flushRoomBatch = async (roomId) => {
    const batch = roomBatches[roomId];
    if (!batch || (batch.strokesToPush.length === 0 && batch.strokesToPull.length === 0)) {
        return;
    }

    const { strokesToPush, strokesToPull } = batch;

    // Reset the batch for this room
    roomBatches[roomId] = {
        strokesToPush: [],
        strokesToPull: [],
        timer: null,
        eventCount: 0
    };

    try {
        const bulkOps = [];

        if (strokesToPull.length > 0) {
            bulkOps.push({
                updateOne: {
                    filter: { roomId },
                    update: {
                        $pull: { elements: { id: { $in: strokesToPull } } },
                        $set: { lastUpdated: Date.now() }
                    }
                }
            });
        }

        if (strokesToPush.length > 0) {
            const pushIds = strokesToPush.map(s => s.id);

            // Upsert logic for arrays: first pull existing elements with these IDs to avoid duplicates
            bulkOps.push({
                updateOne: {
                    filter: { roomId },
                    update: {
                        $pull: { elements: { id: { $in: pushIds } } }
                    }
                }
            });

            // Then push the fresh latest states
            bulkOps.push({
                updateOne: {
                    filter: { roomId },
                    update: {
                        $push: { elements: { $each: strokesToPush } },
                        $set: { lastUpdated: Date.now() }
                    }
                }
            });
        }

        if (bulkOps.length > 0) {
            // Execute in strict order to ensure pulls happen before pushes
            await Room.bulkWrite(bulkOps, { ordered: true });
        }
    } catch (error) {
        console.error(`Error flushing batch for room ${roomId}:`, error);
    }
};

const queuePush = (roomId, strokeData) => {
    if (!roomBatches[roomId]) {
        roomBatches[roomId] = { strokesToPush: [], strokesToPull: [], timer: null, eventCount: 0 };
    }

    const batch = roomBatches[roomId];

    // Update in place if currently in push queue merging concurrently modified fields
    const existingIdx = batch.strokesToPush.findIndex(el => el.id === strokeData.id);
    if (existingIdx !== -1) {
        const existing = batch.strokesToPush[existingIdx];

        // Server-side Operational Transformation Merge
        let merged = { ...existing };
        for (const key in strokeData) {
            if (strokeData[key] !== existing[key]) {
                if (key === 'points' && strokeData.points && existing.points) {
                    merged.points = strokeData.points.length > existing.points.length ? strokeData.points : existing.points;
                } else {
                    merged[key] = strokeData[key];
                }
            }
        }
        batch.strokesToPush[existingIdx] = merged;
    } else {
        batch.strokesToPush.push(strokeData);
        batch.eventCount++;
    }
    checkFlush(roomId);
};

const queuePull = (roomId, elementId) => {
    if (!roomBatches[roomId]) {
        roomBatches[roomId] = { strokesToPush: [], strokesToPull: [], timer: null, eventCount: 0 };
    }

    const batch = roomBatches[roomId];

    // Canceling a recently pushed but not yet flushed stroke
    const pushIdx = batch.strokesToPush.findIndex(el => el.id === elementId);
    if (pushIdx !== -1) {
        batch.strokesToPush.splice(pushIdx, 1);
    } else {
        batch.strokesToPull.push(elementId);
        batch.eventCount++;
    }

    checkFlush(roomId);
};

const checkFlush = (roomId) => {
    const batch = roomBatches[roomId];
    if (!batch) return;

    if (batch.eventCount >= 100) {
        if (batch.timer) clearTimeout(batch.timer);
        flushRoomBatch(roomId);
    } else if (!batch.timer && batch.eventCount > 0) {
        batch.timer = setTimeout(() => {
            flushRoomBatch(roomId);
        }, 5000);
    }
};

module.exports = {
    queuePush,
    queuePull,
    flushRoomBatch
};
