const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const batchService = require('../services/batchService');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('../config/redis');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        pingInterval: 30000, // Heartbeat ping every 30 seconds
        pingTimeout: 10000   // Disconnect if no pong received within 10 seconds
    });

    // Setup Redis Pub/Sub Adapter for Horizontal Scalability (50+ concurrent users per room across nodes)
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            console.log('Socket.io Redis Adapter configured for scale');
        })
        .catch(err => {
            console.log('Redis PubSub not available. Running Socket.io in single-node Memory mode.');
        });

    // JWT Authentication middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`Authenticated client connected: ${socket.id}, User: ${socket.user.id}`);

        // Store user session in Redis with 1 Hour TTL (3600 seconds)
        try {
            await redisClient.setEx(`session:${socket.id}`, 3600, JSON.stringify({ userId: socket.user.id, connectedAt: Date.now() }));
        } catch (err) { console.error('Redis setsession error', err); }

        // Join a specific room
        socket.on('join-room', async (roomId) => {
            socket.join(roomId);
            console.log(`Client ${socket.id} joined room: ${roomId}`);

            // Update session with active room using TTL
            try {
                await redisClient.setEx(`room:${roomId}:${socket.id}`, 3600, socket.user.id);
            } catch (err) {}

            try {
                const room = await Room.findOne({ roomId });
                if (room) {
                    socket.emit('canvas-state', room.elements);
                }
            } catch (err) {
                console.error('Error fetching room state:', err);
            }

            socket.to(roomId).emit('user-joined', { userId: socket.id, user: socket.user.id });
        });

        // Handle drawing strokes quickly via batches
        socket.on('draw-stroke', async ({ roomId, strokeData }) => {
            socket.to(roomId).emit('draw-stroke', strokeData);
            batchService.queuePush(roomId, strokeData);
        });

        // Handle undo actions purely by isolating specific element deletions
        socket.on('undo-action', async ({ roomId, elementId }) => {
            socket.to(roomId).emit('undo-action', elementId);
            batchService.queuePull(roomId, elementId);
        });

        // Heartbeat mechanism tied to Redis TTL updates
        socket.on('ping', async () => {
            // Refresh session TTL explicitly per heartbeat ping
            try {
                await redisClient.expire(`session:${socket.id}`, 3600);
            } catch (err) {}
            socket.emit('pong');
        });

        socket.on('disconnect', async () => {
            try {
                await redisClient.del(`session:${socket.id}`);
            } catch (err) { }
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = initSocket;
